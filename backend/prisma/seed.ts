import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.inventory.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, total: 20, available: 20 },
    });
    console.log("Seeded: 20 pairs in inventory..");
}

main().catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());