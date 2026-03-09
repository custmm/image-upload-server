import { Model, DataTypes } from "sequelize";

export default class File extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        file_name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: false,
          defaultValue: "제목 없음",
        },
        file_path: {
          type: DataTypes.STRING,
          allowNull: false
        },
        imagekit_file_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "categories",
            key: "id"
          }
        },
        subcategory_id: {
          type: DataTypes.INTEGER,
          references: {
            model: "subcategories",
            key: "id"
          }
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          onUpdate: DataTypes.NOW
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
      },
      {
        sequelize,
        modelName: "File",
        tableName: "files",
        timestamps: false,
      }
    );
  }
}
