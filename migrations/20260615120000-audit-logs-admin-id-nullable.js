'use strict';

// admin_id is null for applicant-initiated actions (document uploads,
// self-submitted status changes). The original create-audit-logs migration
// declared it NOT NULL, which rejected every applicant-side audit write.
//
// Use a raw ALTER rather than queryInterface.changeColumn: changeColumn with a
// `references` option re-adds a duplicate foreign-key constraint on Postgres
// every time it runs, and does not reliably emit DROP NOT NULL. The existing
// audit_logs_admin_id_fkey is left untouched.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "audit_logs" ALTER COLUMN "admin_id" DROP NOT NULL;',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "audit_logs" ALTER COLUMN "admin_id" SET NOT NULL;',
    );
  },
};
