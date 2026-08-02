/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import { db } from './firebase';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import jwt from 'jsonwebtoken';
import { UserProfile, WalletTransaction, GameRoom, LudoPlayer, LudoToken, PlayerColor, ChatMessage, GameLog } from './src/types/game.ts';

// ==========================================
// 2. REAL-TIME EVENT STREAM (SSE)
// ==========================================
interface SSEClient {
  userId: string;
  res: any;
}

let activeClients: SSEClient[] = [];

// Send update to specific user
function sendEventToUser(userId: string, eventName: string, data: any) {
  const clients = activeClients.filter(c => c.userId === userId);
  clients.forEach(client => {
    try {
      client.res.write(`event: ${eventName}
data: ${JSON.stringify(data)}

`);
      if (typeof client.res.flush === 'function') {
        client.res.flush();
      }
    } catch (e) {
      console.error(`Error sending SSE event to user ${userId}. Closing connection.`, e);
      client.res.end();
    }
  });
}

// Send update to all active connected SSE clients globally
function broadcastToAll(eventName: string, data: any) {
  const payload = `event: ${eventName}
data: ${JSON.stringify(data)}

`;
  activeClients.forEach(client => {
    try {
      client.res.write(payload);
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
    } catch (e) {
      console.error(`Error broadcasting SSE event. Closing connection for client ${client.userId}.`, e);
      client.res.end();
    }
  });
}

// Send update to all players in a room
function broadcastToRoom(roomId: string, eventName: string, data: any) {
  const room = store.rooms[roomId];
  if (!room) return;
  room.players.forEach(p => {
    sendEventToUser(p.userId, eventName, data);
  });
}

// Global user update broadcast (for dashboard balance/profile syncing)
async function broadcastUserUpdate(userId: string) {
  if (!db) return;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      sendEventToUser(userId, 'user_update', userDoc.data());
    }
  } catch (error) {
    console.error("Error broadcasting user update:", error);
  }
}

// Remove disconnected client
async function removeSSEClient(res: any) {
  const client = activeClients.find(c => c.res === res);
  activeClients = activeClients.filter(c => c.res !== res);
  if (client) {
    const stillConnected = activeClients.some(c => c.userId === client.userId);
    if (!stillConnected && db) {
      try {
        const roomsQuery = await db.collection('rooms')
          .where('status', '==', 'playing')
          .where('players', 'array-contains', { userId: client.userId, status: 'online' })
          .get();

        for (const doc of roomsQuery.docs) {
          const room = doc.data() as GameRoom;
          const player = room.players.find(p => p.userId === client.userId);
          if (player) {
            player.status = 'offline';
            addLog(room, `🔌 ${player.username} has disconnected. They have time to reconnect before being forfeited.`);
            await doc.ref.set(room);
            broadcastToRoom(room.id, 'game_update', room);
          }
        }
      } catch (e) {
        console.error("Error updating player status on disconnect:", e);
      }

      // Clean up from matchmaking queues (still in-memory for now)
      let changed = false;
      for (const qKey of Object.keys(store.matchmakingQueues)) {
        const lenBefore = store.matchmakingQueues[qKey].length;
        store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== client.userId);
        if (store.matchmakingQueues[qKey].length !== lenBefore) changed = true;
      }
      if (changed) {
        // Here we would also update the matchmaking state in Firestore
      }
    }
    broadcastToAll('online_players_updated', {});
  }
}


// Clean up stale users from matchmaking queues
function cleanupMatchmakingQueues() {
  let changed = false;
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    const beforeLen = store.matchmakingQueues[qKey].length;
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(userId => {
      if (!store.users[userId]) return false;
      const inGame = Object.values(store.rooms).some(r =>
        r.status === 'playing' && r.players.some(p => p.userId === userId && p.status !== 'left')
      );
      if (inGame) return false;
      return true;
    });
    if (store.matchmakingQueues[qKey].length !== beforeLen) {
      changed = true;
    }
  }
  if (changed) {
    // saveStore();
  }
}

// ==========================================
// 3. LUDO GAME PATH & RECONCILIATION HELPERS
// ==========================================
const START_OFFSETS: Record<PlayerColor, number> = {
  green: 0,
  yellow: 13,
  blue: 26,
  red: 39
};

const SAFE_GLOBAL_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// Translate a player's relative position to global coordinate on common track
function getGlobalPosition(color: PlayerColor, relativePos: number): number | null {
  if (relativePos < 0 || relativePos > 50) return null; // home base or home stretch
  const offset = START_OFFSETS[color];
  return (offset + relativePos) % 52;
}

// Generate the initial tokens for a player color
function createInitialTokens(userId: string, color: PlayerColor): LudoToken[] {
  return [0, 1, 2, 3].map(i => ({
    id: `token_${color}_${i}`,
    ownerId: userId,
    color,
    position: -1 // Home Base
  }));
}

// Check if a move is possible for a token
function isMoveValid(token: LudoToken, roll: number): boolean {
  if (token.position === 56) return false; // Finished
  if (token.position === -1) {
    return roll === 6; // Releases from home base on rolling 6
  }
  return token.position + roll <= 56; // Cannot overshoot finished goal
}

// Auto-advance turn to next player
function advanceTurn(room: GameRoom) {
  const gs = room.gameState;
  const oldTurn = gs.turn;
  const numPlayers = room.players.length;

  // Reset inactivity timer for the new player's turn
  const newPlayer = room.players[gs.turn];
  if (newPlayer) newPlayer.inactivityTimer = 300; // Reset to 5 minutes (300s)
  
  // Clean dice roll states
  gs.diceRoll = null;
  gs.hasRolled = false;
  gs.turnTimer = 30;
  
  // Find next active player
  let found = false;
  let nextTurn = oldTurn;
  for (let i = 1; i <= numPlayers; i++) {
    const checkIdx = (oldTurn + i) % numPlayers;
    const p = room.players[checkIdx];
    if (p && p.status !== 'left') {
      nextTurn = checkIdx;
      found = true;
      break;
    }
  }

  if (found) {
    gs.turn = nextTurn;
    const nextPlayer = room.players[nextTurn];
    addLog(room, `It is now ${nextPlayer.username}'s turn. Please roll the dice!`);
  }
}

// Add a transaction helper
async function addTransaction(userId: string, type: WalletTransaction['type'], amount: number, matchId?: string, description = '') {
  if (!db) {
    console.error("Database connection is not available. Cannot add transaction.");
    // Fallback to in-memory store for now, but this needs to be fixed.
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type,
      amount,
      timestamp: Date.now(),
      matchId,
      description
    };
    store.transactions.unshift(tx);
    return tx;
  }

  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    type,
    amount,
    timestamp: Date.now(),
    matchId,
    description
  };

  try {
    await db.collection('transactions').add(tx);
    // For now, also add to local store for compatibility with other in-memory functions
    store.transactions.unshift(tx);
    return tx;
  } catch (error) {
    console.error("Error adding transaction to Firestore:", error);
    // Fallback to in-memory store in case of Firestore error
    store.transactions.unshift(tx);
    return tx;
  }
}

// Add a log to the room
function addLog(room: GameRoom, text: string) {
  const log: GameLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    text
  };
  room.gameState.logs.push(log);
  if (room.gameState.logs.length > 50) {
    room.gameState.logs.shift();
  }
}

// Helper to detect if player is an AI bot player
function isBotPlayer(userId: string): boolean {
  return userId.startsWith('bot_') || userId.startsWith('user_sim_');
}

// Trigger game auto-play bot actions
async function executeBotTurnIfActive(room: GameRoom) {
  const activePlayer = room.players[room.gameState.turn];
  if (!activePlayer || !isBotPlayer(activePlayer.userId)) return;

  // Bot logic
  setTimeout(async () => {
    // If bot has not rolled, roll the dice
    if (!room.gameState.hasRolled) {
      const d = Math.floor(Math.random() * 6) + 1;
      room.gameState.diceRoll = d;
      room.gameState.hasRolled = true;
      addLog(room, `🤖 Bot ${activePlayer.username} rolled a ${d}!`);

      // Determine valid moves for bot
      const playerTokens = room.gameState.tokens.filter(t => t.color === activePlayer.color);
      const validTokens = playerTokens.filter(t => isMoveValid(t, d));

      if (validTokens.length === 0) {
        // No moves possible, pass turn
        addLog(room, `🤖 Bot ${activePlayer.username} has no valid moves.`);
        setTimeout(async () => {
          advanceTurn(room);
          broadcastToRoom(room.id, 'game_update', room);
          await executeBotTurnIfActive(room);
        }, 500);
      } else {
        // Prioritize moves:
        // 1. Cut opponent
        // 2. Move out of base (if d == 6 and base has tokens)
        // 3. Move token closest to finishing
        // 4. Fallback: random valid move
        let selectedToken = validTokens[0];

        // Check if we can cut anyone
        for (const token of validTokens) {
          const nextRelative = token.position === -1 ? 0 : token.position + d;
          const globalPos = getGlobalPosition(token.color, nextRelative);
          if (globalPos !== null && !SAFE_GLOBAL_SQUARES.includes(globalPos)) {
            const hasOpponent = room.gameState.tokens.some(t => {
              if (t.color === token.color || t.position < 0 || t.position > 50) return false;
              const opGlobal = getGlobalPosition(t.color, t.position);
              return opGlobal === globalPos;
            });
            if (hasOpponent) {
              selectedToken = token;
              break;
            }
          }
        }

        // If no cut, check if we can release token from base
        if (selectedToken === validTokens[0] && d === 6) {
          const baseToken = validTokens.find(t => t.position === -1);
          if (baseToken) selectedToken = baseToken;
        }

        // Apply movement
        setTimeout(async () => {
          await moveTokenLogic(room, selectedToken.id, d);
          broadcastToRoom(room.id, 'game_update', room);
          await executeBotTurnIfActive(room);
        }, 500);
      }
    }
  }, 400);
}

