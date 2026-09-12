/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TravelerDNA,
  TripOverview,
  UserProfile,
  PastTrip,
  ItineraryDay,
  DiscoveredPlace,
  VendorQuote,
  ExpenseItem,
} from '../types.ts';

export const initialDemoExpenses: ExpenseItem[] = [
  { id: 'exp-1', category: 'Accommodation', title: 'Hotel Gracery Shinjuku (4 nights)', amount: 68400, date: 'Oct 12', status: 'Pre-paid' },
  { id: 'exp-2', category: 'Accommodation', title: 'Kyoto Machiya Private Residence (4 nights)', amount: 64600, date: 'Oct 16', status: 'Confirmed' },
  { id: 'exp-3', category: 'Dining', title: 'Sushi Dai Omakase Experience', amount: 17100, date: 'Oct 14', status: 'Estimated' },
  { id: 'exp-4', category: 'Transit', title: 'Shinkansen Nozomi Bullet Train', amount: 11400, date: 'Oct 15', status: 'Confirmed' },
  { id: 'exp-5', category: 'Experience', title: 'teamLab Planets Digital Tickets', amount: 5700, date: 'Oct 14', status: 'Pre-paid' },
];

export const initialTravelerDNA: TravelerDNA = {
  budgetPerDay: 33250,
  luxuryLevel: 4, // Premium
  maxDailyWalkKm: 8,
  earliestWakeTime: '9:00 AM - Standard Start',
  crowdTolerance: 'Medium',
  interests: ['Photography', 'Specialty Coffee', 'Fine Dining'],
  lifestyleRules: {
    vegetarianOnly: true,
    noEarlyFlights: false,
    mustHaveGym: true,
  },
};

export const allInterestsList = [
  'Photography',
  'Specialty Coffee',
  'Fine Dining',
  'Anime & Manga',
  'Modern Art',
  'History Buff',
  'Nightlife',
  'Nature Trails',
  'Street Food',
  'Architecture',
  'Hidden Izakayas',
  'Tea Ceremonies',
  'Hot Springs / Onsen',
  'Vintage Shopping',
];

export const initialTripOverview: TripOverview = {
  title: 'Tokyo & Kyoto Cultural Odyssey',
  destination: 'Tokyo, Kyoto',
  durationDays: 9,
  totalBudget: 237500,
  allocatedBudget: 220400,
  currency: 'INR',
  summary: 'A curated 9-day journey focusing on culture, cuisine, and modern contrasts.',
  tags: ['Cultural Immersion', 'Foodie', 'Moderate Pace'],
};

export const initialUserProfile: UserProfile = {
  name: 'Aarav Mehta',
  roleTitle: 'World Traveler & Connoisseur',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqOSlYYTMhzaCh4toWQSkhVxwnqK1Cpdte2-upaRs3D-DYALiY1rbO19oNyB5FJ0liw2TF3Z3Hz15oUvmepUXJhZffTZ8YtZbQDvkzpkafp5LE5PEbxvNqj3mXyrQf0lCMX3bf3J9syg1bFxOzYvIWCklc4j5SvVgK1C-Tq7os6eeG1DAgnWZpMHWA4ktVRCgp_wUskm-PFihooIrU1q7XexWZy4au3kamfuKpk3HvAyKCDBTdRbzCMA',
  tags: ['Foodie', 'Architecture', 'Luxury'],
  stats: {
    countriesVisited: 14,
    totalTrips: 28,
    memberSince: 2021,
  },
};

export const initialPastTrips: PastTrip[] = [
  {
    id: 'trip-lisbon-2023',
    title: 'Lisbon 2023',
    datesOrYear: 'Sep 2023',
    duration: '7 days • Cultural & Culinary Focus',
    focus: 'Cultural & Culinary',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAFZVQSHbXH24iIeuIQaSy0uk4GkRs45ykNyZVQsIpxIPwkcgqSPcSQV2bbJWYnn83PUNb_cWpVpdk3Aj__on-xqLx76_e0FASK4jue_3qfSdLY-acqb76v-PO4F0dFjGGanJJ61-U4YfELQNEY82oLP2kYEteD3kHWchifMzcG45K6PGCtn9_if13l7X1LXTysGvNw5kTUN--v5DT5-8-ZEzDCzcphXdrFw8QvqLy2S10KrMI1gTidw',
    status: 'Completed',
  },
  {
    id: 'trip-bali-2022',
    title: 'Bali Retreat 2022',
    datesOrYear: 'Nov 2022',
    duration: '10 days • Wellness & Nature',
    focus: 'Wellness & Nature',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAztRKfh_zxcHIAwAwG2W_yZAu9r-e3BLIbMSA06D8p_fkzSE-WzoV43kEf3psxze_SJGCcVOZpyEwH-VJOFTeWdLHGsNyzccQziujTIOqrMfUAJbbBHDyzAig9PU2qmGzd8aIlNW0_uXQTXmMurxeDxblb-19905jioQPbwt0oHlS7A2eo5W7A7WoDHBCWbD-ccGUxv-0iMu2Rq2bO5nBeq5egT6mZVMGTAOi41uR5vT-Md8mWExV9ng',
    status: 'Completed',
  },
];

