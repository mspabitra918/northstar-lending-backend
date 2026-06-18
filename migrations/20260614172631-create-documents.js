'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('documents', {
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
        onDelete: 'CASCADE',
      },

      document_type: {
        type: Sequelize.ENUM('ID', 'PASSPORT', 'PAYSTUB', 'BANK_STATEMENT'),
      },

      file_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      uploaded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
  },
};
