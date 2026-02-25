const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcrypt');

async function main() {

    console.log('👤 Odtwarzanie kont użytkowników...');
  
    // --- 1. TWORZENIE ADMINA ---
    const hashedAdminPassword = await bcrypt.hash('HHlol156%', 10); // Zmień na swoje stare hasło admina
  
    const adminUser = await prisma.users.upsert({
      where: { user_name: 'admin' }, 
      update: {},
      create: {
        user_name: 'admin',
        password: hashedAdminPassword,
        role: 'ADMIN'    
      }
    });
    console.log(`✅ Utworzono użytkownika: ${adminUser.user_name} (Rola: ${adminUser.role})`);
  
    // --- 2. TWORZENIE KLIENTA ---
    const hashedClientPassword = await bcrypt.hash('lubieplacki', 10); // Zmień na swoje stare hasło klienta
  
    const clientUser = await prisma.users.upsert({
      where: { user_name: 'client' }, // Nazwa logowania dla klienta
      update: {},
      create: {
        user_name: 'client',
        password: hashedClientPassword,
        role: 'CLIENT' // Przypisanie roli klienta
      }
    });
    console.log(`✅ Utworzono użytkownika: ${clientUser.user_name} (Rola: ${clientUser.role})`);

  console.log('🚀 Konfiguracja maszyny testowej...');

  // 1. TWORZYMY ZAPACHY (ponieważ po resecie bazy tabela jest pusta!)
  const colognesData = [
    { id: '1', cologne_name: 'Boss Bottled Elixir', brand_name: 'Hugo Boss', image_url: 'hugo_boss/boss_bottled_elixir.jpg' },
    { id: '2', cologne_name: 'Colonia Essenza', brand_name: 'Acqua di Parma', image_url: 'adp/colonia_essenza.jpg' },
    { id: '3', cologne_name: 'Aventus', brand_name: 'Creed', image_url: 'creed/aventus.jpg' },
    { id: '4', cologne_name: 'Layton', brand_name: 'Parfums De Marly', image_url: 'pdm/layton.jpg' },
    { id: '5', cologne_name: 'Office for men', brand_name: 'Fragrance One', image_url: 'fragrance_one/office.jpg' }
  ];

  console.log('📦 Odtwarzanie zapachów w bazie...');
  for (const c of colognesData) {
    // upsert zadziała tak: jeśli zapach istnieje, to go zaktualizuje, jeśli nie - stworzy.
    await prisma.colognes.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log('✅ Zapachy poprawnie zapisane w bazie!');

  // 2. Upewniamy się, że urządzenie testowe istnieje w bazie
  const device = await prisma.devices.upsert({
    where: { id: 'test-device-01' },
    update: {},
    create: {
      id: 'test-device-01',
      name: 'Kiosk Główny',
      location: 'Siedziba',
      status: 'ONLINE'
    }
  });
  console.log(`✅ Maszyna gotowa: ${device.id}`);

  // 3. Usuwamy wszystkie stare przypisania slotów (zapobiega błędom duplikacji)
  await prisma.deviceSlot.deleteMany({
    where: { device_id: 'test-device-01' }
  });
  console.log('🧹 Wyczyszczono stare przypisania slotów.');

  // 4. Przypisujemy Twoje docelowe 5 zapachów do slotów w maszynie
  const slotsData = [
    { device_id: 'test-device-01', slot_number: 1, cologne_id: '1', capacity_ml: 1000, current_ml: 1000 },
    { device_id: 'test-device-01', slot_number: 2, cologne_id: '2', capacity_ml: 1000, current_ml: 1000 },
    { device_id: 'test-device-01', slot_number: 3, cologne_id: '3', capacity_ml: 1000, current_ml: 1000 },
    { device_id: 'test-device-01', slot_number: 4, cologne_id: '4', capacity_ml: 1000, current_ml: 1000 },
    { device_id: 'test-device-01', slot_number: 5, cologne_id: '5', capacity_ml: 1000, current_ml: 1000 },
  ];

  await prisma.deviceSlot.createMany({
    data: slotsData
  });
  console.log('✅ Przypisano 5 zapachów do maszyny (każdy ma po 1000ml płynu).');

  // 5. Pobieramy maszynę ze wszystkimi przypisanymi zapachami, żeby sprawdzić czy działa
  const fullDevice = await prisma.devices.findUnique({
    where: { id: 'test-device-01' },
    include: {
      slots: {
        orderBy: { slot_number: 'asc' }, // Sortujemy, żeby Slot 1 był na początku
        include: {
          cologne: true // Zaciągamy z bazy nazwy zapachów i obrazki
        }
      }
    }
  });

  console.log('\n--- 📊 WYNIK: STAN MASZYNY ---');
  console.dir(fullDevice, { depth: null });
  console.log('------------------------------');
}

main()
  .catch(e => console.error('❌ Błąd testu:', e))
  .finally(() => prisma.$disconnect());