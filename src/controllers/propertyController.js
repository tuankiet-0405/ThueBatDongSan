/**
 * ===================================
 * PROPERTY CONTROLLER
 * Xử lý CRUD cho phòng trọ/nhà
 * ===================================
 */

const Property = require('../models/Property');
const Notification = require('../models/Notification');
const geocodingService = require('../services/geocodingService');
const { uploadMultipleToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { runAutoModeration } = require('../services/autoModerationService');
const { sendModerationResultEmail } = require('../services/emailService');

/**
 * @desc    Lấy danh sách tất cả property
 * @route   GET /api/properties
 * @access  Public
 */
exports.getProperties = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Parse query
    const queryObj = JSON.parse(queryStr);

    // Log để debug
    console.log('🔍 Query parameters:', req.query);
    console.log('🔍 Parsed query object:', queryObj);

    // Chỉ hiển thị bài đăng đã được duyệt (auto_approved) trên trang công khai
    // Trừ khi có query parameter showAll=true (dành cho admin)
    if (!req.query.showAll) {
      queryObj.moderationDecision = 'auto_approved';
    }

    // Finding resource
    let query = Property.find(queryObj).populate('landlord', 'name email phone avatar');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000; // Tăng limit lên để hiển thị tất cả properties của user
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Count với query filter
    const total = await Property.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const properties = await query;

    console.log(`✅ Found ${properties.length} properties`);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: properties.length,
      total: total,
      pagination,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thông tin 1 property theo ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
exports.getProperty = async (req, res, next) => {
  try {
    // Tối ưu: Không populate reviews vì có endpoint riêng để load reviews
    // Chỉ populate landlord info (ít data hơn)
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone avatar')
      .lean(); // Sử dụng lean() để trả về plain object (nhanh hơn)

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Tăng view count bất đồng bộ (không chờ kết quả)
    Property.updateOne(
      { _id: req.params.id },
      { $inc: { views: 1 } }
    ).exec(); // Fire and forget
    
    property.views = (property.views || 0) + 1; // Update local object for response

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo property mới
 * @route   POST /api/properties
 * @access  Private (Landlord, Admin)
 */
exports.createProperty = async (req, res, next) => {
  try {
    console.log('📝 === CREATE PROPERTY REQUEST ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files?.length || 0);
    console.log('User:', req.user?.id);
    
    // Validate required fields
    const { type, title, description, price, area, bedrooms, bathrooms, street, province, district, ward, address } = req.body;

    if (!type || !title || !description || !price || !area || !bedrooms || !bathrooms) {
      console.log('❌ Thiếu thông tin cơ bản');
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Validate positive numeric fields
    if (Number(price) <= 0 || Number(area) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Giá thuê và diện tích phải lớn hơn 0'
      });
    }
    
    // Kiểm tra địa chỉ: Phải có address đầy đủ HOẶC (street + province + district + ward)
    // Trim để tránh empty string ""
    const hasFullAddress = address && address.trim().length > 0;
    const hasAddressParts = street && street.trim().length > 0 && province && district && ward;
    
    if (!hasFullAddress && !hasAddressParts) {
      console.log('❌ Thiếu thông tin địa chỉ');
      console.log('  - address:', address);
      console.log('  - street:', street);
      console.log('  - province:', province);
      console.log('  - district:', district);
      console.log('  - ward:', ward);
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập đầy đủ địa chỉ'
      });
    }
    
    // Nếu chỉ có address mà thiếu province/district/ward, extract từ address
    if (hasFullAddress && (!province || !district || !ward)) {
      console.log('⚠️ Có address nhưng thiếu province/district/ward, sẽ extract từ address');
      // Parse address để lấy thông tin (có thể cải thiện sau)
    }

    // Tạo địa chỉ đầy đủ TEXT - ưu tiên dùng field 'address' từ frontend (đã có text đầy đủ)
    // Nếu không có thì fallback sang format từ các field riêng lẻ
    const fullAddress = address || `${street}, ${ward}, ${district}, ${province}`;

    // Parse street từ fullAddress nếu street trống
    let streetValue = street && street.trim() ? street : '';
    if (!streetValue && fullAddress) {
      const addressParts = fullAddress.split(',').map(part => part.trim());
      streetValue = addressParts[0] || '';
    }

    // Tự động lấy tọa độ từ địa chỉ TEXT (không phải ID số)
    let coordinates = null;
    try {
      console.log(`🌍 Đang lấy tọa độ cho địa chỉ: ${fullAddress}`);
      
      // Parse địa chỉ thành các phần (street, ward, district, city)
      // Frontend gửi: "51/34 Phú Mỹ, Phường 22, Quận Bình Thạnh, Thành phố Hồ Chí Minh"
      const addressParts = fullAddress.split(',').map(part => part.trim());
      const streetText = addressParts[0] || streetValue;
      const wardText = addressParts[1] || ward || '';
      const districtText = addressParts[2] || district || '';
      const cityText = addressParts[3] || province || '';
      
      const geoData = await geocodingService.getCoordinatesFromAddress(
        streetText,
        wardText,
        districtText,
        cityText
      );
      
      coordinates = [geoData.lng, geoData.lat]; // GeoJSON format: [longitude, latitude]
      
      console.log(`✅ Tọa độ: [${coordinates[0]}, ${coordinates[1]}] (accuracy: ${geoData.accuracy})`);
    } catch (err) {
      console.error('❌ Lỗi khi lấy tọa độ:', err);
      // Sử dụng tọa độ mặc định nếu lỗi
      const defaultCoords = geocodingService.getDefaultCoordinates(district, province);
      coordinates = [defaultCoords.lng, defaultCoords.lat];
    }

    // Lấy thông tin contact từ user hiện tại
    const user = await require('../models/User').findById(req.user.id);
    
    // Xử lý giá theo đơn vị
    const priceUnit = req.body.priceUnit || 'trieu-thang';
    let finalPrice = parseFloat(price);
    
    console.log(`💰 DEBUG - Giá gốc từ request: price=${price}, priceUnit=${priceUnit}, parseFloat=${finalPrice}`);
    
    if (priceUnit === 'trieu-thang') {
      // Chuyển từ triệu sang VND (122 triệu => 122,000,000 VND)
      finalPrice = finalPrice * 1000000;
    } else if (priceUnit === 'vnd-thang') {
      // Đã là VND, giữ nguyên
      finalPrice = finalPrice;
    } else if (priceUnit === 'trieu-nam') {
      // Chuyển triệu/năm sang VND/tháng
      finalPrice = (finalPrice * 1000000) / 12;
    } else if (priceUnit === 'usd-thang') {
      // Chuyển USD sang VND (giả sử tỷ giá 24,000)
      finalPrice = finalPrice * 24000;
    }
    
    console.log(`💰 Giá sau chuyển đổi: ${finalPrice} VND/tháng`);
    
    // Prepare property data với Mongoose schema
    const propertyData = {
      propertyType: type,
      title: title,
      description: description,
      price: finalPrice, // Lưu giá đã chuyển đổi sang VND/tháng
      area: parseFloat(area),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      address: {
        street: streetValue, // Dùng streetValue đã parse từ fullAddress
        city: province,
        district: district,
        ward: ward,
        full: fullAddress
      },
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: street,
        ward: ward,
        district: district,
        province: province
      },
      contact: {
        name: user?.name || req.user.name || 'Chủ nhà',
        phone: user?.phone || req.body.phone || '0000000000',
        email: user?.email || req.user.email,
        zalo: user?.phone || req.body.phone,
        facebook: user?.facebook || ''
      },
      landlord: req.user.id,
      status: 'pending' // Mặc định là pending (chờ admin duyệt)
    };

    // Handle amenities
    if (req.body.amenities) {
      try {
        const amenitiesData = JSON.parse(req.body.amenities);
        // Nếu là object, assign trực tiếp
        if (typeof amenitiesData === 'object' && !Array.isArray(amenitiesData)) {
          propertyData.amenities = amenitiesData;
        }
      } catch (e) {
        // Nếu parse fail, bỏ qua
        console.warn('Lỗi parse amenities:', e.message);
      }
    }

    // Handle images - Upload lên Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📤 Đang upload ${req.files.length} ảnh lên Cloudinary...`);
      
      try {
        // Upload tất cả ảnh lên Cloudinary
        const uploadResults = await uploadMultipleToCloudinary(req.files, 'properties');
        
        // Lưu URLs từ Cloudinary vào database
        propertyData.images = uploadResults.map(result => result.url);
        
        console.log(`✅ Đã upload ${uploadResults.length} ảnh lên Cloudinary`);
      } catch (uploadError) {
        console.error('❌ Lỗi upload ảnh:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Lỗi khi upload ảnh. Vui lòng thử lại.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng tải lên ít nhất 1 ảnh'
      });
    }

    // === BÀI ĐĂNG MỚI - TỰ ĐỘNG XÉT DUYỆT ===
    // Mặc định là pending, sẽ được cập nhật sau khi chạy auto-moderation
    propertyData.status = 'pending';
    propertyData.moderationDecision = 'pending_review';

    // Create property
    let property = await Property.create(propertyData);

    console.log(`✅ Đã tạo property ${property._id}`);

    // === CHẠY AUTO-MODERATION NGAY SAU KHI TẠO ===
    try {
      const moderationResult = await runAutoModeration(property);
      
      console.log(`📝 Kết quả moderation:`, JSON.stringify(moderationResult, null, 2));
      
      // Cập nhật property với kết quả moderation và lấy document mới
      property = await Property.findByIdAndUpdate(
        property._id, 
        moderationResult,
        { new: true } // Trả về document sau khi update
      );
      
      console.log(`✅ Đã cập nhật property với status: ${property.status}, decision: ${property.moderationDecision}`);
      
      console.log(`🤖 Auto-moderation hoàn thành:`);
      console.log(`   Status: ${moderationResult.status}`);
      console.log(`   Decision: ${moderationResult.moderationDecision}`);
      console.log(`   Score: ${(moderationResult.moderationScore * 100)?.toFixed(1)}%`);
      
      // Tạo thông báo cho user dựa trên kết quả
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = '';
      let notificationIcon = '';
      let notificationColor = '';
      
      if (moderationResult.status === 'available') {
        notificationTitle = 'Bài đăng đã được duyệt';
        notificationMessage = `Bài đăng "${property.title}" đã được tự động duyệt và hiển thị công khai! 🎉`;
        notificationType = 'property_approved';
        notificationIcon = 'fa-check-circle';
        notificationColor = 'green';
      } else if (moderationResult.status === 'rejected') {
        notificationTitle = 'Bài đăng bị từ chối';
        notificationMessage = `Bài đăng "${property.title}" không đạt tiêu chuẩn và đã bị từ chối. Lý do: ${moderationResult.failedReason}`;
        notificationType = 'property_rejected';
        notificationIcon = 'fa-times-circle';
        notificationColor = 'red';
      } else {
        notificationTitle = 'Bài đăng chờ xem xét';
        notificationMessage = `Bài đăng "${property.title}" đang chờ quản trị viên xem xét. Điểm: ${(moderationResult.moderationScore * 100)?.toFixed(1)}/100`;
        notificationType = 'system';
        notificationIcon = 'fa-clock';
        notificationColor = 'yellow';
      }
      
      await Notification.create({
        user: req.user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        icon: notificationIcon,
        color: notificationColor,
        link: `/property/${property._id}`,
        data: {
          propertyId: property._id,
          moderationScore: moderationResult.moderationScore
        },
        relatedProperty: property._id
      });

      // === TẠO THÔNG BÁO CHO ADMIN ===
      try {
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' });
        
        let adminNotificationTitle = '';
        let adminNotificationMessage = '';
        let adminNotificationIcon = '';
        let adminNotificationColor = '';
        
        if (moderationResult.status === 'available') {
          adminNotificationTitle = 'Bài đăng tự động duyệt';
          adminNotificationMessage = `Bài đăng "${property.title}" đã được AI tự động duyệt (Điểm: ${(moderationResult.moderationScore * 100)?.toFixed(1)}/100)`;
          adminNotificationIcon = 'fa-robot';
          adminNotificationColor = 'green';
        } else if (moderationResult.status === 'rejected') {
          adminNotificationTitle = 'Bài đăng tự động từ chối';
          adminNotificationMessage = `Bài đăng "${property.title}" đã bị AI tự động từ chối (Điểm: ${(moderationResult.moderationScore * 100)?.toFixed(1)}/100). Lý do: ${moderationResult.failedReason}`;
          adminNotificationIcon = 'fa-robot';
          adminNotificationColor = 'red';
        } else if (moderationResult.status === 'pending') {
          adminNotificationTitle = 'Bài đăng cần xem xét';
          adminNotificationMessage = `Bài đăng "${property.title}" cần admin xem xét thủ công (Điểm: ${(moderationResult.moderationScore * 100)?.toFixed(1)}/100)`;
          adminNotificationIcon = 'fa-exclamation-triangle';
          adminNotificationColor = 'yellow';
        }
        
        // Tạo thông báo cho tất cả admin
        const adminNotifications = admins.map(admin => ({
          user: admin._id,
          title: adminNotificationTitle,
          message: adminNotificationMessage,
          type: 'system',
          icon: adminNotificationIcon,
          color: adminNotificationColor,
          link: `/admin/properties`,
          data: {
            propertyId: property._id,
            landlordId: req.user.id,
            moderationScore: moderationResult.moderationScore,
            moderationStatus: moderationResult.status
          },
          relatedProperty: property._id
        }));
        
        await Notification.insertMany(adminNotifications);
        console.log(`📢 Đã tạo ${adminNotifications.length} thông báo cho admin`);
      } catch (adminNotifError) {
        console.error('❌ Lỗi khi tạo thông báo cho admin:', adminNotifError.message);
      }

      // === GỬI EMAIL THÔNG BÁO ===
      try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        
        if (user && user.email) {
          console.log(`📧 Đang gửi email thông báo đến ${user.email}...`);
          await sendModerationResultEmail(user, property, moderationResult);
        } else {
          console.log('⚠️ User không có email, bỏ qua gửi email');
        }
      } catch (emailError) {
        console.error('❌ Lỗi khi gửi email (không ảnh hưởng flow chính):', emailError.message);
      }
      
    } catch (moderationError) {
      console.error('❌❌❌ LỖI NGHIÊM TRỌNG KHI CHẠY AUTO-MODERATION ❌❌❌');
      console.error('Error name:', moderationError.name);
      console.error('Error message:', moderationError.message);
      console.error('Error stack:', moderationError.stack);
      
      // Nếu lỗi, giữ nguyên status pending
      console.log('⚠️ Property vẫn giữ status pending do lỗi auto-moderation');
    }

    // Log the action
    console.log(`✅ Người dùng ${req.user.id} vừa tạo tin đăng ${property._id} tại ${fullAddress}`);

    // Trả về message phù hợp với status
    let responseMessage = '';
    if (property.status === 'available') {
      responseMessage = '✅ Đăng tin thành công! Tin đăng của bạn đã được tự động duyệt và hiển thị công khai.';
    } else if (property.status === 'rejected') {
      responseMessage = '⚠️ Bài đăng không đạt tiêu chuẩn chất lượng. Vui lòng kiểm tra lại thông tin.';
    } else {
      responseMessage = '✅ Đăng tin thành công! Tin đăng của bạn đang chờ quản trị viên xét duyệt.';
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: property
    });
  } catch (error) {
    // Không cần xóa local files vì đã upload lên Cloudinary
    // Cloudinary sẽ tự động xóa files local sau khi upload
    console.error('❌ Lỗi tạo property:', error);
    next(error);
  }
};

