import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
        res.status(400).json({ error: "email and password is required" });
        return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
        const user = await prisma.user.create({
            data: { email, passwordHash },
        });
        res.status(201).json({ message: "Registered", userId: user.id });
    } catch {
        res.status(409).json({ error: "Email is already in use" });
    }
})

authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Check .env for JWT_SECRET");

    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
        expiresIn: "7d",
    })

    res.json({ token });
})