export const initialItineraryDays: ItineraryDay[] = [
  {
    dayNumber: 1,
    date: 'Oct 12, 2024',
    title: 'Tokyo Arrival & Shinjuku Horizon',
    theme: 'Arrival & Skyline Views',
    items: [
      {
        type: 'activity',
        data: {
          id: 'act-1-1',
          time: '03:00 PM',
          title: 'Check-in: Hotel Gracery Shinjuku',
          category: 'Architecture',
          description: 'Settle in the heart of Shinjuku with sweeping skyline views and minimalist Japanese aesthetic.',
          duration: '1 hr',
          cost: 'Pre-paid',
          imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
          isLocked: true,
          coordinates: { lat: 35.6938, lng: 139.7034 },
        },
      },
      {
        type: 'transit',
        data: {
          id: 'tran-1-1',
          type: 'walk',
          description: 'Walk to Omoide Yokocho',
          duration: '10 mins',
        },
      },
      {
        type: 'activity',
        data: {
          id: 'act-1-2',
          time: '06:30 PM',
          title: 'Omoide Yokocho Lantern Stroll',
          category: 'Foodie',
          description: 'Atmospheric alleyway exploration with artisan yakitori and vegetarian seasonal skewers.',
          duration: '2 hrs',
          cost: '¥3,500',
          imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
          isLocked: false,
          coordinates: { lat: 35.6931, lng: 139.6998 },
        },
      },
    ],
  },
  {
    dayNumber: 2,
    date: 'Oct 13, 2024',
    title: 'Meiji Shrine & Omotesando Cafes',
    theme: 'Sacred Forest & Design',
    items: [
      {
        type: 'activity',
        data: {
          id: 'act-2-1',
          time: '09:00 AM',
          title: 'Meiji Jingu Morning Meditation',
          category: 'Culture',
          description: 'Walk through the towering cedar forest to Tokyo’s most revered Shinto shrine.',
          duration: '2 hrs',
          cost: 'Free entry',
          imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
          isLocked: true,
          coordinates: { lat: 35.6764, lng: 139.6993 },
        },
      },
      {
        type: 'transit',
        data: {
          id: 'tran-2-1',
          type: 'walk',
          description: 'Walk along Omotesando boulevard',
          duration: '15 mins',
        },
      },
      {
        type: 'activity',
        data: {
          id: 'act-2-2',
          time: '12:00 PM',
          title: 'Koffee Mameya Specialty Tasting',
          category: 'Foodie',
          description: 'Exclusive coffee couture consultation with rare Japanese single-origin roasts.',
          duration: '1 hr',
          cost: '¥1,800',
          imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
          isLocked: false,
          coordinates: { lat: 35.6685, lng: 139.7095 },
        },
      },
    ],
  },
  {
    dayNumber: 3,
    date: 'Oct 14, 2024',
    title: 'Tokyo: Tradition & Tech',
    theme: 'Historical Asakusa & Modern Toyosu',
    items: [
      {
        type: 'activity',
        data: {
          id: 'act-3-1',
          time: '09:00 AM',
          title: 'Senso-ji Temple Visit',
          category: 'Culture',
          categoryBgColor: '#E8D8B0',
          description: "Explore Tokyo's oldest Buddhist temple. Early arrival recommended to avoid crowds and experience the tranquil atmosphere of Asakusa.",
          duration: '2 hrs',
          cost: 'Free entry',
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhBYYOeHPvnMKbWuhhDYSbfCicJoPaTwLnjlyEP3BO6hGfO5sJNoR0SnWaT0qGzGeUmxA3feZsPpi3r5KdFC2x0prlF3lnsx1I2fB3rsBCElWecBS9odafRGLbxu18Ra54k4Jj_QgW2HDOoeFVlkJPBv7Op1jDsR1mwBdIb9Q1fvYR5kHKomPp1L3vUKJuEL7SQxPnKA5QAv4oYYyvrTIqUtF5n8wu6Y9Ch_6UaCp41vxHqBI-RRfF0w',
          isLocked: true,
          coordinates: { lat: 35.7148, lng: 139.7967 },
          replanOptions: [
            {
              title: 'Nezu Shrine Peaceful Torii Walk',
              category: 'Culture',
              description: 'Lesser-known quiet shrine featuring a tunnel of vermilion torii gates and tranquil koi ponds.',
              duration: '1.5 hrs',
              cost: 'Free entry',
              imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
            },
            {
              title: 'Tokyo National Museum Gallery',
              category: 'Culture',
              description: 'Marvel at classical Japanese samurai armor, screens, and ancient Buddhist sculpture.',
              duration: '2.5 hrs',
              cost: '¥1,000',
              imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
            },
          ],
        },
      },
      {
        type: 'transit',
        data: {
          id: 'tran-3-1',
          type: 'train',
          description: 'Ginza Line to Shibuya',
          duration: '30 mins',
          cost: '¥200',
        },
      },
      {
        type: 'activity',
        data: {
          id: 'act-3-2',
          time: '12:30 PM',
          title: 'Sushi Dai Omakase',
          category: 'Foodie',
          categoryBgColor: '#f4e2ac',
          description: "Premium sushi experience in Toyosu. Reservation required well in advance. Chef's selection based on seasonal catch.",
          duration: '1.5 hrs',
          cost: '$$$$',
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCimBbi24NbC6YB-VHzWH2mLmxdEAsM9IRkTuVOBQI9rtKCJ5ZwZhlSV-_PdVVyKoouLxXvsbUaX9GrHoaf80vglDuC5AR-EHOlz1Maa2nhid6iOqCIouRoxbwUAwkz-t41VTkXnAm5wGgwVd8rfaIHw3JcSY746uzSa6BsN1KSymPjuZtbCViCkxbC_mLTXvBXRdHpntPcIxocVwpBHHffN-8QmoEjoAAyvLaDMEtqWRRj_O-V-MdbFQ',
          isLocked: false,
          coordinates: { lat: 35.6468, lng: 139.7891 },
          replanOptions: [
            {
              title: 'Daigo Buddhist Shojin Ryori',
              category: 'Foodie',
              description: 'Two-Michelin-starred vegetarian temple cuisine served in private tatami rooms overlooking garden courtyards.',
              duration: '2 hrs',
              cost: '$$$$',
              imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            },
            {
              title: 'Afuri Vegan Yuzu Ramen Ebisu',
              category: 'Foodie',
              description: 'Delicate citrus-infused ramen with seasonal vegetables and organic bamboo shoots.',
              duration: '1 hr',
              cost: '$$',
              imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            },
          ],
        },
      },
      {
        type: 'transit',
        data: {
          id: 'tran-3-2',
          type: 'walk',
          description: 'Walk to teamLab',
          duration: '15 mins',
        },
      },
      {
        type: 'activity',
        data: {
          id: 'act-3-3',
          time: '03:00 PM',
          title: 'teamLab Planets Digital Wonderland',
          category: 'Modern Art',
          description: 'Walk through water in an interactive sensory museum where digital blooms respond to human presence.',
          duration: '2 hrs',
          cost: '¥3,800',
          imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
          isLocked: true,
          coordinates: { lat: 35.6518, lng: 139.7915 },
        },
      },
    ],
  },
  {
    dayNumber: 4,
    date: 'Oct 15, 2024',
    title: 'Kyoto Shinkansen & Gion Stroll',
    theme: 'Bullet Train & Ancient Geisha District',
    items: [
      {
        type: 'activity',
        data: {
          id: 'act-4-1',
          time: '10:00 AM',
          title: 'Nozomi Shinkansen to Kyoto',
          category: 'Culture',
          description: 'High-speed 285 km/h transit past Mount Fuji with luxury green car window seating.',
          duration: '2 hrs 15 mins',
          cost: '¥14,000',
          imageUrl: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80',
          isLocked: true,
          coordinates: { lat: 34.9858, lng: 135.7588 },
        },
      },
      {
        type: 'transit',
        data: {
          id: 'tran-4-1',
          type: 'walk',
          description: 'Walk through Shirakawa canal',
          duration: '20 mins',
        },
      },
      {
        type: 'activity',
        data: {
          id: 'act-4-2',
          time: '05:30 PM',
          title: 'Gion Evening Lantern Walk',
          category: 'Architecture',
          description: 'Preserved 17th-century wooden machiya merchant houses softly lit by paper lanterns.',
          duration: '2 hrs',
          cost: 'Free',
          imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
          isLocked: false,
          coordinates: { lat: 35.0037, lng: 135.7772 },
        },
      },
    ],
  },
];

