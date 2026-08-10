
import { Table, Column, Model, PrimaryKey, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { GameState } from './GameState';
import { UserProfile } from './UserProfile';

@Table({
  tableName: 'ludo_tokens',
  timestamps: false,
})
export class LudoToken extends Model<LudoToken> {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => GameState)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  gameStateId!: string;

  @BelongsTo(() => GameState)
  gameState!: GameState;

  @ForeignKey(() => UserProfile)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  ownerId!: string;

  @BelongsTo(() => UserProfile)
  owner!: UserProfile;

  @Column({
    type: DataType.ENUM('red', 'green', 'yellow', 'blue'),
    allowNull: false,
  })
  color!: 'red' | 'green' | 'yellow' | 'blue';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  position!: number;
}
