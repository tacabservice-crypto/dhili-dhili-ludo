
import sequelize from './sequelize';
import {
  UserProfile as UserProfileType,
  Agent as AgentType,
  WalletTransaction as WalletTransactionType,
  AgentTransaction as AgentTransactionType,
  AgentRequest as AgentRequestType,
  GameRoom as GameRoomType,
  LudoPlayer as LudoPlayerType,
  LudoToken as LudoTokenType,
} from './types/game';

// Import Sequelize models
import { UserProfile } from './models/UserProfile';
import { Agent } from './models/Agent';
import { WalletTransaction } from './models/WalletTransaction';
import { AgentTransaction } from './models/AgentTransaction';
import { AgentRequest } from './models/AgentRequest';
import { PlayerAgentRequestModel } from './models/PlayerAgentRequestModel';
import { AdminUser } from './models/AdminUser';
import { MatchmakingModel } from './models/MatchmakingModel';
import { GameRoom } from './models/GameRoom';
import { LudoPlayer } from './models/LudoPlayer';
import { LudoToken } from './models/LudoToken';
import { PlayerAgentRequest } from './models/PlayerAgentRequestModel';
import { Matchmaking } from './models/MatchmakingModel';
import { AdminUser as AdminUserType } from './models/AdminUser';

import { Table, Column, Model, PrimaryKey, DataType, AllowNull, Unique } from 'sequelize-typescript';


// Helper to convert Sequelize model instance (snake_case) to our TS type (camelCase)
function mapToUserProfileType(user: UserProfile): UserProfileType {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        balance: typeof user.balance === 'string' ? parseFloat(user.balance) : user.balance,
        winCount: user.winCount,
        lossCount: user.lossCount,
        isOfflinePreference: user.isOfflinePreference,
        vip: user.vipTier && user.vipExpires ? { tier: user.vipTier, expires: user.vipExpires } : undefined,
        role: user.role,
        password: user.password,
        linkedAgentId: user.linkedAgentId,
        promoCode: user.promoCode,
        firebaseUid: user.firebaseUid,
        createdAt: user.createdAt,
    };
}

function mapToAgentType(agent: Agent): AgentType {
    return {
        id: agent.id,
        username: agent.username,
        phone: agent.phone,
        password: agent.password,
        promoCode: agent.promoCode,
        location: agent.location,
        commissionRate: typeof agent.commissionRate === 'string' ? parseFloat(agent.commissionRate) : agent.commissionRate,
        balance: typeof agent.balance === 'string' ? parseFloat(agent.balance) : agent.balance,
        floatBalance: agent.floatBalance ? (typeof agent.floatBalance === 'string' ? parseFloat(agent.floatBalance) : agent.floatBalance) : 0,
        status: agent.status as 'Active' | 'Suspended',
        createdAt: agent.createdAt,
    };
}

// --- User Functions ---

export async function getUserById(userId: string): Promise<UserProfileType | null> {
    const user = await UserProfile.findByPk(userId);
    return user ? mapToUserProfileType(user) : null;
}

export async function getUserByFirebaseUid(firebaseUid: string): Promise<UserProfileType | null> {
    const user = await UserProfile.findOne({ where: { firebaseUid: firebaseUid } });
    return user ? mapToUserProfileType(user) : null;
}

export async function createUser(user: UserProfileType): Promise<void> {
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
        password: user.password,
    });
}

export async function updateUser(userId: string, updates: Partial<UserProfileType>): Promise<void> {
    const updateData: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(updates)) {
        if (key === 'vip') {
            updateData.vipTier = (value as any)?.tier;
            updateData.vipExpires = (value as any)?.expires;
        } else if (key === 'password') {
            updateData.password = value; // assuming it's already hashed
        } else {
            // Convert camelCase to snake_case for DB
            const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updateData[snakeCaseKey] = value;
        }
    }

    if (Object.keys(updateData).length > 0) {
        await UserProfile.update(updateData, { where: { id: userId } });
    }
}


// --- Agent Functions ---

export async function getAgentById(agentId: string): Promise<AgentType | null> {
    const agent = await Agent.findByPk(agentId);
    return agent ? mapToAgentType(agent) : null;
}

export async function createAgent(agent: AgentType): Promise<void> {
    await Agent.create({
        id: agent.id,
        username: agent.username,
        password: agent.password, // This should be a hash
        phone: agent.phone,
        location: agent.location,
        commissionRate: agent.commissionRate,
        promoCode: agent.promoCode,
        balance: agent.balance,
        floatBalance: agent.floatBalance,
        status: agent.status,
        createdAt: agent.createdAt,
    });
}

