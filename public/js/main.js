/**
 * ===================================
 * MAIN.JS - JavaScript cho trang chủ
 * Hệ thống cho thuê nhà/phòng trọ
 * ===================================
 */

// ===================================
// 1. KHỞI TẠO - Document ready
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 HomeRent System Loaded');
    
    // Xử lý Google OAuth callback
    handleGoogleAuthCallback();
    
    // Gọi các hàm khởi tạo
    initScrollToTop();
    initCounterAnimation();
    initSearchForm();
    initAISearch();
    initChatButton();
    initPropertyCards();
    initNavbarScroll();
    initImagePlaceholders();
    initUserNavbar(); // Khởi tạo navbar người dùng
    initNotificationAndFavoriteButtons(); // Điều hướng khi click icon chuông/trái tim
    initFooterPartial(); // Nạp footer dùng partial cho tất cả các trang
    loadFeaturedProperties(); // Load dữ liệu phòng nổi bật
    // JS trang Liên hệ đã tách riêng trong /js/contact.js
});

// ===================================
// 1.5. XỬ LÝ GOOGLE OAUTH CALLBACK
// ===================================
function handleGoogleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const userEncoded = urlParams.get('user');
    
    if (authStatus === 'success' && token && userEncoded) {
        try {
            // Decode user data từ base64 với UTF-8 encoding
            const userDataJson = decodeURIComponent(escape(atob(userEncoded)));
            const userData = JSON.parse(userDataJson);
            
            // Lưu token và user data vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            console.log('✅ Google login successful:', userData);
            
            // Xóa URL params và reload để cập nhật navbar
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Cập nhật navbar ngay lập tức
            if (window.HomeRent && window.HomeRent.updateNavbarAfterLogin) {
                window.HomeRent.updateNavbarAfterLogin(userData);
            } else {
                // Reload trang để cập nhật navbar
                window.location.reload();
            }
        } catch (error) {
            console.error('❌ Error processing Google auth callback:', error);
        }
    }
}

// ===================================
// 2. SCROLL TO TOP - Nút cuộn lên đầu
// ===================================
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    if (!scrollTopBtn) return;
    
    // Hiển thị/ẩn nút khi scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    
    // Xử lý click - cuộn lên đầu trang
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// 3. COUNTER ANIMATION - Hiệu ứng đếm số
// ===================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    
    if (counters.length === 0) return;
    
    // Tạo Intersection Observer để theo dõi khi phần tử xuất hiện
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target); // Chỉ chạy 1 lần
            }
        });
    }, observerOptions);
    
    // Theo dõi tất cả các counter
    counters.forEach(counter => observer.observe(counter));
}

