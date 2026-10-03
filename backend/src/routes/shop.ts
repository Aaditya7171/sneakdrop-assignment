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
        }, {
            maxWait: 5000,
            timeout: 10000,
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

shopRouter.post("/pay", async (req, res) => {
    const userId = req.user!.id;

    const activeHold = await prisma.hold.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
        },
    });

    if (!activeHold) {
        res.status(400).json({
            error: "No active hold found, Buy first"
        });
        return;
    }

    const existingOrder = await prisma.order.findUnique({
        where: { holdId: activeHold.id },
    });

    if (existingOrder) {
        res.status(400).json({
            error: "Payment already initiated for this hold.."
        });
        return;
    }

    const order = await prisma.order.create({
        data: {
            userId,
            holdId: activeHold.id,
            status: "PENDING",
        },
    });

    fireFakeWebhook(order.id);

    res.status(202).json({
        message: "Payment initiated, waiting for confirmation",
        orderId: order.id,
    });
});

function fireFakeWebhook(orderId: number) {
    const idemKey = `evt_order_${orderId}_${Date.now()}`;
    const port = process.env.PORT ?? 5000;
    const webhookUrl = `http://localhost:${port}/payment/webhook`;

    const payload = JSON.stringify({
        orderId,
        event: "payment.succeeded",
        idempotencyKey: idemKey,
    })

    const delay = Math.random() < 0.3 ? 2000 : 100; // 30% chance of 2s delay - 100ms otherwise

    setTimeout(async () => {
        try {
            console.log(`[fake-payment] firing webhook for order: ${orderId} after: ${delay}ms..`);

            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            })

            if (Math.random() < 0.2) {
                console.log(`[fake-payment] sending DUPLICATE webhook for order: ${orderId}.`);

                await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                });
            }
        } catch (err) {
            console.error(`[fake-payment] Failed to deliver wEbhook for order ${orderId}:`, err);
        }
    }, delay);
}