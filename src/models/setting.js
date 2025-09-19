import { Model, DataTypes } from "sequelize";

export default class Setting extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        key: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        value: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Setting",
        tableName: "settings",
        timestamps: false, // createdAt/updatedAt 자동 관리 안 함
      }
    );
  }
}
