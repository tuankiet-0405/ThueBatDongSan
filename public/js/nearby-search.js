/**
 * ===================================
 * NEARBY SEARCH - Tìm phòng trọ gần tôi
 * Sử dụng Geolocation API + Leaflet Maps
 * ===================================
 */

class NearbySearch {
    constructor() {
        this.modal = null;
        this.map = null;
        this.userMarker = null;
        this.propertyMarkers = [];
        this.radiusCircle = null; // Lưu vòng tròn bán kính hiện tại
        this.userLocation = null;
        this.currentRadius = 2; // km
        this.properties = [];
        
        this.init();
    }

    init() {
        this.modal = document.getElementById('nearbyModal');
        this.bindEvents();
    }

    bindEvents() {
        // Open modal
        const nearbyBtn = document.getElementById('nearbySearchBtn');
        if (nearbyBtn) {
            nearbyBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal
        const closeBtn = document.getElementById('closeNearbyModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Backdrop click
        const backdrop = document.getElementById('nearbyModalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }

        // Retry button
        const retryBtn = document.getElementById('retryLocation');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.getUserLocation());
        }

        // Radius change
        const radiusSelect = document.getElementById('radiusSelect');
        if (radiusSelect) {
            radiusSelect.addEventListener('change', (e) => {
                this.currentRadius = parseFloat(e.target.value);
                this.updateRadiusCircles();
                this.filterPropertiesByRadius();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset states
        this.showLoading();
        this.hideError();
        this.hideMap();
        
        // Get user location
        this.getUserLocation();
    }

    closeModal() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Cleanup map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    showLoading() {
        document.getElementById('nearbyLoading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('nearbyLoading').classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        const errorDiv = document.getElementById('nearbyError');
        const errorMessage = document.getElementById('nearbyErrorMessage');
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('nearbyError').classList.add('hidden');
    }

    showMap() {
        document.getElementById('nearbyMapContainer').classList.remove('hidden');
    }

    hideMap() {
        document.getElementById('nearbyMapContainer').classList.add('hidden');
    }

    getUserLocation() {
        this.showLoading();
        this.hideError();

        if (!navigator.geolocation) {
            this.showError('Trình duyệt của bạn không hỗ trợ định vị.');
            return;
        }

        console.log('🌍 Đang yêu cầu quyền truy cập vị trí...');

        // Thử với độ chính xác cao trước
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => {
                console.warn('⚠️ Không thể lấy vị trí chính xác cao, thử với độ chính xác thấp hơn...');
                // Nếu thất bại, thử lại với độ chính xác thấp hơn
                navigator.geolocation.getCurrentPosition(
                    (position) => this.onLocationSuccess(position),
                    (error) => this.onLocationError(error),
                    {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 300000 // 5 phút
                    }
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 30000, // 30 giây
                maximumAge: 300000 // Chấp nhận vị trí cache trong 5 phút
            }
        );
    }

    onLocationSuccess(position) {
        console.log('✅ Đã lấy được vị trí:', position.coords);
        
        this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        this.hideLoading();
        this.showMap();

        // Initialize map
        this.initMap();

        // Get address from coordinates
        this.getAddressFromCoords(this.userLocation.lat, this.userLocation.lng);

        // Load properties
        this.loadNearbyProperties();
    }

    onLocationError(error) {
        console.error('❌ Lỗi lấy vị trí:', error);
        this.hideLoading();
        
        let message = 'Không thể xác định vị trí của bạn.';
        let suggestion = '';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Bạn đã từ chối quyền truy cập vị trí.';
                suggestion = 'Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt và tải lại trang.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Thông tin vị trí không khả dụng.';
                suggestion = 'Vui lòng kiểm tra kết nối GPS/mạng hoặc thử ở nơi có tín hiệu tốt hơn.';
                break;
            case error.TIMEOUT:
                message = 'Không thể lấy vị trí trong thời gian quy định.';
                suggestion = 'Vui lòng đảm bảo GPS được bật và thử lại. Hoặc nhập địa chỉ thủ công ở trên.';
                break;
        }
        
        this.showError(`${message} ${suggestion}`);
    }

    async getAddressFromCoords(lat, lng) {
        try {
            // Sử dụng Nominatim reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`);
            const data = await response.json();
            
            if (data && data.display_name) {
                const address = data.display_name.split(',').slice(0, 3).join(',');
                document.getElementById('userLocationText').textContent = address;
            }
        } catch (error) {
            console.error('Lỗi lấy địa chỉ:', error);
            document.getElementById('userLocationText').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }

    initMap() {
        // Create map centered on user location with Goong Map JS
        goongjs.accessToken = '3wUhxxPZujfl6OwVJ9N7YdDlGP6pJU62zw5PT4pg';
        this.map = new goongjs.Map({
            container: 'nearbyMap',
            style: 'https://tiles.goong.io/assets/goong_map_web.json',
            center: [this.userLocation.lng, this.userLocation.lat],
            zoom: 13
        });

        // Wait for map to load before adding circles
        this.map.on('load', () => {
            this.drawRadiusCircles();
        });

        // Add user location marker
        const el = document.createElement('div');
        el.style.cssText = 'background: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5); cursor: pointer; z-index: 1000;';
        
        const popup = new goongjs.Popup({ offset: 25 })
            .setHTML('<div class="text-center p-2"><strong class="text-blue-600">📍 Vị trí của bạn</strong><br/><small class="text-gray-500">Đang ở đây</small></div>');
        
        this.userMarker = new goongjs.Marker(el)
            .setLngLat([this.userLocation.lng, this.userLocation.lat])
            .setPopup(popup)
            .addTo(this.map);
    }

    async loadNearbyProperties() {
        try {
            // Fetch all available properties
            const response = await fetch('/api/properties?status=available&limit=100');
            const data = await response.json();

            if (data.success && data.data) {
                this.properties = data.data;
                this.filterPropertiesByRadius();
            } else {
                console.error('Không thể tải danh sách phòng');
            }
        } catch (error) {
            console.error('Lỗi tải phòng:', error);
            this.showError('Không thể tải danh sách phòng. Vui lòng thử lại.');
        }
    }

    filterPropertiesByRadius() {
        // Clear existing markers
        this.propertyMarkers.forEach(marker => marker.remove());
        this.propertyMarkers = [];

        // Filter properties within radius
        const nearbyProperties = this.properties.filter(property => {
            if (!property.location || !property.location.coordinates) {
                return false;
            }

            const [lng, lat] = property.location.coordinates;
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                lat,
                lng
            );

            property.distance = distance;
            return distance <= this.currentRadius;
        });

        // Sort by distance
        nearbyProperties.sort((a, b) => a.distance - b.distance);

        console.log(`🏠 Tìm thấy ${nearbyProperties.length} phòng trong bán kính ${this.currentRadius}km`);

        // Update count
        document.getElementById('nearbyCount').textContent = nearbyProperties.length;

        // Add markers to map
        this.addPropertyMarkers(nearbyProperties);

        // Display properties list
        this.displayPropertiesList(nearbyProperties);
    }

    addPropertyMarkers(properties) {
        properties.forEach((property, index) => {
            if (!property.location || !property.location.coordinates) return;

            const [lng, lat] = property.location.coordinates;

            // Create custom marker element
            const el = document.createElement('div');
            el.style.cssText = 'background: white; padding: 4px 8px; border-radius: 8px; border: 2px solid #374151; box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 12px; font-weight: 600; white-space: nowrap; cursor: pointer;';
            el.textContent = `${(property.price / 1000000).toFixed(1)}tr`;

            // Popup content
            const popupContent = `
                <div class="p-2" style="min-width: 200px;">
                    <img src="${property.images && property.images[0] ? property.images[0] : '/images/placeholder.jpg'}" 
                         alt="${property.title}" 
                         class="w-full h-32 object-cover rounded-lg mb-2"
                         onerror="this.src='/images/placeholder.jpg'">
                    <h4 class="font-semibold text-gray-800 mb-1">${property.title}</h4>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-map-marker-alt text-gray-400"></i> 
                        ${property.address?.district || 'Không rõ khu vực'}
                    </p>
                    <p class="text-sm text-gray-600 mb-1">
                        <i class="fas fa-ruler-combined text-gray-400"></i> 
                        ${property.area}m²
                    </p>
                    <p class="text-sm font-semibold text-gray-800 mb-2">
                        <i class="fas fa-tag text-gray-400"></i> 
                        ${property.price.toLocaleString('vi-VN')} VNĐ/tháng
                    </p>
                    <p class="text-xs text-blue-600 mb-2">
                        <i class="fas fa-route text-blue-500"></i> 
                        Cách bạn ${property.distance.toFixed(2)} km
                    </p>
                    <a href="/property/${property._id}" 
                       class="block w-full text-center px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
                        Xem chi tiết
                    </a>
                </div>
            `;

            const popup = new goongjs.Popup({ offset: 25, maxWidth: '250px' })
                .setHTML(popupContent);

            const marker = new goongjs.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(this.map);

            this.propertyMarkers.push(marker);
        });
    }

    displayPropertiesList(properties) {
        const listContainer = document.getElementById('nearbyPropertiesList');
        
        if (properties.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-home text-4xl mb-2"></i>
                    <p>Không tìm thấy phòng trọ nào trong bán kính ${this.currentRadius}km</p>
                    <p class="text-sm mt-1">Thử tăng bán kính tìm kiếm</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = properties.map(property => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                 onclick="window.location.href='/property/${property._id}'">
                <img src="${property.images && property.images[0] ? property.images[0] : '/images/placeholder.jpg'}" 
                     alt="${property.title}" 
                     class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1 min-w-0">
                    <h5 class="font-semibold text-gray-800 truncate">${property.title}</h5>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-map-marker-alt text-gray-400"></i> 
                        ${property.address?.district || 'Không rõ'}
                    </p>
                    <div class="flex items-center justify-between mt-1">
                        <span class="text-sm font-semibold text-gray-800">
                            ${property.price.toLocaleString('vi-VN')} VNĐ
                        </span>
                        <span class="text-xs text-blue-600">
                            <i class="fas fa-route"></i> ${property.distance.toFixed(2)} km
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    /**
     * Draw radius circle on map (only one circle with current radius)
     */
    drawRadiusCircles() {
        const sourceId = 'radius-circle';
        const layerId = 'radius-layer';
        const fillLayerId = 'radius-fill-layer';
        const labelLayerId = 'radius-label';

        // Tạo circle data với bán kính hiện tại
        const circle = this.createCircle(this.userLocation.lat, this.userLocation.lng, this.currentRadius);

        // Add source
        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: circle
            });
        } else {
            // Update existing source
            this.map.getSource(sourceId).setData(circle);
        }

        // Add fill layer (màu xanh lá trong suốt)
        if (!this.map.getLayer(fillLayerId)) {
            this.map.addLayer({
                id: fillLayerId,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#10B981', // Màu xanh lá
                    'fill-opacity': 0.1 // Trong suốt
                }
            });
        }

        // Add circle border layer (đường viền xanh lá)
        if (!this.map.getLayer(layerId)) {
            this.map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#10B981', // Màu xanh lá
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });
        }

        // Add label showing distance
        const labelPoint = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [this.userLocation.lng, this.userLocation.lat + (this.currentRadius / 111)] // Đặt label ở phía trên
            },
            properties: {
                label: `${this.currentRadius}km`
            }
        };

        const labelSourceId = 'radius-label-source';
        if (!this.map.getSource(labelSourceId)) {
            this.map.addSource(labelSourceId, {
                type: 'geojson',
                data: labelPoint
            });
        } else {
            this.map.getSource(labelSourceId).setData(labelPoint);
        }

        if (!this.map.getLayer(labelLayerId)) {
            this.map.addLayer({
                id: labelLayerId,
                type: 'symbol',
                source: labelSourceId,
                layout: {
                    'text-field': ['get', 'label'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                    'text-offset': [0, 0]
                },
                paint: {
                    'text-color': '#10B981',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                }
            });
        }
    }

    /**
     * Create circle coordinates
     */
    createCircle(lat, lng, radiusInKm, points = 64) {
        const coords = {
            latitude: lat,
            longitude: lng
        };

        const km = radiusInKm;
        const ret = [];
        const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
        const distanceY = km / 110.574;

        for (let i = 0; i < points; i++) {
            const theta = (i / points) * (2 * Math.PI);
            const x = distanceX * Math.cos(theta);
            const y = distanceY * Math.sin(theta);
            ret.push([coords.longitude + x, coords.latitude + y]);
        }
        ret.push(ret[0]);

        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [ret]
            }
        };
    }

    /**
     * Update radius circle when radius changes
     */
    updateRadiusCircles() {
        if (!this.map) return;

        const sourceId = 'radius-circle';
        const labelSourceId = 'radius-label-source';

        // Tạo circle data mới với bán kính hiện tại
        const circle = this.createCircle(this.userLocation.lat, this.userLocation.lng, this.currentRadius);
        
        // Cập nhật data của source
        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(circle);
        }

        // Cập nhật label
        const labelPoint = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [this.userLocation.lng, this.userLocation.lat + (this.currentRadius / 111)]
            },
            properties: {
                label: `${this.currentRadius}km`
            }
        };

        if (this.map.getSource(labelSourceId)) {
            this.map.getSource(labelSourceId).setData(labelPoint);
        }

        // Zoom map to fit the circle
        const bounds = this.getCircleBounds(this.userLocation.lat, this.userLocation.lng, this.currentRadius);
        this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14,
            duration: 1000
        });
    }

    /**
     * Get bounds for circle to fit map view
     */
    getCircleBounds(lat, lng, radiusInKm) {
        const latChange = radiusInKm / 110.574;
        const lngChange = radiusInKm / (111.320 * Math.cos(lat * Math.PI / 180));

        return [
            [lng - lngChange, lat - latChange], // Southwest
            [lng + lngChange, lat + latChange]  // Northeast
        ];
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.nearbySearch = new NearbySearch();
});
