import { Model, DataTypes } from "sequelize";

export default class Description extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: { 
          type: DataTypes.INTEGER, 
          autoIncrement: true, 
          primaryKey: true 
        },
        file_id: { 
          type: DataTypes.INTEGER, 
          references: { model: "files", key: "id" }
        },
        text: { 
          type: DataTypes.TEXT 
        },
      },
      {
        sequelize,
        modelName: "Description",
        tableName: "descriptions",
        timestamps: false,
      }
    );
  }
}
