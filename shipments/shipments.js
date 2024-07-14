export const getAllShipments = async (request, reply, fastify) => {
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info("Fetching all shipments from DB");
    const [rows, fields] = await connection.query("SELECT * FROM shipments");
    fastify.log.info("Fetching all shipments from DB successful");
    reply.send(rows);
  } catch (err) {
    fastify.log.error("Error while fetching all shipments in DB:", err);
  }
  connection.release();
};

export const getShipmentbyInternalReferenceName = async (
  request,
  reply,
  fastify
) => {
  const { internal_reference_name } = request.params;
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info(
      `Fetching shipment with following internal reference name: ${internal_reference_name}`
    );
    const [rows, fields] = await connection.query(
      `SELECT * FROM shipments WHERE internal_reference_name = '${internal_reference_name}'`
    );
    fastify.log.info("Fetching shipments from DB successful");
    reply.send(rows);
  } catch (err) {
    fastify.log.error(
      `Error while fetching shipment with following internal reference name: ${internal_reference_name}`,
      err
    );
  }
  connection.release();
};
