import mysql from "@fastify/mysql";

// Function to establish a MySQL connection and return it
export async function getConnection(fastify) {
  const connection = await fastify.mysql.getConnection();
  return connection;
}

// Register the MySQL plugin with Fastify
export default function (fastify, options, next) {
  fastify.register(mysql, {
    connectionString: "mysql://root:root@localhost",
    promise: true,
  });
  next();
}
