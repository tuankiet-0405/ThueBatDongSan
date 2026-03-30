/**
 * Dữ liệu test cho Property
 */

const validProperty = {
  _id: '507f1f77bcf86cd799439011',
  type: 'phong-tro',
  title: 'Phòng trọ cao cấp 20m² tại Quận 1',
  description: 'Phòng trọ sạch sẽ, thoáng mát, an ninh 24/7',
  propertyType: 'phong-tro',
  price: 5000000,
  deposit: 5000000,
  area: 20,
  bedrooms: 1,
  bathrooms: 1,
  street: '123 Nguyễn Huệ',
  ward: 'Phường Bến Nghé',
  district: 'Quận 1',
  province: 'Thành phố Hồ Chí Minh',
  address: {
    street: '123 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'Thành phố Hồ Chí Minh'
  },
  utilities: ['Wi-Fi', 'Máy lạnh', 'Tủ lạnh'],
  status: 'available',
  moderationDecision: 'auto_approved',
  landlord: '507f1f77bcf86cd799439012',
  images: [
    {
      url: 'https://example.com/image1.jpg',
      publicId: 'property/image1'
    }
  ],
  location: {
    type: 'Point',
    coordinates: [106.6977, 10.7779]
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const invalidProperty = {
  // Thiếu title
  description: 'Phòng trọ sạch sẽ',
  propertyType: 'phong-tro',
  price: 5000000,
  area: 20,
  address: {
    street: '123 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1'
  }
};

const propertyWithoutCoordinates = {
  ...validProperty,
  location: {
    type: 'Point',
    coordinates: [null, null]
  }
};

const propertyOutOfHCM = {
  ...validProperty,
  address: {
    ...validProperty.address,
    province: 'Hà Nội'
  },
  location: {
    type: 'Point',
    coordinates: [105.8426, 21.0285]
  }
};

const multipleProperties = [
  validProperty,
  {
    ...validProperty,
    _id: '507f1f77bcf86cd799439013',
    title: 'Căn hộ 2 phòng tiện nghi tại Quận 2',
    price: 15000000,
    moderationDecision: 'auto_approved',
    status: 'available'
  },
  {
    ...validProperty,
    _id: '507f1f77bcf86cd799439014',
    title: 'Phòng ở ghép rẻ nhất khu vực',
    price: 3000000,
    moderationDecision: 'pending_review',
    status: 'pending'
  }
];

const pendingProperty = {
  ...validProperty,
  moderationDecision: 'pending_review',
  status: 'pending'
};

const rejectedProperty = {
  ...validProperty,
  moderationDecision: 'rejected',
  status: 'inactive'
};

module.exports = {
  validProperty,
  invalidProperty,
  propertyWithoutCoordinates,
  propertyOutOfHCM,
  multipleProperties,
  pendingProperty,
  rejectedProperty
};
