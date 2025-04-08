import { sequelize } from "../config/databaseConfig.js"; 
import Category from "./category.js";
import Subcategory from "./subcategory.js";
import File from "./file.js";
import Description from "./description.js";
import Post from "./post.js";

// ✅ 모델 초기화 (Sequelize 인스턴스를 전달)
Category.init(sequelize);
Subcategory.init(sequelize);
File.init(sequelize);
Description.init(sequelize);
Post.init(sequelize);

// ✅ 관계 설정
// 🔥 `Category` - `Subcategory`
Category.hasMany(Subcategory, { foreignKey: "category_id", onDelete: "CASCADE" });
Subcategory.belongsTo(Category, { foreignKey: "category_id", onDelete: "CASCADE" });

// 🔥 `Category` - `Post` 관계 추가
Category.hasMany(Post, { foreignKey: "categoryId", onDelete: "CASCADE" });
Subcategory.hasMany(Post, { foreignKey: "subcategoryId", onDelete: "CASCADE" });
Post.belongsTo(Category, { foreignKey: "categoryId", onDelete: "CASCADE" });
Post.belongsTo(Subcategory, { foreignKey: "subcategoryId", onDelete: "CASCADE" });

// 🔥 `File` - `Category` 관계 추가
Category.hasMany(File, { foreignKey: "category_id", onDelete: "CASCADE" });
File.belongsTo(Category, { foreignKey: "category_id", as: "category", onDelete: "CASCADE" });

// 🔥 `File` - `Subcategory` 관계 추가
Subcategory.hasMany(File, { foreignKey: "subcategory_id", onDelete: "CASCADE" });
File.belongsTo(Subcategory, { foreignKey: "subcategory_id", as: "subcategory", onDelete: "CASCADE" });

// 🔥 `File` - `Description` 관계 추가
File.hasOne(Description, { foreignKey: "file_id", as: "descriptionDetails", onDelete: "CASCADE" });
Description.belongsTo(File, { foreignKey: "file_id", as: "descriptionDetails", onDelete: "CASCADE" });

// ✅ 모든 모델 export
export { sequelize, Category, Subcategory, File, Description, Post };
