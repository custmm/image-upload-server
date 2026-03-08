"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ description 컬럼이 존재하는 경우에만 변경
    const tableDesc = await queryInterface.describeTable("files");
    if (tableDesc.description) {
      await queryInterface.renameColumn("files", "description", "text");
    }
  },

  async down(queryInterface, Sequelize) {
    // ✅ file_description 컬럼이 존재하는 경우에만 변경
    const tableDesc = await queryInterface.describeTable("files");
    if (tableDesc.text) {
      await queryInterface.renameColumn("files", "text", "description");
    }
  },
};
