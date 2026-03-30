/**
 * ===================================
 * SEARCH ROUTES - Goong API Proxy
 * Backend proxy để bảo vệ API key
 * ===================================
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// API endpoints
const GOONG_AUTOCOMPLETE_URL = 'https://rsapi.goong.io/Place/AutoComplete';
const GOONG_PLACE_DETAIL_URL = 'https://rsapi.goong.io/Place/Detail';
const GOONG_GEOCODE_URL = 'https://rsapi.goong.io/Geocode';

/**
 * @route POST /api/search/autocomplete
 * @desc Proxy Goong autocomplete - hides API key
 * @access Public
 */
router.post('/autocomplete', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || input.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Input must be at least 3 characters'
      });
    }

    const response = await axios.get(GOONG_AUTOCOMPLETE_URL, {
      params: {
        input: input.trim(),
        api_key: process.env.GOONG_API_KEY
      },
      timeout: 5000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('🚨 Goong autocomplete error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch autocomplete suggestions'
    });
  }
});

/**
 * @route POST /api/search/place-detail
 * @desc Proxy Goong place detail - hides API key
 * @access Public
 */
router.post('/place-detail', async (req, res) => {
  try {
    const { place_id } = req.body;

    if (!place_id) {
      return res.status(400).json({
        success: false,
        message: 'place_id is required'
      });
    }

    const response = await axios.get(GOONG_PLACE_DETAIL_URL, {
      params: {
        place_id: place_id,
        api_key: process.env.GOONG_API_KEY
      },
      timeout: 5000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('🚨 Goong place detail error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch place details'
    });
  }
});

/**
 * @route POST /api/search/geocode
 * @desc Proxy Goong reverse geocode - hides API key
 * @access Public
 */
router.post('/geocode', async (req, res) => {
  try {
    const { latlng } = req.body;

    if (!latlng) {
      return res.status(400).json({
        success: false,
        message: 'latlng is required (format: "lat,lng")'
      });
    }

    const response = await axios.get(GOONG_GEOCODE_URL, {
      params: {
        latlng: latlng,
        api_key: process.env.GOONG_API_KEY
      },
      timeout: 5000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('🚨 Goong geocode error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch geocode data'
    });
  }
});

/**
 * @route GET /api/search/maptiles-key
 * @desc Serve Goong Maptiles key (public key for rendering map tiles)
 * @access Public
 */
router.get('/maptiles-key', (req, res) => {
  res.json({
    maptilesKey: process.env.GOONG_MAPTILES_KEY
  });
});

module.exports = router;
