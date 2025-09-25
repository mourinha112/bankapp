const database = require('./src/database');

async function migrateUserCodes() {
  try {
    console.log('🔄 Iniciando migração de códigos de usuário...');
    
    // Conectar ao banco
    await database.connectDB();
    const db = await database.connectDB();
    
    // Buscar todos os usuários
    const query = 'SELECT id, username, user_code FROM users';
    
    const [users] = await db.execute(query);
    
    console.log(`📊 Encontrados ${users.length} usuários para migrar`);
    
    // Atualizar cada usuário
    for (const user of users) {
      const updateQuery = 'UPDATE users SET user_code = ? WHERE id = ?';
      
      await db.execute(updateQuery, [user.username, user.id]);
      
      console.log(`✅ Usuário ${user.username}: código atualizado de "${user.user_code}" para "${user.username}"`);
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
    // Verificar resultados
    console.log('\n📋 Verificando resultados:');
    const verifyQuery = 'SELECT username, user_code FROM users';
    const [updatedUsers] = await db.execute(verifyQuery);
    
    updatedUsers.forEach(user => {
      console.log(`👤 ${user.username} -> Código: ${user.user_code}`);
    });
    
    // Fechar conexão
    await db.end();
    console.log('\n✅ Migração finalizada!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrateUserCodes();