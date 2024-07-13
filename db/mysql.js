// Function to establish a MySQL connection and return it
export async function getConnection(fastify) {
  const connection = await fastify.mysql.getConnection();
  fastify.log.info("Connection to MySQL database successful");
  return connection;
}
