const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Iniciando seed dos dados...');

    // Criar usuários
    const user1 = await prisma.user.create({
      data: {
        name: "João Silva",
        email: "joao@empresa.com"
      }
    });

    const user2 = await prisma.user.create({
      data: {
        name: "Maria Santos",
        email: "maria@empresa.com"
      }
    });

    console.log('✅ Usuários criados');

    // Criar empresas
    const company1 = await prisma.company.create({
      data: {
        name: "TechCorp Ltda",
        cnpj: "12.345.678/0001-90",
        industry: "Tecnologia",
        size: "MEDIUM",
        website: "https://techcorp.com"
      }
    });

    const company2 = await prisma.company.create({
      data: {
        name: "Inovação SA",
        cnpj: "98.765.432/0001-10",
        industry: "Consultoria",
        size: "LARGE",
        website: "https://inovacao.com"
      }
    });

    const company3 = await prisma.company.create({
      data: {
        name: "StartUp XYZ",
        cnpj: "11.222.333/0001-44",
        industry: "Fintech",
        size: "STARTUP",
        website: "https://startupxyz.com"
      }
    });

    console.log('✅ Empresas criadas');

    // Criar contatos
    const contact1 = await prisma.contact.create({
      data: {
        companyId: company1.id,
        name: "Carlos Mendes",
        email: "carlos@techcorp.com",
        phone: "(11) 99999-9999",
        position: "CEO",
        notes: "Interessado em soluções de CRM"
      }
    });

    const contact2 = await prisma.contact.create({
      data: {
        companyId: company2.id,
        name: "Ana Lima",
        email: "ana@inovacao.com",
        phone: "(11) 88888-8888",
        position: "Gerente de Vendas",
        notes: "Cliente potencial para consultoria"
      }
    });

    const contact3 = await prisma.contact.create({
      data: {
        companyId: company3.id,
        name: "Pedro Costa",
        email: "pedro@startupxyz.com",
        phone: "(11) 77777-7777",
        position: "CTO",
        notes: "Startup em crescimento rápido"
      }
    });

    console.log('✅ Contatos criados');

    // Criar leads
    const lead1 = await prisma.lead.create({
      data: {
        contactId: contact1.id,
        source: "Website",
        status: "QUALIFIED",
        score: 85,
        assignedTo: user1.id
      }
    });

    const lead2 = await prisma.lead.create({
      data: {
        contactId: contact2.id,
        source: "Indicação",
        status: "CONTACTED",
        score: 70,
        assignedTo: user2.id
      }
    });

    const lead3 = await prisma.lead.create({
      data: {
        contactId: contact3.id,
        source: "LinkedIn",
        status: "NEW",
        score: 60,
        assignedTo: user1.id
      }
    });

    console.log('✅ Leads criados');

    // Criar deals
    const deal1 = await prisma.deal.create({
      data: {
        contactId: contact1.id,
        title: "Implementação CRM TechCorp",
        value: 25000.00,
        stage: "PROPOSAL",
        probability: 75,
        expectedCloseDate: new Date('2025-02-15'),
        assignedTo: user1.id,
        notes: "Proposta enviada, aguardando resposta"
      }
    });

    const deal2 = await prisma.deal.create({
      data: {
        contactId: contact2.id,
        title: "Consultoria Inovação SA",
        value: 15000.00,
        stage: "QUALIFICATION",
        probability: 50,
        expectedCloseDate: new Date('2025-02-28'),
        assignedTo: user2.id,
        notes: "Reunião de qualificação agendada"
      }
    });

    const deal3 = await prisma.deal.create({
      data: {
        contactId: contact3.id,
        title: "Sistema StartUp XYZ",
        value: 8500.00,
        stage: "PROSPECTING",
        probability: 25,
        expectedCloseDate: new Date('2025-03-10'),
        assignedTo: user1.id,
        notes: "Primeiro contato realizado"
      }
    });

    console.log('✅ Deals criados');

    // Criar atividades
    await prisma.activity.create({
      data: {
        dealId: deal1.id,
        contactId: contact1.id,
        userId: user1.id,
        type: "EMAIL",
        title: "Proposta enviada",
        description: "Enviada proposta comercial para TechCorp",
        dueDate: new Date(),
        completed: true
      }
    });

    await prisma.activity.create({
      data: {
        dealId: deal2.id,
        contactId: contact2.id,
        userId: user2.id,
        type: "MEETING",
        title: "Reunião de qualificação",
        description: "Reunião para entender necessidades da Inovação SA",
        dueDate: new Date('2025-01-30'),
        completed: false
      }
    });

    await prisma.activity.create({
      data: {
        dealId: deal3.id,
        contactId: contact3.id,
        userId: user1.id,
        type: "CALL",
        title: "Ligação inicial",
        description: "Primeira ligação para apresentar soluções",
        dueDate: new Date('2025-01-28'),
        completed: false
      }
    });

    console.log('✅ Atividades criadas');

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log('- 2 usuários');
    console.log('- 3 empresas');
    console.log('- 3 contatos');
    console.log('- 3 leads');
    console.log('- 3 deals');
    console.log('- 3 atividades');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
