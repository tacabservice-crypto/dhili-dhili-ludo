
import { Table, Column, Model, PrimaryKey, DataType } from 'sequelize-typescript';

@Table({ tableName: 'matchmaking', timestamps: false })
export class MatchmakingModel extends Model {
    @PrimaryKey @Column(DataType.STRING) user_id!: string;
    @Column(DataType.STRING) username!: string;
    @Column(DataType.STRING) avatar!: string;
    @Column(DataType.DECIMAL) bet_amount!: number;
    @Column(DataType.INTEGER) capacity!: number;
    @Column(DataType.STRING) game_mode!: string;
    @Column(DataType.STRING) status!: string;
    @Column(DataType.BIGINT) timestamp!: number;
}
