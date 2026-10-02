import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js"
import { shopRouter } from "./routes/shop.js";
import { queueRouter } from "./routes/queue.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
    });
});

app.use("/auth", authRouter);
app.use("/shop", shopRouter);
app.use("/queue", queueRouter);

export default app;