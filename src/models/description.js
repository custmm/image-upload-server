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
          allowNull: false,
          references: { 
            model: "files", 
            key: "id" 
          },
          onDelete: "CASCADE"
        },
        text: { 
          type: DataTypes.TEXT,
          allowNull: true,
          validate:{
            len:[0,1000]
          }
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