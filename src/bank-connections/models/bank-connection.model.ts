// bank-connections/models/bank-connection.model.ts

import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';

import { LoanApplication } from '../../applications/models/application.model';

@Table({
  tableName: 'bank_connections',
  underscored: true,
})
export class BankConnection extends Model<BankConnection> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => LoanApplication)
  @Column(DataType.STRING)
  declare application_id: string;

  @Column
  declare plaid_item_id: string;

  @Column
  declare institution_name: string;

  @Column(DataType.TEXT)
  declare access_token_encrypted: string;

  @Column
  declare verified: boolean;

  @BelongsTo(() => LoanApplication, {
    foreignKey: 'application_id',
    targetKey: 'application_id',
  })
  declare applications: LoanApplication;
}
