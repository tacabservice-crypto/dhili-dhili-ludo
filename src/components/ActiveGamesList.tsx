import React from 'react';
import { GameRoom } from '../../types/game';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActiveGamesListProps {
  games: GameRoom[];
}

const ActiveGamesList: React.FC<ActiveGamesListProps> = ({ games }) => {
  const navigate = useNavigate();

  const handleSpectate = (roomId: string) => {
    navigate(`/room/${roomId}?spectate=true`);
  };

  if (games.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold text-gray-200 mb-3">Ciyaaraha Socda</h2>
        <p className="text-gray-400">Hadda ma jiraan wax ciyaaro ah oo socda. Ku soo laabo goor dambe!</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Ciyaaraha Socda</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col h-full transition-all hover:border-purple-500/50 hover:bg-black/30 shadow-lg">
            {/* Top section: Room ID and Bet */}
            <div className="flex justify-between items-start mb-3">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Qolka</span>
                <span className="font-black text-base tracking-widest text-blue-400 block -mt-1">{game.id}</span>
              </div>
              <span className="font-mono text-xs font-black bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">
                ${game.betAmount}
              </span>
            </div>

            {/* Middle section: Players */}
            <div className="flex-grow space-y-1 mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ciyaartoyda ({game.players.length})</span>
              <div className="flex -space-x-3 items-center">
                {game.players.slice(0, 5).map(player => (
                  <div key={player.userId} title={player.username} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-base border-2 border-slate-700 shadow-md">
                    {player.avatar}
                  </div>
                ))}
                {game.players.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border-2 border-slate-600 shadow-md">
                    +{game.players.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom section: Button */}
            <button
              onClick={() => handleSpectate(game.id)}
              className="mt-auto w-full bg-purple-600/80 hover:bg-purple-600 border border-purple-500/50 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-wider transition-all active:scale-95 shadow-md hover:shadow-purple-500/20"
            >
              <Eye className="h-4 w-4" /> Daawasho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveGamesList;
