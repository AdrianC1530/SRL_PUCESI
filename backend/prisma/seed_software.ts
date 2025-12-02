import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const jsonPath = path.join(__dirname, '../Recursos/SPECIALIZED_SOFTWARE_INVENTORY.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);

    console.log('Seeding software data...');

    for (const sala of data.salas) {
        const labName = typeof sala.numero === 'number' ? `SALA ${sala.numero}` : `SALA ${sala.numero}`;

        // Check if lab exists
        const lab = await prisma.lab.findFirst({
            where: { name: labName },
        });

        if (lab) {
            await prisma.lab.update({
                where: { id: lab.id },
                data: {
                    software: sala.software,
                },
            });
            console.log(`Updated ${labName} with software: ${sala.software.join(', ')}`);
        } else {
            console.warn(`Lab ${labName} not found in database.`);
        }
    }

    console.log('Software seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
