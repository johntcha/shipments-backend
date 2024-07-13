import Fastify from "fastify";
import mysql from "@fastify/mysql";
import { dbOperations } from "./db/db.js";
import { shipmentsRoutes } from "./shipments/shipmentsRoutes.js";

const fastify = Fastify({
  logger: true,
});

fastify.register(mysql, {
  // no issue here for hardcoded username and password since it is an assignment
  // but it it were a real situation, I would use .env variables
  // so I will use .env var later
  connectionString: "mysql://root:root@localhost",
  promise: true,
});

fastify.register(shipmentsRoutes);
async function start() {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info("Server listening on http://localhost:3000");
    await dbOperations(fastify);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start();
