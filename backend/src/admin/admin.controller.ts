import { Controller, Post, Get, UseGuards, Param, Patch, Query } from '@nestjs/common';
import { DataImportService } from '../common/services/data-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(
        private dataImportService: DataImportService,
        private prisma: PrismaService
    ) { }

    @Post('import-schedule')
    async importSchedule() {
        await this.dataImportService.importData();
        return { message: 'Data imported successfully from JSON' };
    }

    @Get('dashboard')
    async getDashboard(@Query('date') dateString?: string) {
        // Get all labs
        let labs = await this.prisma.lab.findMany();

        // Custom sort to handle "SALA 1", "SALA 2", "SALA 10" correctly
        labs = labs.sort((a, b) => {
            const getNumber = (name: string) => {
                if (name.includes('MAC')) return 999; // Put MAC at the end
                const match = name.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };
            return getNumber(a.name) - getNumber(b.name);
        });

        const now = dateString ? new Date(dateString) : new Date();
        console.log('Dashboard requested for:', now.toLocaleString());

        const dashboardData = await Promise.all(labs.map(async (lab) => {
            // Find current or next reservation
            const currentReservation = await this.prisma.reservation.findFirst({
                where: {
                    labId: lab.id,
                    startTime: { lte: now },
                    endTime: { gte: now },
                    status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.OCCUPIED] }
                }
            });

            const nextReservation = await this.prisma.reservation.findFirst({
                where: {
                    labId: lab.id,
                    startTime: { gt: now },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { startTime: 'asc' }
            });

            return {
                lab,
                status: currentReservation ?
                    ((currentReservation.status === 'OCCUPIED' || currentReservation.checkInTime) ? 'OCCUPIED' : 'RESERVED')
                    : 'FREE',
                currentReservation,
                nextReservation
            };
        }));

        return dashboardData;
    }

    @Get('schedule/:labId')
    async getLabSchedule(@Param('labId') labId: string, @Query('date') dateString?: string) {
        const now = dateString ? new Date(dateString) : new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.reservation.findMany({
            where: {
                labId: parseInt(labId),
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CANCELLED' }
            },
            orderBy: { startTime: 'asc' },
            include: {
                user: {
                    select: { fullName: true }
                }
            }
        });
    }

    @Patch('check-in/:id')
    async checkIn(@Param('id') id: string) {
        return this.prisma.reservation.update({
            where: { id: parseInt(id) },
            data: {
                status: ReservationStatus.OCCUPIED,
                checkInTime: new Date()
            }
        });
    }

    @Patch('check-out/:id')
    async checkOut(@Param('id') id: string) {
        return this.prisma.reservation.update({
            where: { id: parseInt(id) },
            data: {
                status: ReservationStatus.COMPLETED,
                checkOutTime: new Date()
            }
        });
    }
}
