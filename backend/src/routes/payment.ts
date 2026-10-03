import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const paymentRouter = Router();

paymentRouter.post("/webhook", async (req, res) => {
    const { orderId, event, idempotencyKey } = req.body as {
        orderId: number;
        event: string,
        idempotencyKey: string,
    };

    if (!orderId || !event || !idempotencyKey) {
        res.status(400).json({ error: "orderId, event and idempotency-Key are required.." });
        return;
    }

    const alreadyProcessed = await prisma.payment.findUnique({
        where: { idempotencyKey },
    });

    if (alreadyProcessed) {
        console.log(`[webhook] -> Duplicate event ${idempotencyKey} —> skipping`);
        res.status(200).json({ message: "Already Processed" });
        return;
    }

    const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { hold: true },
    });

    if (!order) {
        res.status(404).json({ error: "order not found" });
        return;
    }

    if (event === "payment.succeeded") {
        const holdStillValid = order.hold.status === "ACTIVE" &&
            order.hold.expiresAt > new Date();

        if (!holdStillValid) {
            await prisma.payment.create({
                data: {
                    orderId: order.id, idempotencyKey, event, payload: req.body
                },
            });

            console.log(`[webhook] late payment for order ${orderId} — hold already expired..`);
            res.status(200).json({ message: "Payment received but hold had already expired" });
            return;
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: "PAID" },
            });

            await tx.hold.update({
                where: { id: order.holdId },
                data: { status: "CONVERTED" },
            });

            await tx.payment.create({
                data: { orderId: order.id, idempotencyKey, event, payload: req.body }
            });
        })
        console.log(`[webhook] Payment confirmed for order-> ${orderId}`);
        res.status(200).json({ message: "Payment confirmed" });
    } else {
        await prisma.payment.create({
            data: { orderId: order.id, idempotencyKey, event, payload: req.body },
        });

        console.log(`[webhook] recorded "${event}" for Order ${orderId}`);
        res.status(200).json({ message: `Event "${event}" recorded` });
    }
});

