/**
 * Jest Setup File
 * Cấu hình môi trường test
 */

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Set environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/homerent-test';
process.env.PORT = 3000;
process.env.JWT_SECRET = 'test-secret-key';

// Suppress console logs trong test
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
