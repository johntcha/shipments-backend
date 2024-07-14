import { jest } from "@jest/globals";
import {
  getAllShipments,
  getShipmentbyInternalReferenceName,
  createShipment,
  modifyShipment,
} from "./shipments.js";

const mockConnection = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockFastify = {
  mysql: {
    getConnection: jest.fn().mockResolvedValue(mockConnection),
  },
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
};

describe("Shipments", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllShipments", () => {
    it("should fetch all shipments from DB and send them if user is staff", async () => {
      const mockRequest = {
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Staff" }];
      const mockShipmentsRows = [
        { id: 1, internal_reference_name: "Shipment1", user_id: "John" },
        { id: 2, internal_reference_name: "Shipment2", user_id: "Jane" },
        { id: 3, internal_reference_name: "Shipment3", user_id: "Doe" },
      ];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockShipmentsRows, null]);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockReply.send).toHaveBeenCalledWith(mockShipmentsRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should only fetch user's shipments from DB and send them if user is owner", async () => {
      const mockRequest = {
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Owner" }];
      const mockShipmentsRows = [
        { id: 1, internal_reference_name: "Shipment1", user_id: "John" },
        { id: 2, internal_reference_name: "Shipment2", user_id: "John" },
        { id: 3, internal_reference_name: "Shipment3", user_id: "John" },
      ];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockShipmentsRows, null]);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        `SELECT * FROM shipments WHERE user_id = ?`,
        [mockUserRows[0].user_id]
      );
      expect(mockReply.send).toHaveBeenCalledWith(mockShipmentsRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should fetch limited shipments from DB and send them if user is warehouse staff", async () => {
      const mockRequest = {
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Warehouse staff" }];
      const mockShipmentsRows = [
        { id: 1, internal_reference_name: "Shipment1", user_id: "John" },
        { id: 2, internal_reference_name: "Shipment2", user_id: "Jane" },
      ];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockShipmentsRows, null]);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        `SELECT id, internal_reference_name, user_id, updated_at FROM shipments LIMIT 2`
      );
      expect(mockReply.send).toHaveBeenCalledWith(mockShipmentsRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 404 if user not found", async () => {
      const mockRequest = {
        headers: {
          "user-id": "Unknown",
        },
      };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const mockUserRows = [];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `User with user_id '${mockRequest.headers["user-id"]}' does not exist.`
      );
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 500 if fetching all shipments fails", async () => {
      const mockRequest = {
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
  describe("getShipmentbyInternalReferenceName", () => {
    it("should fetch all shipments from DB with corresponding internal reference name and send them if user is Staff", async () => {
      const mockRequest = {
        params: { internal_reference_name: "Shipment1" },
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Staff" }];
      const mockShipmentsRows = [
        { id: 1, internal_reference_name: "Shipment1", user_id: "John" },
        { id: 2, internal_reference_name: "Shipment1", user_id: "Jane" },
        { id: 3, internal_reference_name: "Shipment1", user_id: "Jane" },
      ];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockShipmentsRows, null]);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        `SELECT * FROM shipments WHERE internal_reference_name = ?`,
        ["Shipment1"]
      );
      expect(mockReply.send).toHaveBeenCalledWith(mockShipmentsRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });
    it("should fetch limited shipments from DB with corresponding internal reference name and send them if user is warehouse staff", async () => {
      const mockRequest = {
        params: { internal_reference_name: "Shipment1" },
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Warehouse staff" }];
      const mockShipmentsRows = [
        { id: 1, internal_reference_name: "Shipment1", user_id: "John" },
        { id: 2, internal_reference_name: "Shipment1", user_id: "Jane" },
      ];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockShipmentsRows, null]);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenNthCalledWith(
        2,
        `SELECT id, internal_reference_name, user_id, updated_at 
          FROM shipments WHERE internal_reference_name = ?
          LIMIT 2`,
        ["Shipment1"]
      );
      expect(mockReply.send).toHaveBeenCalledWith(mockShipmentsRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 403 if user is owner", async () => {
      const mockRequest = {
        params: { internal_reference_name: "Shipment1" },
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const mockUserRows = [{ user_id: "John", type: "Owner" }];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `Users with Owner type are not allowed to use this API`
      );
      expect(mockReply.status).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 404 if user not found", async () => {
      const mockRequest = {
        params: { internal_reference_name: "Shipment1" },
        headers: {
          "user-id": "Unknown",
        },
      };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };
      const mockUserRows = [];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `User with user_id '${mockRequest.headers["user-id"]}' does not exist.`
      );
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
    it("should log an error and return status 500 if fetching all shipments from DB with corresponding internal reference name fails", async () => {
      const mockRequest = {
        params: { internal_reference_name: "Shipment1" },
        headers: {
          "user-id": "John",
        },
      };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
  describe("createShipment", () => {
    it("should create a shipment", async () => {
      const body = {
        internal_reference_name: "Shipment1",
        user_id: "John",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
      };

      const mockUserRows = [{ user_id: "John", type: "Owner" }];
      const result = { insertId: 1 };
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([result, null]);

      await createShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(3);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockReply.send).toHaveBeenCalledWith(result.insertId);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 404 if user not found", async () => {
      const body = {
        internal_reference_name: "Shipment1",
        user_id: "Unknown",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const mockUserRows = [];
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);

      await createShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `User with user_id '${body.user_id}' does not exist.`
      );
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
    it("should log an error and return status 404 if creating a shipments from DB fails", async () => {
      const body = {
        internal_reference_name: "Shipment1",
        user_id: "Unknown",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await createShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
  describe("modifyShipment", () => {
    it("should update a shipment", async () => {
      const body = {
        id: 1,
        internal_reference_name: "Shipment1341241242",
        user_id: "Jane",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
      };

      const mockShipmentRows = [
        {
          id: 1,
          internal_reference_name: "Shipment1",
          user_id: "John",
          estimated_started_at: "2023-12-31 14:30:00",
          actual_started_at: "2023-12-31 14:30:00",
          estimated_completion_at: "2023-12-31 14:30:00",
          actual_completion_at: "2023-12-31 14:30:00",
        },
      ];
      const mockUserRows = [{ user_id: "Jane", type: "Owner" }];
      const result = { info: "Rows matched: 1  Changed: 1  Warnings: 0" };
      mockConnection.query.mockResolvedValueOnce([mockShipmentRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);
      mockConnection.query.mockResolvedValueOnce([result, null]);

      await modifyShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(4);
      expect(mockConnection.query).toHaveBeenCalledTimes(3);
      expect(mockReply.send).toHaveBeenCalledWith(result.info);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error and return status 404 if shipment not found", async () => {
      const body = {
        id: 12345,
        internal_reference_name: "Shipment1341241242",
        user_id: "Jane",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const mockShipmentRows = [];
      mockConnection.query.mockResolvedValueOnce([mockShipmentRows, null]);

      await modifyShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `Shipment with following id and internal reference name doesn't exist: ${body.id}`
      );
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
    it("should log an error and return status 404 if user not found", async () => {
      const body = {
        id: 1,
        internal_reference_name: "Shipment1341241242",
        user_id: "Unknown",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const mockShipmentRows = [
        {
          id: 1,
          internal_reference_name: "Shipment1",
          user_id: "John",
          estimated_started_at: "2023-12-31 14:30:00",
          actual_started_at: "2023-12-31 14:30:00",
          estimated_completion_at: "2023-12-31 14:30:00",
          actual_completion_at: "2023-12-31 14:30:00",
        },
      ];
      const mockUserRows = [];
      mockConnection.query.mockResolvedValueOnce([mockShipmentRows, null]);
      mockConnection.query.mockResolvedValueOnce([mockUserRows, null]);

      await modifyShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockFastify.log.error).toHaveBeenCalledWith(
        `User with user_id '${body.user_id}' does not exist.`
      );
      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
    it("should log an error and return status 404 if updating a shipments from DB fails", async () => {
      const body = {
        id: 1,
        internal_reference_name: "Shipment1341241242",
        user_id: "Jane",
        estimated_started_at: "2023-12-31 14:30:00",
        actual_started_at: "2023-12-31 14:30:00",
        estimated_completion_at: "2023-12-31 14:30:00",
        actual_completion_at: "2023-12-31 14:30:00",
      };
      const mockRequest = { body };
      const mockReply = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await modifyShipment(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalled();
      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
