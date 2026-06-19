import { Listing } from '../lib/types';

export const listings: Listing[] = [
  {
    id: 'under-canvas-white-mountains',
    name: 'Under Canvas White Mountains',
    city: 'Dalton',
    region: 'New Hampshire',
    country: 'USA',
    latitude: 44.3978,
    longitude: -71.7298,
    propertyType: 'Tent',
    amenities: ['stargazing', 'wood stove', 'fire pit', 'hot showers', 'mountain views', 'hiking nearby', 'glamping', 'breakfast available'],
    pricePerNight: 289,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 312,
    maxGuests: 2,
    emoji: '⛺',
    imageUrls: ['https://loremflickr.com/800/600/glamping,tent,stars?lock=42'],
    bookingUrl: 'https://www.booking.com/hotel/us/under-canvas-white-mountains.en-us.html',
    description: 'A luxury glamping retreat of glowing safari-style tents set beneath the Milky Way in New Hampshire\'s White Mountains. Canvas walls, real beds, wood stoves, and an unobstructed canopy of stars.',
    source: 'booking.com',
  },
];
