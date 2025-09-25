require('dotenv').config();
const database = require('./src/database');

async function createFirstUser() {
  try {
    console.log('🔄 Conectando ao banco...');
    await database.connectDB();
    
    // Dados do primeiro usuário
    const firstUser = {
      id: 'user_admin_1',
      email: 'admin@bankapp.com',
      username: 'admin',
      password: 'admin123',
      fullName: 'Administrador do Sistema',
      cpf_cnpj: '00000000000',
      phone: '11999999999',
      asaas_customer_id: 'customer_admin_1',
      user_code: 'ADMIN1'
    };
    
    console.log('👤 Criando primeiro usuário:', firstUser.email);
    console.log('🔑 Código do usuário:', firstUser.user_code);
    
    await database.createUser(firstUser);
    
    console.log('✅ Primeiro usuário criado com sucesso!');
    console.log('📋 Dados para usar:');
    console.log('  Email: admin@bankapp.com');
    console.log('  Senha: admin123');
    console.log('  Código: ADMIN1');
    console.log('');
    console.log('🎯 Agora outros usuários podem se registrar usando o código: ADMIN1');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate entry')) {
      console.log('ℹ️ Usuário já existe!');
      console.log('🔑 Use o código: ADMIN1 para registrar novos usuários');
    } else {
      console.error('❌ Erro ao criar usuário:', error);
    }
    process.exit(1);
  }
}

createFirstUser();