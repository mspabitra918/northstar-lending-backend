'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      application_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },

      first_name: Sequelize.STRING,
      last_name: Sequelize.STRING,

      dob: Sequelize.DATEONLY,

      ssn_encrypted: Sequelize.TEXT,

      email: Sequelize.STRING,
      phone: Sequelize.STRING,

      address: Sequelize.STRING,
      city: Sequelize.STRING,
      state: Sequelize.STRING,
      zip_code: Sequelize.STRING,

      employment_status: Sequelize.STRING,
      employer_name: Sequelize.STRING,
      employer_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      monthly_income: Sequelize.DECIMAL(12, 2),

      account_type: Sequelize.STRING,

      routing_number_encrypted: Sequelize.TEXT,
      account_number_encrypted: Sequelize.TEXT,

      account_age: Sequelize.STRING,

      credit_tier: Sequelize.STRING,

      reference_name: Sequelize.STRING,
      reference_phone: Sequelize.STRING,
      reference_relationship: Sequelize.STRING,

      loan_amount: Sequelize.DECIMAL(12, 2),

      loan_term: Sequelize.INTEGER,

      status: {
        type: Sequelize.ENUM(
          'APPLICATION_SUBMITTED',
          'BANK_VERIFICATION_PENDING',
          'PHONE_VERIFICATION_PENDING',
          'SIGN_LOAN_AGREEMENT',
          'VERIFICATION_DEPOSIT',
          'FUNDED',
          'DECLINED',
        ),
        defaultValue: 'APPLICATION_SUBMITTED',
      },

      bank_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      consent_accepted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    await queryInterface.addIndex('applications', ['application_id']);

    await queryInterface.addIndex('applications', ['email']);

    await queryInterface.addIndex('applications', ['phone']);

    await queryInterface.addIndex('applications', ['status']);

    await queryInterface.addIndex('applications', ['created_at']);

    await queryInterface.addIndex('applications', ['first_name', 'last_name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('applications');
  },
};
