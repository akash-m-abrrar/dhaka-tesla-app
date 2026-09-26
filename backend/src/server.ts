import { app } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("DB is connected well! 🚀");

        app.listen(env.PORT, env.HOST, () => {
            console.log(
                `Tesla is running on http://${env.HOST}:${env.PORT} like a shooting star`
            );
        });
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

startServer();