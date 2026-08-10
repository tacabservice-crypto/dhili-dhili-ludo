
import { Table, Column, Model, PrimaryKey, Unique, AllowNull, DataType, HasMany } from 'sequelize-typescript';
import { UserProfile } from './UserProfile';

@Table({
  tableName: 'agents',
  timestamps: false // We have createdAt as a BIGINT
})
export class Agent extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  username!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  phone!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string; // Storing hashed password

  @Unique
  @Column(DataType.STRING)
  promo_code?: string;

  @Column(DataType.STRING)
  location?: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(5, 4))
  commission_rate!: number;

  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(10, 2),
    defaultValue: 0.00
  })
  balance!: number;

  @Column(DataType.DECIMAL(10, 2))
  float_balance?: number;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('Active', 'Suspended'),
    defaultValue: 'Active'
  })
  status!: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  created_at!: number; // Unix timestamp

  @HasMany(() => UserProfile)
  linked_users?: UserProfile[];
}
