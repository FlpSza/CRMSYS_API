const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    const users = await prisma.user.findMany();
    console.log('👥 Usuários:', users.length);
    
    const companies = await prisma.company.findMany();
    console.log('🏢 Empresas:', companies.length);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();