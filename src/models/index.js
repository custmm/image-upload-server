import { sequelize } from "../config/databaseConfig.js";
import Category from "./category.js";
import Subcategory from "./subcategory.js";
import File from "./file.js";
import Description from "./description.js";
import Post from "./post.js";
import Setting from "./setting.js";

// 모델 초기화 (Sequelize 인스턴스를 전달)
Category.init(sequelize);
Subcategory.init(sequelize);
File.init(sequelize);
Description.init(sequelize);
Post.init(sequelize);
Setting.init(sequelize);   // 추가

// 관계 설정
    // `Category` - `Subcategory` 관계
    Category.hasMany(Subcategory, {
        foreignKey: "category_id",
        as:"subcategories",
        onDelete: "CASCADE"
    });
    Subcategory.belongsTo(Category, {
        foreignKey: "category_id",
        as:"category",
        onDelete: "CASCADE"
    });

    // `Category` - `Post` 관계
    Category.hasMany(Post, {
        foreignKey: "categoryId",
        as:"posts",
        onDelete: "CASCADE"
    });    
    Post.belongsTo(Category, {
        foreignKey: "categoryId",
        as:"category",
        onDelete: "CASCADE"
    });

    // `Subcategory` - `Post` 관계 추가
    Subcategory.hasMany(Post, {
        foreignKey: "subcategoryId",
        as:"posts",
        onDelete: "CASCADE"
    });    
    Post.belongsTo(Subcategory, {
        foreignKey: "subcategoryId",
        as:"subcategory",
        onDelete: "CASCADE"
    });

    // `File` - `Category` 관계
    File.belongsTo(Category, { 
        foreignKey: "category_id", 
        as: "category", 
        onDelete: "CASCADE" 
    });
    Category.hasMany(File, { 
        foreignKey: "category_id", 
        as: "files",
        onDelete: "CASCADE" 
    });

    // `File` - `Subcategory` 관계 추가
    File.belongsTo(Subcategory, { 
        foreignKey: "subcategory_id", 
        as: "subcategory", 
        onDelete: "CASCADE" 
    });    
    Subcategory.hasMany(File, { 
        foreignKey: "subcategory_id", 
        as: "files",
        onDelete: "CASCADE" 
    });

    // `File` - `Description` 관계 추가
    File.hasOne(Description, { 
        foreignKey: "file_id", 
        as: "description", 
        onDelete: "CASCADE",
        hooks:true 
    });
    Description.belongsTo(File, { 
        foreignKey: "file_id", 
        as: "file", 
        onDelete: "CASCADE" 
    });

// 모든 모델 export
export { sequelize, Category, Subcategory, File, Description, Post, Setting };