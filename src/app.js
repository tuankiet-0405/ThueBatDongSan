const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Session (phải đặt trước passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve views as static files
app.use('/views', express.static(path.join(__dirname, '../views')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/universities', require('./routes/universityRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/moderation', require('./routes/moderationRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/search', require('./routes/searchRoutes')); // 🔐 Goong API proxy

// Config API - Expose public API keys
app.get('/api/config', (req, res) => {
  console.log('📡 Config API called - Sending Goong API keys');
  console.log('GOONG_API_KEY:', process.env.GOONG_API_KEY ? '✓ exists' : '✗ missing');
  console.log('GOONG_MAPTILES_KEY:', process.env.GOONG_MAPTILES_KEY ? '✓ exists' : '✗ missing');
  
  res.json({
    goongApiKey: process.env.GOONG_API_KEY,
    goongMaptilesKey: process.env.GOONG_MAPTILES_KEY
  });
});

// Partials Routes - Phục vụ các file HTML partial
app.get('/partials/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, `../views/partials/${filename}`));
});

// View Routes - Trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// View Routes - Trang giới thiệu
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/about.html'));
});

// View Routes - Trang liên hệ
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/contact.html'));
});

// View Routes - Trang danh sách phòng
app.get('/properties', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/properties.html'));
});

// View Routes - Trang chi tiết phòng
app.get('/properties/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/property-detail.html'));
});

// View Routes - Trang đăng tin (ĐẶT TRƯỚC :id để tránh conflict)
app.get('/property/create', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/property-create.html'));
});

// View Routes - Trang chỉnh sửa bài đăng (ĐẶT TRƯỚC :id)
app.get('/property/edit/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/property-edit.html'));
});

// View Routes - Trang chi tiết phòng (alternative route)
app.get('/property/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/property-detail.html'));
});

// View Routes - Trang đăng nhập
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/auth/login.html'));
});

// View Routes - Trang đăng ký
app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/auth/register.html'));
});

// View Routes - Trang hồ sơ cá nhân
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});

// View Routes - Trang quản lý bài đăng
app.get('/my-properties', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/my-properties.html'));
});

// View Routes - Trang lịch sử nạp tiền
app.get('/recharge-history', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/recharge-history.html'));
});

// View Routes - Trang lịch sử giao dịch
app.get('/transaction-history', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/transaction-history.html'));
});

// View Routes - Trang thông báo
app.get('/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/notifications.html'));
});

// View Routes - Trang yêu thích
app.get('/favorites', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/favorites.html'));
});

// View Routes - Trang cài đặt
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/settings.html'));
});

// View Routes - Trang đặt phòng của tôi
app.get('/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/bookings.html'));
});

// View Routes - Trang lịch hẹn xem phòng (cho chủ nhà)
app.get('/landlord/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/landlord-bookings.html'));
});

// View Routes - Trang chat/tin nhắn
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/chat.html'));
});

// View Routes - Câu hỏi thường gặp
app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/faq.html'));
});

// View Routes - Hướng dẫn
app.get('/guide', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/guide.html'));
});

// View Routes - Điều khoản
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/terms.html'));
});

// View Routes - Bảo mật
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/privacy.html'));
});

// View Routes - Danh sách trường đại học
app.get('/universities', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/universities.html'));
});

// ===================================
// ADMIN ROUTES
// ===================================
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

app.get('/admin/users', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/users.html'));
});

app.get('/admin/properties', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/properties.html'));
});

app.get('/admin/bookings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/bookings.html'));
});

app.get('/admin/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/reviews.html'));
});

app.get('/admin/reports', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/reports.html'));
});

app.get('/admin/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/contacts.html'));
});

app.get('/admin/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

// Chrome DevTools - Ignore this request
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(404).end();
});
 
// 404 handler - chỉ cho các route HTML, bỏ qua static files
app.use((req, res, next) => {
  // Bỏ qua các request cho static files (css, js, images, fonts)
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return res.status(404).end();
  }
  
  const error = new Error('Không tìm thấy trang');
  error.status = 404;
  next(error);
});

// Error handler
app.use(errorHandler);

module.exports = app;
