export const getAllShipments = async (request, reply, fastify) => {
  const authorizationUserId = request.headers["user-id"];
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info(
      `Checking user with following user_id: ${authorizationUserId}`
    );
    const [userRows, userFields] = await connection.query(
      `SELECT * FROM users WHERE user_id = '${authorizationUserId}'`
    );
    if (userRows.length === 0) {
      const errorMessage = `User with user_id '${authorizationUserId}' does not exist.`;
      fastify.log.error(errorMessage);
      reply.status(404).send({ error: errorMessage });
    } else {
      const user = userRows[0];
      let query = "";
      if (user.type === "Staff") {
        query = "SELECT * FROM shipments";
      } else if (user.type === "Owner") {
        query = `SELECT * FROM shipments WHERE user_id = '${user.user_id}'`;
      } else {
        query = `SELECT id, internal_reference_name, user_id, updated_at FROM shipments LIMIT 2`;
      }
      fastify.log.info("Fetching all shipments from DB");
      const [rows, fields] = await connection.query(query);
      fastify.log.info("Fetching all shipments from DB successful");
      reply.send(rows);
    }
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
  const authorizationUserId = request.headers["user-id"];
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info(
      `Checking user with following user_id: ${authorizationUserId}`
    );
    const [userRows, userFields] = await connection.query(
      `SELECT * FROM users WHERE user_id = '${authorizationUserId}'`
    );
    if (userRows.length === 0) {
      const errorMessage = `User with user_id '${authorizationUserId}' does not exist.`;
      fastify.log.error(errorMessage);
      reply.status(404).send({ error: errorMessage });
    } else {
      const user = userRows[0];
      if (user.type === "Owner") {
        const errorMessage = `Users with Owner type are not allowed to use this API`;
        fastify.log.error(errorMessage);
        reply.status(403).send({ error: errorMessage });
      } else {
        let query = "";
        if (user.type === "Staff") {
          query = `SELECT * FROM shipments WHERE internal_reference_name = '${internal_reference_name}'`;
        } else {
          query = `
          SELECT id, internal_reference_name, user_id, updated_at 
          FROM shipments WHERE internal_reference_name = '${internal_reference_name}'
          LIMIT 2`;
        }
        fastify.log.info(
          `Fetching shipment with following internal reference name: ${internal_reference_name}`
        );
        const [rows, fields] = await connection.query(query);
        fastify.log.info("Fetching shipments from DB successful");
        reply.send(rows);
      }
    }
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
    fastify.log.info(`Checking user with following user_id: ${user_id}`);
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

export const modifyShipment = async (request, reply, fastify) => {
  const {
    id,
    internal_reference_name,
    user_id,
    estimated_started_at,
    actual_started_at,
    estimated_completion_at,
    actual_completion_at,
  } = request.body;
  const connection = await fastify.mysql.getConnection();
  try {
    fastify.log.info(`Fetching shipment with following id: ${id}`);
    const [shipmentRows, userFields] = await connection.query(
      `SELECT * FROM shipments WHERE id = ${id}`
    );

    if (shipmentRows.length === 0) {
      const errorMessage = `Shipment with following id and internal reference name doesn't exist: ${id}`;
      fastify.log.error(errorMessage);
      reply.status(404).send({ error: errorMessage });
    } else {
      fastify.log.info(`Checking user with following user_id: ${user_id}`);
      const [userRows, userFields] = await connection.query(
        `SELECT * FROM users WHERE user_id = '${user_id}'`
      );

      if (userRows.length === 0) {
        const errorMessage = `User with user_id '${user_id}' does not exist.`;
        fastify.log.error(errorMessage);
        reply.status(404).send({ error: errorMessage });
      } else {
        fastify.log.info(`Modifying shipment with following id: ${id}`);
        const [result, fields] = await connection.query(
          `UPDATE shipments 
        SET internal_reference_name = '${internal_reference_name}', 
        user_id = '${user_id}', 
        estimated_started_at = '${estimated_started_at}', 
        actual_started_at = '${actual_started_at}', 
        estimated_completion_at = '${estimated_completion_at}',
        actual_completion_at = '${actual_completion_at}'
        WHERE id = ${id}`
        );
        fastify.log.info(
          `Shipment with the following id has been successfully updated: ${id}`
        );
        reply.send(result.info);
      }
    }
  } catch (err) {
    fastify.log.error(
      `Error while updating shipment with the following id: ${id}`,
      err
    );
    reply.status(500).send({ error: "Error updating shipment" });
  }
  connection.release();
};
