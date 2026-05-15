export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  category?: string;
  stock: number;
  createdAt: any;
}

export interface StoreData {
  storeName: string;
  storeSlug: string;
  categories?: string[];
  themeColor?: string;
  backgroundColor?: string;
  textColor?: string;
  heroImage?: string;
  whatsappNumber?: string;
  subscriptionPlan?: 'free' | 'essential' | 'pro';
  subscriptionValidUntil?: any; // Firestore Timestamp
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: string;
}
