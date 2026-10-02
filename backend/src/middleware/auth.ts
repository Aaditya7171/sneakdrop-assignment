import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string };
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization Header" });
        return;
    }
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("jwt secret not set in your env");

    try {
        const decoded = jwt.verify(token, secret) as { id: number; email: string };
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or Expired Token" });
    }
}