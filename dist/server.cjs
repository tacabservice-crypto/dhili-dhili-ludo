var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var import_auth = require("firebase-admin/auth");
var app = (0, import_express.default)();
var allowedOrigins = [
  "https://dhili-dhili-ludo.onrender.com",
  "https://dhilidhili.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];
app.use((0, import_cors.default)({
  origin: allowedOrigins,
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
var PORT = 3002;
var DB_FILE = import_path.default.join(process.cwd(), "db_store.json");
app.use(import_express.default.json());
var db = null;
var auth = null;
var serviceAccountPath = import_path.default.join(process.cwd(), "firebase-admin-key.json");
if (import_fs.default.existsSync(serviceAccountPath)) {
  try {
    const serviceAccountFile = import_fs.default.readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(serviceAccountFile);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    try {
      (0, import_app.getApp)();
    } catch (error) {
      (0, import_app.initializeApp)({
        credential: (0, import_app.cert)(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    }
    db = (0, import_firestore.getFirestore)();
    auth = (0, import_auth.getAuth)();
    console.log("Firebase Firestore and Auth initialized successfully with Admin SDK.");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
} else {
  console.log("No firebase-admin-key.json found. Running offline.");
}
var store = {
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
  houseRevenue: 0
};
function loadStore() {
  try {
    if (import_fs.default.existsSync(DB_FILE)) {
      const raw = import_fs.default.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      store.users = parsed.users || {};
      store.transactions = parsed.transactions || [];
      store.rooms = parsed.rooms || {};
      store.matchmakingQueues = parsed.matchmakingQueues || {
        0: [],
        1: [],
        5: [],
        10: [],
        25: [],
        50: []
      };
      store.houseRevenue = parsed.houseRevenue || 0;
      console.log("Database loaded successfully from disk.");
    } else {
      saveStoreAndWait();
    }
  } catch (error) {
    console.error("Failed to load database. Starting fresh.", error);
  }
}
async function loadStoreFromFirestore() {
  if (!db) {
    loadStore();
    return;
  }
  try {
    console.log("Fetching latest state from Firebase Firestore...");
    const storeRef = db.collection("ludo_store").doc("main");
    const docSnap = await storeRef.get();
    if (docSnap.exists) {
      const payload = docSnap.data();
      if (payload && payload.data) {
        const parsed = JSON.parse(payload.data);
        store.users = parsed.users || {};
        store.transactions = parsed.transactions || [];
        store.rooms = parsed.rooms || {};
        store.matchmakingQueues = parsed.matchmakingQueues || {
          0: [],
          1: [],
          5: [],
          10: [],
          25: [],
          50: []
        };
        store.houseRevenue = parsed.houseRevenue || 0;
        console.log("Database loaded successfully from Firebase Firestore.");
        import_fs.default.writeFileSync(DB_FILE, payload.data, "utf8");
        return;
      }
    }
    console.log("No existing state in Firestore. Loading from local store fallback...");
    loadStore();
    syncToFirestore();
  } catch (err) {
    console.error("Failed to load store from Firestore:", err);
    loadStore();
  }
}
async function syncToFirestore() {
  if (!db) return;
  try {
    const storeRef = db.collection("ludo_store").doc("main");
    const serialized = JSON.stringify(store);
    await storeRef.set({ data: serialized, updatedAt: Date.now() });
    console.log("Successfully synchronized store to Firebase Firestore.");
  } catch (err) {
    console.error("Failed to sync store to Firestore:", err);
  }
}
function saveStore() {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf8");
    syncToFirestore();
  } catch (error) {
    console.error("Failed to write database to disk.", error);
  }
}
async function saveStoreAndWait() {
  try {
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf8");
    await syncToFirestore();
  } catch (error) {
    console.error("Failed to write database to disk.", error);
  }
}
loadStoreFromFirestore();
function purgeSimulatedUsers() {
  let changed = false;
  Object.keys(store.users).forEach((id) => {
    if (id.startsWith("user_sim_")) {
      delete store.users[id];
      changed = true;
    }
  });
  if (changed) {
    saveStore();
  }
}
purgeSimulatedUsers();
var activeClients = [];
function sendEventToUser(userId, eventName, data) {
  const clients = activeClients.filter((c) => c.userId === userId);
  clients.forEach((client) => {
    try {
      client.res.write(`event: ${eventName}
data: ${JSON.stringify(data)}

`);
      if (typeof client.res.flush === "function") {
        client.res.flush();
      }
    } catch (e) {
      console.error(`Error sending SSE event to user ${userId}. Closing connection.`, e);
      client.res.end();
    }
  });
}
function broadcastToAll(eventName, data) {
  const payload = `event: ${eventName}
data: ${JSON.stringify(data)}

`;
  activeClients.forEach((client) => {
    try {
      client.res.write(payload);
      if (typeof client.res.flush === "function") {
        client.res.flush();
      }
    } catch (e) {
      console.error(`Error broadcasting SSE event. Closing connection for client ${client.userId}.`, e);
      client.res.end();
    }
  });
}
function broadcastToRoom(roomId, eventName, data) {
  const room = store.rooms[roomId];
  if (!room) return;
  let payload = { ...data };
  if (eventName === "game_update" || eventName === "timer_tick") {
    const spectatorClients = activeClients.filter((c) => c.spectatingRoomId === roomId);
    const spectatorsInfo = spectatorClients.map((c) => {
      const user = store.users[c.userId];
      if (user) {
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        };
      }
      return null;
    }).filter(Boolean);
    payload.spectators = spectatorsInfo;
  }
  room.players.forEach((p) => {
    sendEventToUser(p.userId, eventName, payload);
  });
  const spectatorConnections = activeClients.filter((c) => c.spectatingRoomId === roomId);
  spectatorConnections.forEach((s) => {
    const isPlayer = room.players.some((p) => p.userId === s.userId);
    if (!isPlayer) {
      sendEventToUser(s.userId, eventName, payload);
    }
  });
}
function broadcastUserUpdate(userId) {
  const user = store.users[userId];
  if (user) {
    sendEventToUser(userId, "user_update", user);
  }
}
function removeSSEClient(res) {
  const client = activeClients.find((c) => c.res === res);
  activeClients = activeClients.filter((c) => c.res !== res);
  if (client) {
    const stillConnected = activeClients.some((c) => c.userId === client.userId);
    if (!stillConnected) {
      const activeRoom = Object.values(store.rooms).find(
        (r) => r.status === "playing" && r.players.some((p) => p.userId === client.userId && p.status === "online")
      );
      if (activeRoom) {
        const player = activeRoom.players.find((p) => p.userId === client.userId);
        if (player) {
          player.status = "offline";
          addLog(activeRoom, `\u{1F50C} ${player.username} has disconnected. They have time to reconnect before being forfeited.`);
          broadcastToRoom(activeRoom.id, "game_update", activeRoom);
          saveStore();
        }
      }
      let changed = false;
      for (const qKey of Object.keys(store.matchmakingQueues)) {
        const lenBefore = store.matchmakingQueues[qKey].length;
        store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter((id) => id !== client.userId);
        if (store.matchmakingQueues[qKey].length !== lenBefore) changed = true;
      }
      if (changed) {
        saveStoreAndWait();
      }
      if (db) {
        db.collection("matchmaking").doc(client.userId).delete().catch((err) => {
          console.error("Failed to delete matchmaking record from Firestore on disconnect:", err);
        });
      }
    }
    broadcastToAll("online_players_updated", {});
  }
}
function cleanupMatchmakingQueues() {
  let changed = false;
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    const beforeLen = store.matchmakingQueues[qKey].length;
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter((userId) => {
      if (!store.users[userId]) return false;
      const inGame = Object.values(store.rooms).some(
        (r) => r.status === "playing" && r.players.some((p) => p.userId === userId && p.status !== "left")
      );
      if (inGame) return false;
      return true;
    });
    if (store.matchmakingQueues[qKey].length !== beforeLen) {
      changed = true;
    }
  }
  if (changed) {
    saveStore();
  }
}
var START_OFFSETS = {
  green: 0,
  yellow: 13,
  blue: 26,
  red: 39
};
var SAFE_GLOBAL_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
function getGlobalPosition(color, relativePos) {
  if (relativePos < 0 || relativePos > 50) return null;
  const offset = START_OFFSETS[color];
  return (offset + relativePos) % 52;
}
function createInitialTokens(userId, color) {
  return [0, 1, 2, 3].map((i) => ({
    id: `token_${color}_${i}`,
    ownerId: userId,
    color,
    position: -1
    // Home Base
  }));
}
function isMoveValid(token, roll) {
  if (token.position === 56) return false;
  if (token.position === -1) {
    return roll === 6;
  }
  return token.position + roll <= 56;
}
function advanceTurn(room) {
  const gs = room.gameState;
  const oldTurn = gs.turn;
  const numPlayers = room.players.length;
  const newPlayer = room.players[gs.turn];
  if (newPlayer) newPlayer.inactivityTimer = 300;
  gs.diceRoll = null;
  gs.hasRolled = false;
  gs.turnTimer = 30;
  let found = false;
  let nextTurn = oldTurn;
  for (let i = 1; i <= numPlayers; i++) {
    const checkIdx = (oldTurn + i) % numPlayers;
    const p = room.players[checkIdx];
    if (p && p.status !== "left") {
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
function addTransaction(userId, type, amount, matchId, description = "") {
  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    type,
    amount,
    timestamp: Date.now(),
    matchId,
    description
  };
  store.transactions.unshift(tx);
  saveStore();
  return tx;
}
function addLog(room, text) {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    text
  };
  room.gameState.logs.push(log);
  if (room.gameState.logs.length > 50) {
    room.gameState.logs.shift();
  }
}
function isBotPlayer(userId) {
  return userId.startsWith("bot_") || userId.startsWith("user_sim_");
}
function executeBotTurnIfActive(room) {
  const activePlayer = room.players[room.gameState.turn];
  if (!activePlayer || !isBotPlayer(activePlayer.userId)) return;
  setTimeout(() => {
    if (!room.gameState.hasRolled) {
      const d = Math.floor(Math.random() * 6) + 1;
      room.gameState.diceRoll = d;
      room.gameState.hasRolled = true;
      addLog(room, `\u{1F916} Bot ${activePlayer.username} rolled a ${d}!`);
      const playerTokens = room.gameState.tokens.filter((t) => t.color === activePlayer.color);
      const validTokens = playerTokens.filter((t) => isMoveValid(t, d));
      if (validTokens.length === 0) {
        addLog(room, `\u{1F916} Bot ${activePlayer.username} has no valid moves.`);
        setTimeout(() => {
          advanceTurn(room);
          broadcastToRoom(room.id, "game_update", room);
          executeBotTurnIfActive(room);
        }, 500);
      } else {
        let selectedToken = validTokens[0];
        for (const token of validTokens) {
          const nextRelative = token.position === -1 ? 0 : token.position + d;
          const globalPos = getGlobalPosition(token.color, nextRelative);
          if (globalPos !== null && !SAFE_GLOBAL_SQUARES.includes(globalPos)) {
            const hasOpponent = room.gameState.tokens.some((t) => {
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
        if (selectedToken === validTokens[0] && d === 6) {
          const baseToken = validTokens.find((t) => t.position === -1);
          if (baseToken) selectedToken = baseToken;
        }
        setTimeout(() => {
          moveTokenLogic(room, selectedToken.id, d);
          broadcastToRoom(room.id, "game_update", room);
          executeBotTurnIfActive(room);
        }, 500);
      }
    }
  }, 400);
}
function moveTokenLogic(room, tokenId, diceValue) {
  const gs = room.gameState;
  const token = gs.tokens.find((t) => t.id === tokenId);
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
  let bonusTurn = diceValue === 6;
  const finalGlobal = getGlobalPosition(token.color, token.position);
  if (finalGlobal !== null && !SAFE_GLOBAL_SQUARES.includes(finalGlobal)) {
    const opponentsAtSquare = gs.tokens.filter((t) => {
      if (t.color === token.color) return false;
      if (room.gameMode === "team") {
        const isAlly = token.color === "red" && t.color === "yellow" || token.color === "yellow" && t.color === "red" || token.color === "green" && t.color === "blue" || token.color === "blue" && t.color === "green";
        if (isAlly) return false;
      }
      if (t.position < 0 || t.position > 50) return false;
      const otherGlobal = getGlobalPosition(t.color, t.position);
      return otherGlobal === finalGlobal;
    });
    if (opponentsAtSquare.length > 0) {
      opponentsAtSquare.forEach((opToken) => {
        opToken.position = -1;
        const opUser = store.users[opToken.ownerId] || { username: "Opponent" };
        addLog(room, `\u{1F4A5} CUT! ${activePlayer.username} cut ${opUser.username}'s token back to base!`);
      });
      bonusTurn = true;
    }
  }
  if (token.position === 56) {
    addLog(room, `\u{1F389} Token finished! ${activePlayer.username} has safely brought a token home!`);
    bonusTurn = true;
  }
  const playerTokens = gs.tokens.filter((t) => t.color === token.color);
  const allFinished = playerTokens.every((t) => t.position === 56);
  if (allFinished) {
    room.status = "completed";
    gs.winnerId = activePlayer.userId;
    if (room.gameMode === "team") {
      const isRedYellow = token.color === "red" || token.color === "yellow";
      const winningColors = isRedYellow ? ["red", "yellow"] : ["green", "blue"];
      const winningTeammates = room.players.filter((p) => winningColors.includes(p.color));
      const winningNames = winningTeammates.map((p) => p.username).join(" & ");
      addLog(room, `\u{1F3C6} CHAMPIONS! Team ${winningNames} has finished all tokens and WON the game!`);
      if (room.betAmount > 0) {
        const share = gs.escrowBalance / 2;
        winningTeammates.forEach((p) => {
          if (!isBotPlayer(p.userId)) {
            const user = store.users[p.userId];
            if (user) {
              user.balance += share;
              user.winCount += 1;
              addTransaction(p.userId, "win_payout", share, room.id, `Team Win payout for match ${room.id}.`);
              broadcastUserUpdate(p.userId);
            }
          }
        });
        room.players.forEach((p) => {
          if (!winningColors.includes(p.color) && !isBotPlayer(p.userId)) {
            const user = store.users[p.userId];
            if (user) {
              user.lossCount += 1;
              broadcastUserUpdate(p.userId);
            }
          }
        });
      }
    } else {
      addLog(room, `\u{1F3C6} CHAMPION! ${activePlayer.username} has finished all 4 tokens and WON the game!`);
      if (room.betAmount > 0) {
        const winner = store.users[activePlayer.userId];
        if (winner) {
          winner.balance += gs.escrowBalance;
          winner.winCount += 1;
          addTransaction(
            activePlayer.userId,
            "win_payout",
            gs.escrowBalance,
            room.id,
            `Payout for winning match ${room.id} with $${room.betAmount} bet.`
          );
          broadcastUserUpdate(activePlayer.userId);
        }
        room.players.forEach((p) => {
          if (p.userId !== activePlayer.userId && !isBotPlayer(p.userId)) {
            const user = store.users[p.userId];
            if (user) {
              user.lossCount += 1;
              broadcastUserUpdate(p.userId);
            }
          }
        });
      }
    }
    gs.escrowBalance = 0;
  } else {
    gs.diceRoll = null;
    gs.hasRolled = false;
    if (bonusTurn) {
      addLog(room, `\u{1F3B2} Bonus roll! ${activePlayer.username} gets to roll again.`);
      gs.turnTimer = 30;
    } else {
      advanceTurn(room);
    }
  }
  saveStore();
}
function handleInactivityForfeit(room, inactivePlayer) {
  if (room.status !== "playing") return;
  addLog(room, `\u23F1\uFE0F ${inactivePlayer.username} has been forfeited due to inactivity.`);
  inactivePlayer.status = "left";
  const activePlayers = room.players.filter((pl) => pl.status !== "left");
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    room.status = "completed";
    room.gameState.winnerId = winner.userId;
    const totalPayout = room.gameState.escrowBalance;
    addLog(room, `\u{1F3C6} Game Over! ${winner.username} wins by forfeit and takes the pot of $${totalPayout.toFixed(2)}!`);
    if (room.betAmount > 0 && totalPayout > 0) {
      const winnerProfile = store.users[winner.userId];
      if (winnerProfile && !isBotPlayer(winnerProfile.id)) {
        winnerProfile.balance += totalPayout;
        winnerProfile.winCount += 1;
        addTransaction(winner.userId, "win_payout", totalPayout, room.id, `Win by opponent inactivity forfeit.`);
        broadcastUserUpdate(winner.userId);
      }
    }
    room.gameState.escrowBalance = 0;
  }
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
}
setInterval(() => {
  let changed = false;
  Object.keys(store.rooms).forEach((roomId) => {
    const room = store.rooms[roomId];
    if (room.status === "playing") {
      const gs = room.gameState;
      const activePlayer = room.players[gs.turn];
      if (activePlayer && activePlayer.inactivityTimer && !isBotPlayer(activePlayer.userId)) {
        activePlayer.inactivityTimer -= 1;
        changed = true;
        if (activePlayer.inactivityTimer > 0 && activePlayer.inactivityTimer % 60 === 0) {
          const minutesLeft = activePlayer.inactivityTimer / 60;
          const warningMsg = `Waqtigaagu wuu sii dhamaanayaa! Waxaa kuu harsan ${minutesLeft} daqiiqo. (Your time is running out! ${minutesLeft} minutes left.)`;
          sendEventToUser(activePlayer.userId, "inactivity_warning", { message: warningMsg });
          addLog(room, `\u23F1\uFE0F Digniin: ${activePlayer.username} waxaa u harsan ${minutesLeft} daqiiqo. (Warning: ${activePlayer.username} has ${minutesLeft} minutes left.)`);
        }
        if (activePlayer.inactivityTimer <= 0) {
          handleInactivityForfeit(room, activePlayer);
          return;
        }
      }
      if (gs.turnTimer > 0) {
        gs.turnTimer -= 1;
        changed = true;
        if (gs.turnTimer === 0) {
          addLog(room, `\u23F1\uFE0F Waqtiga 30-ka ilbiriqsi wuu dhamaaday ${activePlayer.username}. Ganaaxa daahitaanka ayaa bilaabanaya.`);
          broadcastToRoom(room.id, "game_update", room);
        }
      }
    }
  });
  if (changed) {
    Object.keys(store.rooms).forEach((roomId) => {
      const room = store.rooms[roomId];
      if (room.status === "playing") {
        broadcastToRoom(roomId, "timer_tick", {
          turn: room.gameState.turn,
          turnTimer: room.gameState.turnTimer,
          inactivityTimer: room.players[room.gameState.turn]?.inactivityTimer
        });
      }
    });
  }
}, 1e3);
setInterval(() => {
  activeClients.forEach((client) => {
    try {
      client.res.write(`: heartbeat

`);
      if (typeof client.res.flush === "function") {
        client.res.flush();
      }
    } catch (e) {
      console.error(`Error sending heartbeat. Closing connection for client ${client.userId}.`, e);
      client.res.end();
    }
  });
}, 1e4);
setInterval(() => {
  cleanupMatchmakingQueues();
  Object.keys(store.matchmakingQueues).forEach((queueKey) => {
    const queueUserIds = store.matchmakingQueues[queueKey];
    if (!queueUserIds || queueUserIds.length === 0) return;
    const parts = queueKey.split("_");
    const bet = parseFloat(parts[0]) || 0;
    const cap = parseInt(parts[1]) || 2;
    const mode = parts[2] === "team" ? "team" : "solo";
    const firstUserId = queueUserIds[0];
    const firstUser = store.users[firstUserId];
    if (!firstUser) return;
    const joinedAt = firstUser.seekingJoinedAt || Date.now();
    const waitTimeMs = Date.now() - joinedAt;
    if (waitTimeMs >= 42e4) {
      console.log(`Matchmaking timeout for queue ${queueKey}. Auto-filling remaining seats with bots...`);
      const realPlayers = queueUserIds.map((id) => store.users[id]).filter(Boolean);
      store.matchmakingQueues[queueKey] = [];
      if (db) {
        realPlayers.forEach((p) => {
          db.collection("matchmaking").doc(p.id).delete().catch((err) => {
            console.error("Failed to delete matchmaking record from Firestore on auto-fill:", err);
          });
        });
      }
      const matchedList = [...realPlayers];
      const botAvatars = ["\u{1F916}", "\u{1F98A}", "\u26A1", "\u{1F451}"];
      const botNames = ["Dhili Master AI", "SomaliLudoBot", "LudoPro AI", "DesertFox AI", "NomadLudo AI"];
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
      const room = startMatchedRoom(matchedList, bet, cap, mode);
      realPlayers.forEach((p) => {
        sendEventToUser(p.id, "matchmaker_success", { roomId: room.id, room });
        broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.id });
      });
      broadcastToAll("online_players_updated", {});
      saveStoreAndWait();
    }
  });
}, 2e3);
var verifyFirebaseToken = async (req, res, next) => {
  if (!auth) {
    return res.status(500).json({ error: "Firebase Admin not configured on server." });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Unauthorized: No token provided." });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(403).json({ error: "Unauthorized: Invalid token." });
  }
};
app.get("/api/debug/firebase", async (req, res) => {
  if (!db) {
    return res.json({
      initialized: false,
      error: "Firebase Firestore db object is null. Check if firebase-admin-key.json exists."
    });
  }
  try {
    const testRef = db.collection("ludo_store").doc("debug_test");
    await testRef.set({ test: true, timestamp: Date.now() });
    const snap = await testRef.get();
    const data = snap.exists ? snap.data() : null;
    return res.json({
      initialized: true,
      writeAndReadSuccess: data?.test === true,
      data,
      projectId: (0, import_app.getApp)().options.projectId
    });
  } catch (err) {
    return res.json({
      initialized: true,
      error: err.message || err.toString(),
      stack: err.stack
    });
  }
});
app.get("/api/updates", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
  res.write(`:ok

`);
  res.write(`retry: 3000

`);
  const client = { userId, res };
  activeClients.push(client);
  const activeRoom = Object.values(store.rooms).find(
    (r) => r.status === "playing" && r.players.some((p) => p.userId === userId && p.status === "offline")
  );
  if (activeRoom) {
    const player = activeRoom.players.find((p) => p.userId === userId);
    if (player) {
      player.status = "online";
      player.inactivityTimer = 300;
      addLog(activeRoom, `\u{1F7E2} ${player.username} has reconnected! Welcome back.`);
      broadcastToRoom(activeRoom.id, "game_update", activeRoom);
      saveStore();
    }
  }
  res.write(`event: init
data: ${JSON.stringify({ status: "connected" })}

`);
  if (typeof res.flush === "function") {
    res.flush();
  }
  setTimeout(() => {
    for (const [qKey, queueUserIds] of Object.entries(store.matchmakingQueues)) {
      for (const seekingUserId of queueUserIds) {
        if (seekingUserId !== userId && store.users[seekingUserId]) {
          const seekingUser = store.users[seekingUserId];
          const parts = qKey.split("_");
          const seekingData = {
            senderId: seekingUser.id,
            username: seekingUser.username,
            avatar: seekingUser.avatar,
            betAmount: parseFloat(parts[0]) || 0,
            capacity: parseInt(parts[1]) || 2,
            gameMode: parts[2] || "solo",
            queueKey: qKey
          };
          res.write(`event: matchmaker_seeking
data: ${JSON.stringify(seekingData)}

`);
          if (typeof res.flush === "function") {
            res.flush();
          }
        }
      }
    }
  }, 500);
  req.on("close", () => {
    removeSSEClient(res);
  });
});
app.post("/api/auth/login", verifyFirebaseToken, async (req, res) => {
  const { username, email, avatar } = req.body;
  const firebaseUid = req.user.uid;
  let foundUser = Object.values(store.users).find((u) => u.firebaseUid === firebaseUid);
  if (foundUser) {
    return res.json(foundUser);
  }
  if (email) {
    const userByEmail = Object.values(store.users).find((u) => u.email === email && !u.firebaseUid);
    if (userByEmail) {
      userByEmail.firebaseUid = firebaseUid;
      await saveStoreAndWait();
      return res.json(userByEmail);
    }
  }
  if (!username) {
    return res.status(400).json({ error: "Username is required for new registration" });
  }
  const cleanUsername = username.trim().substring(0, 20);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newUser = {
    id: userId,
    firebaseUid,
    username: cleanUsername,
    email: email || void 0,
    avatar: avatar || "\u{1F338}",
    balance: 100,
    winCount: 0,
    lossCount: 0
  };
  store.users[userId] = newUser;
  addTransaction(userId, "deposit", 100, void 0, "Welcome signup bonus.");
  await saveStoreAndWait();
  res.json(newUser);
});
app.get("/api/users/:userId", (req, res, next) => {
  if (req.params.userId === "online" || req.params.userId === "leaderboard") {
    return next();
  }
  const user = store.users[req.params.userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});
app.post("/api/users/:userId/update", async (req, res) => {
  const user = store.users[req.params.userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { username, avatar, isOfflinePreference } = req.body;
  if (username) user.username = username.trim().substring(0, 20);
  if (avatar) user.avatar = avatar;
  if (typeof isOfflinePreference === "boolean") user.isOfflinePreference = isOfflinePreference;
  await saveStoreAndWait();
  broadcastUserUpdate(user.id);
  res.json(user);
});
app.post("/api/users/:userId/status", (req, res) => {
  const user = store.users[req.params.userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { isOffline } = req.body;
  user.isOfflinePreference = !!isOffline;
  saveStore();
  broadcastUserUpdate(user.id);
  res.json({ success: true, isOfflinePreference: user.isOfflinePreference, user });
});
app.post("/api/wallet/deposit", (req, res) => {
  const { userId, amount } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const depAmt = parseFloat(amount);
  if (isNaN(depAmt) || depAmt <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }
  user.balance += depAmt;
  addTransaction(userId, "deposit", depAmt, void 0, `Deposited funds via Simulated Net Banking.`);
  broadcastUserUpdate(userId);
  res.json({ success: true, balance: user.balance });
});
app.post("/api/wallet/withdraw", (req, res) => {
  const { userId, amount } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const withAmt = parseFloat(amount);
  if (isNaN(withAmt) || withAmt <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount" });
  }
  if (user.balance < withAmt) {
    return res.status(400).json({ error: "Insufficient funds" });
  }
  user.balance -= withAmt;
  addTransaction(userId, "withdrawal", withAmt, void 0, `Withdrawn funds to bank account.`);
  broadcastUserUpdate(userId);
  res.json({ success: true, balance: user.balance });
});
app.get("/api/wallet/transactions/:userId", (req, res) => {
  const txs = store.transactions.filter((t) => t.userId === req.params.userId);
  res.json(txs);
});
app.get("/api/rooms/active", (req, res) => {
  const activeGames = Object.values(store.rooms).filter((r) => r.status === "playing").map((r) => ({
    id: r.id,
    // Changed from roomId to id to match GameRoom type
    players: r.players.map((p) => ({
      userId: p.userId,
      // Added userId
      username: p.username,
      avatar: p.avatar
    })),
    betAmount: r.betAmount,
    gameMode: r.gameMode,
    capacity: r.capacity
  }));
  res.json(activeGames);
});
app.post("/api/rooms/:roomId/spectate", (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }
  const client = activeClients.find((c) => c.userId === userId);
  if (client) {
    client.spectatingRoomId = roomId;
    console.log(`User ${userId} is now spectating room ${roomId}`);
  }
  broadcastToRoom(roomId, "game_update", room);
  res.json({ success: true, message: "Spectating started." });
});
app.post("/api/rooms/:roomId/stop-spectating", (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const room = store.rooms[roomId];
  if (!room) {
    const client2 = activeClients.find((c) => c.userId === userId && c.spectatingRoomId === roomId);
    if (client2) {
      client2.spectatingRoomId = void 0;
    }
    return res.json({ success: true, message: "Stopped spectating a room that no longer exists." });
  }
  const client = activeClients.find((c) => c.userId === userId && c.spectatingRoomId === roomId);
  if (client) {
    client.spectatingRoomId = void 0;
    console.log(`User ${userId} stopped spectating room ${roomId}`);
  }
  broadcastToRoom(roomId, "game_update", room);
  res.json({ success: true, message: "Stopped spectating." });
});
app.post("/api/rooms/create", (req, res) => {
  const { userId, betAmount, capacity, gameMode } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const bet = parseFloat(betAmount);
  if (user.balance < bet) {
    return res.status(400).json({ error: "Insufficient wallet balance for this bet amount." });
  }
  const selectedMode = gameMode === "team" ? "team" : "solo";
  const selectedCapacity = selectedMode === "team" ? 4 : parseInt(capacity) || 2;
  const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
  const newPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: selectedCapacity === 2 && selectedMode === "solo" ? "green" : "red",
    // Host is Green for 2-player solo, Red for others
    isHost: true,
    isReady: true,
    status: "online",
    winCount: user.winCount,
    lossCount: user.lossCount,
    balance: user.balance
  };
  const newRoom = {
    id: roomId,
    status: "waiting",
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
      logs: [{ id: "1", timestamp: Date.now(), text: `Room created by ${user.username}. Code: ${roomId} (${selectedMode === "team" ? "Team 2v2" : "Solo " + selectedCapacity + "P"})` }],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };
  store.rooms[roomId] = newRoom;
  saveStore();
  res.json(newRoom);
});
app.post("/api/rooms/join", (req, res) => {
  const { userId, roomCode } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const code = (roomCode || "").trim().toUpperCase();
  const room = store.rooms[code];
  if (!room) {
    return res.status(404).json({ error: "Room code not found." });
  }
  if (room.players.some((p) => p.userId === userId)) {
    return res.json(room);
  }
  if (room.pendingPlayers && room.pendingPlayers.some((p) => p.userId === userId)) {
    return res.json(room);
  }
  if (room.status !== "waiting") {
    return res.status(400).json({ error: "Match has already started or been completed." });
  }
  const maxPlayers = room.capacity || 2;
  if (room.players.length >= maxPlayers) {
    return res.status(400).json({ error: `Room is already full at ${maxPlayers} capacity.` });
  }
  if (user.balance < room.betAmount) {
    return res.status(400).json({ error: `You need at least $${room.betAmount} in your wallet to join this room.` });
  }
  const newPendingPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: "green",
    // Assign color on host approval
    isHost: false,
    isReady: false,
    status: "online",
    winCount: user.winCount || 0,
    lossCount: user.lossCount || 0,
    balance: user.balance || 0
  };
  if (!room.pendingPlayers) room.pendingPlayers = [];
  room.pendingPlayers.push(newPendingPlayer);
  addLog(room, `\u{1F514} Challenger ${user.username} is requesting to join the match. Waiting for host approval!`);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }
  res.json(room);
});
function startMatchedRoom(matchedUsers, bet, cap, mode) {
  const roomId = `MATCH_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  let colors;
  if (cap === 2 && mode === "solo") {
    colors = ["green", "blue"];
  } else {
    colors = ["red", "green", "yellow", "blue"];
  }
  const players = matchedUsers.map((u, index) => ({
    userId: u.id,
    username: u.username,
    avatar: u.avatar,
    color: colors[index] || "red",
    isHost: index === 0,
    isReady: true,
    status: "online",
    winCount: u.winCount || 0,
    lossCount: u.lossCount || 0,
    balance: u.balance || 0
  }));
  let totalEscrow = 0;
  players.forEach((p) => {
    if (!isBotPlayer(p.userId)) {
      const u = store.users[p.userId];
      if (u) {
        u.balance = Math.max(0, u.balance - bet);
        addTransaction(p.userId, "bet_escrow_locked", bet, roomId, `Escrow stake for Ludo Match ${roomId}.`);
        broadcastUserUpdate(p.userId);
      }
    }
    totalEscrow += bet;
  });
  const tokens = [];
  players.forEach((p) => {
    tokens.push(...createInitialTokens(p.userId, p.color));
  });
  const newRoom = {
    id: roomId,
    status: "playing",
    // Starts immediately
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
        { id: "1", timestamp: Date.now(), text: `Match found! Mode: ${mode === "team" ? "Partnership 2v2" : "Solo " + cap + "P"}` },
        { id: "2", timestamp: Date.now(), text: `Stake of $${bet} locked in secure escrow pool ($${totalEscrow.toFixed(2)})` }
      ],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };
  store.rooms[roomId] = newRoom;
  saveStore();
  players.forEach((p) => {
    if (!isBotPlayer(p.userId)) {
      sendEventToUser(p.userId, "matchmaker_success", { roomId: newRoom.id, room: newRoom });
      broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.userId });
    }
  });
  broadcastToAll("online_players_updated", {});
  return newRoom;
}
app.post("/api/rooms/matchmaking/enter-queue", (req, res) => {
  try {
    const { userId, betAmount, capacity, gameMode } = req.body;
    const user = store.users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });
    cleanupMatchmakingQueues();
    const bet = parseFloat(betAmount);
    if (user.balance < bet) {
      return res.status(400).json({ error: "Insufficient balance to match stake." });
    }
    const cap = parseInt(capacity) || 2;
    const mode = gameMode === "team" ? "team" : "solo";
    const queueKey = `${bet}_${cap}_${mode}`;
    if (!store.matchmakingQueues[queueKey]) {
      store.matchmakingQueues[queueKey] = [];
    }
    if (store.matchmakingQueues[queueKey].includes(userId)) {
      broadcastToAll("matchmaker_seeking", {
        senderId: user.id,
        username: user.username,
        avatar: user.avatar,
        betAmount: bet,
        capacity: cap,
        gameMode: mode,
        queueKey
      });
      return res.json({ status: "queued", message: "Already in queue" });
    }
    user.seekingJoinedAt = Date.now();
    store.matchmakingQueues[queueKey].push(userId);
    if (db) {
      db.collection("matchmaking").doc(userId).set({
        userId,
        username: user.username,
        avatar: user.avatar,
        betAmount: bet,
        capacity: cap,
        gameMode: mode,
        status: "WAITING_FOR_MATCH",
        timestamp: Date.now()
      }).catch((err) => {
        console.error("Failed to write matchmaking record to Firestore:", err);
      });
    }
    broadcastToAll("matchmaker_seeking", {
      senderId: user.id,
      username: user.username,
      avatar: user.avatar,
      betAmount: bet,
      capacity: cap,
      gameMode: mode,
      queueKey
    });
    broadcastToAll("online_players_updated", {});
    saveStore();
    res.json({ status: "queued", message: "Looking for real online opponent..." });
  } catch (error) {
    console.error("!!! UNHANDLED ERROR in /enter-queue:", error);
    res.status(500).json({ error: "An unexpected server error occurred.", details: error.message });
  }
});
app.post("/api/rooms/matchmaking/join", (req, res) => {
  const { userId, betAmount, capacity, gameMode, opponentId } = req.body;
  if (!opponentId) {
    return res.status(400).json({ error: "This endpoint is for direct challenges only. opponentId is required." });
  }
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const oppUser = store.users[opponentId];
  if (!oppUser) return res.status(404).json({ error: "Opponent not found" });
  cleanupMatchmakingQueues();
  const bet = parseFloat(betAmount);
  if (user.balance < bet) {
    return res.status(400).json({ error: "Insufficient balance to match stake." });
  }
  const cap = parseInt(capacity) || 2;
  const mode = gameMode === "team" ? "team" : "solo";
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter((id) => id !== userId && id !== opponentId);
  }
  if (store.users[userId]) delete store.users[userId].seekingJoinedAt;
  if (store.users[opponentId]) delete store.users[opponentId].seekingJoinedAt;
  if (db) {
    db.collection("matchmaking").doc(userId).delete().catch((err) => console.error("Failed to delete matchmaking record from Firestore for user:", err));
    db.collection("matchmaking").doc(opponentId).delete().catch((err) => console.error("Failed to delete matchmaking record from Firestore for opponent:", err));
  }
  const matchedList = [user, oppUser];
  const finalCapacity = 2;
  const finalMode = "solo";
  const room = startMatchedRoom(matchedList, bet, finalCapacity, finalMode);
  matchedList.forEach((p) => {
    if (!isBotPlayer(p.id)) {
      sendEventToUser(p.id, "matchmaker_success", { roomId: room.id, room });
      broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.id });
    }
  });
  broadcastToAll("online_players_updated", {});
  saveStore();
  return res.json({ matched: true, roomId: room.id, room });
});
app.post("/api/rooms/create-bot-room", (req, res) => {
  const { userId, betAmount, capacity, gameMode } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const bet = parseFloat(betAmount) || 0;
  if (user.balance < bet) {
    return res.status(400).json({ error: "Insufficient wallet balance for this stake." });
  }
  const cap = parseInt(capacity) || 2;
  const mode = gameMode === "team" ? "team" : "solo";
  const matchedList = [user];
  const botAvatars = ["\u{1F916}", "\u{1F98A}", "\u26A1", "\u{1F451}"];
  const botNames = ["LudoMaster AI", "SpeedyBot", "ProLudo AI", "ZenBot"];
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
  const room = startMatchedRoom(matchedList, bet, cap, mode);
  res.json({ success: true, roomId: room.id });
});
app.post("/api/rooms/matchmaking/leave", (req, res) => {
  const { userId } = req.body;
  if (userId) {
    if (store.users[userId]) {
      delete store.users[userId].seekingJoinedAt;
    }
    for (const qKey of Object.keys(store.matchmakingQueues)) {
      store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter((id) => id !== userId);
    }
    saveStore();
    broadcastToAll("matchmaker_seeking_cancelled", { senderId: userId });
    if (db) {
      db.collection("matchmaking").doc(userId).delete().catch((err) => {
        console.error("Failed to delete matchmaking record from Firestore on leave:", err);
      });
    }
  }
  res.json({ success: true });
});
app.post("/api/rooms/voice-signaling", (req, res) => {
  const { roomId, senderId, targetId, signal } = req.body;
  if (!roomId || !senderId || !targetId || !signal) {
    return res.status(400).json({ error: "Missing required signaling fields" });
  }
  sendEventToUser(targetId, "voice_signal", {
    roomId,
    senderId,
    signal
  });
  res.json({ success: true });
});
app.get("/api/users/online", async (req, res) => {
  const currentUserId = req.query.userId;
  if (!currentUserId) {
    return res.status(400).json({ error: "Missing userId parameter" });
  }
  cleanupMatchmakingQueues();
  if (db) {
    try {
      const qs = await db.collection("matchmaking").get();
      qs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.status === "WAITING_FOR_MATCH") {
          const qKey = `${data.betAmount}_${data.capacity}_${data.gameMode}`;
          if (!store.matchmakingQueues[qKey]) {
            store.matchmakingQueues[qKey] = [];
          }
          if (!store.matchmakingQueues[qKey].includes(data.userId)) {
            store.matchmakingQueues[qKey].push(data.userId);
            if (!store.users[data.userId]) {
              store.users[data.userId] = {
                id: data.userId,
                username: data.username,
                avatar: data.avatar,
                balance: 100,
                // Fallback
                winCount: 0,
                lossCount: 0,
                isOfflinePreference: false
              };
            }
            store.users[data.userId].seekingJoinedAt = data.timestamp || Date.now();
          }
        }
      });
    } catch (e) {
      console.error("Failed to sync matchmaking from Firestore:", e);
    }
  }
  const activeIds = new Set(activeClients.map((c) => c.userId));
  const onlineList = [];
  Object.values(store.users).forEach((u) => {
    if (u.id.startsWith("user_sim_")) return;
    const isConnected = activeIds.has(u.id);
    const inGame = Object.values(store.rooms).some(
      (r) => r.status === "playing" && r.players.some((p) => p.userId === u.id && p.status !== "left")
    );
    let status = "offline";
    let seekingDetails = null;
    for (const [qKey, queueUserIds] of Object.entries(store.matchmakingQueues)) {
      if (queueUserIds.includes(u.id)) {
        const parts = qKey.split("_");
        seekingDetails = {
          betAmount: parseFloat(parts[0]) || 0,
          capacity: parseInt(parts[1]) || 2,
          gameMode: parts[2] || "solo"
        };
        status = "seeking";
        break;
      }
    }
    if (status === "seeking") {
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
        seekingJoinedAt: u.seekingJoinedAt || Date.now()
      });
    }
  });
  onlineList.sort((a, b) => {
    if (a.status === "seeking" && b.status === "seeking") {
      return (b.seekingJoinedAt || 0) - (a.seekingJoinedAt || 0);
    }
    if (a.status === "seeking") return -1;
    if (b.status === "seeking") return 1;
    return 0;
  });
  res.json(onlineList);
});
app.post("/api/rooms/challenge/invite", (req, res) => {
  const { senderId, receiverId, betAmount, capacity, gameMode } = req.body;
  const sender = store.users[senderId];
  if (!sender) return res.status(404).json({ error: "Sender user not found." });
  const bet = parseFloat(betAmount) || 0;
  if (sender.balance < bet) {
    return res.status(400).json({ error: `Insufficient wallet balance for $${bet} bet.` });
  }
  const selectedMode = gameMode === "team" ? "team" : "solo";
  const selectedCapacity = selectedMode === "team" ? 4 : parseInt(capacity) || 2;
  if (receiverId.startsWith("sim_") || receiverId.startsWith("bot_")) {
    const receiverUser2 = {
      id: receiverId,
      username: receiverId.includes("1") ? "Kaptan_Ludo \u{1F451}" : receiverId.includes("2") ? "SomaliGamer_252" : receiverId.includes("3") ? "Pro_Dice_Master" : "Speedy_Runner",
      avatar: receiverId.includes("1") ? "\u{1F981}" : receiverId.includes("2") ? "\u26A1" : receiverId.includes("3") ? "\u{1F98A}" : "\u{1F409}",
      winCount: 20,
      lossCount: 8,
      balance: 100
    };
    const matchedList = [sender, receiverUser2];
    const botAvatars = ["\u{1F916}", "\u{1F98A}", "\u26A1", "\u{1F451}"];
    const botNames = ["LudoMaster AI", "SpeedyBot", "ProLudo AI", "ZenBot"];
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
    const room = startMatchedRoom(matchedList, bet, selectedCapacity, selectedMode);
    return res.json({ success: true, roomId: room.id, room });
  }
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
  const hostPlayer = {
    userId: sender.id,
    username: sender.username,
    avatar: sender.avatar,
    color: "red",
    isHost: true,
    isReady: true,
    status: "online",
    winCount: sender.winCount,
    lossCount: sender.lossCount,
    balance: sender.balance
  };
  const newRoom = {
    id: roomId,
    status: "waiting",
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
      logs: [{ id: "1", timestamp: Date.now(), text: `Challenge lobby created by ${sender.username}. Bet: $${bet}` }],
      chat: [],
      lastActivity: Date.now()
    },
    createdAt: Date.now()
  };
  store.rooms[roomId] = newRoom;
  for (const qKey of Object.keys(store.matchmakingQueues)) {
    store.matchmakingQueues[qKey] = store.matchmakingQueues[qKey].filter((id) => id !== senderId && id !== receiverId);
  }
  if (db) {
    db.collection("matchmaking").doc(senderId).delete().catch((err) => console.error("Failed to delete sender from matchmaking on challenge:", err));
    db.collection("matchmaking").doc(receiverId).delete().catch((err) => console.error("Failed to delete receiver from matchmaking on challenge:", err));
  }
  broadcastToAll("matchmaker_seeking_cancelled", { senderId });
  broadcastToAll("matchmaker_seeking_cancelled", { senderId: receiverId });
  saveStore();
  sendEventToUser(receiverId, "game_invite", {
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
app.post("/api/rooms/challenge/accept", (req, res) => {
  const { userId, roomId } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Challenge lobby no longer exists." });
  if (room.players.length >= (room.capacity || 2)) {
    return res.status(400).json({ error: "Room is already full." });
  }
  if (user.balance < room.betAmount) {
    return res.status(400).json({ error: `Insufficient wallet balance to accept this $${room.betAmount} match.` });
  }
  const colors = ["red", "green", "yellow", "blue"];
  const occupiedColors = room.players.map((p) => p.color);
  const assignedColor = colors.find((c) => !occupiedColors.includes(c)) || "green";
  const newPlayer = {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    color: assignedColor,
    isHost: false,
    isReady: true,
    status: "online",
    winCount: user.winCount,
    lossCount: user.lossCount,
    balance: user.balance
  };
  room.players.push(newPlayer);
  addLog(room, `\u2694\uFE0F ${user.username} accepted the challenge and joined the room.`);
  saveStore();
  const hostId = room.players.find((p) => p.isHost)?.userId;
  if (hostId) {
    sendEventToUser(hostId, "game_invite_accepted", { roomId });
  }
  res.json({ success: true, roomId });
});
app.post("/api/rooms/challenge/decline", (req, res) => {
  const { userId, roomId } = req.body;
  const user = store.users[userId];
  if (!user) return res.status(404).json({ error: "User not found" });
  const room = store.rooms[roomId];
  if (room) {
    const hostId = room.players.find((p) => p.isHost)?.userId;
    if (hostId) {
      sendEventToUser(hostId, "game_invite_declined", { receiverName: user.username });
    }
    delete store.rooms[roomId];
    saveStore();
  }
  res.json({ success: true });
});
app.get("/api/users/leaderboard", (req, res) => {
  const allUsers = Object.values(store.users).filter((u) => !u.id.startsWith("user_sim_") && !u.id.startsWith("bot_"));
  allUsers.forEach((u) => {
    const userTransactions = store.transactions.filter((t) => t.userId === u.id);
    const totalWins = userTransactions.filter((t) => t.type === "win_payout").reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = userTransactions.filter((t) => t.type === "app_commission").reduce((sum, t) => sum + t.amount, 0);
    u.earnings = totalWins - totalCommission;
  });
  const sorted = [...allUsers].sort((a, b) => {
    const aEarnings = a.earnings || 0;
    const bEarnings = b.earnings || 0;
    return bEarnings - aEarnings;
  }).slice(0, 5);
  let rank = 1;
  const result = sorted.map((u) => {
    return {
      rank: rank++,
      name: u.username,
      avatar: u.avatar || "\u{1F3AE}",
      wins: u.winCount || 0,
      earnings: u.earnings || 0
    };
  });
  res.json(result);
});
app.post("/api/rooms/ready", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((p2) => p2.userId === userId);
  if (!p) return res.status(404).json({ error: "Player not in room" });
  p.isReady = !p.isReady;
  addLog(room, `${p.username} is ${p.isReady ? "READY" : "NOT READY"}.`);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/add-bot", (req, res) => {
  const { roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.players.length >= 4) {
    return res.status(400).json({ error: "Room is already full." });
  }
  const botNames = ["DeepBlue", "AlphaGo", "ChessMaster", "LudoAI", "LudoKing", "Siri", "Alexa"];
  const name = botNames[Math.floor(Math.random() * botNames.length)] + `_${Math.floor(Math.random() * 100)}`;
  const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const colors = ["red", "green", "yellow", "blue"];
  const occupiedColors = room.players.map((p) => p.color);
  const color = colors.find((c) => !occupiedColors.includes(c)) || "green";
  const botPlayer = {
    userId: botId,
    username: `\u{1F916} ${name}`,
    avatar: "\u{1F916}",
    color,
    isHost: false,
    isReady: true,
    status: "online"
  };
  room.players.push(botPlayer);
  addLog(room, `Bot ${botPlayer.username} joined the match.`);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/start", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((p2) => p2.userId === userId);
  if (!p || !p.isHost) {
    return res.status(403).json({ error: "Only the host can start the match." });
  }
  if (room.players.length < 2) {
    return res.status(400).json({ error: "Ugu yaraan 2 ciyaartoy ayaa loo baahan yahay si ciyaartu u bilaabato." });
  }
  room.capacity = room.players.length;
  let colorsToAssign;
  if (room.players.length === 2 && room.gameMode === "solo") {
    colorsToAssign = ["red", "yellow"];
    const host = room.players.find((p2) => p2.isHost);
    const guest = room.players.find((p2) => !p2.isHost);
    if (host) host.color = "red";
    if (guest) guest.color = "yellow";
  } else {
    colorsToAssign = ["red", "green", "yellow", "blue"];
    room.players.forEach((pl, idx) => {
      pl.color = colorsToAssign[idx] || "red";
    });
  }
  room.players.forEach((pl, idx) => {
    pl.isReady = true;
    if (!pl.color) {
      pl.color = colorsToAssign[idx] || "red";
    }
  });
  const bet = room.betAmount;
  let success = true;
  room.players.forEach((pl) => {
    if (!isBotPlayer(pl.userId)) {
      const user = store.users[pl.userId];
      if (!user || user.balance < bet) {
        success = false;
      }
    }
  });
  if (!success) {
    return res.status(400).json({ error: "Nus ama mid ka mid ah ciyaartoyda kuma filna baaqiga wallet-kiisa bet-kan." });
  }
  let totalEscrow = 0;
  room.players.forEach((pl) => {
    if (!isBotPlayer(pl.userId)) {
      const user = store.users[pl.userId];
      user.balance -= bet;
      addTransaction(pl.userId, "bet_escrow_locked", bet, room.id, `Escrow lock for Match ${room.id}`);
      broadcastUserUpdate(pl.userId);
    }
    totalEscrow += bet;
  });
  const tokens = [];
  room.players.forEach((pl) => {
    tokens.push(...createInitialTokens(pl.userId, pl.color));
  });
  room.status = "playing";
  room.gameState.tokens = tokens;
  room.gameState.escrowBalance = totalEscrow;
  room.gameState.turn = 0;
  room.gameState.turnTimer = 30;
  addLog(room, `\u2694\uFE0F Ciyaartu waa ay bilaabatay! Ciyaartoyda: ${room.players.length}. Bet: $${bet}. Escrow Locked: $${totalEscrow}`);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/roll-dice", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.status !== "playing") return res.status(400).json({ error: "Game is not in playing state." });
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
  gs.lastDiceRoll = d;
  gs.hasRolled = true;
  addLog(room, `\u{1F3B2} ${activePlayer.username} rolled a ${d}!`);
  if (d === 6) {
    gs.consecutiveSixes = (gs.consecutiveSixes || 0) + 1;
  } else {
    gs.consecutiveSixes = 0;
  }
  if (gs.consecutiveSixes === 3) {
    addLog(room, `\u26A0\uFE0F Triple 6 Penalty! ${activePlayer.username} rolled three 6s in a row. Turn forfeited!`);
    gs.consecutiveSixes = 0;
    gs.diceRoll = null;
    gs.hasRolled = false;
    advanceTurn(room);
    saveStore();
    broadcastToRoom(room.id, "game_update", room);
    executeBotTurnIfActive(room);
    return res.json(room);
  }
  const playerTokens = gs.tokens.filter((t) => t.color === activePlayer.color);
  const validTokens = playerTokens.filter((t) => isMoveValid(t, d));
  if (validTokens.length === 0) {
    addLog(room, `${activePlayer.username} has no valid moves with roll ${d}. Turn passes.`);
    saveStore();
    broadcastToRoom(room.id, "game_update", room);
    res.json(room);
    setTimeout(() => {
      const currentRoom = store.rooms[roomId];
      if (currentRoom && currentRoom.status === "playing") {
        advanceTurn(currentRoom);
        saveStore();
        broadcastToRoom(currentRoom.id, "game_update", currentRoom);
        executeBotTurnIfActive(currentRoom);
      }
    }, 1500);
  } else {
    saveStore();
    broadcastToRoom(room.id, "game_update", room);
    res.json(room);
  }
});
app.post("/api/rooms/move-token", (req, res) => {
  const { userId, roomId, tokenId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.status !== "playing") return res.status(400).json({ error: "Game is not playing." });
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
  const token = gs.tokens.find((t) => t.id === tokenId);
  if (!token || token.color !== activePlayer.color) {
    return res.status(400).json({ error: "Invalid token selected." });
  }
  if (!isMoveValid(token, gs.diceRoll)) {
    return res.status(400).json({ error: "This token cannot make a valid move with the current roll." });
  }
  moveTokenLogic(room, tokenId, gs.diceRoll);
  broadcastToRoom(room.id, "game_update", room);
  executeBotTurnIfActive(room);
  res.json(room);
});
app.post("/api/rooms/chat", (req, res) => {
  const { userId, roomId, text } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const player = room.players.find((pl) => pl.userId === userId);
  const spectator = activeClients.find((c) => c.userId === userId && c.spectatingRoomId === roomId);
  if (!player && !spectator) {
    return res.status(403).json({ error: "You are not in this room as a player or spectator." });
  }
  const cleanText = (text || "").trim().substring(0, 100);
  if (cleanText.length > 0) {
    const senderName = player ? player.username : store.users[userId]?.username || "Spectator";
    const chatMsg = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: userId,
      senderName,
      text: cleanText,
      timestamp: Date.now(),
      isSpectator: !player
      // Mark as spectator message if not a player
    };
    room.gameState.chat.push(chatMsg);
    if (room.gameState.chat.length > 30) {
      room.gameState.chat.shift();
    }
    saveStore();
    broadcastToRoom(room.id, "game_update", room);
  }
  res.json(room);
});
app.post("/api/rooms/accept-player", (req, res) => {
  const { userId, roomId, challengerId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const host = room.players.find((p) => p.userId === userId);
  if (!host || !host.isHost) {
    return res.status(403).json({ error: "Only the host can accept players." });
  }
  if (!room.pendingPlayers) room.pendingPlayers = [];
  const idx = room.pendingPlayers.findIndex((p) => p.userId === challengerId);
  if (idx === -1) {
    return res.status(404).json({ error: "Challenger not found in pending list." });
  }
  const challenger = room.pendingPlayers.splice(idx, 1)[0];
  const colors = ["red", "green", "yellow", "blue"];
  const occupiedColors = room.players.map((p) => p.color);
  const color = colors.find((c) => !occupiedColors.includes(c)) || "green";
  let assignedColor;
  if (room.capacity === 2 && room.gameMode === "solo") {
    assignedColor = "yellow";
  } else {
    const colors2 = ["red", "green", "yellow", "blue"];
    const occupiedColors2 = room.players.map((p) => p.color);
    assignedColor = colors2.find((c) => !occupiedColors2.includes(c)) || "red";
  }
  challenger.color = assignedColor;
  challenger.isReady = false;
  room.players.push(challenger);
  addLog(room, `\u2705 Host accepted ${challenger.username} into the room.`);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  sendEventToUser(challengerId, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/decline-player", (req, res) => {
  const { userId, roomId, challengerId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const host = room.players.find((p) => p.userId === userId);
  if (!host || !host.isHost) {
    return res.status(403).json({ error: "Only the host can decline players." });
  }
  if (!room.pendingPlayers) room.pendingPlayers = [];
  const idx = room.pendingPlayers.findIndex((p) => p.userId === challengerId);
  if (idx === -1) {
    return res.status(404).json({ error: "Challenger not found in pending list." });
  }
  const challenger = room.pendingPlayers.splice(idx, 1)[0];
  addLog(room, `\u274C Host declined ${challenger.username}'s request.`);
  const rejectionRoomState = {
    ...room,
    rejectionReason: "Your request to join the room was declined by the host.",
    // Ensure the pending list sent to the rejected user is also empty of them
    pendingPlayers: room.pendingPlayers.filter((p) => p.userId !== challengerId)
  };
  sendEventToUser(challengerId, "game_update", rejectionRoomState);
  saveStore();
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/nudge", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((pl) => pl.userId === userId);
  if (!p) return res.status(403).json({ error: "You are not in this room." });
  const gs = room.gameState;
  const activePlayer = room.players[gs.turn];
  if (!activePlayer) return res.status(400).json({ error: "No active player to nudge." });
  addLog(room, `\u23F0 ${p.username} nudged ${activePlayer.username} to make a move!`);
  sendEventToUser(activePlayer.userId, "player_nudged", { nudgedBy: p.username });
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/emoji", (req, res) => {
  const { userId, roomId, emoji } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((pl) => pl.userId === userId);
  if (!p) return res.status(403).json({ error: "You are not in this room." });
  room.players.forEach((pl) => {
    sendEventToUser(pl.userId, "player_emoji", {
      senderId: userId,
      senderName: p.username,
      senderColor: p.color,
      emoji
    });
  });
  res.json({ success: true });
});
app.post("/api/rooms/leave", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((pl) => pl.userId === userId);
  if (!p) return res.status(404).json({ error: "Player not in room" });
  addLog(room, `${p.username} has left the game.`);
  if (room.status === "waiting") {
    room.players = room.players.filter((pl) => pl.userId !== userId);
    if (room.players.length === 0) {
      delete store.rooms[roomId];
    } else {
      if (p.isHost) {
        room.players[0].isHost = true;
        room.players[0].isReady = true;
        addLog(room, `${room.players[0].username} is now the host.`);
      }
      broadcastToRoom(room.id, "game_update", room);
    }
  } else if (room.status === "playing") {
    p.status = "left";
    const opponent = room.players.find((pl) => pl.userId !== userId && pl.status !== "left");
    if (opponent) {
      room.status = "completed";
      room.gameState.winnerId = opponent.userId;
      const leavingPlayerProfile = store.users[userId];
      if (leavingPlayerProfile) {
        leavingPlayerProfile.lossCount = (leavingPlayerProfile.lossCount || 0) + 1;
        addLog(room, `\u{1F62D} ${p.username} waa lagu helay ciyaarta!`);
        broadcastUserUpdate(userId);
      }
      const totalPayout = room.gameState.escrowBalance;
      addLog(room, `\u{1F3C6} ${p.username} has left the game. ${opponent.username} wins by forfeit and takes the pot of $${totalPayout.toFixed(2)}!`);
      if (room.betAmount > 0 && totalPayout > 0) {
        const winnerProfile = store.users[opponent.userId];
        if (winnerProfile && !isBotPlayer(winnerProfile.id)) {
          winnerProfile.balance += totalPayout;
          winnerProfile.winCount = (winnerProfile.winCount || 0) + 1;
          addTransaction(opponent.userId, "win_payout", totalPayout, room.id, `Win by opponent forfeit.`);
          broadcastUserUpdate(opponent.userId);
        }
      }
      room.gameState.escrowBalance = 0;
      broadcastToRoom(room.id, "game_update", room);
      res.json({ success: true, room });
    } else {
      room.status = "completed";
      broadcastToRoom(room.id, "game_update", room);
      res.json({ success: true, room });
    }
  }
  saveStore();
});
app.post("/api/rooms/:roomId/spectate", (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  if (room.status !== "playing") {
    return res.status(400).json({ error: "This game is not available for spectating." });
  }
  const client = activeClients.find((c) => c.userId === userId);
  if (client) {
    client.spectatingRoomId = roomId;
    sendEventToUser(userId, "game_update", room);
    res.json({ success: true, message: `You are now spectating room ${roomId}` });
  } else {
    res.status(404).json({ error: "Could not find an active connection for your user." });
  }
});
app.post("/api/rooms/:roomId/stop-spectating", (req, res) => {
  const { userId } = req.body;
  const client = activeClients.find((c) => c.userId === userId);
  if (client) {
    client.spectatingRoomId = void 0;
    res.json({ success: true, message: "Stopped spectating." });
  } else {
    res.status(404).json({ error: "Could not find an active connection for your user." });
  }
});
app.get("/api/rooms/check-status/:roomId", (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  if (room.status !== "playing") {
    return res.status(409).json({ error: "Game is not in a rejoinable state (e.g., waiting or completed).", room });
  }
  const playerInRoom = room.players.find((p) => p.userId === userId && p.status !== "left");
  if (!playerInRoom) {
    return res.status(403).json({ error: "You are not a player in this game" });
  }
  res.json(room);
});
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "password";
  if (username === adminUsername && password === adminPassword) {
    const adminUserId = "internal_admin_user_id";
    res.json({ success: true, userId: adminUserId });
  } else {
    res.status(401).json({ success: false, error: "Invalid username or password" });
  }
});
function isAdmin(req, res, next) {
  const { userId } = req.query;
  if (userId === "internal_admin_user_id") {
    return next();
  }
  const user = store.users[userId];
  if (user && user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Access denied. You do not have admin privileges." });
}
app.get("/api/admin/stats", isAdmin, (req, res) => {
  res.json({
    totalUsers: Object.keys(store.users).length,
    totalRooms: Object.keys(store.rooms).length,
    activeRooms: Object.values(store.rooms).filter((r) => r.status === "playing").length,
    waitingRooms: Object.values(store.rooms).filter((r) => r.status === "waiting").length,
    houseRevenue: store.houseRevenue || 0,
    onlineClients: activeClients.length
  });
});
app.get("/api/admin/users", isAdmin, (req, res) => {
  res.json(Object.values(store.users));
});
app.get("/api/admin/rooms", isAdmin, (req, res) => {
  res.json(Object.values(store.rooms));
});
app.get("/api/admin/transactions", isAdmin, (req, res) => {
  res.json(store.transactions);
});
app.post("/api/admin/impersonate", isAdmin, (req, res) => {
  const { userId } = req.body;
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ success: true, user });
});
app.post("/api/admin/users/:userId/update", isAdmin, (req, res) => {
  const { userId } = req.params;
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { balance, role, winCount, lossCount } = req.body;
  if (typeof balance === "number") {
    user.balance = balance;
  }
  if (role && ["admin", "player"].includes(role)) {
    user.role = role;
  }
  if (typeof winCount === "number") {
    user.winCount = winCount;
  }
  if (typeof lossCount === "number") {
    user.lossCount = lossCount;
  }
  saveStore();
  broadcastUserUpdate(user.id);
  res.json(user);
});
app.delete("/api/admin/users/:userId/delete", isAdmin, (req, res) => {
  const { userId } = req.params;
  if (store.users[userId]) {
    delete store.users[userId];
    saveStoreAndWait();
    res.json({ success: true, message: `User ${userId} has been deleted.` });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});
app.post("/api/admin/rooms/:roomId/cancel", isAdmin, (req, res) => {
  const { roomId } = req.params;
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  if (room.betAmount > 0) {
    room.players.forEach((p) => {
      if (!isBotPlayer(p.userId)) {
        const user = store.users[p.userId];
        if (user) {
          user.balance += room.betAmount;
          addTransaction(p.userId, "refund", room.betAmount, room.id, `Refund for canceled match ${room.id}.`);
          broadcastUserUpdate(p.userId);
        }
      }
    });
  }
  addLog(room, `Game canceled by admin. Bets refunded.`);
  broadcastToRoom(room.id, "game_canceled", { roomId });
  delete store.rooms[roomId];
  saveStore();
  res.json({ success: true, message: `Room ${roomId} has been canceled and bets refunded.` });
});
app.post("/api/admin/users/:userId/toggle-admin", isAdmin, (req, res) => {
  const { userId } = req.params;
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (user.role === "admin") {
    user.role = "player";
  } else {
    user.role = "admin";
  }
  saveStore();
  broadcastUserUpdate(user.id);
  res.json({ success: true, user });
});
app.get("/api/admin/users/:userId/games", isAdmin, (req, res) => {
  const { userId } = req.params;
  const userGames = Object.values(store.rooms).filter(
    (room) => room.players.some((p) => p.userId === userId)
  );
  res.json(userGames);
});
app.post("/api/admin/broadcast", isAdmin, (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }
  broadcastToAll("global_message", { message });
  res.json({ success: true, message: "Broadcast sent." });
});
async function startServer() {
  await loadStoreFromFirestore();
  purgeSimulatedUsers();
  let vite;
  if (process.env.NODE_ENV !== "production") {
    vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Betting Ludo Game Full-Stack App listening at http://localhost:${PORT}`);
  });
  server.on("upgrade", (req, socket, head) => {
    if (vite && req.url?.includes("__vite_hmr")) {
      vite.ws.handleUpgrade(req, socket, head);
    }
  });
  process.on("SIGINT", () => {
    console.log("\nShutting down server...");
    server.close(() => {
      console.log("Server shut down.");
      process.exit(0);
    });
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
