'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'ip_address', {
      type: Sequelize.STRING(45),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'ip_address');
  },
};
