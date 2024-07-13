import { getConnection } from "./mysql.js";

const initializeDatabase = async (fastify, connection) => {
  try {
    await connection.query("CREATE DATABASE IF NOT EXISTS shippio");
    await connection.query("USE shippio");

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
  }
};

const createUsersTable = async (fastify, connection) => {
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(20) PRIMARY KEY,
        type ENUM('Staff', 'Owner', 'Warehouse staff')
      )
    `);
    await connection.query(`
      INSERT IGNORE INTO users (user_id, type) VALUES ('John', 'Staff'), ('Jane', 'Owner'), ('Doe', 'Warehouse staff')
    `);
    fastify.log.info("Users table successfully created");
  } catch (err) {
    fastify.log.error("Error creating Users table:", err);
  }
};

const addForeignKeyUserId = async (fastify, connection) => {
  try {
    const shipmentTableConstraints = await connection.query(
      `
      SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_NAME='shipments'`,
      ["shipments"]
    );
    //shipmentTableConstraints[0] is all constraints
    //shipmentTableConstraints[1] is table schema
    const FKUserId = shipmentTableConstraints[0].find(
      (constraint) => constraint.CONSTRAINT_NAME === "FK_user_id"
    );
    if (!FKUserId) {
      await connection.query(`
        ALTER TABLE shipments
        ADD CONSTRAINT FK_user_id
        FOREIGN KEY  (user_id) REFERENCES users(user_id);
      `);
      fastify.log.info("FK_user_id created");
    }
  } catch (err) {
    fastify.log.error("Error creating FK_user_id:", err);
  }
};

export const dbOperations = async (fastify) => {
  const connection = await getConnection(fastify);
  fastify.log.info("Connection to MySQL database successful");
  await initializeDatabase(fastify, connection);
  await createUsersTable(fastify, connection);
  await addForeignKeyUserId(fastify, connection);
  connection.release();
};
