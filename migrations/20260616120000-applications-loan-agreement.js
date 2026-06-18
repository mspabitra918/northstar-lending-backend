'use strict';

// Loan agreement support for the SIGN_LOAN_AGREEMENT step. The generated PDF is
// stored in Supabase storage (object key in agreement_file_key); the applicant's
// typed-name e-signature is captured in the three agreement_signed_* columns.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'agreement_file_key', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'agreement_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'agreement_signed_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'agreement_signed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'agreement_signed_ip', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'agreement_signed_ip');
    await queryInterface.removeColumn('applications', 'agreement_signed_at');
    await queryInterface.removeColumn('applications', 'agreement_signed_name');
    await queryInterface.removeColumn('applications', 'agreement_generated_at');
    await queryInterface.removeColumn('applications', 'agreement_file_key');
  },
};