// Core token movement logic
async function moveTokenLogic(room: GameRoom, tokenId: string, diceValue: number) {
  const gs = room.gameState;
  const token = gs.tokens.find(t => t.id === tokenId);
  if (!token) return;

  const activePlayer = room.players[gs.turn];
  const oldPos = token.position;

  if (token.position === -1 && diceValue === 6) {
    token.position = 0;
    addLog(room, `${activePlayer.username} moved token out of base onto start!`);
  } else {
    token.position += diceValue;
    addLog(room, `${activePlayer.username} moved token by ${diceValue} spaces (from ${oldPos} to ${token.position}).`);
  }

  // Check cutting mechanism
  let bonusTurn = diceValue === 6; // Rolling 6 grants bonus turn
  const finalGlobal = getGlobalPosition(token.color, token.position);

  if (finalGlobal !== null && !SAFE_GLOBAL_SQUARES.includes(finalGlobal)) {
    // Check if opponent is here
    const opponentsAtSquare = gs.tokens.filter(t => {
      if (t.color === token.color) return false; // same color
      
      // In Partnership/Team mode, allied partners do not capture each other
      if (room.gameMode === 'team') {
        const isAlly = (token.color === 'red' && t.color === 'yellow') ||
                       (token.color === 'yellow' && t.color === 'red') ||
                       (token.color === 'green' && t.color === 'blue') ||
                       (token.color === 'blue' && t.color === 'green');
        if (isAlly) return false;
      }

      if (t.position < 0 || t.position > 50) return false; // base or stretch
      const otherGlobal = getGlobalPosition(t.color, t.position);
      return otherGlobal === finalGlobal;
    });

    if (opponentsAtSquare.length > 0) {
      opponentsAtSquare.forEach(opToken => {
        opToken.position = -1; // Send back to base
        const opUser = store.users[opToken.ownerId] || { username: 'Opponent' };
        addLog(room, `💥 CUT! ${activePlayer.username} cut ${opUser.username}'s token back to base!`);
      });
      bonusTurn = true; // Cutting grants bonus turn
    }
  }

  // Check if player has finished this token
  if (token.position === 56) {
    addLog(room, `🎉 Token finished! ${activePlayer.username} has safely brought a token home!`);
    bonusTurn = true; // Completing token grants bonus turn
  }

  // Check if active player won
  const playerTokens = gs.tokens.filter(t => t.color === token.color);
  const allFinished = playerTokens.every(t => t.position === 56);

  if (allFinished) {
    // WINNER DETECTED!
    room.status = 'completed';
    gs.winnerId = activePlayer.userId;

    if (room.gameMode === 'team') {
      const isRedYellow = token.color === 'red' || token.color === 'yellow';
      const winningColors = isRedYellow ? ['red', 'yellow'] : ['green', 'blue'];
      const winningTeammates = room.players.filter(p => winningColors.includes(p.color));
      const winningNames = winningTeammates.map(p => p.username).join(' & ');
      
      addLog(room, `🏆 CHAMPIONS! Team ${winningNames} has finished all tokens and WON the game!`);

      if (room.betAmount > 0) {
        const share = gs.escrowBalance / 2;
        for (const p of winningTeammates) {
          if (!isBotPlayer(p.userId)) {
            const userRef = db.collection('users').doc(p.userId);
            const userDoc = await userRef.get();
            if(userDoc.exists) {
              await userRef.update({ 
                balance: userDoc.data().balance + share,
                winCount: (userDoc.data().winCount || 0) + 1 
              });
              await addTransaction(p.userId, 'win_payout', share, room.id, `Team Win payout for match ${room.id}.`);
              broadcastUserUpdate(p.userId);
            }
          }
        }

        // Record losses for other real players
        for (const p of room.players) {
          if (!winningColors.includes(p.color) && !isBotPlayer(p.userId)) {
            const userRef = db.collection('users').doc(p.userId);
            await userRef.update({ lossCount: (store.users[p.userId]?.lossCount || 0) + 1 });
            broadcastUserUpdate(p.userId);
          }
        }
      }
    } else {
      addLog(room, `🏆 CHAMPION! ${activePlayer.username} has finished all 4 tokens and WON the game!`);

      // Escrow payout
      if (room.betAmount > 0) {
        const userRef = db.collection('users').doc(activePlayer.userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          await userRef.update({
             balance: userDoc.data().balance + gs.escrowBalance,
             winCount: (userDoc.data().winCount || 0) + 1
          });
          await addTransaction(
            activePlayer.userId,
            'win_payout',
            gs.escrowBalance,
            room.id,
            `Payout for winning match ${room.id} with $${room.betAmount} bet.`
          );
          broadcastUserUpdate(activePlayer.userId);
        }

        // Record losses for other real players
        for (const p of room.players) {
          if (p.userId !== activePlayer.userId && !isBotPlayer(p.userId)) {
            const userRef = db.collection('users').doc(p.userId);
            await userRef.update({ lossCount: (store.users[p.userId]?.lossCount || 0) + 1 });
            broadcastUserUpdate(p.userId);
          }
        }
      }
    }
    gs.escrowBalance = 0;
  } else {
    // Reset roll and determine next turn
    gs.diceRoll = null;
    gs.hasRolled = false;
    
    if (bonusTurn) {
      addLog(room, `🎲 Bonus roll! ${activePlayer.username} gets to roll again.`);
      gs.turnTimer = 30;
    } else {
      advanceTurn(room);
    }
  }
}

// Helper to handle inactivity forfeit
async function handleInactivityForfeit(room: GameRoom, inactivePlayer: LudoPlayer) {
  if (room.status !== 'playing') return;

  addLog(room, `⏱️ ${inactivePlayer.username} has been forfeited due to inactivity.`);
  inactivePlayer.status = 'left';

  // Check if only 1 active player remains
  const activePlayers = room.players.filter(pl => pl.status !== 'left');
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    room.status = 'completed';
    room.gameState.winnerId = winner.userId;

    const totalPayout = room.gameState.escrowBalance;
    addLog(room, `🏆 Game Over! ${winner.username} wins by forfeit and takes the pot of $${totalPayout.toFixed(2)}!`);

    if (room.betAmount > 0 && totalPayout > 0 && !isBotPlayer(winner.userId)) {
      const userRef = db.collection('users').doc(winner.userId);
      const userDoc = await userRef.get();
      if(userDoc.exists) {
        await userRef.update({
          balance: userDoc.data().balance + totalPayout,
          winCount: (userDoc.data().winCount || 0) + 1
        });
        await addTransaction(winner.userId, 'win_payout', totalPayout, room.id, `Win by opponent inactivity forfeit.`);
        broadcastUserUpdate(winner.userId);
      }
    }
    room.gameState.escrowBalance = 0;
  }

  broadcastToRoom(room.id, 'game_update', room);
}

