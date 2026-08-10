
import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { LudoToken } from './LudoToken';
import { GameRoom } from './GameRoom';

@Table({
  tableName: 'game_states',
  timestamps: false,
})
export class GameState extends Model<GameState> {
  @ForeignKey(() => GameRoom)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    primaryKey: true,
  })
  gameRoomId!: string;

  @BelongsTo(() => GameRoom)
  gameRoom!: GameRoom;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  turn!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  diceRoll!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  lastDiceRoll?: number | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  hasRolled!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  turnTimer!: number;

  @HasMany(() => LudoToken)
  tokens!: LudoToken[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  winnerId!: string | null;

  @Column({
    type: DataType.ENUM('forfeit', 'inactivity', 'all_tokens_home'),
    allowNull: true,
  })
  completionReason?: 'forfeit' | 'inactivity' | 'all_tokens_home';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  endReasonText?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  escrowBalance!: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  logs!: any[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  chat!: any[];

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  lastActivity!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  consecutiveSixes?: number;
}
