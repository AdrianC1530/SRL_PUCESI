import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminController } from './admin/admin.controller';
import { DataImportService } from './common/services/data-import.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AppController, AdminController],
  providers: [AppService, DataImportService],
})
export class AppModule { }
