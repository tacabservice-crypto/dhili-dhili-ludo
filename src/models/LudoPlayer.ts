
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey } from 'sequelize-typescript';
import { UserProfile } from './UserProfile';
import { GameRoom } from './GameRoom';

@Table({
  tableName: 'game_players',
  timestamps: false,
})
export class LudoPlayer extends Model<LudoPlayer> {
  @PrimaryKey
  @ForeignKey(() => GameRoom)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  room_id!: string;

  @PrimaryKey
  @ForeignKey(() => UserProfile)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  user_id!: string;

  @BelongsTo(() => UserProfile)
  user!: UserProfile;

  @BelongsTo(() => GameRoom)
  gameRoom!: GameRoom;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  avatar!: string;

  @Column({
    type: DataType.ENUM('red', 'green', 'yellow', 'blue'),
    allowNull: false,
  })
  color!: 'red' | 'green' | 'yellow' | 'blue';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_host!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  is_ready!: boolean;

  @Column({
    type: DataType.ENUM('online', 'offline', 'left'),
    allowNull: false,
    defaultValue: 'online'
  })
  status!: 'online' | 'offline' | 'left';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  inactivityTimer?: number;
}
