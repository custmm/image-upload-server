"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("files", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      subcategory_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "subcategories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
        // ✅ descriptions 테이블에서 외래키 먼저 삭제
        await queryInterface.removeConstraint("descriptions", "descriptions_ibfk_1");
      } catch (error) {
        console.warn("⚠️ descriptions_ibfk_1 외래키가 존재하지 않음, 무시하고 진행");
      }

    // ✅ files 테이블 삭제
    await queryInterface.dropTable("files");
  },
};
