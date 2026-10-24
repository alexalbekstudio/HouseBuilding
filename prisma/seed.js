import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialPhases = [
  { title: 'Dozvole i projektovanje', orderIndex: 1, budget: 3500 },
  { title: 'Zemljani radovi i temelj', orderIndex: 2, budget: 12000 },
  { title: 'Zidanje prizemlja i ploča', orderIndex: 3, budget: 15000 },
  { title: 'Krovna konstrukcija i pokrivanje', orderIndex: 4, budget: 9000 },
  { title: 'Spoljna stolarija (prozori i vrata)', orderIndex: 5, budget: 6000 },
  { title: 'Vodovod, kanalizacija i elektroinstalacije', orderIndex: 6, budget: 7500 },
  { title: 'Malterisanje i košuljice', orderIndex: 7, budget: 5000 },
  { title: 'Izolacija i fasada', orderIndex: 8, budget: 8000 },
  { title: 'Podovi, pločice i sanitarije', orderIndex: 9, budget: 6500 },
  { title: 'Gletovanje, krečenje i unutrašnja vrata', orderIndex: 10, budget: 4000 }
];

async function main() {
  console.log('Resetovanje i unos faza...');
  
  // Briše postojeće faze da nema dupliranja
  await prisma.expense.deleteMany();
  await prisma.phase.deleteMany();

  for (const phase of initialPhases) {
    await prisma.phase.create({
      data: phase,
    });
  }

  console.log('Faze uspešno sinhronizovane (10 faza ukupno).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });