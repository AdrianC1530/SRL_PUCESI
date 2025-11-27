import { Controller, Post, Get, UseGuards, Param, Patch } from '@nestjs/common';
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
    async getDashboard() {
        // Get all labs
        const labs = await this.prisma.lab.findMany({
            orderBy: { name: 'asc' }
        });

        const now = new Date();

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
                status: currentReservation ? (currentReservation.checkInTime ? 'OCCUPIED' : 'RESERVED') : 'FREE',
                currentReservation,
                nextReservation
            };
        }));

        return dashboardData;
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
