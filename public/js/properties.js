/**
 * Properties Page JavaScript
 * Handles property listing with dynamic data from API
 */

let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const itemsPerPage = 9; // 3x3 grid
let smartSearch = null; // Smart Search instance

/**
 * Initialize properties page
 */
async function initPropertiesPage() {
    try {
        // Khởi tạo Smart Search
        smartSearch = new SmartSearch();
        
        await loadProperties();
        setupEventListeners();
        setupSmartSearch(); // Setup NLP search
        applyURLFilters(); // Apply filters from URL params
    } catch (error) {
        console.error('Error initializing properties page:', error);
    }
}

/**
 * Setup Smart Search (NLP)
 */
function setupSmartSearch() {
    const nlpInput = document.getElementById('propertiesNlpSearch');
    const voiceBtn = document.getElementById('propertiesVoiceBtn');
    
    if (nlpInput) {
        // Enter key to search
        nlpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSmartSearch(nlpInput.value);
            }
        });
    }
    
    // Voice search
    if (voiceBtn && 'webkitSpeechRecognition' in window) {
        voiceBtn.addEventListener('click', () => {
            startVoiceSearch(nlpInput);
        });
    }
}

/**
 * Voice Search
 */
function startVoiceSearch(inputElement) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        console.log('🎤 Voice search started');
        if (inputElement) {
            inputElement.placeholder = '🎤 Đang nghe...';
        }
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice result:', transcript);
        
        if (inputElement) {
            inputElement.value = transcript;
            inputElement.placeholder = 'Tìm kiếm thông minh...';
        }
        
        performSmartSearch(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Voice search error:', event.error);
        if (inputElement) {
            inputElement.placeholder = 'Tìm kiếm thông minh...';
        }
        alert('Lỗi tìm kiếm giọng nói. Vui lòng thử lại!');
    };
    
    recognition.onend = () => {
        console.log('🎤 Voice search ended');
        if (inputElement) {
            inputElement.placeholder = 'Tìm kiếm thông minh...';
        }
    };
    
    recognition.start();
}

/**
 * Perform Smart Search
 */
