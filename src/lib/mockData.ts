// Mock data for frontend testing
export const mockEquipment = [
  {
    id: '1',
    name: 'John Deere 5075E Tractor',
    description: 'Reliable 75HP tractor perfect for medium-sized farms. Comes with various attachments.',
    pricePerDay: 150,
    pricePerWeek: 900,
    deposit: 500,
    location: 'Lilongwe, Malawi',
    images: [],
    isAvailable: true,
    condition: 'Excellent',
    category: {
      name: 'Tractors',
    },
    vendor: {
      businessName: 'AgriEquip Rentals',
      rating: 4.8,
    },
  },
  {
    id: '2',
    name: 'Case IH Puma 210',
    description: 'Powerful 210HP tractor for large-scale farming operations.',
    pricePerDay: 280,
    pricePerWeek: 1680,
    deposit: 1000,
    location: 'Blantyre, Malawi',
    images: [],
    isAvailable: true,
    condition: 'Good',
    category: {
      name: 'Tractors',
    },
    vendor: {
      businessName: 'FarmTech Solutions',
      rating: 4.6,
    },
  },
  {
    id: '3',
    name: 'Kuhn Multi-Master 153',
    description: 'Versatile plow suitable for various soil types and conditions.',
    pricePerDay: 80,
    pricePerWeek: 480,
    deposit: 200,
    location: 'Mzuzu, Malawi',
    images: [],
    isAvailable: false,
    condition: 'Very Good',
    category: {
      name: 'Plows',
    },
    vendor: {
      businessName: 'AgriEquip Rentals',
      rating: 4.8,
    },
  },
  {
    id: '4',
    name: 'John Deere S690 Harvester',
    description: 'High-capacity combine harvester for efficient grain harvesting.',
    pricePerDay: 450,
    pricePerWeek: 2700,
    deposit: 2000,
    location: 'Lilongwe, Malawi',
    images: [],
    isAvailable: true,
    condition: 'Excellent',
    category: {
      name: 'Harvesters',
    },
    vendor: {
      businessName: 'Premium Farm Equipment',
      rating: 4.9,
    },
  },
  {
    id: '5',
    name: 'Irrigation Pump System',
    description: 'Complete irrigation system with pumps and pipes for 10 hectares.',
    pricePerDay: 120,
    pricePerWeek: 720,
    deposit: 400,
    location: 'Blantyre, Malawi',
    images: [],
    isAvailable: true,
    condition: 'Good',
    category: {
      name: 'Irrigation',
    },
    vendor: {
      businessName: 'FarmTech Solutions',
      rating: 4.6,
    },
  },
  {
    id: '6',
    name: 'Seed Drill 12-Row',
    description: 'Precision seed drill for accurate planting and optimal seed placement.',
    pricePerDay: 95,
    pricePerWeek: 570,
    deposit: 300,
    location: 'Mzuzu, Malawi',
    images: [],
    isAvailable: true,
    condition: 'Very Good',
    category: {
      name: 'Seeders',
    },
    vendor: {
      businessName: 'AgriEquip Rentals',
      rating: 4.8,
    },
  },
];

export const mockStats = {
  totalEquipment: 156,
  activeBookings: 23,
  completedBookings: 189,
  totalEarnings: 45678,
};
