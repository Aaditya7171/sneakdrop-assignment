import "dotenv/config";
import app from "./app.js"
import { expireHold } from "./jobs/expireHolds.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);

    setInterval(() => {
        expireHold().catch((err) => {
            console.error("[cron] unexpected error in expireHold: ", err);
        });
    }, 30_000);

    console.log("[cron] hold expiry job started -?> every 30s)");
});

