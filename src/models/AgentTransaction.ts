
import { Table, Column, Model, PrimaryKey, DataType, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'agent_transactions', timestamps: false })
export class AgentTransaction extends Model {
    @PrimaryKey @Column(DataType.STRING) id!: string;
    @Column(DataType.STRING) agent_id!: string;
    @Column(DataType.STRING) type!: string;
    @Column(DataType.DECIMAL) amount!: number;
    @Column(DataType.DECIMAL) discount_amount?: number;
    @Column(DataType.STRING) player_id?: string;
    @Column(DataType.STRING) player_name?: string;
    @Column(DataType.BIGINT) timestamp!: number;
    @Column(DataType.TEXT) description?: string;
}