/**
 * @desc    Cập nhật property
 * @route   PUT /api/properties/:id
 * @access  Private (Owner, Admin)
 */
exports.updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra ownership
    if (property.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền cập nhật phòng này'
      });
    }

    // Prepare update data
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      propertyType: req.body.propertyType,
      price: parseFloat(req.body.price),
      area: parseFloat(req.body.area),
      bedrooms: parseInt(req.body.bedrooms),
      bathrooms: parseInt(req.body.bathrooms),
    };

    // Handle address
    if (req.body.address) {
      try {
        const addressData = typeof req.body.address === 'string' 
          ? JSON.parse(req.body.address) 
          : req.body.address;
        
        const fullAddress = `${addressData.street}, ${addressData.ward}, ${addressData.district}, ${addressData.province}`;
        
        updateData.address = {
          street: addressData.street,
          city: addressData.province,
          district: addressData.district,
          ward: addressData.ward,
          full: fullAddress
        };

        // Cập nhật tọa độ nếu địa chỉ thay đổi
        try {
          const geoData = await geocodingService.getCoordinatesFromAddress(
            addressData.street,
            addressData.ward,
            addressData.district,
            addressData.province
          );
          updateData.location = {
            type: 'Point',
            coordinates: [geoData.lng, geoData.lat],
            address: addressData.street,
            ward: addressData.ward,
            district: addressData.district,
            province: addressData.province
          };
        } catch (err) {
          console.warn('Không lấy được tọa độ mới, giữ tọa độ cũ');
        }
      } catch (e) {
        console.warn('Lỗi parse address:', e.message);
      }
    }

    // Handle amenities
    if (req.body.amenities) {
      try {
        const amenitiesData = typeof req.body.amenities === 'string'
          ? JSON.parse(req.body.amenities)
          : req.body.amenities;
        
        // Chỉ cập nhật nếu là object (không phải array)
        if (typeof amenitiesData === 'object' && !Array.isArray(amenitiesData)) {
          // Chỉ cập nhật từng field riêng lẻ để tránh ghi đè cấu trúc
          updateData['amenities.wifi'] = amenitiesData.wifi || false;
          updateData['amenities.ac'] = amenitiesData.ac || false;
          updateData['amenities.parking'] = amenitiesData.parking || false;
          updateData['amenities.kitchen'] = amenitiesData.kitchen || false;
          updateData['amenities.water'] = amenitiesData.water || false;
          updateData['amenities.laundry'] = amenitiesData.laundry || false;
          updateData['amenities.balcony'] = amenitiesData.balcony || false;
          updateData['amenities.security'] = amenitiesData.security || false;
        }
      } catch (e) {
        console.warn('Lỗi parse amenities:', e.message);
      }
    }

    // Handle images
    let finalImages = [];
    
    // Giữ lại ảnh cũ nếu có
    if (req.body.existingImages) {
      try {
        const existingImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        
        if (Array.isArray(existingImages)) {
          finalImages = [...existingImages];
        }
      } catch (e) {
        console.warn('Lỗi parse existingImages:', e.message);
      }
    }
    
    // Thêm ảnh mới - Upload lên Cloudinary
    if (req.files && req.files.length > 0) {
      console.log(`📤 Đang upload ${req.files.length} ảnh mới lên Cloudinary...`);
      
      try {
        const uploadResults = await uploadMultipleToCloudinary(req.files, 'properties');
        const newImages = uploadResults.map(result => result.url);
        finalImages = [...finalImages, ...newImages];
        
        console.log(`✅ Đã upload ${uploadResults.length} ảnh mới`);
      } catch (uploadError) {
        console.error('❌ Lỗi upload ảnh:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Lỗi khi upload ảnh. Vui lòng thử lại.'
        });
      }
    }
    
    // Cập nhật images nếu có thay đổi
    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }

    // Update property
    property = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log(`Người dùng ${req.user.id} vừa cập nhật tin đăng ${property._id}`);

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài đăng thành công!',
      data: property
    });
  } catch (error) {
    console.error('Lỗi cập nhật property:', error);
    next(error);
  }
};

/**
 * @desc    Xóa property
 * @route   DELETE /api/properties/:id
 * @access  Private (Owner, Admin)
 */
exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra ownership
    if (property.landlord.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xóa phòng này'
      });
    }

    // Mongoose - sử dụng deleteOne() thay vì remove()
    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy danh sách property của user hiện tại
 * @route   GET /api/properties/my-properties
 * @access  Private
 */
exports.getMyProperties = async (req, res, next) => {
  try {
    console.log('🔍 Getting properties for user:', req.user.id);

    const properties = await Property.find({ landlord: req.user.id })
      .sort('-createdAt')
      .populate('landlord', 'name email phone avatar');

    console.log(`✅ Found ${properties.length} properties for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    console.error('❌ Error getting my properties:', error);
    next(error);
  }
};

/**
 * @desc    Tìm kiếm property theo vị trí
 * @route   GET /api/properties/radius/:zipcode/:distance
 * @access  Public
 */
exports.getPropertiesInRadius = async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;

    // Tính toán radius
    const radius = distance / 6378; // Earth radius in km

    const properties = await Property.find({
      location: { $geoWithin: { $centerSphere: [[zipcode, radius]] } }
    });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật trạng thái property (available, rented, inactive)
 * @route   PATCH /api/properties/:id/status
 * @access  Private (Owner, Admin)
 */
exports.updatePropertyStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    // Validate status
    const validStatuses = ['available', 'rented', 'pending', 'inactive', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái không hợp lệ. Vui lòng chọn: available, rented, pending, inactive, hoặc rejected'
      });
    }

    let property = await Property.findById(req.params.id).populate('landlord', 'name email');

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy phòng'
      });
    }

    // Kiểm tra ownership
    if (property.landlord._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền cập nhật trạng thái phòng này'
      });
    }

    const oldStatus = property.status;

    // Cập nhật status - Dùng findByIdAndUpdate để tránh validate toàn bộ document
    property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: status },
      { 
        new: true,              // Trả về document mới sau khi update
        runValidators: false    // Không validate các field khác (tránh lỗi enum cũ)
      }
    ).populate('landlord', 'name email');

    console.log(`✅ User ${req.user.id} đã cập nhật status của property ${property._id}: ${oldStatus} → ${status}`);

    // Tạo thông báo cho chủ nhà nếu admin duyệt/từ chối
    if (req.user.role === 'admin' && property.landlord) {
      try {
        // Từ pending → available (Duyệt bài)
        if (oldStatus === 'pending' && status === 'available') {
          await Notification.create({
            user: property.landlord._id,
            type: 'property_approved',
            title: 'Bài đăng đã được duyệt',
            message: `Bài đăng "${property.title}" của bạn đã được admin phê duyệt và đang hiển thị công khai.`,
            link: `/properties/${property._id}`,
            relatedProperty: property._id
          });
          console.log(`📧 Sent approval notification to user ${property.landlord._id}`);
        }
        
        // Từ pending → rejected hoặc inactive (Từ chối bài)
        if (oldStatus === 'pending' && (status === 'rejected' || status === 'inactive')) {
          const rejectReason = reason || 'Bài đăng không đạt tiêu chuẩn';
          await Notification.create({
            user: property.landlord._id,
            type: 'property_rejected',
            title: 'Bài đăng bị từ chối',
            message: `Bài đăng "${property.title}" của bạn đã bị từ chối. Lý do: ${rejectReason}`,
            link: `/my-properties`,
            relatedProperty: property._id
          });
          console.log(`📧 Sent rejection notification to user ${property.landlord._id}`);
        }

        // Bất kỳ status → available (Kích hoạt lại)
        if (oldStatus !== 'available' && status === 'available' && oldStatus !== 'pending') {
          await Notification.create({
            user: property.landlord._id,
            type: 'property_approved',
            title: 'Bài đăng đã được kích hoạt',
            message: `Bài đăng "${property.title}" của bạn đã được kích hoạt lại và đang hiển thị công khai.`,
            link: `/properties/${property._id}`,
            relatedProperty: property._id
          });
          console.log(`📧 Sent reactivation notification to user ${property.landlord._id}`);
        }
      } catch (notifError) {
        console.error('❌ Error creating notification:', notifError);
        // Không throw error, chỉ log
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái thành "${status}"`,
      data: property
    });
  } catch (error) {
    console.error('❌ Error updating property status:', error);
    next(error);
  }
};
