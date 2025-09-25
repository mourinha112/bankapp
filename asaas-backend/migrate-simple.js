const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bankapp'
});

console.log('🔄 Conectando ao banco e migrando códigos...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err);
    return;
  }
  
  console.log('✅ Conectado ao MySQL');
  
  // Buscar usuários
  connection.query('SELECT id, username, user_code FROM users', (err, users) => {
    if (err) {
      console.error('❌ Erro ao buscar usuários:', err);
      return;
    }
    
    console.log(`📊 Encontrados ${users.length} usuários para migrar`);
    
    let completed = 0;
    
    users.forEach((user, index) => {
      // Atualizar cada usuário
      connection.query(
        'UPDATE users SET user_code = ? WHERE id = ?',
        [user.username, user.id],
        (err, result) => {
          if (err) {
            console.error(`❌ Erro ao atualizar ${user.username}:`, err);
          } else {
            console.log(`✅ Usuário ${user.username}: código atualizado de "${user.user_code}" para "${user.username}"`);
          }
          
          completed++;
          
          // Se é o último usuário, verificar resultados
          if (completed === users.length) {
            console.log('\n🎉 Migração concluída! Verificando resultados...\n');
            
            connection.query('SELECT username, user_code FROM users', (err, updated) => {
              if (err) {
                console.error('❌ Erro ao verificar:', err);
              } else {
                updated.forEach(user => {
                  console.log(`👤 ${user.username} -> Código: ${user.user_code}`);
                });
              }
              
              connection.end();
              console.log('\n✅ Migração finalizada!');
            });
          }
        }
      );
    });
  });
});