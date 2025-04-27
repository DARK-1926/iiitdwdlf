
export type ItemStatus = 'lost' | 'found' | 'claimed' | 'returned';

export type ItemCategory = 
  | 'electronics' 
  | 'clothing' 
  | 'accessories' 
  | 'keys' 
  | 'documents' 
  | 'pets'
  | 'other';

export interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  location: string;
  date: string; // ISO date string
  images: string[];
  reportedBy: User;
  claimedBy?: User;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isVisible?: boolean;
  coordinates?: Coordinates;
}

export interface Claim {
  id: string;
  itemId: string;
  userId: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Category icons (for visual representation)
export const categoryIcons: Record<ItemCategory, string> = {
  electronics: '💻',
  clothing: '👕',
  accessories: '👜',
  keys: '🔑',
  documents: '📄',
  pets: '🐾',
  other: '📦',
};

// Export the array of item categories for use in forms and filters
export const itemCategories: ItemCategory[] = [
  'electronics',
  'clothing',
  'accessories',
  'keys',
  'documents',
  'pets',
  'other'
];

// Status display names
export const statusLabels: Record<ItemStatus, string> = {
  lost: 'Lost',
  found: 'Found',
  claimed: 'Claimed',
  returned: 'Returned'
};

// Status colors for UI
export const statusColors: Record<ItemStatus, string> = {
  lost: 'bg-amber-100 text-amber-800',
  found: 'bg-emerald-100 text-emerald-800',
  claimed: 'bg-blue-100 text-blue-800',
  returned: 'bg-purple-100 text-purple-800'
};

// Helper type for Supabase Auth User
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    full_name?: string;
  };
}
