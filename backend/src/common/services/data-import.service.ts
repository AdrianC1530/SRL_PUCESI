import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationType, ReservationStatus } from '@prisma/client';

@Injectable()
export class DataImportService {
    constructor(private prisma: PrismaService) { }

    async importData() {
        await this.importRooms();
        await this.importSchools();
        await this.importSchedules();
    }

    private async importSchools() {
        const filePath = path.join(process.cwd(), 'Recursos/schools.json');
        console.log('Reading schools from:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('schools.json not found');
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const schools = JSON.parse(rawData);

        for (const school of schools) {
            await this.prisma.school.upsert({
                where: { id: school.id },
                update: {
                    name: school.name,
                    colorHex: school.color_hex
                },
                create: {
                    id: school.id,
                    name: school.name,
                    colorHex: school.color_hex
                }
            });
        }
        console.log(`Imported ${schools.length} schools.`);
    }

    private async importRooms() {
        const filePath = path.join(process.cwd(), 'Recursos/rooms.json');
        console.log('Reading rooms from:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('rooms.json not found');
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const rooms = JSON.parse(rawData);

        for (const room of rooms) {
            await this.prisma.lab.upsert({
                where: { name: room.name.toUpperCase() },
                update: {
                    capacity: room.capacity,
                    description: room.note || ''
                },
                create: {
                    name: room.name.toUpperCase(),
                    capacity: room.capacity,
                    description: room.note || ''
                },
            });

            // Special handling for permanently occupied rooms
            if (room.name.toUpperCase() === 'SALA 1' ||
                (room.note && (room.note.includes('Préstamo de Internet Permanente') || room.note.includes('Uso Permanente Idiomas')))) {

                console.log(`Processing permanent reservation for ${room.name}`);
                const semesterStart = new Date('2025-09-01');
                const semesterEnd = new Date('2026-01-31');

                const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
                if (admin) {
                    const lab = await this.prisma.lab.findUnique({ where: { name: room.name.toUpperCase() } });
                    if (lab) {
                        // Check if permanent reservation already exists
                        const existing = await this.prisma.reservation.findFirst({
                            where: {
                                labId: lab.id,
                                type: ReservationType.EVENT,
                                status: ReservationStatus.OCCUPIED,
                                description: 'Reservado permanentemente'
                            }
                        });

                        if (!existing) {
                            console.log(`Creating permanent reservation for ${room.name}`);
                            await this.prisma.reservation.create({
                                data: {
                                    startTime: semesterStart,
                                    endTime: semesterEnd,
                                    subject: room.note || 'Uso Administrativo/Permanente',
                                    description: 'Reservado permanentemente',
                                    type: ReservationType.EVENT,
                                    status: ReservationStatus.OCCUPIED,
                                    userId: admin.id,
                                    labId: lab.id,
                                    schoolId: 'COM' // Default to Common/Administrative
                                }
                            });
                        } else {
                            // Update existing permanent reservation with schoolId if missing
                            if (!existing.schoolId) {
                                console.log(`Updating permanent reservation school for ${room.name}`);
                                await this.prisma.reservation.update({
                                    where: { id: existing.id },
                                    data: { schoolId: 'COM' }
                                });
                            }
                        }
                    }
                } else {
                    console.error('Admin not found for permanent reservation');
                }
            }
        }
        console.log(`Imported ${rooms.length} rooms.`);
    }

    private async importSchedules() {
        const filePath = path.join(process.cwd(), 'Recursos/Recurring_Schedules.json');
        console.log('Reading schedules from:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('Recurring_Schedules not found');
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const schedules = JSON.parse(rawData);

        // Semester Dates
        const semesterStart = new Date('2025-09-01');
        const semesterEnd = new Date('2026-01-31');

        const dayMap: { [key: string]: number } = {
            'LUNES': 1, 'MARTES': 2, 'MIÉRCOLES': 3, 'MIERCOLES': 3,
            'JUEVES': 4, 'VIERNES': 5, 'SÁBADO': 6, 'SABADO': 6, 'DOMINGO': 0
        };

        const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) {
            console.error('Admin user not found for reservation assignment');
            return;
        }

        let count = 0;
        let updatedCount = 0;
        for (const item of schedules) {
            if (!item.day || !item.room || !item.time_start || !item.time_end) continue;

            const targetDay = dayMap[item.day.toUpperCase()];
            if (targetDay === undefined) continue;

            const lab = await this.prisma.lab.findUnique({ where: { name: item.room.toUpperCase() } });
            if (!lab) {
                console.warn(`Lab ${item.room} not found for schedule item: ${item.subject}`);
                continue;
            }

            const [startHour, startMinute] = item.time_start.split(':').map(Number);
            const [endHour, endMinute] = item.time_end.split(':').map(Number);

            let currentDate = new Date(semesterStart);
            while (currentDate <= semesterEnd) {
                if (currentDate.getDay() === targetDay) {
                    const start = new Date(currentDate);
                    start.setHours(startHour, startMinute, 0, 0);

                    const end = new Date(currentDate);
                    end.setHours(endHour, endMinute, 0, 0);

                    // Determine School ID
                    let schoolId = item.school_id;

                    // User Request: "las de ti van en ingenieria"
                    // Override TSO (Tecnología Software) to ING (Ingeniería)
                    if (schoolId === 'TSO') {
                        schoolId = 'ING';
                    }

                    // Fallback logic for missing school_id
                    if (!schoolId) {
                        const subjectUpper = item.subject.toUpperCase();

                        // Use regex for stricter TI matching
                        const tiRegex = /\bTI\b|TI-|TECNOLOG[IÍ]A/;

                        if (tiRegex.test(subjectUpper) || subjectUpper.includes('SOFTWARE') || subjectUpper.includes('PROGRAMACION') || subjectUpper.includes('BASE DE DATOS') || subjectUpper.includes('WEB')) {
                            schoolId = 'ING';
                        } else if (subjectUpper.includes('CONTABILIDAD') || subjectUpper.includes('ADMINISTRACION') || subjectUpper.includes('FINANZAS') || subjectUpper.includes('EMPRESA') || subjectUpper.includes('MARKETING') || subjectUpper.includes('GESTION') || subjectUpper.includes('ECONOMIA')) {
                            schoolId = 'GES';
                        } else if (subjectUpper.includes('DERECHO') || subjectUpper.includes('LEGAL')) {
                            schoolId = 'JUR';
                        } else if (subjectUpper.includes('INGLES') || subjectUpper.includes('FRANCES') || subjectUpper.includes('IDIOMA') || subjectUpper.includes('PHONETICS')) {
                            schoolId = 'IDI';
                        } else if (subjectUpper.includes('ARQUITECTURA') || subjectUpper.includes('URBANISMO')) {
                            schoolId = 'ARQ';
                        } else if (subjectUpper.includes('DISEÑO') || subjectUpper.includes('CULTURAS VISUALES')) {
                            schoolId = 'DIS';
                        } else if (subjectUpper.includes('ENFERMERIA') || subjectUpper.includes('SALUD') || subjectUpper.includes('MEDICINA') || subjectUpper.includes('BIOESTADÍSTICA') || subjectUpper.includes('GENÉTICA')) {
                            schoolId = 'SAL';
                        } else if (subjectUpper.includes('USO ADMINISTRATIVO') || subjectUpper.includes('PERMANENTE')) {
                            schoolId = 'COM';
                        } else {
                            // Default to COM (Tronco Común) if no match found
                            schoolId = 'COM';
                        }
                    }

                    // Check collision
                    const existing = await this.prisma.reservation.findFirst({
                        where: {
                            labId: lab.id,
                            startTime: start,
                            status: { not: 'CANCELLED' }
                        }
                    });

                    if (!existing) {
                        await this.prisma.reservation.create({
                            data: {
                                startTime: start,
                                endTime: end,
                                subject: item.subject,
                                description: `Profesor: ${item.professor}`,
                                type: ReservationType.CLASS,
                                status: ReservationStatus.CONFIRMED,
                                userId: admin.id,
                                labId: lab.id,
                                schoolId: schoolId
                            }
                        });
                        count++;
                    } else {
                        // Update schoolId and description (Professor) for existing reservations
                        await this.prisma.reservation.update({
                            where: { id: existing.id },
                            data: {
                                schoolId: schoolId,
                                description: `Profesor: ${item.professor}`
                            }
                        });
                        updatedCount++;
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        console.log(`Imported ${count} new, updated ${updatedCount} existing reservations.`);
    }
}