/**
 * Hàm animate số đếm từ 0 đến giá trị target
 * @param {HTMLElement} element - Phần tử cần animate
 */
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000; // 2 giây
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(function() {
        current += increment;
        
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

/**
 * Format số với dấu phẩy ngăn cách hàng nghìn
 * @param {number} num - Số cần format
 * @returns {string} - Số đã được format
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ===================================
// 4. SEARCH FORM - Form tìm kiếm
// ===================================
function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    
    if (!searchForm) return;
    
    // Ngăn form submit khi nhấn Enter trong NLP search input
    const nlpInput = document.getElementById('heroNlpSearch');
    if (nlpInput) {
        nlpInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.stopPropagation(); // Ngăn event bubble lên form
            }
        });
    }
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Lấy giá trị từ form
        const propertyType = document.getElementById('propertyType').value;
        const location = document.getElementById('location').value;
        const priceRange = document.getElementById('priceRange').value;
        
        // Tạo query string
        const params = new URLSearchParams();
        if (propertyType) params.append('type', propertyType);
        if (location) params.append('location', location);
        if (priceRange) params.append('price', priceRange);
        
        // Redirect đến trang kết quả tìm kiếm
        const queryString = params.toString();
        window.location.href = `/properties${queryString ? '?' + queryString : ''}`;
    });
}

// ===================================
// 5. AI SEARCH - Tìm kiếm bằng AI
// ===================================
function initAISearch() {
    const aiSearchBtn = document.getElementById('aiSearchBtn');
    
    if (!aiSearchBtn) return;
    
    aiSearchBtn.addEventListener('click', function() {
        // Mở modal AI search từ ai-search.js
        if (window.aiSearch && typeof window.aiSearch.openModal === 'function') {
            window.aiSearch.openModal();
        } else {
            console.error('AI Search module not loaded');
        }
    });
}

/**
 * Hiển thị modal tìm kiếm bằng AI (deprecated - sử dụng window.aiSearch.openModal())
 */
function showAISearchModal() {
    // Redirect to new implementation
    if (window.aiSearch && typeof window.aiSearch.openModal === 'function') {
        window.aiSearch.openModal();
    }
}

// ===================================
// 6. CHAT BUTTON - Nút chat AI
// ===================================
function initChatButton() {
    const chatBtn = document.getElementById('chatBtn');
    
    if (!chatBtn) return;
    
    chatBtn.addEventListener('click', function() {
        // Mở cửa sổ chat AI (sẽ implement sau)
        openChatWindow();
    });
}

/**
 * Mở cửa sổ chat với AI
 */
function openChatWindow() {
    console.log('Opening chat window...');
    alert('💬 Chatbot AI đang được phát triển!\n\nSẽ hỗ trợ bạn 24/7 trong thời gian sớm nhất.');
}

// ===================================
// 7. PROPERTY CARDS - Xử lý card phòng trọ
// ===================================
function initPropertyCards() {
    const propertyCards = document.querySelectorAll('.property-card');
    
    if (propertyCards.length === 0) return;
    
    propertyCards.forEach(card => {
        // Thêm hiệu ứng khi hover
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
        
        // Click vào card (trừ nút) sẽ chuyển đến trang chi tiết
        card.addEventListener('click', function(e) {
            // Bỏ qua nếu click vào nút hoặc link
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            // Lấy link từ nút "Xem chi tiết"
            const detailLink = this.querySelector('a[href^="/properties/"]');
            if (detailLink) {
                window.location.href = detailLink.href;
            }
        });
    });
}

// ===================================
// 8. NAVBAR SCROLL - Hiệu ứng navbar khi scroll
// ===================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
}

// ===================================
// 9. IMAGE PLACEHOLDERS - Xử lý ảnh placeholder
// ===================================
function initImagePlaceholders() {
    // Tạo ảnh placeholder cho các ảnh chưa có
    const images = document.querySelectorAll('img[src*="/images/"]');
    
    images.forEach(img => {
        // Xử lý lỗi khi ảnh không tải được
        img.addEventListener('error', function() {
            // Tạo placeholder với màu ngẫu nhiên
            const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Tạo canvas làm placeholder
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            // Vẽ background màu
            ctx.fillStyle = randomColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ icon home
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = 'bold 100px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏠', canvas.width / 2, canvas.height / 2);
            
            // Set canvas làm src
            this.src = canvas.toDataURL();
            this.alt = 'Placeholder image';
        });
    });
}

// ===================================
// 10. LOADING OVERLAY - Overlay loading
// ===================================
let loadingOverlay = null;

/**
 * Hiển thị loading overlay
 * @param {string} message - Thông báo hiển thị
 */
function showLoading(message = 'Đang tải...') {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
        
        loadingOverlay.innerHTML = `
            <div style="text-align:center;color:white;">
                <div style="width:50px;height:50px;border:5px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;margin:0 auto 20px;animation:spin 1s linear infinite;"></div>
                <p class="loading-message" style="font-size:16px;margin:0;"></p>
            </div>
        `;
        
        document.body.appendChild(loadingOverlay);
        
        // Add spin animation if not exists
        if (!document.getElementById('loading-spin-animation')) {
            const style = document.createElement('style');
            style.id = 'loading-spin-animation';
            style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(style);
        }
    }
    
    const messageEl = loadingOverlay.querySelector('.loading-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
}

/**
 * Ẩn loading overlay
 */
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// ===================================
// 11. UTILITIES - Các hàm tiện ích
// ===================================

/**
 * Format giá tiền VND
 * @param {number} price - Giá cần format
 * @returns {string} - Giá đã format
 */
function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + ' triệu';
    }
    return price.toLocaleString('vi-VN') + ' đ';
}

/**
 * Debounce function - Giảm số lần gọi hàm
 * @param {Function} func - Hàm cần debounce
 * @param {number} wait - Thời gian chờ (ms)
 * @returns {Function} - Hàm đã được debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function - Giới hạn số lần gọi hàm
 * @param {Function} func - Hàm cần throttle
 * @param {number} limit - Thời gian giới hạn (ms)
 * @returns {Function} - Hàm đã được throttle
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show toast notification
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, error, info, warning, danger)
 */
function showToast(message, type = 'info') {
    // Kiểm tra nếu có Bootstrap
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toastContainer = document.querySelector('.toast-container');
        
        if (!toastContainer) {
            const container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        document.querySelector('.toast-container').appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    } else {
        // Fallback: Custom toast không cần Bootstrap
        let toastContainer = document.getElementById('custom-toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'custom-toast-container';
            toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(toastContainer);
        }
        
        const toastEl = document.createElement('div');
        
        const colors = {
            'success': { bg: '#10b981', icon: 'check-circle' },
            'error': { bg: '#ef4444', icon: 'times-circle' },
            'danger': { bg: '#ef4444', icon: 'times-circle' },
            'warning': { bg: '#f59e0b', icon: 'exclamation-triangle' },
            'info': { bg: '#3b82f6', icon: 'info-circle' }
        };
        
        const color = colors[type] || colors.info;
        
        toastEl.style.cssText = `background:${color.bg};color:white;padding:16px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;min-width:300px;max-width:500px;animation:slideInRight 0.3s ease-out;`;
        
        toastEl.innerHTML = `
            <i class="fas fa-${color.icon}" style="font-size:20px;"></i>
            <span style="flex:1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:white;cursor:pointer;font-size:20px;padding:0;width:24px;height:24px;">×</button>
        `;
        
        toastContainer.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toastEl.remove(), 300);
        }, 3000);
    }
    
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = '@keyframes slideInRight{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOutRight{from{transform:translateX(0);opacity:1}to{transform:translateX(400px);opacity:0}}';
        document.head.appendChild(style);
    }
}

/**
 * Validate email format
 * @param {string} email - Email cần validate
 * @returns {boolean} - true nếu email hợp lệ
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate phone number (Vietnam)
 * @param {string} phone - Số điện thoại cần validate
 * @returns {boolean} - true nếu số điện thoại hợp lệ
 */
function validatePhone(phone) {
    const re = /^(0|\+84)[0-9]{9,10}$/;
    return re.test(phone);
}

// ===================================
// 12. USER NAVBAR - Quản lý navbar người dùng
// ===================================
function initUserNavbar() {
    // Kiểm tra xem có navbar elements không
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    // Nếu không có elements navbar, bỏ qua
    if (!guestNav && !userNav) {
        console.log('⚠️ No navbar elements found, skipping navbar initialization');
        return;
    }

    // Kiểm tra token từ localStorage hoặc cookie
    const token = localStorage.getItem('token') || getCookie('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        // Người dùng đã đăng nhập
        try {
            const user = JSON.parse(userData);
            showUserNavbar(user);
        } catch (error) {
            console.error('Error parsing user data:', error);
            showGuestNavbar();
        }
    } else {
        // Người dùng chưa đăng nhập
        showGuestNavbar();
    }
}

/**
 * Hiển thị navbar cho người dùng đã đăng nhập
 */
function showUserNavbar(user) {
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    if (guestNav) guestNav.style.display = 'none';
    if (userNav) {
        userNav.style.display = 'flex';
        
        // Cập nhật thông tin người dùng
        updateUserInfo(user);
    }
}

/**
 * Hiển thị navbar cho khách (chưa đăng nhập)
 */
function showGuestNavbar() {
    const guestNav = document.getElementById('navbarGuest');
    const userNav = document.getElementById('navbarUser');
    
    if (guestNav) guestNav.style.display = 'flex';
    if (userNav) userNav.style.display = 'none';
}

/**
 * Cập nhật thông tin người dùng trong navbar
 */
function updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    
    if (userName) userName.textContent = user.name || 'Người dùng';
    if (userEmail) userEmail.textContent = user.email || 'user@example.com';
    
    // Hiển thị nút Admin Panel nếu user là admin
    if (adminPanelBtn && user.role === 'admin') {
        adminPanelBtn.style.display = 'block';
    } else if (adminPanelBtn) {
        adminPanelBtn.style.display = 'none';
    }
    
    // Cập nhật avatar nếu có
    if (user.avatar && userAvatar) {
        userAvatar.src = user.avatar;
    } else if (userAvatar) {
        // Tạo avatar từ chữ cái đầu của tên
        const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
        const colors = ['0d6efd', '6f42c1', 'dc3545', 'fd7e14', '198754'];
        const bgColor = colors[Math.floor(Math.random() * colors.length)];
        userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff`;
    }
}

/**
 * Lấy giá trị cookie theo tên
 */
function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
}

/**
 * Xử lý đăng xuất
 */
function handleLogout(event) {
    event.preventDefault();
    
    // Xóa dữ liệu từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Xóa cookie token
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Hiển thị navbar khách
    showGuestNavbar();
    
    // Chuyển hướng về trang chủ
    window.location.href = '/';
}

/**
 * Hàm để cập nhật navbar sau khi đăng nhập
 * Sử dụng từ trang đăng nhập
 */
function updateNavbarAfterLogin(userData) {
    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Cập nhật navbar
    showUserNavbar(userData);
    
    console.log('✅ Navbar updated after login');
}

// ===================================
// 13. EXPORT - Xuất các hàm để sử dụng
// ===================================
// Các hàm có thể được gọi từ file khác
window.HomeRent = {
    formatPrice,
    formatNumber,
    showLoading,
    hideLoading,
    showToast,
    validateEmail,
    validatePhone,
    debounce,
    throttle,
    updateNavbarAfterLogin,
    handleLogout,
    showUserNavbar,
    showGuestNavbar
};

// ===================================
// 14. ERROR HANDLING - Xử lý lỗi toàn cục
// ===================================
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Có thể gửi error đến server để tracking
});

// Xử lý unhandled promise rejection
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// ===================================
// 15. PERFORMANCE - Theo dõi performance
// ===================================
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Page load time: ${pageLoadTime}ms`);
        }, 0);
    });
}

// CONTACT PAGE logic đã tách sang /js/contact.js

// ===================================
// 16. NAV ICON SHORTCUTS - Điều hướng icon thông báo và yêu thích
// ===================================
function initNotificationAndFavoriteButtons() {
    const notifBtns = document.querySelectorAll('button.btn-icon-navbar[title="Thông báo"]');
    const favBtns = document.querySelectorAll('button.btn-icon-navbar[title="Yêu thích"]');
    
    notifBtns.forEach(btn => {
        // Điều hướng đến trang thông báo
        btn.addEventListener('click', () => { window.location.href = '/notifications'; }, { once: false });
    });
    
    favBtns.forEach(btn => {
        // Điều hướng đến trang yêu thích
        btn.addEventListener('click', () => { window.location.href = '/favorites'; }, { once: false });
    });
}

// ===================================
// END OF SCRIPT
// ===================================
console.log('✅ All scripts initialized successfully');

