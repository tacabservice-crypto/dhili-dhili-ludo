var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

// src/sequelize.ts
import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";

// src/models/UserProfile.ts
import { Table as Table2, Column as Column2, Model as Model2, PrimaryKey as PrimaryKey2, Unique as Unique2, AllowNull as AllowNull2, DataType as DataType2, ForeignKey, BelongsTo } from "sequelize-typescript";

// src/models/Agent.ts
import { Table, Column, Model, PrimaryKey, Unique, AllowNull, DataType, HasMany } from "sequelize-typescript";
var Agent = class extends Model {
};
__decorateClass([
  PrimaryKey,
  Column(DataType.STRING)
], Agent.prototype, "id", 2);
__decorateClass([
  Unique,
  AllowNull(false),
  Column(DataType.STRING)
], Agent.prototype, "username", 2);
__decorateClass([
  Unique,
  AllowNull(false),
  Column(DataType.STRING)
], Agent.prototype, "phone", 2);
__decorateClass([
  AllowNull(false),
  Column(DataType.STRING)
], Agent.prototype, "password", 2);
__decorateClass([
  Unique,
  Column(DataType.STRING)
], Agent.prototype, "promo_code", 2);
__decorateClass([
  Column(DataType.STRING)
], Agent.prototype, "location", 2);
__decorateClass([
  AllowNull(false),
  Column(DataType.DECIMAL(5, 4))
], Agent.prototype, "commission_rate", 2);
__decorateClass([
  AllowNull(false),
  Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0
  })
], Agent.prototype, "balance", 2);
__decorateClass([
  Column(DataType.DECIMAL(10, 2))
], Agent.prototype, "float_balance", 2);
__decorateClass([
  AllowNull(false),
  Column({
    type: DataType.ENUM("Active", "Suspended"),
    defaultValue: "Active"
  })
], Agent.prototype, "status", 2);
__decorateClass([
  AllowNull(false),
  Column(DataType.BIGINT)
], Agent.prototype, "created_at", 2);
__decorateClass([
  HasMany(() => UserProfile)
], Agent.prototype, "linked_users", 2);
Agent = __decorateClass([
  Table({
    tableName: "agents",
    timestamps: false
    // We have createdAt as a BIGINT
  })
], Agent);

// src/models/UserProfile.ts
var UserProfile = class extends Model2 {
  // Unix timestamp
};
__decorateClass([
  PrimaryKey2,
  Column2(DataType2.STRING)
], UserProfile.prototype, "id", 2);
__decorateClass([
  Unique2,
  AllowNull2(false),
  Column2(DataType2.STRING)
], UserProfile.prototype, "username", 2);
__decorateClass([
  Unique2,
  Column2(DataType2.STRING)
], UserProfile.prototype, "email", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "phone", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "location", 2);
__decorateClass([
  AllowNull2(false),
  Column2(DataType2.STRING)
], UserProfile.prototype, "avatar", 2);
__decorateClass([
  AllowNull2(false),
  Column2({
    type: DataType2.DECIMAL(10, 2),
    defaultValue: 0
  })
], UserProfile.prototype, "balance", 2);
__decorateClass([
  AllowNull2(false),
  Column2({
    type: DataType2.INTEGER,
    defaultValue: 0
  })
], UserProfile.prototype, "win_count", 2);
__decorateClass([
  AllowNull2(false),
  Column2({
    type: DataType2.INTEGER,
    defaultValue: 0
  })
], UserProfile.prototype, "loss_count", 2);
__decorateClass([
  Column2({
    type: DataType2.BOOLEAN,
    defaultValue: false
  })
], UserProfile.prototype, "is_offline_preference", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "vip_tier", 2);
__decorateClass([
  Column2(DataType2.BIGINT)
], UserProfile.prototype, "vip_expires", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "role", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "password", 2);
__decorateClass([
  ForeignKey(() => Agent),
  Column2(DataType2.STRING)
], UserProfile.prototype, "linked_agent_id", 2);
__decorateClass([
  BelongsTo(() => Agent)
], UserProfile.prototype, "agent", 2);
__decorateClass([
  Column2(DataType2.STRING)
], UserProfile.prototype, "promo_code", 2);
__decorateClass([
  Unique2,
  Column2(DataType2.STRING)
], UserProfile.prototype, "firebase_uid", 2);
__decorateClass([
  AllowNull2(false),
  Column2(DataType2.BIGINT)
], UserProfile.prototype, "created_at", 2);
UserProfile = __decorateClass([
  Table2({
    tableName: "user_profiles",
    timestamps: false
    // We have createdAt as a BIGINT
  })
], UserProfile);

// src/models/WalletTransaction.ts
import { Table as Table3, Column as Column3, Model as Model3, PrimaryKey as PrimaryKey3, AllowNull as AllowNull3, DataType as DataType3, ForeignKey as ForeignKey2, BelongsTo as BelongsTo2 } from "sequelize-typescript";
var WalletTransaction = class extends Model3 {
};
__decorateClass([
  PrimaryKey3,
  Column3(DataType3.STRING)
], WalletTransaction.prototype, "id", 2);
__decorateClass([
  ForeignKey2(() => UserProfile),
  AllowNull3(false),
  Column3(DataType3.STRING)
], WalletTransaction.prototype, "user_id", 2);
__decorateClass([
  BelongsTo2(() => UserProfile)
], WalletTransaction.prototype, "user", 2);
__decorateClass([
  AllowNull3(false),
  Column3(DataType3.ENUM("deposit", "withdrawal", "bet_escrow_locked", "bet_escrow_refund", "win_payout", "app_commission", "refund"))
], WalletTransaction.prototype, "type", 2);
__decorateClass([
  AllowNull3(false),
  Column3(DataType3.DECIMAL(10, 2))
], WalletTransaction.prototype, "amount", 2);
__decorateClass([
  AllowNull3(false),
  Column3(DataType3.BIGINT)
], WalletTransaction.prototype, "timestamp", 2);
__decorateClass([
  Column3(DataType3.STRING)
], WalletTransaction.prototype, "match_id", 2);
__decorateClass([
  Column3(DataType3.TEXT)
], WalletTransaction.prototype, "description", 2);
WalletTransaction = __decorateClass([
  Table3({
    tableName: "wallet_transactions",
    timestamps: false
    // We have timestamp as a BIGINT
  })
], WalletTransaction);

// src/models/AgentTransaction.ts
import { Table as Table4, Column as Column4, Model as Model4, PrimaryKey as PrimaryKey4, DataType as DataType4 } from "sequelize-typescript";
var AgentTransaction = class extends Model4 {
};
__decorateClass([
  PrimaryKey4,
  Column4(DataType4.STRING)
], AgentTransaction.prototype, "id", 2);
__decorateClass([
  Column4(DataType4.STRING)
], AgentTransaction.prototype, "agent_id", 2);
__decorateClass([
  Column4(DataType4.STRING)
], AgentTransaction.prototype, "type", 2);
__decorateClass([
  Column4(DataType4.DECIMAL)
], AgentTransaction.prototype, "amount", 2);
__decorateClass([
  Column4(DataType4.DECIMAL)
], AgentTransaction.prototype, "discount_amount", 2);
__decorateClass([
  Column4(DataType4.STRING)
], AgentTransaction.prototype, "player_id", 2);
__decorateClass([
  Column4(DataType4.STRING)
], AgentTransaction.prototype, "player_name", 2);
__decorateClass([
  Column4(DataType4.BIGINT)
], AgentTransaction.prototype, "timestamp", 2);
__decorateClass([
  Column4(DataType4.TEXT)
], AgentTransaction.prototype, "description", 2);
AgentTransaction = __decorateClass([
  Table4({ tableName: "agent_transactions", timestamps: false })
], AgentTransaction);

// src/models/AgentRequest.ts
import { Table as Table5, Column as Column5, Model as Model5, PrimaryKey as PrimaryKey5, DataType as DataType5 } from "sequelize-typescript";
var AgentRequest = class extends Model5 {
};
__decorateClass([
  PrimaryKey5,
  Column5(DataType5.STRING)
], AgentRequest.prototype, "id", 2);
__decorateClass([
  Column5(DataType5.STRING)
], AgentRequest.prototype, "agent_id", 2);
__decorateClass([
  Column5(DataType5.STRING)
], AgentRequest.prototype, "agent_username", 2);
__decorateClass([
  Column5(DataType5.DECIMAL)
], AgentRequest.prototype, "amount", 2);
__decorateClass([
  Column5(DataType5.STRING)
], AgentRequest.prototype, "status", 2);
__decorateClass([
  Column5(DataType5.BIGINT)
], AgentRequest.prototype, "created_at", 2);
__decorateClass([
  Column5(DataType5.BIGINT)
], AgentRequest.prototype, "resolved_at", 2);
__decorateClass([
  Column5(DataType5.STRING)
], AgentRequest.prototype, "resolved_by", 2);
__decorateClass([
  Column5(DataType5.STRING)
], AgentRequest.prototype, "resolver_username", 2);
AgentRequest = __decorateClass([
  Table5({ tableName: "agent_requests", timestamps: false })
], AgentRequest);

