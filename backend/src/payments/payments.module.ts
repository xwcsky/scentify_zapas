import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { P24Service } from './p24.service';
import { PrismaModule } from 'prisma/prisma.module';
import { EventsModule } from 'src/events/events.module';
import { Prisma } from '@prisma/client';

@Module({
    imports: [OrdersModule, EventsModule, PrismaModule],
    controllers: [PaymentsController],
    providers: [
        PaymentsService,
        P24Service
    ],
    exports: [PaymentsService]
})
export class PaymentsModule {}