// ===================================
// 17. FOOTER PARTIAL - Nạp nội dung footer cho mọi trang
// ===================================
function initFooterPartial() {
    try {
        const footerEl = document.querySelector('footer');
        if (!footerEl) {
            // Không log warning vì một số trang có thể không có footer
            return;
        }

        fetch('/views/partials/footer.html', { cache: 'no-cache' })
            .then(res => {
                if (!res.ok) throw new Error('Footer partial fetch failed');
                return res.text();
            })
            .then(html => {
                footerEl.innerHTML = html;

                // Gắn sự kiện Đăng ký nhận bản tin
                const emailInput = footerEl.querySelector('input[type="email"]');
                const subscribeBtn = footerEl.querySelector('button[type="button"]');
                if (subscribeBtn && emailInput) {
                    subscribeBtn.addEventListener('click', () => {
                        const email = emailInput.value.trim();
                        const isValid = window.HomeRent && window.HomeRent.validateEmail
                            ? window.HomeRent.validateEmail(email)
                            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

                        if (!isValid) {
                            window.HomeRent && window.HomeRent.showToast
                                ? window.HomeRent.showToast('Email không hợp lệ', 'warning')
                                : alert('Email không hợp lệ');
                            return;
                        }

                        // Hiện tại demo: chỉ hiện thông báo
                        window.HomeRent && window.HomeRent.showToast
                            ? window.HomeRent.showToast('Đã đăng ký nhận bản tin!', 'success')
                            : alert('Đã đăng ký nhận bản tin!');

                        emailInput.value = '';
                    });
                }

                // Gắn sự kiện cho liên kết mạng xã hội (demo)
                footerEl.querySelectorAll('.social-links a').forEach(a => {
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.HomeRent && window.HomeRent.showToast
                            ? window.HomeRent.showToast('Tính năng mạng xã hội sẽ được tích hợp sau', 'info')
                            : alert('Tính năng mạng xã hội sẽ được tích hợp sau');
                    });
                });
            })
            .catch(err => {
                console.error('❌ Không thể nạp footer partial:', err);
            });
    } catch (error) {
        console.error('Footer init error:', error);
    }
}

// ===================================
// 17. HORIZONTAL SCROLL - Drag to scroll
// ===================================
function initHorizontalScroll() {
    const container = document.getElementById('featuredProperties');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');
    
    if (!container) return;
    
    // Drag to scroll
    let isDown = false;
    let startX;
    let scrollLeft;
    
    container.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.add('active');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    });
    
    container.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('active');
    });
    
    container.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('active');
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Tốc độ scroll x2
        container.scrollLeft = scrollLeft - walk;
    });
    
    // Scroll buttons
    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            container.scrollBy({
                left: -400,
                behavior: 'smooth'
            });
        });
    }
    
    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => {
            container.scrollBy({
                left: 400,
                behavior: 'smooth'
            });
        });
    }
    
    // Ẩn/hiện nút scroll dựa vào vị trí
    function updateScrollButtons() {
        if (!scrollLeftBtn || !scrollRightBtn) return;
        
        if (container.scrollLeft <= 0) {
            scrollLeftBtn.style.opacity = '0.3';
            scrollLeftBtn.style.pointerEvents = 'none';
        } else {
            scrollLeftBtn.style.opacity = '1';
            scrollLeftBtn.style.pointerEvents = 'auto';
        }
        
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
            scrollRightBtn.style.opacity = '0.3';
            scrollRightBtn.style.pointerEvents = 'none';
        } else {
            scrollRightBtn.style.opacity = '1';
            scrollRightBtn.style.pointerEvents = 'auto';
        }
    }
    
    container.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons(); // Init
}

