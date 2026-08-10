
import { Table, Column, Model, PrimaryKey, DataType, HasMany } from 'sequelize-typescript';
import { LudoPlayer } from './LudoPlayer';
import { GameState } from './GameState';

@Table({
  tableName: 'game_rooms',
  timestamps: true,
})
export class GameRoom extends Model<GameRoom> {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.ENUM('waiting', 'playing', 'completed', 'cancelled'),
    allowNull: false,
  })
  status!: 'waiting' | 'playing' | 'completed' | 'cancelled';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  betAmount!: number;

  @HasMany(() => LudoPlayer)
  players!: LudoPlayer[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  spectators?: Partial<any>[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  gameState!: GameState;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  createdAt!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  capacity?: number;

  @Column({
    type: DataType.ENUM('solo', 'team'),
    allowNull: true,
  })
  gameMode?: 'solo' | 'team';

  @HasMany(() => LudoPlayer)
  pendingPlayers?: LudoPlayer[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  rejectionReason?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  tournamentDetails?: { tournamentId: string; matchId: string; };
}
