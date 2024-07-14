import { jest } from "@jest/globals";
import {
  getAllShipments,
  getShipmentbyInternalReferenceName,
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
    it("should fetch all shipments from DB and send them", async () => {
      const mockRequest = {};
      const mockReply = {
        send: jest.fn(),
      };

      const mockRows = [
        { id: 1, internal_reference_name: "Shipment1" },
        { id: 2, internal_reference_name: "Shipment2" },
      ];
      mockConnection.query.mockResolvedValue([mockRows]);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.info).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(mockRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error if fetching all shipments fails", async () => {
      const mockRequest = {};
      const mockReply = {
        send: jest.fn(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await getAllShipments(mockRequest, mockReply, mockFastify);

      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
  describe("getShipmentbyInternalReferenceName", () => {
    it("should fetch all shipments from DB with corresponding internal reference name and send them", async () => {
      const mockRequest = { params: { internal_reference_name: "Shipment1" } };
      const mockReply = {
        send: jest.fn(),
      };

      const mockRows = [{ id: 1, internal_reference_name: "Shipment1" }];
      mockConnection.query.mockResolvedValue([mockRows]);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.info).toHaveBeenCalledTimes(2);
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith(mockRows);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should log an error if fetching all shipments from DB with corresponding internal reference name fails", async () => {
      const mockRequest = { params: { internal_reference_name: "Shipment1" } };
      const mockReply = {
        send: jest.fn(),
      };

      const error = new Error("Error");
      mockConnection.query.mockRejectedValue(error);

      await getShipmentbyInternalReferenceName(
        mockRequest,
        mockReply,
        mockFastify
      );

      expect(mockFastify.log.error).toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
