/**
 * WHITE BOX TEST - getProperties (Backend)
 * Kiểm thử logic bên trong: lọc, pagination, query processing
 */

const mongoose = require('mongoose');
const { getProperties } = require('../../../src/controllers/propertyController');
const Property = require('../../../src/models/Property');
const { validProperty, multipleProperties, pendingProperty } = require('../../fixtures/property.fixtures');

// Mock Model
jest.mock('../../../src/models/Property');

describe('WHITE BOX: getProperties - Kiểm thử logic bên trong', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      query: {}
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };

    // Mock next function
    mockNext = jest.fn();
  });

  describe('1. Lọc theo moderationDecision', () => {
    test('Nếu không có showAll=true, chỉ lấy auto_approved properties', async () => {
      mockReq.query = { page: 1, limit: 10 };

      // Mock chain methods
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(1);

      await getProperties(mockReq, mockRes, mockNext);

      // Kiểm tra query được tạo với moderationDecision filter
      expect(Property.find).toHaveBeenCalled();
      const queryArg = Property.find.mock.calls[0][0];
      expect(queryArg.moderationDecision).toBe('auto_approved');
    });

    test('Nếu có showAll=true, lấy tất cả properties không filter moderationDecision', async () => {
      mockReq.query = { showAll: 'true', page: 1, limit: 10 };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty, pendingProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(2);

      await getProperties(mockReq, mockRes, mockNext);

      // Kiểm tra query KHÔNG có moderationDecision filter
      const queryArg = Property.find.mock.calls[0][0];
      expect(queryArg.moderationDecision).toBeUndefined();
    });
  });

  describe('2. Pagination logic', () => {
    test('Tính toán skip và limit đúng cho page=1, limit=10', async () => {
      mockReq.query = { page: 1, limit: 10 };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(1);

      await getProperties(mockReq, mockRes, mockNext);

      // skip((1-1)*10) = skip(0), limit(10)
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    test('Tính toán skip và limit đúng cho page=2, limit=10', async () => {
      mockReq.query = { page: 2, limit: 10 };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(1);

      await getProperties(mockReq, mockRes, mockNext);

      // skip((2-1)*10) = skip(10), limit(10)
      expect(mockChain.skip).toHaveBeenCalledWith(10);
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    test('Sử dụng mặc định limit=1000 nếu không cung cấp', async () => {
      mockReq.query = { page: 1 };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(multipleProperties)
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(3);

      await getProperties(mockReq, mockRes, mockNext);

      expect(mockChain.limit).toHaveBeenCalledWith(1000);
    });
  });

  describe('3. Sort logic', () => {
    test('Sắp xếp theo field được cung cấp', async () => {
      mockReq.query = { page: 1, limit: 10, sort: '-createdAt' };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(1);

      await getProperties(mockReq, mockRes, mockNext);

      expect(mockChain.sort).toHaveBeenCalledWith('-createdAt');
    });

    test('Mặc định sắp xếp theo -createdAt nếu không cung cấp', async () => {
      mockReq.query = { page: 1, limit: 10 };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([validProperty])
      };

      Property.find = jest.fn().mockReturnValue(mockChain);
      Property.countDocuments = jest.fn().mockResolvedValue(1);

      await getProperties(mockReq, mockRes, mockNext);

      expect(mockChain.sort).toHaveBeenCalledWith('-createdAt');
    });
  });

  describe('4. Xử lý error', () => {
    test('Return 500 khi database error', async () => {
      mockReq.query = { page: 1 };

      Property.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        })
      });

      try {
        await getProperties(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });
  });
});
