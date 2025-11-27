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
        await this.importSchedules();
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
        }
        console.log(`Imported ${rooms.length} rooms.`);
    }

    private async importSchedules() {
        const filePath = path.join(process.cwd(), 'Recursos/Recurring_Schedules');
        console.log('Reading schedules from:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error('Recurring_Schedules not found');
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const schedules = JSON.parse(rawData);

        // Semester Dates (Hardcoded for now as per previous logic, or could be dynamic)
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
                                labId: lab.id
                            }
                        });
                        count++;
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        console.log(`Imported ${count} recurring reservations.`);
    }
}
