export const getAllShipments = async (request, reply, fastify) => {
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info("Fetching all shipments from DB");
    const [rows, fields] = await connection.query("SELECT * FROM shipments");
    fastify.log.info("Fetching all shipments from DB successful");
    reply.send(rows);
  } catch (err) {
    fastify.log.error("Error while fetching all shipments in DB:", err);
    reply.status(500).send({ error: "Error fetching shipments" });
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
    reply.status(500).send({ error: "Error fetching shipments" });
  }
  connection.release();
};

export const createShipment = async (request, reply, fastify) => {
  const {
    internal_reference_name,
    user_id,
    estimated_started_at,
    actual_started_at,
    estimated_completion_at,
    actual_completion_at,
  } = request.body;
  const connection = await fastify.mysql.getConnection();
  try {
    const [userRows, userFields] = await connection.query(
      `SELECT * FROM users WHERE user_id = '${user_id}'`
    );

    if (userRows.length === 0) {
      const errorMessage = `User with user_id '${user_id}' does not exist.`;
      fastify.log.error(errorMessage);
      reply.status(404).send({ error: errorMessage });
    } else {
      fastify.log.info(
        `Creating shipment with following internal reference name: ${internal_reference_name}`
      );
      const [result, fields] = await connection.query(
        `INSERT INTO shipments (internal_reference_name, user_id, estimated_started_at, actual_started_at, estimated_completion_at, actual_completion_at) 
            VALUES ('${internal_reference_name}', '${user_id}',  '${estimated_started_at}', '${actual_started_at}', '${estimated_completion_at}', '${actual_completion_at}')`
      );
      fastify.log.info(
        `Created shipment with following internal reference name: ${internal_reference_name}`
      );
      reply.send(result.insertId);
    }
  } catch (err) {
    fastify.log.error(
      `Error while creating shipment with following internal reference name: ${internal_reference_name}`,
      err
    );
    reply.status(500).send({ error: "Error creating shipment" });
  }
  connection.release();
};
