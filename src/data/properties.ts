export interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  city: string;
  state: string;
  image: string;
  type: 'house' | 'apartment' | 'condo' | 'townhouse';
  status: 'for-sale' | 'for-rent' | 'sold';
  featured: boolean;
}

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Apartment',
    price: 850000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    image: '/src/assets/property-1.jpg',
    type: 'apartment',
    status: 'for-sale',
    featured: true,
  },
  {
    id: '2',
    title: 'Beautiful Family Home',
    price: 650000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2500,
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    image: '/src/assets/property-2.jpg',
    type: 'house',
    status: 'for-sale',
    featured: true,
  },
  {
    id: '3',
    title: 'Luxury Penthouse Suite',
    price: 1200000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1800,
    address: '789 Tower Plaza',
    city: 'New York',
    state: 'NY',
    image: '/src/assets/property-3.jpg',
    type: 'condo',
    status: 'for-sale',
    featured: true,
  },
  {
    id: '4',
    title: 'Charming Suburban Home',
    price: 425000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1800,
    address: '321 Elm Street',
    city: 'Denver',
    state: 'CO',
    image: '/src/assets/property-2.jpg',
    type: 'house',
    status: 'for-sale',
    featured: false,
  },
  {
    id: '5',
    title: 'Modern Loft Space',
    price: 3500,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 900,
    address: '555 Arts District',
    city: 'Los Angeles',
    state: 'CA',
    image: '/src/assets/property-1.jpg',
    type: 'apartment',
    status: 'for-rent',
    featured: false,
  },
  {
    id: '6',
    title: 'Waterfront Townhouse',
    price: 780000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 2200,
    address: '888 Harbor View',
    city: 'Seattle',
    state: 'WA',
    image: '/src/assets/property-3.jpg',
    type: 'townhouse',
    status: 'for-sale',
    featured: false,
  },
];