// src/models/PlayerAgentRequestModel.ts
import { Table as Table6, Column as Column6, Model as Model6, PrimaryKey as PrimaryKey6, DataType as DataType6 } from "sequelize-typescript";
var PlayerAgentRequestModel = class extends Model6 {
};
__decorateClass([
  PrimaryKey6,
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "id", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "player_id", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "player_username", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "player_avatar", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "agent_id", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "player_phone", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "sender_phone", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "provider", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "type", 2);
__decorateClass([
  Column6(DataType6.DECIMAL)
], PlayerAgentRequestModel.prototype, "amount", 2);
__decorateClass([
  Column6(DataType6.STRING)
], PlayerAgentRequestModel.prototype, "status", 2);
__decorateClass([
  Column6(DataType6.BIGINT)
], PlayerAgentRequestModel.prototype, "created_at", 2);
PlayerAgentRequestModel = __decorateClass([
  Table6({ tableName: "player_agent_requests", timestamps: false })
], PlayerAgentRequestModel);

// src/models/AdminUser.ts
import { Table as Table7, Column as Column7, Model as Model7, PrimaryKey as PrimaryKey7, DataType as DataType7, Unique as Unique3 } from "sequelize-typescript";
var AdminUser = class extends Model7 {
};
__decorateClass([
  PrimaryKey7,
  Column7(DataType7.STRING)
], AdminUser.prototype, "id", 2);
__decorateClass([
  Unique3,
  Column7(DataType7.STRING)
], AdminUser.prototype, "username", 2);
__decorateClass([
  Column7(DataType7.STRING)
], AdminUser.prototype, "password_hash", 2);
__decorateClass([
  Column7(DataType7.JSON)
], AdminUser.prototype, "permissions", 2);
AdminUser = __decorateClass([
  Table7({ tableName: "admin_users", timestamps: false })
], AdminUser);

// src/models/MatchmakingModel.ts
import { Table as Table8, Column as Column8, Model as Model8, PrimaryKey as PrimaryKey8, DataType as DataType8 } from "sequelize-typescript";
var MatchmakingModel = class extends Model8 {
};
__decorateClass([
  PrimaryKey8,
  Column8(DataType8.STRING)
], MatchmakingModel.prototype, "user_id", 2);
__decorateClass([
  Column8(DataType8.STRING)
], MatchmakingModel.prototype, "username", 2);
__decorateClass([
  Column8(DataType8.STRING)
], MatchmakingModel.prototype, "avatar", 2);
__decorateClass([
  Column8(DataType8.DECIMAL)
], MatchmakingModel.prototype, "bet_amount", 2);
__decorateClass([
  Column8(DataType8.INTEGER)
], MatchmakingModel.prototype, "capacity", 2);
__decorateClass([
  Column8(DataType8.STRING)
], MatchmakingModel.prototype, "game_mode", 2);
__decorateClass([
  Column8(DataType8.STRING)
], MatchmakingModel.prototype, "status", 2);
__decorateClass([
  Column8(DataType8.BIGINT)
], MatchmakingModel.prototype, "timestamp", 2);
MatchmakingModel = __decorateClass([
  Table8({ tableName: "matchmaking", timestamps: false })
], MatchmakingModel);

// src/models/GameRoom.ts
import { Table as Table10, Column as Column10, Model as Model10, PrimaryKey as PrimaryKey10, DataType as DataType10, HasMany as HasMany2 } from "sequelize-typescript";

// src/models/LudoPlayer.ts
import { Table as Table9, Column as Column9, Model as Model9, DataType as DataType9, ForeignKey as ForeignKey3, BelongsTo as BelongsTo3, PrimaryKey as PrimaryKey9 } from "sequelize-typescript";
var LudoPlayer = class extends Model9 {
};
__decorateClass([
  PrimaryKey9,
  ForeignKey3(() => GameRoom),
  Column9({
    type: DataType9.STRING,
    allowNull: false
  })
], LudoPlayer.prototype, "room_id", 2);
__decorateClass([
  PrimaryKey9,
  ForeignKey3(() => UserProfile),
  Column9({
    type: DataType9.STRING,
    allowNull: false
  })
], LudoPlayer.prototype, "user_id", 2);
__decorateClass([
  BelongsTo3(() => UserProfile)
], LudoPlayer.prototype, "user", 2);
__decorateClass([
  BelongsTo3(() => GameRoom)
], LudoPlayer.prototype, "gameRoom", 2);
__decorateClass([
  Column9({
    type: DataType9.STRING,
    allowNull: false
  })
], LudoPlayer.prototype, "username", 2);
__decorateClass([
  Column9({
    type: DataType9.STRING,
    allowNull: false
  })
], LudoPlayer.prototype, "avatar", 2);
__decorateClass([
  Column9({
    type: DataType9.ENUM("red", "green", "yellow", "blue"),
    allowNull: false
  })
], LudoPlayer.prototype, "color", 2);
__decorateClass([
  Column9({
    type: DataType9.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
], LudoPlayer.prototype, "is_host", 2);
__decorateClass([
  Column9({
    type: DataType9.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
], LudoPlayer.prototype, "is_ready", 2);
__decorateClass([
  Column9({
    type: DataType9.ENUM("online", "offline", "left"),
    allowNull: false,
    defaultValue: "online"
  })
], LudoPlayer.prototype, "status", 2);
__decorateClass([
  Column9({
    type: DataType9.INTEGER,
    allowNull: true
  })
], LudoPlayer.prototype, "inactivityTimer", 2);
LudoPlayer = __decorateClass([
  Table9({
    tableName: "game_players",
    timestamps: false
  })
], LudoPlayer);

// src/models/GameRoom.ts
var GameRoom = class extends Model10 {
};
__decorateClass([
  PrimaryKey10,
  Column10({
    type: DataType10.STRING,
    allowNull: false
  })
], GameRoom.prototype, "id", 2);
__decorateClass([
  Column10({
    type: DataType10.ENUM("waiting", "playing", "completed", "cancelled"),
    allowNull: false
  })
], GameRoom.prototype, "status", 2);
__decorateClass([
  Column10({
    type: DataType10.DECIMAL(10, 2),
    allowNull: false
  })
], GameRoom.prototype, "betAmount", 2);
__decorateClass([
  HasMany2(() => LudoPlayer)
], GameRoom.prototype, "players", 2);
__decorateClass([
  Column10({
    type: DataType10.JSON,
    allowNull: true
  })
], GameRoom.prototype, "spectators", 2);
__decorateClass([
  Column10({
    type: DataType10.JSON,
    allowNull: false
  })
], GameRoom.prototype, "gameState", 2);
__decorateClass([
  Column10({
    type: DataType10.DATE,
    allowNull: false
  })
], GameRoom.prototype, "createdAt", 2);
__decorateClass([
  Column10({
    type: DataType10.INTEGER,
    allowNull: true
  })
], GameRoom.prototype, "capacity", 2);
__decorateClass([
  Column10({
    type: DataType10.ENUM("solo", "team"),
    allowNull: true
  })
], GameRoom.prototype, "gameMode", 2);
__decorateClass([
  HasMany2(() => LudoPlayer)
], GameRoom.prototype, "pendingPlayers", 2);
__decorateClass([
  Column10({
    type: DataType10.STRING,
    allowNull: true
  })
], GameRoom.prototype, "rejectionReason", 2);
__decorateClass([
  Column10({
    type: DataType10.JSON,
    allowNull: true
  })
], GameRoom.prototype, "tournamentDetails", 2);
GameRoom = __decorateClass([
  Table10({
    tableName: "game_rooms",
    timestamps: true
  })
], GameRoom);

// src/models/LudoToken.ts
import { Table as Table12, Column as Column12, Model as Model12, PrimaryKey as PrimaryKey11, DataType as DataType12, ForeignKey as ForeignKey5, BelongsTo as BelongsTo5 } from "sequelize-typescript";

// src/models/GameState.ts
import { Table as Table11, Column as Column11, Model as Model11, DataType as DataType11, HasMany as HasMany3, ForeignKey as ForeignKey4, BelongsTo as BelongsTo4 } from "sequelize-typescript";
var GameState = class extends Model11 {
};
__decorateClass([
  ForeignKey4(() => GameRoom),
  Column11({
    type: DataType11.STRING,
    allowNull: false,
    primaryKey: true
  })
], GameState.prototype, "gameRoomId", 2);
__decorateClass([
  BelongsTo4(() => GameRoom)
], GameState.prototype, "gameRoom", 2);
__decorateClass([
  Column11({
    type: DataType11.INTEGER,
    allowNull: false
  })
], GameState.prototype, "turn", 2);
__decorateClass([
  Column11({
    type: DataType11.INTEGER,
    allowNull: true
  })
], GameState.prototype, "diceRoll", 2);
__decorateClass([
  Column11({
    type: DataType11.INTEGER,
    allowNull: true
  })
], GameState.prototype, "lastDiceRoll", 2);
__decorateClass([
  Column11({
    type: DataType11.BOOLEAN,
    allowNull: false
  })
], GameState.prototype, "hasRolled", 2);
__decorateClass([
  Column11({
    type: DataType11.INTEGER,
    allowNull: false
  })
], GameState.prototype, "turnTimer", 2);
__decorateClass([
  HasMany3(() => LudoToken)
], GameState.prototype, "tokens", 2);
__decorateClass([
  Column11({
    type: DataType11.STRING,
    allowNull: true
  })
], GameState.prototype, "winnerId", 2);
__decorateClass([
  Column11({
    type: DataType11.ENUM("forfeit", "inactivity", "all_tokens_home"),
    allowNull: true
  })
], GameState.prototype, "completionReason", 2);
__decorateClass([
  Column11({
    type: DataType11.STRING,
    allowNull: true
  })
], GameState.prototype, "endReasonText", 2);
__decorateClass([
  Column11({
    type: DataType11.DECIMAL(10, 2),
    allowNull: false
  })
], GameState.prototype, "escrowBalance", 2);
__decorateClass([
  Column11({
    type: DataType11.JSON,
    allowNull: false
  })
], GameState.prototype, "logs", 2);
__decorateClass([
  Column11({
    type: DataType11.JSON,
    allowNull: false
  })
], GameState.prototype, "chat", 2);
__decorateClass([
  Column11({
    type: DataType11.DATE,
    allowNull: false
  })
], GameState.prototype, "lastActivity", 2);
__decorateClass([
  Column11({
    type: DataType11.INTEGER,
    allowNull: true
  })
], GameState.prototype, "consecutiveSixes", 2);
GameState = __decorateClass([
  Table11({
    tableName: "game_states",
    timestamps: false
  })
], GameState);

// src/models/LudoToken.ts
var LudoToken = class extends Model12 {
};
__decorateClass([
  PrimaryKey11,
  Column12({
    type: DataType12.STRING,
    allowNull: false
  })
], LudoToken.prototype, "id", 2);
__decorateClass([
  ForeignKey5(() => GameState),
  Column12({
    type: DataType12.STRING,
    allowNull: false
  })
], LudoToken.prototype, "gameStateId", 2);
__decorateClass([
  BelongsTo5(() => GameState)
], LudoToken.prototype, "gameState", 2);
__decorateClass([
  ForeignKey5(() => UserProfile),
  Column12({
    type: DataType12.STRING,
    allowNull: false
  })
], LudoToken.prototype, "ownerId", 2);
__decorateClass([
  BelongsTo5(() => UserProfile)
], LudoToken.prototype, "owner", 2);
__decorateClass([
  Column12({
    type: DataType12.ENUM("red", "green", "yellow", "blue"),
    allowNull: false
  })
], LudoToken.prototype, "color", 2);
__decorateClass([
  Column12({
    type: DataType12.INTEGER,
    allowNull: false
  })
], LudoToken.prototype, "position", 2);
LudoToken = __decorateClass([
  Table12({
    tableName: "ludo_tokens",
    timestamps: false
  })
], LudoToken);

// src/sequelize.ts
dotenv.config();
var sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: Number(process.env.DB_PORT || 3306),
    logging: false,
    // Set to console.log to see SQL queries
    models: [
      UserProfile,
      Agent,
      WalletTransaction,
      AgentTransaction,
      AgentRequest,
      PlayerAgentRequestModel,
      AdminUser,
      MatchmakingModel,
      GameRoom,
      LudoPlayer,
      LudoToken
    ]
  }
);
var sequelize_default = sequelize;

// src/database.ts
function mapToUserProfileType(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    location: user.location,
    avatar: user.avatar,
    balance: typeof user.balance === "string" ? parseFloat(user.balance) : user.balance,
    winCount: user.winCount,
    lossCount: user.lossCount,
    isOfflinePreference: user.isOfflinePreference,
    vip: user.vipTier && user.vipExpires ? { tier: user.vipTier, expires: user.vipExpires } : void 0,
    role: user.role,
    password: user.password,
    linkedAgentId: user.linkedAgentId,
    promoCode: user.promoCode,
    firebaseUid: user.firebaseUid,
    createdAt: user.createdAt
  };
}
function mapToAgentType(agent) {
  return {
    id: agent.id,
    username: agent.username,
    phone: agent.phone,
    password: agent.password,
    promoCode: agent.promoCode,
    location: agent.location,
    commissionRate: typeof agent.commissionRate === "string" ? parseFloat(agent.commissionRate) : agent.commissionRate,
    balance: typeof agent.balance === "string" ? parseFloat(agent.balance) : agent.balance,
    floatBalance: agent.floatBalance ? typeof agent.floatBalance === "string" ? parseFloat(agent.floatBalance) : agent.floatBalance : 0,
    status: agent.status,
    createdAt: agent.createdAt
  };
}
async function getUserById(userId) {
  const user = await UserProfile.findByPk(userId);
  return user ? mapToUserProfileType(user) : null;
}
async function getUserByFirebaseUid(firebaseUid) {
  const user = await UserProfile.findOne({ where: { firebaseUid } });
  return user ? mapToUserProfileType(user) : null;
}
async function createUser(user) {
  await UserProfile.create({
    id: user.id,
    firebaseUid: user.firebaseUid,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    balance: user.balance,
    winCount: user.winCount,
    lossCount: user.lossCount,
    linkedAgentId: user.linkedAgentId,
    promoCode: user.promoCode,
    createdAt: user.createdAt,
    isOfflinePreference: user.isOfflinePreference,
    vipTier: user.vip?.tier,
    vipExpires: user.vip?.expires,
    role: user.role,
    password: user.password
  });
}
async function updateUser(userId, updates) {
  const updateData = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === "vip") {
      updateData.vipTier = value?.tier;
      updateData.vipExpires = value?.expires;
    } else if (key === "password") {
      updateData.password = value;
    } else {
      const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updateData[snakeCaseKey] = value;
    }
  }
  if (Object.keys(updateData).length > 0) {
    await UserProfile.update(updateData, { where: { id: userId } });
  }
}
async function getAgentById(agentId) {
  const agent = await Agent.findByPk(agentId);
  return agent ? mapToAgentType(agent) : null;
}
async function createAgent(agent) {
  await Agent.create({
    id: agent.id,
    username: agent.username,
    password: agent.password,
    // This should be a hash
    phone: agent.phone,
    location: agent.location,
    commissionRate: agent.commissionRate,
    promoCode: agent.promoCode,
    balance: agent.balance,
    floatBalance: agent.floatBalance,
    status: agent.status,
    createdAt: agent.createdAt
  });
}
async function updateAgent(agentId, updates) {
  const updateData = {};
  for (const [key, value] of Object.entries(updates)) {
    const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    updateData[snakeCaseKey] = value;
  }
  if (Object.keys(updateData).length > 0) {
    await Agent.update(updateData, { where: { id: agentId } });
  }
}
async function createTransaction(transaction) {
  await WalletTransaction.create({
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: transaction.amount,
    matchId: transaction.matchId,
    description: transaction.description,
    timestamp: transaction.timestamp
  });
}
async function createPlayerAgentRequest(request) {
  await PlayerAgentRequestModel.create({
    id: request.id,
    playerId: request.playerId,
    playerUsername: request.playerUsername,
    playerAvatar: request.playerAvatar,
    agentId: request.agentId,
    playerPhone: request.playerPhone,
    senderPhone: request.senderPhone,
    provider: request.provider,
    type: request.type,
    amount: request.amount,
    status: request.status,
    createdAt: request.createdAt
  });
}
async function getAdminUserByUsername(username) {
  const admin = await AdminUser.findOne({ where: { username } });
  return admin ? admin.get({ plain: true }) : null;
}
async function getAgentByPromoCode(promoCode) {
  const agent = await Agent.findOne({ where: { promoCode } });
  return agent ? mapToAgentType(agent) : null;
}
async function linkAgentToPlayer(agentId, playerId) {
  await UserProfile.update(
    { linkedAgentId: agentId },
    { where: { id: playerId } }
  );
}
async function getTransactionsByUserId(userId) {
  const transactions = await WalletTransaction.findAll({
    where: { userId },
    order: [["timestamp", "DESC"]],
    limit: 100
  });
  return transactions.map((t) => ({
    id: t.id,
    userId: t.userId,
    type: t.type,
    amount: typeof t.amount === "string" ? parseFloat(t.amount) : t.amount,
    timestamp: t.timestamp,
    matchId: t.matchId,
    description: t.description
  }));
}
async function getAgents() {
  const agents = await Agent.findAll();
  return agents.map(mapToAgentType);
}
async function addUserToMatchmakingQueue(matchmaking) {
  await MatchmakingModel.upsert({
    userId: matchmaking.userId,
    username: matchmaking.username,
    avatar: matchmaking.avatar,
    betAmount: matchmaking.betAmount,
    capacity: matchmaking.capacity,
    gameMode: matchmaking.gameMode,
    status: matchmaking.status,
    timestamp: matchmaking.timestamp
  });
}
async function removeUsersFromMatchmakingQueue(userIds) {
  if (userIds.length === 0) return;
  await MatchmakingModel.destroy({ where: { userId: userIds } });
}
async function createAdminUser(adminUser) {
  await AdminUser.create({
    id: adminUser.id,
    username: adminUser.username,
    passwordHash: adminUser.password,
    // Assuming password is a hash
    permissions: adminUser.permissions
  });
}
async function getAllAdminUsers() {
  const admins = await AdminUser.findAll();
  return admins.map((admin) => admin.get({ plain: true }));
}
async function getAdminUserById(adminId) {
  const admin = await AdminUser.findByPk(adminId);
  return admin ? admin.get({ plain: true }) : null;
}
async function updateAdminUser(adminId, updates) {
  const updateData = {};
  if (updates.password) {
    updateData.passwordHash = updates.password;
  }
  if (updates.permissions) {
    updateData.permissions = updates.permissions;
  }
  if (Object.keys(updateData).length > 0) {
    await AdminUser.update(updateData, { where: { id: adminId } });
  }
}
async function deleteAdminUser(adminId) {
  await AdminUser.destroy({ where: { id: adminId } });
}
async function getAgentByUsername(username) {
  const agent = await Agent.findOne({ where: { username } });
  return agent ? mapToAgentType(agent) : null;
}
async function getAgentRequests() {
  const requests = await AgentRequest.findAll({ order: [["createdAt", "DESC"]] });
  return requests.map((r) => r.get({ plain: true }));
}
async function approveAgentRequest(requestId, adminId) {
  await sequelize_default.transaction(async (t) => {
    const request = await AgentRequest.findByPk(requestId, { transaction: t, lock: true });
    if (!request) throw new Error("Request not found.");
    if (request.status !== "pending") throw new Error("This request has already been processed.");
    const agent = await Agent.findByPk(request.agentId, { transaction: t, lock: true });
    if (!agent) throw new Error("Agent associated with the request not found.");
    const admin = await AdminUser.findByPk(adminId, { transaction: t });
    const resolverUsername = admin ? admin.username : "Unknown Admin";
    const currentFloat = agent.floatBalance ? typeof agent.floatBalance === "string" ? parseFloat(agent.floatBalance) : agent.floatBalance : 0;
    const requestAmount = typeof request.amount === "string" ? parseFloat(request.amount) : request.amount;
    const newFloatBalance = currentFloat + requestAmount;
    await agent.update({ floatBalance: newFloatBalance }, { transaction: t });
    await request.update({
      status: "approved",
      resolvedAt: Date.now(),
      resolvedBy: adminId,
      resolverUsername
    }, { transaction: t });
    await AgentTransaction.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId: request.agentId,
      type: "FloatPurchase",
      amount: request.amount,
      timestamp: Date.now(),
      description: `Float request for ${request.amount} approved by admin. Request ID: ${request.id}`
    }, { transaction: t });
  });
}
async function rejectAgentRequest(requestId, adminId) {
  const admin = await AdminUser.findByPk(adminId);
  const resolverUsername = admin ? admin.username : "Unknown Admin";
  await AgentRequest.update({
    status: "rejected",
    resolvedAt: Date.now(),
    resolvedBy: adminId,
    resolverUsername
  }, { where: { id: requestId, status: "pending" } });
}
async function getAgentTransactions(agentId) {
  const transactions = await AgentTransaction.findAll({
    where: { agentId },
    order: [["timestamp", "DESC"]]
  });
  return transactions.map((t) => t.get({ plain: true }));
}
async function depositToPlayer(agentId, playerId, amount) {
  return await sequelize_default.transaction(async (t) => {
    const agent = await Agent.findByPk(agentId, { transaction: t, lock: true });
    if (!agent) throw new Error("Agent not found.");
    const agentFloat = agent.floatBalance ? typeof agent.floatBalance === "string" ? parseFloat(agent.floatBalance) : agent.floatBalance : 0;
    if (agentFloat < amount) throw new Error("Insufficient float balance.");
    const player = await UserProfile.findByPk(playerId, { transaction: t, lock: true });
    if (!player) throw new Error("Player not found.");
    const playerBalance = typeof player.balance === "string" ? parseFloat(player.balance) : player.balance;
    const newAgentBalance = agentFloat - amount;
    const newPlayerBalance = playerBalance + amount;
    await agent.update({ floatBalance: newAgentBalance }, { transaction: t });
    await player.update({ balance: newPlayerBalance }, { transaction: t });
    await AgentTransaction.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId,
      type: "PlayerDeposit",
      amount,
      playerId,
      playerName: player.username,
      timestamp: Date.now(),
      description: `Deposited ${amount} into ${player.username}'s account.`
    }, { transaction: t });
    await WalletTransaction.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: playerId,
      type: "deposit",
      amount,
      timestamp: Date.now(),
      description: `Deposit received from agent ${agent.username}.`
    }, { transaction: t });
    return { newAgentBalance, newPlayerBalance };
  });
}
function mapToLudoPlayerType(player) {
  return {
    userId: player.userId,
    username: player.username,
    avatar: player.avatar,
    color: player.color,
    isHost: player.isHost,
    isReady: player.isReady,
    status: player.status
  };
}
function mapToGameRoomType(room) {
  return {
    id: room.id,
    status: room.status,
    betAmount: typeof room.betAmount === "string" ? parseFloat(room.betAmount) : room.betAmount,
    capacity: room.capacity,
    gameMode: room.gameMode,
    players: room.players ? room.players.map(mapToLudoPlayerType) : [],
    createdAt: room.createdAt,
    gameState: room.gameState
    // Assuming direct mapping for now
  };
}
async function getRoomById(roomId) {
  const room = await GameRoom.findByPk(roomId, {
    include: [{ model: LudoPlayer, include: [UserProfile] }]
  });
  if (!room) {
    return null;
  }
  return mapToGameRoomType(room);
}
async function startGame(roomId, hostId) {
  return sequelize_default.transaction(async (t) => {
    const room = await GameRoom.findByPk(roomId, {
      include: [{ model: LudoPlayer, include: [UserProfile] }],
      transaction: t,
      lock: true
    });
    if (!room) throw new Error("Room not found.");
    if (room.status !== "waiting") throw new Error("Game has already started.");
    const host = room.players?.find((p) => p.userId === hostId);
    if (!host || !host.isHost) throw new Error("Only the host can start the game.");
    if (!room.players || room.players.length < 2) throw new Error("At least 2 players are required to start.");
    const bet = typeof room.betAmount === "string" ? parseFloat(room.betAmount) : room.betAmount;
    let totalEscrow = 0;
    for (const player of room.players) {
      if (player.userId.startsWith("bot_")) {
        totalEscrow += bet;
        continue;
      }
      if (!player.user) throw new Error(`User profile not found for player ${player.username}`);
      const balance = typeof player.user.balance === "string" ? parseFloat(player.user.balance) : player.user.balance;
      if (balance < bet) {
        throw new Error(`Player ${player.username} has insufficient balance.`);
      }
      await player.user.update({ balance: balance - bet }, { transaction: t });
      totalEscrow += bet;
    }
    const initialTokens = [];
    const tokenCreations = room.players.map((player) => {
      return [0, 1, 2, 3].map((i) => {
        const tokenId = `token_${player.color}_${i}`;
        initialTokens.push({ id: tokenId, ownerId: player.userId, color: player.color, position: -1 });
        return LudoToken.create({
          id: tokenId,
          roomId,
          ownerId: player.userId,
          color: player.color,
          position: -1
          // Home Base
        }, { transaction: t });
      });
    }).flat();
    await Promise.all(tokenCreations);
    const newGameState = {
      ...room.gameState,
      tokens: initialTokens,
      escrowBalance: totalEscrow,
      turn: 0,
      turnTimer: 30,
      logs: [
        ...room.gameState.logs,
        { id: `log_${Date.now()}`, timestamp: Date.now(), text: `\u2694\uFE0F The game has started! Bet: $${bet}. Total pot: $${totalEscrow}` }
      ]
    };
    await room.update({ status: "playing", gameState: newGameState }, { transaction: t });
    const finalRoom = await getRoomById(roomId);
    if (!finalRoom) throw new Error("Could not retrieve final room state.");
    return finalRoom;
  });
}
async function removePlayerFromRoom(roomId, userId) {
  const room = await GameRoom.findByPk(roomId, { include: [LudoPlayer] });
  if (!room) throw new Error("Room not found.");
  const playerToRemove = room.players?.find((p) => p.userId === userId);
  if (!playerToRemove) throw new Error("Player not found in this room.");
  if (room.status === "waiting") {
    await LudoPlayer.destroy({ where: { roomId, userId } });
    const remainingPlayers = room.players?.filter((p) => p.userId !== userId) || [];
    if (remainingPlayers.length === 0) {
      await GameRoom.destroy({ where: { id: roomId } });
      return null;
    }
    if (playerToRemove.isHost) {
      const newHost = remainingPlayers[0];
      await LudoPlayer.update({ isHost: true }, { where: { roomId, userId: newHost.userId } });
    }
  } else if (room.status === "playing") {
    await LudoPlayer.update({ status: "left" }, { where: { roomId, userId } });
    const activePlayers = room.players?.filter((p) => p.userId !== userId && p.status !== "left") || [];
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      await GameRoom.update({ status: "completed", winner_id: winner.userId }, { where: { id: roomId } });
    }
  }
  return await getRoomById(roomId);
}

