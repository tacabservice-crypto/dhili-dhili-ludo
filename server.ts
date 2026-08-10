import 'dotenv/config';
import {
  UserProfile,
  WalletTransaction,
  GameRoom,
  LudoPlayer,
  LudoToken,
  PlayerColor,
  ChatMessage,
  GameLog,
  Agent,
  AgentTransaction,
  AgentRequest,
  PlayerAgentRequest,
  VipSubscription,
  Tournament,
  TournamentMatch,
  ManualTransaction,
} from './src/types/game';
import { AdminUser } from './src/models/AdminUser';
import { GameRoom as GameRoomModel } from './src/models/GameRoom';
import { LudoPlayer as LudoPlayerModel } from './src/models/LudoPlayer';
import { LudoToken as LudoTokenModel } from './src/models/LudoToken';
import { UserProfile as UserProfileModel } from './src/models/UserProfile';
import { WalletTransaction as WalletTransactionModel } from './src/models/WalletTransaction';
import { Agent as AgentModel } from './src/models/Agent';
import { AgentTransaction as AgentTransactionModel } from './src/models/AgentTransaction';
import { PlayerAgentRequestModel } from './src/models/PlayerAgentRequestModel';
import { GameState as GameStateModel } from './src/models/GameState';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import sequelize from './src/sequelize';

import {
  getUserByFirebaseUid,
  createUser,
  getAgentByPromoCode,
  linkAgentToPlayer,
  getUserById,
  updateUser,
  createTransaction,
  getTransactionsByUserId,
  getAgents,
  getAgentById,
  createPlayerAgentRequest,
  addUserToMatchmakingQueue,
  removeUsersFromMatchmakingQueue,
  getAdminUserByUsername,
  createAdminUser,
  getAllAdminUsers,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  getAgentByUsername,
  createAgent,
  updateAgent,
  creditAgentFloat,
  getAgentRequests,
  approveAgentRequest,
  rejectAgentRequest,
  getAgentTransactions,
  depositToPlayer,
  createRoom,
  addPlayerToRoom,
  getRoomById,
  removePlayerFromRoom,
  startGame,
} from './src/database';

import { isBotPlayer, addLog, moveTokenLogic } from './src/utils';

interface VipTier {
  name: string;
  price: number; // Monthly price
  durationMonths: number; // Duration of subscription in months
  rakeDiscount: number; // Percentage discount on rake, e.g., 0.02 for 2%
  features: string[];
}

const VIP_TIERS: Record<string, VipTier> = {
  gold: {
    name: 'Gold VIP',
    price: 10,
    durationMonths: 1,
    rakeDiscount: 0.02, // 2% discount on rake
    features: ['Ad-free experience', 'Exclusive avatar borders', '2% Rake Discount', 'Priority Customer Support'],
  },
  platinum: {
    name: 'Platinum VIP',
    price: 25,
    durationMonths: 3,
    rakeDiscount: 0.05, // 5% discount on rake
    features: ['All Gold features', 'Unique animated avatars', '5% Rake Discount', 'Early access to new game modes'],
  },
};

const RAKE_PERCENTAGE = 0.10; // 10% rake

const app = express();

// Enable CORS for the frontend origin
const configuredAllowedOrigins = [
  process.env.VITE_APP_URL,
  process.env.PUBLIC_URL,
  process.env.RENDER_EXTERNAL_URL,
  process.env.ALLOWED_ORIGINS,
].flatMap(value => {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
});

const allowedOrigins = Array.from(new Set([
  'https://dhili-dhili-ludo.onrender.com',
  'https://dhilidhili.onrender.com',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...configuredAllowedOrigins,
]));

app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const PORT = Number(process.env.PORT) || 3002;
const DB_FILE = path.join(process.cwd(), '_store.json');

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), 'public')));

// ==========================================
// 1. DATA STORE SETUP & PERSISTENCE
// ==========================================
interface PaymentProviderConfig {
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  accountNumber?: string;
}

type PaymentProviderKey = 'evc' | 'edahab' | 'sahal' | 'premier';

const DEFAULT_PAYMENT_PROVIDERS: Record<PaymentProviderKey, PaymentProviderConfig> = {
  evc: { enabled: false },
  edahab: { enabled: false },
  sahal: { enabled: false },
  premier: { enabled: false },
};

interface AdminRoleTemplate {
  id: string;
  name: string;
  permissions: string[];
}

interface AdminSettings {
  username: string;
  password: string;
  roles: AdminRoleTemplate[];
}

interface DBStore {
  users: Record<string, UserProfile>;
  transactions: WalletTransaction[];
  rooms: Record<string, GameRoom>;
  matchmakingQueues: Record<string, string[]>; // betAmount -> array of userIds
  houseRevenue: number;
  pendingManualTransactions: ManualTransaction[];
  paymentProviders: Record<PaymentProviderKey, PaymentProviderConfig>;
  agentFloatInstructions: string;
  adminSettings: AdminSettings;
  agents: Record<string, Agent>;
  agentTransactions: AgentTransaction[];
  tournaments: Record<string, Tournament>;
}

const DEFAULT_ADMIN_ROLES: AdminRoleTemplate[] = [
  { id: 'admin', name: 'Administrator', permissions: ['all'] },
  { id: 'editor', name: 'Editor', permissions: ['manage_users', 'manage_content'] },
];

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'password',
  roles: DEFAULT_ADMIN_ROLES,
};

let store: DBStore = {
  users: {},
  transactions: [],
  rooms: {},
  matchmakingQueues: {
    0: [],
    1: [],
    5: [],
    10: [],
    25: [],
    50: []
  },
  houseRevenue: 0,
  pendingManualTransactions: [],
  paymentProviders: { ...DEFAULT_PAYMENT_PROVIDERS },
  agentFloatInstructions: '',
  adminSettings: { ...DEFAULT_ADMIN_SETTINGS },
  agents: {},
  agentTransactions: [],
  tournaments: {}
};

// Load store from disk (local backup/fallback)
function loadStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      // Re-initialize lists to make sure they match expected shapes
      store.users = parsed.users || {};
      store.transactions = parsed.transactions || [];
      store.rooms = parsed.rooms || {};
      store.matchmakingQueues = parsed.matchmakingQueues || {
        0: [], 1: [], 5: [], 10: [], 25: [], 50: []
      };
      store.houseRevenue = parsed.houseRevenue || 0;
      store.pendingManualTransactions = parsed.pendingManualTransactions || [];
      store.paymentProviders = {
        ...DEFAULT_PAYMENT_PROVIDERS,
        ...(parsed.paymentProviders || {})
      };
      store.agentFloatInstructions = parsed.agentFloatInstructions || '';
      store.tournaments = parsed.tournaments || {};
      const persistedRoles = Array.isArray(parsed.adminSettings?.roles) ? parsed.adminSettings.roles : [];
      store.adminSettings = {
        username: parsed.adminSettings?.username || process.env.ADMIN_USERNAME || 'admin',
        password: parsed.adminSettings?.password || process.env.ADMIN_PASSWORD || 'password',
        roles: persistedRoles.length ? persistedRoles : DEFAULT_ADMIN_ROLES,
      };
      store.agents = parsed.agents || {};
      store.agentTransactions = parsed.agentTransactions || [];
      console.log('Database loaded successfully from disk.');
    } else {
      saveStoreAndWait();
    }
  } catch (error) {
    console.error('Failed to load database. Starting fresh.', error);
  }
}

