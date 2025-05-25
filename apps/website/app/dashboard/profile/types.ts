export type BusinessHours = {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
};

export type AnnualClosure = {
  id: string;
  date: string;
  name: string;
  description?: string;
};

export type BusinessProfile = {
  name: string;
  phone: string;
  googleMapsUrl: string;
  hours: BusinessHours;
  logoUrl?: string;
  coverImages: string[];
  annualClosures: AnnualClosure[];
  galleryImages: string[];
};