"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      // ✅ post 테이블의 외래키 먼저 삭제
      await queryInterface.removeConstraint("post", "post_ibfk_1");
    } catch (error) {
      console.warn("⚠️ post_ibfk_1 외래키가 존재하지 않음, 무시하고 진행");
    }

    // ✅ categories 테이블 삭제
    await queryInterface.dropTable("categories");
  },
};
