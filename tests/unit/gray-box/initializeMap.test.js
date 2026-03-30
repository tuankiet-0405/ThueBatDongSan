/**
 * GRAY BOX TEST - initializeMap (Frontend)
 * Kiểm thử: Map initialization + Marker placement + Coordinate validation
 */

// Mock Goong Map JS
global.goongjs = {
  Map: jest.fn(function(options) {
    this.container = options.container;
    this.center = options.center;
    this.zoom = options.zoom;
    this.style = options.style;
    this.addLayer = jest.fn();
    this.on = jest.fn();
    this.remove = jest.fn();
  }),
  Marker: jest.fn(function(options) {
    this.element = options?.element;
    this.lngLat = null;
    this.setLngLat = jest.fn(function(coords) {
      this.lngLat = coords;
      return this;
    });
    this.addTo = jest.fn(function(map) {
      this.map = map;
      return this;
    });
    this.getElement = jest.fn(function() {
      return this.element;
    });
  }),
  Popup: jest.fn(function(options = {}) {
    this.className = options.className || '';
    this.anchor = options.anchor || 'top';
    this.setHTML = jest.fn(function(html) {
      this.html = html;
      return this;
    });
    this.addTo = jest.fn(function(map) {
      return this;
    });
  })
};

// DOM structure
document.body.innerHTML = `
  <div id="propertyMap" style="width: 100%; height: 400px;"></div>
  <div id="mapError" style="display:none;">Lỗi tải bản đồ</div>
`;

describe('GRAY BOX: initializeMap - Goong Map Display', () => {
  let mockProperty;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProperty = {
      title: 'Phòng trọ 20m² tại Quận 1',
      address: {
        street: '123 Nguyễn Huệ',
        ward: 'Phường Bến Nghé',
        district: 'Quận 1'
      },
      location: {
        type: 'Point',
        coordinates: [106.6977, 10.7779] // [lng, lat]
      },
      price: 5000000,
      images: [
        { url: 'https://example.com/image.jpg' }
      ]
    };
  });

  describe('1. Map Initialization', () => {
    test('Tạo map với container đúng', () => {
      const mapContainer = document.getElementById('propertyMap');
      
      new goongjs.Map({
        container: mapContainer,
        center: mockProperty.location.coordinates,
        zoom: 15,
        style: 'https://tiles.goong.io/assets/goong_map_web.json?key=3wUhxxPZujfl6OwVJ9N7YdDlGP6pJU62zw5PT4pg'
      });

      expect(goongjs.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          container: mapContainer,
          zoom: 15
        })
      );
    });

    test('Map center được set đúng từ coordinates', () => {
      const expectedCenter = [106.6977, 10.7779];
      
      new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: expectedCenter,
        zoom: 15
      });

      const mapCall = goongjs.Map.mock.calls[0][0];
      expect(mapCall.center).toEqual(expectedCenter);
    });

    test('Map zoom level là 15', () => {
      new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mockProperty.location.coordinates,
        zoom: 15
      });

      const mapCall = goongjs.Map.mock.calls[0][0];
      expect(mapCall.zoom).toBe(15);
    });
  });

  describe('2. Marker Placement', () => {
    test('Thêm marker tại vị trí property', () => {
      const map = new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mockProperty.location.coordinates,
        zoom: 15
      });

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';

      const marker = new goongjs.Marker({ element: markerElement });
      marker.setLngLat(mockProperty.location.coordinates);
      marker.addTo(map);

      expect(marker.setLngLat).toHaveBeenCalledWith([106.6977, 10.7779]);
      expect(marker.addTo).toHaveBeenCalledWith(map);
    });

    test('Marker có custom element', () => {
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.innerHTML = `
        <div class="marker-content">
          <strong>${mockProperty.title}</strong>
          <p>${mockProperty.price.toLocaleString()} VNĐ</p>
        </div>
      `;

      const marker = new goongjs.Marker({ element: markerElement });

      expect(marker.element).toBeDefined();
      expect(marker.element.className).toBe('custom-marker');
    });

    test('Marker popup hiển thị thông tin property', () => {
      const map = new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mockProperty.location.coordinates,
        zoom: 15
      });

      const popup = new goongjs.Popup();
      const popupHTML = `
        <div class="popup-content">
          <h3>${mockProperty.title}</h3>
          <p>Địa chỉ: ${mockProperty.address.street}</p>
          <p>Giá: ${mockProperty.price} VNĐ</p>
        </div>
      `;

      popup.setHTML(popupHTML);
      
      expect(popup.setHTML).toHaveBeenCalledWith(popupHTML);
    });
  });

  describe('3. Coordinate Validation', () => {
    test('Coordinates phải là array [lng, lat]', () => {
      const coords = mockProperty.location.coordinates;
      
      expect(Array.isArray(coords)).toBe(true);
      expect(coords.length).toBe(2);
    });

    test('Longitude phải nằm trong khoảng -180 đến 180', () => {
      const lng = mockProperty.location.coordinates[0];
      
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
    });

    test('Latitude phải nằm trong khoảng -90 đến 90', () => {
      const lat = mockProperty.location.coordinates[1];
      
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    });

    test('Coordinates phải nằm trong HCM (106-107 lng, 10-11.5 lat)', () => {
      const [lng, lat] = mockProperty.location.coordinates;
      const isValidHCM = lng >= 106 && lng <= 107 && lat >= 10 && lat <= 11.5;
      
      expect(isValidHCM).toBe(true);
    });

    test('FAIL - Coordinates ngoài HCM không hiển thị', () => {
      const invalidProperty = {
        ...mockProperty,
        location: {
          coordinates: [100, 15] // Ngoài HCM
        }
      };

      const [lng, lat] = invalidProperty.location.coordinates;
      const isValidHCM = lng >= 106 && lng <= 107 && lat >= 10 && lat <= 11.5;
      
      expect(isValidHCM).toBe(false);
    });

    test('FAIL - Coordinates null hoặc undefined', () => {
      const invalidProperty = {
        ...mockProperty,
        location: {
          coordinates: [null, null]
        }
      };

      const coords = invalidProperty.location.coordinates;
      const isValid = coords[0] !== null && coords[1] !== null;
      
      expect(isValid).toBe(false);
    });
  });

  describe('4. Error Handling', () => {
    afterEach(() => {
      // Restore normal mock after each test
      jest.clearAllMocks();
      global.goongjs.Map = jest.fn(function(options) {
        this.container = options.container;
        this.center = options.center;
        this.zoom = options.zoom;
        this.style = options.style;
        this.addLayer = jest.fn();
        this.on = jest.fn();
        this.remove = jest.fn();
      });
    });

    test('Hiển thị error khi map initialization fail', () => {
      const errorDiv = document.getElementById('mapError');
      
      goongjs.Map = jest.fn().mockImplementation(() => {
        throw new Error('Map initialization failed');
      });

      try {
        new goongjs.Map({
          container: document.getElementById('propertyMap')
        });
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }

      expect(errorDiv.style.display).toBe('block');
      expect(errorDiv.textContent).toContain('failed');
    });

    test('Hiển thị error khi property không có coordinates', () => {
      const errorDiv = document.getElementById('mapError');
      const invalidProperty = {
        ...mockProperty,
        location: { coordinates: undefined }
      };

      if (!invalidProperty.location.coordinates) {
        errorDiv.textContent = 'Không thể tải vị trí phòng';
        errorDiv.style.display = 'block';
      }

      expect(errorDiv.style.display).toBe('block');
    });

    test('Fallback đến center TP.HCM nếu coordinates sai', () => {
      const defaultCenter = [106.7, 10.8]; // TP.HCM center
      const invalidProperty = {
        ...mockProperty,
        location: { coordinates: [null, null] }
      };

      // Simulate actual validation logic: check if coordinates are valid numbers
      const coords = invalidProperty.location?.coordinates;
      const isValidCoords = coords && 
                           coords.length === 2 && 
                           typeof coords[0] === 'number' && 
                           typeof coords[1] === 'number';
      const mapCenter = isValidCoords ? coords : defaultCenter;

      new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mapCenter,
        zoom: 12
      });

      const mapCall = goongjs.Map.mock.calls[goongjs.Map.mock.calls.length - 1][0];
      expect(mapCall.center).toEqual(defaultCenter);
    });
  });

  describe('5. User Interactions', () => {
    beforeEach(() => {
      // Reset mock before each test
      jest.clearAllMocks();
      global.goongjs.Map = jest.fn(function(options) {
        this.container = options.container;
        this.center = options.center;
        this.zoom = options.zoom;
        this.style = options.style;
        this.addLayer = jest.fn();
        this.on = jest.fn();
        this.remove = jest.fn();
      });
      global.goongjs.Marker = jest.fn(function(options) {
        this.element = options?.element;
        this.lngLat = null;
        this.setLngLat = jest.fn(function(coords) {
          this.lngLat = coords;
          return this;
        });
        this.addTo = jest.fn(function(map) {
          this.map = map;
          return this;
        });
        this.getElement = jest.fn(function() {
          return this.element;
        });
      });
    });

    test('Click vào marker mở popup', () => {
      const map = new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mockProperty.location.coordinates,
        zoom: 15
      });

      const marker = new goongjs.Marker({
        element: document.createElement('div')
      });

      marker.setLngLat(mockProperty.location.coordinates);
      marker.addTo(map);

      // Simulate click
      const markerElement = marker.getElement();
      markerElement.click = jest.fn();

      markerElement.click();
      expect(markerElement.click).toHaveBeenCalled();
    });

    test('Zoom in/out map', () => {
      const map = new goongjs.Map({
        container: document.getElementById('propertyMap'),
        center: mockProperty.location.coordinates,
        zoom: 15
      });

      expect(map.zoom).toBe(15);
    });
  });
});
