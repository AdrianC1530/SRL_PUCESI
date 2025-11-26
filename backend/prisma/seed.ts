import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

    // Labs
    const lab1 = await prisma.lab.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Sala 1',
            capacity: 20,
            description: 'Laboratorio de Computación General',
        },
    });

    const lab2 = await prisma.lab.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Sala 2',
            capacity: 25,
            description: 'Laboratorio de Redes',
        },
    });

    console.log({ admin, professor, lab1, lab2 });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
