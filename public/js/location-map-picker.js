/**
 * LOCATION MAP PICKER
 * Xử lý chức năng chọn vị trí trên bản đồ và sử dụng vị trí hiện tại
 */

(function() {
    'use strict';

    // Goong Maptiles Key - loaded from server proxy
    let GOONG_MAPTILES_KEY = '';
    
    let map = null;
    let marker = null;
    let currentLat = 10.762622; // Default: TP.HCM
    let currentLng = 106.660172;
    let selectedLocation = null;

    // DOM Elements
    const currentLocationBtn = document.getElementById('currentLocationBtn');
    const mapPickerBtn = document.getElementById('mapPickerBtn');
    const mapPickerModal = document.getElementById('mapPickerModal');
    const closeMapModal = document.getElementById('closeMapModal');
    const cancelMapBtn = document.getElementById('cancelMapBtn');
    const confirmMapBtn = document.getElementById('confirmMapBtn');
    const mapSearchInput = document.getElementById('mapSearchInput');
    const searchMapBtn = document.getElementById('searchMapBtn');
    const mapSelectedAddress = document.getElementById('mapSelectedAddress');
    const addressSearchInput = document.getElementById('addressSearch');

    /**
     * Load Maptiles key từ server (chỉ lấy key render bản đồ, không lộ API key)
     */
    async function loadMaptilesKey() {
        try {
            const response = await fetch('/api/search/maptiles-key');
            const data = await response.json();
            GOONG_MAPTILES_KEY = data.maptilesKey;
        } catch (error) {
            console.error('Error loading maptiles key:', error);
            showNotification('Không thể tải cấu hình bản đồ', 'error');
        }
    }

    /**
     * Initialize Map Picker
     */
    async function initMapPicker() {
        if (!currentLocationBtn || !mapPickerBtn) return;

        // Load maptiles key trước
        await loadMaptilesKey();

        // Event Listeners
        currentLocationBtn.addEventListener('click', handleCurrentLocation);
        mapPickerBtn.addEventListener('click', openMapPicker);
        closeMapModal.addEventListener('click', closeMapPickerModal);
        cancelMapBtn.addEventListener('click', closeMapPickerModal);
        confirmMapBtn.addEventListener('click', confirmLocationSelection);
        searchMapBtn.addEventListener('click', searchLocationOnMap);
        
        // Close modal khi click overlay
        document.querySelector('.map-picker-overlay')?.addEventListener('click', closeMapPickerModal);
        
        // Enter key để search
        mapSearchInput?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchLocationOnMap();
            }
        });
    }

    /**
     * Sử dụng vị trí hiện tại
     */
    async function handleCurrentLocation() {
        if (!navigator.geolocation) {
            showNotification('Trình duyệt của bạn không hỗ trợ định vị', 'error');
            return;
        }

        // Kiểm tra maptiles key đã load chưa
        if (!GOONG_MAPTILES_KEY) {
            await loadMaptilesKey();
        }

        // Disable button và show loading
        currentLocationBtn.disabled = true;
        currentLocationBtn.classList.add('loading');
        currentLocationBtn.innerHTML = '<i class="fas fa-spinner"></i>';

        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    // Reverse geocoding để lấy địa chỉ
                    const address = await reverseGeocode(lat, lng);
                    
                    if (address) {
                        // Cập nhật vào form
                        updateAddressFromLocation(address, lat, lng);
                        showNotification('Đã sử dụng vị trí hiện tại của bạn', 'success');
                    } else {
                        showNotification('Không thể xác định địa chỉ từ vị trí này', 'error');
                    }
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                    showNotification('Lỗi khi lấy thông tin địa chỉ', 'error');
                } finally {
                    // Reset button
                    currentLocationBtn.disabled = false;
                    currentLocationBtn.classList.remove('loading');
                    currentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                }
            },
            function(error) {
                console.error('Geolocation error:', error);
                let message = 'Không thể lấy vị trí hiện tại';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Bạn đã từ chối quyền truy cập vị trí';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Thông tin vị trí không khả dụng';
                        break;
                    case error.TIMEOUT:
                        message = 'Yêu cầu lấy vị trí đã hết thời gian';
                        break;
                }
                
                showNotification(message, 'error');
                
                // Reset button
                currentLocationBtn.disabled = false;
                currentLocationBtn.classList.remove('loading');
                currentLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 300000
            }
        );
    }

    /**
     * Reverse Geocoding - Lấy địa chỉ từ tọa độ (qua server proxy)
     */
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch('/api/search/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latlng: `${lat},${lng}` })
            });
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    formatted_address: result.formatted_address,
                    compound: result.compound,
                    latitude: lat,
                    longitude: lng,
                    place_id: result.place_id
                };
            }
            return null;
        } catch (error) {
            console.error('Reverse geocode error:', error);
            return null;
        }
    }

    /**
     * Mở modal chọn vị trí trên bản đồ
     */
    async function openMapPicker() {
        // Kiểm tra maptiles key đã load chưa
        if (!GOONG_MAPTILES_KEY) {
            await loadMaptilesKey();
        }

        mapPickerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize map nếu chưa có
        setTimeout(() => {
            if (!map) {
                initializeMap();
            } else {
                // Resize map để hiển thị đúng
                map.resize();
            }
        }, 100);
    }

    /**
     * Đóng modal
     */
    function closeMapPickerModal() {
        mapPickerModal.classList.remove('active');
        document.body.style.overflow = '';
        selectedLocation = null;
    }

    /**
     * Initialize Goong Map
     */
    function initializeMap() {
        // Load Goong Map SDK
        if (!window.goongjs) {
            loadGoongMapSDK().then(() => {
                createMap();
            });
        } else {
            createMap();
        }
    }

    /**
     * Load Goong Map SDK
     */
    function loadGoongMapSDK() {
        return new Promise((resolve, reject) => {
            // CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.css';
            document.head.appendChild(link);

            // JS
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@goongmaps/goong-js@1.0.9/dist/goong-js.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create Map Instance
     */
    function createMap() {
        goongjs.accessToken = GOONG_MAPTILES_KEY;
        
        map = new goongjs.Map({
            container: 'mapContainer',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [currentLng, currentLat],
            zoom: 15
        });

        // Add navigation controls
        map.addControl(new goongjs.NavigationControl());

        // Map move event
        map.on('moveend', async function() {
            const center = map.getCenter();
            currentLat = center.lat;
            currentLng = center.lng;
            
            // Update address display
            mapSelectedAddress.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải địa chỉ...';
            
            const address = await reverseGeocode(currentLat, currentLng);
            if (address) {
                selectedLocation = address;
                mapSelectedAddress.textContent = address.formatted_address;
                confirmMapBtn.disabled = false;
            } else {
                mapSelectedAddress.textContent = 'Không xác định được địa chỉ tại vị trí này';
                confirmMapBtn.disabled = true;
            }
        });

        // Initial address load
        map.on('load', async function() {
            const address = await reverseGeocode(currentLat, currentLng);
            if (address) {
                selectedLocation = address;
                mapSelectedAddress.textContent = address.formatted_address;
            }
        });
    }

    /**
     * Search location trên map
     */
    async function searchLocationOnMap() {
        const query = mapSearchInput.value.trim();
        if (!query) {
            showNotification('Vui lòng nhập địa chỉ cần tìm', 'warning');
            return;
        }

        searchMapBtn.disabled = true;
        searchMapBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            // Gọi qua server proxy thay vì trực tiếp Goong API
            const response = await fetch('/api/search/autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: query })
            });
            const data = await response.json();

            if (data.predictions && data.predictions.length > 0) {
                const placeId = data.predictions[0].place_id;
                
                // Get place details qua server proxy
                const detailResponse = await fetch('/api/search/place-detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ place_id: placeId })
                });
                const detailData = await detailResponse.json();

                if (detailData.result) {
                    const location = detailData.result.geometry.location;
                    currentLat = location.lat;
                    currentLng = location.lng;

                    // Move map to location
                    map.flyTo({
                        center: [currentLng, currentLat],
                        zoom: 16
                    });

                    showNotification('Đã tìm thấy vị trí', 'success');
                }
            } else {
                showNotification('Không tìm thấy địa chỉ phù hợp', 'warning');
            }
        } catch (error) {
            console.error('Search error:', error);
            showNotification('Lỗi khi tìm kiếm địa chỉ', 'error');
        } finally {
            searchMapBtn.disabled = false;
            searchMapBtn.innerHTML = '<i class="fas fa-search"></i>';
        }
    }

    /**
     * Confirm location selection
     */
    function confirmLocationSelection() {
        if (!selectedLocation) {
            showNotification('Vui lòng chọn vị trí trên bản đồ', 'warning');
            return;
        }

        updateAddressFromLocation(
            selectedLocation, 
            selectedLocation.latitude, 
            selectedLocation.longitude
        );
        
        closeMapPickerModal();
        showNotification('Đã cập nhật vị trí từ bản đồ', 'success');
    }

    /**
     * Update address form từ location data
     */
    function updateAddressFromLocation(address, lat, lng) {
        // Update search input
        addressSearchInput.value = address.formatted_address;

        // Parse address components
        const compound = address.compound || {};
        
        // Update hidden fields
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;
        document.getElementById('address').value = address.formatted_address;
        document.getElementById('placeId').value = address.place_id || '';
        
        // Parse compound address
        document.getElementById('province').value = compound.province || '';
        document.getElementById('district').value = compound.district || '';
        document.getElementById('ward').value = compound.commune || '';
        
        // Show selected address display
        const selectedDisplay = document.getElementById('selectedAddressDisplay');
        const selectedText = document.getElementById('selectedAddressText');
        const selectedCoords = document.getElementById('selectedCoordinates');
        
        if (selectedDisplay && selectedText && selectedCoords) {
            selectedDisplay.classList.remove('hidden');
            selectedText.textContent = address.formatted_address;
            selectedCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }

        // Trigger nearby POI search nếu có
        if (typeof window.searchNearbyPlaces === 'function') {
            window.searchNearbyPlaces(lat, lng);
        }
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = `location-notification location-notification-${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3s
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapPicker);
    } else {
        initMapPicker();
    }

    // Add notification styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .location-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-size: 14px;
            font-weight: 500;
            max-width: 350px;
        }
        
        .location-notification.show {
            transform: translateX(0);
        }
        
        .location-notification i {
            font-size: 20px;
        }
        
        .location-notification-success {
            border-left: 4px solid #10b981;
            color: #065f46;
        }
        
        .location-notification-success i {
            color: #10b981;
        }
        
        .location-notification-error {
            border-left: 4px solid #ef4444;
            color: #991b1b;
        }
        
        .location-notification-error i {
            color: #ef4444;
        }
        
        .location-notification-warning {
            border-left: 4px solid #f59e0b;
            color: #92400e;
        }
        
        .location-notification-warning i {
            color: #f59e0b;
        }
        
        .location-notification-info {
            border-left: 4px solid #3b82f6;
            color: #1e40af;
        }
        
        .location-notification-info i {
            color: #3b82f6;
        }
        
        @media (max-width: 480px) {
            .location-notification {
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);

})();
