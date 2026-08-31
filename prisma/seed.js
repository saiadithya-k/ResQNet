/**
 * Seed file for ResQNet database initialization
 */
const bcrypt = require('../backend/node_modules/bcryptjs');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding ResQNet PostgreSQL database with role accounts and mobile numbers...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    {
      id: 'usr-admin-1',
      name: 'Command Chief Miller',
      email: 'admin@resqnet.org',
      mobileNumber: '+919876543211',
      role: 'ADMIN',
      passwordHash
    },
    {
      id: 'usr-disp-1',
      name: 'Dispatcher John Davis',
      email: 'dispatcher@resqnet.org',
      mobileNumber: '+919876543212',
      role: 'DISPATCHER',
      passwordHash
    },
    {
      id: 'usr-resp-1',
      name: 'Alex Chen (Paramedic)',
      email: 'responder@resqnet.org',
      mobileNumber: '+919876543213',
      role: 'RESPONDER',
      passwordHash,
      responder: {
        id: 'RESP-01',
        badgeNumber: 'AMB-A12',
        responderType: 'PARAMEDIC',
        status: 'AVAILABLE',
        latitude: 13.0827,
        longitude: 80.2707,
        skills: ['CPR', 'Trauma Triage', 'Basic Life Support'],
        equipment: ['Trauma Kit', 'Oxygen Tank']
      }
    },
    {
      id: 'usr-comm-1',
      name: 'Dr. Priya Sharma',
      email: 'community@resqnet.org',
      mobileNumber: '+919876543214',
      role: 'COMMUNITY_RESPONDER',
      passwordHash,
      responder: {
        id: 'RESP-COMM-01',
        badgeNumber: 'CFR-892',
        responderType: 'COMMUNITY_FIRST_RESPONDER',
        isCommunity: true,
        isVerified: true,
        status: 'AVAILABLE',
        latitude: 13.0820,
        longitude: 80.2700,
        skills: ['CPR Certified', 'First Aid', 'Emergency Triage'],
        equipment: ['First Responder Medical Kit', 'AED']
      }
    },
    {
      id: 'usr-hosp-1',
      name: 'Metro Central General Hospital',
      email: 'hospital@resqnet.org',
      mobileNumber: '+919876543215',
      role: 'HOSPITAL',
      passwordHash,
      hospital: {
        id: 'HOSP-1',
        hospitalName: 'Metro Central General Hospital',
        district: 'Central Zone',
        latitude: 13.0750,
        longitude: 80.2780,
        totalBeds: 120,
        availableBeds: 34,
        totalIcu: 20,
        availableIcu: 5,
        totalTrauma: 15,
        availableTrauma: 6,
        ventilators: 12,
        operatingRooms: 4,
        isAccepting: true,
        specializations: ['Trauma', 'Burn Care', 'Cardiology', 'Toxicology']
      }
    },
    {
      id: 'usr-citi-1',
      name: 'Vignesh Kumar',
      email: 'citizen@resqnet.org',
      mobileNumber: '+919876543210',
      role: 'CITIZEN',
      passwordHash,
      citizen: {
        address: '42 Harbour Road, Sector 4, Chennai',
        emergencyContact: '+919876543299',
        medicalNotes: 'No known allergies'
      }
    }
  ];

  for (const u of demoUsers) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id: u.id },
          { email: u.email },
          { mobileNumber: u.mobileNumber }
        ]
      }
    });

    if (!existing) {
      const createdUser = await prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          mobileNumber: u.mobileNumber,
          role: u.role,
          passwordHash: u.passwordHash
        }
      });

      if (u.citizen) {
        await prisma.citizenProfile.create({
          data: {
            userId: createdUser.id,
            ...u.citizen
          }
        });
      }

      if (u.responder) {
        await prisma.responderProfile.create({
          data: {
            userId: createdUser.id,
            ...u.responder
          }
        });
      }

      if (u.hospital) {
        await prisma.hospitalProfile.create({
          data: {
            userId: createdUser.id,
            ...u.hospital
          }
        });
      }
      console.log(`  ✓ Created user & profile: ${u.name} (${u.role}) -> ${u.mobileNumber}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          mobileNumber: u.mobileNumber,
          passwordHash: u.passwordHash,
          name: u.name,
          role: u.role
        }
      });
      console.log(`  ✓ Updated demo user: ${u.name} (${u.role}) -> ${u.mobileNumber}`);
    }
  }

  console.log('✅ PostgreSQL demo accounts seeded successfully.');
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