// Slower, awaited version for critical updates
async function saveStoreAndWait(): Promise<{ success: boolean; error?: string }> {
    try {
      // In a function environment, skip writing to the local filesystem.
      if (!(process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
      }
      // Since Firestore is removed, we can just return success.
      return { success: true };
    } catch (error: any) {
      // This will catch errors from writeFileSync.
      console.error('Failed to write database to disk.', error);
      return { success: false, error: error.message };
    }
}

// loadStore(); // We will rely on the database now, but keep this for reference.

// Sync all models with the database
(async () => {
  try {
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing the models:', error);
  }
})();

// ==========================================
// PURGE SIMULATED USERS TO KEEP ONLY REAL REGISTERED USER SESSIONS ON THE RADAR
// ==========================================
function purgeSimulatedUsers() {
  let changed = false;
  Object.keys(store.users).forEach(id => {
    if (id.startsWith('user_sim_')) {
      delete store.users[id];
      changed = true;
    }
  });
  if (changed) {
    saveStoreAndWait();
  }
}
purgeSimulatedUsers();

// ==========================================
// 2. REAL-TIME EVENT STREAM (SSE)
// ==========================================
interface SSEClient {
  userId: string;
  res: any;
  spectatingRoomId?: string;
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

// Send update to all players AND SPECTATORS in a room
function broadcastToRoom(roomId: string, eventName: string, data: any) {
  const room = store.rooms[roomId];
  if (!room) return;

  let payload = { ...data };

  // If this is a game update, dynamically attach the list of current spectators.
  if (eventName === 'game_update' || eventName === 'timer_tick') {
    const spectatorClients = activeClients.filter(c => c.spectatingRoomId === roomId);
    const spectatorsInfo = spectatorClients
      .map(c => {
        const user = store.users[c.userId];
        // Only include if user profile exists
        if (user) {
          return {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            createdAt: user.createdAt,
          };
        }
        return null;
      })
      .filter(Boolean);
    
    payload.spectators = spectatorsInfo;
  }

  // Send to players
  room.players.forEach(p => {
    sendEventToUser(p.userId, eventName, payload);
  });

  // Send to spectators
  const spectatorConnections = activeClients.filter(c => c.spectatingRoomId === roomId);
  spectatorConnections.forEach(s => {
    // Avoid sending duplicate events if a player is also marked as a spectator
    const isPlayer = room.players.some(p => p.userId === s.userId);
    if (!isPlayer) {
      sendEventToUser(s.userId, eventName, payload);
    }
  });
}

// Global user update broadcast (for dashboard balance/profile syncing)
function broadcastUserUpdate(userId: string) {
  const user = store.users[userId];
  if (user) {
    sendEventToUser(userId, 'user_update', user);
  }
}

// Remove disconnected client
function removeSSEClient(res: any) {
  const client = activeClients.find(c => c.res === res);
  activeClients = activeClients.filter(c => c.res !== res);
  if (client) {
    const stillConnected = activeClients.some(c => c.userId === client.userId);
    if (!stillConnected) {
      // User has no more active connections. Mark as offline in any active games.
      const activeRoom = Object.values(store.rooms).find(r => 
        r.status === 'playing' && r.players.some(p => p.userId === client.userId && p.status === 'online')
      );

      if (activeRoom) {
        const player = activeRoom.players.find(p => p.userId === client.userId);
        if (player) {
          player.status = 'offline';
          addLog(activeRoom, `🔌 ${player.username} has disconnected. They have time to reconnect before being forfeited.`);
          broadcastToRoom(activeRoom.id, 'game_update', activeRoom);
          (async () => {
            await saveStoreAndWait();
          })();
        }
      }

      // Clean up from matchmaking queues
      let changed = false;
      for (const qKey of Object.keys(store.matchmakingQueues)) {
        const lenBefore = store.matchmakingQueues[qKey].length;
        store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== client.userId);
        if (store.matchmakingQueues[qKey].length !== lenBefore) changed = true;
      }
      if (changed) {
        saveStoreAndWait();
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
    saveStoreAndWait();
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
const HOME_ENTRY_POSITIONS: Record<PlayerColor, number> = {
  green: 50,
  yellow: 11,
  blue: 24,
  red: 37
};

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
  if (token.position === 56) return false; // Already finished
  if (token.position === -1) {
    return roll === 6; // Can only leave base with a 6
  }

  // In the relative coordinate system (0-50 is main track, 51-56 is home stretch),
  // any move is valid as long as it doesn't overshoot the final home square (56).
  // The logic in `moveTokenLogic` will handle the transition correctly.
  return token.position + roll <= 56;
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
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    type,
    amount,
    timestamp: Date.now(),
    matchId,
    description
  };

  // For backward compatibility, also add to the in-memory store
  store.transactions.unshift(tx);
  
  // The call to saveStore() is often redundant if the calling function calls saveStoreAndWait()
  // but we'll leave it for now to be safe during the transition.
   
  return tx;
}



// Trigger game auto-play bot actions
function executeBotTurnIfActive(room: GameRoom) {
  const activePlayer = room.players[room.gameState.turn];
  if (!activePlayer || !isBotPlayer(activePlayer.userId)) return;

  // Bot logic
  setTimeout(() => {
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
        setTimeout(() => {
          advanceTurn(room);
          broadcastToRoom(room.id, 'game_update', room);
          executeBotTurnIfActive(room);
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
          executeBotTurnIfActive(room);
        }, 500);
      }
    }
  }, 400);
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

    if (room.tournamentDetails) {
      addLog(room, `🏆 ${winner.username} has won the tournament match by forfeit!`);
      await handleTournamentMatchWin(room.tournamentDetails.tournamentId, room.tournamentDetails.matchId, winner.userId);
      room.gameState.escrowBalance = 0;
    } else {
      const totalPayout = room.gameState.escrowBalance;
      addLog(room, `🏆 Game Over! ${winner.username} wins by forfeit and takes the pot of $${totalPayout.toFixed(2)}!`);

      if (room.betAmount > 0 && totalPayout > 0) {
        const winnerProfile = store.users[winner.userId];
        if (winnerProfile && !isBotPlayer(winnerProfile.id)) {
          let effectiveRakePercentage = RAKE_PERCENTAGE;
          if (winnerProfile.vip && winnerProfile.vip.expires > Date.now()) {
            const vipTier = VIP_TIERS[winnerProfile.vip.tier];
            if (vipTier) {
              effectiveRakePercentage = Math.max(0, RAKE_PERCENTAGE - vipTier.rakeDiscount);
            }
          }

          const rakeAmount = totalPayout * effectiveRakePercentage;
          const payoutAmount = totalPayout - rakeAmount;

          winnerProfile.balance += payoutAmount;
          winnerProfile.winCount += 1;
          await addTransaction(winner.userId, 'win_payout', payoutAmount, room.id, `Win by opponent inactivity forfeit (Rake: $${rakeAmount.toFixed(2)}).`);
          broadcastUserUpdate(winner.userId);

          store.houseRevenue += rakeAmount;
          await addTransaction(
            'house', // A special ID for house transactions
            'app_commission',
            rakeAmount,
            room.id,
            `Rake from forfeit match ${room.id} (${(effectiveRakePercentage * 100).toFixed(0)}%).`
          );
        }
      }
      room.gameState.escrowBalance = 0;
    }
  }

  await saveStoreAndWait();
  broadcastToRoom(room.id, 'game_update', room);
}

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
      const room = await startMatchedRoom(matchedList, bet, cap, mode);

      // Notify all real players
      realPlayers.forEach(p => {
        sendEventToUser(p.id, 'matchmaker_success', { roomId: room.id, room });
        broadcastToAll('matchmaker_seeking_cancelled', { senderId: p.id });
      });

      broadcastToAll('online_players_updated', {});
      await saveStoreAndWait();
    }
  }
}, 2000);


// ==========================================
// 4. API ENDPOINTS
// ==========================================

const authMiddleware = async (req: any, res: any, next: () => void) => {
    const userId = req.headers['x-user-id'] as string; // Or however you pass the user ID

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID is required.' });
    }

    const user = store.users[userId];
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found.' });
    }

    req.user = user;
    next();
};

// Debug Firebase endpoint
app.get('/api/debug/firebase', async (req, res) => {
  if (true) {
    return res.json({ 
      initialized: false, 
      error: 'Firebase Firestore  object is null. Check if firebase-admin-key.json exists.' 
    });
  }
  try {
    return res.json({
      initialized: true,
      writeAndReadSuccess: false,
      data: null,
      projectId: "N/A",
    });
  } catch (err: any) {
    return res.json({
      initialized: true,
      error: err.message || err.toString(),
      stack: err.stack
    });
  }
});

// SSE Connection Endpoint
app.get('/api/updates', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  // Set response headers to support real-time streaming behind proxies
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
  
  // Write initial keepalive comment and reconnect interval
  res.write(`:ok

`);
  res.write(`retry: 3000

`);

  const client: SSEClient = { userId, res };
  activeClients.push(client);

  // Handle Reconnection: Check if this user is rejoining an active game
  const activeRoom = Object.values(store.rooms).find(r =>
    r.status === 'playing' && r.players.some(p => p.userId === userId && p.status === 'offline')
  );

  if (activeRoom) {
    const player = activeRoom.players.find(p => p.userId === userId);
    if (player) {
      player.status = 'online';
      player.inactivityTimer = 300; // Reset their full inactivity timer
      addLog(activeRoom, `🟢 ${player.username} has reconnected! Welcome back.`);
      broadcastToRoom(activeRoom.id, 'game_update', activeRoom);
      
    }
  }

  // Send a welcome heart-beat
  res.write(`event: init
data: ${JSON.stringify({ status: 'connected' })}

`);
  
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }

  // Instantly send any active matchmaking search requests to new connected client
  setTimeout(() => {
    for (const [qKey, queueUserIds] of Object.entries(store.matchmakingQueues)) {
      for (const seekingUserId of queueUserIds) {
        if (seekingUserId !== userId && store.users[seekingUserId]) {
          const seekingUser = store.users[seekingUserId];
          const parts = qKey.split('_');
          const seekingData = {
            senderId: seekingUser.id,
            username: seekingUser.username,
            avatar: seekingUser.avatar,
            betAmount: parseFloat(parts[0]) || 0,
            capacity: parseInt(parts[1]) || 2,
            gameMode: parts[2] || 'solo',
            queueKey: qKey
          };
          res.write(`event: matchmaker_seeking
data: ${JSON.stringify(seekingData)}

`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      }
    }
  }, 500);

  req.on('close', () => {
    removeSSEClient(res);
  });
});