export const smartDiscoveryPlaces: DiscoveredPlace[] = [
  {
    id: 'disc-1',
    name: 'Koffee Mameya Kakeru',
    category: 'Specialty Coffee',
    rating: 4.9,
    reviewCount: 384,
    priceLevel: '$$$',
    neighborhood: 'Kiyosumi Shirakawa',
    description: 'An omakase-style coffee laboratory pairing roast profiles with delicate Japanese sweets.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    matchScore: 98,
    matchReasons: ['Matches Specialty Coffee DNA', 'Low crowd density', 'Editorial review favorite'],
  },
  {
    id: 'disc-2',
    name: 'Daigo Shojin Ryori',
    category: 'Fine Dining',
    rating: 4.8,
    reviewCount: 290,
    priceLevel: '$$$$',
    neighborhood: 'Atago, Minato-ku',
    description: 'Two Michelin stars honoring pure plant-based Buddhist temple cuisine in private tea houses.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    matchScore: 96,
    matchReasons: ['100% Vegetarian certified', 'Matches Fine Dining DNA', 'Tranquil private garden'],
  },
  {
    id: 'disc-3',
    name: 'Mori Building Digital Art Museum',
    category: 'Modern Art',
    rating: 4.7,
    reviewCount: 1420,
    priceLevel: '$$$',
    neighborhood: 'Toranomon Hills',
    description: 'Borderless projection spaces transforming light into living waterfalls and tea flowers.',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    matchScore: 94,
    matchReasons: ['Indoor experience (Rain-Swap ready)', 'Visual masterpiece'],
  },
  {
    id: 'disc-4',
    name: 'Yanaka Old Quarter Heritage Walk',
    category: 'Architecture',
    rating: 4.9,
    reviewCount: 810,
    priceLevel: 'Free',
    neighborhood: 'Yanaka, Taito',
    description: 'Pre-war wooden alleyways, artisan ceramic shops, and cemetery cherry blossom paths.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    matchScore: 92,
    matchReasons: ['Within 8km daily walk budget', 'Bypasses standard tourist crowds'],
  },
];

