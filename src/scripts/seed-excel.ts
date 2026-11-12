import { seedDatabaseFromExcel } from '../lib/excel-importer';
import { prisma } from '../lib/prisma';
import path from 'path';

async function main() {
  console.log('--- Starting Excel Data Seeding ---');
  const excelPath = path.resolve(process.cwd(), 'Videos_links.xlsx');
  const result = await seedDatabaseFromExcel(excelPath);
  console.log(
    `--- Seeded ${result.categoriesCount} categories, ${result.lessonsCount} lessons, and ${result.videosCount} videos successfully! ---`
  );
}

main()
  .catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
