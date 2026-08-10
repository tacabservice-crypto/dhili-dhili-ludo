
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
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

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST!,
    dialect: 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    logging: false, // Set to console.log to see SQL queries
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
    ],
  }
);

export default sequelize;
