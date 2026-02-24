import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCologneDto } from './dto/create-cologne.dto';

@Injectable()
export class ColognesService {
    constructor(private prisma: PrismaService) {}

    // Tworzy nowe zamówienie
    async create(dto: CreateCologneDto) {
        const row = await this.prisma.colognes.create({
            data: {
                brand_name: dto.brandName,
                cologne_name: dto.cologneName,
                image_url: dto.imageUrl
            },
        });

        return {
            id: row.id,
            brandName: row.brand_name,
            cologneName: row.cologne_name,
            image_url: dto.imageUrl
        };
    }
}
