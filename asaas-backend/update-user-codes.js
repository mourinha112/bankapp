require('dotenv').config();
const database = require('./src/database');

// Função para gerar código único (igual à do server.js)
async function generateUniqueUserCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    try {
      const existingUser = await database.getUserByCode(code);
      if (!existingUser) {
        isUnique = true;
      }
    } catch (error) {
      isUnique = true;
    }
  }
  
  return code;
}

async function updateExistingUsers() {
  try {
    console.log('🔄 Conectando ao banco...');
    await database.connectDB();
    
    // Buscar todos os usuários que não têm código
    const mysql = require('mysql2/promise');
    
    // Usar conexão direta para consulta raw
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bankapp',
      port: process.env.DB_PORT || 3306
    });
    
    const [users] = await db.execute('SELECT * FROM users WHERE user_code IS NULL OR user_code = ""');
    
    console.log(`👥 Encontrados ${users.length} usuários sem código`);
    
    for (const user of users) {
      const newCode = await generateUniqueUserCode();
      
      await db.execute(
        'UPDATE users SET user_code = ? WHERE id = ?',
        [newCode, user.id]
      );
      
      console.log(`✅ Código ${newCode} atribuído ao usuário ${user.username} (${user.email})`);
    }
    
    console.log('🎉 Todos os usuários agora têm códigos únicos!');
    
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updateExistingUsers();