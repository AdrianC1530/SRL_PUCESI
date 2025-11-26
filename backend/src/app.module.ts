import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminController } from './admin/admin.controller';
import { ExcelService } from './common/services/excel.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AppController, AdminController],
  providers: [AppService, ExcelService],
})
export class AppModule { }