// Authentication / Session
app.post('/api/auth/login', async (req: any, res) => {
  const { username, email, avatar, promoCode } = req.body;
  const firebaseUid = req.user.uid;
  const firebaseUser = req.user; // Decoded token

  try {
    let user = await getUserByFirebaseUid(firebaseUid);

    // 1. If user exists, return it
    if (user) {
      return res.json(user);
    }

    // 2. If no user, this is a new registration.
    let finalUsername = username;
    if (!finalUsername && firebaseUser.displayName) {
      finalUsername = firebaseUser.displayName;
    }
    if (!finalUsername && firebaseUser.email) {
      finalUsername = firebaseUser.email.split('@')[0];
    }
    
    if (!finalUsername) {
      return res.status(400).json({ error: 'Username is required for new registration' });
    }

    const cleanUsername = finalUsername.trim().substring(0, 20);

    let linkedAgentId: string | undefined = undefined;
    let agent: Agent | null = null;
    if (promoCode && typeof promoCode === 'string' && promoCode.trim() !== '') {
      agent = await getAgentByPromoCode(promoCode.trim());
      if (!agent) {
        return res.status(400).json({ error: 'Invalid or expired promo code.' });
      }
      linkedAgentId = agent.id;
    }
    
    const newId = firebaseUid; 
    const newUser: UserProfile = {
      id: newId,
      firebaseUid: firebaseUid,
      username: cleanUsername,
      email: email || firebaseUser.email || undefined,
      avatar: avatar || '🌸',
      balance: 10.0, // Welcome bonus
      winCount: 0,
      lossCount: 0,
      linkedAgentId: linkedAgentId,
      promoCode: promoCode,
      createdAt: Date.now(),
    };

    await createUser(newUser);
    
    addTransaction(newId, 'deposit', 10.0, undefined, 'Welcome signup bonus.');

    if (agent && linkedAgentId) {
        await linkAgentToPlayer(linkedAgentId, newId);
    }

    res.status(201).json(newUser);

  } catch (error) {
    console.error('Error during user login/registration:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Retrieve single profile
app.get('/api/users/:userId', async (req, res, next) => {
  if (req.params.userId === 'online' || req.params.userId === 'leaderboard') {
    return next();
  }

  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error("Failed to get user from database:", error);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
});

// Update profile
app.post('/api/users/:userId/update', async (req: any, res) => {
    const userIdToUpdate = req.params.userId;
    if (req.user.uid !== userIdToUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this profile.' });
    }

    try {
        const user = await getUserById(userIdToUpdate);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { username, avatar, isOfflinePreference } = req.body;
        const updateData: Partial<UserProfile> = {};

        if (username) updateData.username = username.trim().substring(0, 20);
        if (avatar) updateData.avatar = avatar;
        if (typeof isOfflinePreference === 'boolean') updateData.isOfflinePreference = isOfflinePreference;
        
        if (Object.keys(updateData).length > 0) {
            await updateUser(userIdToUpdate, updateData);
        }

        const updatedUser = await getUserById(userIdToUpdate);

        broadcastUserUpdate(userIdToUpdate);
        res.json(updatedUser);

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Update online/offline status preference
app.post('/api/users/:userId/status', async (req, res) => {
  const { userId } = req.params;
  const { isOffline } = req.body;

  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOfflinePreference = !!isOffline;
    await updateUser(userId, { isOfflinePreference });

    const updatedUser = await getUserById(userId);

    broadcastUserUpdate(userId);
    res.json({ success: true, isOfflinePreference: isOfflinePreference, user: updatedUser });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Wallet Deposits / Withdrawals
app.post('/api/wallet/deposit', async (req, res) => {
  const { userId, amount } = req.body;
  
  const depAmt = parseFloat(amount);
  if (isNaN(depAmt) || depAmt <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newBalance = user.balance + depAmt;
    await updateUser(userId, { balance: newBalance });

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: 'deposit',
      amount: depAmt,
      timestamp: Date.now(),
      description: `Deposited funds via Simulated Net Banking.`,
    };
    await createTransaction(tx);

    broadcastUserUpdate(userId);

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Error during deposit:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/api/wallet/withdraw', async (req, res) => {
  const { userId, amount } = req.body;
  
  const withAmt = parseFloat(amount);
  if (isNaN(withAmt) || withAmt <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  if (withAmt < 20) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is $20' });
  }

  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < withAmt) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const newBalance = user.balance - withAmt;
    await updateUser(userId, { balance: newBalance });

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: 'withdrawal',
      amount: withAmt,
      timestamp: Date.now(),
      description: `Withdrawn funds to bank account.`,
    };
    await createTransaction(tx);

    broadcastUserUpdate(userId);

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Error during withdrawal:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/api/wallet/request-manual-confirmation', async (req, res) => {
  const { userId, agentId, amount, phone, senderPhone, provider, transactionType } = req.body;

  if (!userId || !agentId || !amount || !provider || !transactionType) {
    return res.status(400).json({ error: 'Missing required fields. `userId`, `agentId`, `amount`, `provider`, and `transactionType` are all required.' });
  }

  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // ==> START PROMO CODE AGENT LOCK VALIDATION
  if (user.linkedAgentId && user.linkedAgentId !== agentId) {
    return res.status(400).json({ error: 'This account is locked to a specific agent. You can only transact with your assigned agent.' });
  }
  // <== END PROMO CODE AGENT LOCK VALIDATION
  
  if (transactionType === 'withdraw' && !phone) {
    return res.status(400).json({ error: 'Phone number is required for withdrawal requests.' });
  }

  if (transactionType === 'deposit' && !senderPhone) {
    return res.status(400).json({ error: 'Sender phone number is required for deposit requests.' });
  }

  const newRequest: ManualTransaction = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    username: user.username,
    agentId: agentId,
    amount: parseFloat(amount),
    phone, // This will be the destination for withdrawals
    senderPhone, // This is the source number for deposits
    provider,
    transactionType,
    status: 'pending',
    createdAt: Date.now(),
  };

  store.pendingManualTransactions.unshift(newRequest);
  await saveStoreAndWait();

  res.json({ success: true, message: 'Your request has been submitted for review.' });
});

app.get('/api/wallet/transactions/:userId', async (req: any, res) => {
  const userId = req.params.userId;
  // Security check: Ensure the authenticated user is requesting their own transactions
  if (req.user.uid !== userId) {
      return res.status(403).json({ error: 'You are not authorized to view these transactions.' });
  }

  try {
      const transactions = await getTransactionsByUserId(userId);
      res.json(transactions);
  } catch (error) {
      console.error(`Failed to get transactions for user ${userId}:`, error);
      res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

app.get('/api/payment/settings', (req, res) => {
  res.json(store.paymentProviders);
});

app.post('/api/wallet/process-api-payment', async (req, res) => {
  const { userId, amount, phone, senderPhone, provider, transactionType } = req.body;
  if (!userId || !amount || !provider || !transactionType) {
    return res.status(400).json({ error: 'Missing required api payment fields.' });
  }

  const providerKey = provider as PaymentProviderKey;
  const config = store.paymentProviders[providerKey];
  if (!config || !config.enabled || !config.apiKey) {
    return res.status(400).json({ error: 'API is not configured for this provider.' });
  }

  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  if (transactionType === 'withdraw') {
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required for withdrawal requests.' });
    }
    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient funds.' });
    }
    user.balance -= parsedAmount;
    await addTransaction(userId, 'withdrawal', parsedAmount, undefined, `API withdrawal via ${providerKey}.`);
    broadcastUserUpdate(userId);
    await saveStoreAndWait();
    return res.json({ success: true, balance: user.balance, message: 'Withdrawal processed via API.' });
  }

  if (transactionType === 'deposit') {
    if (!senderPhone) {
      return res.status(400).json({ error: 'Sender phone number is required for deposit requests.' });
    }
    user.balance += parsedAmount;
    await addTransaction(userId, 'deposit', parsedAmount, undefined, `API deposit via ${providerKey}.`);
    broadcastUserUpdate(userId);
    await saveStoreAndWait();
    return res.json({ success: true, balance: user.balance, message: 'Deposit processed via API.' });
  }

  return res.status(400).json({ error: 'Unsupported transaction type.' });
});

// VIP Subscription
app.post('/api/vip/subscribe', async (req: any, res) => {
  const { tier } = req.body;
  const firebaseUid = req.user.uid;

  const user = Object.values(store.users).find(u => u.firebaseUid === firebaseUid);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const vipTier = VIP_TIERS[tier];
  if (!vipTier) {
    return res.status(400).json({ error: 'Invalid VIP tier specified.' });
  }

  if (user.balance < vipTier.price) {
    return res.status(400).json({ error: 'Insufficient funds to purchase this VIP subscription.' });
  }

  // Deduct price from user's balance
  user.balance -= vipTier.price;

  // Calculate expiration date
  const startDate = Date.now();
  // Using 30 days for a month. A more accurate date calculation might use a library like moment.js or Date.UTC for precision
  const endDate = startDate + (vipTier.durationMonths * 30 * 24 * 60 * 60 * 1000); 

  // Update user's VIP status
  user.vip = {
    tier: tier,
    expires: endDate,
  };

  // Record transaction
  await addTransaction(user.id, 'app_commission', vipTier.price, undefined, `VIP Subscription (${vipTier.name}) purchase.`);

  await saveStoreAndWait();
  broadcastUserUpdate(user.id);

  res.json({ success: true, user, message: `Successfully subscribed to ${vipTier.name} VIP!` });
});


// ==========================================
// TOURNAMENT SYSTEM
// ==========================================

app.get('/api/tournaments', (req, res) => {
  const availableTournaments = Object.values(store.tournaments).filter(t => t.status === 'registration_open');
  res.json(availableTournaments);
});

app.get('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;
  const tournament = store.tournaments[id];
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found.' });
  }
  res.json(tournament);
});

app.post('/api/tournaments/:id/register', async (req: any, res) => {
  const { id } = req.params;
  const firebaseUid = req.user.uid;

  const user = Object.values(store.users).find(u => u.firebaseUid === firebaseUid);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const tournament = store.tournaments[id];
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found.' });
  }

  if (tournament.status !== 'registration_open') {
    return res.status(400).json({ error: 'Tournament is not open for registration.' });
  }

  if (user.balance < tournament.entryFee) {
    return res.status(400).json({ error: 'Insufficient funds to register for this tournament.' });
  }

  if (tournament.players.length >= tournament.maxPlayers) {
    return res.status(400).json({ error: 'Tournament is already full.' });
  }

  if (tournament.players.some(p => p.userId === user.id)) {
    return res.status(400).json({ error: 'You are already registered for this tournament.' });
  }

  // Deduct entry fee
  user.balance -= tournament.entryFee;
  await addTransaction(user.id, 'bet_escrow_locked', tournament.entryFee, id, `Tournament entry fee for "${tournament.name}".`);

  // Add player to tournament
  tournament.players.push({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  await saveStoreAndWait();
  broadcastUserUpdate(user.id);
  
  // Broadcast tournament update
  broadcastToAll('tournament_update', tournament);

  res.json({ success: true, tournament, message: `Successfully registered for ${tournament.name}!` });
});

// Admin tournament endpoints
app.get('/api/admin/tournaments', isAdmin, (req, res) => {
    res.json(Object.values(store.tournaments));
});

app.post('/api/admin/tournaments/create', isAdmin, async (req, res) => {
    const { name, entryFee, prizePool, maxPlayers, startDate } = req.body;

    if (!name || !entryFee || !prizePool || !maxPlayers || !startDate) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTournament: Tournament = {
        id: `tourney_${Date.now()}`,
        name,
        entryFee,
        prizePool,
        maxPlayers,
        startDate: new Date(startDate).getTime(),
        status: 'registration_open',
        players: [],
        rounds: [],
    };

    store.tournaments[newTournament.id] = newTournament;
    await saveStoreAndWait();

    res.status(201).json(newTournament);
});


async function handleTournamentMatchWin(tournamentId: string, matchId: string, winnerId: string) {
  const tournament = store.tournaments[tournamentId];
  if (!tournament) return;

  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return;

  match.winnerId = winnerId;
  match.status = 'completed';

  const allMatchesInRoundComplete = tournament.matches
    .filter(m => m.round === tournament.currentRound)
    .every(m => m.status === 'completed');

  if (allMatchesInRoundComplete) {
    const winners = tournament.matches
      .filter(m => m.round === tournament.currentRound)
      .map(m => m.winnerId)
      .filter((id): id is string => id !== null)
      .map(id => tournament.players.find(p => p.userId === id))
      .filter((p): p is { userId: string; username: string; avatar: string; } => p !== undefined);

    if (winners.length === 1) {
      // Tournament winner!
      tournament.winnerId = winners[0].userId;
      tournament.status = 'completed';
      tournament.endDate = Date.now();

      // Distribute prize
      const winnerUser = store.users[winners[0].userId];
      if (winnerUser) {
        winnerUser.balance += tournament.prizePool;
        await addTransaction(winnerUser.id, 'win_payout', tournament.prizePool, tournament.id, `Tournament "${tournament.name}" prize.`);
        broadcastUserUpdate(winnerUser.id);
      }
      broadcastToAll('tournament_ended', tournament);
    } else {
      // Generate next round
      tournament.currentRound++;
      const nextRoundMatches: TournamentMatch[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        const nextMatch: TournamentMatch = {
          id: `tm_${tournament.id}_r${tournament.currentRound}_${i / 2}`,
          tournamentId: tournament.id,
          round: tournament.currentRound,
          player1: winners[i],
          player2: winners[i + 1] || null,
          winnerId: winners[i + 1] ? null : winners[i].userId,
          roomId: null,
          status: winners[i + 1] ? 'pending' : 'completed',
        };
        nextRoundMatches.push(nextMatch);
      }
      tournament.matches.push(...nextRoundMatches);

      // Create Ludo rooms for each pending match
      for (const nextMatch of nextRoundMatches) {
        if (nextMatch.status === 'pending' && nextMatch.player1 && nextMatch.player2) {
          const room = await startMatchedRoom(
            [nextMatch.player1, nextMatch.player2],
            0, 2, 'solo'
          );
          nextMatch.roomId = room.id;
          nextMatch.status = 'in_progress';
          room.tournamentDetails = { tournamentId: tournament.id, matchId: nextMatch.id };
        }
      }
      broadcastToAll('tournament_update', tournament);
    }
  }

  await saveStoreAndWait();
}

function createTournamentBracket(tournament: Tournament): TournamentMatch[] {
  const players = [...tournament.players];
  // Shuffle players to randomize matchups
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  const matches: TournamentMatch[] = [];
  for (let i = 0; i < players.length; i += 2) {
    const match: TournamentMatch = {
      id: `tm_${tournament.id}_r1_${i / 2}`,
      tournamentId: tournament.id,
      round: 1,
      player1: players[i],
      player2: players[i + 1] || null,
      winnerId: players[i + 1] ? null : players[i].userId,
      roomId: null,
      status: players[i + 1] ? 'pending' : 'completed',
    };
    matches.push(match);
  }
  return matches;
}

function checkAndStartTournaments() {
  const now = Date.now();
  Object.values(store.tournaments).forEach(async (t) => {
    if (t.status === 'registration_open' && now >= t.startDate && t.players.length >= 2) {
      t.status = 'in_progress';
      t.matches = createTournamentBracket(t);
      t.currentRound = 1;

      // Create Ludo rooms for each pending match
      for (const match of t.matches) {
        if (match.status === 'pending' && match.player1 && match.player2) {
          const room = await startMatchedRoom(
            [match.player1, match.player2],
            0, // No extra bet for tournament matches
            2, 'solo'
          );
          match.roomId = room.id;
          match.status = 'in_progress';
          room.tournamentDetails = { tournamentId: t.id, matchId: match.id };
        }
      }

      await saveStoreAndWait();
      broadcastToAll('tournament_started', t);
    }
  });
}

setInterval(checkAndStartTournaments, 10000); // Check every 10 seconds

// ==========================================
// 5. MATCHMAKING & LOBBY SYSTEM
// ==========================================

// GET /api/rooms/active
// Returns a list of all currently active games that can be spectated.
app.get('/api/rooms/active', (req, res) => {
  const activeGames = Object.values(store.rooms)
    .filter(r => r.status === 'playing')
    .map(r => ({
      id: r.id, // Changed from roomId to id to match GameRoom type
      players: r.players.map(p => ({
        userId: p.userId, // Added userId
        username: p.username,
        avatar: p.avatar,
      })),
      betAmount: r.betAmount,
      gameMode: r.gameMode,
      capacity: r.capacity,
    }));
  res.json(activeGames);
});

// POST /api/rooms/:roomId/stop-spectating
// Allows a user to stop spectating a game.
app.post('/api/rooms/:roomId/stop-spectating', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const room = store.rooms[roomId];
  if (!room) {
    // It's possible the room was deleted while the user was spectating.
    // In this case, just ensure the client state is clean.
    const client = activeClients.find(c => c.userId === userId && c.spectatingRoomId === roomId);
    if (client) {
      client.spectatingRoomId = undefined;
    }
    return res.json({ success: true, message: 'Stopped spectating a room that no longer exists.' });
  }

  const client = activeClients.find(c => c.userId === userId && c.spectatingRoomId === roomId);
  if (client) {
    client.spectatingRoomId = undefined;
    console.log(`User ${userId} stopped spectating room ${roomId}`);
  }

  // Broadcast an update to the room to remove the spectator from the list
  broadcastToRoom(roomId, 'game_update', room);

  res.json({ success: true, message: 'Stopped spectating.' });
});

// Join Room via Code
app.post('/api/rooms/join', async (req, res) => {
  const { userId, roomCode } = req.body;

  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = (roomCode || '').trim().toUpperCase();
    const room = await getRoomById(code);
    if (!room) {
      return res.status(404).json({ error: 'Room code not found.' });
    }

    if (room.players.some(p => p.userId === userId)) {
      return res.json(room);
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Match has already started or been completed.' });
    }

    if (room.players.length >= room.capacity) {
      return res.status(400).json({ error: `Room is already full at ${room.capacity} capacity.` });
    }

    if (user.balance < room.betAmount) {
      return res.status(400).json({ error: `You need at least $${room.betAmount} in your wallet to join this room.` });
    }

    const host = room.players.find(p => p.isHost);
    if (!host) {
      return res.status(500).json({ error: 'Could not find the host for this room.' });
    }

    // The user data to be sent to the host for approval
    const pendingPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
    sendEventToUser(host.userId, 'join_request', pendingPlayer);

    res.json({ status: 'pending_approval', message: 'Your request to join has been sent to the host.' });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'An internal server error occurred while trying to join the room.' });
  }
});

// GET Room (for spectators or re-joining)
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json(room);
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    res.status(500).json({ error: 'An internal server error occurred while fetching the room.' });
  }
});

