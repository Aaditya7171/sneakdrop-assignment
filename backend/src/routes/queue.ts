import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js"

export const queueRouter = Router();

queueRouter.use(requireAuth);

queueRouter.post("/join", async (req, res) => {
    const userId = req.user!.id;

    const activeHold = await prisma.hold.findFirst({
        where: {
            userId, status: "ACTIVE",
            expiresAt: { gt: new Date() },
        },
    })

    if (activeHold) {
        res.status(400).json({
            error: "You have an active hold already, no need to queue..",
            holdExpiredAt: activeHold.expiresAt,
        });
        return;
    }

    const paidOrderCount = await prisma.order.count({
        where: { userId, status: "PAID" },
    });

    if (paidOrderCount >= 2) {
        res.status(400).json({
            error: "You have already purchased the max of 2 pairs",
        });
        return;
    }

    const alreadyWaiting = await prisma.waitlistEntry.findUnique({
        where: { userId },
    });

    if (alreadyWaiting && alreadyWaiting?.status === "WAITING") {
        res.status(400).json({ error: "You are already in the queue.." });
        return;
    }

    const entry = await prisma.waitlistEntry.upsert({
        where: { userId },
        update: { status: "WAITING", createdAt: new Date() },
        create: { userId },
    })

    const position = await prisma.waitlistEntry.count({
        where: {
            status: "WAITING",
            createdAt: { lte: entry.createdAt },
        },
    });

    res.status(201).json({
        message: "You have joined the waiting list..",
        position,
    });
});


queueRouter.delete("/leave", async (req, res) => {
    const userId = req.user!.id;

    const entry = await prisma.waitlistEntry.findUnique({
        where: { userId },
    });

    if (!entry || entry.status !== "WAITING") {
        res.status(404).json({ error: "You are not in queuee" });
        return;
    }

    await prisma.waitlistEntry.update({
        where: { userId },
        data: { status: "CANCELLED" },
    });

    res.json({ message: "You have left the waiting list." });
})