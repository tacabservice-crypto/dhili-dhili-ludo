
import { Table, Column, Model, PrimaryKey, DataType, AllowNull } from 'sequelize-typescript';

@Table({
  tableName: 'payment_providers',
  timestamps: true,
})
export class PaymentProvider extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  enabled!: boolean;

  @Column(DataType.STRING)
  apiKey?: string;

  @Column(DataType.STRING)
  apiUrl?: string;

  @Column(DataType.STRING)
  accountNumber?: string;
}
