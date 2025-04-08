import { Model, DataTypes } from "sequelize";

export default class Post extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        title: { 
            type: DataTypes.STRING(255), 
            allowNull: false 
        },
        content: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        categoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: false, 
          references: { 
            model: "categories", 
            key: "id" 
            } 
        },
        subcategoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: true, 
          references: { 
            model: "subcategories", 
            key: "id" 
          } 
        },
        createdAt: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
        updatedAt: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
      },
      {
        sequelize,
        modelName: "Post",
        tableName: "posts",
        timestamps: false,
      }
    );
  }
}
