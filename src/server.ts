import { env } from "./config/env.js";
import { buildApp } from "./app.js";

const app = buildApp();

async function start() {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(`Server ready at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Docs at http://${env.HOST}:${env.PORT}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
