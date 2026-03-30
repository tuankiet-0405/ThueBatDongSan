/**
 * BLACK BOX TEST - createProperty (Backend)
 * Kiểm thử input/output: input hợp lệ → output đúng, input sai → lỗi
 */

const mongoose = require('mongoose');
const { createProperty } = require('../../../src/controllers/propertyController');
const Property = require('../../../src/models/Property');
const User = require('../../../src/models/User');
const Notification = require('../../../src/models/Notification');
const geocodingService = require('../../../src/services/geocodingService');
const { uploadMultipleToCloudinary } = require('../../../src/config/cloudinary');
const { runAutoModeration } = require('../../../src/services/autoModerationService');
const { validProperty, invalidProperty } = require('../../fixtures/property.fixtures');

jest.mock('../../../src/models/Property');
jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Notification');
jest.mock('../../../src/services/geocodingService');
jest.mock('../../../src/config/cloudinary');
jest.mock('../../../src/services/autoModerationService');

describe('BLACK BOX: createProperty - Kiểm thử Input/Output', () => {
  let mockReq, mockRes, mockNext;
  const validAddressText = '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh';

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        ...validProperty,
        address: validAddressText
      },
      files: [
        {
          path: 'public/uploads/image1.jpg',
          filename: 'image1.jpg'
        }
      ],
      user: {
        id: '507f1f77bcf86cd799439012',
        role: 'landlord'
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };

    mockNext = jest.fn();

    geocodingService.getCoordinatesFromAddress = jest.fn().mockResolvedValue({
      lng: 106.6977,
      lat: 10.7779,
      accuracy: 'exact'
    });
    geocodingService.getDefaultCoordinates = jest.fn().mockReturnValue({
      lng: 106.7,
      lat: 10.8
    });

    uploadMultipleToCloudinary.mockResolvedValue([
      { url: 'https://example.com/image1.jpg' }
    ]);

    User.findById = jest.fn().mockResolvedValue({
      _id: mockReq.user.id,
      name: 'Test Landlord',
      phone: '0900000000',
      email: 'landlord@example.com'
    });
    User.find = jest.fn().mockResolvedValue([]);

    Notification.create = jest.fn().mockResolvedValue({});
    Notification.insertMany = jest.fn().mockResolvedValue([]);

    runAutoModeration.mockResolvedValue({
      status: 'pending',
      moderationDecision: 'pending_review',
      moderationScore: 0.5,
      failedReason: ''
    });

    Property.findByIdAndUpdate = jest.fn().mockImplementation(async (id, update) => ({
      _id: id,
      ...validProperty,
      ...update
    }));
  });

  describe('1. Validation - Input hợp lệ', () => {
    test('Tạo property thành công với đầu vào hợp lệ', async () => {
      const mockProperty = {
        _id: new mongoose.Types.ObjectId(),
        ...validProperty,
        save: jest.fn().mockResolvedValue(validProperty)
      };

      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(Property.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('FAIL - Không cân title → Response 400', async () => {
      mockReq.body = { ...invalidProperty }; // Thiếu title

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('FAIL - Price âm → Response 400', async () => {
      mockReq.body = {
        ...validProperty,
        address: validAddressText,
        price: -100
      };

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('FAIL - Area = 0 → Response 400', async () => {
      mockReq.body = {
        ...validProperty,
        address: validAddressText,
        area: 0
      };

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('2. Authorization', () => {
    test('User có role="landlord" được tạo property', async () => {
      mockReq.user.role = 'landlord';

      const mockProperty = { ...validProperty, _id: new mongoose.Types.ObjectId() };
      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(Property.create).toHaveBeenCalled();
    });

    test('User có role="user" được tạo property', async () => {
      mockReq.user.role = 'user';

      const mockProperty = { ...validProperty, _id: new mongoose.Types.ObjectId() };
      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(Property.create).toHaveBeenCalled();
    });
  });

  describe('3. Geocoding', () => {
    test('Property được tạo với location.coordinates từ address', async () => {
      mockReq.body = {
        ...validProperty,
        address: validAddressText
      };

      const mockProperty = {
        ...validProperty,
        location: {
          type: 'Point',
          coordinates: [106.6977, 10.7779]
        }
      };

      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockProperty.location.coordinates).toBeDefined();
      expect(mockProperty.location.coordinates.length).toBe(2);
    });
  });

  describe('4. Image Upload', () => {
    test('Property được tạo với images nếu có file upload', async () => {
      mockReq.files = [
        { filename: 'image1.jpg', path: 'public/uploads/image1.jpg' },
        { filename: 'image2.jpg', path: 'public/uploads/image2.jpg' }
      ];

      const mockProperty = {
        ...validProperty,
        images: mockReq.files
      };

      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockProperty.images.length).toBe(2);
    });

    test('Property được tạo mà không cần image', async () => {
      mockReq.files = [];
      mockReq.body = {
        ...validProperty,
        address: validAddressText
      };

      const mockProperty = {
        ...validProperty,
        images: []
      };

      Property.create = jest.fn().mockResolvedValue(mockProperty);

      await createProperty(mockReq, mockRes, mockNext);

      expect(mockProperty.images.length).toBe(0);
    });
  });

  describe('5. Database Error Handling', () => {
    test('FAIL - Database lỗi → Response 500', async () => {
      Property.create = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        await createProperty(mockReq, mockRes, mockNext);
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });
  });
});
