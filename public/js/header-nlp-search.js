/**
 * ===================================
 * NLP SEARCH - AI-Powered Search in Header
 * Tìm kiếm bằng ngôn ngữ tự nhiên
 * ===================================
 */

class HeaderNLPSearch {
  constructor() {
    this.headerInput = null;
    this.mobileInput = null;
    this.resultsModal = null;
    this.resultsContainer = null;
    this.isSearching = false;
    this.currentLanguage = 'vi';
  }

  /**
   * Khởi tạo
   */
  init() {
    this.createResultsModal();
    this.setupInputs();
    this.setupEventListeners();
  }

  /**
   * Create modal for results
   */
  createResultsModal() {
    const modal = document.createElement('div');
    modal.className = 'nlp-results-modal';
    modal.id = 'nlpResultsModal';
    modal.innerHTML = `
      <div class="nlp-results-content">
        <div class="nlp-results-header">
          <h4 style="margin: 0;">🔍 Kết quả tìm kiếm AI</h4>
          <button class="nlp-results-close" onclick="headerNLPSearch.closeResults()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="nlp-results-body" id="nlpResultsBody">
          <!-- Results will be inserted here -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    this.resultsModal = modal;
    this.resultsContainer = document.getElementById('nlpResultsBody');

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeResults();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeResults();
      }
    });
  }

  /**
   * Setup inputs
   */
  setupInputs() {
    this.headerInput = document.getElementById('headerNlpSearch');
    this.mobileInput = document.getElementById('mobileNlpSearch');
    this.heroInput = document.getElementById('heroNlpSearch');
    this.propertiesInput = document.getElementById('propertiesNlpSearch');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Header search
    if (this.headerInput) {
      this.headerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.headerInput.value);
        }
      });

      this.headerInput.addEventListener('input', () => {
        this.detectLanguage(this.headerInput.value);
      });
    }

    // Mobile search
    if (this.mobileInput) {
      this.mobileInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.mobileInput.value);
        }
      });

      this.mobileInput.addEventListener('input', () => {
        this.detectLanguage(this.mobileInput.value);
      });
    }

    // Hero search (trang chủ)
    if (this.heroInput) {
      this.heroInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.heroInput.value);
        }
      });

      this.heroInput.addEventListener('input', () => {
        this.detectLanguage(this.heroInput.value, 'heroLangIndicator');
      });
    }

    // Properties page search
    if (this.propertiesInput) {
      this.propertiesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.propertiesInput.value);
        }
      });

      this.propertiesInput.addEventListener('input', () => {
        this.detectLanguage(this.propertiesInput.value, 'propertiesLangIndicator');
      });
    }

    // Search buttons
    const headerBtn = document.getElementById('headerSearchBtn');
    const mobileBtn = document.getElementById('mobileSearchBtn');

    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        this.performSearch(this.headerInput?.value);
      });
    }

    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        this.performSearch(this.mobileInput?.value);
      });
    }

    // Voice search buttons
    const headerVoice = document.getElementById('headerVoiceBtn');
    const mobileVoice = document.getElementById('mobileVoiceBtn');
    const heroVoice = document.getElementById('heroVoiceBtn');
    const propertiesVoice = document.getElementById('propertiesVoiceBtn');

    if (headerVoice && 'webkitSpeechRecognition' in window) {
      headerVoice.addEventListener('click', () => this.startVoiceSearch('header'));
    }

    if (mobileVoice && 'webkitSpeechRecognition' in window) {
      mobileVoice.addEventListener('click', () => this.startVoiceSearch('mobile'));
    }

    if (heroVoice && 'webkitSpeechRecognition' in window) {
      heroVoice.addEventListener('click', () => this.startVoiceSearch('hero'));
    }

    if (propertiesVoice && 'webkitSpeechRecognition' in window) {
      propertiesVoice.addEventListener('click', () => this.startVoiceSearch('properties'));
    }
  }

  /**
   * Detect language
   */
  detectLanguage(text, indicatorId = 'headerLangIndicator') {
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    this.currentLanguage = vietnameseRegex.test(text) ? 'vi' : 'en';
    
    const indicator = document.getElementById(indicatorId);
    if (indicator) {
      indicator.textContent = this.currentLanguage === 'vi' ? 'VI' : 'EN';
    }
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    if (!query || !query.trim()) {
      alert('Vui lòng nhập câu tìm kiếm / Please enter search query');
      return;
    }

    if (this.isSearching) return;

    this.isSearching = true;
    this.openResults();
    this.showLoading();

    try {
      const endpoint = this.currentLanguage === 'vi' 
        ? '/api/ai/nlp-search' 
        : '/api/ai/multilang-search';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 50 })
      });

      const result = await response.json();

      if (result.success) {
        this.displayResults(result);
      } else {
        this.showError(result.error || 'Có lỗi xảy ra khi tìm kiếm');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Không thể kết nối đến server');
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Open results modal
   */
  openResults() {
    console.log('🚪 openResults called');
    console.log('📦 resultsModal exists?', !!this.resultsModal);
    
    if (!this.resultsModal) {
      console.error('❌ resultsModal not found! Creating modal...');
      this.createResultsModal();
    }
    
    if (this.resultsModal) {
      console.log('✅ Adding active class to modal');
      this.resultsModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      console.log('✅ Modal should be visible now');
    } else {
      console.error('❌ Failed to create/find modal!');
    }
  }

  /**
   * Close results modal
   */
  closeResults() {
    if (this.resultsModal) {
      this.resultsModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * Show loading
   */
  showLoading() {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div class="nlp-loading-spinner" style="width: 60px; height: 60px; margin: 0 auto 1.5rem;"></div>
        <p style="font-size: 1.1rem; color: #2c3e50;">🤖 AI đang phân tích câu tìm kiếm...</p>
        <p style="font-size: 0.9rem; color: #7f8c8d; margin-top: 0.5rem;">Đang xử lý ngữ nghĩa và ngữ cảnh</p>
      </div>
    `;
  }