// Spec.md Part 1 Sample Discovered Vendors for Local Errand & Concierge engine
export const sampleDiscoveredQuotes: VendorQuote[] = [
  {
    id: 'quote-101',
    vendorName: 'Sakura Fabric Care Express',
    channel: 'telegram',
    service: 'Premium Wash, Iron & Doorstep Drop',
    lineItems: [
      { label: 'Dress Shirts (Ironed & Hung)', qty: 4, unitPrice: 350 },
      { label: 'Trousers (Gentle Steam)', qty: 2, unitPrice: 400 },
      { label: 'Eco-Friendly Detergent', qty: 1, unitPrice: 100 },
    ],
    pickupFee: 0,
    dropFee: 0,
    total: 2300,
    currency: '¥',
    turnaroundHours: 24,
    rating: 4.9,
    distanceKm: 0.9,
    pickupSlot: 'Today 4:00 PM - 5:00 PM',
    status: 'proposed',
  },
  {
    id: 'quote-102',
    vendorName: 'Ginza Valet Laundry & Dryclean',
    channel: 'whatsapp',
    service: 'Express 12-Hour Wash & Press',
    lineItems: [
      { label: 'Garment Care Suite', qty: 6, unitPrice: 420 },
      { label: 'Express Delivery Surcharge', qty: 1, unitPrice: 300 },
    ],
    pickupFee: 200,
    dropFee: 200,
    total: 3220,
    currency: '¥',
    turnaroundHours: 12,
    rating: 4.8,
    distanceKm: 1.6,
    pickupSlot: 'Today 2:30 PM - 3:30 PM',
    status: 'proposed',
  },
];
