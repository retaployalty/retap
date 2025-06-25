"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { useGeocoding } from '@/lib/hooks/useGeocoding';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange?: (latitude: number, longitude: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function AddressInput({
  value,
  onChange,
  onCoordinatesChange,
  label = "Indirizzo",
  placeholder = "Inserisci l'indirizzo completo...",
  required = false,
  className,
  disabled = false
}: AddressInputProps) {
  const { geocodeAddress, isLoading } = useGeocoding();
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [debouncedAddress, setDebouncedAddress] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounce dell'indirizzo per evitare troppe chiamate API
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedAddress(value);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  // Geocoding automatico quando l'indirizzo cambia
  useEffect(() => {
    if (debouncedAddress && debouncedAddress.length > 5) {
      performGeocoding(debouncedAddress);
    } else {
      setGeocodingStatus('idle');
    }
  }, [debouncedAddress]);

  const performGeocoding = async (address: string) => {
    if (!address.trim()) return;

    setGeocodingStatus('idle');

    const result = await geocodeAddress(address);

    if ('error' in result) {
      setGeocodingStatus('error');
    } else {
      setGeocodingStatus('success');
      if (onCoordinatesChange) {
        onCoordinatesChange(result.latitude, result.longitude);
      }
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="address" className="font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pr-10"
        />
        
        {geocodingStatus === 'success' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}