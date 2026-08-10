
import { GameRoom, LudoToken, PlayerColor } from "./types/game";

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

export function isBotPlayer(userId: string) {
    return userId.startsWith('bot_') || userId.startsWith('sim_');
}

export function addLog(room: GameRoom, text: string) {
    const log = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        text,
    };
    room.gameState.logs.push(log);
    if (room.gameState.logs.length > 50) {
        room.gameState.logs.shift();
    }
}

export async function moveTokenLogic(room: GameRoom, tokenId: string, roll: number) {
    const gs = room.gameState;
    const token = gs.tokens.find(t => t.id === tokenId);

    if (!token) return;

    let nextPos = token.position + roll;

    // Handle leaving home base
    if (token.position === -1 && roll === 6) {
        nextPos = 0; // Starting position
    }

    // Handle entering home stretch
    const homeEntry = HOME_ENTRY_POSITIONS[token.color];
    if (token.position <= homeEntry && nextPos > homeEntry) {
        nextPos = 50 + (nextPos - homeEntry);
    }
    
    // Check for overshooting home
    if (nextPos > 56) {
        // invalid move
        return;
    }

    token.position = nextPos;

    // Handle capturing opponent's token
    const globalPos = getGlobalPosition(token.color, nextPos);
    if (globalPos !== null && !SAFE_GLOBAL_SQUARES.includes(globalPos)) {
        gs.tokens.forEach(t => {
            if (t.color !== token.color && t.position >= 0 && t.position <= 50) {
                const opGlobal = getGlobalPosition(t.color, t.position);
                if (opGlobal === globalPos) {
                    t.position = -1; // Send back to base
                    addLog(room, `⚔️ ${room.players.find(p => p.userId === token.ownerId)?.username} captured ${room.players.find(p => p.userId === t.ownerId)?.username}'s token!`);
                }
            }
        });
    }

    // Check for win condition
    const playerTokens = gs.tokens.filter(t => t.color === token.color);
    if (playerTokens.every(t => t.position === 56)) {
        gs.winnerId = token.ownerId;
        room.status = 'completed';
        addLog(room, `🎉 ${room.players.find(p => p.userId === token.ownerId)?.username} has won the game!`);
    } else {
        // If player rolled a 6, they get another turn. Otherwise, advance turn.
        if (roll !== 6) {
            // advanceTurn(room);
        }
    }
}