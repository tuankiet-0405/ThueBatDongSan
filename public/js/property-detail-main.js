/**
 * Property Detail Page - Main JavaScript
 * Handles all functionality for property detail page including:
 * - Authentication state
 * - Property data loading
 * - Reviews system
 * - Bookings
 * - Contact features (call, message, Zalo)
 * - Map initialization
 * - Favorites
 */

// ===================================
// GLOBAL VARIABLES
// ===================================
let landlordPhone = '';
let landlordId = '';
let currentPropertyId = '';
let propertyId = '';
let currentReviewsPage = 1;
let totalReviewsCount = 0;
let canUserReview = false;
let reviewEligibility = null;

// Initialize property ID from URL
function initializePropertyId() {
    const pathParts = window.location.pathname.split('/');
    propertyId = pathParts[pathParts.length - 1];
    currentPropertyId = propertyId;
    console.log('Property ID initialized:', propertyId);
}

// ===================================
// AUTHENTICATION
// ===================================

/**
 * Check and update login status
 */
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Hide guest navbar, show user navbar
            const guestNav = document.getElementById('navbarGuest');
            const userNav = document.getElementById('navbarUser');
            
            if (guestNav) guestNav.style.display = 'none';
            if (userNav) userNav.style.display = 'flex';
            
            // Update user info
            const userNameEl = document.getElementById('userName');
            const userEmailEl = document.getElementById('userEmail');
            const userAvatarEl = document.getElementById('userAvatar');
            
            if (userNameEl) userNameEl.textContent = user.name || 'Người dùng';
            if (userEmailEl) userEmailEl.textContent = user.email || 'user@example.com';
            
            // Update avatar
            if (userAvatarEl) {
                if (user.avatar) {
                    userAvatarEl.src = user.avatar;
                } else {
                    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
                    const colors = ['6B7280', '4B5563', '374151'];
                    const bgColor = colors[Math.floor(Math.random() * colors.length)];
                    userAvatarEl.src = `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff`;
                }
            }
            
            // Show admin panel if admin
            if (user.role === 'admin') {
                const adminBtn = document.getElementById('adminPanelBtn');
                if (adminBtn) adminBtn.style.display = 'block';
            }
            
            // Update mobile menu
            const mobileLogin = document.getElementById('mobileLoginBtn');
            const mobileRegister = document.getElementById('mobileRegisterBtn');
            if (mobileLogin) mobileLogin.style.display = 'none';
            if (mobileRegister) mobileRegister.style.display = 'none';
            
            console.log('✅ User logged in:', user.name);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
        }
    } else {
        // Not logged in - show guest navbar
        const guestNav = document.getElementById('navbarGuest');
        const userNav = document.getElementById('navbarUser');
        
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
        
        console.log('ℹ️ User not logged in');
    }
}

/**
 * Handle logout
 */
function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '/';
}

// ===================================
// PROPERTY DATA
// ===================================

/**
 * Load property data
 */
async function loadPropertyDetail() {
    try {
        // Ensure propertyId is set
        if (!propertyId || propertyId === 'undefined') {
            console.error('Invalid propertyId:', propertyId);
            console.log('Current URL:', window.location.href);
            console.log('Pathname:', window.location.pathname);
            throw new Error('Invalid property ID');
        }
        
        console.log('Loading property with ID:', propertyId);
        const response = await fetch(`/api/properties/${propertyId}`);
        
        if (!response.ok) {
            throw new Error('Property not found');
        }

        const result = await response.json();
        const property = result.data;

        // Hide loading, show content
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('property-detail').classList.remove('hidden');

        // Populate data
        populatePropertyData(property);
        initializeMap(property);
        
    } catch (error) {
        console.error('Error loading property:', error);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

/**
 * Populate property data into DOM
 */
function populatePropertyData(property) {
    // Title and basic info
    document.getElementById('breadcrumb-title').textContent = property.title;
    document.getElementById('property-title').textContent = property.title;
    document.getElementById('property-type').textContent = getPropertyTypeLabel(property.propertyType);
    
    // Address
    document.getElementById('property-address').innerHTML = `
        <i class="fas fa-map-marker-alt mr-2"></i>
        ${property.address.street}, ${property.address.ward}, ${property.address.district}, ${property.address.city}
    `;

    // Price
    const price = (property.price / 1000000).toFixed(1);
    document.getElementById('property-price').textContent = price + ' triệu';

    // Stats
    document.getElementById('property-area').textContent = property.area + 'm²';
    document.getElementById('property-bedrooms').textContent = property.bedrooms || 0;
    document.getElementById('property-bathrooms').textContent = property.bathrooms || 0;

    // Description
    document.getElementById('property-description').textContent = property.description;

    // Images
    if (property.images && property.images.length > 0) {
        const mainImage = document.getElementById('main-image');
        mainImage.innerHTML = `<img src="${property.images[0]}" alt="${property.title}" class="w-full h-full object-cover">`;
        
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = property.images.map((img, index) => `
            <img src="${img}" alt="Ảnh ${index + 1}" class="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75" 
                 onclick="changeMainImage('${img}')">
        `).join('');
    }

    // Amenities
    const amenitiesContainer = document.getElementById('property-amenities');
    const amenities = property.amenities || {};
    
    const amenitiesData = [
        { key: 'wifi', label: 'WiFi', icon: 'wifi' },
        { key: 'ac', label: 'Điều hòa', icon: 'fan' },
        { key: 'parking', label: 'Chỗ đậu xe', icon: 'parking' },
        { key: 'kitchen', label: 'Nhà bếp', icon: 'utensils' },
        { key: 'water', label: 'Nước nóng', icon: 'tint' },
        { key: 'laundry', label: 'Máy giặt', icon: 'soap' },
        { key: 'balcony', label: 'Ban công', icon: 'building' },
        { key: 'security', label: 'An ninh', icon: 'shield-alt' }
    ];
    
    amenitiesContainer.innerHTML = amenitiesData.map(item => {
        const hasAmenity = amenities[item.key];
        return `
            <div class="flex items-center gap-2 p-3 rounded-lg ${hasAmenity ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}">
                <i class="fas fa-${item.icon} text-lg"></i>
                <span class="flex-1">${item.label}</span>
                ${hasAmenity ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
            </div>
        `;
    }).join('');

    // Landlord info
    if (property.landlord) {
        document.getElementById('landlord-name').textContent = property.landlord.name || 'Chủ nhà';
        
        // Store landlord info for call and chat functions
        landlordPhone = property.landlord.phone || '';
        landlordId = (property.landlord._id || property.landlord).toString();
        currentPropertyId = property._id.toString();
        
        console.log('Landlord Info:', { landlordId, landlordPhone, currentPropertyId });
        
        const phoneContainer = document.getElementById('landlord-phone');
        phoneContainer.innerHTML = `
            <i class="fas fa-phone mr-3 text-green-500 text-lg"></i>
            <span class="font-semibold">${property.landlord.phone || 'Chưa cập nhật'}</span>
        `;
        
        const emailContainer = document.getElementById('landlord-email');
        emailContainer.innerHTML = `
            <i class="fas fa-envelope mr-3 text-blue-500 text-lg"></i>
            <span class="font-semibold text-sm break-all">${property.landlord.email || 'Chưa cập nhật'}</span>
        `;
        
        // Avatar
        const avatar = property.landlord.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.landlord.name || 'User')}&background=4F46E5&color=fff&bold=true`;
        document.getElementById('landlord-avatar').src = avatar;
    }
}

/**
 * Get property type label in Vietnamese
 */
function getPropertyTypeLabel(type) {
    const types = {
        'phong-tro': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ',
        'chung-cu-mini': 'Chung cư mini',
        'homestay': 'Homestay'
    };
    return types[type] || type;
}

/**
 * Change main image
 */
function changeMainImage(src) {
    document.getElementById('main-image').innerHTML = `<img src="${src}" alt="Main image" class="w-full h-full object-cover">`;
}

// ===================================
// MAP INITIALIZATION
// ===================================

/**
 * Initialize Leaflet map
 */
function initializeMap(property) {
    if (!property.location || !property.location.coordinates || property.location.coordinates.length < 2) {
        document.getElementById('map').innerHTML = '<p class="text-center text-gray-500 py-20">Chưa có thông tin vị trí</p>';
        return;
    }

    const [lng, lat] = property.location.coordinates;

    // Create map with Goong Map JS
    goongjs.accessToken = '3wUhxxPZujfl6OwVJ9N7YdDlGP6pJU62zw5PT4pg';
    const map = new goongjs.Map({
        container: 'map',
        style: 'https://tiles.goong.io/assets/goong_map_web.json',
        center: [lng, lat],
        zoom: 15
    });

    // Add custom marker
    const el = document.createElement('div');
    el.className = 'w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg';
    el.innerHTML = '<i class="fas fa-home text-white text-xl"></i>';
    
    const popup = new goongjs.Popup({ offset: 25 })
        .setHTML(`
            <div class="text-center">
                <strong class="text-gray-900">${property.title}</strong><br>
                <span class="text-sm text-gray-600">${property.address.district}, ${property.address.city}</span>
            </div>
        `);
    
    new goongjs.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
}

// ===================================
// CONTACT FEATURES
// ===================================

/**
 * Handle Call - Gọi điện cho chủ nhà
 */
function handleCall() {
    if (!landlordPhone || landlordPhone === 'Chưa cập nhật') {
        showNotification('Chủ nhà chưa cập nhật số điện thoại', 'error');
        return;
    }
    
    const cleanPhone = landlordPhone.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanPhone.match(/^[0-9]{10,11}$/)) {
        showNotification('Số điện thoại không hợp lệ', 'error');
        return;
    }
    
    showCallConfirmation(landlordPhone);
}

/**
 * Show Call Confirmation Modal
 */
function showCallConfirmation(phone) {
    const modal = document.createElement('div');
    modal.id = 'callModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-fadeInUp">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-phone text-green-600 text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Gọi điện cho chủ nhà</h3>
                <p class="text-gray-600">Bạn muốn gọi đến số:</p>
                <div class="mt-3 text-2xl font-bold text-green-600">${phone}</div>
            </div>
            
            <div class="flex gap-3">
                <button onclick="cancelCall()" class="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold">
                    <i class="fas fa-times mr-2"></i>Hủy
                </button>
                <button onclick="makeCall('${phone}')" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                    <i class="fas fa-phone mr-2"></i>Gọi ngay
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * Make Call
 */
function makeCall(phone) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    cancelCall();
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = `tel:${cleanPhone}`;
        showNotification('Đang khởi tạo cuộc gọi...', 'success');
    } else {
        showDesktopCallOptions(phone);
    }
}

/**
 * Show Desktop Call Options
 */
function showDesktopCallOptions(phone) {
    const modal = document.createElement('div');
    modal.id = 'desktopCallModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-fadeInUp">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-desktop text-blue-600 text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">Số điện thoại</h3>
                <p class="text-gray-600 mb-4">Vui lòng sử dụng điện thoại để gọi:</p>
                <div class="bg-gray-100 rounded-lg p-4 mb-4">
                    <div class="text-2xl font-bold text-gray-900" id="phoneNumberDisplay">${phone}</div>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button onclick="closeDesktopCallModal()" class="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold">
                    <i class="fas fa-times mr-2"></i>Đóng
                </button>
                <button onclick="copyPhoneNumber('${phone}')" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                    <i class="fas fa-copy mr-2"></i>Sao chép
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * Copy Phone Number
 */
function copyPhoneNumber(phone) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    navigator.clipboard.writeText(cleanPhone).then(() => {
        showNotification('Đã sao chép số điện thoại!', 'success');
        closeDesktopCallModal();
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Không thể sao chép. Vui lòng thử lại.', 'error');
    });
}

/**
 * Cancel Call
 */
function cancelCall() {
    const modal = document.getElementById('callModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Close Desktop Call Modal
 */
function closeDesktopCallModal() {
    const modal = document.getElementById('desktopCallModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Handle Message - Mở chat với chủ nhà
 */
async function handleMessage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập để gửi tin nhắn', 'error');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1500);
        return;
    }

    if (!landlordId) {
        showNotification('Không tìm thấy thông tin chủ nhà', 'error');
        console.error('landlordId is missing:', landlordId);
        return;
    }

    showNotification('Đang tạo cuộc trò chuyện...', 'info');
    
    try {
        console.log('Creating conversation with:', { landlordId, currentPropertyId });
        
        const response = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                userId: landlordId,
                propertyId: currentPropertyId
            })
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (data.success && data.data) {
            localStorage.setItem('openConversationId', data.data._id);
            
            try {
                const userDataStr = localStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const currentUserId = userData._id;
                    
                    console.log('Current User ID:', currentUserId);
                    console.log('Participants:', data.data.participants);
                    
                    if (data.data.participants && Array.isArray(data.data.participants)) {
                        const otherUser = data.data.participants.find(p => {
                            const participantId = p._id || p;
                            return participantId.toString() !== currentUserId.toString();
                        });
                        
                        if (otherUser) {
                            localStorage.setItem('openConversationUser', JSON.stringify(otherUser));
                            console.log('Other User:', otherUser);
                        }
                    }
                }
            } catch (parseError) {
                console.warn('Error parsing user data:', parseError);
            }
            
            console.log('Redirecting to chat...');
            window.location.href = '/chat';
        } else {
            showNotification(data.message || 'Không thể mở chat', 'error');
            console.error('API Error:', data);
        }
    } catch (error) {
        console.error('Error opening chat:', error);
        showNotification('Có lỗi xảy ra khi mở chat: ' + error.message, 'error');
    }
}

/**
 * Handle Zalo - Gửi tin nhắn qua Zalo
 */
function handleZalo() {
    if (!landlordPhone) {
        showNotification('Chưa có thông tin số điện thoại để liên hệ Zalo', 'error');
        return;
    }

    const cleanPhone = landlordPhone.replace(/[\s\-\(\)]/g, '');
    
    if (!cleanPhone.match(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/)) {
        showNotification('Số điện thoại không hợp lệ để gửi Zalo', 'error');
        return;
    }

    let zaloPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
        zaloPhone = '+84' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+84')) {
        zaloPhone = '+84' + cleanPhone;
    }

    openZalo(zaloPhone);
}

/**
 * Open Zalo
 */
function openZalo(phone) {
    const zaloNumber = phone.replace('+', '');
    const zaloUrl = `https://zalo.me/${zaloNumber}`;
    
    showNotification('Đang mở Zalo...', 'success');
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const zaloAppUrl = `zalo://conversation?phone=${zaloNumber}`;
        
        window.location.href = zaloAppUrl;
        
        setTimeout(() => {
            window.open(zaloUrl, '_blank');
        }, 500);
    } else {
        const zaloWindow = window.open(zaloUrl, '_blank');
        
        if (zaloWindow) {
            zaloWindow.focus();
        } else {
            showNotification('Vui lòng cho phép popup để mở Zalo', 'error');
        }
    }
}

// ===================================
// BOOKING MODAL
// ===================================

/**
 * Open Booking Modal
 */
function openBookingModal() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        showNotification('Vui lòng đăng nhập để đặt lịch xem phòng', 'error');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1500);
        return;
    }

    try {
        const user = JSON.parse(userData);
        document.getElementById('bookingName').value = user.name || '';
        document.getElementById('bookingPhone').value = user.phone || '';
    } catch (error) {
        console.error('Error parsing user data:', error);
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').setAttribute('min', today);

    const modal = document.getElementById('bookingModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close Booking Modal
 */
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    document.getElementById('bookingForm').reset();
}

// ===================================
// REPORT MODAL
// ===================================

/**
 * Open Report Modal
 */
function openReportModal() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        showNotification('Vui lòng đăng nhập để báo cáo tin đăng', 'error');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1500);
        return;
    }

    try {
        const user = JSON.parse(userData);
        document.getElementById('reportEmail').value = user.email || '';
    } catch (error) {
        console.error('Error parsing user data:', error);
    }

    const modal = document.getElementById('reportModal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close Report Modal
 */
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    document.getElementById('reportForm').reset();
}

// ===================================
// REVIEWS SYSTEM
// ===================================

/**
 * Load Reviews
 */
async function loadReviews() {
    try {
        const response = await fetch(`/api/reviews/property/${currentPropertyId}`);
        const result = await response.json();

        if (result.success) {
            totalReviewsCount = result.count;
            displayReviews(result.data);
            calculateRatingSummary(result.data, result.stats);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Check if user can review
 */
async function checkCanReview() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`/api/reviews/can-review/${currentPropertyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (result.success) {
            canUserReview = result.canReview;
            reviewEligibility = result;
        }
    } catch (error) {
        console.error('Error checking review eligibility:', error);
    }
}

/**
 * Display Reviews
 */
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-comments text-4xl mb-3 opacity-50"></i>
                <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
            </div>
        `;
        return;
    }

    reviewsList.innerHTML = reviews.map(review => {
        const reviewTypeIcon = review.reviewType === 'rented' 
            ? '<i class="fas fa-home mr-1"></i>Đã thuê' 
            : '<i class="fas fa-eye mr-1"></i>Đã xem';
        
        const reviewTypeColor = review.reviewType === 'rented' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-green-100 text-green-700';

        return `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start space-x-3">
                <img src="${review.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'User')}&background=4F46E5&color=fff`}" 
                     alt="${review.user?.name}" 
                     class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h4 class="font-semibold text-gray-900">${review.user?.name || 'Người dùng'}</h4>
                            <div class="flex items-center text-yellow-500 text-sm">
                                ${generateStars(review.rating)}
                                <span class="ml-2 text-gray-600">${review.rating}.0</span>
                            </div>
                        </div>
                        <span class="text-sm text-gray-500">${formatDate(review.createdAt)}</span>
                    </div>
                    <h5 class="font-semibold text-gray-800 mb-1">${review.title}</h5>
                    <p class="text-gray-600 text-sm leading-relaxed mb-2">${review.comment}</p>
                    <div class="flex items-center space-x-2">
                        ${review.verified ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs ${reviewTypeColor}"><i class="fas fa-check-circle mr-1"></i>${reviewTypeIcon}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

/**
 * Calculate Rating Summary
 */
function calculateRatingSummary(reviews, stats) {
    if (reviews.length === 0) {
        document.getElementById('averageRating').textContent = '0.0';
        document.getElementById('averageStars').innerHTML = generateStars(0);
        document.getElementById('totalReviews').textContent = '0 đánh giá';
        return;
    }

    const averageRating = stats?.averageRating || 0;

    document.getElementById('averageRating').textContent = averageRating;
    document.getElementById('averageStars').innerHTML = generateStars(Math.round(averageRating));
    
    const reviewText = stats ? 
        `${stats.total} đánh giá (${stats.rented} đã thuê, ${stats.viewing} đã xem)` : 
        `${reviews.length} đánh giá`;
    document.getElementById('totalReviews').textContent = reviewText;

    // Rating bars
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => ratingCounts[r.rating - 1]++);

    const ratingBars = document.getElementById('ratingBars');
    ratingBars.innerHTML = [5, 4, 3, 2, 1].map(star => {
        const count = ratingCounts[star - 1];
        const percentage = reviews.length > 0 ? (count / reviews.length * 100) : 0;
        return `
            <div class="flex items-center text-xs">
                <span class="w-8">${star}★</span>
                <div class="flex-1 h-2 bg-gray-200 rounded-full mx-2">
                    <div class="h-full bg-yellow-500 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <span class="w-8 text-right">${count}</span>
            </div>
        `;
    }).join('');
}

/**
 * Generate Stars HTML
 */
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating 
            ? '<i class="fas fa-star"></i>' 
            : '<i class="far fa-star"></i>';
    }
    return stars;
}

/**
 * Format Date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN');
}

/**
 * Open Review Modal
 */
async function openReviewModal() {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập để viết đánh giá', 'error');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1500);
        return;
    }

    try {
        const response = await fetch(`/api/reviews/can-review/${currentPropertyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();

        if (!result.success || !result.canReview) {
            showNotification(result.reason || 'Bạn chưa có quyền đánh giá phòng này', 'error');
            return;
        }

        reviewEligibility = result;

        const modal = document.getElementById('reviewModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        initializeStarRating();
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        showNotification('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
    }
}

/**
 * Close Review Modal
 */
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('reviewForm').reset();
    document.getElementById('reviewRating').value = '';
    resetStars();
}

/**
 * Initialize Star Rating
 */
function initializeStarRating() {
    const stars = document.querySelectorAll('#reviewStars i');
    const ratingInput = document.getElementById('reviewRating');
    const ratingText = document.getElementById('ratingText');

    const ratingLabels = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            ratingInput.value = rating;
            ratingText.textContent = ratingLabels[rating - 1];
            updateStars(rating);
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            updateStars(rating);
        });
    });

    document.getElementById('reviewStars').addEventListener('mouseleave', function() {
        const currentRating = parseInt(ratingInput.value) || 0;
        updateStars(currentRating);
    });
}

/**
 * Update Stars Display
 */
function updateStars(rating) {
    const stars = document.querySelectorAll('#reviewStars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'text-yellow-500');
        } else {
            star.classList.remove('fas', 'text-yellow-500');
            star.classList.add('far');
        }
    });
}

/**
 * Reset Stars
 */
function resetStars() {
    const stars = document.querySelectorAll('#reviewStars i');
    stars.forEach(star => {
        star.classList.remove('fas', 'text-yellow-500');
        star.classList.add('far');
    });
    document.getElementById('ratingText').textContent = 'Chọn số sao';
}

// ===================================
// FAVORITES
// ===================================

/**
 * Handle Save Property (Favorite)
 */
async function handleSaveProperty(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    const btn = event.currentTarget;
    const isSaved = btn.classList.contains('favorite-active');
    
    try {
        const method = isSaved ? 'DELETE' : 'POST';
        const response = await fetch(`/api/favorites/${propertyId}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            if (isSaved) {
                btn.classList.remove('favorite-active');
                btn.classList.remove('bg-gradient-to-r', 'from-pink-500', 'to-red-500', 'text-white', 'border-red-500');
                btn.classList.add('bg-gradient-to-r', 'from-pink-100', 'to-red-100', 'text-red-600', 'hover:from-pink-200', 'hover:to-red-200', 'border-2', 'border-red-200');
                btn.innerHTML = '<i class="far fa-heart mr-2"></i> Lưu tin';
            } else {
                btn.classList.add('favorite-active');
                btn.classList.remove('bg-gradient-to-r', 'from-pink-100', 'to-red-100', 'text-red-600', 'hover:from-pink-200', 'hover:to-red-200', 'border-2', 'border-red-200');
                btn.classList.add('bg-gradient-to-r', 'from-pink-500', 'to-red-500', 'text-white', 'border-red-500');
                btn.innerHTML = '<i class="fas fa-heart mr-2"></i> Đã lưu';
            }
            
            const message = isSaved ? 'Đã xóa khỏi yêu thích' : 'Đã lưu tin này';
            showSaveNotification(message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

/**
 * Check if property is favorited
 */
async function checkIfFavorited() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`/api/favorites/check/${propertyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            const btn = document.getElementById('saveBtn');
            
            if (result.isFavorite) {
                btn.classList.add('favorite-active');
                btn.classList.remove('bg-gradient-to-r', 'from-pink-100', 'to-red-100', 'text-red-600', 'hover:from-pink-200', 'hover:to-red-200', 'border-2', 'border-red-200');
                btn.classList.add('bg-gradient-to-r', 'from-pink-500', 'to-red-500', 'text-white', 'border-red-500');
                btn.innerHTML = '<i class="fas fa-heart mr-2"></i> Đã lưu';
            }
        }
    } catch (error) {
        console.error('Lỗi kiểm tra yêu thích:', error);
    }
}

// ===================================
// NOTIFICATIONS
// ===================================

/**
 * Show Notification
 */
function showNotification(message, type = 'success') {
    let bgColor, icon;
    
    switch(type) {
        case 'success':
            bgColor = 'bg-green-500';
            icon = 'check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            icon = 'exclamation-circle';
            break;
        case 'info':
            bgColor = 'bg-blue-500';
            icon = 'info-circle';
            break;
        default:
            bgColor = 'bg-gray-500';
            icon = 'bell';
    }
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${bgColor} text-white animate-slideDown flex items-center gap-3`;
    notification.innerHTML = `
        <i class="fas fa-${icon} text-xl"></i>
        <span class="font-semibold">${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Show Save Notification
 */
function showSaveNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 bg-green-500 text-white animate-slideDown';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===================================
// EVENT LISTENERS
// ===================================

/**
 * Booking Form Submit
 */
document.getElementById('bookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập', 'error');
        return;
    }

    const formData = {
        property: currentPropertyId,
        name: document.getElementById('bookingName').value,
        phone: document.getElementById('bookingPhone').value,
        viewingDate: document.getElementById('bookingDate').value,
        viewingTime: document.getElementById('bookingTime').value,
        note: document.getElementById('bookingNote').value
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Đặt lịch xem phòng thành công! Chủ nhà sẽ liên hệ lại với bạn.', 'success');
            closeBookingModal();
            
            setTimeout(() => {
                if (confirm('Bạn có muốn xem danh sách lịch hẹn của mình không?')) {
                    window.location.href = '/bookings';
                }
            }, 2000);
        } else {
            showNotification(result.message || 'Không thể đặt lịch. Vui lòng thử lại!', 'error');
        }
    } catch (error) {
        console.error('Error creating booking:', error);
        showNotification('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
    }
});

/**
 * Report Form Submit
 */
document.getElementById('reportForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập', 'error');
        return;
    }

    const formData = {
        property: currentPropertyId,
        reason: document.getElementById('reportReason').value,
        description: document.getElementById('reportDescription').value,
        email: document.getElementById('reportEmail').value
    };

    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.', 'success');
            closeReportModal();
        } else {
            showNotification(result.message || 'Không thể gửi báo cáo. Vui lòng thử lại!', 'error');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.', 'success');
        closeReportModal();
    }
});

/**
 * Review Form Submit
 */
document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Vui lòng đăng nhập', 'error');
        return;
    }

    const rating = document.getElementById('reviewRating').value;
    if (!rating) {
        showNotification('Vui lòng chọn số sao đánh giá', 'error');
        return;
    }

    if (!reviewEligibility || !reviewEligibility.bookingId) {
        showNotification('Không tìm thấy thông tin booking', 'error');
        return;
    }

    const formData = {
        property: currentPropertyId,
        rating: parseInt(rating),
        title: document.getElementById('reviewTitle').value,
        comment: document.getElementById('reviewComment').value,
        bookingId: reviewEligibility.bookingId,
        reviewType: reviewEligibility.reviewType
    };

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Cảm ơn bạn đã đánh giá!', 'success');
            closeReviewModal();
            loadReviews();
        } else {
            showNotification(result.error || 'Không thể gửi đánh giá. Vui lòng thử lại!', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Có lỗi xảy ra. Vui lòng thử lại!', 'error');
    }
});

/**
 * Mobile menu toggle
 */
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
}

// ===================================
// PAGE INITIALIZATION
// ===================================

/**
 * Initialize on page load
 */
// Run authentication check immediately
checkLoginStatus();
initializePropertyId();

// Load content as soon as DOM is ready (faster than 'load' event)
document.addEventListener('DOMContentLoaded', function() {
    // Re-check login status in case it was missed
    checkLoginStatus();
    
    // Load property data and reviews in parallel
    Promise.all([
        loadPropertyDetail(),
        loadReviews()
    ]).then(() => {
        // Check if favorited after property loads
        checkIfFavorited();
    }).catch(error => {
        console.error('Error during page initialization:', error);
    });
});
