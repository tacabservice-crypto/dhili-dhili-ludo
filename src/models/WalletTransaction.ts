
import { Table, Column, Model, PrimaryKey, AllowNull, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { UserProfile } from './UserProfile';

@Table({
  tableName: 'wallet_transactions',
  timestamps: false // We have timestamp as a BIGINT
})
export class WalletTransaction extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @ForeignKey(() => UserProfile)
  @AllowNull(false)
  @Column(DataType.STRING)
  user_id!: string;

  @BelongsTo(() => UserProfile)
  user!: UserProfile;

  @AllowNull(false)
  @Column(DataType.ENUM('deposit', 'withdrawal', 'bet_escrow_locked', 'bet_escrow_refund', 'win_payout', 'app_commission', 'refund'))
  type!: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  amount!: number;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  timestamp!: number; // Unix timestamp

  @Column(DataType.STRING)
  match_id?: string;

  @Column(DataType.TEXT)
  description?: string;
}
