
import { Table, Column, Model, PrimaryKey, DataType } from 'sequelize-typescript';

@Table({ tableName: 'player_agent_requests', timestamps: false })
export class PlayerAgentRequestModel extends Model {
    @PrimaryKey @Column(DataType.STRING) id!: string;
    @Column(DataType.STRING) player_id!: string;
    @Column(DataType.STRING) player_username!: string;
    @Column(DataType.STRING) player_avatar!: string;
    @Column(DataType.STRING) agent_id!: string;
    @Column(DataType.STRING) player_phone!: string;
    @Column(DataType.STRING) sender_phone?: string;
    @Column(DataType.STRING) provider!: string;
    @Column(DataType.STRING) type!: string;
    @Column(DataType.DECIMAL) amount!: number;
    @Column(DataType.STRING) status!: string;
    @Column(DataType.BIGINT) created_at!: number;
}
