import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 10);

    // Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@puces.edu.ec' },
        update: {},
        create: {
            email: 'admin@puces.edu.ec',
            fullName: 'Admin User',
            password,
            role: Role.ADMIN,
        },
    });

    // Professor User
    const professor = await prisma.user.upsert({
        where: { email: 'profesor@puces.edu.ec' },
        update: {},
        create: {
            email: 'profesor@puces.edu.ec',
            fullName: 'Profesor Prueba',
            password,
            role: Role.PROFESOR,
        },
    });

    // Import Rooms from JSON
    const roomsPath = path.join(__dirname, '../Recursos/rooms.json');
    const softwarePath = path.join(__dirname, '../Recursos/SPECIALIZED_SOFTWARE_INVENTORY.json');

    if (fs.existsSync(roomsPath) && fs.existsSync(softwarePath)) {
        const roomsData = JSON.parse(fs.readFileSync(roomsPath, 'utf-8'));
        const softwareData = JSON.parse(fs.readFileSync(softwarePath, 'utf-8'));

        console.log(`Seeding ${roomsData.length} rooms...`);

        // 1. Seed Software Catalog
        const allSoftware = new Set<string>();
        softwareData.salas.forEach((sala: any) => {
            if (sala.software) {
                sala.software.forEach((s: string) => allSoftware.add(s));
            }
        });

        console.log(`Seeding ${allSoftware.size} software items...`);
        for (const softwareName of allSoftware) {
            await prisma.software.upsert({
                where: { name: softwareName },
                update: {},
                create: { name: softwareName }
            });
        }

        // 2. Seed Labs with Software
        for (const room of roomsData) {
            const isPermanent = room.note && room.note.toLowerCase().includes('permanente') ? true : false;

            // Find software for this room
            // Handle "SALA 1" vs "1" matching
            let roomSoftware: string[] = [];
            const roomNumMatch = room.name.match(/\d+/);
            const roomNum = roomNumMatch ? parseInt(roomNumMatch[0]) : (room.name.includes('MAC') ? 'MAC' : null);

            if (roomNum) {
                const softwareEntry = softwareData.salas.find((s: any) => s.numero == roomNum);
                if (softwareEntry) {
                    roomSoftware = softwareEntry.software;
                }
            }

            await prisma.lab.upsert({
                where: { name: room.name.toUpperCase() },
                update: {
                    capacity: room.capacity,
                    description: room.note || '',
                    isPermanent: isPermanent,
                    software: roomSoftware
                },
                create: {
                    name: room.name.toUpperCase(),
                    capacity: room.capacity,
                    description: room.note || '',
                    isPermanent: isPermanent,
                    software: roomSoftware
                },
            });
        }
    } else {
        console.warn('rooms.json or SPECIALIZED_SOFTWARE_INVENTORY.json not found, skipping rooms seed.');
    }

    // Seed Schools
    const schoolsPath = path.join(__dirname, '../Recursos/schools.json');
    if (fs.existsSync(schoolsPath)) {
        const schoolsData = JSON.parse(fs.readFileSync(schoolsPath, 'utf-8'));
        console.log(`Seeding ${schoolsData.length} schools...`);
        for (const school of schoolsData) {
            await prisma.school.upsert({
                where: { id: school.id },
                update: {
                    name: school.name,
                    colorHex: school.color_hex,
                },
                create: {
                    id: school.id,
                    name: school.name,
                    colorHex: school.color_hex,
                },
            });
        }
    } else {
        console.warn('schools.json not found, skipping schools seed.');
    }

    // Seed Teachers from Schedules
    const schedulesPath = path.join(__dirname, '../Recursos/Recurring_Schedules.json');
    if (fs.existsSync(schedulesPath)) {
        const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));
        console.log(`Seeding teachers from schedules...`);

        const teachersMap = new Map<string, string>(); // name -> schoolId

        for (const schedule of schedulesData) {
            if (schedule.professor && schedule.professor !== 'N/A' && schedule.school_id) {
                teachersMap.set(schedule.professor, schedule.school_id);
            }
        }

        for (const [name, schoolId] of teachersMap) {
            const schoolExists = await prisma.school.findUnique({ where: { id: schoolId } });
            if (schoolExists) {
                const existingTeacher = await prisma.teacher.findFirst({ where: { name } });
                if (!existingTeacher) {
                    await prisma.teacher.create({
                        data: {
                            name,
                            schoolId
                        }
                    });
                }
            }
        }
    } else {
        console.warn('Recurring_Schedules.json not found, skipping teachers seed.');
    }

    console.log({ admin, professor });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
