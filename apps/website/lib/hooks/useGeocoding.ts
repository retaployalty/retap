import { useState, useCallback } from 'react';
import { geocodingService, GeocodingResult, GeocodingError } from '../geocoding';

interface UseGeocodingReturn {
  geocodeAddress: (address: string) => Promise<GeocodingResult | GeocodingError>;
  reverseGeocode: (latitude: number, longitude: number) => Promise<GeocodingResult | GeocodingError>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGeocoding(): UseGeocodingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult | GeocodingError> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodingService.geocodeAddress(address);
      
      if ('error' in result) {
        setError(result.message);
        return result;
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto durante il geocoding';
      setError(errorMessage);
      return {
        error: 'UNKNOWN_ERROR',
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<GeocodingResult | GeocodingError> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodingService.reverseGeocode(latitude, longitude);
      
      if ('error' in result) {
        setError(result.message);
        return result;
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto durante il reverse geocoding';
      setError(errorMessage);
      return {
        error: 'UNKNOWN_ERROR',
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    geocodeAddress,
    reverseGeocode,
    isLoading,
    error,
    clearError
  };
}