export async function updateAgent(agentId: string, updates: Partial<AgentType>): Promise<void> {
    const updateData: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(updates)) {
        const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updateData[snakeCaseKey] = value;
    }
    if (Object.keys(updateData).length > 0) {
       await Agent.update(updateData, { where: { id: agentId } });
    }
}


// --- Transaction Functions ---

export async function createTransaction(transaction: WalletTransactionType): Promise<void> {
    await WalletTransaction.create({
        id: transaction.id,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        matchId: transaction.matchId,
        description: transaction.description,
        timestamp: transaction.timestamp,
    });
}

// --- Agent Transaction Functions ---

export async function createAgentTransaction(transaction: AgentTransactionType): Promise<void> {
    await AgentTransaction.create({
        id: transaction.id,
        agentId: transaction.agentId,
        type: transaction.type,
        amount: transaction.amount,
        playerId: transaction.playerId,
        playerName: transaction.playerName,
        timestamp: transaction.timestamp,
        description: transaction.description,
    });
}

// --- Request Functions ---

export async function createAgentRequest(request: AgentRequestType): Promise<void> {
    await AgentRequest.create({
        id: request.id,
        agentId: request.agentId,
        agentUsername: request.agentUsername,
        amount: request.amount,
        status: request.status,
        createdAt: request.createdAt,
    });
}

export async function createPlayerAgentRequest(request: PlayerAgentRequest): Promise<void> {
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
        createdAt: request.createdAt,
    });
}

// --- Matchmaking Functions ---

export async function getMatchmakingQueue(): Promise<Matchmaking[]> {
    const queue = await MatchmakingModel.findAll();
    return queue.map(item => ({
        userId: item.userId,
        username: item.username,
        avatar: item.avatar,
        betAmount: typeof item.betAmount === 'string' ? parseFloat(item.betAmount) : item.betAmount,
        capacity: item.capacity,
        gameMode: item.gameMode,
        status: item.status,
        timestamp: item.timestamp,
    }));
}

// --- Admin User Functions ---

export async function getAdminUserByUsername(username: string): Promise<AdminUserType | null> {
    const admin = await AdminUser.findOne({ where: { username } });
    return admin ? (admin.get({ plain: true }) as AdminUserType) : null;
}

export async function getAgentByPromoCode(promoCode: string): Promise<AgentType | null> {
    const agent = await Agent.findOne({ where: { promoCode: promoCode } });
    return agent ? mapToAgentType(agent) : null;
}

export async function linkAgentToPlayer(agentId: string, playerId: string): Promise<void> {
    await UserProfile.update(
        { linkedAgentId: agentId },
        { where: { id: playerId } }
    );
}

export async function getTransactionsByUserId(userId: string): Promise<WalletTransactionType[]> {
    const transactions = await WalletTransaction.findAll({
        where: { userId: userId },
        order: [['timestamp', 'DESC']],
        limit: 100
    });
    return transactions.map(t => ({
        id: t.id,
        userId: t.userId,
        type: t.type as any,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        timestamp: t.timestamp,
        matchId: t.matchId,
        description: t.description,
    }));
}

export async function getAgents(): Promise<AgentType[]> {
    const agents = await Agent.findAll();
    return agents.map(mapToAgentType);
}

export async function addUserToMatchmakingQueue(matchmaking: Matchmaking): Promise<void> {
    await MatchmakingModel.upsert({
        userId: matchmaking.userId,
        username: matchmaking.username,
        avatar: matchmaking.avatar,
        betAmount: matchmaking.betAmount,
        capacity: matchmaking.capacity,
        gameMode: matchmaking.gameMode,
        status: matchmaking.status,
        timestamp: matchmaking.timestamp,
    });
}

export async function removeUsersFromMatchmakingQueue(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await MatchmakingModel.destroy({ where: { userId: userIds } });
}

export async function createAdminUser(adminUser: AdminUserType): Promise<void> {
    await AdminUser.create({
        id: adminUser.id,
        username: adminUser.username,
        passwordHash: adminUser.password, // Assuming password is a hash
        permissions: adminUser.permissions,
    });
}

export async function getAllAdminUsers(): Promise<AdminUserType[]> {
    const admins = await AdminUser.findAll();
    return admins.map(admin => admin.get({ plain: true }) as AdminUserType);
}

