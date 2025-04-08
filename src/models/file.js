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
        file_path: { 
            type: DataTypes.STRING, 
            allowNull: false 
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
        file_description: { 
          type: DataTypes.STRING(500), // 🔥 최대 500자로 변경
          allowNull: true,
        },
        category_name: {  // ✅ 추가
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "uncategorized",
        },
        subcategory_name: {  // ✅ 추가
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "general",
        },
        created_at: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        },
        updated_at: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
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
