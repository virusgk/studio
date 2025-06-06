// src/types/index.ts

// Use import type for type-only imports if needed in other files
// import type { FirebaseUser } from 'firebase/auth'; // Example if you wrap FirebaseUser

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
}

export interface Address {
  id?: string; // Optional: if stored separately with an ID
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Sticker {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category?: string;
  tags?: string[];
  availableMaterials: string[]; // e.g., ['vinyl', 'paper-matte']
  stock?: number; // For inventory
}

export interface MaterialOption {
  id: string;
  name: string;
  description?: string;
}

export interface CartItemBase {
  id: string; // Can be stickerId or a unique ID for custom item
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
export interface CartStickerItem extends CartItemBase {
  type: 'sticker';
  stickerId: string;
  material?: string; // If pre-designed stickers can have material options
}

export interface CartCustomItem extends CartItemBase {
  type: 'custom';
  originalImageUrl: string; // For display or re-order
  material: string;
}

export type CartItem = CartStickerItem | CartCustomItem;


export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress: Address;
  orderDate: string; // ISO date string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

// For AI resolution check
export interface ImageResolutionResult {
  isResolutionMet: boolean;
  width: number;
  height: number;
  message: string;
}
