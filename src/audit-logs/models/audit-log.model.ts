// audit-logs/models/audit-log.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  BeforeUpdate,
  BeforeBulkUpdate,
  BeforeDestroy,
  BeforeBulkDestroy,
} from 'sequelize-typescript';
import { LoanApplication } from 'src/applications/models/application.model';
import { User } from 'src/users/models/user.model';

@Table({
  tableName: 'audit_logs',
  underscored: true,
})
export class AuditLog extends Model<AuditLog> {
  // ── Immutability ──────────────────────────────────────────────────────────
  // Audit entries are append-only: once written they may never be updated or
  // deleted. These hooks enforce that at the ORM layer so an accidental (or
  // malicious) save()/update()/destroy() throws instead of silently mutating
  // the trail. New rows are unaffected — hooks only fire on existing records.
  @BeforeUpdate
  @BeforeBulkUpdate
  static blockUpdate() {
    throw new Error('Audit logs are immutable and cannot be modified.');
  }

  @BeforeDestroy
  @BeforeBulkDestroy
  static blockDelete() {
    throw new Error('Audit logs are immutable and cannot be deleted.');
  }

  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  // Null when the action is performed by an applicant (e.g. document upload)
  // rather than an admin.
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  @ForeignKey(() => User)
  declare admin_id: string | null;

  @ForeignKey(() => LoanApplication)
  @Column
  declare application_id: string;

  @Column
  declare action: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare ip_address: string;

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
