import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
  // Users
  const user1 = await prisma.user.create({
    data: {
      email: 'joa1@test.com',
      username: 'joa1',
      name: 'Joa Uno',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'seba@test.com',
      username: 'seba2  ',
      name: 'Seba Dos',
    },
  });

  // Group
  const group = await prisma.group.create({
    data: {
      name: 'Grupo Test',
      users: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
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
            users: {
                create: [
                { userId: user1.id },
                { userId: user2.id },
                ],
            },
            },
            {
            price: 2000,
            users: {
                create: [{ userId: user1.id }],
            },
            },
        ],
        },

        payments: {
        create: [
            {
            userId: user1.id,
            amount: 1500,
            },
            {
            userId: user2.id,
            amount: 1500,
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