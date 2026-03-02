
export enum UserRole {
  ADMIN = 'Administrateur',
  SERVER = 'Serveur',
  KITCHEN = 'Cuisine',
  CASHIER = 'Caissier'
}

export enum OrderStatus {
  PENDING = 'En attente',
  PREPARING = 'En préparation',
  READY = 'Prêt',
  PAID = 'Payé',
  CANCELLED = 'Annulé'
}

export enum Currency {
  ARIARY = 'Ar',
  EURO = '€',
  USD = '$'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber: string;
  customerName?: string;
  serverName?: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: Date;
  total: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  isActive: boolean;
}
