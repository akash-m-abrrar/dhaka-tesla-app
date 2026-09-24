import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.PORT, env.HOST, () => {
    console.log(`Tesla is running on http://${env.HOST}:${env.PORT} like a shooting star`);
});