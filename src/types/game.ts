/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar: string;
  balance: number;
  winCount: number;
  lossCount: number;
  isOfflinePreference?: boolean;
  role?: 'admin' | 'player'; // Added for admin roles
  gamesPlayed?: number;
  winRate?: number;
  currentStreak?: number;
  bestStreak?: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet_escrow_locked' | 'bet_escrow_refund' | 'win_payout' | 'app_commission' | 'refund';
  amount: number;
  timestamp: number;
  matchId?: string;
  description: string;
}

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoPlayer {
  userId: string;
  username: string;
  avatar: string;
  color: PlayerColor;
  isHost: boolean;
  isReady: boolean;
  status: 'online' | 'offline' | 'left';
  winCount?: number;
  lossCount?: number;
  balance?: number;
  inactivityTimer?: number;
}

export interface LudoToken {
  id: string; // "token_red_0", "token_red_1", etc.
  ownerId: string;
  color: PlayerColor;
  position: number; // -1 = home base, 0 = start space, 51-55 = home stretch, 56 = finished goal
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface GameLog {
  id: string;
  timestamp: number;
  text: string;
}

export interface GameState {
  turn: number; // Index of the player whose turn it is in the player list
  diceRoll: number | null;
  lastDiceRoll?: number | null;
  hasRolled: boolean;
  turnTimer: number; // Seconds remaining for current player to make a move
  tokens: LudoToken[];
  winnerId: string | null;
  completionReason?: 'forfeit' | 'inactivity' | 'all_tokens_home';
  endReasonText?: string;
  escrowBalance: number;
  logs: GameLog[];
  chat: ChatMessage[];
  lastActivity: number;
  consecutiveSixes?: number; // Track consecutive rolls of 6
}

export interface GameRoom {
  id: string; // Room code (e.g., "AB82D")
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  betAmount: number; // $0, $1, $5, $10, $25, $50
  players: LudoPlayer[];
  gameState: GameState;
  createdAt: number;
  capacity?: number; // 2, 3, 4 players
  gameMode?: 'solo' | 'team'; // 'solo' or 'team'
  pendingPlayers?: LudoPlayer[]; // Players waiting for host approval
  rejectionReason?: string; // Reason for join rejection, for client-side feedback
}
