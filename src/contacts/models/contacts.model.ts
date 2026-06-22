import { Column, DataType, Model, Table } from 'sequelize-typescript';
interface ContactsCreationAttrs {
  full_name: string;
  email: string;
  number: string;
  message: string;
}
@Table({
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Contacts extends Model<Contacts, ContactsCreationAttrs> {
  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  declare full_name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: false,
  })
  declare number: string;

  @Column({
    type: DataType.STRING(250),
    allowNull: false,
  })
  declare message: string;
}
