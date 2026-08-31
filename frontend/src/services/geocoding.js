/**
 * ResQNet Geocoding & Reverse Geocoding Service
 * Abstraction layer for searching places and resolving GPS coordinates.
 */

// Fallback high-fidelity local landmarks for ultra-fast offline/fallback lookup
const LOCAL_LANDMARKS = [
  {
    displayName: '42 Harbour Road, Sector 4, Chennai Port, Chennai, Tamil Nadu, 600001',
    shortAddress: '42 Harbour Road, Sector 4',
    latitude: 13.082680,
    longitude: 80.270718,
    type: 'port',
    district: 'Harbour Zone'
  },
  {
    displayName: 'Chennai Central Railway Station, Kannappar Thidal, Periyamet, Chennai, Tamil Nadu 600003',
    shortAddress: 'Chennai Central Railway Station',
    latitude: 13.0827,
    longitude: 80.2754,
    type: 'station',
    district: 'Periyamet'
  },
  {
    displayName: 'Ripon Building, Sydenhams Road, Periyamet, Chennai, Tamil Nadu 600003',
    shortAddress: 'Ripon Building (Corporation HQ)',
    latitude: 13.0838,
    longitude: 80.2725,
    type: 'government',
    district: 'Central Zone'
  },
  {
    displayName: 'Rajiv Gandhi Government General Hospital, EVR Periyar Salai, Park Town, Chennai 600003',
    shortAddress: 'Rajiv Gandhi General Hospital',
    latitude: 13.0805,
    longitude: 80.2785,
    type: 'hospital',
    district: 'Park Town'
  },
  {
    displayName: 'Anna Nagar Tower Park, 3rd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
    shortAddress: 'Anna Nagar Tower Park',
    latitude: 13.0850,
    longitude: 80.2100,
    type: 'park',
    district: 'Anna Nagar'
  },
  {
    displayName: 'Marina Beach Promenade, Kamarajar Salai, Triplicane, Chennai 600005',
    shortAddress: 'Marina Beach Promenade',
    latitude: 13.0500,
    longitude: 80.2824,
    type: 'coastal',
    district: 'Mylapore / Triplicane'
  },
  {
    displayName: 'T. Nagar Ranganathan Street, T. Nagar, Chennai, Tamil Nadu 600017',
    shortAddress: 'T. Nagar Commercial Center',
    latitude: 13.0405,
    longitude: 80.2337,
    type: 'commercial',
    district: 'T. Nagar'
  },
  {
    displayName: 'Guindy Industrial Estate, Guindy, Chennai, Tamil Nadu 600032',
    shortAddress: 'Guindy Industrial Estate',
    latitude: 13.0102,
    longitude: 80.2120,
    type: 'industrial',
    district: 'Guindy'
  },
  {
    displayName: 'Adyar Bridge, Sardar Patel Road, Adyar, Chennai 600020',
    shortAddress: 'Adyar Bridge & River Crossing',
    latitude: 13.0067,
    longitude: 80.2575,
    type: 'bridge',
    district: 'Adyar'
  },
  {
    displayName: 'Koyambedu Wholesale Market Complex, Koyambedu, Chennai 600107',
    shortAddress: 'Koyambedu Market Hub',
    latitude: 13.0694,
    longitude: 80.1948,
    type: 'market',
    district: 'Koyambedu'
  }
];

class GeocodingService {
  constructor() {
    this.nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
    this.cache = new Map();
  }

  /**
   * Search for locations matching a query string.
   * @param {string} query - Freeform place or street name.
   * @returns {Promise<Array<{displayName: string, shortAddress: string, latitude: number, longitude: number, type: string, district: string}>>}
   */
  async search(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const trimmed = query.trim();
    const cacheKey = `search:${trimmed.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 1. Check local landmark matches first
    const localMatches = LOCAL_LANDMARKS.filter(item => {
      const q = trimmed.toLowerCase();
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.shortAddress.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
      );
    });

    try {
      // 2. Fetch live geocoding results with Nominatim
      const url = `${this.nominatimBaseUrl}/search?format=json&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=8`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ResQNet-Emergency-Platform/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding server responded with status ${response.status}`);
      }

      const rawResults = await response.json();
      const mappedResults = rawResults.map(item => {
        const addr = item.address || {};
        const short = item.name || addr.road || addr.suburb || item.display_name.split(',')[0];
        const district = addr.suburb || addr.city_district || addr.county || addr.city || 'Urban Area';

        return {
          displayName: item.display_name,
          shortAddress: short,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type || item.class || 'place',
          district
        };
      });

      // Combine local matches (if any) and live geocoded results, de-duplicating by coordinates
      const combined = [...localMatches];
      mappedResults.forEach(r => {
        const isDuplicate = combined.some(c => 
          Math.abs(c.latitude - r.latitude) < 0.0005 && Math.abs(c.longitude - r.longitude) < 0.0005
        );
        if (!isDuplicate) {
          combined.push(r);
        }
      });

      const finalResults = combined.slice(0, 8);
      this.cache.set(cacheKey, finalResults);
      return finalResults;
    } catch (err) {
      console.warn('[GeocodingService] Network search fallback to local dictionary:', err.message);
      if (localMatches.length > 0) {
        return localMatches;
      }
      // If no direct local match, return fuzzy match on words or default list
      return LOCAL_LANDMARKS.slice(0, 4);
    }
  }

  /**
   * Reverse-geocode latitude and longitude into a human-readable street address.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<{displayName: string, shortAddress: string, latitude: number, longitude: number, district: string, city: string}>}
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinates for reverse geocoding');
    }

    const cacheKey = `rev:${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if close to a known local landmark
    const closestLandmark = LOCAL_LANDMARKS.find(item => 
      Math.abs(item.latitude - lat) < 0.001 && Math.abs(item.longitude - lon) < 0.001
    );

    if (closestLandmark) {
      const result = {
        displayName: closestLandmark.displayName,
        shortAddress: closestLandmark.shortAddress,
        latitude: lat,
        longitude: lon,
        district: closestLandmark.district,
        city: 'Chennai'
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    try {
      const url = `${this.nominatimBaseUrl}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ResQNet-Emergency-Platform/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      const addr = data.address || {};
      const street = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || 'Sector Coordinate';
      const district = addr.suburb || addr.city_district || addr.county || addr.city || 'District Zone';
      const city = addr.city || addr.town || addr.state || 'Chennai';
      const shortAddress = street !== district ? `${street}, ${district}` : street;

      const result = {
        displayName: data.display_name || `${shortAddress}, ${city}`,
        shortAddress: shortAddress || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        latitude: lat,
        longitude: lon,
        district,
        city
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[GeocodingService] Reverse geocode network error, generating coordinate address:', err.message);
      const fallbackResult = {
        displayName: `Incident Location (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
        shortAddress: `GPS Sector (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
        latitude: lat,
        longitude: lon,
        district: 'Monitored Sector',
        city: 'Metropolitan Zone'
      };
      return fallbackResult;
    }
  }
}

export const geocodingService = new GeocodingService();
export default geocodingService;
