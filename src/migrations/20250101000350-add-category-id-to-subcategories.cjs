"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("subcategories", "category_id", {
      type: Sequelize.INTEGER,
      allowNull: true, // ✅ NULL 허용 (삭제 시 오류 방지)
      references: {
        model: "categories",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("subcategories");

    // ✅ category_id 컬럼이 존재하는 경우에만 처리
    if (tableDesc.category_id) {
      try {
        // ✅ 올바른 외래키 이름 사용 (`subcategories_category_id_name`)
        await queryInterface.removeConstraint("subcategories", "subcategories_category_id_name");
      } catch (error) {
        console.warn("⚠️ 외래키가 존재하지 않음, 무시하고 진행");
      }

      // ✅ 컬럼 삭제
      await queryInterface.removeColumn("subcategories", "category_id");
    }
  },
};
