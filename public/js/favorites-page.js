/**
 * ===================================
 * FAVORITES PAGE LOADER
 * Tải và hiển thị danh sách yêu thích
 * ===================================
 */

class FavoritesPageLoader {
  constructor() {
    this.favoritesContainer = document.getElementById('favoritesList');
    this.emptyState = document.getElementById('favoritesEmpty');
    this.clearBtn = document.getElementById('clearFavorites');
    
    if (this.favoritesContainer) {
      this.init();
    }
  }

  /**
   * Khởi tạo - tải danh sách yêu thích
   */
  async init() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.count > 0) {
          this.renderFavorites(result.data);
        } else {
          this.showEmpty();
        }
      } else {
        this.showEmpty();
      }
    } catch (error) {
      console.error('Lỗi tải yêu thích:', error);
      this.showEmpty();
    }

    // Xóa tất cả
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearAll());
    }
  }

  /**
   * Render danh sách yêu thích
   */
  renderFavorites(properties) {
    this.favoritesContainer.innerHTML = '';

    properties.forEach((property) => {
      const item = document.createElement('div');
      item.className = 'favorite-item group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300';
      item.dataset.id = property._id;

      // Xử lý đường dẫn hình ảnh
      let imageUrl = '/images/property-default.jpg'; // Default image
      if (property.images && property.images.length > 0) {
        const firstImage = property.images[0];
        // Kiểm tra nếu đã có đường dẫn đầy đủ (http/https) hoặc bắt đầu với /
        if (firstImage.startsWith('http://') || firstImage.startsWith('https://') || firstImage.startsWith('/')) {
          imageUrl = firstImage;
        } else {
          // Nếu chỉ là tên file, thêm /uploads/ vào trước
          imageUrl = `/uploads/${firstImage}`;
        }
      }

      const price = new Intl.NumberFormat('vi-VN').format(property.price);
      
      // Xử lý địa chỉ - kiểm tra xem là string hay object
      let addressText = '';
      if (typeof property.address === 'string') {
        addressText = property.address;
      } else if (property.address && typeof property.address === 'object') {
        // Nếu có full address thì dùng
        if (property.address.full) {
          addressText = property.address.full;
        } else {
          // Ghép từ các phần
          const parts = [
            property.address.street,
            property.address.ward,
            property.address.district,
            property.address.city
          ].filter(part => part); // Lọc bỏ các phần undefined/null
          addressText = parts.join(', ');
        }
      } else {
        addressText = 'Chưa có địa chỉ';
      }

      item.innerHTML = `
        <div class="relative overflow-hidden bg-gray-200 h-48">
          <img src="${imageUrl}" alt="${property.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
          <span class="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <i class="fas fa-heart mr-1"></i>Yêu thích
          </span>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-gray-800">${property.title}</h3>
            <div class="text-right">
              <div class="text-primary font-bold">${price}</div>
              <small class="text-gray-500">/tháng</small>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            <i class="fas fa-map-marker-alt mr-1 text-red-500"></i>${addressText}
          </p>
          <div class="flex gap-2">
            <a href="/properties/${property._id}" class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 text-center">
              <i class="fas fa-eye mr-1"></i>Xem chi tiết
            </a>
            <button class="remove-favorite px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200" onclick="removeFavoriteItem('${property._id}')">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;

      this.favoritesContainer.appendChild(item);
    });

    if (this.emptyState) {
      this.emptyState.classList.add('hidden');
    }
  }

  /**
   * Hiển thị trạng thái trống
   */
  showEmpty() {
    this.favoritesContainer.innerHTML = '';
    if (this.emptyState) {
      this.emptyState.classList.remove('hidden');
    }
  }

  /**
   * Xóa tất cả yêu thích
   */
  async clearAll() {
    if (!confirm('Bạn chắc chắn muốn xóa tất cả yêu thích?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.showEmpty();
        this.showNotification('Đã xóa tất cả yêu thích', 'success');
        
        // Cập nhật badge về 0
        updateFavoritesBadge();
      }
    } catch (error) {
      console.error('Lỗi:', error);
      this.showNotification('Có lỗi khi xóa', 'error');
    }
  }

  /**
   * Hiển thị thông báo
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-slideDown ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

/**
 * Xóa một item yêu thích
 */
async function removeFavoriteItem(propertyId) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth/login';
    return;
  }

  try {
    const response = await fetch(`/api/favorites/${propertyId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const item = document.querySelector(`[data-id="${propertyId}"]`);
      if (item) {
        item.remove();
      }
      
      // Cập nhật badge số lượng yêu thích
      updateFavoritesBadge();
      
      // Kiểm tra nếu không còn item nào
      const items = document.querySelectorAll('.favorite-item');
      if (items.length === 0) {
        const loader = new FavoritesPageLoader();
        loader.showEmpty();
      }
    }
  } catch (error) {
    console.error('Lỗi:', error);
  }
}

/**
 * Cập nhật badge số lượng yêu thích trên header
 */
function updateFavoritesBadge() {
  const badge = document.getElementById('favoriteBadge');
  if (badge) {
    const items = document.querySelectorAll('.favorite-item');
    const count = items.length;
    
    badge.textContent = count;
    
    // Ẩn badge nếu không có yêu thích
    if (count === 0) {
      badge.classList.add('hidden');
    } else {
      badge.classList.remove('hidden');
    }
  }
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new FavoritesPageLoader();
});
