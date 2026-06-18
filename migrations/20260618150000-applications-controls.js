'use strict';

// Individual application controls & access:
//  - is_locked: set true on Approve (FUNDED) / Decline (DECLINED). A locked
//    application can no longer have its status changed or be re-actioned.
//  - decline_reason: optional reason captured at decline, surfaced in the
//    adverse action notice.
//  - document_request_token / *_expires_at: the secure, single-link token sent
//    to the applicant by the "Collect Documents" action so they can upload
//    files directly to their own application without authenticating.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'is_locked', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('applications', 'decline_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'document_request_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn(
      'applications',
      'document_request_token_expires_at',
      {
        type: Sequelize.DATE,
        allowNull: true,
      },
    );
    // Token lookups must be fast and the token must be unique.
    await queryInterface.addIndex('applications', ['document_request_token'], {
      unique: true,
      name: 'applications_document_request_token_uq',
      where: { document_request_token: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'applications',
      'applications_document_request_token_uq',
    );
    await queryInterface.removeColumn(
      'applications',
      'document_request_token_expires_at',
    );
    await queryInterface.removeColumn('applications', 'document_request_token');
    await queryInterface.removeColumn('applications', 'decline_reason');
    await queryInterface.removeColumn('applications', 'is_locked');
  },
};
