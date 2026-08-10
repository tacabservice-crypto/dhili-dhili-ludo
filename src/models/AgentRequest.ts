
import { Table, Column, Model, PrimaryKey, DataType } from 'sequelize-typescript';

@Table({ tableName: 'agent_requests', timestamps: false })
export class AgentRequest extends Model {
    @PrimaryKey @Column(DataType.STRING) id!: string;
    @Column(DataType.STRING) agent_id!: string;
    @Column(DataType.STRING) agent_username!: string;
    @Column(DataType.DECIMAL) amount!: number;
    @Column(DataType.STRING) status!: string;
    @Column(DataType.BIGINT) created_at!: number;
    @Column(DataType.BIGINT) resolved_at?: number;
    @Column(DataType.STRING) resolved_by?: string;
    @Column(DataType.STRING) resolver_username?: string;
}
