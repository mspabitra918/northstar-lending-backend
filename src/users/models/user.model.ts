// users/models/user.model.ts

import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { AdminNote } from 'src/admin-notes/models/admin-note.model';
import { AuditLog } from 'src/audit-logs/models/audit-log.model';
import { UserRole } from 'src/common/enums/user-role.enum';

@Table({
  tableName: 'users',
  underscored: true,
})
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column
  declare first_name: string;

  @Column
  declare last_name: string;

  @Column({
    unique: true,
  })
  declare email: string;

  @Column
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.AGENT,
  })
  declare role: UserRole;

  @Column({
    defaultValue: true,
  })
  declare is_active: boolean;

  @HasMany(() => AuditLog, {
    foreignKey: 'admin_id',
    sourceKey: 'id',
  })
  declare audit_logs: AuditLog[];

  @HasMany(() => AdminNote, {
    foreignKey: 'admin_id',
    sourceKey: 'id',
  })
  declare admin_notes: AdminNote[];
}
