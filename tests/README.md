# Unit Testing - ĐỀ TÀI CUỐI KỲ PHẦN 1

## 📋 Tổng Quan

Phần này bao gồm **Unit Testing (Kiểm thử đơn vị)** cho hệ thống cho thuê phòng trọ với 3 phương pháp:

1. **White Box Testing** (Hộp trắng) - Kiểm thử logic bên trong
2. **Black Box Testing** (Hộp đen) - Kiểm thử Input/Output
3. **Gray Box Testing** (Hộp xám) - Kiểm thử kết hợp

### Trạng thái hiện tại (cập nhật 29/03/2026)

- ✅ Test Suites: **4 passed, 4 total**
- ✅ Tests: **50 passed, 50 total**
- ✅ Lệnh xác nhận: `npm run test:unit`

---

## 🎯 4 Chức Năng Được Test

### Backend (2 chức năng)

#### 1. **Get Properties** - White Box Testing
- **File test:** `tests/unit/white-box/getProperties.test.js`
- **Kiểm thử:**
  - ✅ Lọc theo `moderationDecision` (auto_approved)
  - ✅ Pagination logic (skip, limit)
  - ✅ Sort logic (default: -createdAt)
  - ✅ Error handling (Database error)

#### 2. **Create Property** - Black Box Testing
- **File test:** `tests/unit/black-box/createProperty.test.js`
- **Kiểm thử:**
  - ✅ Input validation (title, price, area)
  - ✅ Authorization (landlord, user)
  - ✅ Geocoding (tọa độ từ địa chỉ)
  - ✅ Image upload (với/không ảnh)
  - ✅ Database error handling

### Frontend (2 chức năng)

#### 3. **Search/Filter Properties** - Gray Box Testing
- **File test:** `tests/unit/gray-box/searchProperties.test.js`
- **Kiểm thử:**
  - ✅ Form validation (area, price, district)
  - ✅ AJAX call format & parameters
  - ✅ UI updates (spinner, error message)
  - ✅ Filter combinations
  - ✅ Error handling (network, 404, invalid JSON)

#### 4. **Show Property on Map** - Gray Box Testing
- **File test:** `tests/unit/gray-box/initializeMap.test.js`
- **Kiểm thử:**
  - ✅ Map initialization (container, center, zoom)
  - ✅ Marker placement & popup
  - ✅ Coordinate validation (lng/lat ranges)
  - ✅ HCM boundaries validation
  - ✅ Error handling & fallback
  - ✅ User interactions (click, zoom)

---

## 📁 Cấu Trúc Folder

```
tests/
├── unit/
│   ├── white-box/
│   │   └── getProperties.test.js          (8 test cases)
│   ├── black-box/
│   │   └── createProperty.test.js         (10 test cases)
│   └── gray-box/
│       ├── searchProperties.test.js       (15 test cases)
│       └── initializeMap.test.js          (17 test cases)
├── fixtures/
│   └── property.fixtures.js               (Dữ liệu test)
├── setup.js                               (Jest setup)
└── jest.config.js                         (Jest configuration)
```

**Tổng cộng:** **50 test cases**

---

## 🚀 Cách Chạy Tests

### 1. Cài đặt Jest
```bash
npm install --save-dev jest
```

### 2. Chạy tất cả tests
```bash
npm test
```

### 3. Chạy tests theo loại
```bash
# White Box Tests
npm run test:white-box

# Black Box Tests  
npm run test:black-box

# Gray Box Tests
npm run test:gray-box

# Unit Tests (tất cả)
npm run test:unit
```

### 4. Xem code coverage
```bash
npm test -- --coverage
```

### 5. Watch mode (tự động chạy khi sửa code)
```bash
npm run test:watch
```

---

## 📊 Chi Tiết Test Cases

### White Box: getProperties (9 tests)

| # | Kiểm thử | Mục đích | Expected Result |
|---|----------|---------|-----------------|
| 1 | Lọc không showAll | Chỉ auto_approved | moderationDecision = 'auto_approved' |
| 2 | Lọc với showAll=true | Lấy tất cả | Không filter moderationDecision |
| 3 | Pagination page 1 | skip(0), limit(10) | Đúng tính toán |
| 4 | Pagination page 2 | skip(10), limit(10) | Đúng tính toán |
| 5 | Default limit | Mặc định 1000 | limit = 1000 |
| 6 | Sort by field | Sắp xếp -createdAt | sort(-createdAt) |
| 7 | Default sort | Mặc định sort | sort(-createdAt) |
| 8 | Database error | Error 500 | Status 500 |

### Black Box: createProperty (10 tests)

| # | Input | Expected Output |
|----|-------|-----------------|
| 1 | Dữ liệu hợp lệ | Status 201 (Created) |
| 2 | Thiếu title | Status 400 (Bad Request) |
| 3 | Price âm | Status 400 |
| 4 | Area = 0 | Status 400 |
| 5 | Role landlord | Được tạo property |
| 6 | Role user | Được tạo property |
| 7 | Với coordinates | location.coordinates defined |
| 8 | Với 2 images | images.length = 2 |
| 9 | Không image | images.length = 0 |
| 10 | Database error | next(error) được gọi |

