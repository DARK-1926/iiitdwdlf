import { Item, User, Claim, ItemCategory, ItemStatus, categoryIcons, statusLabels, statusColors } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: 'user2',
    name: 'Sam Taylor',
    email: 'sam@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    id: 'user3',
    name: 'Jamie Lee',
    email: 'jamie@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
  },
];

// Current authenticated user (for demo)
export const currentUser: User = mockUsers[0];

// Mock Items
export const mockItems: Item[] = [
  {
    id: 'item1',
    title: 'Blue Backpack',
    description: 'Navy blue North Face backpack with red zipper, has a math textbook inside',
    category: 'accessories' as ItemCategory,
    status: 'lost' as ItemStatus,
    location: 'Central Park, near the fountain',
    date: '2025-04-15T15:30:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[0],
    createdAt: '2025-04-15T16:00:00Z',
    updatedAt: '2025-04-15T16:00:00Z',
  },
  {
    id: 'item2',
    title: 'House Keys with Red Keychain',
    description: 'House keys with a distinctive red rabbit keychain. Has 3 keys on the ring.',
    category: 'keys' as ItemCategory,
    status: 'found' as ItemStatus,
    location: 'Coffee shop on Main Street',
    date: '2025-04-14T10:15:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[1],
    createdAt: '2025-04-14T11:30:00Z',
    updatedAt: '2025-04-14T11:30:00Z',
  },
  {
    id: 'item3',
    title: 'Grey Tabby Cat',
    description: 'Small grey tabby cat with white paws and green eyes. Wearing a blue collar with a bell.',
    category: 'pets' as ItemCategory,
    status: 'lost' as ItemStatus,
    location: 'Oakwood neighborhood near Pine Street',
    date: '2025-04-16T07:45:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[2],
    createdAt: '2025-04-16T08:00:00Z',
    updatedAt: '2025-04-16T08:00:00Z',
  },
  {
    id: 'item4',
    title: 'iPhone 16 with Cracked Screen',
    description: 'Black iPhone 16 with a noticeable crack in the bottom right corner. Blue case with cloud pattern.',
    category: 'electronics' as ItemCategory,
    status: 'found' as ItemStatus,
    location: 'Bus stop on 5th Avenue',
    date: '2025-04-15T18:20:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[0],
    createdAt: '2025-04-15T19:00:00Z',
    updatedAt: '2025-04-15T19:00:00Z',
  },
  {
    id: 'item5',
    title: 'Brown Leather Wallet',
    description: 'Men\'s brown leather wallet with initials "JD" embossed on the front. Contains some cards but no cash.',
    category: 'accessories' as ItemCategory,
    status: 'found' as ItemStatus,
    location: 'City Gym locker room',
    date: '2025-04-16T12:00:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[1],
    createdAt: '2025-04-16T13:15:00Z',
    updatedAt: '2025-04-16T13:15:00Z',
  },
  {
    id: 'item6',
    title: 'Red Umbrella',
    description: 'Bright red compact umbrella with wooden handle. The brand name is worn off.',
    category: 'other' as ItemCategory,
    status: 'found' as ItemStatus,
    location: 'Downtown Library, reference section',
    date: '2025-04-13T14:45:00Z',
    images: ['/placeholder.svg'],
    reportedBy: mockUsers[2],
    createdAt: '2025-04-13T16:30:00Z',
    updatedAt: '2025-04-13T16:30:00Z',
  },
];

// Mock Claims
export const mockClaims: Claim[] = [
  {
    id: 'claim1',
    itemId: 'item2',
    userId: 'user3',
    description: 'These are my keys. The rabbit keychain was a gift from my daughter.',
    status: 'pending',
    createdAt: '2025-04-15T09:20:00Z',
  },
  {
    id: 'claim2',
    itemId: 'item4',
    userId: 'user2',
    description: 'This is my phone. I can verify by unlocking it and showing photos.',
    status: 'approved',
    createdAt: '2025-04-16T10:05:00Z',
  },
];
