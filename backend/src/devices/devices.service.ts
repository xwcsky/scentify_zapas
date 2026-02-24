import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  // 1. Pobieranie wszystkich maszyn (do listy w panelu admina)
  async findAll() {
    return this.prisma.devices.findMany({
      orderBy: { name: 'asc' },
      // 👇 DODAJEMY TEN FRAGMENT 👇
      include: {
        slots: {
          orderBy: { slot_number: 'asc' },
          include: { cologne: true }, // Zaciągamy nazwy zapachów
        },
      },
      // 👆 KONIEC DODANEGO FRAGMENTU 👆
    });
  }

  // 2. Pobieranie konkretnej maszyny wraz ze slotami i zapachami
  async findOne(id: string) {
    const device = await this.prisma.devices.findUnique({
      where: { id },
      include: {
        slots: {
          orderBy: { slot_number: 'asc' },
          include: { cologne: true }, // Zaciąga nazwę i zdjęcie perfum
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Nie znaleziono urządzenia o ID: ${id}`);
    }
    return device;
  }

  // 3. Resetowanie (uzupełnianie) płynu w konkretnym slocie
  async refillSlot(slotId: number) {
    // W naszym schemacie założyliśmy, że butelka ma capacity_ml. Odnawiamy do 1000ml.
    return this.prisma.deviceSlot.update({
      where: { id: slotId },
      data: { current_ml: 1000 },
    });
  }
}