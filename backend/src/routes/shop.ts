import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const shopRouter = Router();

shopRouter.use(requireAuth);

shopRouter.post("/buy", async (req, res) => {
    // handle active hold
    const userId = req.user!.id;
    const existingHold = await prisma.hold.findFirst({
        where: {
            userId,
            status: "ACTIVE",
        },
    });

    if (existingHold) {
        res.status(400).json({
            error: "you have an active hold already, pay for it or wait for 5 mins.",
            holdExpiresAt: existingHold.expiresAt,
        });
        return;
    }
    // max purchases = 2 handling
    const paidOrderCount = await prisma.order.count({
        where: {
            userId,
            status: "PAID",
        },
    });

    if (paidOrderCount >= 2) {
        res.status(400).json({
            error: "You have already purchased the maximum of 2 pairs.",
        });
        return;
    }

    // atomic hold
    try {
        const hold = await prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<{ available: number }[]>
                `SELECT available FROM "Inventory" where id = 1 FOR UPDATE`;

            const inventory = rows[0];

            if (!inventory) {
                throw new Error("INVENTORY_NOT_FOUND - Maybe forgot to seed.");
            }

            if (inventory.available <= 0) {
                throw new Error("Out of Stock");
            }

            await tx.$executeRaw`
                UPDATE "Inventory" SET available = available - 1 WHERE id = 1`;

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            const hold = await tx.hold.create({
                data: {
                    userId,
                    expiresAt,
                },
            });
            return hold;
        });

        res.status(201).json({
            message: "Hold created! You have 5 minutes to pay.",
            holdId: hold.id,
            expiresAt: hold.expiresAt,
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.message === "Out of Stock") {
                res.status(409).json({
                    error: "No stock available. You can join the waiting list.",
                });
                return;
            }
        }
        throw err;
    }
})