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
        // [수정] 이미지 경로 컬럼 반드시 추가 (이게 없어서 안 보였을 확률 100%)
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'file_path' // 실제 DB 컬럼명과 매핑
        },
        // [수정] 외래키 컬럼명 확인
        categoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: false, 
          field: 'category_id', // DB 컬럼명이 category_id라면 이 설정이 필수입니다.
          references: { 
            model: "categories", 
            key: "id" 
            } 
        },
        subcategoryId: { 
          type: DataTypes.INTEGER, 
          allowNull: true, 
          field: 'subcategory_id', // DB 컬럼명이 subcategory_id라면 추가
          references: { 
            model: "subcategories", 
            key: "id" 
          } 
        },
        // createdAt/updatedAt은 아래 옵션에서 timestamps: true를 쓰면 자동으로 관리됩니다.
      },
      {
        sequelize,
        modelName: "Post",
        tableName: "posts",
        timestamps: true, // true로 바꾸면 createdAt, updatedAt을 자동으로 관리해줍니다.
        underscored: true, // camelCase인 categoryId를 DB의 category_id와 자동으로 연결해줍니다.
      }
    );
  }
}