  /**
   * Display results
   */
  displayResults(result) {
    console.log('📊 displayResults called with:', result);
    console.log('📦 resultsContainer exists?', !!this.resultsContainer);
    console.log('📦 resultsModal exists?', !!this.resultsModal);
    
    if (!this.resultsContainer) {
      console.error('❌ resultsContainer not found! Recreating modal...');
      this.createResultsModal();
    }

    const { query, parsed, count, data, message, translatedQuery } = result;

    let html = `
      <div style="margin-bottom: 1.5rem;">
        <h5 style="color: #2c3e50; margin-bottom: 0.5rem;">Tìm kiếm: "<span style="color: #3498db;">${query}</span>"</h5>
        ${translatedQuery ? `<p style="color: #7f8c8d; font-size: 0.9rem; margin: 0.25rem 0;">📝 Dịch: "${translatedQuery}"</p>` : ''}
        <p style="color: #27ae60; margin: 0.5rem 0;">💡 ${parsed?.intent || message}</p>
        <p style="color: #7f8c8d; margin-top: 0.5rem;">Tìm thấy <strong style="color: #3498db; font-size: 1.1rem;">${count}</strong> kết quả</p>
      </div>

      ${this.renderFilterTags(parsed)}

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
        ${data.length > 0 ? data.map(property => this.renderPropertyCard(property)).join('') : '<p style="text-align: center; padding: 2rem; color: #7f8c8d;">Không tìm thấy phòng phù hợp</p>'}
      </div>
    `;

    this.resultsContainer.innerHTML = html;
    console.log('✅ Results HTML updated');
  }

  /**
   * Render filter tags
   */
  renderFilterTags(parsed) {
    if (!parsed) return '';

    const tags = [];

    if (parsed.propertyType) {
      const types = {
        'phong-tro': 'Phòng trọ',
        'nha-nguyen-can': 'Nhà nguyên căn',
        'can-ho': 'Căn hộ',
        'chung-cu-mini': 'Chung cư mini'
      };
      tags.push(`<span style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; display: inline-block; margin: 0.25rem;">🏠 ${types[parsed.propertyType]}</span>`);
    }

    if (parsed.priceMin || parsed.priceMax) {
      let price = '💰 ';
      if (parsed.priceMin && parsed.priceMax) {
        price += `${(parsed.priceMin/1000000).toFixed(1)}tr - ${(parsed.priceMax/1000000).toFixed(1)}tr`;
      } else if (parsed.priceMin) {
        price += `Từ ${(parsed.priceMin/1000000).toFixed(1)}tr`;
      } else {
        price += `Dưới ${(parsed.priceMax/1000000).toFixed(1)}tr`;
      }
      tags.push(`<span style="background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; display: inline-block; margin: 0.25rem;">${price}</span>`);
    }

    if (parsed.location?.district) {
      tags.push(`<span style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; display: inline-block; margin: 0.25rem;">📍 ${parsed.location.district}</span>`);
    }

    if (parsed.amenities) {
      const amenityIcons = {
        wifi: '📶 WiFi',
        ac: '❄️ Máy lạnh',
        balcony: '🌿 Ban công',
        parking: '🚗 Đậu xe'
      };
      Object.entries(parsed.amenities).forEach(([key, value]) => {
        if (value && amenityIcons[key]) {
          tags.push(`<span style="background: linear-gradient(135deg, #1abc9c, #16a085); color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; display: inline-block; margin: 0.25rem;">${amenityIcons[key]}</span>`);
        }
      });
    }

    return tags.length > 0 ? `
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h6 style="margin-bottom: 0.75rem; color: #2c3e50;">🎯 Bộ lọc:</h6>
        <div>${tags.join('')}</div>
      </div>
    ` : '';
  }

