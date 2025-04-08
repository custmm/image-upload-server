import { Model, DataTypes } from "sequelize";

export default class Category extends Model {
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
            unique: true, 
            allowNull: false 
        },
        description: { 
            type: DataTypes.STRING 
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
        modelName: "Category",
        tableName: "categories",
        timestamps: false,
      }
    );
  }
}
