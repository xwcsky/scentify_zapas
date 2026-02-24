import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { ColognesModule } from './colognes/colognes.module';
import { AuthModule } from './auth/auth.module';
import {PaymentsModule} from "./payments/payments.module";
import { EventsModule } from './events/events.module';
import { PrismaModule } from 'prisma/prisma.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../webapp/dist/webapp/browser'), // Ścieżka do zbudowanego Angulara
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
    OrdersModule,
    ColognesModule,
    AuthModule, PaymentsModule,
    PrismaModule,EventsModule,
    DiscountsModule,
    ConfigModule.forRoot({
      isGlobal: true, 
  }),
    DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
