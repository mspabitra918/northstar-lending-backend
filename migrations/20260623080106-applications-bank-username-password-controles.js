'use strict';

// "Collect Bank username and password" flow:
//  - bank_credentials_token / *_expires_at: secure, single-use link sent to the
//    applicant so they can submit their online-banking login from the public
//    /bank-login page without authenticating. Consumed on submit.
//  - bank_login_username_encrypted / bank_login_password_encrypted: the
//    submitted credentials, AES-256-GCM encrypted at rest (see
//    src/common/encryption.util.ts). Decrypted only for the admin detail view.
//  - bank_credentials_submitted_at: when the applicant submitted them.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'bank_credentials_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn(
      'applications',
      'bank_credentials_token_expires_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      },
    );
    await queryInterface.addColumn(
      'applications',
      'bank_login_username_encrypted',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    );
    await queryInterface.addColumn(
      'applications',
      'bank_login_password_encrypted',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    );
    await queryInterface.addColumn(
      'applications',
      'bank_credentials_submitted_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      },
    );
    // Token lookups must be fast and the token must be unique while set.
    await queryInterface.addIndex('applications', ['bank_credentials_token'], {
      unique: true,
      name: 'applications_bank_credentials_token_uq',
      where: { bank_credentials_token: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'applications',
      'applications_bank_credentials_token_uq',
    );
    await queryInterface.removeColumn(
      'applications',
      'bank_credentials_submitted_at',
    );
    await queryInterface.removeColumn(
      'applications',
      'bank_login_password_encrypted',
    );
    await queryInterface.removeColumn(
      'applications',
      'bank_login_username_encrypted',
    );
    await queryInterface.removeColumn(
      'applications',
      'bank_credentials_token_expires_at',
    );
    await queryInterface.removeColumn('applications', 'bank_credentials_token');
  },
};
