'use strict';

(function (global) {
  const INLINE_FALLBACK_KEY = 'AIzaSyCX5HBIXHrQCLT17JimpQrZ0yw6R9XErAc';

  function resolveGeminiKey() {
    if (typeof global.__GEMINI_API_KEY__ === 'string' && global.__GEMINI_API_KEY__.length > 0) {
      return global.__GEMINI_API_KEY__;
    }
    return INLINE_FALLBACK_KEY;
  }

  global.AppConfig = Object.freeze({
    URLS: Object.freeze({
      REGIONS_GEOJSON:
        'https://raw.githubusercontent.com/open-data-kazakhstan/geo-boundaries-kz/master/data/geojson/v2/regions.json',
      OVERPASS: 'https://overpass-api.de/api/interpreter',
      GEMINI_GENERATE:
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    }),

    MAP: Object.freeze({
      CENTER_AKMOLA: Object.freeze([52.5, 70.0]),
      ZOOM_DEFAULT: 7,
      OVERPASS_TIMEOUT_MS: 42000,
      REGION_STYLE: Object.freeze({
        color: '#1e40af',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2
      }),
      REGION_STYLE_SUBTLE: Object.freeze({
        color: '#1e40af',
        fillColor: '#3b82f6',
        fillOpacity: 0.05,
        weight: 2
      })
    }),

    PAGE_ROUTES: Object.freeze({
      mobile: 'telephone.html',
      internet: 'tv.html',
      masts: 'communications.html'
    }),

    getGeminiApiKey() {
      return resolveGeminiKey();
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);