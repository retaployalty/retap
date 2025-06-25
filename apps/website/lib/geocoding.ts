export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id: string;
}

export interface GeocodingError {
  error: string;
  message: string;
}

/**
 * Servizio per il geocoding degli indirizzi utilizzando OpenStreetMap/Nominatim (GRATUITO)
 */
export class GeocodingService {
  /**
   * Converte un indirizzo in coordinate geografiche usando Nominatim
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | GeocodingError> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ReTap-App/1.0' // Nominatim richiede un User-Agent
        }
      });

      if (!response.ok) {
        return {
          error: 'NETWORK_ERROR',
          message: 'Errore di rete durante il geocoding'
        };
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];

        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formatted_address: result.display_name,
          place_id: result.place_id.toString()
        };
      } else {
        return {
          error: 'GEOCODING_FAILED',
          message: 'Indirizzo non trovato'
        };
      }
    } catch (error) {
      console.error('Errore durante il geocoding:', error);
      return {
        error: 'NETWORK_ERROR',
        message: 'Errore di rete durante il geocoding'
      };
    }
  }

  /**
   * Converte coordinate in indirizzo (reverse geocoding) usando Nominatim
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | GeocodingError> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ReTap-App/1.0'
        }
      });

      if (!response.ok) {
        return {
          error: 'NETWORK_ERROR',
          message: 'Errore di rete durante il reverse geocoding'
        };
      }

      const data = await response.json();

      if (data && data.display_name) {
        return {
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          formatted_address: data.display_name,
          place_id: data.place_id.toString()
        };
      } else {
        return {
          error: 'REVERSE_GEOCODING_FAILED',
          message: 'Coordinate non valide'
        };
      }
    } catch (error) {
      console.error('Errore durante il reverse geocoding:', error);
      return {
        error: 'NETWORK_ERROR',
        message: 'Errore di rete durante il reverse geocoding'
      };
    }
  }

  /**
   * Valida se le coordinate sono valide
   */
  static isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Calcola la distanza tra due punti in chilometri (formula di Haversine)
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Istanza singleton del servizio
export const geocodingService = new GeocodingService();