// admin-notes/models/admin-note.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { LoanApplication } from '../../applications/models/application.model';
import { User } from '../../users/models/user.model';

@Table({
  tableName: 'admin_notes',
  underscored: true,
})
export class AdminNote extends Model<AdminNote> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // ✅ IMPORTANT: add ForeignKey
  @ForeignKey(() => LoanApplication)
  @Column
  declare application_id: string;

  // The admin (user) who authored the note.
  @Column({ type: DataType.UUID, allowNull: false })
  @ForeignKey(() => User)
  declare admin_id: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare note: string;

  @BelongsTo(() => LoanApplication, {
    foreignKey: 'application_id',
    targetKey: 'application_id',
  })
  declare applications: LoanApplication;

  @BelongsTo(() => User, {
    foreignKey: 'admin_id',
    targetKey: 'id',
  })
  declare users: User;
}