### Gray Box: searchProperties (15 tests)

| # | Kiểm thử | Expected Result |
|----|---------|-----------------|
| 1 | Area input = -10 | Không hợp lệ |
| 2 | Price input = abc | Không hợp lệ |
| 3 | District = Quận 1 | Hợp lệ |
| 4 | GET request format | URL đúng format |
| 5 | Empty filter | Lấy tất cả |
| 6 | Loading spinner | Display block |
| 7 | Hiển thị danh sách | HTML chứa property item |
| 8 | Error message | Display block |
| 9 | Clear error | Display none |
| 10 | Network error | Caught error message |
| 11 | 404 response | response.status = 404 |
| 12 | Invalid JSON | Throw error |
| 13 | Filter area only | Query chứa area |
| 14 | Filter price range | Query chứa price |
| 15 | Filter district + price | Query chứa cả hai |

### Gray Box: initializeMap (17 tests)

| # | Kiểm thử | Expected Result |
|----|---------|-----------------|
| 1 | Map container | Tạo map đúng container |
| 2 | Center coordinates | [106.6977, 10.7779] |
| 3 | Zoom level | zoom = 15 |
| 4 | Marker tại vị trí | setLngLat called |
| 5 | Marker custom | element defined |
| 6 | Popup content | HTML chứa title, price |
| 7 | Coordinates array | [lng, lat] |
| 8 | Longitude range | -180 to 180 |
| 9 | Latitude range | -90 to 90 |
| 10 | HCM validation | 106-107 lng, 10-11.5 lat |
| 11 | Ngoài HCM | isValidHCM = false |
| 12 | Coordinates null | isValid = false |
| 13 | Map error | Error message displayed |
| 14 | Missing coordinates | Error message displayed |
| 15 | Fallback center | Default HCM center |
| 16 | Marker click | Click handler works |
| 17 | Zoom interaction | Map zoom changes |

---

## 🔧 Fixtures - Dữ Liệu Test

Dữ liệu test được lưu trong `tests/fixtures/property.fixtures.js`:

```javascript
// Dữ liệu hợp lệ
{
  title: 'Phòng trọ cao cấp 20m² tại Quận 1',
  price: 5000000,
  area: 20,
  moderationDecision: 'auto_approved',
  location: { coordinates: [106.6977, 10.7779] }
}

// Dữ liệu không hợp lệ
{
  description: '...',  // Thiếu title
  price: 5000000
}
```

---

## 📈 Code Coverage Goals

| Module | Target |
|--------|--------|
| propertyController.js | > 80% |
| searchProperties (JS) | > 75% |
| initializeMap (JS) | > 80% |
| **Tổng** | **> 78%** |

---

## 🎓 Lý Thuyết Kiểm Thử

### White Box Testing (Hộp Trắng)
- **Định nghĩa:** Kiểm thử biết cấu trúc bên trong code
- **Phương pháp:** Test logic, branches, conditionals
- **Ví dụ:** Test pagination logic, filter conditions
- **Ưu điểm:** Tìm được lỗi logic phức tạp

### Black Box Testing (Hộp Đen)  
- **Định nghĩa:** Kiểm thử không biết cấu trúc bên trong
- **Phương pháp:** Test Input → Output
- **Ví dụ:** Input valid → tạo property thành công, Input invalid → 400 error
- **Ưu điểm:** Kiểm thử như người dùng thực tế

### Gray Box Testing (Hộp Xám)
- **Định nghĩa:** Kết hợp cả hai phương pháp
- **Phương pháp:** Biết một phần logic, test từ perspective người dùng
- **Ví dụ:** Test form validation + API call + UI update
- **Ưu điểm:** Toàn diện, thực tế

---

## 📝 Báo Cáo Testing

### Chạy lệnh tạo báo cáo
```bash
npm test -- --coverage --collectCoverageFrom="src/**/*.js,public/js/**/*.js"
```

### Xem chi tiết
```bash
npm test -- --coverage --verbose
```

---

## ✅ Checklist Hoàn Thành

- [x] Tạo cấu trúc folder testing
- [x] Cấu hình Jest
- [x] Tạo fixtures dữ liệu
- [x] White Box Tests (9 cases)
- [x] Black Box Tests (11 cases)
- [x] Gray Box Tests (32 cases)
- [x] Cấu hình npm scripts
- [x] Tạo README documentation
- [x] Chạy xác nhận toàn bộ unit tests (50/50 pass)

**Tổng cộng: 50 test cases**

---

## 📚 Tài Liệu Tham Khảo

- [Jest Documentation](https://jestjs.io/)
- [Unit Testing Best Practices](https://testingjavascript.com/)
- [Testing Nodejs Applications](https://nodejs.org/en/docs/guides/testing/)

---

## 👤 Tác Giả

Sinh viên: Kh20042004  
Lớp: (Đồ án chuyên ngành)  
Đề tài: Unit Testing cho hệ thống cho thuê phòng trọ

---

## 📄 Phần Tiếp Theo

- **Phần 2:** Automation Testing (Kiểm thử tự động)
  - Sử dụng công cụ: Bugzillar / Selenium / etc.
  - Tạo automated test scenarios
  - Test trên multiple browsers
