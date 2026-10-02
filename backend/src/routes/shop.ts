import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const shopRouter = Router();

shopRouter.use(requireAuth);

shopRouter.post("/buy", async (req, res) => {
    const userId = req.user!.id;

    try {
        const hold = await prisma.$transaction(async (tx) => {

            await tx.$executeRaw`
                SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`

            // handle concurrent holds (shouldn't be)
            const existingHold = await tx.hold.findFirst({
                where: {
                    userId,
                    status: "ACTIVE",
                    expiresAt: { gt: new Date() },
                },
            });

            if (existingHold) {
                throw new Error("ALREADY_HAS_HOLD");
            }

            // control max purchases = 2
            const paidOrderCount = await tx.order.count({
                where: { userId, status: "PAID" },
            })

            if (paidOrderCount >= 2) {
                throw new Error("MAX_PURCHASES_REACHED");
            }

            // inventory check + decrement
            const rows = await tx.$queryRaw< { available: number }[]>`
                SELECT available FROM "Inventory" WHERE id = 1 FOR UPDATE
            `;

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
            if (err.message === "MAX_PURCHASES_REACHED") {
                res.status(400).json({
                    error: "You have already purchased the max pairs.",
                });
                return;
            }
            if (err.message === "ALREADY_HAS_HOLD") {
                res.status(400).json({
                    error: "You already have an active hold, pay or wait.",
                });
                return;
            }
            if (err.message === "INVENTORY_NOT_FOUND - Maybe forgot to seed.") {
                res.status(500).json({
                    error: "Inventory not initialized - forgot to run seed?",
                });
                return;
            }
        }
        throw err;
    }
})