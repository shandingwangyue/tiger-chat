#!/usr/bin/env node
const { initializeDatabase } = require('../config/database');

async function initDatabase() {
  console.log('🚀 开始初始化数据库...');
  try {
    await initializeDatabase();
    console.log('✅ 数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();
