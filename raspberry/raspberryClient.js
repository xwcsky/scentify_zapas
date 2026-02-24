// Przed stworzeniem pliku
// sudo apt update 
// sudo apt install -y nodejs npm
// npm install serialport
// mkdir kiosk-client
// cd kiosk-client
// npm init -y
// npm install socket.io-client onoff dotenv
require('dotenv').config();
const io = require('socket.io-client');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// --- KONFIGURACJA ---
const BACKEND_URL = 'http://localhost:8080'; //'https://seal-app-u9fd7.ondigitalocean.app'; 
const DEVICE_ID = process.env.DEVICE_ID;
const ARDUINO_PORT = '/dev/ttyACM0'; // Sprawdź komendą: ls /dev/tty*
const BAUD_RATE = 9600;

if (!DEVICE_ID) {
    console.error("❌ BŁĄD: Nie ustawiono DEVICE_ID w pliku .env!");
    process.exit(1);
}

console.log('------------------------------------------------');
console.log(`🤖 KIOSK CLIENT - START`);
console.log(`🔗 Backend: ${BACKEND_URL}`);
console.log(`🆔 Device ID: ${DEVICE_ID}`);
console.log(`🔌 Port Arduino: ${ARDUINO_PORT}`);
console.log('------------------------------------------------');

// --- 1. INICJALIZACJA ARDUINO ---
let arduino = null;

try {
    arduino = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE, autoOpen: false });
    
    arduino.open((err) => {
        if (err) {
            console.log(`⚠️  BŁĄD ARDUINO: Nie można otworzyć portu ${ARDUINO_PORT}`);
        } else {
            console.log('✅ ARDUINO POŁĄCZONE (USB)');
        }
    });

    // Nasłuchujemy, co Arduino do nas mówi (np. "Pompa wlaczona")
    if (arduino) {
        const parser = arduino.pipe(new ReadlineParser({ delimiter: '\n' }));
        parser.on('data', (data) => console.log('📩 [Arduino]:', data.trim()));
    }

} catch (e) {
    console.log('⚠️ Krytyczny błąd SerialPort:', e.message);
}

// --- 2. INICJALIZACJA SIECI (SOCKET.IO) ---
const socket = io(BACKEND_URL, {
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ POŁĄCZONO Z BACKENDEM!');
    socket.emit('joinDeviceRoom', { deviceId: DEVICE_ID });
    console.log(`📡 Wysłano: joinDeviceRoom dla ${DEVICE_ID}`);
});

socket.on('disconnect', () => {
    console.warn('⚠️ Rozłączono z serwerem.');
});

setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat', { deviceId: DEVICE_ID });
      console.log(`💓 Wysłano heartbeat dla maszyny: ${DEVICE_ID}`);
    }
  }, 60000);

// --- 3. GŁÓWNA LOGIKA ---
socket.on('deviceCommand', (data) => {
    console.log('\n------------------------------------------------');
    console.log('📬 OTRZYMANO KOMENDĘ Z SIECI');
    
    if (data.command === 'START_PUMP') {
        console.log(`🚀 ROZKAZ: Włącz pompę!`);
        console.log(`💧 Zapach ID: ${data.scentId}`);
        console.log(`⚖️  Ilość:    ${data.quantity}`);

        const serialCommand = `${data.scentId}\n`;

        if (arduino && arduino.isOpen) {
            arduino.write(serialCommand, (err) => {
                if (err) console.log('❌ Błąd wysyłania do USB:', err.message);
                else console.log(`➡️  Wysłano do Arduino: "${serialCommand.trim()}"`);
            });
        } else {
            console.log('⚠️  Arduino niepodłączone - symulacja włączenia.');
        }

    } else {
        console.log('❓ Nieznana komenda:', data.command);
    }
    console.log('------------------------------------------------\n');
});