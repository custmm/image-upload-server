"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("files", "file_description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("files");

    // ✅ 컬럼이 존재하는 경우에만 삭제
    if (tableDesc.file_description) {
      await queryInterface.removeColumn("files", "file_description");
    } else {
      console.warn("⚠️ 'file_description' 컬럼이 존재하지 않음, 무시하고 진행");
    }
  },
};
