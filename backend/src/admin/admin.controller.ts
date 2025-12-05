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
            // Helper to extract professor name
            const getProfessorName = (res: any) => {
                if (!res) return null;
                if (res.description && res.description.startsWith('Profesor: ')) {
                    return res.description.replace('Profesor: ', '');
                }
                return res.user?.fullName || 'Usuario Desconocido';
            };

            // 1. Check for overdue reservations (Key not returned after class ended)
            const overdueReservationRaw = await this.prisma.reservation.findFirst({
                where: {
                    labId: lab.id,
                    status: ReservationStatus.OCCUPIED,
                    endTime: { lt: now }
                },
                include: {
                    user: { select: { fullName: true } },
                    school: { select: { colorHex: true, name: true } }
                }
            });
            const overdueReservation = overdueReservationRaw ? {
                ...overdueReservationRaw,
                professorName: getProfessorName(overdueReservationRaw)
            } : null;

            // 2. Find current reservation (happening right now)
            const currentReservationRaw = await this.prisma.reservation.findFirst({
                where: {
                    labId: lab.id,
                    startTime: { lte: now },
                    endTime: { gte: now },
                    status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.OCCUPIED] }
                },
                include: {
                    user: { select: { fullName: true } },
                    school: { select: { colorHex: true, name: true } }
                }
            });
            const currentReservation = currentReservationRaw ? {
                ...currentReservationRaw,
                professorName: getProfessorName(currentReservationRaw)
            } : null;

            // 3. Find next reservation
            const nextReservationRaw = await this.prisma.reservation.findFirst({
                where: {
                    labId: lab.id,
                    startTime: { gt: now },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { startTime: 'asc' },
                include: {
                    user: { select: { fullName: true } },
                    school: { select: { colorHex: true, name: true } }
                }
            });
            const nextReservation = nextReservationRaw ? {
                ...nextReservationRaw,
                professorName: getProfessorName(nextReservationRaw)
            } : null;

            let status = 'FREE';
            if (overdueReservation) {
                status = 'OVERDUE';
            } else if (currentReservation) {
                status = (currentReservation.status === 'OCCUPIED' || currentReservation.checkInTime) ? 'OCCUPIED' : 'RESERVED';
            }

            return {
                lab,
                status,
                overdueReservation,
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

        const reservations = await this.prisma.reservation.findMany({
            where: {
                labId: parseInt(labId),
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                user: {
                    select: { fullName: true }
                },
                school: {
                    select: { colorHex: true, name: true }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return reservations;
    }

    @Get('general-schedule')
    async getGeneralSchedule(@Query('date') dateString?: string) {
        const now = dateString ? new Date(dateString) : new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all labs first to ensure we have a row for every lab
        let labs = await this.prisma.lab.findMany();

        // Custom sort (same as dashboard)
        labs = labs.sort((a, b) => {
            const getNumber = (name: string) => {
                if (name.includes('MAC')) return 999;
                const match = name.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };
            return getNumber(a.name) - getNumber(b.name);
        });

        // Get all reservations for the day
        const reservations = await this.prisma.reservation.findMany({
            where: {
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CANCELLED' }
            },
            include: {
                user: { select: { fullName: true } },
                school: { select: { colorHex: true, name: true } },
                lab: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Helper to extract professor name (same as in dashboard)
        const getProfessorName = (res: any) => {
            if (!res) return null;
            if (res.description && res.description.startsWith('Profesor: ')) {
                return res.description.replace('Profesor: ', '');
            }
            return res.user?.fullName || 'Usuario Desconocido';
        };

        // Group reservations by lab
        const scheduleByLab = labs.map(lab => {
            const labReservations = reservations
                .filter(r => r.labId === lab.id)
                .map(r => ({
                    ...r,
                    professorName: getProfessorName(r)
                }));
            return {
                lab,
                reservations: labReservations
            };
        });

        return scheduleByLab;
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

    @Get('schools')
    async getSchools() {
        return this.prisma.school.findMany({
            orderBy: { name: 'asc' }
        });
    }

    @Get('subjects/:schoolId')
    async getSubjectsBySchool(@Param('schoolId') schoolId: string) {
        const subjects = await this.prisma.reservation.findMany({
            where: {
                schoolId: schoolId
            },
            select: {
                subject: true
            },
            distinct: ['subject'],
            orderBy: {
                subject: 'asc'
            }
        });
        return subjects.map(s => s.subject);
    }

    @Get('search-labs')
    async searchLabs(
        @Query('date') date: string,
        @Query('startTime') startTime: string,
        @Query('duration') duration: string,
        @Query('capacity') capacity: string,
        @Query('software') software?: string
    ) {
        const start = new Date(`${date}T${startTime}:00`);
        const durationHours = parseInt(duration);
        const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
        const requiredCapacity = parseInt(capacity);

        // 1. Find candidate labs based on capacity
        let candidateLabs = await this.prisma.lab.findMany({
            where: {
                capacity: { gte: requiredCapacity }
            }
        });

        // 2. Filter by software if requested
        if (software) {
            candidateLabs = candidateLabs.filter(lab =>
                lab.software && lab.software.includes(software)
            );
        }

        // 3. Filter out labs that are occupied
        const availableLabs: any[] = [];
        for (const lab of candidateLabs) {
            const conflicts = await this.prisma.reservation.count({
                where: {
                    labId: lab.id,
                    status: { not: 'CANCELLED' },
                    startTime: { lt: end },
                    endTime: { gt: start }
                }
            });

            if (conflicts === 0) {
                availableLabs.push(lab);
            }
        }

        return availableLabs;
    }
}
