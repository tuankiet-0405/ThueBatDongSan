/**
 * ===================================
 * ERROR HANDLER MIDDLEWARE
 * Xử lý lỗi tập trung cho toàn ứng dụng
 * ===================================
 */

const colors = require('../config/colors');

/**
 * Error Handler Middleware
 * @param {Error} err - Đối tượng lỗi
 * @param {Request} req - Request object
 * @param {Response} res - Response object
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log lỗi ra console với màu đỏ
  console.error(`${colors.red}[ERROR] ${err.message}${colors.reset}`);
  console.error(err.stack);

  // Lấy status code từ error hoặc mặc định 500
  let statusCode = err.status || err.statusCode || 500;

  // Lấy message từ error hoặc message mặc định
  let message = err.message || 'Đã xảy ra lỗi server';

  // Nếu là lỗi Mongoose validation
  if (err.name === 'ValidationError') {
    statusCode = 400; // ✅ FIX: Set status to 400 for validation errors
    const errors = Object.values(err.errors).map(val => {
      // Dịch một số message phổ biến sang tiếng Việt
      let msg = val.message;
      
      // Xử lý enum error
      if (val.kind === 'enum') {
        msg = val.message; // Sử dụng custom message đã định nghĩa trong model
      }
      
      // Xử lý required error
      if (val.kind === 'required') {
        const fieldName = val.path;
        const fieldNameVi = {
          'name': 'Tên',
          'email': 'Email',
          'password': 'Mật khẩu',
          'phone': 'Số điện thoại',
          'gender': 'Giới tính',
          'address': 'Địa chỉ'
        };
        msg = `${fieldNameVi[fieldName] || fieldName} không được để trống`;
      }
      
      return msg;
    });
    message = errors.join(', ');
  }

  // Nếu là lỗi Mongoose CastError (ID không hợp lệ)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID không hợp lệ';
  }

  // Nếu là lỗi MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 400; // ✅ FIX: Set status to 400 for duplicate key
    const field = Object.keys(err.keyValue)[0];
    message = `${field} đã tồn tại`;
  }

  // Nếu là lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  // Response với JSON
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

module.exports = errorHandler;
