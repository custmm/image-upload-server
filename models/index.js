// src/models/index.js
import fs       from 'fs';
import path     from 'path';
import { Sequelize } from 'sequelize';
import process  from 'process';
import { fileURLToPath } from 'url';
// JSON import (Node 17+), package.json에 "type":"module" 필요
import configJson from '../config/config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const basename   = path.basename(__filename);
const env        = process.env.NODE_ENV || 'development';
const config     = configJson[env];

const db = {};

// Sequelize 인스턴스 생성
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// 디렉터리 내 모델 파일 동적 로드
const files = fs.readdirSync(__dirname).filter(file =>
  file.indexOf('.') !== 0 &&
  file !== basename &&
  file.slice(-3) === '.js' &&
  file.indexOf('.test.js') === -1
);

for (const file of files) {
  const modulePath = path.join(__dirname, file);
  // top-level await 사용 (Node.js 14+)
  const { default: defineModel } = await import(modulePath);
  const model = defineModel(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// associate 메서드 호출
for (const modelName of Object.keys(db)) {
  if (typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