function performSmartSearch(query) {
    if (!query || !query.trim()) {
        alert('Vui lòng nhập câu tìm kiếm!');
        return;
    }
    
    console.log('🔍 Smart searching:', query);
    
    // Perform search
    const result = smartSearch.search(query, allProperties);
    
    console.log('Search result:', result);
    
    // Show result summary
    const summary = smartSearch.generateSummary(result.filters);
    showSearchSummary(query, summary, result.count);
    
    // Update filtered properties
    filteredProperties = result.data;
    currentPage = 1;
    renderProperties();
    
    // Scroll to results
    document.querySelector('#featuredProperties').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show search summary
 */
function showSearchSummary(query, summary, count) {
    // Tìm header section
    const headerSection = document.querySelector('.text-2xl.font-bold.text-gray-900.mb-2');
    if (headerSection) {
        headerSection.innerHTML = `
            Kết quả tìm kiếm
            <div style="font-size: 0.9rem; font-weight: normal; color: #3498db; margin-top: 0.5rem;">
                🔍 "${query}" → ${summary}
            </div>
        `;
        
        const descElement = headerSection.nextElementSibling;
        if (descElement) {
            descElement.textContent = `Tìm thấy ${count} phòng phù hợp với yêu cầu`;
        }
    }
}

/**
 * Load properties from API
 */
async function loadProperties() {
    try {
        const response = await fetch('/api/properties');
        const data = await response.json();
        
        if (data.success) {
            allProperties = data.data;
            filteredProperties = [...allProperties];
            renderProperties();
        } else {
            throw new Error(data.message || 'Failed to load properties');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        showError('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
    }
}

/**
 * Render properties to grid
 */
function renderProperties() {
    const container = document.getElementById('featuredProperties');
    
    if (!container) {
        console.error('Properties container not found');
        return;
    }
    
    if (filteredProperties.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12" style="margin: auto;">
                <i class="fas fa-home text-6xl text-black-300 mb-4"></i>
                <p class="text-black-500 text-lg">Không tìm thấy phòng nào phù hợp</p>
            </div>
        `;
        renderPagination(0, 0);
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    // Render properties
    container.innerHTML = currentProperties.map(property => createPropertyCard(property)).join('');
    
    // Render pagination
    renderPagination(totalPages, filteredProperties.length);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Create property card HTML
 */
function createPropertyCard(property) {
    // Định dạng giá
    const price = (property.price / 1000000).toFixed(1);
    
    // Lấy ảnh đầu tiên hoặc placeholder
    const image = property.images?.[0] || '/images/property-placeholder.jpg';
    
    // Tạo danh sách tiện nghi
    const amenities = [];
    if (property.amenities) {
        if (property.amenities.wifi) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-wifi mr-1"></i>Wifi</span>');
        if (property.amenities.airConditioner) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-snowflake mr-1"></i>Điều hòa</span>');
        if (property.amenities.parking) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-car mr-1"></i>Xe</span>');
        if (property.amenities.kitchen) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-utensils mr-1"></i>Bếp</span>');
        if (property.amenities.waterHeater) amenities.push('<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"><i class="fas fa-bolt mr-1"></i>Nóng lạnh</span>');
    }
    
    // Loại phòng - hỗ trợ cả slug và display name từ DB
    const typeMap = {
        'phong-tro': 'Phòng trọ', 'Phòng trọ': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn', 'Nhà nguyên căn': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ', 'Căn hộ': 'Căn hộ',
        'chung-cu-mini': 'Chung cư mini', 'Chung cư mini': 'Chung cư mini',
        'studio': 'Studio', 'Studio': 'Studio',
        'homestay': 'Homestay', 'Homestay': 'Homestay'
    };
    const typeLabel = typeMap[property.propertyType] || typeMap[property.type] || 'Phòng trọ';
    
    // Badge trạng thái
    const statusBadge = property.status === 'available' 
        ? '<span class="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs rounded-full">Còn trống</span>'
        : '<span class="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs rounded-full">Đã thuê</span>';
    
    // Tọa độ từ database
    const lat = property.location?.coordinates?.[1] || 0;
    const lng = property.location?.coordinates?.[0] || 0;
    
    return `
        <div class="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
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
                
                <div class="flex gap-4 mb-4 text-sm text-gray-600">
                    <span><i class="fas fa-expand-arrows-alt mr-1"></i>${property.area || 0}m²</span>
                    <span><i class="fas fa-bed mr-1"></i>${property.bedrooms || 0} phòng ngủ</span>
                    <span><i class="fas fa-bath mr-1"></i>${property.bathrooms || 0} WC</span>
                </div>
                
                ${amenities.length > 0 ? `
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${amenities.slice(0, 3).join('')}
                    </div>
                ` : ''}
                
                <div class="flex gap-2">
                    <button onclick="toggleFavorite(event, '${property._id}')" 
                            class="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors duration-300 favorite-btn"
                            title="Lưu tin"
                            data-favorite-property="${property._id}">
                        <i class="far fa-heart"></i>
                    </button>
                    <button onclick='event.stopPropagation(); event.preventDefault(); showPropertyLocation(${JSON.stringify({
                        id: property._id,
                        lat: lat,
                        lng: lng,
                        title: property.title
                    })})' 
                            class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-300"
                            title="Xem vị trí trên bản đồ">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <a href="/properties/${property._id}" class="flex-1 text-center px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-300">
                        Xem chi tiết
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search form submit - CHỈ lọc khi bấm nút "Tìm kiếm"
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterProperties();
        });
    }
    
    // ❌ BỎ: Không tự động lọc khi thay đổi dropdown
    // Chỉ lọc khi user bấm nút "Tìm kiếm"
    
    // Sort - Vẫn tự động sắp xếp khi thay đổi
    const sortSelect = document.querySelector('select[name="sort"]');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortProperties);
    }
}

/**
 * Apply filters from URL parameters
 */
function applyURLFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Apply type filter
    const type = urlParams.get('type');
    if (type) {
        const typeSelect = document.querySelector('select[name="type"]');
        if (typeSelect) {
            typeSelect.value = type;
        }
    }
    
    // Apply location filter
    const location = urlParams.get('location');
    if (location) {
        const locationSelect = document.querySelector('select[name="location"]');
        if (locationSelect) {
            locationSelect.value = location;
        }
    }
    
    // Apply price filter
    const price = urlParams.get('price');
    if (price) {
        const priceSelect = document.querySelector('select[name="price"]');
        if (priceSelect) {
            priceSelect.value = price;
        }
    }
    
    // Apply filters if any param exists
    if (type || location || price) {
        filterProperties();
    }
}

/**
 * Filter properties
 */
function filterProperties() {
    const typeSelect = document.querySelector('select[name="type"]');
    const locationSelect = document.querySelector('select[name="location"]');
    const priceSelect = document.querySelector('select[name="price"]');
    
    const selectedType = typeSelect?.value || '';
    const selectedLocation = locationSelect?.value || '';
    const selectedPrice = priceSelect?.value || '';
    
    filteredProperties = allProperties.filter(property => {
        // Filter by type (sử dụng propertyType thay vì type)
        if (selectedType) {
            const propertyType = property.propertyType || '';
            
            // Normalize để so sánh (hỗ trợ cả slug và display name)
            const typeMapping = {
                'phong-tro': 'Phòng trọ', 'Phòng trọ': 'Phòng trọ',
                'nha-nguyen-can': 'Nhà nguyên căn', 'Nhà nguyên căn': 'Nhà nguyên căn',
                'can-ho': 'Căn hộ', 'Căn hộ': 'Căn hộ',
                'chung-cu-mini': 'Chung cư mini', 'Chung cư mini': 'Chung cư mini',
                'studio': 'Studio', 'Studio': 'Studio',
                'homestay': 'Homestay', 'Homestay': 'Homestay'
            };
            
            const normalizedPropertyType = typeMapping[propertyType] || propertyType;
            const normalizedSelectedType = typeMapping[selectedType] || selectedType;
            
            if (normalizedPropertyType !== normalizedSelectedType) {
                return false;
            }
        }
        
        // Filter by location (city)
        if (selectedLocation) {
            const propertyCity = property.address?.city || property.location?.province || '';
            // So sánh không phân biệt hoa thường và loại bỏ dấu
            const normalizedCity = propertyCity.toLowerCase().replace(/\./g, '').replace(/tp\s*/g, '');
            const normalizedFilter = selectedLocation.toLowerCase().replace(/\./g, '').replace(/tp\s*/g, '');
            
            if (!normalizedCity.includes(normalizedFilter) && !normalizedFilter.includes(normalizedCity)) {
                return false;
            }
        }
        
        // Filter by price range
        if (selectedPrice) {
            const price = property.price / 1000000;
            switch(selectedPrice) {
                case 'under-3':
                    if (price >= 3) return false;
                    break;
                case '3-5':
                    if (price < 3 || price >= 5) return false;
                    break;
                case '5-10':
                    if (price < 5 || price >= 10) return false;
                    break;
                case 'over-10':
                    if (price < 10) return false;
                    break;
            }
        }
        
        return true;
    });
    
    // Reset to page 1 when filtering
    currentPage = 1;
    renderProperties();
}

/**
 * Sort properties
 */
function sortProperties() {
    const sortSelect = document.querySelector('select[name="sort"]');
    const sortValue = sortSelect?.value || '';
    
    switch(sortValue) {
        case 'price-asc':
            filteredProperties.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProperties.sort((a, b) => b.price - a.price);
            break;
        case 'area-desc':
            filteredProperties.sort((a, b) => b.area - a.area);
            break;
        case 'newest':
        default:
            filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }
    
    // Reset to page 1 when sorting
    currentPage = 1;
    renderProperties();
}

/**
 * Render pagination
 */
function renderPagination(totalPages, totalItems) {
    const paginationContainer = document.querySelector('.flex.justify-center.items-center.space-x-2.mt-12');
    
    if (!paginationContainer || totalPages === 0) {
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button 
            onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changePage(1)" class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                1
            </button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button 
                onclick="changePage(${i})" 
                class="px-4 py-2 ${i === currentPage ? 'bg-gray-800 text-white' : 'bg-white/90 backdrop-blur-sm border border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors duration-300">
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages})" class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                ${totalPages}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button 
            onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''}
            class="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Update results count
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    const resultsText = document.querySelector('.text-2xl.font-bold.text-gray-900.mb-2');
    if (resultsText) {
        resultsText.nextElementSibling.textContent = `Hiển thị ${startItem}-${endItem} trong tổng số ${totalItems} phòng`;
    }
}

/**
 * Change page
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    currentPage = page;
    renderProperties();
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('featuredProperties');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12" style="margin: auto;">
                <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                <p class="text-red-500 text-lg">${message}</p>
                <button onclick="loadProperties()" class="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPropertiesPage);

// AI Search button event listener
document.addEventListener('DOMContentLoaded', function() {
    const aiSearchBtn = document.getElementById('aiSearchBtn');
    if (aiSearchBtn) {
        aiSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.aiSearch && typeof window.aiSearch.openModal === 'function') {
                window.aiSearch.openModal();
            } else {
                console.error('AI Search module not loaded');
            }
        });
    }
});
