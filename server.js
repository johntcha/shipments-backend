import Fastify from "fastify";
import mysql from "@fastify/mysql";
import { routes } from "./routes.js";

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

fastify.register(routes);

const initializeDatabase = async () => {
  const connection = await fastify.mysql.getConnection();
  fastify.log.info("Connection to MySQL database successful");
  try {
    await connection.query("CREATE DATABASE IF NOT EXISTS shippio");
    console.log("asfasf");
    await connection.query("USE shippio");

    // Your table creation and initial data insertion queries
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        internal_reference_name VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        updated_at DATETIME,
        estimated_started_at DATETIME,
        actual_started_at DATETIME,
        estimated_completion_at DATETIME,
        actual_completion_at DATETIME
      )
    `);
    fastify.log.info("Database schema initialized successfully");
  } catch (err) {
    fastify.log.error("Error initializing database:", err);
  } finally {
    connection.release();
  }
};

async function start() {
  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info("Server listening on http://localhost:3000");
    await initializeDatabase();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start();
