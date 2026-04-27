import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Users
  const user1 = await prisma.user.upsert({
    where: { email: 'joa1@test.com' },
    update: {
      username: 'joa1',
      name: 'Joa Uno',
    },
    create: {
      email: 'joa1@test.com',
      username: 'joa1',
      name: 'Joa Uno',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'seba@test.com' },
    update: {
      username: 'seba2',
      name: 'Seba Dos',
    },
    create: {
      email: 'seba@test.com',
      username: 'seba2',
      name: 'Seba Dos',
    },
  });

  // Group
  const group = await prisma.group.create({
    data: {
      name: 'Grupo Test',
      users: {
        create: [{ userId: user1.id }, { userId: user2.id }],
      },
    },
  });

  // Ticket con items y payments consistentes
  const ticket = await prisma.ticket.create({
    data: {
      groupId: group.id,

      state: 'PAYERS_CONFIRMED', // 👈 clave

      items: {
        create: [
          {
            price: 1000,
            quantity: 0.5,
            users: {
              create: [
                { userId: user1.id, quantity: 0.25 },
                { userId: user2.id, quantity: 0.25 },
              ],
            },
          },
          {
            price: 2000,
            quantity: 1,
            users: {
              create: [{ userId: user1.id, quantity: 1 }],
            },
          },
          {
            price: 800,
            quantity: 0.25,
            users: {
              create: [{ userId: user2.id, quantity: 0.25 }],
            },
          },
        ],
      },

      payments: {
        create: [
          {
            userId: user1.id,
            amount: 1350,
          },
          {
            userId: user2.id,
            amount: 1350,
          },
        ],
      },
    },
  });

  console.log('Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