// Player submits a deposit or withdrawal request to an agent
app.post('/api/request-to-agent', async (req: any, res) => {
    const player: UserProfile | null = await getUserById(req.user.uid);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const { agentId, amount, type, playerPhone, provider } = req.body;
    const requestAmount = parseFloat(amount);

    if (player.linkedAgentId && player.linkedAgentId !== agentId) {
      return res.status(400).json({ error: 'This account is locked to a specific agent. You can only transact with your assigned agent.' });
    }

    if (!agentId || !requestAmount || requestAmount <= 0 || !['deposit', 'withdrawal'].includes(type) || !playerPhone || !provider) {
        return res.status(400).json({ error: 'Missing or invalid parameters. Requires agentId, amount, type, playerPhone, and provider.' });
    }

    if (type === 'withdrawal' && player.balance < requestAmount) {
        return res.status(400).json({ error: 'Insufficient balance for this withdrawal request.' });
    }

    try {
        const agent = await getAgentById(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'The selected agent does not exist.' });
        }
        
        const newRequest: PlayerAgentRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            playerId: player.id,
            playerUsername: player.username,
            playerAvatar: player.avatar,
            agentId: agentId,
            playerPhone: playerPhone,
            provider: provider,
            type: type,
            amount: requestAmount,
            status: 'pending',
            createdAt: Date.now(),
        };

        await createPlayerAgentRequest(newRequest);

        res.status(201).json({ success: true, message: 'Your request has been sent to the agent.', request: newRequest });

    } catch (error: any) {
        console.error(`Player ${player.id} failed to create request to agent ${agentId}:`, error);
        res.status(500).json({ 
            error: 'An internal server error occurred while submitting your request.',
            details: error.message || 'No specific error message available.'
        });
    }
});