  /**
   * Render property card
   */
  renderPropertyCard(property) {
    const img = property.images?.[0] || '/images/default-property.jpg';
    const price = (property.price / 1000000).toFixed(1);
    const score = property.relevanceScore || 0;

    return `
      <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; transition: all 0.3s; cursor: pointer;" 
           onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)'"
           onmouseout="this.style.transform=''; this.style.boxShadow=''"
           onclick="window.location.href='/property/${property._id}'">
        <div style="position: relative; height: 200px; overflow: hidden;">
          <img src="${img}" alt="${property.title}" style="width: 100%; height: 100%; object-fit: cover;">
          ${score > 0 ? `<div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #27ae60, #229954); color: white; padding: 0.3rem 0.6rem; border-radius: 15px; font-size: 0.8rem; font-weight: 600;">${score}% phù hợp</div>` : ''}
        </div>
        <div style="padding: 1rem;">
          <h6 style="font-size: 1rem; margin-bottom: 0.5rem; color: #2c3e50; font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${property.title}</h6>
          <p style="color: #7f8c8d; font-size: 0.85rem; margin-bottom: 0.5rem;">📍 ${property.address?.district}, ${property.address?.city}</p>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-top: 1px solid #ecf0f1; border-bottom: 1px solid #ecf0f1; margin-bottom: 0.5rem;">
            <span style="color: #27ae60; font-weight: 700; font-size: 1.05rem;">💰 ${price}tr</span>
            <span style="color: #7f8c8d; font-size: 0.9rem;">📐 ${property.area}m²</span>
          </div>
          <div style="display: flex; gap: 0.3rem; font-size: 1.1rem;">
            ${property.amenities?.wifi ? '<span>📶</span>' : ''}
            ${property.amenities?.ac ? '<span>❄️</span>' : ''}
            ${property.amenities?.parking ? '<span>🚗</span>' : ''}
            ${property.amenities?.balcony ? '<span>🌿</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show error
   */
  showError(message) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <p style="font-size: 3rem; margin-bottom: 1rem;">❌</p>
        <p style="font-size: 1.1rem; color: #e74c3c;">${message}</p>
      </div>
    `;
  }

  /**
   * Voice search
   */
  startVoiceSearch(type) {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = this.currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    recognition.interimResults = false;

    let voiceBtn, targetInput;
    
    if (type === 'header') {
      voiceBtn = document.getElementById('headerVoiceBtn');
      targetInput = this.headerInput;
    } else if (type === 'mobile') {
      voiceBtn = document.getElementById('mobileVoiceBtn');
      targetInput = this.mobileInput;
    } else if (type === 'hero') {
      voiceBtn = document.getElementById('heroVoiceBtn');
      targetInput = this.heroInput;
    } else if (type === 'properties') {
      voiceBtn = document.getElementById('propertiesVoiceBtn');
      targetInput = this.propertiesInput;
    }

    recognition.onstart = () => {
      if (voiceBtn) voiceBtn.classList.add('listening');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (targetInput) {
        targetInput.value = transcript;
      }
      this.performSearch(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
    };

    recognition.onend = () => {
      if (voiceBtn) voiceBtn.classList.remove('listening');
    };

    recognition.start();
  }
}

// Initialize
let headerNLPSearch;
document.addEventListener('DOMContentLoaded', () => {
  headerNLPSearch = new HeaderNLPSearch();
  headerNLPSearch.init();
});
