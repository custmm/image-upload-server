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
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'file_path' // DB 컬럼명 일치 확인
        },
        categoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: false, 
          field: 'category_id', // DB의 category_id와 매핑
          references: { 
            model: "categories", 
            key: "id" 
          } 
        },
        subcategoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: true, 
          field: 'subcategory_id', // DB의 subcategory_id와 매핑
          references: { 
            model: "subcategories", 
            key: "id" 
          } 
        }
      },
      {
        sequelize,
        modelName: "Post",
        tableName: "posts",
        timestamps: true, // createdAt, updatedAt 자동 관리
        underscored: true, // JS의 camelCase를 DB의 snake_case로 자동 변환
      }
    );
  }
}