// Helper to build and start a matched game room
async function startMatchedRoom(matchedUsers: Array<{ id: string; username: string; avatar: string; winCount?: number; lossCount?: number; balance: number }>, bet: number, cap: number, mode: 'solo' | 'team'): Promise<GameRoom> {
  const roomId = `MATCH_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  let colors: PlayerColor[];

  if (cap === 2 && mode === 'solo') {
    // For 2-player games, use Green (Host) and Blue (Challenger)
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
    if (!isBotPlayer(p.userId)) {
      const u = store.users[p.userId];
      if (u) {
        u.balance = Math.max(0, u.balance - bet);
        await addTransaction(p.userId, 'bet_escrow_locked', bet, roomId, `Escrow stake for Ludo Match ${roomId}.`);
        broadcastUserUpdate(p.userId);
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
    status: 'playing', // Starts immediately
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
  await saveStoreAndWait();

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
app.post('/api/rooms/matchmaking/enter-queue', async (req, res) => {
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

    if (!store.matchmakingQueues[queueKey]) {
      store.matchmakingQueues[queueKey] = [];
    }

    if (store.matchmakingQueues[queueKey].includes(userId)) {
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

    (user as any).seekingJoinedAt = Date.now();
    store.matchmakingQueues[queueKey].push(userId);

    await addUserToMatchmakingQueue({
      userId: userId,
      username: user.username,
      avatar: user.avatar,
      betAmount: bet,
      capacity: cap,
      gameMode: mode,
      status: 'WAITING_FOR_MATCH',
      timestamp: Date.now()
    });

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

  const cap = parseInt(capacity) || 2;
  const mode = gameMode === 'team' ? 'team' : 'solo';

  // Remove both users from all matchmaking queues
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter(id => id !== userId && id !== opponentId);
  }
  if (store.users[userId]) delete (store.users[userId] as any).seekingJoinedAt;
  if (store.users[opponentId]) delete (store.users[opponentId] as any).seekingJoinedAt;

  // Clean up database matchmaking documents
  await removeUsersFromMatchmakingQueue([userId, opponentId]);

  const matchedList = [user, oppUser].map(u => ({ ...u, balance: u.balance || 0 }));
  // For a direct 1v1 challenge, capacity is always 2 and mode is solo.
  const finalCapacity = 2;
  const finalMode = 'solo';
  const room = await startMatchedRoom(matchedList, bet, finalCapacity, finalMode);
  // Notify both players instantly over SSE with redirect payload
  matchedList.forEach(p => {
    if (!isBotPlayer(p.id)) {
      sendEventToUser(p.id, 'matchmaker_success', { roomId: room.id, room });
      broadcastToAll('matchmaker_seeking_cancelled', { senderId: p.id });
    }
  });
  broadcastToAll('online_players_updated', {});
  await saveStoreAndWait();

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
    
    broadcastToAll('matchmaker_seeking_cancelled', { senderId: userId });

    // Also delete matchmaking record in the database
    removeUsersFromMatchmakingQueue([userId]).catch(err => {
      console.error('Failed to delete matchmaking record from database on leave:', err);
    });
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
        seekingJoinedAt: (u as any).seekingJoinedAt || Date.now(),
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
    const matchedList = [sender, receiverUser].map(u => ({ ...u, balance: u.balance || 0 }));
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

  /*
  if (isReceiverSeeking) {
    // Both are ready, create match instantly!
    const matchedList = [sender, receiverUser];
    // If capacity > 2, add bots to fill the room
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
    
    // Notify receiver directly that they are matched!
    sendEventToUser(receiverId, 'matchmaker_success', { roomId: room.id, room });
    broadcastToAll('matchmaker_seeking_cancelled', { senderId: receiverId });
    
    return res.json({ success: true, roomId: room.id, room });
  }
  */

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
  

  const hostId = room.players.find(p => p.isHost)?.userId;
  if (hostId) {
    sendEventToUser(hostId, 'game_invite_accepted', { roomId });
  }

  res.json({ success: true, roomId });
});



// Ready Up / Toggle Ready
app.post('/api/rooms/ready', (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const p = room.players.find(p => p.userId === userId);
  if (!p) return res.status(404).json({ error: 'Player not in room' });

  p.isReady = !p.isReady;
  addLog(room, `${p.username} is ${p.isReady ? 'READY' : 'NOT READY'}.`);
  

  broadcastToRoom(room.id, 'game_update', room);
  res.json(room);
});

// Start Match (Host only)
app.post('/api/rooms/start', async (req, res) => {
  const { userId, roomId } = req.body;

  try {
    // The startGame function handles all the transactional logic now.
    const updatedRoom = await startGame(roomId, userId);

    // The color assignment logic and other pre-start checks are now inside startGame.
    // If successful, broadcast the update to all players in the room.
    broadcastToRoom(roomId, 'game_update', updatedRoom);

    // Also update the individual users' balances via SSE if they are connected
    updatedRoom.players.forEach(player => {
        if (!isBotPlayer(player.userId)) {
            // We can't get the full user object back from startGame easily,
            // so we trigger a refetch on the client-side by sending a simple update event.
            sendEventToUser(player.userId, 'user_balance_update', {});
        }
    });

    res.json(updatedRoom);

  } catch (error) {
    console.error(`Error starting game ${roomId}:`, error);
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
    
    // Send specific error messages to the client
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: errorMessage });
    }
    if (errorMessage.includes('Only the host') || errorMessage.includes('already started') || errorMessage.includes('At least 2 players') || errorMessage.includes('insufficient balance')) {
      return res.status(400).json({ error: errorMessage });
    }

    res.status(500).json({ error: 'An internal server error occurred while trying to start the game.' });
  }
});

// Dice Roll Action
app.post('/api/rooms/roll-dice', (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status !== 'playing') return res.status(400).json({ error: 'Game is not in playing state.' });

  const gs = room.gameState;
  const activePlayer = room.players[gs.turn];

  // Reset inactivity timer since player made a move
  if (activePlayer) activePlayer.inactivityTimer = 300;

  gs.turnTimer = 30; // Reset the short turn timer

  if (!activePlayer || activePlayer.userId !== userId) {
    return res.status(403).json({ error: "It is not your turn to roll!" });
  }

  if (gs.hasRolled) {
    return res.status(400).json({ error: "You have already rolled the dice!" });
  }

  // Generate Roll
  const d = Math.floor(Math.random() * 6) + 1;
  gs.diceRoll = d;
  gs.lastDiceRoll = d;
  gs.hasRolled = true;

  addLog(room, `🎲 ${activePlayer.username} rolled a ${d}!`);

  // Triple 6s Check
  if (d === 6) {
    gs.consecutiveSixes = (gs.consecutiveSixes || 0) + 1;
  } else {
    gs.consecutiveSixes = 0;
  }

  if (gs.consecutiveSixes === 3) {
    addLog(room, `⚠️ Triple 6 Penalty! ${activePlayer.username} rolled three 6s in a row. Turn forfeited!`);
    gs.consecutiveSixes = 0;
    // The turn is forfeited, so we advance to the next player.
    // We also nullify the roll to prevent the UI from thinking a move is pending.
    gs.diceRoll = null;
    gs.hasRolled = false;
    
    // Advance turn synchronously
    advanceTurn(room);
    
    broadcastToRoom(room.id, 'game_update', room);
    executeBotTurnIfActive(room);

    return res.json(room);
  }

  // Analyze if there are valid moves
  const playerTokens = gs.tokens.filter(t => t.color === activePlayer.color);
  const validTokens = playerTokens.filter(t => isMoveValid(t, d));

  if (validTokens.length === 0) {
    // No moves possible, turn ends automatically.
    // FIRST, broadcast the result of the roll so all clients can see the animation.
    addLog(room, `${activePlayer.username} has no valid moves with roll ${d}. Turn passes.`);
    
    broadcastToRoom(room.id, 'game_update', room);
    res.json(room); // Respond to the roller immediately.

    // SECOND, after a delay to allow for the animation, advance the turn and broadcast again.
    setTimeout(() => {
      // Re-fetch the room to ensure we're acting on the latest state
      const currentRoom = store.rooms[roomId];
      if (currentRoom && currentRoom.status === 'playing') {
        advanceTurn(currentRoom);
        
        broadcastToRoom(currentRoom.id, 'game_update', currentRoom);
        executeBotTurnIfActive(currentRoom);
      }
    }, 1500); // 1.5-second delay for clients to see the roll animation

  } else {
    // There are valid moves, so we just update the state and wait for the player's move.
    
    broadcastToRoom(room.id, 'game_update', room);
    res.json(room);
  }
});

// Send Chat Message
app.post('/api/rooms/chat', (req, res) => {
  const { userId, roomId, text } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const player = room.players.find(pl => pl.userId === userId);
  const spectator = activeClients.find(c => c.userId === userId && c.spectatingRoomId === roomId);

  if (!player && !spectator) {
    return res.status(403).json({ error: 'You are not in this room as a player or spectator.' });
  }

  const cleanText = (text || '').trim().substring(0, 100);
  if (cleanText.length > 0) {
    const senderName = player ? player.username : (store.users[userId]?.username || 'Spectator');
    
    const chatMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: userId,
      senderName: senderName,
      text: cleanText,
      timestamp: Date.now(),
      isSpectator: !player, // Mark as spectator message if not a player
    };
    room.gameState.chat.push(chatMsg);
    if (room.gameState.chat.length > 30) {
      room.gameState.chat.shift();
    }
    
    broadcastToRoom(room.id, 'game_update', room);
  }

  res.json(room);
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

// Leave / Forfeit Game Room
app.post('/api/rooms/leave', async (req, res) => {
  const { userId, roomId } = req.body;

  try {
    const updatedRoom = await removePlayerFromRoom(roomId, userId);

    if (updatedRoom) {
      // Room still exists, broadcast update
      broadcastToRoom(roomId, 'game_update', updatedRoom);
    } else {
      // Room was deleted (last player left)
      broadcastToRoom(roomId, 'room_deleted', { roomId });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'An internal server error occurred while leaving the room.' });
  }
});

// Check if a game is active and the user can rejoin
app.get('/api/rooms/check-status/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'playing') {
    // Return a 409 Conflict status to indicate the game is not in a rejoinable state.
    return res.status(409).json({ error: 'Game is not in a rejoinable state (e.g., waiting or completed).', room });
  }

  const playerInRoom = room.players.find(p => p.userId === userId && p.status !== 'left');
  if (!playerInRoom) {
    return res.status(403).json({ error: 'You are not a player in this game' });
  }

  // Player is in the room and game is active. Return room data.
  res.json(room);
});

// New Login endpoint for admin
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const allAdmins = await getAllAdminUsers();

        if (allAdmins.length === 0) {
            console.log('No admin users found. Creating first admin user from login credentials.');
            const newAdminId = `admin_${Date.now()}`;
            const newAdmin: AdminUser = {
                id: newAdminId,
                username,
                password_hash: password, // Password should be hashed in a real application
                permissions: ['all'],
                name: 'Super Admin',
            };
            await createAdminUser(newAdmin);
            console.log(`Created new admin: ${username}`);
            
            const { password: _, ...userToReturn } = newAdmin;
            return res.json({ success: true, user: userToReturn });
        }

        const adminUser = await getAdminUserByUsername(username);

        if (!adminUser) {
            return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        }

        // IMPORTANT: Passwords should be hashed. This is a plain text comparison for now.
        if (adminUser.password_hash === password) {
            const { password_hash: _, ...userToReturn } = adminUser;
            res.json({ success: true, user: userToReturn });
        } else {
            res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        }
    } catch (error) {
        console.error('Admin login failed:', error);
        res.status(500).json({ error: 'An error occurred during admin login.' });
    }
});

// Endpoint to create a new admin user. Only accessible by a root admin with 'all' permission.
app.post('/api/admin/admins/create', /* hasPermission('all'), */ async (req, res) => {
    const { username, password, permissions } = req.body;

    if (!username || !password || !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Username, password, and a list of permissions are required.' });
    }

    try {
        const existingAdmin = await getAdminUserByUsername(username);
        if (existingAdmin) {
            return res.status(409).json({ error: 'An admin with this username already exists.' });
        }
        
        const newAdminId = `admin_${Date.now()}`;
        const newAdmin: AdminUser = {
            id: newAdminId,
            username,
            password_hash: password, // In a real app, this MUST be hashed.
            permissions,
            name, // Adding the role name field
        };

        await createAdminUser(newAdmin);
        
        const { password_hash: _, ...userToReturn } = newAdmin;
        res.status(201).json({ success: true, user: userToReturn });

    } catch (error) {
        console.error('Failed to create admin user:', error);
        res.status(500).json({ error: 'Failed to create admin user.' });
    }
});


// A temporary replacement for the old isAdmin to bridge the transition.
// It verifies that the request comes from a valid admin user in the new system,
// but doesn't check for specific granular permissions.
// This will be replaced with hasPermission('permission_name') calls on each endpoint.
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminId = req.query.userId as string;
    if (!adminId) {
        return res.status(403).json({ error: 'Access denied. Admin user ID is required.' });
    }

    try {
        const adminUser = await getAdminUserById(adminId);
        if (adminUser) {
            next(); // It's a valid admin, let them pass for now.
        } else {
            res.status(403).json({ error: 'Access denied. Invalid admin user.' });
        }
    } catch (error) {
        console.error('Admin validation failed:', error);
        res.status(500).json({ error: 'An error occurred during admin validation.' });
    }
};

app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
        const roles = await getAllAdminUsers();
        res.json({
            username: store.adminSettings?.username || process.env.ADMIN_USERNAME || 'admin',
            passwordConfigured: Boolean(store.adminSettings?.password),
            roles: roles.map(r => {
                const { password_hash, ...roleData } = r;
                return roleData;
            }),
        });
    } catch (error) {
        console.error('Failed to retrieve admin roles:', error);
        res.status(500).json({ error: 'Failed to retrieve admin roles.' });
    }
});

app.post('/api/admin/settings', isAdmin, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.query.userId as string;

    if (!adminId) {
        return res.status(400).json({ error: 'Admin ID is required.' });
    }

    // Only allow changing password for now, not username
    if (typeof newPassword !== 'string' || !newPassword.trim()) {
        return res.status(400).json({ error: 'New password is required.' });
    }
    
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation must match.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    
    try {
        const adminUser = await getAdminUserById(adminId);

        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user not found.' });
        }

        // IMPORTANT: Passwords are in plain text as per existing system.
        if (adminUser.password_hash !== currentPassword) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        // Update the password in the database
        await updateAdminUser(adminId, { password_hash: newPassword });

        res.json({ success: true, message: 'Password updated successfully.' });

    } catch (error) {
        console.error(`Failed to update password for admin ${adminId}:`, error);
        res.status(500).json({ error: 'An error occurred while updating the password.' });
    }
});

app.post('/api/admin/roles/create', /* hasPermission('all'), */ async (req, res) => {
    const { username, password, permissions, name } = req.body;

    if (!username || !password || !Array.isArray(permissions) || !name) {
        return res.status(400).json({ error: 'Role Name, username, password, and a list of permissions are required.' });
    }

    try {
        const existingAdmin = await getAdminUserByUsername(username);
        if (existingAdmin) {
            return res.status(409).json({ error: 'An admin with this username already exists.' });
        }
        
        const newAdminId = `admin_${Date.now()}`;
        const newAdmin: AdminUser = {
            id: newAdminId,
            username,
            password_hash: password, // In a real app, this MUST be hashed.
            permissions,
            name, // Adding the role name field
        };

        await createAdminUser(newAdmin);
        
        const { password_hash: _, ...userToReturn } = newAdmin;
        res.status(201).json({ success: true, user: userToReturn });

    } catch (error) {
        console.error('Failed to create admin user:', error);
        res.status(500).json({ error: 'Failed to create admin user.' });
    }
});

// Delete an admin user/role
app.delete('/api/admin/roles/:roleId/delete', /* hasPermission('all'), */ async (req, res) => {
    const { roleId } = req.params;
    if (!roleId) {
        return res.status(400).json({ error: 'Admin user ID is required.' });
    }

    try {
        const adminUser = await getAdminUserById(roleId);
        
        if (!adminUser) {
            return res.status(404).json({ error: 'Admin user not found.' });
        }
        
        const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : JSON.parse(adminUser.permissions as any as string);
        if (permissions.includes('all')) {
            const allAdmins = await getAllAdminUsers();
            const superAdmins = allAdmins.filter(admin => {
                const perms = Array.isArray(admin.permissions) ? admin.permissions : JSON.parse(admin.permissions as any as string);
                return perms.includes('all');
            });
            if (superAdmins.length <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last super administrator.' });
            }
        }
        
        await deleteAdminUser(roleId);
        res.json({ success: true, message: 'Admin user deleted successfully.' });

    } catch (error) {
        console.error('Failed to delete admin user:', error);
        res.status(500).json({ error: 'Failed to delete admin user.' });
    }
});

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

// Get all pending manual transactions
app.get('/api/admin/manual-transactions', isAdmin, (req, res) => {
    res.json(store.pendingManualTransactions || []);
});

app.get('/api/admin/payment-settings', isAdmin, (req, res) => {
    res.json(store.paymentProviders);
});

app.post('/api/admin/payment-settings', isAdmin, async (req, res) => {
    const { paymentProviders, agentFloatInstructions } = req.body;

    if (paymentProviders && typeof paymentProviders === 'object') {
        store.paymentProviders = {
            ...DEFAULT_PAYMENT_PROVIDERS,
            ...paymentProviders
        };
    }

    if (typeof agentFloatInstructions === 'string') {
        store.agentFloatInstructions = agentFloatInstructions;
    }

    const syncResult = await saveStoreAndWait();
    
    res.json({ 
        success: true, 
        paymentProviders: store.paymentProviders,
        agentFloatInstructions: store.agentFloatInstructions,
        syncStatus: syncResult
    });
});

// Approve a manual transaction
app.post('/api/admin/manual-transactions/:transactionId/approve', isAdmin, async (req, res) => {
    const { transactionId } = req.params;
    const tx = store.pendingManualTransactions.find(t => t.id === transactionId);

    if (!tx || tx.status !== 'pending') {
        return res.status(404).json({ error: 'Pending transaction not found or already processed.' });
    }

    const user = store.users[tx.userId];
    if (!user) {
        return res.status(404).json({ error: 'User associated with transaction not found.' });
    }

    if (tx.transactionType === 'deposit') {
        user.balance += tx.amount;
        addTransaction(user.id, 'deposit', tx.amount, undefined, `Manual deposit approved by admin. Request ID: ${tx.id}`);
    } else { // withdrawal
        if (user.balance < tx.amount) {
            // Not enough balance, reject it instead
            tx.status = 'rejected';
            await saveStoreAndWait();
            // No balance change needed since funds were never held
            return res.status(400).json({ error: 'Insufficient balance to approve this withdrawal request. Transaction has been rejected.' });
        }
        user.balance -= tx.amount;
        addTransaction(user.id, 'withdrawal', tx.amount, undefined, `Manual withdrawal approved by admin. Request ID: ${tx.id}`);
    }

    tx.status = 'approved';
    await saveStoreAndWait();

    broadcastUserUpdate(user.id);
    res.json({ success: true, transaction: tx });
});

// Reject a manual transaction
app.post('/api/admin/manual-transactions/:transactionId/reject', isAdmin, async (req, res) => {
    const { transactionId } = req.params;
    const tx = store.pendingManualTransactions.find(t => t.id === transactionId);

    if (!tx || tx.status !== 'pending') {
        return res.status(404).json({ error: 'Pending transaction not found or already processed.' });
    }

    const user = store.users[tx.userId];
    if (!user) {
        // Even if user not found, we can still mark transaction as rejected
        tx.status = 'rejected';
        await saveStoreAndWait();
        return res.status(404).json({ error: 'User associated with transaction not found. Transaction rejected.' });
    }
    
    // On rejection, no balance change should occur. Funds are only moved on approval.
    // The previous logic incorrectly "refunded" money that was never taken.
    tx.status = 'rejected';
    await saveStoreAndWait();
    
    // Notify the user their request was rejected, but their balance is unchanged.
    sendEventToUser(user.id, 'user_notification', {
        type: 'info',
        message: `Your ${tx.transactionType} request for $${tx.amount} was rejected.`
    });
    
    res.json({ success: true, transaction: tx });
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

// ==================================
// AGENT-RELATED ADMIN ENDPOINTS
// ==================================

// Get all agents
app.get('/api/admin/agents', isAdmin, async (req, res) => {
  try {
    const agents = await getAgents();
    res.json(agents);
  } catch (error) {
    console.error('Failed to get agents:', error);
    res.status(500).json({ error: 'Failed to retrieve agents from database.' });
  }
});

// Create a new agent
app.post('/api/admin/agents/create', isAdmin, async (req, res) => {
  const { username, password, commissionRate, location, phone, promoCode } = req.body;

  if (!username || !password || !commissionRate || !phone) {
    return res.status(400).json({ error: 'Username, password, commission rate, and phone are required.' });
  }

  // More validation
  if (typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'Username must be a string of at least 3 characters.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be a string of at least 6 characters.' });
  }
  const rate = parseFloat(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({ error: 'Commission rate must be a number between 0 and 1.' });
  }

  try {
    const existingAgent = await getAgentByUsername(username);
    if (existingAgent) {
      return res.status(409).json({ error: 'Agent with this username already exists.' });
    }

    if (promoCode && typeof promoCode === 'string' && promoCode.trim() !== '') {
        const existingPromoAgent = await getAgentByPromoCode(promoCode.trim());
        if (existingPromoAgent) {
            return res.status(400).json({ error: 'Promo code is already in use.' });
        }
    }

    const agentId = `agent_${Date.now()}`;
    const newAgent: Agent = {
      id: agentId,
      username,
      password, // In a real app, this should be hashed and salted
      phone,
      location: location || '',
      commissionRate: rate,
      promoCode: (promoCode && typeof promoCode === 'string') ? promoCode.trim() : '',
      balance: 0,
      floatBalance: 0,
      status: 'Active',
      createdAt: Date.now(),
    };

    await createAgent(newAgent);

    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Failed to create agent:', error);
    res.status(500).json({ error: 'Failed to create agent in database.' });
  }
});


// Get all agent requests for admin view
app.get('/api/admin/agent-requests', isAdmin, async (req, res) => {
  try {
    const requests = await getAgentRequests();
    res.json(requests);
  } catch (error) {
    console.error('Failed to get agent requests:', error);
    res.status(500).json({ error: 'Failed to retrieve agent requests.' });
  }
});

// Reject an agent float request
app.post('/api/admin/agent-requests/:requestId/reject', isAdmin, async (req, res) => {
    const { requestId } = req.params;
    const adminId = req.query.userId as string;

    try {
        await rejectAgentRequest(requestId, adminId);
        res.json({ success: true, message: 'Agent float request rejected.' });
    } catch (error) {
        console.error(`Failed to reject agent request ${requestId}:`, error);
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('not found') || errorMessage.includes('processed')) {
            return res.status(404).json({ error: errorMessage });
        }
        res.status(500).json({ error: `Failed to reject agent request in database: ${errorMessage}` });
    }
});





// Delete a user
// app.delete('/api/admin/users/:userId/delete', isAdmin, (req, res) => {

// Update an existing agent
app.put('/api/admin/agents/:agentId', isAdmin, async (req, res) => {
    const { agentId } = req.params;
    const { commissionRate, status, location } = req.body;

    try {
        const agent = await getAgentById(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found.' });
        }

        const updates: Partial<Agent> = {};
        if (commissionRate) updates.commissionRate = parseFloat(commissionRate);
        if (status) updates.status = status;
        if (location !== undefined) updates.location = location;

        await updateAgent(agentId, updates);
        res.json({ success: true, message: 'Agent updated.' });
    } catch (error) {
        console.error(`Failed to update agent ${agentId}:`, error);
        res.status(500).json({ error: 'Failed to update agent.' });
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
    if (room.betAmount > 0) {
        for (const p of room.players) {
            if (!isBotPlayer(p.userId)) {
                const user = store.users[p.userId];
                if (user) {
                    user.balance += room.betAmount;
                    await addTransaction(p.userId, 'refund', room.betAmount, room.id, `Refund for canceled match ${room.id}.`);
                    broadcastUserUpdate(p.userId);
                }
            }
        }
    }

    addLog(room, `Game canceled by admin. Bets refunded.`);
    broadcastToRoom(room.id, 'game_canceled', { roomId });
    
    delete store.rooms[roomId];
    await saveStoreAndWait();
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
// 6a. AGENT API ENDPOINTS
// ==========================================

// Agent Login
app.post('/api/agent/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const agent = await getAgentByUsername(username);

        if (!agent) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // WARNING: Plaintext password comparison. Not secure.
        if (agent.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        if (agent.status !== 'Active') {
            return res.status(403).json({ error: 'This agent account is not active.' });
        }

        res.json({ success: true, agent });

    } catch (error) {
        console.error('Agent login failed:', error);
        res.status(500).json({ error: 'An internal server error occurred during login.' });
    }
});


// Middleware to check for agent access
async function isAgent(req: any, res: express.Response, next: express.NextFunction) {
    const agentId = req.query.agentId as string;
    if (!agentId) {
        return res.status(401).json({ error: 'Agent ID is required for this operation.' });
    }
    
    try {
        const agent = await getAgentById(agentId);

        if (!agent) {
            return res.status(403).json({ error: 'Access denied. Invalid agent ID.' });
        }
        
        if (agent.status !== 'Active') {
            return res.status(403).json({ error: 'Access denied. Inactive agent ID.' });
        }

        req.agent = agent; // Attach agent object to the request
        next();
    } catch (error) {
        console.error('Agent verification failed:', error);
        res.status(500).json({ error: 'Failed to verify agent status.' });
    }
}

// Get agent's own profile data
app.get('/api/agent/profile', isAgent, (req, res) => {
    // The isAgent middleware now attaches the full agent object from Firestore.
    const agent = (req as any).agent;
    res.json(agent);
});

// Search for a player by username
app.get('/api/agent/player-lookup', isAgent, (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ error: 'A search query of at least 2 characters is required.' });
    }

    const lowerCaseQuery = query.toLowerCase();
    const results = Object.values(store.users)
        .filter(u => u.username.toLowerCase().includes(lowerCaseQuery) && !u.id.startsWith('bot_'))
        .map(u => ({ id: u.id, username: u.username, avatar: u.avatar })) // Return minimal info
        .slice(0, 10); // Limit results

    res.json(results);
});

// Get agent's own transaction history
app.get('/api/agent/transactions', isAgent, async (req: any, res) => {
    const agent = req.agent;
    try {
        const transactions = await getAgentTransactions(agent.id);
        res.json(transactions);
    } catch (error) {
        console.error(`Failed to get transactions for agent ${agent.id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve agent transactions.' });
    }
});

