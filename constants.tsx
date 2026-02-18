
import { Product, UserRole, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Burger Épicé Spécial', category: 'Plats', price: 18000, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', description: 'Notre burger signature avec piments jalapeños.', isActive: true },
  { id: '2', name: 'Poulet Frit Sauce Maison', category: 'Plats', price: 25000, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', isActive: true },
  { id: '3', name: 'Margarita Classique', category: 'Boissons', price: 15000, image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=400', isActive: true },
  { id: '4', name: 'Pizza Pepperoni', category: 'Plats', price: 32000, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', isActive: true },
  { id: '5', name: 'Café Glacé Brew', category: 'Boissons', price: 6000, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400', isActive: true },
  { id: '6', name: 'Fondant au Chocolat', category: 'Desserts', price: 12000, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', isActive: true },
  { id: '7', name: 'Salade César', category: 'Plats', price: 14000, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400', isActive: true },
  { id: '8', name: 'Bière Artisanale IPA', category: 'Boissons', price: 10000, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', isActive: true },
];

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Alex Johnson', role: UserRole.ADMIN, email: 'admin@gastroflow.com', isActive: true },
  { id: '2', name: 'Sarah Smith', role: UserRole.SERVER, email: 'sarah@gastroflow.com', isActive: true },
  { id: '3', name: 'Chef Marco', role: UserRole.KITCHEN, email: 'kitchen@gastroflow.com', isActive: true },
  { id: '4', name: 'Emily Cash', role: UserRole.CASHIER, email: 'cashier@gastroflow.com', isActive: true },
];

export const CATEGORIES = ['Plats', 'Boissons', 'Desserts', 'Snacks'];

export const EXCHANGE_RATES = {
  USD: 4500, // 1 USD = 4500 Ar
  EURO: 5200 // 1 EURO = 5200 Ar
};
