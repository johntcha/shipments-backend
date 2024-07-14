import {
  getAllShipments,
  getShipmentbyInternalReferenceName,
  createShipment,
} from "./shipments.js";

export const shipmentsRoutes = async (fastify) => {
  fastify.get(
    "/shipments",
    async (request, reply) => await getAllShipments(request, reply, fastify)
  );
  fastify.get(
    "/shipments/:internal_reference_name",
    async (request, reply) =>
      await getShipmentbyInternalReferenceName(request, reply, fastify)
  );
  fastify.post(
    "/shipments",
    async (request, reply) => await createShipment(request, reply, fastify)
  );
};
