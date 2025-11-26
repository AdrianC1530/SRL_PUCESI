import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationType, ReservationStatus } from '@prisma/client';

@Injectable()
export class ExcelService {
    constructor(private prisma: PrismaService) { }

    async importSchedule() {
        const filePath = path.join(process.cwd(), 'Recursos/PRUEBA-HORARIO SEPT 2025 - ENERO 2026.xlsx');
        console.log('Reading file from:', filePath);

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['HORARIOS'];
        if (!sheet) {
            console.error('Sheet HORARIOS not found');
            throw new Error('Sheet HORARIOS not found');
        }

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
        console.log('Sheet loaded, rows:', data.length);

        // Semester Dates
        const semesterStart = new Date('2025-09-01');
        const semesterEnd = new Date('2026-01-31');

        // 1. Identify Labs from Header
        // Scan first 10 rows to find the one with "SALA"
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (row && row.some(cell => String(cell).includes('SALA'))) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            console.error('Could not find header row with SALA');
            return;
        }
        console.log('Header found at row:', headerRowIndex);

        const headerRow = data[headerRowIndex];
        const labMap = new Map<number, number>(); // Column Index -> Lab ID

        for (let col = 1; col < headerRow.length; col++) {
            const cellValue = headerRow[col];
            if (cellValue && typeof cellValue === 'string' && cellValue.includes('SALA')) {
                const nameMatch = cellValue.match(/(SALA\s+\d+|SALA\s+MAC)/i);
                const capacityMatch = cellValue.match(/\((\d+)\)/);

                if (nameMatch) {
                    const name = nameMatch[0].toUpperCase();
                    const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 20;

                    const lab = await this.prisma.lab.upsert({
                        where: { name },
                        update: { capacity },
                        create: { name, capacity, description: 'Imported from Excel' },
                    });
                    labMap.set(col, lab.id);
                }
            }
        }
        console.log('Labs identified:', labMap.size);

        // 2. Parse Schedule
        let currentDay = '';
        const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'SABADO'];

        for (let row = headerRowIndex + 1; row < data.length; row++) {
            const timeCell = data[row][0];

            if (timeCell) {
                const upperTime = String(timeCell).toUpperCase();
                const foundDay = days.find(d => upperTime.includes(d));
                if (foundDay) {
                    currentDay = foundDay === 'MIERCOLES' ? 'MIÉRCOLES' : (foundDay === 'SABADO' ? 'SÁBADO' : foundDay);
                    console.log('Processing Day:', currentDay);
                    continue;
                }
            }

            const timeMatch = String(timeCell).match(/(\d{1,2}):00\s*-\s*(\d{1,2}):00/);
            if (timeMatch && currentDay) {
                const startHour = parseInt(timeMatch[1]);
                const endHour = parseInt(timeMatch[2]);

                for (let col = 1; col < data[row].length; col++) {
                    const cellContent = data[row][col];
                    const labId = labMap.get(col);

                    if (labId && cellContent && String(cellContent).trim().length > 2) {
                        await this.processReservationCell(
                            cellContent,
                            labId,
                            currentDay,
                            startHour,
                            endHour,
                            semesterStart,
                            semesterEnd
                        );
                    }
                }
            }
        }
        console.log('Import completed');
    }

    private async processReservationCell(
        content: string,
        labId: number,
        dayName: string,
        startHour: number,
        endHour: number,
        semStart: Date,
        semEnd: Date
    ) {
        const dateMatch = content.match(/(\d{1,2})\s+(?:DE\s+)?(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)/i);

        if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const monthStr = dateMatch[2].toUpperCase();
            const months = { 'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11 };
            const month = months[monthStr];

            let year = semStart.getFullYear();
            if (month < 8) year++;

            const specificDate = new Date(year, month, day, startHour, 0, 0);
            const specificEndDate = new Date(year, month, day, endHour, 0, 0);

            await this.createReservation(labId, specificDate, specificEndDate, content, ReservationType.EVENT);

        } else {
            const dayMap = { 'LUNES': 1, 'MARTES': 2, 'MIÉRCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SÁBADO': 6, 'DOMINGO': 0 };
            const targetDay = dayMap[dayName];

            let currentDate = new Date(semStart);
            while (currentDate <= semEnd) {
                if (currentDate.getDay() === targetDay) {
                    const start = new Date(currentDate);
                    start.setHours(startHour, 0, 0);

                    const end = new Date(currentDate);
                    end.setHours(endHour, 0, 0);

                    await this.createReservation(labId, start, end, content, ReservationType.CLASS);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }

    private async createReservation(
        labId: number,
        start: Date,
        end: Date,
        subject: string,
        type: ReservationType
    ) {
        const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) return;

        const existing = await this.prisma.reservation.findFirst({
            where: {
                labId,
                startTime: start,
                status: { not: 'CANCELLED' }
            }
        });

        if (!existing) {
            await this.prisma.reservation.create({
                data: {
                    startTime: start,
                    endTime: end,
                    subject: subject.substring(0, 100),
                    description: subject,
                    type,
                    status: ReservationStatus.CONFIRMED,
                    userId: admin.id,
                    labId
                }
            });
        }
    }
}
