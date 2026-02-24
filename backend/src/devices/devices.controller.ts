import { Controller, Get, Param, Patch } from '@nestjs/common';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  getAllDevices() {
    console.log('👀 [GET /devices] Ktoś pyta o listę wszystkich maszyn!');
    return this.devicesService.findAll();
  }

  @Get(':id')
  getDeviceById(@Param('id') id: string) {
    console.log(`👀 [GET /devices/${id}] Ktoś pyta o szczegóły maszyny o ID: ${id}`);
    return this.devicesService.findOne(id);
  }

  @Patch('slots/:slotId/refill')
  refillDeviceSlot(@Param('slotId') slotId: string) {
    console.log(`💧 [PATCH] Ktoś uzupełnia płyn w slocie ID: ${slotId}`);
    return this.devicesService.refillSlot(parseInt(slotId, 10));
  }
}