export async function getAdminUserById(adminId: string): Promise<AdminUserType | null> {
    const admin = await AdminUser.findByPk(adminId);
    return admin ? (admin.get({ plain: true }) as AdminUserType) : null;
}

export async function updateAdminUser(adminId: string, updates: Partial<AdminUserType>): Promise<void> {
    const updateData: { [key: string]: any } = {};
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

export async function deleteAdminUser(adminId: string): Promise<void> {
    await AdminUser.destroy({ where: { id: adminId } });
}

export async function getAgentByUsername(username: string): Promise<AgentType | null> {
    const agent = await Agent.findOne({ where: { username } });
    return agent ? mapToAgentType(agent) : null;
}

export async function creditAgentFloat(agentId: string, amount: number, discount: number, adminUsername: string): Promise<void> {
    await sequelize.transaction(async (t) => {
        const agent = await Agent.findByPk(agentId, { transaction: t, lock: true });
        if (!agent) {
            throw new Error('Agent not found.');
        }

        const currentFloat = agent.floatBalance ? (typeof agent.floatBalance === 'string' ? parseFloat(agent.floatBalance) : agent.floatBalance) : 0;
        const newFloatBalance = currentFloat + amount;
        
        await agent.update({ floatBalance: newFloatBalance }, { transaction: t });

        await AgentTransaction.create({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            agentId: agentId,
            type: 'FloatPurchase',
            amount: amount,
            discountAmount: discount,
            timestamp: Date.now(),
            description: `Admin (${adminUsername}) credited ${amount} to float with a ${discount} discount.`
        }, { transaction: t });
    });
}

export async function getAgentRequests(): Promise<AgentRequestType[]> {
    const requests = await AgentRequest.findAll({ order: [['createdAt', 'DESC']] });
    return requests.map(r => r.get({ plain: true }) as AgentRequestType);
}

export async function approveAgentRequest(requestId: string, adminId: string): Promise<void> {
    await sequelize.transaction(async (t) => {
        const request = await AgentRequest.findByPk(requestId, { transaction: t, lock: true });
        if (!request) throw new Error('Request not found.');
        if (request.status !== 'pending') throw new Error('This request has already been processed.');

        const agent = await Agent.findByPk(request.agentId, { transaction: t, lock: true });
        if (!agent) throw new Error('Agent associated with the request not found.');

        const admin = await AdminUser.findByPk(adminId, { transaction: t });
        const resolverUsername = admin ? admin.username : 'Unknown Admin';
        
        const currentFloat = agent.floatBalance ? (typeof agent.floatBalance === 'string' ? parseFloat(agent.floatBalance) : agent.floatBalance) : 0;
        const requestAmount = typeof request.amount === 'string' ? parseFloat(request.amount) : request.amount;
        const newFloatBalance = currentFloat + requestAmount;

        await agent.update({ floatBalance: newFloatBalance }, { transaction: t });

        await request.update({
            status: 'approved',
            resolvedAt: Date.now(),
            resolvedBy: adminId,
            resolverUsername: resolverUsername
        }, { transaction: t });

        await AgentTransaction.create({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            agentId: request.agentId,
            type: 'FloatPurchase',
            amount: request.amount,
            timestamp: Date.now(),
            description: `Float request for ${request.amount} approved by admin. Request ID: ${request.id}`
        }, { transaction: t });
    });
}

export async function rejectAgentRequest(requestId: string, adminId: string): Promise<void> {
    const admin = await AdminUser.findByPk(adminId);
    const resolverUsername = admin ? admin.username : 'Unknown Admin';

    await AgentRequest.update({
        status: 'rejected',
        resolvedAt: Date.now(),
        resolvedBy: adminId,
        resolverUsername: resolverUsername
    }, { where: { id: requestId, status: 'pending' } });
}

export async function getAgentTransactions(agentId: string): Promise<AgentTransactionType[]> {
    const transactions = await AgentTransaction.findAll({
        where: { agentId: agentId },
        order: [['timestamp', 'DESC']]
    });
    return transactions.map(t => t.get({ plain: true }) as AgentTransactionType);
}

export async function depositToPlayer(agentId: string, playerId: string, amount: number): Promise<{ newAgentBalance: number, newPlayerBalance: number }> {
    return await sequelize.transaction(async (t) => {
        const agent = await Agent.findByPk(agentId, { transaction: t, lock: true });
        if (!agent) throw new Error('Agent not found.');
        
        const agentFloat = agent.floatBalance ? (typeof agent.floatBalance === 'string' ? parseFloat(agent.floatBalance) : agent.floatBalance) : 0;
        if (agentFloat < amount) throw new Error('Insufficient float balance.');
        
        const player = await UserProfile.findByPk(playerId, { transaction: t, lock: true });
        if (!player) throw new Error('Player not found.');

        const playerBalance = typeof player.balance === 'string' ? parseFloat(player.balance) : player.balance;

        const newAgentBalance = agentFloat - amount;
        const newPlayerBalance = playerBalance + amount;

        await agent.update({ floatBalance: newAgentBalance }, { transaction: t });
        await player.update({ balance: newPlayerBalance }, { transaction: t });

        await AgentTransaction.create({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            agentId: agentId,
            type: 'PlayerDeposit',
            amount: amount,
            playerId: playerId,
            playerName: player.username,
            timestamp: Date.now(),
            description: `Deposited ${amount} into ${player.username}'s account.`
        }, { transaction: t });
        
        await WalletTransaction.create({
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId: playerId,
            type: 'deposit',
            amount: amount,
            timestamp: Date.now(),
            description: `Deposit received from agent ${agent.username}.`
        }, { transaction: t });

        return { newAgentBalance, newPlayerBalance };
    });
}

// --- Game Room Functions ---

function mapToLudoPlayerType(player: LudoPlayer): LudoPlayerType {
    return {
        userId: player.userId,
        username: player.username,
        avatar: player.avatar,
        color: player.color,
        isHost: player.isHost,
        isReady: player.isReady,
        status: player.status,
    };
}

function mapToGameRoomType(room: GameRoom): GameRoomType {
    return {
        id: room.id,
        status: room.status,
        betAmount: typeof room.betAmount === 'string' ? parseFloat(room.betAmount) : room.betAmount,
        capacity: room.capacity,
        gameMode: room.gameMode,
        players: room.players ? room.players.map(mapToLudoPlayerType) : [],
        createdAt: room.createdAt,
        gameState: room.gameState as any, // Assuming direct mapping for now
    };
}


export async function getRoomById(roomId: string): Promise<GameRoomType | null> {
    const room = await GameRoom.findByPk(roomId, {
        include: [{ model: LudoPlayer, include: [UserProfile] }]
    });

    if (!room) {
        return null;
    }
    
    return mapToGameRoomType(room);
}

export async function addPlayerToRoom(roomId: string, player: LudoPlayerType): Promise<GameRoomType> {
    await LudoPlayer.create({
        roomId: roomId,
        userId: player.userId,
        username: player.username,
        avatar: player.avatar,
        color: player.color,
        isHost: false,
        isReady: true, // Player is ready upon joining
        status: 'online',
    });

    const room = await getRoomById(roomId);
    if (!room) throw new Error('Room not found after adding player.');
    return room;
}

export async function startGame(roomId: string, hostId: string): Promise<GameRoomType> {
    return sequelize.transaction(async (t) => {
        const room = await GameRoom.findByPk(roomId, { 
            include: [{ model: LudoPlayer, include: [UserProfile] }],
            transaction: t,
            lock: true 
        });

        if (!room) throw new Error('Room not found.');
        if (room.status !== 'waiting') throw new Error('Game has already started.');

        const host = room.players?.find(p => p.userId === hostId);
        if (!host || !host.isHost) throw new Error('Only the host can start the game.');

        if (!room.players || room.players.length < 2) throw new Error('At least 2 players are required to start.');

        const bet = typeof room.betAmount === 'string' ? parseFloat(room.betAmount) : room.betAmount;
        let totalEscrow = 0;

        // Validate balances and deduct bets
        for (const player of room.players) {
            if (player.userId.startsWith('bot_')) { // Assuming bot IDs start with 'bot_'
                totalEscrow += bet;
                continue;
            }
            
            if (!player.user) throw new Error(`User profile not found for player ${player.username}`);
            
            const balance = typeof player.user.balance === 'string' ? parseFloat(player.user.balance) : player.user.balance;
            if (balance < bet) {
                throw new Error(`Player ${player.username} has insufficient balance.`);
            }
            
            await player.user.update({ balance: balance - bet }, { transaction: t });
            totalEscrow += bet;
        }

        // Create initial tokens for each player
        const initialTokens: LudoTokenType[] = [];
        const tokenCreations = room.players.map(player => {
            return [0, 1, 2, 3].map(i => {
                const tokenId = `token_${player.color}_${i}`;
                initialTokens.push({ id: tokenId, ownerId: player.userId, color: player.color, position: -1 });
                return LudoToken.create({
                    id: tokenId,
                    roomId: roomId,
                    ownerId: player.userId,
                    color: player.color,
                    position: -1, // Home Base
                }, { transaction: t });
            });
        }).flat();
        
        await Promise.all(tokenCreations);

        // Update game state
        const newGameState = {
            ...room.gameState,
            tokens: initialTokens,
            escrowBalance: totalEscrow,
            turn: 0,
            turnTimer: 30,
            logs: [
                ...room.gameState.logs,
                { id: `log_${Date.now()}`, timestamp: Date.now(), text: `⚔️ The game has started! Bet: $${bet}. Total pot: $${totalEscrow}` }
            ]
        };

        await room.update({ status: 'playing', gameState: newGameState }, { transaction: t });
        
        // The transaction will commit here automatically.
        const finalRoom = await getRoomById(roomId);
        if(!finalRoom) throw new Error('Could not retrieve final room state.');
        return finalRoom;
    });
}

export async function removePlayerFromRoom(roomId: string, userId: string): Promise<GameRoomType | null> {
    const room = await GameRoom.findByPk(roomId, { include: [LudoPlayer] });
    if (!room) throw new Error('Room not found.');

    const playerToRemove = room.players?.find(p => p.userId === userId);
    if (!playerToRemove) throw new Error('Player not found in this room.');

    if (room.status === 'waiting') {
        await LudoPlayer.destroy({ where: { roomId: roomId, userId: userId } });
        
        const remainingPlayers = room.players?.filter(p => p.userId !== userId) || [];

        if (remainingPlayers.length === 0) {
            await GameRoom.destroy({ where: { id: roomId } });
            return null; // Room is deleted
        }

        if (playerToRemove.isHost) {
            // Promote the next player to host
            const newHost = remainingPlayers[0];
            await LudoPlayer.update({ isHost: true }, { where: { roomId: roomId, userId: newHost.userId } });
        }
    } else if (room.status === 'playing') {
        await LudoPlayer.update({ status: 'left' }, { where: { roomId: roomId, userId: userId } });

        const activePlayers = room.players?.filter(p => p.userId !== userId && p.status !== 'left') || [];

        if (activePlayers.length === 1) {
            // Last remaining player wins by forfeit
            const winner = activePlayers[0];
            await GameRoom.update({ status: 'completed', winner_id: winner.userId }, { where: { id: roomId } });
            
            // TODO: Handle payout logic here in a future step.
            // For now, just mark the game as complete.
        }
    }

    return await getRoomById(roomId);
}

export async function createRoom(roomData: Partial<GameRoomType>, player: LudoPlayerType): Promise<GameRoomType> {
    const t = await sequelize.transaction();
    try {
        const newRoom = await GameRoom.create({
            id: roomData.id,
            status: 'waiting',
            betAmount: roomData.betAmount,
            capacity: roomData.capacity,
            gameMode: roomData.gameMode,
            createdAt: Date.now(),
            gameState: {
                turn: 0,
                diceRoll: null,
                hasRolled: false,
                turnTimer: 30,
                tokens: [],
                winnerId: null,
                escrowBalance: 0,
                logs: [{ id: '1', timestamp: Date.now(), text: `Room created by ${player.username}.` }],
                chat: [],
                lastActivity: Date.now()
            }
        }, { transaction: t });

        await LudoPlayer.create({
            roomId: newRoom.id,
            userId: player.userId,
            username: player.username,
            avatar: player.avatar,
            color: player.color,
            isHost: true,
            isReady: true,
            status: 'online'
        }, { transaction: t });

        await t.commit();

        const createdRoom = await GameRoom.findByPk(newRoom.id, { include: [LudoPlayer] });
        
        // This mapping needs to be implemented
        // For now, returning a simplified version
        return {
            id: createdRoom!.id,
            status: createdRoom!.status,
            betAmount: parseFloat(createdRoom!.betAmount as any),
            capacity: createdRoom!.capacity,
            gameMode: createdRoom!.gameMode,
            players: createdRoom!.players!.map(p => ({
                userId: p.userId,
                username: p.username,
                avatar: p.avatar,
                color: p.color,
                isHost: p.isHost,
                isReady: p.isReady,
                status: p.status
            })),
            createdAt: createdRoom!.createdAt,
            gameState: createdRoom!.gameState as any,
        };

    } catch (error) {
        await t.rollback();
        console.error('Error creating room:', error);
        throw error;
    }
}