// ===================================
// 18. LOAD FEATURED PROPERTIES - Load phòng nổi bật
// ===================================
async function loadFeaturedProperties() {
    const container = document.getElementById('featuredProperties');
    
    if (!container) return; // Không phải trang chủ
    
    try {
        // Fetch dữ liệu từ API - CHỈ LẤY PHÒNG ĐÃ DUYỆT (moderationDecision=auto_approved được tự động filter ở backend)
        const response = await fetch('/api/properties?limit=6&sort=-createdAt');
        
        if (!response.ok) {
            throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        const properties = data.data || [];
        
        if (properties.length === 0) {
            container.innerHTML = '<div class="col-span-3 text-center py-12"><p class="text-gray-500">Chưa có phòng nào được đăng</p></div>';
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Render các property cards
        properties.forEach(property => {
            const card = createPropertyCard(property);
            container.innerHTML += card;
        });
        
        // Reinit property cards sau khi render
        initPropertyCards();
        
        // Khởi tạo horizontal scroll sau khi render xong
        setTimeout(() => {
            initHorizontalScroll();
        }, 100);
        
    } catch (error) {
        console.error('Error loading properties:', error);
        container.innerHTML = '<div class="col-span-3 text-center py-12"><p class="text-red-500">Không thể tải dữ liệu phòng. Vui lòng thử lại sau.</p></div>';
    }
}

/**
 * Tạo HTML cho property card
 * @param {Object} property - Dữ liệu phòng
 * @returns {String} HTML string
 */
function createPropertyCard(property) {
    // Debug: Log property để kiểm tra
    console.log('Creating card for property:', property._id, property.location);
    
    // Format giá
    const price = (property.price / 1000000).toFixed(1);
    
    // Lấy ảnh đầu tiên hoặc placeholder
    const image = property.images && property.images.length > 0 
        ? property.images[0] 
        : '/images/property-placeholder.jpg';
    
    // Tạo danh sách tiện nghi
    const amenities = [];
    if (property.amenities) {
        if (property.amenities.wifi) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-wifi mr-1"></i>Wifi</span>');
        if (property.amenities.airConditioner) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-snowflake mr-1"></i>Điều hòa</span>');
        if (property.amenities.parking) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-car mr-1"></i>Xe</span>');
        if (property.amenities.kitchen) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-utensils mr-1"></i>Bếp</span>');
        if (property.amenities.waterHeater) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-bolt mr-1"></i>Nóng lạnh</span>');
    }
    
    // Tính rating trung bình (giả định có trong property.averageRating)
    const rating = property.averageRating || 0;
    const reviewCount = property.reviewCount || 0;
    
    // Badge trạng thái - CHỈ hiển thị nếu đã duyệt
    let statusBadge = '';
    if (property.status === 'available') {
        statusBadge = '<span class="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs rounded-full">Còn trống</span>';
    } else if (property.status === 'rented') {
        statusBadge = '<span class="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Đã thuê</span>';
    }
    // Nếu status là 'pending' hoặc 'inactive' thì không hiển thị badge (vì API đã lọc)
    
    // Loại phòng
    const typeMap = {
        'phong-tro': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ',
        'chung-cu-mini': 'Chung cư mini'
    };
    const typeLabel = typeMap[property.type] || 'Phòng trọ';
    
    return `
        <div class="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 property-card">
            <div class="relative">
                <img src="${image}" alt="${property.title}" class="w-full h-56 object-cover" onerror="this.src='/images/property-placeholder.jpg'">
                <span class="absolute top-3 left-3 px-3 py-1 bg-gray-800 text-white text-xs rounded-full">${typeLabel}</span>
                ${statusBadge}
            </div>
            
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${property.title}</h3>
                    <div class="text-right">
                        <div class="text-xl font-bold text-gray-800">${price} triệu</div>
                        <div class="text-xs text-gray-500">/tháng</div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <p class="text-sm text-gray-700 font-medium mb-1">
                        <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${property.address?.street || property.location?.address || 'Chưa cập nhật'}
                    </p>
                    <p class="text-xs text-gray-500 ml-5">
                        ${property.address?.ward ? property.address.ward + ', ' : ''}${property.address?.district || property.location?.district || ''}, ${property.address?.city || property.location?.province || ''}
                    </p>
                </div>
                
                <div class="flex gap-4 mb-3 text-sm text-gray-600">
                    <span><i class="fas fa-expand-arrows-alt mr-1"></i>${property.area || 0}m²</span>
                    <span><i class="fas fa-bed mr-1"></i>${property.bedrooms || 0} phòng ngủ</span>
                    <span><i class="fas fa-bath mr-1"></i>${property.bathrooms || 0} WC</span>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${amenities.slice(0, 3).join('')}
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="text-sm">
                        <i class="fas fa-star text-yellow-400"></i>
                        <span class="font-semibold text-gray-800">${rating.toFixed(1)}</span>
                        <span class="text-gray-500">(${reviewCount})</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="toggleFavorite(event, '${property._id}')" 
                                class="px-3 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors duration-300 favorite-btn"
                                title="Lưu tin"
                                data-favorite-property="${property._id}">
                            <i class="far fa-heart"></i>
                        </button>
                        <button onclick='event.stopPropagation(); event.preventDefault(); showPropertyLocation(${JSON.stringify({
                            id: property._id,
                            lat: property.location?.coordinates?.[1] || 0,
                            lng: property.location?.coordinates?.[0] || 0,
                            title: property.title
                        })})' 
                                class="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center gap-1"
                                title="Xem vị trí trên bản đồ">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                        <a href="/properties/${property._id}" class="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-300">
                            Xem chi tiết
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Hiển thị vị trí property trên bản đồ Leaflet
 */
let mapModal = null;
let mapInstance = null;

function showPropertyLocation(data) {
    const { id, lat, lng, title } = data;
    
    // Debug: Log để kiểm tra
    console.log('Property location:', { id, lat, lng, title });
    
    // Kiểm tra tọa độ hợp lệ
    if (!lat || !lng || lat === 0 || lng === 0) {
        alert('Bất động sản này chưa có thông tin vị trí chính xác.');
        return;
    }

    // Tạo modal nếu chưa có
    if (!mapModal) {
        mapModal = document.createElement('div');
        mapModal.id = 'mapModal';
        mapModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4';
        mapModal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-900">
                        <i class="fas fa-map-marker-alt text-blue-500 mr-2"></i>
                        <span id="mapModalTitle">Vị trí trên bản đồ</span>
                    </h3>
                    <button onclick="closeMapModal()" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="propertyMap" style="height: 500px; width: 100%;"></div>
                <div class="p-4 bg-gray-50 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-2"></i>
                        Click và kéo để di chuyển bản đồ. Cuộn chuột để zoom in/out.
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(mapModal);

        // Đóng modal khi click bên ngoài
        mapModal.addEventListener('click', function(e) {
            if (e.target === mapModal) {
                closeMapModal();
            }
        });
    }

    // Cập nhật tiêu đề
    document.getElementById('mapModalTitle').textContent = title;

    // Hiển thị modal
    mapModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Khởi tạo hoặc cập nhật bản đồ
    setTimeout(() => {
        if (mapInstance) {
            mapInstance.remove();
        }

        // Tạo bản đồ mới với Goong Map JS
        goongjs.accessToken = '3wUhxxPZujfl6OwVJ9N7YdDlGP6pJU62zw5PT4pg';
        mapInstance = new goongjs.Map({
            container: 'propertyMap',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [lng, lat],
            zoom: 15
        });

        // Thêm marker
        const el = document.createElement('div');
        el.className = 'w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer';
        el.innerHTML = '<i class="fas fa-home text-white"></i>';
        
        const popup = new goongjs.Popup({ offset: 25 })
            .setHTML(`
                <div class="text-center">
                    <strong class="text-gray-900">${title}</strong><br>
                    <span class="text-sm text-gray-600">Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
                </div>
            `);
        
        new goongjs.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(mapInstance);
    }, 100);
}

function closeMapModal() {
    if (mapModal) {
        mapModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    // Hủy bản đồ để giải phóng bộ nhớ
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
}

// Đóng modal bằng phím ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mapModal && !mapModal.classList.contains('hidden')) {
        closeMapModal();
    }
});
