
import { PrismaClient } from '@prisma/client';
import { DataImportService } from './src/common/services/data-import.service';
import { PrismaService } from './src/prisma/prisma.service';

async function run() {
    const prisma = new PrismaClient();
    // We can cast PrismaClient to PrismaService as they are compatible for this usage
    const dataImportService = new DataImportService(prisma as unknown as PrismaService);

    console.log('Starting direct import...');
    await dataImportService.importData();
    console.log('Import finished.');

    await prisma.$disconnect();
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
