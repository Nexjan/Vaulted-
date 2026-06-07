export type PropertyType =
  | 'Treehouse'
  | 'Lighthouse'
  | 'Houseboat'
  | 'Yurt'
  | 'Cave House'
  | 'Geodesic Dome'
  | 'Converted Church'
  | 'Train Caboose'
  | 'Igloo'
  | 'Windmill'
  | 'Shipping Container'
  | 'Castle Tower'
  | 'Apartment'
  | 'Cabin'
  | 'Villa';

export interface Listing {
  id: string;
  title: string;
  city: string;
  country: string;
  propertyType: PropertyType;
  tags: string[];
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  emoji: string;
  description: string;
}
