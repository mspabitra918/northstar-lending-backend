// applications/models/application.model.ts

import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { AdminNote } from '../../admin-notes/models/admin-note.model';
import { AuditLog } from '../../audit-logs/models/audit-log.model';
import { BankConnection } from '../../bank-connections/models/bank-connection.model';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { Document } from '../../documents/models/document.model';

@Table({
  tableName: 'applications',
  underscored: true,
})
export class LoanApplication extends Model<LoanApplication> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    allowNull: false,
    unique: true,
  })
  declare application_id: string;

  @Column
  declare first_name: string;

  @Column
  declare last_name: string;

  @Column
  declare dob: Date;

  @Column(DataType.TEXT)
  declare ssn_encrypted: string;

  @Column
  declare email: string;

  @Column
  declare phone: string;

  @Column
  declare address: string;

  @Column
  declare city: string;

  @Column
  declare state: string;

  @Column
  declare zip_code: string;

  @Column
  declare employment_status: string;

  @Column
  declare employer_name: string;

  @Column
  declare employer_phone?: string;

  @Column(DataType.DECIMAL)
  declare monthly_income: number;

  @Column
  declare account_type: string;

  @Column(DataType.TEXT)
  declare routing_number_encrypted: string;

  @Column(DataType.TEXT)
  declare account_number_encrypted: string;

  @Column
  declare account_age: string;

  @Column
  declare credit_tier: string;

  @Column
  declare reference_name: string;

  @Column
  declare reference_phone: string;

  @Column
  declare reference_relationship: string;

  @Column(DataType.DECIMAL)
  declare loan_amount: number;

  @Column
  declare loan_term: number;

  @Column({
    type: DataType.ENUM(...Object.values(ApplicationStatus)),
    allowNull: false,
    defaultValue: ApplicationStatus.APPLICATION_SUBMITTED,
  })
  declare status: ApplicationStatus;

  @Column({
    defaultValue: false,
  })
  declare bank_verified: boolean;

  @Column({
    defaultValue: false,
  })
  declare consent_accepted: boolean;

  // Origin IP captured server-side at form submission (from x-forwarded-for /
  // x-real-ip, falling back to the socket address). VARCHAR(45) holds both
  // IPv4 and IPv6. Used for fraud detection and audit logging.
  @Column({ type: DataType.STRING(45), allowNull: true })
  declare ip_address: string | null;

  // ── Loan agreement (SIGN_LOAN_AGREEMENT step) ────────────────────────────
  // Object key of the generated agreement PDF in Supabase storage. Set when an
  // admin moves the application into SIGN_LOAN_AGREEMENT.
  @Column({ type: DataType.TEXT, allowNull: true })
  declare agreement_file_key: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare agreement_generated_at: Date | null;

  // Captured when the applicant e-signs from the status portal. Together these
  // three columns ARE the signature record (typed name + timestamp + IP).
  @Column({ type: DataType.STRING, allowNull: true })
  declare agreement_signed_name: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare agreement_signed_at: Date | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare agreement_signed_ip: string | null;

  // ── Individual application controls ──────────────────────────────────────
  // Locked once a manager Approves (FUNDED) or Declines (DECLINED). A locked
  // application can no longer change status or be re-actioned — the decision is
  // final and the record is frozen for audit integrity.
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare is_locked: boolean;

  // Optional reason captured at decline; surfaced in the adverse action notice.
  @Column({ type: DataType.TEXT, allowNull: true })
  declare decline_reason: string | null;

  // Secure single-link token + expiry issued by the "Collect Documents" action.
  // The applicant uploads files straight to their own application via this
  // token without needing an account (see documents token flow).
  @Column({ type: DataType.STRING, allowNull: true })
  declare document_request_token: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare document_request_token_expires_at: Date | null;

  // ── Collect bank online-banking credentials ──────────────────────────────
  // Secure single-link token + expiry issued by the "Collect Bank username and
  // password" action. The applicant submits their online-banking login via this
  // token (no account needed); a new request supersedes any earlier link.
  @Column({ type: DataType.STRING, allowNull: true })
  declare bank_credentials_token: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare bank_credentials_token_expires_at: Date | null;

  // Online-banking login captured from the secure link. AES-256-GCM encrypted
  // at rest (see common/encryption.util); decrypted only for the admin detail
  // view. NOTE: storing raw banking credentials is high-risk — see the service.
  @Column({ type: DataType.TEXT, allowNull: true })
  declare bank_login_username_encrypted: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare bank_login_password_encrypted: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare bank_credentials_submitted_at: Date | null;

  @HasMany(() => Document, {
    foreignKey: 'application_id',
    sourceKey: 'application_id',
  })
  declare documents: Document[];

  @HasMany(() => BankConnection, {
    foreignKey: 'application_id',
    sourceKey: 'application_id',
  })
  declare bank_connections: BankConnection[];

  @HasMany(() => AdminNote, {
    foreignKey: 'application_id',
    sourceKey: 'application_id',
  })
  declare admin_notes: AdminNote[];

  @HasMany(() => AuditLog, {
    foreignKey: 'application_id',
    sourceKey: 'application_id',
  })
  declare audit_logs: AuditLog[];
}
