
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchedule() {
    const labName = "SALA 8";
    const lab = await prisma.lab.findFirst({ where: { name: labName } });

    if (!lab) {
        console.log(`Lab ${labName} not found`);
        return;
    }

    // Check for tomorrow (Thursday, Nov 27, 2025)
    // Note: The user's current time is Nov 26, 2025 (Wednesday).
    // Let's check a date that definitely should have classes if the semester is Sept-Jan.
    const targetDate = new Date('2025-11-27T10:00:00.000Z'); // Thursday
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Checking schedule for ${labName} on ${startOfDay.toLocaleDateString()}`);

    const reservations = await prisma.reservation.findMany({
        where: {
            labId: lab.id,
            startTime: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        orderBy: { startTime: 'asc' },
        include: { user: true }
    });

    console.log(`Found ${reservations.length} reservations:`);
    reservations.forEach(r => {
        console.log(`- [${r.type}] ${r.startTime.toISOString()} - ${r.endTime.toISOString()}: ${r.subject} (${r.description})`);
    });
}

checkSchedule()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