// Deposit funds from an agent's float to a player's wallet
app.post('/api/agent/deposit', isAgent, async (req: any, res) => {
    const agent: Agent = req.agent;
    const { playerId, amount } = req.body;
    const depositAmount = parseFloat(amount);

    if (!playerId || !depositAmount || depositAmount <= 0) {
        return res.status(400).json({ error: 'Valid playerId and a positive amount are required.' });
    }
    
    try {
        const { newAgentBalance, newPlayerBalance } = await depositToPlayer(agent.id, playerId, depositAmount);

        broadcastUserUpdate(playerId);
        
        res.json({ success: true, newAgentBalance, newPlayerBalance });

    } catch (error) {
        console.error(`Agent ${agent.id} failed to deposit to player ${playerId}:`, error);
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
        if (errorMessage.includes('Insufficient') || errorMessage.includes('not found')) {
            return res.status(400).json({ error: errorMessage });
        }
        res.status(500).json({ error: `Failed to process deposit: ${errorMessage}` });
    }
});


// Agent requests for more float
app.post('/api/agent/request-float', isAgent, async (req: any, res) => {
    const agent: Agent = req.agent;
    const { amount } = req.body;
    const requestAmount = parseFloat(amount);

    if (!requestAmount || requestAmount <= 0) {
        return res.status(400).json({ error: 'A positive amount is required.' });
    }

    try {
        const newRequest: AgentRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            agentId: agent.id,
            agentUsername: agent.username,
            amount: requestAmount,
            status: 'pending',
            createdAt: Date.now(),
        };

        await createPlayerAgentRequest(newRequest);

        res.status(201).json({ success: true, message: 'Your float request has been submitted for review.', request: newRequest });

    } catch (error) {
        console.error(`Agent ${agent.id} failed to request float:`, error);
        res.status(500).json({ error: 'An internal server error occurred while submitting your request.' });
    }
});

