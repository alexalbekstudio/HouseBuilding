import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const legalPhases = [
  {
    orderIndex: 1,
    title: 'Provera parcele i identiteta',
    subtitle: 'Katastarska parcela, vlasništvo, tereti, pristupni put.',
    budgetPlan: 30000
  },
  {
    orderIndex: 2,
    title: 'Planska pravila',
    subtitle: 'Namena, indeks zauzetosti i izgrađenosti, gabariti, spratnost.',
    budgetPlan: 25000
  },
  {
    orderIndex: 3,
    title: 'Geodetski i geotehnički podaci',
    subtitle: 'Geodetski snimak i geotehnički elaborat tla.',
    budgetPlan: 70000
  },
  {
    orderIndex: 4,
    title: 'Idejno rešenje (IDR)',
    subtitle: 'Idejno rešenje montažne kuće usklađeno sa parcelom.',
    budgetPlan: 120000
  },
  {
    orderIndex: 5,
    title: 'Lokacijski uslovi',
    subtitle: 'Urbanistički, tehnički i komunalni uslovi. Preduslov za glavni projekat.',
    budgetPlan: 45000
  },
  {
    orderIndex: 6,
    title: 'Projekat i građevinska dozvola (PGD)',
    subtitle: 'Glavni projekat i dobijanje građevinske dozvole.',
    budgetPlan: 250000
  },
  {
    orderIndex: 7,
    title: 'Prijava radova i gradnja',
    subtitle: 'Prijava radova najmanje 8 dana pre početka. Izjave posle temelja i konstrukcije.',
    budgetPlan: 3500000
  },
  {
    orderIndex: 8,
    title: 'Tehnički pregled i upotrebna dozvola',
    subtitle: 'Finalni pregled, upotrebna dozvola i uknjižba.',
    budgetPlan: 80000
  }
];

async function main() {
  console.log('Kreiranje podrazumevanog projekta i pravnih faza...');

  // 1. Kreiranje primarnog projekta sa koordinatama Melenaca za mapu
  const project = await prisma.project.create({
    data: {
      name: 'Montažna kuća — Melenci',
      location: 'Melenci, Zrenjanin',
      latitude: 45.5167,
      longitude: 20.3167,
      totalBudget: 4120000
    }
  });

  // 2. Kreiranje 8 faza vezanih za ovaj projekat
  for (const p of legalPhases) {
    await prisma.phase.create({
      data: {
        ...p,
        projectId: project.id
      }
    });
  }

  console.log(`Projekat #${project.id} (${project.name}) i 8 faza uspešno upisani!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });