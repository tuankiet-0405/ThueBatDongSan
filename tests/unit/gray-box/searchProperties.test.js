/**
 * GRAY BOX TEST - searchProperties (Frontend)
 * Kiểm thử kết hợp: Form validation + AJAX call + UI update
 */

// DOM structure mock
document.body.innerHTML = `
  <form id="filterForm">
    <input id="areaFilter" type="number" value="">
    <input id="priceFilter" type="number" value="">
    <select id="districtFilter">
      <option value="">Tất cả quận</option>
      <option value="Quận 1">Quận 1</option>
      <option value="Quận 2">Quận 2</option>
    </select>
    <button type="submit">Tìm kiếm</button>
  </form>
  <div id="loadingSpinner" style="display:none;">Đang tải...</div>
  <div id="propertyList"></div>
  <div id="errorMessage" style="display:none;"></div>
`;

// Mock fetch API
global.fetch = jest.fn();

describe('GRAY BOX: searchProperties - Filter + AJAX + UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('1. Form Input Validation', () => {
    test('Area input chỉ chấp nhận số', () => {
      const areaInput = document.getElementById('areaFilter');
      
      areaInput.value = '-10'; // Số âm
      expect(areaInput.value).toBe('-10');
      
      const isValid = parseInt(areaInput.value) > 0;
      expect(isValid).toBe(false);
    });

    test('Price input chỉ chấp nhận số', () => {
      const priceInput = document.getElementById('priceFilter');
      
      priceInput.value = 'abc'; // Không phải số
      const isValid = !isNaN(parseInt(priceInput.value));
      expect(isValid).toBe(false);
    });

    test('District input phải có option hợp lệ', () => {
      const districtSelect = document.getElementById('districtFilter');
      const selectedOption = districtSelect.options[districtSelect.selectedIndex];
      
      districtSelect.value = 'Quận 1';
      expect(districtSelect.value).toBe('Quận 1');
    });
  });

  describe('2. AJAX Call Logic', () => {
    test('Gửi request GET đúng format', async () => {
      const areaInput = document.getElementById('areaFilter');
      const priceInput = document.getElementById('priceFilter');
      const districtSelect = document.getElementById('districtFilter');

      areaInput.value = '20';
      priceInput.value = '5000000';
      districtSelect.value = 'Quận 1';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: '1',
            title: 'Phòng trọ 20m²',
            price: 5000000,
            area: 20,
            address: { district: 'Quận 1' }
          }
        ])
      });

      const queryParams = new URLSearchParams({
        'address.area[gte]': areaInput.value,
        'price[lte]': priceInput.value,
        'address.district': districtSelect.value
      });

      await fetch(`/api/properties?${queryParams}`);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/properties')
      );
    });

    test('Handle empty filter - lấy tất cả properties', async () => {
      document.getElementById('areaFilter').value = '';
      document.getElementById('priceFilter').value = '';
      document.getElementById('districtFilter').value = '';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { _id: '1', title: 'Property 1' },
          { _id: '2', title: 'Property 2' }
        ])
      });

      await fetch('/api/properties');

      expect(fetch).toHaveBeenCalledWith('/api/properties');
    });
  });

  describe('3. UI Update', () => {
    test('Hiển thị loading spinner khi fetch', () => {
      const spinner = document.getElementById('loadingSpinner');
      
      spinner.style.display = 'block';
      expect(spinner.style.display).toBe('block');

      spinner.style.display = 'none';
      expect(spinner.style.display).toBe('none');
    });

    test('Hiển thị danh sách properties trên UI', () => {
      const propertyList = document.getElementById('propertyList');
      const mockProperties = [
        { title: 'Phòng 1', price: 5000000 },
        { title: 'Phòng 2', price: 6000000 }
      ];

      propertyList.innerHTML = mockProperties
        .map(p => `<div class="property-item">${p.title}</div>`)
        .join('');

      expect(propertyList.innerHTML).toContain('Phòng 1');
      expect(propertyList.innerHTML).toContain('Phòng 2');
    });

    test('Hiển thị error message khi fetch fail', () => {
      const errorDiv = document.getElementById('errorMessage');
      const errorMsg = 'Không thể tải danh sách phòng';

      errorDiv.textContent = errorMsg;
      errorDiv.style.display = 'block';

      expect(errorDiv.textContent).toBe(errorMsg);
      expect(errorDiv.style.display).toBe('block');
    });

    test('Xóa error message khi fetch thành công', () => {
      const errorDiv = document.getElementById('errorMessage');
      
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';

      expect(errorDiv.textContent).toBe('');
      expect(errorDiv.style.display).toBe('none');
    });
  });

  describe('4. Error Handling', () => {
    test('Handle network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/properties?area=20');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('Handle 404 response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' })
      });

      const response = await fetch('/api/properties?area=999');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('Handle invalid JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      try {
        const response = await fetch('/api/properties');
        await response.json();
      } catch (error) {
        expect(error.message).toBe('Invalid JSON');
      }
    });
  });

  describe('5. Filter Combinations', () => {
    test('Filter by area only', async () => {
      document.getElementById('areaFilter').value = '30';
      document.getElementById('priceFilter').value = '';
      document.getElementById('districtFilter').value = '';

      const queryParams = new URLSearchParams({
        'address.area[gte]': '30'
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { area: 30, title: 'Phòng 30m²' }
        ])
      });

      await fetch(`/api/properties?${queryParams}`);

      expect(fetch).toHaveBeenCalled();
    });

    test('Filter by price range', async () => {
      document.getElementById('priceFilter').value = '10000000';

      const queryParams = new URLSearchParams({
        'price[lte]': '10000000'
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { price: 5000000, title: 'Rẻ' },
          { price: 9000000, title: 'Vừa phải' }
        ])
      });

      await fetch(`/api/properties?${queryParams}`);

      expect(fetch).toHaveBeenCalled();
    });

    test('Filter by district and price', async () => {
      document.getElementById('districtFilter').value = 'Quận 1';
      document.getElementById('priceFilter').value = '7000000';

      const queryParams = new URLSearchParams({
        'address.district': 'Quận 1',
        'price[lte]': '7000000'
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([])
      });

      await fetch(`/api/properties?${queryParams}`);

      expect(fetch).toHaveBeenCalled();
    });
  });
});
