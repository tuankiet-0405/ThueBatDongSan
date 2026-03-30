/**
 * ===================================
 * GOONG ADDRESS AUTOCOMPLETE
 * Tìm kiếm địa chỉ thông minh với Goong Places API
 * ===================================
 */

// Config Goong API - Backend sẽ proxy requests
const GOONG_AUTOCOMPLETE_URL = '/api/search/autocomplete';
const GOONG_PLACE_DETAIL_URL = '/api/search/place-detail';

// State quản lý
let autocompleteTimeout = null;
let selectedPlace = null;

/**
 * Khởi tạo Goong Address Autocomplete
 */
function initGoongAutocomplete() {
    const searchInput = document.getElementById('addressSearch');
    const suggestionsBox = document.getElementById('addressSuggestions');
    const loadingIndicator = document.getElementById('addressLoading');
    const selectedDisplay = document.getElementById('selectedAddressDisplay');
    const clearBtn = document.getElementById('clearAddressBtn');
    
    if (!searchInput) {
        console.warn('⚠️ Không tìm thấy #addressSearch');
        return;
    }
    
    console.log('🗺️ Khởi tạo Goong Address Autocomplete');
    
    // Event: Input thay đổi → gọi autocomplete API
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear timeout cũ
        if (autocompleteTimeout) {
            clearTimeout(autocompleteTimeout);
        }
        
        // Nếu query rỗng → ẩn suggestions
        if (query.length < 3) {
            hideSuggestions();
            return;
        }
        
        // Hiển thị loading
        showLoading();
        
        // Debounce 500ms trước khi gọi API
        autocompleteTimeout = setTimeout(() => {
            fetchAutocompleteSuggestions(query);
        }, 500);
    });
    
    // Event: Click bên ngoài → đóng suggestions
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            hideSuggestions();
        }
    });
    
    // Event: Clear địa chỉ đã chọn
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSelectedAddress);
    }
    
    // Event: Focus vào input → hiện lại suggestions nếu có
    searchInput.addEventListener('focus', () => {
        if (suggestionsBox.children.length > 0 && !selectedPlace) {
            suggestionsBox.classList.remove('hidden');
        }
    });
}

/**
 * Gọi Backend Search API (Goong proxy)
 */
async function fetchAutocompleteSuggestions(query) {
    const suggestionsBox = document.getElementById('addressSuggestions');
    
    try {
        console.log(`🔍 Goong Autocomplete via Backend: "${query}"`);
        
        const response = await fetch(GOONG_AUTOCOMPLETE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: query })
        });
        
        if (!response.ok) {
            throw new Error(`Backend search API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
            console.log(`✅ Tìm thấy ${data.predictions.length} gợi ý`);
            renderSuggestions(data.predictions);
        } else {
            console.log('⚠️ Không tìm thấy gợi ý');
            renderNoResults();
        }
        
    } catch (error) {
        console.error('❌ Lỗi Goong Autocomplete:', error);
        hideLoading();
        renderError();
    }
}

/**
 * Render danh sách gợi ý
 */
function renderSuggestions(predictions) {
    const suggestionsBox = document.getElementById('addressSuggestions');
    
    suggestionsBox.innerHTML = predictions.map((prediction, index) => `
        <div class="suggestion-item p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors" data-place-id="${prediction.place_id}" data-index="${index}">
            <div class="flex items-start gap-3">
                <i class="fas fa-map-marker-alt text-blue-600 mt-1"></i>
                <div class="flex-1">
                    <div class="font-semibold text-gray-800 text-sm">${highlightMatch(prediction.structured_formatting?.main_text || prediction.description, document.getElementById('addressSearch').value)}</div>
                    <div class="text-xs text-gray-600 mt-1">${prediction.structured_formatting?.secondary_text || ''}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    suggestionsBox.classList.remove('hidden');
    
    // Gắn sự kiện click cho từng suggestion
    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const placeId = item.dataset.placeId;
            selectPlace(placeId, predictions[item.dataset.index]);
        });
    });
}

/**
 * Highlight text khớp với query
 */
function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200">$1</span>');
}

/**
 * Render thông báo không có kết quả
 */
function renderNoResults() {
    const suggestionsBox = document.getElementById('addressSuggestions');
    suggestionsBox.innerHTML = `
        <div class="p-4 text-center text-gray-500 text-sm">
            <i class="fas fa-search mb-2 text-2xl text-gray-400"></i>
            <p>Không tìm thấy địa chỉ phù hợp</p>
        </div>
    `;
    suggestionsBox.classList.remove('hidden');
}

/**
 * Render thông báo lỗi
 */
function renderError() {
    const suggestionsBox = document.getElementById('addressSuggestions');
    suggestionsBox.innerHTML = `
        <div class="p-4 text-center text-red-500 text-sm">
            <i class="fas fa-exclamation-triangle mb-2 text-2xl"></i>
            <p>Lỗi khi tìm kiếm địa chỉ. Vui lòng thử lại.</p>
        </div>
    `;
    suggestionsBox.classList.remove('hidden');
}

/**
 * Chọn một địa chỉ từ gợi ý
 */
async function selectPlace(placeId, prediction) {
    console.log(`📍 Chọn địa chỉ: ${prediction.description}`);
    
    showLoading();
    
    try {
        // Gọi Backend Place Detail API (Goong proxy)
        const response = await fetch(GOONG_PLACE_DETAIL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ place_id: placeId })
        });
        
        if (!response.ok) {
            throw new Error(`Backend place detail API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.status === 'OK' && data.result) {
            const place = data.result;
            selectedPlace = {
                placeId: placeId,
                address: place.formatted_address || prediction.description,
                name: place.name,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                addressComponents: place.address_components || []
            };
            
            console.log('✅ Chi tiết địa chỉ:', selectedPlace);
            
            // Parse address components
            parseAddressComponents(selectedPlace);
            
            // Hiển thị địa chỉ đã chọn
            displaySelectedAddress(selectedPlace);
            
            // Ẩn suggestions
            hideSuggestions();
            
            // Trigger POI fetch
            if (typeof fetchNearbyPOI === 'function') {
                fetchNearbyPOI();
            }
            
        } else {
            throw new Error('Không lấy được chi tiết địa chỉ');
        }
        
    } catch (error) {
        console.error('❌ Lỗi Place Detail:', error);
        hideLoading();
        alert('Không thể lấy thông tin địa chỉ. Vui lòng thử lại.');
    }
}

/**
 * Parse address components từ Goong → điền vào hidden fields
 */
function parseAddressComponents(place) {
    const components = place.addressComponents;
    
    let street = '';
    let ward = '';
    let district = '';
    let city = '';
    let province = '';
    
    // Goong trả về address_components dạng:
    // { long_name: "...", short_name: "...", types: ["route", "political"] }
    
    components.forEach(comp => {
        const types = comp.types || [];
        
        if (types.includes('street_number') || types.includes('route')) {
            street = comp.long_name;
        } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            ward = comp.long_name;
        } else if (types.includes('administrative_area_level_2')) {
            district = comp.long_name;
        } else if (types.includes('administrative_area_level_1')) {
            // Đây là province/city level (HCM, Hà Nội, Đà Nẵng...)
            province = comp.long_name;
        } else if (types.includes('locality')) {
            city = comp.long_name;
        }
    });
    
    // Fallback: parse từ formatted_address
    // Format thường: "Tên đường, Phường, Quận, Thành phố"
    if (!province) {
        const parts = place.address.split(',').map(p => p.trim());
        
        if (parts.length >= 4) {
            street = street || parts[0];
            ward = ward || parts[1];
            district = district || parts[2];
            province = parts[parts.length - 1]; // Phần tử cuối cùng thường là tỉnh/thành
        }
    }
    
    console.log('📋 Parsed address:', { street, ward, district, city, province });
    console.log('📋 Full address components:', components);
    
    // Điền vào hidden fields
    document.getElementById('street').value = street;
    document.getElementById('ward').value = ward;
    document.getElementById('district').value = district;
    document.getElementById('province').value = province;
    document.getElementById('address').value = place.address;
    document.getElementById('latitude').value = place.lat;
    document.getElementById('longitude').value = place.lng;
    document.getElementById('placeId').value = place.placeId;
}

/**
 * Hiển thị địa chỉ đã chọn
 */
function displaySelectedAddress(place) {
    const searchInput = document.getElementById('addressSearch');
    const selectedDisplay = document.getElementById('selectedAddressDisplay');
    const selectedText = document.getElementById('selectedAddressText');
    const selectedCoords = document.getElementById('selectedCoordinates');
    
    // Set input value
    searchInput.value = place.address;
    
    // Hiển thị card địa chỉ đã chọn
    selectedText.textContent = place.address;
    selectedCoords.textContent = `📍 ${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;
    
    selectedDisplay.classList.remove('hidden');
}

/**
 * Clear địa chỉ đã chọn
 */
function clearSelectedAddress() {
    const searchInput = document.getElementById('addressSearch');
    const selectedDisplay = document.getElementById('selectedAddressDisplay');
    
    // Reset input
    searchInput.value = '';
    searchInput.focus();
    
    // Ẩn display
    selectedDisplay.classList.add('hidden');
    
    // Reset state
    selectedPlace = null;
    
    // Clear hidden fields
    document.getElementById('street').value = '';
    document.getElementById('ward').value = '';
    document.getElementById('district').value = '';
    document.getElementById('province').value = '';
    document.getElementById('address').value = '';
    document.getElementById('latitude').value = '';
    document.getElementById('longitude').value = '';
    document.getElementById('placeId').value = '';
    
    // Hide POI
    if (typeof hideNearbyPoiContainer === 'function') {
        hideNearbyPoiContainer();
    }
    
    console.log('🗑️ Đã xóa địa chỉ');
}

/**
 * Helper: Hiện/ẩn UI elements
 */
function showLoading() {
    document.getElementById('addressLoading')?.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('addressLoading')?.classList.add('hidden');
}

function hideSuggestions() {
    document.getElementById('addressSuggestions')?.classList.add('hidden');
}

// Export để dùng ở file khác
if (typeof window !== 'undefined') {
    window.initGoongAutocomplete = initGoongAutocomplete;
    window.clearSelectedAddress = clearSelectedAddress;
}
