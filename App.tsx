
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole, Order, Product, User, OrderStatus, OrderItem, Currency } from './types';
import { INITIAL_PRODUCTS, INITIAL_USERS, CATEGORIES as INITIAL_CATEGORIES } from './constants';

// Views
import LoginView from './views/LoginView';
import ServerOrderView from './views/ServerOrderView';
import KitchenDisplayView from './views/KitchenDisplayView';
import CashierView from './views/CashierView';
import AdminDashboardView from './views/AdminDashboardView';
import AdminProductsView from './views/AdminProductsView';
import AdminUsersView from './views/AdminUsersView';
import LiveTrackerView from './views/LiveTrackerView';
import SettingsView from './views/SettingsView';

// Context
interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const AppContext = React.createContext<AppContextType | null>(null);

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = React.useContext(AppContext);
  const user = context?.user;

  if (!user) return null;

  const tabs = [
    { label: 'Commandes', path: user.role === UserRole.SERVER ? '/server' : user.role === UserRole.KITCHEN ? '/kitchen' : user.role === UserRole.CASHIER ? '/cashier' : '/admin', icon: '📋' },
    { label: 'En Direct', path: '/live', icon: '📡' },
    { label: 'Réglages', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-3 px-6 z-50 shadow-2xl safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-col items-center space-y-1 transition-all ${location.pathname === tab.path ? 'text-orange-500 scale-110' : 'text-gray-400'}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
      <button onClick={() => context?.setUser(null)} className="flex flex-col items-center space-y-1 text-gray-400">
        <span className="text-xl">🚪</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Quitter</span>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState<Currency>(Currency.ARIARY);

  const addOrder = (newOrder: Order) => {
    setOrders(prev => {
      const existingOrderIndex = prev.findIndex(o => 
        o.tableNumber === newOrder.tableNumber && 
        o.status !== OrderStatus.PAID && 
        o.status !== OrderStatus.CANCELLED
      );

      if (existingOrderIndex > -1) {
        const updatedOrders = [...prev];
        const existing = updatedOrders[existingOrderIndex];
        const mergedItems = [...existing.items];
        newOrder.items.forEach(newItem => {
          const itemIdx = mergedItems.findIndex(i => i.productId === newItem.productId);
          if (itemIdx > -1) {
            mergedItems[itemIdx] = { 
              ...mergedItems[itemIdx], 
              quantity: mergedItems[itemIdx].quantity + newItem.quantity 
            };
          } else {
            mergedItems.push(newItem);
          }
        });

        updatedOrders[existingOrderIndex] = {
          ...existing,
          items: mergedItems,
          total: existing.total + newOrder.total,
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          customerName: newOrder.customerName || existing.customerName
        };
        return updatedOrders;
      }
      return [newOrder, ...prev];
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const contextValue = useMemo(() => ({
    user, setUser, orders, setOrders, products, setProducts, users, setUsers, categories, setCategories, currency, setCurrency, addOrder, updateOrderStatus
  }), [user, orders, products, users, categories, currency]);

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="min-h-screen bg-white max-w-md mx-auto relative flex flex-col overflow-x-hidden shadow-xl border-x border-gray-100">
          <main className="flex-1 pb-20">
            <Routes>
              <Route path="/" element={user ? <RoleRedirect user={user} /> : <LoginView />} />
              <Route path="/server" element={user?.role === UserRole.SERVER ? <ServerOrderView /> : <Navigate to="/" />} />
              <Route path="/kitchen" element={user?.role === UserRole.KITCHEN ? <KitchenDisplayView /> : <Navigate to="/" />} />
              <Route path="/cashier" element={user?.role === UserRole.CASHIER ? <CashierView /> : <Navigate to="/" />} />
              <Route path="/live" element={user ? <LiveTrackerView /> : <Navigate to="/" />} />
              <Route path="/settings" element={user ? <SettingsView /> : <Navigate to="/" />} />
              <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboardView /> : <Navigate to="/" />} />
              <Route path="/admin/products" element={user?.role === UserRole.ADMIN ? <AdminProductsView /> : <Navigate to="/" />} />
              <Route path="/admin/users" element={user?.role === UserRole.ADMIN ? <AdminUsersView /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

const RoleRedirect: React.FC<{ user: User }> = ({ user }) => {
  switch (user.role) {
    case UserRole.ADMIN: return <Navigate to="/admin" />;
    case UserRole.SERVER: return <Navigate to="/server" />;
    case UserRole.KITCHEN: return <Navigate to="/kitchen" />;
    case UserRole.CASHIER: return <Navigate to="/cashier" />;
    default: return <Navigate to="/" />;
  }
};

export default App;
