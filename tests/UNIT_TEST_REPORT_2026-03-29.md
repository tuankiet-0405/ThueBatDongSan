# Bao Cao Unit Testing - Phan 1 (Kiem thu don vi)

## 1. Thong tin chung

- De tai: He thong quan ly cho thue phong tro
- Pham vi: Unit Testing cho 4 chuc nang (2 backend, 2 frontend)
- Framework: Jest
- Ngay chay xac nhan: 29/03/2026

## 2. Chuc nang duoc kiem thu

### Backend

1. getProperties (White Box)
2. createProperty (Black Box)

### Frontend

1. searchProperties (Gray Box)
2. initializeMap (Gray Box)

## 3. Ket qua tong hop

- Test Suites: 4 passed, 4 total
- Tests: 50 passed, 50 total
- Ty le pass: 100%

Cong thuc tinh ty le pass:

Pass Rate = (50 / 50) x 100 = 100%

## 4. Ket qua theo nhom

| Nhom test | File | So test | Ket qua |
|---|---|---:|---|
| White Box | tests/unit/white-box/getProperties.test.js | 8 | Pass |
| Black Box | tests/unit/black-box/createProperty.test.js | 10 | Pass |
| Gray Box | tests/unit/gray-box/searchProperties.test.js | 15 | Pass |
| Gray Box | tests/unit/gray-box/initializeMap.test.js | 17 | Pass |

## 5. Van de da xu ly trong qua trinh

1. Frontend test can moi truong jsdom
- Da cai dat jest-environment-jsdom va tach cau hinh backend/frontend trong Jest projects.

2. Mock Goong Map chua on dinh
- Da cap nhat mock Popup/Map/Marker de on dinh hoa test initializeMap.

3. Input test createProperty chua dung contract runtime
- Da dong bo du lieu test theo controller (user.id, address string).
- Da bo sung validate price va area > 0 trong controller.

4. Mock dependency chua day du
- Da mock geocoding, cloudinary upload, auto moderation, User, Notification.

## 6. Lenh chay da su dung

```powershell
npm run test:white-box
npm run test:black-box
npm run test:gray-box
npm run test:unit
```

## 7. Ket luan

- Phan 1 (Kiem thu don vi) da hoan thanh voi 4/4 test suite pass.
- Bo test hien tai da bao phu duoc cac truong hop co ban va cac truong hop loi chinh.
- Co the su dung ket qua nay trong bao cao do an va chuyen sang Phan 2 (Automation Testing).

## 8. Huong phat trien tiep

1. Bo sung test tich hop (Integration Testing) cho cac API quan trong.
2. Bat lai coverage chi tiet cho dung cac module muc tieu.
3. Tao test automation end-to-end cho luong dang tin, tim kiem, va xem ban do.
