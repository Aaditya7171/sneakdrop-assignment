import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const statusRouter = Router();

statusRouter.use(requireAuth);

statusRouter.get("/", async (req, res) => {
    const userId = req.user!.id;

    const [inventory, activeHold, waitlistEntry] = await Promise.all([
        prisma.inventory.findUnique({ where: { id: 1 } }),
        prisma.hold.findFirst({
            where: {
                userId,
                status: "ACTIVE",
                expiresAt: { gt: new Date() },
            },
        }),
        prisma.waitlistEntry.findUnique({
            where: { userId },
        }),
    ]);

    let hold = null;
    if (activeHold) {
        const secondsRemaining = Math.max(
            0,
            Math.floor((activeHold.expiresAt.getTime() - Date.now()) / 1000)
        );

        hold = {
            holdId: activeHold.id,
            expiresAt: activeHold.expiresAt,
            secondsRemaining,
        };
    }

    let queuePosition = null;
    if (waitlistEntry?.status === "WAITING") {
        queuePosition = await prisma.waitlistEntry.count({
            where: {
                status: "WAITING",
                createdAt: { lte: waitlistEntry.createdAt },
            },
        });
    }

    res.json({
        stockLeft: inventory?.available ?? 0,
        hold,
        queuePosition,
    });
});