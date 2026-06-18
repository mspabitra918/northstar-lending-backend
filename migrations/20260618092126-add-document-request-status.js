'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_applications_status"
      ADD VALUE IF NOT EXISTS 'DOCUMENT_REQUEST';
    `);
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL does not support removing enum values directly.
    // Leave empty or recreate the enum if rollback is required.
  },
};