// Agent gets their own list of float requests
app.get('/api/agent/requests', isAgent, async (req, res) => {
    const agent: Agent = (req as any).agent;
    try {
        const requests = await getAgentRequests(agent.id);
        requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        res.json(requests);
    } catch (error) {
        console.error(`Failed to get float requests for agent ${agent.id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve float requests.' });
    }
});

// Agent gets list of manual player requests for transactions
app.get('/api/agent/player-requests', isAgent, async (req, res) => {
    const agent: Agent = (req as any).agent;

    try {
        const allAgentRequests = await getAgentRequests(agent.id, 'pending');

        const linkedPlayerIds = new Set(
            Object.values(store.users)
                .filter(user => user.linkedAgentId === agent.id)
                .map(user => user.id)
        );
        
        const filteredRequests = allAgentRequests.filter(req => linkedPlayerIds.has(req.playerId));

        res.json(filteredRequests);

    } catch (error: any) {
        console.error(`Failed to get player requests for agent ${agent.id}:`, error);
        res.status(500).json({ 
            error: 'Failed to retrieve player transaction requests.',
            details: error.message || 'No specific error message available.'
        });
    }
});

// Agent approves a manual player request for a transaction
app.post('/api/agent/player-requests/:requestId/approve', isAgent, async (req, res) => {
    const { requestId } = req.params;
    const agent: Agent = (req as any).agent;

    try {
        await approveAgentRequest(requestId, agent.id);

        res.json({ success: true, message: 'Request approved successfully.' });

    } catch (error) {
        console.error("Error processing agent transaction approval:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        if (message.includes('Insufficient')) {
            return res.status(400).json({ error: message });
        }
        return res.status(500).json({ error: `Failed to process approval: ${message}` });
    }
});


// Agent rejects a manual player request for a transaction
app.post('/api/agent/player-requests/:requestId/reject', isAgent, async (req, res) => {
    const { requestId } = req.params;
    const agent: Agent = (req as any).agent;

    try {
        await rejectAgentRequest(requestId, agent.id);

        res.json({ success: true, message: 'Request rejected successfully.' });

    } catch (error) {
        console.error(`Failed to reject player request ${requestId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Get agent float payment instructions
app.get('/api/agent/payment-instructions', isAgent, (req, res) => {
    // The instructions are stored globally in the in-memory store.
    const instructions = store.agentFloatInstructions || '';
    res.json({ instructions: instructions });
});

// Agent gets a list of their linked players
app.get('/api/agent/my-players', isAgent, (req, res) => {
    const agent: Agent = (req as any).agent;

    const linkedPlayers = Object.values(store.users).filter(user => user.linkedAgentId === agent.id);

    // Return a sanitized version of the user profiles
    const sanitizedPlayers = linkedPlayers.map(p => {
        const { password, ...playerData } = p;
        return playerData;
    });

    res.json(sanitizedPlayers);
});

// For any request that doesn't match a static file or an API route,
// send the 'index.html' file. This is the entry point for the React SPA.
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    // This is an API call that fell through, so it's a 404.
    // The `next()` call without an argument will let it fall through to Express's default 404 handler.
    return next();
  }
  // For all other GET requests, serve the React app's entry point.
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});


// The original startServer() function is removed, as Firebase will manage the server lifecycle.
// The Vite middleware is only for local development, which is handled by the `npm run dev` script.
// Static file serving is now handled by Firebase Hosting configuration.

// Export the Express app for Firebase Functions
// Export the Express app
export const api = app;

// Start the server manually if we're NOT in a Firebase Function environment
if (!(process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR)) {
  const PORT = process.env.PORT || 3003;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}
