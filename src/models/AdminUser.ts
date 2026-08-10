
import { Table, Column, Model, PrimaryKey, DataType, Unique } from 'sequelize-typescript';

@Table({ tableName: 'admin_users', timestamps: false })
export class AdminUser extends Model {
    @PrimaryKey @Column(DataType.STRING) id!: string;
    @Unique @Column(DataType.STRING) username!: string;
    @Column(DataType.STRING) password_hash!: string;
    @Column(DataType.JSON) permissions!: any;
}
