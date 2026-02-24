// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import axios from 'axios';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // 🔹 Parser dla powiadomień Tpay (form-urlencoded)
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json()); // opcjonalnie, jeśli inne endpointy przyjmują JSON

    // 🔹 Globalny pipe dla DTO
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // 🔹 Logowanie requestów
    app.use((req, res, next) => {
        console.log('Request from:', req.headers.origin);
        console.log('Auth header:', req.headers.authorization);
        next();
    });

    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        console.log('🔥🔥🔥 MOJE IP SERWERA TO:', response.data.ip, '🔥🔥🔥');
      } catch (e) {
        console.error('Nie udało się pobrać IP serwera', e.message);
      }
    // 🔹 CORS
    app.enableCors({
        origin: [
            'https://vendx.pl',
            'http://vendx.pl',
            'http://192.168.1.17:4200',
            'http://192.168.8.100:4200',
            'http://localhost:4200'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Authorization'],
        credentials: true,
    });

    await app.listen(8080);
}
bootstrap();
