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
    <div className="mt-6">
      <h2 className="text-xl font-bold text-gray-200 mb-3">Ciyaaraha Socda</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-white">Qolka: {game.id}</h3>
                <span className="text-sm font-medium text-green-400 bg-green-900 px-2 py-1 rounded">
                  ${game.betAmount}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {game.players.map((player) => (
                  <div key={player.userId} className="flex items-center" title={player.username}>
                    <span className="text-2xl">{player.avatar}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleSpectate(game.id)}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
            >
              <Eye className="mr-2 h-5 w-5" /> Daawasho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveGamesList;