// Initialize continuous turn timers thread (1s interval)
setInterval(async () => {
  let changed = false;
  for (const roomId of Object.keys(store.rooms)) {
    const room = store.rooms[roomId];
    if (room.status === 'playing') {
      const gs = room.gameState;
      const activePlayer = room.players[gs.turn];

      // New Inactivity Timer Logic (5 minutes)
      if (activePlayer && activePlayer.inactivityTimer && !isBotPlayer(activePlayer.userId)) {
        activePlayer.inactivityTimer -= 1;
        changed = true;

        // Send warning every minute (60 seconds)
        if (activePlayer.inactivityTimer > 0 && activePlayer.inactivityTimer % 60 === 0) {
          const minutesLeft = activePlayer.inactivityTimer / 60;
          const warningMsg = `Waqtigaagu wuu sii dhamaanayaa! Waxaa kuu harsan ${minutesLeft} daqiiqo. (Your time is running out! ${minutesLeft} minutes left.)`;
          sendEventToUser(activePlayer.userId, 'inactivity_warning', { message: warningMsg });
          addLog(room, `⏱️ Digniin: ${activePlayer.username} waxaa u harsan ${minutesLeft} daqiiqo. (Warning: ${activePlayer.username} has ${minutesLeft} minutes left.)`);
        }

        // Forfeit if 5 minutes are up
        if (activePlayer.inactivityTimer <= 0) {
          await handleInactivityForfeit(room, activePlayer);
          // Skip the rest of the turn logic for this room
          continue; 
        }
      }


      // Short Turn Timer Logic (30 seconds)
      if (gs.turnTimer > 0) {
        gs.turnTimer -= 1;
        changed = true;

        if (gs.turnTimer === 0) {
          // 30-second turn timer is up.
          // The 5-minute inactivity timer is already running.
          // We no longer auto-play for the user. We just let the inactivity timer handle the penalty.
          addLog(room, `⏱️ Waqtiga 30-ka ilbiriqsi wuu dhamaaday ${activePlayer.username}. Ganaaxa daahitaanka ayaa bilaabanaya.`);
          broadcastToRoom(room.id, 'game_update', room);
          // No auto-play, just wait for the 5-min timer to forfeit.
        }
      }
    }
  }

  if (changed) {
    // Notify clients about updated timers
    Object.keys(store.rooms).forEach(roomId => {
      const room = store.rooms[roomId];
      if (room.status === 'playing') {
        broadcastToRoom(roomId, 'timer_tick', { 
          turn: room.gameState.turn, 
          turnTimer: room.gameState.turnTimer,
          inactivityTimer: room.players[room.gameState.turn]?.inactivityTimer
        });
      }
    });
  }
}, 1000);

// Heartbeat interval to prevent proxy disconnects by keeping SSE stream active
setInterval(() => {
  activeClients.forEach(client => {
    try {
      client.res.write(`: heartbeat

`);
      if (typeof client.res.flush === 'function') {
        client.res.flush();
      }
    } catch (e) {
      console.error(`Error sending heartbeat. Closing connection for client ${client.userId}.`, e);
      client.res.end();
    }
  });
}, 10000);

// Matchmaking automatic bot auto-fill (PUBG style)
setInterval(async () => {
  cleanupMatchmakingQueues();

  for (const queueKey of Object.keys(store.matchmakingQueues)) {
    const queueUserIds = store.matchmakingQueues[queueKey];
    if (!queueUserIds || queueUserIds.length === 0) continue;

    // Get bet, cap, mode from queueKey (e.g., "1_2_solo" -> bet: 1, cap: 2, mode: "solo")
    const parts = queueKey.split('_');
    const bet = parseFloat(parts[0]) || 0;
    const cap = parseInt(parts[1]) || 2;
    const mode = (parts[2] === 'team' ? 'team' : 'solo') as 'solo' | 'team';

    // Find the first user in the queue
    const firstUserId = queueUserIds[0];
    const firstUser = store.users[firstUserId];
    if (!firstUser) continue;

    const joinedAt = (firstUser as any).seekingJoinedAt || Date.now();
    const waitTimeMs = Date.now() - joinedAt;

    // If wait time exceeds 7 minutes (420000 ms), auto-fill the remaining seats with bots!
    if (waitTimeMs >= 420000) {
      console.log(`Matchmaking timeout for queue ${queueKey}. Auto-filling remaining seats with bots...`);

      // Retrieve all real players currently in this queue
      const realPlayers = queueUserIds.map(id => store.users[id]).filter(Boolean);

      // Remove these players from the queue
      store.matchmakingQueues[queueKey] = [];

      // Clean up Firestore matchmaking documents
      

      // Generate bots for the remaining slots
      const matchedList = [...realPlayers];
      const botAvatars = ['🤖', '🦊', '⚡', '👑'];
      const botNames = ['Dhili Master AI', 'SomaliLudoBot', 'LudoPro AI', 'DesertFox AI', 'NomadLudo AI'];

      while (matchedList.length < cap) {
        const botIndex = matchedList.length;
        matchedList.push({
          id: `bot_match_${Date.now()}_${botIndex}`,
          username: botNames[Math.floor(Math.random() * botNames.length)] + ` #${Math.floor(10 + Math.random() * 90)}`,
          avatar: botAvatars[botIndex % botAvatars.length],
          winCount: 15 + Math.floor(Math.random() * 25),
          lossCount: 10 + Math.floor(Math.random() * 15),
          balance: 100
        });
      }

      // Create the room
      await startMatchedRoom(matchedList, bet, cap, mode);
    }
  }
}, 2000);


// ==========================================
// 4. API ENDPOINTS
// ==========================================

// Authentication / Session
app.post('/api/auth/register', async (req: any, res) => {
    const { username, email, password, avatar } = req.body;
  
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection is not available.' });
    }
  
    try {
      // Check if user already exists in Firestore
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      if (!snapshot.empty) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
  
      // IMPORTANT: In a real app, hash the password before saving!
      const hashedPassword = password; // Storing plain text for this example. NOT FOR PRODUCTION.
  
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newUser: UserProfile = {
        id: userId,
        username: username.trim().substring(0, 20),
        email: email,
        password: hashedPassword, // Storing this for our new auth system
        avatar: avatar || '🌸',
        balance: 100.0,
        winCount: 0,
        lossCount: 0
      };
  
      // Save the new user to Firestore
      await usersRef.doc(userId).set(newUser);
      
      // The addTransaction function still uses the in-memory store, this will be refactored later.
      // For now, we also add the user to the local store to keep things working temporarily.
      store.users[userId] = newUser;
      await addTransaction(userId, 'deposit', 100.0, undefined, 'Welcome signup bonus.');
  
      res.status(201).json({ success: true, message: 'User registered successfully.' });
    } catch (error) {
      console.error("Error during user registration:", error);
      res.status(500).json({ error: "An internal server error occurred during registration." });
    }
});

app.post('/api/auth/login', async (req: any, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection is not available.' });
    }

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();

      if (snapshot.empty) {
          return res.status(404).json({ error: 'User not found.' });
      }

      const user = snapshot.docs[0].data() as UserProfile;

      // IMPORTANT: In a real app, compare hashed passwords!
      const isValid = user.password === password; // Plain text comparison. NOT FOR PRODUCTION.

      if (!isValid) {
          return res.status(401).json({ error: 'Invalid password.' });
      }

      // Also add/update the user in the local store for now for compatibility with other functions.
      store.users[user.id] = user;

      // Create and sign a JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Don't send the password back to the client
      const { password: _, ...userProfile } = user;

      res.json({ token, user: userProfile });
    } catch (error) {
      console.error("Error during user login:", error);
      res.status(500).json({ error: "An internal server error occurred during login." });
    }
});