// src/utils.ts
var START_OFFSETS = {
  green: 0,
  yellow: 13,
  blue: 26,
  red: 39
};
var SAFE_GLOBAL_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
var HOME_ENTRY_POSITIONS = {
  green: 50,
  yellow: 11,
  blue: 24,
  red: 37
};
function getGlobalPosition(color, relativePos) {
  if (relativePos < 0 || relativePos > 50) return null;
  const offset = START_OFFSETS[color];
  return (offset + relativePos) % 52;
}
function isBotPlayer(userId) {
  return userId.startsWith("bot_") || userId.startsWith("sim_");
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
async function moveTokenLogic(room, tokenId, roll) {
  const gs = room.gameState;
  const token = gs.tokens.find((t) => t.id === tokenId);
  if (!token) return;
  let nextPos = token.position + roll;
  if (token.position === -1 && roll === 6) {
    nextPos = 0;
  }
  const homeEntry = HOME_ENTRY_POSITIONS[token.color];
  if (token.position <= homeEntry && nextPos > homeEntry) {
    nextPos = 50 + (nextPos - homeEntry);
  }
  if (nextPos > 56) {
    return;
  }
  token.position = nextPos;
  const globalPos = getGlobalPosition(token.color, nextPos);
  if (globalPos !== null && !SAFE_GLOBAL_SQUARES.includes(globalPos)) {
    gs.tokens.forEach((t) => {
      if (t.color !== token.color && t.position >= 0 && t.position <= 50) {
        const opGlobal = getGlobalPosition(t.color, t.position);
        if (opGlobal === globalPos) {
          t.position = -1;
          addLog(room, `\u2694\uFE0F ${room.players.find((p) => p.userId === token.ownerId)?.username} captured ${room.players.find((p) => p.userId === t.ownerId)?.username}'s token!`);
        }
      }
    });
  }
  const playerTokens = gs.tokens.filter((t) => t.color === token.color);
  if (playerTokens.every((t) => t.position === 56)) {
    gs.winnerId = token.ownerId;
    room.status = "completed";
    addLog(room, `\u{1F389} ${room.players.find((p) => p.userId === token.ownerId)?.username} has won the game!`);
  } else {
    if (roll !== 6) {
    }
  }
}

// server.ts
var VIP_TIERS = {
  gold: {
    name: "Gold VIP",
    price: 10,
    durationMonths: 1,
    rakeDiscount: 0.02,
    // 2% discount on rake
    features: ["Ad-free experience", "Exclusive avatar borders", "2% Rake Discount", "Priority Customer Support"]
  },
  platinum: {
    name: "Platinum VIP",
    price: 25,
    durationMonths: 3,
    rakeDiscount: 0.05,
    // 5% discount on rake
    features: ["All Gold features", "Unique animated avatars", "5% Rake Discount", "Early access to new game modes"]
  }
};
var app = express();
var configuredAllowedOrigins = [
  process.env.VITE_APP_URL,
  process.env.PUBLIC_URL,
  process.env.RENDER_EXTERNAL_URL,
  process.env.ALLOWED_ORIGINS
].flatMap((value) => {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
});
var allowedOrigins = Array.from(/* @__PURE__ */ new Set([
  "https://dhili-dhili-ludo.onrender.com",
  "https://dhilidhili.onrender.com",
  "http://localhost:3000",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3002",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...configuredAllowedOrigins
]));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
var PORT = Number(process.env.PORT) || 3002;
var DB_FILE = path.join(process.cwd(), "_store.json");
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
var DEFAULT_PAYMENT_PROVIDERS = {
  evc: { enabled: false },
  edahab: { enabled: false },
  sahal: { enabled: false },
  premier: { enabled: false }
};
var DEFAULT_ADMIN_ROLES = [
  { id: "admin", name: "Administrator", permissions: ["all"] },
  { id: "editor", name: "Editor", permissions: ["manage_users", "manage_content"] }
];
var DEFAULT_ADMIN_SETTINGS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "password",
  roles: DEFAULT_ADMIN_ROLES
};
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
  houseRevenue: 0,
  pendingManualTransactions: [],
  paymentProviders: { ...DEFAULT_PAYMENT_PROVIDERS },
  agentFloatInstructions: "",
  adminSettings: { ...DEFAULT_ADMIN_SETTINGS },
  agents: {},
  agentTransactions: [],
  tournaments: {}
};
async function saveStoreAndWait() {
  try {
    if (!(process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf8");
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to write database to disk.", error);
    return { success: false, error: error.message };
  }
}
(async () => {
  try {
    await sequelize_default.sync();
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("An error occurred while synchronizing the models:", error);
  }
})();
function purgeSimulatedUsers() {
  let changed = false;
  Object.keys(store.users).forEach((id) => {
    if (id.startsWith("user_sim_")) {
      delete store.users[id];
      changed = true;
    }
  });
  if (changed) {
    saveStoreAndWait();
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
          avatar: user.avatar,
          createdAt: user.createdAt
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
          (async () => {
            await saveStoreAndWait();
          })();
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
    saveStoreAndWait();
  }
}
var START_OFFSETS2 = {
  green: 0,
  yellow: 13,
  blue: 26,
  red: 39
};
var SAFE_GLOBAL_SQUARES2 = [0, 8, 13, 21, 26, 34, 39, 47];
function getGlobalPosition2(color, relativePos) {
  if (relativePos < 0 || relativePos > 50) return null;
  const offset = START_OFFSETS2[color];
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
async function addTransaction(userId, type, amount, matchId, description = "") {
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
  return tx;
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
          const globalPos = getGlobalPosition2(token.color, nextRelative);
          if (globalPos !== null && !SAFE_GLOBAL_SQUARES2.includes(globalPos)) {
            const hasOpponent = room.gameState.tokens.some((t) => {
              if (t.color === token.color || t.position < 0 || t.position > 50) return false;
              const opGlobal = getGlobalPosition2(t.color, t.position);
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
        setTimeout(async () => {
          await moveTokenLogic(room, selectedToken.id, d);
          broadcastToRoom(room.id, "game_update", room);
          executeBotTurnIfActive(room);
        }, 500);
      }
    }
  }, 400);
}
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
setInterval(async () => {
  cleanupMatchmakingQueues();
  for (const queueKey of Object.keys(store.matchmakingQueues)) {
    const queueUserIds = store.matchmakingQueues[queueKey];
    if (!queueUserIds || queueUserIds.length === 0) continue;
    const parts = queueKey.split("_");
    const bet = parseFloat(parts[0]) || 0;
    const cap = parseInt(parts[1]) || 2;
    const mode = parts[2] === "team" ? "team" : "solo";
    const firstUserId = queueUserIds[0];
    const firstUser = store.users[firstUserId];
    if (!firstUser) continue;
    const joinedAt = firstUser.seekingJoinedAt || Date.now();
    const waitTimeMs = Date.now() - joinedAt;
    if (waitTimeMs >= 42e4) {
      console.log(`Matchmaking timeout for queue ${queueKey}. Auto-filling remaining seats with bots...`);
      const realPlayers = queueUserIds.map((id) => store.users[id]).filter(Boolean);
      store.matchmakingQueues[queueKey] = [];
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
      const room = await startMatchedRoom(matchedList, bet, cap, mode);
      realPlayers.forEach((p) => {
        sendEventToUser(p.id, "matchmaker_success", { roomId: room.id, room });
        broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.id });
      });
      broadcastToAll("online_players_updated", {});
      await saveStoreAndWait();
    }
  }
}, 2e3);
app.get("/api/debug/firebase", async (req, res) => {
  if (true) {
    return res.json({
      initialized: false,
      error: "Firebase Firestore  object is null. Check if firebase-admin-key.json exists."
    });
  }
  try {
    return res.json({
      initialized: true,
      writeAndReadSuccess: false,
      data: null,
      projectId: "N/A"
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
app.post("/api/auth/login", async (req, res) => {
  const { username, email, avatar, promoCode } = req.body;
  const firebaseUid = req.user.uid;
  const firebaseUser = req.user;
  try {
    let user = await getUserByFirebaseUid(firebaseUid);
    if (user) {
      return res.json(user);
    }
    let finalUsername = username;
    if (!finalUsername && firebaseUser.displayName) {
      finalUsername = firebaseUser.displayName;
    }
    if (!finalUsername && firebaseUser.email) {
      finalUsername = firebaseUser.email.split("@")[0];
    }
    if (!finalUsername) {
      return res.status(400).json({ error: "Username is required for new registration" });
    }
    const cleanUsername = finalUsername.trim().substring(0, 20);
    let linkedAgentId = void 0;
    let agent = null;
    if (promoCode && typeof promoCode === "string" && promoCode.trim() !== "") {
      agent = await getAgentByPromoCode(promoCode.trim());
      if (!agent) {
        return res.status(400).json({ error: "Invalid or expired promo code." });
      }
      linkedAgentId = agent.id;
    }
    const newId = firebaseUid;
    const newUser = {
      id: newId,
      firebaseUid,
      username: cleanUsername,
      email: email || firebaseUser.email || void 0,
      avatar: avatar || "\u{1F338}",
      balance: 10,
      // Welcome bonus
      winCount: 0,
      lossCount: 0,
      linkedAgentId,
      promoCode,
      createdAt: Date.now()
    };
    await createUser(newUser);
    addTransaction(newId, "deposit", 10, void 0, "Welcome signup bonus.");
    if (agent && linkedAgentId) {
      await linkAgentToPlayer(linkedAgentId, newId);
    }
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error during user login/registration:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.get("/api/users/:userId", async (req, res, next) => {
  if (req.params.userId === "online" || req.params.userId === "leaderboard") {
    return next();
  }
  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Failed to get user from database:", error);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
});
app.post("/api/users/:userId/update", async (req, res) => {
  const userIdToUpdate = req.params.userId;
  if (req.user.uid !== userIdToUpdate) {
    return res.status(403).json({ error: "You are not authorized to update this profile." });
  }
  try {
    const user = await getUserById(userIdToUpdate);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { username, avatar, isOfflinePreference } = req.body;
    const updateData = {};
    if (username) updateData.username = username.trim().substring(0, 20);
    if (avatar) updateData.avatar = avatar;
    if (typeof isOfflinePreference === "boolean") updateData.isOfflinePreference = isOfflinePreference;
    if (Object.keys(updateData).length > 0) {
      await updateUser(userIdToUpdate, updateData);
    }
    const updatedUser = await getUserById(userIdToUpdate);
    broadcastUserUpdate(userIdToUpdate);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.post("/api/users/:userId/status", async (req, res) => {
  const { userId } = req.params;
  const { isOffline } = req.body;
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isOfflinePreference = !!isOffline;
    await updateUser(userId, { isOfflinePreference });
    const updatedUser = await getUserById(userId);
    broadcastUserUpdate(userId);
    res.json({ success: true, isOfflinePreference, user: updatedUser });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.post("/api/wallet/deposit", async (req, res) => {
  const { userId, amount } = req.body;
  const depAmt = parseFloat(amount);
  if (isNaN(depAmt) || depAmt <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const newBalance = user.balance + depAmt;
    await updateUser(userId, { balance: newBalance });
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: "deposit",
      amount: depAmt,
      timestamp: Date.now(),
      description: `Deposited funds via Simulated Net Banking.`
    };
    await createTransaction(tx);
    broadcastUserUpdate(userId);
    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("Error during deposit:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.post("/api/wallet/withdraw", async (req, res) => {
  const { userId, amount } = req.body;
  const withAmt = parseFloat(amount);
  if (isNaN(withAmt) || withAmt <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount" });
  }
  if (withAmt < 20) {
    return res.status(400).json({ error: "Minimum withdrawal amount is $20" });
  }
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.balance < withAmt) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    const newBalance = user.balance - withAmt;
    await updateUser(userId, { balance: newBalance });
    const tx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      type: "withdrawal",
      amount: withAmt,
      timestamp: Date.now(),
      description: `Withdrawn funds to bank account.`
    };
    await createTransaction(tx);
    broadcastUserUpdate(userId);
    res.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error("Error during withdrawal:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.post("/api/wallet/request-manual-confirmation", async (req, res) => {
  const { userId, agentId, amount, phone, senderPhone, provider, transactionType } = req.body;
  if (!userId || !agentId || !amount || !provider || !transactionType) {
    return res.status(400).json({ error: "Missing required fields. `userId`, `agentId`, `amount`, `provider`, and `transactionType` are all required." });
  }
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  if (user.linkedAgentId && user.linkedAgentId !== agentId) {
    return res.status(400).json({ error: "This account is locked to a specific agent. You can only transact with your assigned agent." });
  }
  if (transactionType === "withdraw" && !phone) {
    return res.status(400).json({ error: "Phone number is required for withdrawal requests." });
  }
  if (transactionType === "deposit" && !senderPhone) {
    return res.status(400).json({ error: "Sender phone number is required for deposit requests." });
  }
  const newRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    username: user.username,
    agentId,
    amount: parseFloat(amount),
    phone,
    // This will be the destination for withdrawals
    senderPhone,
    // This is the source number for deposits
    provider,
    transactionType,
    status: "pending",
    createdAt: Date.now()
  };
  store.pendingManualTransactions.unshift(newRequest);
  await saveStoreAndWait();
  res.json({ success: true, message: "Your request has been submitted for review." });
});
app.get("/api/wallet/transactions/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (req.user.uid !== userId) {
    return res.status(403).json({ error: "You are not authorized to view these transactions." });
  }
  try {
    const transactions = await getTransactionsByUserId(userId);
    res.json(transactions);
  } catch (error) {
    console.error(`Failed to get transactions for user ${userId}:`, error);
    res.status(500).json({ error: "Failed to retrieve transactions." });
  }
});
app.get("/api/payment/settings", (req, res) => {
  res.json(store.paymentProviders);
});
app.post("/api/wallet/process-api-payment", async (req, res) => {
  const { userId, amount, phone, senderPhone, provider, transactionType } = req.body;
  if (!userId || !amount || !provider || !transactionType) {
    return res.status(400).json({ error: "Missing required api payment fields." });
  }
  const providerKey = provider;
  const config = store.paymentProviders[providerKey];
  if (!config || !config.enabled || !config.apiKey) {
    return res.status(400).json({ error: "API is not configured for this provider." });
  }
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }
  if (transactionType === "withdraw") {
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required for withdrawal requests." });
    }
    if (user.balance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient funds." });
    }
    user.balance -= parsedAmount;
    await addTransaction(userId, "withdrawal", parsedAmount, void 0, `API withdrawal via ${providerKey}.`);
    broadcastUserUpdate(userId);
    await saveStoreAndWait();
    return res.json({ success: true, balance: user.balance, message: "Withdrawal processed via API." });
  }
  if (transactionType === "deposit") {
    if (!senderPhone) {
      return res.status(400).json({ error: "Sender phone number is required for deposit requests." });
    }
    user.balance += parsedAmount;
    await addTransaction(userId, "deposit", parsedAmount, void 0, `API deposit via ${providerKey}.`);
    broadcastUserUpdate(userId);
    await saveStoreAndWait();
    return res.json({ success: true, balance: user.balance, message: "Deposit processed via API." });
  }
  return res.status(400).json({ error: "Unsupported transaction type." });
});
app.post("/api/vip/subscribe", async (req, res) => {
  const { tier } = req.body;
  const firebaseUid = req.user.uid;
  const user = Object.values(store.users).find((u) => u.firebaseUid === firebaseUid);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const vipTier = VIP_TIERS[tier];
  if (!vipTier) {
    return res.status(400).json({ error: "Invalid VIP tier specified." });
  }
  if (user.balance < vipTier.price) {
    return res.status(400).json({ error: "Insufficient funds to purchase this VIP subscription." });
  }
  user.balance -= vipTier.price;
  const startDate = Date.now();
  const endDate = startDate + vipTier.durationMonths * 30 * 24 * 60 * 60 * 1e3;
  user.vip = {
    tier,
    expires: endDate
  };
  await addTransaction(user.id, "app_commission", vipTier.price, void 0, `VIP Subscription (${vipTier.name}) purchase.`);
  await saveStoreAndWait();
  broadcastUserUpdate(user.id);
  res.json({ success: true, user, message: `Successfully subscribed to ${vipTier.name} VIP!` });
});
app.get("/api/tournaments", (req, res) => {
  const availableTournaments = Object.values(store.tournaments).filter((t) => t.status === "registration_open");
  res.json(availableTournaments);
});
app.get("/api/tournaments/:id", (req, res) => {
  const { id } = req.params;
  const tournament = store.tournaments[id];
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found." });
  }
  res.json(tournament);
});
app.post("/api/tournaments/:id/register", async (req, res) => {
  const { id } = req.params;
  const firebaseUid = req.user.uid;
  const user = Object.values(store.users).find((u) => u.firebaseUid === firebaseUid);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const tournament = store.tournaments[id];
  if (!tournament) {
    return res.status(404).json({ error: "Tournament not found." });
  }
  if (tournament.status !== "registration_open") {
    return res.status(400).json({ error: "Tournament is not open for registration." });
  }
  if (user.balance < tournament.entryFee) {
    return res.status(400).json({ error: "Insufficient funds to register for this tournament." });
  }
  if (tournament.players.length >= tournament.maxPlayers) {
    return res.status(400).json({ error: "Tournament is already full." });
  }
  if (tournament.players.some((p) => p.userId === user.id)) {
    return res.status(400).json({ error: "You are already registered for this tournament." });
  }
  user.balance -= tournament.entryFee;
  await addTransaction(user.id, "bet_escrow_locked", tournament.entryFee, id, `Tournament entry fee for "${tournament.name}".`);
  tournament.players.push({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    createdAt: user.createdAt
  });
  await saveStoreAndWait();
  broadcastUserUpdate(user.id);
  broadcastToAll("tournament_update", tournament);
  res.json({ success: true, tournament, message: `Successfully registered for ${tournament.name}!` });
});
app.get("/api/admin/tournaments", isAdmin, (req, res) => {
  res.json(Object.values(store.tournaments));
});
app.post("/api/admin/tournaments/create", isAdmin, async (req, res) => {
  const { name: name2, entryFee, prizePool, maxPlayers, startDate } = req.body;
  if (!name2 || !entryFee || !prizePool || !maxPlayers || !startDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const newTournament = {
    id: `tourney_${Date.now()}`,
    name: name2,
    entryFee,
    prizePool,
    maxPlayers,
    startDate: new Date(startDate).getTime(),
    status: "registration_open",
    players: [],
    rounds: []
  };
  store.tournaments[newTournament.id] = newTournament;
  await saveStoreAndWait();
  res.status(201).json(newTournament);
});
function createTournamentBracket(tournament) {
  const players = [...tournament.players];
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  const matches = [];
  for (let i = 0; i < players.length; i += 2) {
    const match = {
      id: `tm_${tournament.id}_r1_${i / 2}`,
      tournamentId: tournament.id,
      round: 1,
      player1: players[i],
      player2: players[i + 1] || null,
      winnerId: players[i + 1] ? null : players[i].userId,
      roomId: null,
      status: players[i + 1] ? "pending" : "completed"
    };
    matches.push(match);
  }
  return matches;
}
function checkAndStartTournaments() {
  const now = Date.now();
  Object.values(store.tournaments).forEach(async (t) => {
    if (t.status === "registration_open" && now >= t.startDate && t.players.length >= 2) {
      t.status = "in_progress";
      t.matches = createTournamentBracket(t);
      t.currentRound = 1;
      for (const match of t.matches) {
        if (match.status === "pending" && match.player1 && match.player2) {
          const room = await startMatchedRoom(
            [match.player1, match.player2],
            0,
            // No extra bet for tournament matches
            2,
            "solo"
          );
          match.roomId = room.id;
          match.status = "in_progress";
          room.tournamentDetails = { tournamentId: t.id, matchId: match.id };
        }
      }
      await saveStoreAndWait();
      broadcastToAll("tournament_started", t);
    }
  });
}
setInterval(checkAndStartTournaments, 1e4);
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
app.post("/api/rooms/join", async (req, res) => {
  const { userId, roomCode } = req.body;
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const code = (roomCode || "").trim().toUpperCase();
    const room = await getRoomById(code);
    if (!room) {
      return res.status(404).json({ error: "Room code not found." });
    }
    if (room.players.some((p) => p.userId === userId)) {
      return res.json(room);
    }
    if (room.status !== "waiting") {
      return res.status(400).json({ error: "Match has already started or been completed." });
    }
    if (room.players.length >= room.capacity) {
      return res.status(400).json({ error: `Room is already full at ${room.capacity} capacity.` });
    }
    if (user.balance < room.betAmount) {
      return res.status(400).json({ error: `You need at least $${room.betAmount} in your wallet to join this room.` });
    }
    const host = room.players.find((p) => p.isHost);
    if (!host) {
      return res.status(500).json({ error: "Could not find the host for this room." });
    }
    const pendingPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
    sendEventToUser(host.userId, "join_request", pendingPlayer);
    res.json({ status: "pending_approval", message: "Your request to join has been sent to the host." });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "An internal server error occurred while trying to join the room." });
  }
});
app.get("/api/rooms/:roomId", async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await getRoomById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }
    res.json(room);
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    res.status(500).json({ error: "An internal server error occurred while fetching the room." });
  }
});
app.post("/api/request-to-agent", async (req, res) => {
  const player = await getUserById(req.user.uid);
  if (!player) {
    return res.status(404).json({ error: "Player not found" });
  }
  const { agentId, amount, type, playerPhone, provider } = req.body;
  const requestAmount = parseFloat(amount);
  if (player.linkedAgentId && player.linkedAgentId !== agentId) {
    return res.status(400).json({ error: "This account is locked to a specific agent. You can only transact with your assigned agent." });
  }
  if (!agentId || !requestAmount || requestAmount <= 0 || !["deposit", "withdrawal"].includes(type) || !playerPhone || !provider) {
    return res.status(400).json({ error: "Missing or invalid parameters. Requires agentId, amount, type, playerPhone, and provider." });
  }
  if (type === "withdrawal" && player.balance < requestAmount) {
    return res.status(400).json({ error: "Insufficient balance for this withdrawal request." });
  }
  try {
    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "The selected agent does not exist." });
    }
    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      playerId: player.id,
      playerUsername: player.username,
      playerAvatar: player.avatar,
      agentId,
      playerPhone,
      provider,
      type,
      amount: requestAmount,
      status: "pending",
      createdAt: Date.now()
    };
    await createPlayerAgentRequest(newRequest);
    res.status(201).json({ success: true, message: "Your request has been sent to the agent.", request: newRequest });
  } catch (error) {
    console.error(`Player ${player.id} failed to create request to agent ${agentId}:`, error);
    res.status(500).json({
      error: "An internal server error occurred while submitting your request.",
      details: error.message || "No specific error message available."
    });
  }
});
async function startMatchedRoom(matchedUsers, bet, cap, mode) {
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
  for (const p of players) {
    if (!isBotPlayer(p.userId)) {
      const u = store.users[p.userId];
      if (u) {
        u.balance = Math.max(0, u.balance - bet);
        await addTransaction(p.userId, "bet_escrow_locked", bet, roomId, `Escrow stake for Ludo Match ${roomId}.`);
        broadcastUserUpdate(p.userId);
      }
    }
    totalEscrow += bet;
  }
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
  await saveStoreAndWait();
  players.forEach((p) => {
    if (!isBotPlayer(p.userId)) {
      sendEventToUser(p.userId, "matchmaker_success", { roomId: newRoom.id, room: newRoom });
      broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.userId });
    }
  });
  broadcastToAll("online_players_updated", {});
  return newRoom;
}
app.post("/api/rooms/matchmaking/enter-queue", async (req, res) => {
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
    await addUserToMatchmakingQueue({
      userId,
      username: user.username,
      avatar: user.avatar,
      betAmount: bet,
      capacity: cap,
      gameMode: mode,
      status: "WAITING_FOR_MATCH",
      timestamp: Date.now()
    });
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
    res.json({ status: "queued", message: "Looking for real online opponent..." });
  } catch (error) {
    console.error("!!! UNHANDLED ERROR in /enter-queue:", error);
    res.status(500).json({ error: "An unexpected server error occurred.", details: error.message });
  }
});
app.post("/api/rooms/matchmaking/join", async (req, res) => {
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
  await removeUsersFromMatchmakingQueue([userId, opponentId]);
  const matchedList = [user, oppUser].map((u) => ({ ...u, balance: u.balance || 0 }));
  const finalCapacity = 2;
  const finalMode = "solo";
  const room = await startMatchedRoom(matchedList, bet, finalCapacity, finalMode);
  matchedList.forEach((p) => {
    if (!isBotPlayer(p.id)) {
      sendEventToUser(p.id, "matchmaker_success", { roomId: room.id, room });
      broadcastToAll("matchmaker_seeking_cancelled", { senderId: p.id });
    }
  });
  broadcastToAll("online_players_updated", {});
  await saveStoreAndWait();
  return res.json({ matched: true, roomId: room.id, room });
});
app.post("/api/rooms/create-bot-room", async (req, res) => {
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
  const room = await startMatchedRoom(matchedList, bet, cap, mode);
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
    broadcastToAll("matchmaker_seeking_cancelled", { senderId: userId });
    removeUsersFromMatchmakingQueue([userId]).catch((err) => {
      console.error("Failed to delete matchmaking record from database on leave:", err);
    });
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
app.post("/api/rooms/challenge/invite", async (req, res) => {
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
    const matchedList = [sender, receiverUser2].map((u) => ({ ...u, balance: u.balance || 0 }));
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
    const room = await startMatchedRoom(matchedList, bet, selectedCapacity, selectedMode);
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
  broadcastToAll("matchmaker_seeking_cancelled", { senderId });
  broadcastToAll("matchmaker_seeking_cancelled", { senderId: receiverId });
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
  const hostId = room.players.find((p) => p.isHost)?.userId;
  if (hostId) {
    sendEventToUser(hostId, "game_invite_accepted", { roomId });
  }
  res.json({ success: true, roomId });
});
app.post("/api/rooms/ready", (req, res) => {
  const { userId, roomId } = req.body;
  const room = store.rooms[roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  const p = room.players.find((p2) => p2.userId === userId);
  if (!p) return res.status(404).json({ error: "Player not in room" });
  p.isReady = !p.isReady;
  addLog(room, `${p.username} is ${p.isReady ? "READY" : "NOT READY"}.`);
  broadcastToRoom(room.id, "game_update", room);
  res.json(room);
});
app.post("/api/rooms/start", async (req, res) => {
  const { userId, roomId } = req.body;
  try {
    const updatedRoom = await startGame(roomId, userId);
    broadcastToRoom(roomId, "game_update", updatedRoom);
    updatedRoom.players.forEach((player) => {
      if (!isBotPlayer(player.userId)) {
        sendEventToUser(player.userId, "user_balance_update", {});
      }
    });
    res.json(updatedRoom);
  } catch (error) {
    console.error(`Error starting game ${roomId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("not found")) {
      return res.status(404).json({ error: errorMessage });
    }
    if (errorMessage.includes("Only the host") || errorMessage.includes("already started") || errorMessage.includes("At least 2 players") || errorMessage.includes("insufficient balance")) {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: "An internal server error occurred while trying to start the game." });
  }
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
    broadcastToRoom(room.id, "game_update", room);
    executeBotTurnIfActive(room);
    return res.json(room);
  }
  const playerTokens = gs.tokens.filter((t) => t.color === activePlayer.color);
  const validTokens = playerTokens.filter((t) => isMoveValid(t, d));
  if (validTokens.length === 0) {
    addLog(room, `${activePlayer.username} has no valid moves with roll ${d}. Turn passes.`);
    broadcastToRoom(room.id, "game_update", room);
    res.json(room);
    setTimeout(() => {
      const currentRoom = store.rooms[roomId];
      if (currentRoom && currentRoom.status === "playing") {
        advanceTurn(currentRoom);
        broadcastToRoom(currentRoom.id, "game_update", currentRoom);
        executeBotTurnIfActive(currentRoom);
      }
    }, 1500);
  } else {
    broadcastToRoom(room.id, "game_update", room);
    res.json(room);
  }
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
    broadcastToRoom(room.id, "game_update", room);
  }
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
app.post("/api/rooms/leave", async (req, res) => {
  const { userId, roomId } = req.body;
  try {
    const updatedRoom = await removePlayerFromRoom(roomId, userId);
    if (updatedRoom) {
      broadcastToRoom(roomId, "game_update", updatedRoom);
    } else {
      broadcastToRoom(roomId, "room_deleted", { roomId });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ error: "An internal server error occurred while leaving the room." });
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
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const allAdmins = await getAllAdminUsers();
    if (allAdmins.length === 0) {
      console.log("No admin users found. Creating first admin user from login credentials.");
      const newAdminId = `admin_${Date.now()}`;
      const newAdmin = {
        id: newAdminId,
        username,
        password_hash: password,
        // Password should be hashed in a real application
        permissions: ["all"],
        name: "Super Admin"
      };
      await createAdminUser(newAdmin);
      console.log(`Created new admin: ${username}`);
      const { password: _, ...userToReturn } = newAdmin;
      return res.json({ success: true, user: userToReturn });
    }
    const adminUser = await getAdminUserByUsername(username);
    if (!adminUser) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials." });
    }
    if (adminUser.password_hash === password) {
      const { password_hash: _, ...userToReturn } = adminUser;
      res.json({ success: true, user: userToReturn });
    } else {
      res.status(401).json({ success: false, error: "Invalid admin credentials." });
    }
  } catch (error) {
    console.error("Admin login failed:", error);
    res.status(500).json({ error: "An error occurred during admin login." });
  }
});
app.post(
  "/api/admin/admins/create",
  /* hasPermission('all'), */
  async (req, res) => {
    const { username, password, permissions } = req.body;
    if (!username || !password || !Array.isArray(permissions)) {
      return res.status(400).json({ error: "Username, password, and a list of permissions are required." });
    }
    try {
      const existingAdmin = await getAdminUserByUsername(username);
      if (existingAdmin) {
        return res.status(409).json({ error: "An admin with this username already exists." });
      }
      const newAdminId = `admin_${Date.now()}`;
      const newAdmin = {
        id: newAdminId,
        username,
        password_hash: password,
        // In a real app, this MUST be hashed.
        permissions,
        name
        // Adding the role name field
      };
      await createAdminUser(newAdmin);
      const { password_hash: _, ...userToReturn } = newAdmin;
      res.status(201).json({ success: true, user: userToReturn });
    } catch (error) {
      console.error("Failed to create admin user:", error);
      res.status(500).json({ error: "Failed to create admin user." });
    }
  }
);
var isAdmin = async (req, res, next) => {
  const adminId = req.query.userId;
  if (!adminId) {
    return res.status(403).json({ error: "Access denied. Admin user ID is required." });
  }
  try {
    const adminUser = await getAdminUserById(adminId);
    if (adminUser) {
      next();
    } else {
      res.status(403).json({ error: "Access denied. Invalid admin user." });
    }
  } catch (error) {
    console.error("Admin validation failed:", error);
    res.status(500).json({ error: "An error occurred during admin validation." });
  }
};
app.get("/api/admin/settings", isAdmin, async (req, res) => {
  try {
    const roles = await getAllAdminUsers();
    res.json({
      username: store.adminSettings?.username || process.env.ADMIN_USERNAME || "admin",
      passwordConfigured: Boolean(store.adminSettings?.password),
      roles: roles.map((r) => {
        const { password_hash, ...roleData } = r;
        return roleData;
      })
    });
  } catch (error) {
    console.error("Failed to retrieve admin roles:", error);
    res.status(500).json({ error: "Failed to retrieve admin roles." });
  }
});
app.post("/api/admin/settings", isAdmin, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const adminId = req.query.userId;
  if (!adminId) {
    return res.status(400).json({ error: "Admin ID is required." });
  }
  if (typeof newPassword !== "string" || !newPassword.trim()) {
    return res.status(400).json({ error: "New password is required." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New password and confirmation must match." });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }
  try {
    const adminUser = await getAdminUserById(adminId);
    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found." });
    }
    if (adminUser.password_hash !== currentPassword) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    await updateAdminUser(adminId, { password_hash: newPassword });
    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error(`Failed to update password for admin ${adminId}:`, error);
    res.status(500).json({ error: "An error occurred while updating the password." });
  }
});
app.post(
  "/api/admin/roles/create",
  /* hasPermission('all'), */
  async (req, res) => {
    const { username, password, permissions, name: name2 } = req.body;
    if (!username || !password || !Array.isArray(permissions) || !name2) {
      return res.status(400).json({ error: "Role Name, username, password, and a list of permissions are required." });
    }
    try {
      const existingAdmin = await getAdminUserByUsername(username);
      if (existingAdmin) {
        return res.status(409).json({ error: "An admin with this username already exists." });
      }
      const newAdminId = `admin_${Date.now()}`;
      const newAdmin = {
        id: newAdminId,
        username,
        password_hash: password,
        // In a real app, this MUST be hashed.
        permissions,
        name: name2
        // Adding the role name field
      };
      await createAdminUser(newAdmin);
      const { password_hash: _, ...userToReturn } = newAdmin;
      res.status(201).json({ success: true, user: userToReturn });
    } catch (error) {
      console.error("Failed to create admin user:", error);
      res.status(500).json({ error: "Failed to create admin user." });
    }
  }
);
app.delete(
  "/api/admin/roles/:roleId/delete",
  /* hasPermission('all'), */
  async (req, res) => {
    const { roleId } = req.params;
    if (!roleId) {
      return res.status(400).json({ error: "Admin user ID is required." });
    }
    try {
      const adminUser = await getAdminUserById(roleId);
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found." });
      }
      const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : JSON.parse(adminUser.permissions);
      if (permissions.includes("all")) {
        const allAdmins = await getAllAdminUsers();
        const superAdmins = allAdmins.filter((admin) => {
          const perms = Array.isArray(admin.permissions) ? admin.permissions : JSON.parse(admin.permissions);
          return perms.includes("all");
        });
        if (superAdmins.length <= 1) {
          return res.status(400).json({ error: "Cannot delete the last super administrator." });
        }
      }
      await deleteAdminUser(roleId);
      res.json({ success: true, message: "Admin user deleted successfully." });
    } catch (error) {
      console.error("Failed to delete admin user:", error);
      res.status(500).json({ error: "Failed to delete admin user." });
    }
  }
);
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
app.get("/api/admin/manual-transactions", isAdmin, (req, res) => {
  res.json(store.pendingManualTransactions || []);
});
app.get("/api/admin/payment-settings", isAdmin, (req, res) => {
  res.json(store.paymentProviders);
});
app.post("/api/admin/payment-settings", isAdmin, async (req, res) => {
  const { paymentProviders, agentFloatInstructions } = req.body;
  if (paymentProviders && typeof paymentProviders === "object") {
    store.paymentProviders = {
      ...DEFAULT_PAYMENT_PROVIDERS,
      ...paymentProviders
    };
  }
  if (typeof agentFloatInstructions === "string") {
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
app.post("/api/admin/manual-transactions/:transactionId/approve", isAdmin, async (req, res) => {
  const { transactionId } = req.params;
  const tx = store.pendingManualTransactions.find((t) => t.id === transactionId);
  if (!tx || tx.status !== "pending") {
    return res.status(404).json({ error: "Pending transaction not found or already processed." });
  }
  const user = store.users[tx.userId];
  if (!user) {
    return res.status(404).json({ error: "User associated with transaction not found." });
  }
  if (tx.transactionType === "deposit") {
    user.balance += tx.amount;
    addTransaction(user.id, "deposit", tx.amount, void 0, `Manual deposit approved by admin. Request ID: ${tx.id}`);
  } else {
    if (user.balance < tx.amount) {
      tx.status = "rejected";
      await saveStoreAndWait();
      return res.status(400).json({ error: "Insufficient balance to approve this withdrawal request. Transaction has been rejected." });
    }
    user.balance -= tx.amount;
    addTransaction(user.id, "withdrawal", tx.amount, void 0, `Manual withdrawal approved by admin. Request ID: ${tx.id}`);
  }
  tx.status = "approved";
  await saveStoreAndWait();
  broadcastUserUpdate(user.id);
  res.json({ success: true, transaction: tx });
});
app.post("/api/admin/manual-transactions/:transactionId/reject", isAdmin, async (req, res) => {
  const { transactionId } = req.params;
  const tx = store.pendingManualTransactions.find((t) => t.id === transactionId);
  if (!tx || tx.status !== "pending") {
    return res.status(404).json({ error: "Pending transaction not found or already processed." });
  }
  const user = store.users[tx.userId];
  if (!user) {
    tx.status = "rejected";
    await saveStoreAndWait();
    return res.status(404).json({ error: "User associated with transaction not found. Transaction rejected." });
  }
  tx.status = "rejected";
  await saveStoreAndWait();
  sendEventToUser(user.id, "user_notification", {
    type: "info",
    message: `Your ${tx.transactionType} request for $${tx.amount} was rejected.`
  });
  res.json({ success: true, transaction: tx });
});
app.post("/api/admin/impersonate", isAdmin, (req, res) => {
  const { userId } = req.body;
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ success: true, user });
});
app.get("/api/admin/agents", isAdmin, async (req, res) => {
  try {
    const agents = await getAgents();
    res.json(agents);
  } catch (error) {
    console.error("Failed to get agents:", error);
    res.status(500).json({ error: "Failed to retrieve agents from database." });
  }
});
app.post("/api/admin/agents/create", isAdmin, async (req, res) => {
  const { username, password, commissionRate, location, phone, promoCode } = req.body;
  if (!username || !password || !commissionRate || !phone) {
    return res.status(400).json({ error: "Username, password, commission rate, and phone are required." });
  }
  if (typeof username !== "string" || username.length < 3) {
    return res.status(400).json({ error: "Username must be a string of at least 3 characters." });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be a string of at least 6 characters." });
  }
  const rate = parseFloat(commissionRate);
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({ error: "Commission rate must be a number between 0 and 1." });
  }
  try {
    const existingAgent = await getAgentByUsername(username);
    if (existingAgent) {
      return res.status(409).json({ error: "Agent with this username already exists." });
    }
    if (promoCode && typeof promoCode === "string" && promoCode.trim() !== "") {
      const existingPromoAgent = await getAgentByPromoCode(promoCode.trim());
      if (existingPromoAgent) {
        return res.status(400).json({ error: "Promo code is already in use." });
      }
    }
    const agentId = `agent_${Date.now()}`;
    const newAgent = {
      id: agentId,
      username,
      password,
      // In a real app, this should be hashed and salted
      phone,
      location: location || "",
      commissionRate: rate,
      promoCode: promoCode && typeof promoCode === "string" ? promoCode.trim() : "",
      balance: 0,
      floatBalance: 0,
      status: "Active",
      createdAt: Date.now()
    };
    await createAgent(newAgent);
    res.status(201).json(newAgent);
  } catch (error) {
    console.error("Failed to create agent:", error);
    res.status(500).json({ error: "Failed to create agent in database." });
  }
});
app.get("/api/admin/agent-requests", isAdmin, async (req, res) => {
  try {
    const requests = await getAgentRequests();
    res.json(requests);
  } catch (error) {
    console.error("Failed to get agent requests:", error);
    res.status(500).json({ error: "Failed to retrieve agent requests." });
  }
});
app.post("/api/admin/agent-requests/:requestId/reject", isAdmin, async (req, res) => {
  const { requestId } = req.params;
  const adminId = req.query.userId;
  try {
    await rejectAgentRequest(requestId, adminId);
    res.json({ success: true, message: "Agent float request rejected." });
  } catch (error) {
    console.error(`Failed to reject agent request ${requestId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("not found") || errorMessage.includes("processed")) {
      return res.status(404).json({ error: errorMessage });
    }
    res.status(500).json({ error: `Failed to reject agent request in database: ${errorMessage}` });
  }
});
app.put("/api/admin/agents/:agentId", isAdmin, async (req, res) => {
  const { agentId } = req.params;
  const { commissionRate, status, location } = req.body;
  try {
    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found." });
    }
    const updates = {};
    if (commissionRate) updates.commissionRate = parseFloat(commissionRate);
    if (status) updates.status = status;
    if (location !== void 0) updates.location = location;
    await updateAgent(agentId, updates);
    res.json({ success: true, message: "Agent updated." });
  } catch (error) {
    console.error(`Failed to update agent ${agentId}:`, error);
    res.status(500).json({ error: "Failed to update agent." });
  }
});
app.post("/api/admin/rooms/:roomId/cancel", isAdmin, async (req, res) => {
  const { roomId } = req.params;
  const room = store.rooms[roomId];
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  if (room.betAmount > 0) {
    for (const p of room.players) {
      if (!isBotPlayer(p.userId)) {
        const user = store.users[p.userId];
        if (user) {
          user.balance += room.betAmount;
          await addTransaction(p.userId, "refund", room.betAmount, room.id, `Refund for canceled match ${room.id}.`);
          broadcastUserUpdate(p.userId);
        }
      }
    }
  }
  addLog(room, `Game canceled by admin. Bets refunded.`);
  broadcastToRoom(room.id, "game_canceled", { roomId });
  delete store.rooms[roomId];
  await saveStoreAndWait();
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
app.post("/api/agent/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  try {
    const agent = await getAgentByUsername(username);
    if (!agent) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    if (agent.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    if (agent.status !== "Active") {
      return res.status(403).json({ error: "This agent account is not active." });
    }
    res.json({ success: true, agent });
  } catch (error) {
    console.error("Agent login failed:", error);
    res.status(500).json({ error: "An internal server error occurred during login." });
  }
});
async function isAgent(req, res, next) {
  const agentId = req.query.agentId;
  if (!agentId) {
    return res.status(401).json({ error: "Agent ID is required for this operation." });
  }
  try {
    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.status(403).json({ error: "Access denied. Invalid agent ID." });
    }
    if (agent.status !== "Active") {
      return res.status(403).json({ error: "Access denied. Inactive agent ID." });
    }
    req.agent = agent;
    next();
  } catch (error) {
    console.error("Agent verification failed:", error);
    res.status(500).json({ error: "Failed to verify agent status." });
  }
}
app.get("/api/agent/profile", isAgent, (req, res) => {
  const agent = req.agent;
  res.json(agent);
});
app.get("/api/agent/player-lookup", isAgent, (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== "string" || query.length < 2) {
    return res.status(400).json({ error: "A search query of at least 2 characters is required." });
  }
  const lowerCaseQuery = query.toLowerCase();
  const results = Object.values(store.users).filter((u) => u.username.toLowerCase().includes(lowerCaseQuery) && !u.id.startsWith("bot_")).map((u) => ({ id: u.id, username: u.username, avatar: u.avatar })).slice(0, 10);
  res.json(results);
});
app.get("/api/agent/transactions", isAgent, async (req, res) => {
  const agent = req.agent;
  try {
    const transactions = await getAgentTransactions(agent.id);
    res.json(transactions);
  } catch (error) {
    console.error(`Failed to get transactions for agent ${agent.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve agent transactions." });
  }
});
app.post("/api/agent/deposit", isAgent, async (req, res) => {
  const agent = req.agent;
  const { playerId, amount } = req.body;
  const depositAmount = parseFloat(amount);
  if (!playerId || !depositAmount || depositAmount <= 0) {
    return res.status(400).json({ error: "Valid playerId and a positive amount are required." });
  }
  try {
    const { newAgentBalance, newPlayerBalance } = await depositToPlayer(agent.id, playerId, depositAmount);
    broadcastUserUpdate(playerId);
    res.json({ success: true, newAgentBalance, newPlayerBalance });
  } catch (error) {
    console.error(`Agent ${agent.id} failed to deposit to player ${playerId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("Insufficient") || errorMessage.includes("not found")) {
      return res.status(400).json({ error: errorMessage });
    }
    res.status(500).json({ error: `Failed to process deposit: ${errorMessage}` });
  }
});
app.post("/api/agent/request-float", isAgent, async (req, res) => {
  const agent = req.agent;
  const { amount } = req.body;
  const requestAmount = parseFloat(amount);
  if (!requestAmount || requestAmount <= 0) {
    return res.status(400).json({ error: "A positive amount is required." });
  }
  try {
    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agentId: agent.id,
      agentUsername: agent.username,
      amount: requestAmount,
      status: "pending",
      createdAt: Date.now()
    };
    await createPlayerAgentRequest(newRequest);
    res.status(201).json({ success: true, message: "Your float request has been submitted for review.", request: newRequest });
  } catch (error) {
    console.error(`Agent ${agent.id} failed to request float:`, error);
    res.status(500).json({ error: "An internal server error occurred while submitting your request." });
  }
});
app.get("/api/agent/requests", isAgent, async (req, res) => {
  const agent = req.agent;
  try {
    const requests = await getAgentRequests(agent.id);
    requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(requests);
  } catch (error) {
    console.error(`Failed to get float requests for agent ${agent.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve float requests." });
  }
});
app.get("/api/agent/player-requests", isAgent, async (req, res) => {
  const agent = req.agent;
  try {
    const allAgentRequests = await getAgentRequests(agent.id, "pending");
    const linkedPlayerIds = new Set(
      Object.values(store.users).filter((user) => user.linkedAgentId === agent.id).map((user) => user.id)
    );
    const filteredRequests = allAgentRequests.filter((req2) => linkedPlayerIds.has(req2.playerId));
    res.json(filteredRequests);
  } catch (error) {
    console.error(`Failed to get player requests for agent ${agent.id}:`, error);
    res.status(500).json({
      error: "Failed to retrieve player transaction requests.",
      details: error.message || "No specific error message available."
    });
  }
});
app.post("/api/agent/player-requests/:requestId/approve", isAgent, async (req, res) => {
  const { requestId } = req.params;
  const agent = req.agent;
  try {
    await approveAgentRequest(requestId, agent.id);
    res.json({ success: true, message: "Request approved successfully." });
  } catch (error) {
    console.error("Error processing agent transaction approval:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    if (message.includes("Insufficient")) {
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: `Failed to process approval: ${message}` });
  }
});
app.post("/api/agent/player-requests/:requestId/reject", isAgent, async (req, res) => {
  const { requestId } = req.params;
  const agent = req.agent;
  try {
    await rejectAgentRequest(requestId, agent.id);
    res.json({ success: true, message: "Request rejected successfully." });
  } catch (error) {
    console.error(`Failed to reject player request ${requestId}:`, error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});
app.get("/api/agent/payment-instructions", isAgent, (req, res) => {
  const instructions = store.agentFloatInstructions || "";
  res.json({ instructions });
});
app.get("/api/agent/my-players", isAgent, (req, res) => {
  const agent = req.agent;
  const linkedPlayers = Object.values(store.users).filter((user) => user.linkedAgentId === agent.id);
  const sanitizedPlayers = linkedPlayers.map((p) => {
    const { password, ...playerData } = p;
    return playerData;
  });
  res.json(sanitizedPlayers);
});
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});
var api = app;
if (!(process.env.FUNCTION_TARGET || process.env.FUNCTIONS_EMULATOR)) {
  const PORT2 = process.env.PORT || 3003;
  app.listen(Number(PORT2), "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT2}`);
  });
}
export {
  api
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.js.map
