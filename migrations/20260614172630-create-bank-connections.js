'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bank_connections', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      application_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'application_id',
        },
      },

      plaid_item_id: Sequelize.STRING,

      institution_name: Sequelize.STRING,

      access_token_encrypted: Sequelize.TEXT,

      verified: {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bank_connections');
  },
};