// Retrieve single profile
app.get('/api/users/:userId', async (req, res, next) => {
  if (req.params.userId === 'online' || req.params.userId === 'leaderboard') {
    return next();
  }
  if (!db) {
    return res.status(500).json({ error: 'Database connection is not available.' });
  }

  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    if (!userDoc.exists) {
      // Fallback to in-memory store for now for compatibility with bot users etc.
      const user = store.users[req.params.userId];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password, firebaseUid, ...userProfile } = user;
      return res.json(userProfile);
    }
    const user = userDoc.data() as UserProfile;
    // Also add/update the user in the local store for now for compatibility
    store.users[user.id] = user;
    const { password, firebaseUid, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Update profile
app.post('/api/users/:userId/update', verifyJwt, async (req: any, res) => {
    // Ensure the authenticated user is the one they are trying to update
    if (req.user.userId !== req.params.userId) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }
    const user = store.users[req.params.userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
  
    const { username, avatar, isOfflinePreference } = req.body;
    if (username) user.username = username.trim().substring(0, 20);
    if (avatar) user.avatar = avatar;
    if (typeof isOfflinePreference === 'boolean') user.isOfflinePreference = isOfflinePreference;
  
    // await // saveStoreAndWait();
    broadcastUserUpdate(user.id);
    const { password, firebaseUid, ...userProfile } = user;
    res.json(userProfile);
});

// Update online/offline status preference
app.post('/api/users/:userId/status', verifyJwt, (req: any, res) => {
    if (req.user.userId !== req.params.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const user = store.users[req.params.userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
  
    const { isOffline } = req.body;
    user.isOfflinePreference = !!isOffline;
  
    // saveStore();
    broadcastUserUpdate(user.id);
    const { password, firebaseUid, ...userProfile } = user;
    res.json({ success: true, isOfflinePreference: user.isOfflinePreference, user: userProfile });
});

// Wallet Deposits / Withdrawals
app.post('/api/wallet/deposit', verifyJwt, async (req: any, res) => {
  const { userId, amount } = req.body;
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Database connection is not available.' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userDoc.data() as UserProfile;
    
    const depAmt = parseFloat(amount);
    if (isNaN(depAmt) || depAmt <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const newBalance = user.balance + depAmt;

    // Update balance in Firestore
    await userRef.update({ balance: newBalance });
    
    // Add transaction record
    await addTransaction(userId, 'deposit', depAmt, undefined, `Deposited funds via Simulated Net Banking.`);

    // For now, update in-memory store for compatibility
    if (store.users[userId]) {
      store.users[userId].balance = newBalance;
    }
    
    broadcastUserUpdate(userId);

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("Error during deposit:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.post('/api/wallet/withdraw', verifyJwt, async (req: any, res) => {
    const { userId, amount } = req.body;
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database connection is not available.' });
    }

    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userDoc.data() as UserProfile;
    
      const withAmt = parseFloat(amount);
      if (isNaN(withAmt) || withAmt <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount' });
      }
    
      if (user.balance < withAmt) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
    
      const newBalance = user.balance - withAmt;

      // Update balance in Firestore
      await userRef.update({ balance: newBalance });
      
      // Add transaction record
      await addTransaction(userId, 'withdrawal', withAmt, undefined, `Withdrawn funds to bank account.`);

      // For now, update in-memory store for compatibility
      if (store.users[userId]) {
        store.users[userId].balance = newBalance;
      }
      
      broadcastUserUpdate(userId);
    
      res.json({ success: true, balance: newBalance });
    } catch (error) {
      console.error("Error during withdrawal:", error);
      res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.get('/api/wallet/transactions/:userId', verifyJwt, async (req: any, res) => {
    if (req.user.userId !== req.params.userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!db) return res.status(500).json({ error: "Database not available" });

    try {
        const snapshot = await db.collection('transactions').where('userId', '==', req.params.userId).orderBy('timestamp', 'desc').get();
        const txs = snapshot.docs.map(doc => doc.data());
        res.json(txs);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});


// ==========================================
// 5. MATCHMAKING & LOBBY SYSTEM
// ==========================================

// Create Room (Private or Public Friends list)
app.post('/api/rooms/create', verifyJwt, (req: any, res) => {
  const { userId, betAmount, capacity, gameMode } = req.body;
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const bet = parseFloat(betAmount);
  if (user.balance < bet) {
    return res.status(400).json({ error: 'Insufficient wallet balance for this bet amount.' });
  }

  const selectedMode = gameMode === 'team' ? 'team' : 'solo';
  const selectedCapacity = selectedMode === 'team' ? 4 : (parseInt(capacity) || 2);

  const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  const newPlayer: LudoPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: (selectedCapacity === 2 && selectedMode === 'solo') ? 'green' : 'red', // Host is Green for 2-player solo, Red for others
    isHost: true,
    isReady: true,
    status: 'online',
    winCount: user.winCount,
    lossCount: user.lossCount,
    balance: user.balance
  };

  const newRoom: GameRoom = {
    id: roomId,
    status: 'waiting',
    betAmount: bet,
    players: [newPlayer],
    capacity: selectedCapacity,
    gameMode: selectedMode,
    pendingPlayers: [],
    gameState: {
      turn: 0,
      diceRoll: null,
      hasRolled: false,
      turnTimer: 30,
      tokens: [],
      winnerId: null,
      escrowBalance: 0,
      logs: [{ id: '1', timestamp: Date.now(), text: `Room created by ${user.username}. Code: ${roomId} (${selectedMode === 'team' ? 'Team 2v2' : 'Solo ' + selectedCapacity + 'P'})` }],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };

  store.rooms[roomId] = newRoom;
  // saveStore();
  res.json(newRoom);
});

// Join Room via Code
app.post('/api/rooms/join', verifyJwt, (req: any, res) => {
  const { userId, roomCode } = req.body;
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = (roomCode || '').trim().toUpperCase();
  const room = store.rooms[code];
  if (!room) {
    return res.status(404).json({ error: 'Room code not found.' });
  }

  // Check if player already in room or pending list - allow retrieval even if match started!
  if (room.players.some(p => p.userId === userId)) {
    return res.json(room);
  }
  if (room.pendingPlayers && room.pendingPlayers.some(p => p.userId === userId)) {
    return res.json(room);
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Match has already started or been completed.' });
  }

  const maxPlayers = room.capacity || 2;
  if (room.players.length >= maxPlayers) {
    return res.status(400).json({ error: `Room is already full at ${maxPlayers} capacity.` });
  }

  if (user.balance < room.betAmount) {
    return res.status(400).json({ error: `You need at least $${room.betAmount} in your wallet to join this room.` });
  }

  const newPendingPlayer: LudoPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: 'green', // Assign color on host approval
    isHost: false,
    isReady: false,
    status: 'online',
    winCount: user.winCount || 0,
    lossCount: user.lossCount || 0,
    balance: user.balance || 0
  };

  if (!room.pendingPlayers) room.pendingPlayers = [];
  room.pendingPlayers.push(newPendingPlayer);
  
  addLog(room, `🔔 Challenger ${user.username} is requesting to join the match. Waiting for host approval!`);
  // saveStore();

  // Notify existing room players (including host) so they see the live approval dialog
  broadcastToRoom(room.id, 'game_update', room);

  res.json(room);
});

// Helper to build and start a matched game room
async function startMatchedRoom(matchedUsers: Array<{ id: string; username: string; avatar: string; winCount?: number; lossCount?: number; balance: number }>, bet: number, cap: number, mode: 'solo' | 'team'): Promise<GameRoom> {
  const roomId = `MATCH_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  let colors: PlayerColor[];

  if (cap === 2 && mode === 'solo') {
    colors = ['green', 'blue'];
  } else {
    colors = ['red', 'green', 'yellow', 'blue'];
  }
  
  const players: LudoPlayer[] = matchedUsers.map((u, index) => ({
    userId: u.id,
    username: u.username,
    avatar: u.avatar,
    color: colors[index] || 'red',
    isHost: index === 0,
    isReady: true,
    status: 'online',
    winCount: u.winCount || 0,
    lossCount: u.lossCount || 0,
    balance: u.balance || 0
  }));

  // Create escrow holding for real players
  let totalEscrow = 0;
  for (const p of players) {
    if (!isBotPlayer(p.userId) && db) {
      try {
        const userRef = db.collection('users').doc(p.userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const newBalance = Math.max(0, userDoc.data().balance - bet);
          await userRef.update({ balance: newBalance });
          await addTransaction(p.userId, 'bet_escrow_locked', bet, roomId, `Escrow stake for Ludo Match ${roomId}.`);
          broadcastUserUpdate(p.userId);
        }
      } catch (e) {
        console.error("Error deducting escrow for player", p.userId, e);
      }
    }
    totalEscrow += bet;
  }

  const tokens: LudoToken[] = [];
  players.forEach(p => {
    tokens.push(...createInitialTokens(p.userId, p.color));
  });

  const newRoom: GameRoom = {
    id: roomId,
    status: 'playing',
    betAmount: bet,
    players,
    capacity: cap,
    gameMode: mode,
    gameState: {
      turn: 0,
      diceRoll: null,
      hasRolled: false,
      turnTimer: 30,
      tokens,
      winnerId: null,
      escrowBalance: totalEscrow,
      logs: [
        { id: '1', timestamp: Date.now(), text: `Match found! Mode: ${mode === 'team' ? 'Partnership 2v2' : 'Solo ' + cap + 'P'}` },
        { id: '2', timestamp: Date.now(), text: `Stake of $${bet} locked in secure escrow pool ($${totalEscrow.toFixed(2)})` }
      ],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };

  store.rooms[roomId] = newRoom;
  
  // Create room in Firestore as well
  if(db) {
    await db.collection('rooms').doc(roomId).set(newRoom);
  }

  // Notify real players instantly over SSE with redirect payload
  players.forEach(p => {
    if (!isBotPlayer(p.userId)) {
      sendEventToUser(p.userId, 'matchmaker_success', { roomId: newRoom.id, room: newRoom });
      broadcastToAll('matchmaker_seeking_cancelled', { senderId: p.userId });
    }
  });

  broadcastToAll('online_players_updated', {});

  return newRoom;
}

// Enter Matchmaking Queue (Search Live)
app.post('/api/rooms/matchmaking/enter-queue', (req, res) => {
  try {
    const { userId, betAmount, capacity, gameMode } = req.body;
    const user = store.users[userId];
    if (!user) return res.status(404).json({ error: 'User not found' });

    cleanupMatchmakingQueues();

    const bet = parseFloat(betAmount);
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Insufficient balance to match stake.' });
    }

    const cap = parseInt(capacity) || 2;
    const mode = gameMode === 'team' ? 'team' : 'solo';
    const queueKey = `${bet}_${cap}_${mode}`;

    // Ensure queue exists
    if (!store.matchmakingQueues[queueKey]) {
      store.matchmakingQueues[queueKey] = [];
    }

    // Prevent duplicates
    if (store.matchmakingQueues[queueKey].includes(userId)) {
      // Re-broadcast just in case other users missed it
      broadcastToAll('matchmaker_seeking', {
        senderId: user.id,
        username: user.username,
        avatar: user.avatar,
        betAmount: bet,
        capacity: cap,
        gameMode: mode,
        queueKey
      });
      return res.json({ status: 'queued', message: 'Already in queue' });
    }

    // Add to queue
    (user as any).seekingJoinedAt = Date.now();
    store.matchmakingQueues[queueKey].push(userId);

    // Write matchmaking record to Firestore
    

    // Broadcast seeking event to all online users on dashboard
    broadcastToAll('matchmaker_seeking', {
      senderId: user.id,
      username: user.username,
      avatar: user.avatar,
      betAmount: bet,
      capacity: cap,
      gameMode: mode,
      queueKey
    });
    broadcastToAll('online_players_updated', {});

    // saveStore();
    res.json({ status: 'queued', message: 'Looking for real online opponent...' });
  } catch (error: any) {
    console.error('!!! UNHANDLED ERROR in /enter-queue:', error);
    res.status(500).json({ error: 'An unexpected server error occurred.', details: error.message });
  }
});

// Join Matchmaking Game (Challenge Player)
app.post('/api/rooms/matchmaking/join', async (req, res) => {
  const { userId, betAmount, capacity, gameMode, opponentId } = req.body;
  
  if (!opponentId) {
    return res.status(400).json({ error: 'This endpoint is for direct challenges only. opponentId is required.' });
  }

  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const oppUser = store.users[opponentId];
  if (!oppUser) return res.status(404).json({ error: 'Opponent not found' });

  cleanupMatchmakingQueues();

  const bet = parseFloat(betAmount);
  if (user.balance < bet) {
    return res.status(400).json({ error: 'Insufficient balance to match stake.' });
  }

  // Remove both users from all matchmaking queues
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== userId && id !== opponentId);
  }
  if (store.users[userId]) delete (store.users[userId] as any).seekingJoinedAt;
  if (store.users[opponentId]) delete (store.users[opponentId] as any).seekingJoinedAt;

  // Clean up Firestore matchmaking documents if they exist
  

  const matchedList = [user, oppUser];
  // For a direct 1v1 challenge, capacity is always 2 and mode is solo.
  const finalCapacity = 2;
  const finalMode = 'solo';
  const room = await startMatchedRoom(matchedList, bet, finalCapacity, finalMode);

  return res.json({ matched: true, roomId: room.id, room });
});

// Explicit endpoint to play against AI Bots ONLY (when user explicitly chooses)
app.post('/api/rooms/create-bot-room', async (req, res) => {
  const { userId, betAmount, capacity, gameMode } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const bet = parseFloat(betAmount) || 0;
  if (user.balance < bet) {
    return res.status(400).json({ error: 'Insufficient wallet balance for this stake.' });
  }

  const cap = parseInt(capacity) || 2;
  const mode = gameMode === 'team' ? 'team' : 'solo';

  const matchedList: Array<{ id: string; username: string; avatar: string; winCount?: number; lossCount?: number; balance: number }> = [user];
  const botAvatars = ['🤖', '🦊', '⚡', '👑'];
  const botNames = ['LudoMaster AI', 'SpeedyBot', 'ProLudo AI', 'ZenBot'];

  while (matchedList.length < cap) {
    const botIndex = matchedList.length;
    matchedList.push({
      id: `bot_match_${Date.now()}_${botIndex}`,
      username: botNames[botIndex % botNames.length],
      avatar: botAvatars[botIndex % botAvatars.length],
      winCount: 10 + Math.floor(Math.random() * 20),
      lossCount: 5 + Math.floor(Math.random() * 10),
      balance: 100
    });
  }

  const room = await startMatchedRoom(matchedList, bet, cap, mode);
  res.json({ success: true, roomId: room.id });
});

// Leave Matchmaking Queue
app.post('/api/rooms/matchmaking/leave', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    if (store.users[userId]) {
      delete (store.users[userId] as any).seekingJoinedAt;
    }
    for (const qKey of Object.keys(store.matchmakingQueues)) {
      store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== userId);
    }
    // saveStore();
    broadcastToAll('matchmaker_seeking_cancelled', { senderId: userId });

    // Also delete matchmaking record in Firestore if exists
    
  }
  res.json({ success: true });
});

// WebRTC Voice Chat Signaling Route
app.post('/api/rooms/voice-signaling', (req, res) => {
  const { roomId, senderId, targetId, signal } = req.body;
  if (!roomId || !senderId || !targetId || !signal) {
    return res.status(400).json({ error: 'Missing required signaling fields' });
  }

  // Forward the signal to targetId
  sendEventToUser(targetId, 'voice_signal', {
    roomId,
    senderId,
    signal
  });

  res.json({ success: true });
});

// Get active online & registered players (real users)
app.get('/api/users/online', async (req, res) => {
  const currentUserId = req.query.userId as string;
  if (!currentUserId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  cleanupMatchmakingQueues();

  // Sync matchmaking queue from Firestore if db is available to support multi-instance
  

  // Real connected clients via SSE
  const activeIds = new Set(activeClients.map(c => c.userId));

  const onlineList: any[] = [];

  // Return all registered users searching or online
  Object.values(store.users).forEach(u => {
    if (u.id.startsWith('user_sim_')) return; // Skip simulated players
    const isConnected = activeIds.has(u.id);
    const inGame = Object.values(store.rooms).some(r =>
      r.status === 'playing' && r.players.some(p => p.userId === u.id && p.status !== 'left')
    );

    let status = 'offline';
    let seekingDetails: any = null;

    // Check if user is currently searching in matchmaking queue
    for (const [qKey, queueUserIds] of Object.entries(store.matchmakingQueues)) {
      if (queueUserIds.includes(u.id)) {
        const parts = qKey.split('_');
        seekingDetails = {
          betAmount: parseFloat(parts[0]) || 0,
          capacity: parseInt(parts[1]) || 2,
          gameMode: parts[2] || 'solo'
        };
        status = 'seeking';
        break;
      }
    }

    // ONLY include users who are actively searching in matchmaking queues right now
    if (status === 'seeking') {
      onlineList.push({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        winCount: u.winCount || 0,
        lossCount: u.lossCount || 0,
        balance: u.balance,
        isSimulated: false,
        status,
        seekingDetails,
        seekingJoinedAt: (u as any).seekingJoinedAt || Date.now()
      });
    }
  });

  // Sort seeking players by seekingJoinedAt descending (most recent first)
  onlineList.sort((a, b) => {
    if (a.status === 'seeking' && b.status === 'seeking') {
      return (b.seekingJoinedAt || 0) - (a.seekingJoinedAt || 0);
    }
    if (a.status === 'seeking') return -1;
    if (b.status === 'seeking') return 1;
    return 0;
  });

  res.json(onlineList);
});

// Challenge / Invite a player (PUBG-style)
app.post('/api/rooms/challenge/invite', async (req, res) => {
  const { senderId, receiverId, betAmount, capacity, gameMode } = req.body;
  const sender = store.users[senderId];
  if (!sender) return res.status(404).json({ error: 'Sender user not found.' });

  const bet = parseFloat(betAmount) || 0;
  if (sender.balance < bet) {
    return res.status(400).json({ error: `Insufficient wallet balance for $${bet} bet.` });
  }

  const selectedMode = gameMode === 'team' ? 'team' : 'solo';
  const selectedCapacity = selectedMode === 'team' ? 4 : (parseInt(capacity) || 2);

  // If receiver is a featured/simulated player, start match directly
  if (receiverId.startsWith('sim_') || receiverId.startsWith('bot_')) {
    const receiverUser = {
      id: receiverId,
      username: receiverId.includes('1') ? 'Kaptan_Ludo 👑' : receiverId.includes('2') ? 'SomaliGamer_252' : receiverId.includes('3') ? 'Pro_Dice_Master' : 'Speedy_Runner',
      avatar: receiverId.includes('1') ? '🦁' : receiverId.includes('2') ? '⚡' : receiverId.includes('3') ? '🦊' : '🐉',
      winCount: 20,
      lossCount: 8,
      balance: 100
    };
    const matchedList = [sender, receiverUser];
    const botAvatars = ['🤖', '🦊', '⚡', '👑'];
    const botNames = ['LudoMaster AI', 'SpeedyBot', 'ProLudo AI', 'ZenBot'];
    while (matchedList.length < selectedCapacity) {
      const idx = matchedList.length;
      matchedList.push({
        id: `bot_match_${Date.now()}_${idx}`,
        username: botNames[idx % botNames.length],
        avatar: botAvatars[idx % botAvatars.length],
        winCount: 10 + Math.floor(Math.random() * 20),
        lossCount: 5 + Math.floor(Math.random() * 10),
        balance: 100
      });
    }

    const room = await startMatchedRoom(matchedList, bet, selectedCapacity, selectedMode);
    return res.json({ success: true, roomId: room.id, room });
  }

  // Check if receiver is currently in any matchmaking queue (i.e. seen on radar)
  const receiverUser = store.users[receiverId];
  let isReceiverSeeking = false;
  if (receiverUser) {
    for (const qKey of Object.keys(store.matchmakingQueues)) {
      if (store.matchmakingQueues[qKey].includes(receiverId)) {
        isReceiverSeeking = true;
        break;
      }
    }
  }

  const roomId = `INV_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const hostPlayer: LudoPlayer = {
    userId: sender.id,
    username: sender.username,
    avatar: sender.avatar,
    color: 'red',
    isHost: true,
    isReady: true,
    status: 'online',
    winCount: sender.winCount,
    lossCount: sender.lossCount,
    balance: sender.balance
  };

  const newRoom: GameRoom = {
    id: roomId,
    status: 'waiting',
    betAmount: bet,
    players: [hostPlayer],
    capacity: selectedCapacity,
    gameMode: selectedMode,
    pendingPlayers: [],
    gameState: {
      turn: 0,
      diceRoll: null,
      hasRolled: false,
      turnTimer: 30,
      tokens: [],
      winnerId: null,
      escrowBalance: 0,
      logs: [{ id: '1', timestamp: Date.now(), text: `Challenge lobby created by ${sender.username}. Bet: $${bet}` }],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };

  store.rooms[roomId] = newRoom;

  // Remove both players from any matchmaking queues they might be in.
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== senderId && id !== receiverId);
  }
  
  broadcastToAll('matchmaker_seeking_cancelled', { senderId });
  broadcastToAll('matchmaker_seeking_cancelled', { senderId: receiverId });

  // Notify real user over SSE
  sendEventToUser(receiverId, 'game_invite', {
    senderId: sender.id,
    senderName: sender.username,
    senderAvatar: sender.avatar,
    betAmount: bet,
    capacity: selectedCapacity,
    gameMode: selectedMode,
    roomId
  });

  res.json({ success: true, roomId });
});

// Accept a real game challenge
app.post('/api/rooms/challenge/accept', (req, res) => {
  const { userId, roomId } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Challenge lobby no longer exists.' });

  if (room.players.length >= (room.capacity || 2)) {
    return res.status(400).json({ error: 'Room is already full.' });
  }

  if (user.balance < room.betAmount) {
    return res.status(400).json({ error: `Insufficient wallet balance to accept this $${room.betAmount} match.` });
  }

  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  const occupiedColors = room.players.map(p => p.color);
  const assignedColor = colors.find(c => !occupiedColors.includes(c)) || 'green';

  const newPlayer: LudoPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: assignedColor,
    isHost: false,
    isReady: true,
    status: 'online',
    winCount: user.winCount,
    lossCount: user.lossCount,
    balance: user.balance
  };

  room.players.push(newPlayer);
  addLog(room, `⚔️ ${user.username} accepted the challenge and joined the room.`);
  // saveStore();

  const hostId = room.players.find(p => p.isHost)?.userId;
  if (hostId) {
    sendEventToUser(hostId, 'game_invite_accepted', { roomId });
  }

  res.json({ success: true, roomId });
});

// Decline a real game challenge
app.post('/api/rooms/challenge/decline', (req, res) => {
  const { userId, roomId } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const room = store.rooms[roomId];
  if (room) {
    const hostId = room.players.find(p => p.isHost)?.userId;
    if (hostId) {
      sendEventToUser(hostId, 'game_invite_declined', { receiverName: user.username });
    }
    delete store.rooms[roomId];
    // saveStore();
  }

  res.json({ success: true });
});

// Dynamic Leaderboard (Global Earnings Board) from active store data
app.get('/api/users/leaderboard', (req, res) => {
  const allUsers = Object.values(store.users).filter(u => !u.id.startsWith('user_sim_') && !u.id.startsWith('bot_'));

  allUsers.forEach(u => {
    const userTransactions = store.transactions.filter(t => t.userId === u.id);
    const totalWins = userTransactions.filter(t => t.type === 'win_payout').reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = userTransactions.filter(t => t.type === 'app_commission').reduce((sum, t) => sum + t.amount, 0);
    u.earnings = totalWins - totalCommission;
  });

  // Sort users by winCount descending
  const sorted = [...allUsers]
    .sort((a, b) => {
      const aEarnings = a.earnings || 0;
      const bEarnings = b.earnings || 0;
      return bEarnings - aEarnings;
    })
    .slice(0, 5);

  let rank = 1;
  const result = sorted.map(u => {
    return {
      rank: rank++,
      name: u.username,
      avatar: u.avatar || '🎮',
      wins: u.winCount || 0,
      earnings: u.earnings || 0
    };
  });

  res.json(result);
});

// Ready Up / Toggle Ready
app.post('/api/rooms/ready', async (req, res) => {
  const { userId, roomId } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

    const room = roomDoc.data() as GameRoom;
    const p = room.players.find(p => p.userId === userId);
    if (!p) return res.status(404).json({ error: 'Player not in room' });

    p.isReady = !p.isReady;
    addLog(room, `${p.username} is ${p.isReady ? 'READY' : 'NOT READY'}.`);
    
    await roomRef.set(room);

    broadcastToRoom(room.id, 'game_update', room);
    res.json(room);
  } catch (error) {
    console.error("Error in /ready:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Add Bot to Private Room (To start match immediately)
app.post('/api/rooms/add-bot', async (req, res) => {
  const { roomId } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    
    const room = roomDoc.data() as GameRoom;
    if (room.players.length >= 4) {
      return res.status(400).json({ error: 'Room is already full.' });
    }

    const botNames = ['DeepBlue', 'AlphaGo', 'ChessMaster', 'LudoAI', 'LudoKing', 'Siri', 'Alexa'];
    const name = botNames[Math.floor(Math.random() * botNames.length)] + `_${Math.floor(Math.random() * 100)}`;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const occupiedColors = room.players.map(p => p.color);
    const color = colors.find(c => !occupiedColors.includes(c)) || 'green';

    const botPlayer: LudoPlayer = {
      userId: botId,
      username: `🤖 ${name}`,
      avatar: '🤖',
      color,
      isHost: false,
      isReady: true,
      status: 'online'
    };

    room.players.push(botPlayer);
    addLog(room, `Bot ${botPlayer.username} joined the match.`);
    
    await roomRef.set(room);

    broadcastToRoom(room.id, 'game_update', room);
    res.json(room);
  } catch (error) {
    console.error("Error in /add-bot:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Start Match (Host only)
app.post('/api/rooms/start', async (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const p = room.players.find(p => p.userId === userId);
  if (!p || !p.isHost) {
    return res.status(403).json({ error: 'Only the host can start the match.' });
  }

  if (room.players.length < 2) {
    return res.status(400).json({ error: 'Ugu yaraan 2 ciyaartoy ayaa loo baahan yahay si ciyaartu u bilaabato.' });
  }

  // Adjust capacity to joined players if host starts with present players
  room.capacity = room.players.length;

  // Ensure all players are ready and assigned distinct colors
  let colorsToAssign: PlayerColor[];
  if (room.players.length === 2 && room.gameMode === 'solo') {
    colorsToAssign = ['red', 'yellow']; 
    const host = room.players.find(p => p.isHost);
    const guest = room.players.find(p => !p.isHost);
    if (host) host.color = 'red';
    if (guest) guest.color = 'yellow';
  } else {
    colorsToAssign = ['red', 'green', 'yellow', 'blue'];
    room.players.forEach((pl, idx) => {
      pl.color = colorsToAssign[idx] || 'red';
    });
  }

  room.players.forEach(pl => pl.isReady = true);

  // Deduct stakes and lock escrow
  const bet = room.betAmount;
  if (db) {
    for (const pl of room.players) {
      if (!isBotPlayer(pl.userId)) {
        const userRef = db.collection('users').doc(pl.userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists || (userDoc.data()?.balance || 0) < bet) {
          return res.status(400).json({ error: `One or more players have insufficient balance for this bet. (${pl.username})` });
        }
      }
    }

    // All checks passed, now execute deductions
    let totalEscrow = 0;
    for (const pl of room.players) {
      if (!isBotPlayer(pl.userId)) {
        const userRef = db.collection('users').doc(pl.userId);
        const userDoc = await userRef.get();
        const currentBalance = userDoc.data()?.balance || 0;
        await userRef.update({ balance: currentBalance - bet });
        await addTransaction(pl.userId, 'bet_escrow_locked', bet, room.id, `Escrow lock for Match ${room.id}`);
        broadcastUserUpdate(pl.userId);
      }
      totalEscrow += bet;
    }
    room.gameState.escrowBalance = totalEscrow;
  }

  // Setup tokens
  const tokens: LudoToken[] = [];
  room.players.forEach(pl => {
    tokens.push(...createInitialTokens(pl.userId, pl.color));
  });

  room.status = 'playing';
  room.gameState.tokens = tokens;
  room.gameState.turn = 0;
  room.gameState.turnTimer = 30;
  addLog(room, `⚔️ Ciyaartu waa ay bilaabatay! Ciyaartoyda: ${room.players.length}. Bet: $${bet}. Escrow Locked: $${room.gameState.escrowBalance}`);

  if (db) {
    await db.collection('rooms').doc(room.id).set(room);
  }

  broadcastToRoom(room.id, 'game_update', room);

  res.json(room);
});

// Dice Roll Action
app.post('/api/rooms/roll-dice', async (req, res) => {
  const { userId, roomId } = req.body;

  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    
    const room = roomDoc.data() as GameRoom;
    if (room.status !== 'playing') return res.status(400).json({ error: 'Game is not in playing state.' });

    const gs = room.gameState;
    const activePlayer = room.players[gs.turn];

    if (activePlayer) activePlayer.inactivityTimer = 300;
    gs.turnTimer = 30;

    if (!activePlayer || activePlayer.userId !== userId) {
      return res.status(403).json({ error: "It is not your turn to roll!" });
    }
    if (gs.hasRolled) {
      return res.status(400).json({ error: "You have already rolled the dice!" });
    }

    const d = Math.floor(Math.random() * 6) + 1;
    gs.diceRoll = d;
    gs.hasRolled = true;
    addLog(room, `🎲 ${activePlayer.username} rolled a ${d}!`);

    if (d === 6) gs.consecutiveSixes = (gs.consecutiveSixes || 0) + 1;
    else gs.consecutiveSixes = 0;

    if (gs.consecutiveSixes === 3) {
      addLog(room, `⚠️ Triple 6 Penalty! ${activePlayer.username} rolled three 6s in a row. Turn forfeited!`);
      gs.consecutiveSixes = 0;
      gs.diceRoll = null;
      gs.hasRolled = false;
      advanceTurn(room);
      await roomRef.set(room);
      broadcastToRoom(room.id, 'game_update', room);
      await executeBotTurnIfActive(room);
      return res.json(room);
    }

    const playerTokens = gs.tokens.filter(t => t.color === activePlayer.color);
    const validTokens = playerTokens.filter(t => isMoveValid(t, d));

    if (validTokens.length === 0) {
      addLog(room, `${activePlayer.username} has no valid moves with roll ${d}. Turn passes.`);
      await roomRef.set(room);
      broadcastToRoom(room.id, 'game_update', room);
      res.json(room); 

      setTimeout(async () => {
        const currentRoomDoc = await roomRef.get();
        if (currentRoomDoc.exists) {
          const currentRoom = currentRoomDoc.data() as GameRoom;
          if (currentRoom.status === 'playing') {
            advanceTurn(currentRoom);
            await roomRef.set(currentRoom);
            broadcastToRoom(currentRoom.id, 'game_update', currentRoom);
            await executeBotTurnIfActive(currentRoom);
          }
        }
      }, 1500);
    } else {
      await roomRef.set(room);
      broadcastToRoom(room.id, 'game_update', room);
      res.json(room);
    }
  } catch (error) {
    console.error("Error in roll-dice:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
// Token Move Action
app.post('/api/rooms/move-token', async (req, res) => {
  const { userId, roomId, tokenId } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    
    const room = roomDoc.data() as GameRoom;
    if (room.status !== 'playing') return res.status(400).json({ error: 'Game is not playing.' });

    const gs = room.gameState;
    const activePlayer = room.players[gs.turn];

    if (activePlayer) activePlayer.inactivityTimer = 300;
    gs.turnTimer = 30;

    if (!activePlayer || activePlayer.userId !== userId) {
      return res.status(403).json({ error: "It is not your turn!" });
    }

    if (!gs.hasRolled || gs.diceRoll === null) {
      return res.status(400).json({ error: "You must roll the dice first!" });
    }

    const token = gs.tokens.find(t => t.id === tokenId);
    if (!token || token.color !== activePlayer.color) {
      return res.status(400).json({ error: "Invalid token selected." });
    }

    if (!isMoveValid(token, gs.diceRoll)) {
      return res.status(400).json({ error: "This token cannot make a valid move with the current roll." });
    }

    await moveTokenLogic(room, tokenId, gs.diceRoll);
    
    // After moveTokenLogic mutates the room object, save it back to Firestore
    await roomRef.set(room);
    
    broadcastToRoom(room.id, 'game_update', room);
    
    await executeBotTurnIfActive(room);

    res.json(room);
  } catch (error) {
    console.error("Error in move-token:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Send Chat Message
app.post('/api/rooms/chat', async (req, res) => {
  const { userId, roomId, text } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

    const room = roomDoc.data() as GameRoom;
    const p = room.players.find(pl => pl.userId === userId);
    if (!p) return res.status(403).json({ error: 'You are not in this room.' });

    const cleanText = (text || '').trim().substring(0, 100);
    if (cleanText.length > 0) {
      const chatMsg: ChatMessage = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        senderId: userId,
        senderName: p.username,
        text: cleanText,
        timestamp: Date.now()
      };
      room.gameState.chat.push(chatMsg);
      if (room.gameState.chat.length > 30) {
        room.gameState.chat.shift();
      }
      
      await roomRef.update({ 'gameState.chat': room.gameState.chat });
      
      broadcastToRoom(room.id, 'game_update', room);
    }
    res.json(room);
  } catch (error) {
    console.error("Error in /chat:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Accept Pending Player (Host only)
app.post('/api/rooms/accept-player', async (req, res) => {
  const { userId, roomId, challengerId } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

    const room = roomDoc.data() as GameRoom;
    const host = room.players.find(p => p.userId === userId);
    if (!host || !host.isHost) {
      return res.status(403).json({ error: 'Only the host can accept players.' });
    }

    if (!room.pendingPlayers) room.pendingPlayers = [];
    const idx = room.pendingPlayers.findIndex(p => p.userId === challengerId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Challenger not found in pending list.' });
    }

    const challenger = room.pendingPlayers.splice(idx, 1)[0];
    
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const occupiedColors = room.players.map(p => p.color);
    let assignedColor: PlayerColor = colors.find(c => !occupiedColors.includes(c)) || 'green';
    if (room.capacity === 2 && room.gameMode === 'solo') {
      assignedColor = 'yellow';
    }
    challenger.color = assignedColor;
    challenger.isReady = false;

    room.players.push(challenger);
    addLog(room, `✅ Host accepted ${challenger.username} into the room.`);
    
    await roomRef.set(room);
    
    broadcastToRoom(room.id, 'game_update', room);
    sendEventToUser(challengerId, 'game_update', room);

    res.json(room);
  } catch (error) {
    console.error("Error in /accept-player:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Decline Pending Player (Host only)
app.post('/api/rooms/decline-player', async (req, res) => {
  const { userId, roomId, challengerId } = req.body;
  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });
    
    const room = roomDoc.data() as GameRoom;
    const host = room.players.find(p => p.userId === userId);
    if (!host || !host.isHost) {
      return res.status(403).json({ error: 'Only the host can decline players.' });
    }

    if (!room.pendingPlayers) room.pendingPlayers = [];
    const idx = room.pendingPlayers.findIndex(p => p.userId === challengerId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Challenger not found in pending list.' });
    }

    const challenger = room.pendingPlayers.splice(idx, 1)[0];
    addLog(room, `❌ Host declined ${challenger.username}'s request.`);
    
    await roomRef.update({ pendingPlayers: room.pendingPlayers, 'gameState.logs': room.gameState.logs });
    
    const rejectionRoomState = {
      ...room,
      rejectionReason: 'Your request to join the room was declined by the host.',
    };
    sendEventToUser(challengerId, 'game_update', rejectionRoomState);
    broadcastToRoom(room.id, 'game_update', room);

    res.json(room);
  } catch (error) {
    console.error("Error in /decline-player:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Nudge Slow Player
app.post('/api/rooms/nudge', (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const p = room.players.find(pl => pl.userId === userId);
  if (!p) return res.status(403).json({ error: 'You are not in this room.' });

  const gs = room.gameState;
  const activePlayer = room.players[gs.turn];
  if (!activePlayer) return res.status(400).json({ error: 'No active player to nudge.' });

  addLog(room, `⏰ ${p.username} nudged ${activePlayer.username} to make a move!`);
  
  // Send nudge event to the active player's screen
  sendEventToUser(activePlayer.userId, 'player_nudged', { nudgedBy: p.username });
  
  // Broadcast game update with updated logs
  broadcastToRoom(room.id, 'game_update', room);

  res.json(room);
});

// Interactive Emoji Broadcast
app.post('/api/rooms/emoji', (req, res) => {
  const { userId, roomId, emoji } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const p = room.players.find(pl => pl.userId === userId);
  if (!p) return res.status(403).json({ error: 'You are not in this room.' });

  // Broadcast emoji event to all players in the room
  room.players.forEach(pl => {
    sendEventToUser(pl.userId, 'player_emoji', {
      senderId: userId,
      senderName: p.username,
      senderColor: p.color,
      emoji
    });
  });

  res.json({ success: true });
});

// Leave / Forfeit Game Room
app.post('/api/rooms/leave', async (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const p = room.players.find(pl => pl.userId === userId);
  if (!p) return res.status(404).json({ error: 'Player not in room' });

  addLog(room, `${p.username} has left the game.`);

  if (room.status === 'waiting') {
    room.players = room.players.filter(pl => pl.userId !== userId);
    if (room.players.length === 0) {
      delete store.rooms[roomId];
    } else {
      if (p.isHost) {
        room.players[0].isHost = true;
        addLog(room, `${room.players[0].username} is now the host.`);
      }
      broadcastToRoom(room.id, 'game_update', room);
    }
  } else if (room.status === 'playing') {
    p.status = 'left';

    const opponent = room.players.find(pl => pl.userId !== userId && pl.status !== 'left');
    if (opponent) {
      room.status = 'completed';
      room.gameState.winnerId = opponent.userId;
      const totalPayout = room.gameState.escrowBalance;
      addLog(room, `🏆 ${p.username} has left the game. ${opponent.username} wins by forfeit and takes the pot of $${totalPayout.toFixed(2)}!`);

      if (db) {
        const leavingPlayerRef = db.collection('users').doc(userId);
        await leavingPlayerRef.update({ lossCount: (store.users[userId]?.lossCount || 0) + 1 });
        broadcastUserUpdate(userId);

        if (room.betAmount > 0 && totalPayout > 0 && !isBotPlayer(opponent.userId)) {
          const winnerRef = db.collection('users').doc(opponent.userId);
          const winnerDoc = await winnerRef.get();
          if (winnerDoc.exists) {
            await winnerRef.update({
              balance: winnerDoc.data().balance + totalPayout,
              winCount: (winnerDoc.data().winCount || 0) + 1,
            });
            await addTransaction(opponent.userId, 'win_payout', totalPayout, room.id, `Win by opponent forfeit.`);
            broadcastUserUpdate(opponent.userId);
          }
        }
      }
      room.gameState.escrowBalance = 0;
    } else {
      room.status = 'completed';
    }
    
    if (db) await db.collection('rooms').doc(roomId).set(room, { merge: true });
    broadcastToRoom(room.id, 'game_update', room);
  }

  res.json({ success: true, room });
});

// Check if a game is active and the user can rejoin
app.get('/api/rooms/check-status/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!db) return res.status(500).json({ error: "Database not available" });

  try {
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = roomDoc.data() as GameRoom;

    if (room.status !== 'playing') {
      return res.status(409).json({ error: 'Game is not in a rejoinable state (e.g., waiting or completed).', room });
    }

    const playerInRoom = room.players.find(p => p.userId === userId && p.status !== 'left');
    if (!playerInRoom) {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    // Player is in the room and game is active. Return room data.
    res.json(room);
  } catch (error) {
    console.error("Error in /check-status:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});


// ==========================================
// 6. ADMIN API ENDPOINTS
// ==========================================

// Login endpoint for admin
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';

    if (username === adminUsername && password === adminPassword) {
        // In a real app, you'd create a secure session.
        // For this app, we'll just use a static ID that the frontend can store.
        const adminUserId = 'internal_admin_user_id';
        res.json({ success: true, userId: adminUserId });
    } else {
        res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
});

// Middleware to check for admin access
function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const { userId } = req.query;
    if (userId === 'internal_admin_user_id') {
        return next();
    }
    // In a real app, you would have a more robust check here
    // based on session or a permissions system.
    const user = store.users[userId as string];
    if (user && user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Access denied. You do not have admin privileges.' });
}

// Get all runtime stats
app.get('/api/admin/stats', isAdmin, (req, res) => {
    res.json({
        totalUsers: Object.keys(store.users).length,
        totalRooms: Object.keys(store.rooms).length,
        activeRooms: Object.values(store.rooms).filter(r => r.status === 'playing').length,
        waitingRooms: Object.values(store.rooms).filter(r => r.status === 'waiting').length,
        houseRevenue: store.houseRevenue || 0,
        onlineClients: activeClients.length,
    });
});

// Get all users
app.get('/api/admin/users', isAdmin, (req, res) => {
    res.json(Object.values(store.users));
});

// Get all rooms
app.get('/api/admin/rooms', isAdmin, (req, res) => {
    res.json(Object.values(store.rooms));
});

// Get all transactions
app.get('/api/admin/transactions', isAdmin, (req, res) => {
    res.json(store.transactions);
});


// Impersonate a user
app.post('/api/admin/impersonate', isAdmin, (req, res) => {
    const { userId } = req.body;
    const user = store.users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // For this simple app, we'll just return the user object.
    // In a real app with JWT, you would generate a new token for the user.
    res.json({ success: true, user });
});

// Update a user's details (e.g., balance, role)
app.post('/api/admin/users/:userId/update', isAdmin, (req, res) => {
    const { userId } = req.params;
    const user = store.users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { balance, role, winCount, lossCount } = req.body;

    if (typeof balance === 'number') {
        user.balance = balance;
    }
    if (role && ['admin', 'player'].includes(role)) {
        user.role = role;
    }
    if (typeof winCount === 'number') {
        user.winCount = winCount;
    }
    if (typeof lossCount === 'number') {
        user.lossCount = lossCount;
    }

    // saveStore();
    broadcastUserUpdate(user.id); // Notify user of the change
    res.json(user);
});


// Delete a user
app.delete('/api/admin/users/:userId/delete', isAdmin, (req, res) => {
    const { userId } = req.params;
    if (store.users[userId]) {
        delete store.users[userId];
        // saveStoreAndWait();
        res.json({ success: true, message: `User ${userId} has been deleted.` });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Cancel a game
app.post('/api/admin/rooms/:roomId/cancel', isAdmin, async (req, res) => {
    const { roomId } = req.params;
    const room = store.rooms[roomId];
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    // Refund players
    if (room.betAmount > 0 && db) {
        for (const p of room.players) {
            if (!isBotPlayer(p.userId)) {
                try {
                    const userRef = db.collection('users').doc(p.userId);
                    const userDoc = await userRef.get();
                    if (userDoc.exists) {
                        await userRef.update({ balance: userDoc.data().balance + room.betAmount });
                        await addTransaction(p.userId, 'refund', room.betAmount, room.id, `Refund for canceled match ${room.id}.`);
                        broadcastUserUpdate(p.userId);
                    }
                } catch (e) {
                    console.error("Error refunding player", p.userId, e);
                }
            }
        }
    }

    addLog(room, `Game canceled by admin. Bets refunded.`);
    broadcastToRoom(room.id, 'game_canceled', { roomId });
    
    delete store.rooms[roomId];
    if (db) await db.collection('rooms').doc(roomId).delete();

    res.json({ success: true, message: `Room ${roomId} has been canceled and bets refunded.` });
});

// Toggle admin rights for a user
app.post('/api/admin/users/:userId/toggle-admin', isAdmin, (req, res) => {
    const { userId } = req.params;
    const user = store.users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
        user.role = 'player';
    } else {
        user.role = 'admin';
    }

    // saveStore();
    broadcastUserUpdate(user.id);
    res.json({ success: true, user });
});

// Get user's game history
app.get('/api/admin/users/:userId/games', isAdmin, (req, res) => {
    const { userId } = req.params;
    const userGames = Object.values(store.rooms).filter(room => 
        room.players.some(p => p.userId === userId)
    );
    res.json(userGames);
});

// Broadcast a message to all clients
app.post('/api/admin/broadcast', isAdmin, (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message cannot be empty' });
    }

    broadcastToAll('global_message', { message });

    res.json({ success: true, message: 'Broadcast sent.' });
});



// ==========================================
// 7. VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  // Load authoritative state from local file on startup
  // loadStore();
  purgeSimulatedUsers(); // Ensure simulated users are purged from the memory state

  let vite: ViteDevServer | undefined;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Betting Ludo Game Full-Stack App listening at http://localhost:${PORT}`);
  });

  // Handle Vite HMR WebSocket upgrade requests
  server.on('upgrade', (req, socket, head) => {
    if (vite && req.url?.includes('__vite_hmr')) {
      vite.ws.handleUpgrade(req, socket, head);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      console.log('Server shut down.');
      process.exit(0);
    });
  });
}

startServer();
