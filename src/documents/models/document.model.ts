// documents/models/document.model.ts

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
  tableName: 'documents',
  underscored: true,
  // The documents table only has an `uploaded_at` timestamp (see the
  // create-documents migration), not the default created_at/updated_at pair.
  createdAt: 'uploaded_at',
  updatedAt: false,
})
export class Document extends Model<Document> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => LoanApplication)
  @Column
  declare application_id: string;

  @Column
  declare document_type: string;

  @Column(DataType.TEXT)
  declare file_url: string;

  @BelongsTo(() => LoanApplication, {
    foreignKey: 'application_id',
    targetKey: 'application_id',
  })
  declare applications: LoanApplication;
}
