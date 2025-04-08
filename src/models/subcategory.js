import { Model, DataTypes } from "sequelize";

export default class Subcategory extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        name: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        category_id: { 
          type: DataTypes.INTEGER,
          references: { 
            model: "categories", 
            key: "id" 
            },
        },
        created_at: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
        updated_at: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
      },
      {
        sequelize,
        modelName: "Subcategory",
        tableName: "subcategories",
        timestamps: false,
      }
    );
  }
}
