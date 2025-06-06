
// src/types/index.ts

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAdmin?: boolean;
  role?: 'admin' | 'user'; // Added role
}

export interface Address {
  id?: string;
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
  imageUrls: string[]; // Changed from imageUrl: string
  videoUrls?: string[]; // New field for videos
  price: number;
  category?: string;
  tags?: string[];
  availableMaterials: string[];
  stock?: number;
}

export interface MaterialOption {
  id: string;
  name: string;
  description?: string;
}

export interface CartItemBase {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string; // Primary image for cart display
}
export interface CartStickerItem extends CartItemBase {
  type: 'sticker';
  stickerId: string;
  material?: string;
}

export interface CartCustomItem extends CartItemBase {
  type: 'custom';
  originalImageUrl: string;
  material: string;
}

export type CartItem = CartStickerItem | CartCustomItem;


export interface OrderItem extends CartItemBase { // Could be more specific if order items differ structurally from cart items
  // any order-specific item properties
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[]; // Use OrderItem if defined, otherwise CartItem
  totalAmount: number;
  shippingAddress: Address;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface ImageResolutionResult {
  isResolutionMet: boolean;
  width: number;
  height: number;
  message: string;
}

// For the new user management feature
export interface UserDocument {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'admin' | 'user';
    createdAt?: any; // Firestore Timestamp
    lastLogin?: any; // Firestore Timestamp
}
