import { prisma } from "../lib/prisma.js";

export async function expireHold() {
    const expiredHolds = await prisma.hold.findMany({
        where: {
            status: "ACTIVE",
            expiresAt: { lt: new Date() },
        },
    });

    if (expiredHolds.length === 0) return;

    console.log(`[cron] Processing ${expiredHolds.length} expired holds..`);

    for (const hold of expiredHolds) {
        try {
            await prisma.$transaction(async (tx) => {
                await tx.hold.update({
                    where: { id: hold.id },
                    data: { status: "EXPIRED" },
                });

                const waiting = await tx.$queryRaw<{ id: number, userId: number }[]>`
                    SELECT id, "userId"
                    FROM "waitlistEntry"
                    WHERE status = 'WAITING' ORDER BY
                    "createdAit" ASC LIMIT 1
                    FOR UPDATE SKIP LOCKED
                `;

                if (waiting.length > 0 && waiting[0] !== undefined) {
                    const next = waiting[0];

                    await tx.$executeRaw`
                        UPDATE "waitlistEntry" SET status = "PROMOTED" WHERE id = ${next.id}
                        `;

                    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
                    await tx.hold.create({
                        data: {
                            userId: next.userId,
                            expiresAt,
                        },
                    });

                    console.log(`[cron] hold ${hold.id} expired --> promoted user ${next.userId} from queue `);
                }
                else {
                    await tx.$executeRaw`
                    UPDATE "INVENTORY" SET available = available + 1 WHERE id = 1
                    `;

                    console.log(`[cron] Hold ${hold.id} expired -> pair returned to inventory`);
                }
            });
        } catch (err) {
            console.error(`[cron] failed to process hold {hold.id}:`, err);
        }
    }
}