"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ description 컬럼이 존재하는 경우에만 변경
    const tableDesc = await queryInterface.describeTable("files");
    if (tableDesc.description) {
      await queryInterface.renameColumn("files", "description", "file_description");
    }
  },

  async down(queryInterface, Sequelize) {
    // ✅ file_description 컬럼이 존재하는 경우에만 변경
    const tableDesc = await queryInterface.describeTable("files");
    if (tableDesc.file_description) {
      await queryInterface.renameColumn("files", "file_description", "description");
    }
  },
};
