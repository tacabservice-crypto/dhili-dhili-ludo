
import { Table, Column, Model, PrimaryKey, Unique, AllowNull, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Agent } from './Agent';

@Table({
  tableName: 'user_profiles',
  timestamps: false // We have createdAt as a BIGINT
})
export class UserProfile extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  username!: string;

  @Unique
  @Column(DataType.STRING)
  email?: string;

  @Column(DataType.STRING)
  phone?: string;

  @Column(DataType.STRING)
  location?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  avatar!: string;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  balance!: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  win_count!: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  loss_count!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  is_offline_preference?: boolean;

  @Column(DataType.STRING)
  vip_tier?: string;

  @Column(DataType.BIGINT)
  vip_expires?: number; // Unix timestamp

  @Column(DataType.STRING)
  role?: string;

  @Column(DataType.STRING)
  password?: string; // Storing hashed password

  @ForeignKey(() => Agent)
  @Column(DataType.STRING)
  linked_agent_id?: string;

  @BelongsTo(() => Agent)
  agent?: Agent;

  @Column(DataType.STRING)
  promo_code?: string;
  
  @Unique
  @Column(DataType.STRING)
  firebase_uid?: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  created_at!: number; // Unix timestamp
}
