
import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserRole, Order, Product, User, OrderStatus, Currency } from './types';
import { supabase, authApi, staffApi, produitsApi, categoriesApi, ordersApi, settingsApi, StaffUser, Produit as SupaProduit, Order as SupaOrder } from './src/lib/supabase';

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

// Components
import Sidebar from './src/components/Sidebar';
import NotificationProvider from './src/components/NotificationProvider';

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
  updateOrderItems: (orderId: string, items: any[], total: number) => Promise<void>;
  isSaaSAuthenticated: boolean;
  setIsSaaSAuthenticated: (val: boolean) => void;
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

export const AppContext = React.createContext<AppContextType | null>(null);

// Helpers
const staffToUser = (s: StaffUser): User => {
  let name = s.nom || s.name || 'Inconnu';
  if (name === 'Sarah Smith') name = 'Service';
  if (name === 'Alex Johnson') name = 'Administrateur';
  if (name === 'Chef Marco') name = 'Cuisine';
  if (name === 'Emily Cash') name = 'Caisse';

  return {
    id: s.id,
    name: name,
    email: s.email,
    role: s.role as UserRole,
    isActive: s.is_active ?? true, // Default to true if missing
  };
};

const supaProduitToProduct = (p: SupaProduit): Product => ({
  id: p.id,
  name: p.nom || p.name || 'Sans nom',
  category: p.categorie || p.category || '',
  price: p.prix || p.price || 0,
  image: p.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  description: p.description || undefined,
  isActive: (p.stock ?? 0) > 0 || p.is_active === true || true, // Fallback to active
});

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = React.useContext(AppContext);
  const user = context?.user;
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [lastReadyCount, setLastReadyCount] = useState(0);

  const readyOrdersCount = React.useMemo(() =>
    context?.orders.filter(o => o.status === OrderStatus.READY).length || 0,
    [context?.orders]
  );

  useEffect(() => {
    if (readyOrdersCount > lastReadyCount) {
      setHasNewAlert(true);
    }
    setLastReadyCount(readyOrdersCount);
  }, [readyOrdersCount, lastReadyCount]);

  useEffect(() => {
    if (location.pathname === '/live') {
      setHasNewAlert(false);
    }
  }, [location.pathname]);

  if (!user) return null;

  const tabs = [
    { label: 'Commandes', path: user.role === UserRole.SERVER ? '/server' : user.role === UserRole.KITCHEN ? '/kitchen' : user.role === UserRole.CASHIER ? '/cashier' : '/admin', icon: '📋' },
    { label: 'En Direct', path: '/live', icon: '📡', notify: hasNewAlert && readyOrdersCount > 0 },
    { label: 'Réglages', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex items-center justify-around py-4 px-6 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-col items-center space-y-1.5 transition-all relative ${location.pathname === tab.path ? 'text-blue-600' : 'text-gray-300'}`}
        >
          <div className="relative">
            <span className="text-xl opacity-80">{tab.icon}</span>
            {tab.notify && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
        </button>
      ))}
      <button onClick={() => {
        localStorage.removeItem('cmdesk_persistent_user');
        context?.setUser(null);
      }} className="flex flex-col items-center space-y-1.5 text-gray-300 hover:text-red-500 transition-colors">
        <span className="text-xl opacity-80">🚪</span>
        <span className="text-[8px] font-black uppercase tracking-[0.15em]">Quitter</span>
      </button>
    </div>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = React.useContext(AppContext);
  const user = context?.user;

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center overflow-x-hidden">
      {/* Simulation d'un écran Android 6.3 pouces (environ 430px de large) */}
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl relative flex flex-col">
        <main className="flex-1 pb-24">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
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

const App: React.FC = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrencyState] = useState<Currency>(Currency.ARIARY);
  const [isSaaSAuthenticated, setIsSaaSAuthenticatedState] = useState<boolean>(() => {
    return localStorage.getItem('cmdesk_saas_auth') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const directLoginRef = React.useRef(false);

  const setUser = React.useCallback((u: User | null) => {
    directLoginRef.current = !!u;
    setUserState(u);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods, staff, savedCurrency] = await Promise.all([
          categoriesApi.getAll(),
          produitsApi.getAll(),
          staffApi.getAll(),
          settingsApi.get('currency'),
        ]);

        const catNames = cats.map(c => c.nom || c.name || 'Inconnu');
        setCategories(['Tout', ...catNames.filter(c => c !== 'Inconnu')]);
        setProducts(prods.map(supaProduitToProduct));
        setUsers(staff.map(staffToUser));
        if (savedCurrency) setCurrencyState(savedCurrency as Currency);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const session = await authApi.getSession();
        if (session && mounted) {
          const staff = await authApi.getCurrentStaff().catch(() => null);
          if (staff) {
            directLoginRef.current = false;
            setUserState(staffToUser(staff));
          } else {
            await authApi.signOut().catch(() => { });
            setUserState(null);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = authApi.onAuthStateChange(async (staffUser) => {
      if (!mounted) return;
      if (staffUser) {
        directLoginRef.current = false;
        setUserState(staffToUser(staffUser));
      } else if (!directLoginRef.current) {
        setUserState(null);
      }
      setLoading(false);
    });

    const timeout = setTimeout(() => { if (mounted && loading) setLoading(false); }, 5000);
    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    ordersApi.getActive().then(supaOrders => {
      setOrders(supaOrders.map(o => mapSupaOrder(o)));
    }).catch(console.error);

    const channel = ordersApi.subscribe((supaOrders) => {
      setOrders(supaOrders.map(o => mapSupaOrder(o)));
    });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const refreshOrders = async () => {
    try {
      const supaOrders = await ordersApi.getActive();
      setOrders(supaOrders.map(o => mapSupaOrder(o)));
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  const mapSupaOrder = (o: SupaOrder): Order => {
    const staff = users.find(u => u.id === o.user_id);
    let customerName = o.customer_name || undefined;
    let serverName = staff?.name;

    // Detect and parse the embedded server name if present
    if (customerName && customerName.includes('@@S:')) {
      const parts = customerName.split('@@S:');
      customerName = parts[0].trim() || undefined;
      serverName = parts[1].split('@@E')[0].trim();
    }

    return {
      id: o.id,
      tableNumber: o.table_number,
      customerName,
      serverName: serverName || (o as any).server_name || undefined,
      status: o.status as OrderStatus,
      total: o.total,
      timestamp: new Date(o.date_creation),
      items: (o.order_items || []).map(item => ({
        productId: item.product_id || '',
        quantity: item.quantity,
        notes: item.notes || undefined,
      })),
    };
  };

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await settingsApi.set('currency', c).catch(console.error);
  };

  const setIsSaaSAuthenticated = (val: boolean) => {
    setIsSaaSAuthenticatedState(val);
    if (val) localStorage.setItem('cmdesk_saas_auth', 'true');
    else localStorage.removeItem('cmdesk_saas_auth');
  };

  const addOrder = async (newOrder: Order) => {
    setOrders(prev => {
      const existingIdx = prev.findIndex(o =>
        o.tableNumber === newOrder.tableNumber &&
        o.status !== OrderStatus.PAID &&
        o.status !== OrderStatus.CANCELLED
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const mergedItems = [...existing.items];
        newOrder.items.forEach(newItem => {
          const idx = mergedItems.findIndex(i => i.productId === newItem.productId);
          if (idx > -1) mergedItems[idx] = { ...mergedItems[idx], quantity: mergedItems[idx].quantity + newItem.quantity };
          else mergedItems.push(newItem);
        });
        updated[existingIdx] = {
          ...existing,
          items: mergedItems,
          total: existing.total + newOrder.total,
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          customerName: newOrder.customerName || existing.customerName,
          serverName: newOrder.serverName || existing.serverName
        };
        return updated;
      }
      return [newOrder, ...prev];
    });

    try {
      const staffUser = users.find(u => u.email === user?.email);
      // Embed the server name into the customer_name field since we can't add columns
      const compositeCustomerName = newOrder.serverName
        ? `${newOrder.customerName || ''} @@S:${newOrder.serverName}@@E`.trim()
        : newOrder.customerName || null;

      const createdOrder = await ordersApi.create(
        {
          table_number: newOrder.tableNumber,
          customer_name: compositeCustomerName,
          status: newOrder.status as SupaOrder['status'],
          total: newOrder.total,
          user_id: staffUser?.id || null,
        },
        newOrder.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            product_id: item.productId || null,
            product_name: product?.name || 'Produit inconnu',
            unit_price: product?.price || 0,
            quantity: item.quantity,
            notes: item.notes || null,
          };
        })
      );

      // Broadcast instant notification
      ordersApi.broadcast('new_order', { tableNumber: newOrder.tableNumber, orderId: createdOrder.id });
    } catch (err) {
      console.error('Error saving order:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await ordersApi.updateStatus(orderId, status as SupaOrder['status']);
      if (status === OrderStatus.READY) {
        const order = orders.find(o => o.id === orderId);
        ordersApi.broadcast('order_ready', { tableNumber: order?.tableNumber, orderId });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const updateOrderItems = async (orderId: string, items: any[], total: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items, total } : o));
    try {
      const dbItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          product_id: item.productId,
          product_name: product?.name || 'Produit',
          unit_price: product?.price || 0,
          quantity: item.quantity
        };
      });
      await ordersApi.updateItems(orderId, dbItems, total);
    } catch (err) {
      console.error('Error updating items:', err);
    }
  };

  const contextValue = useMemo(() => ({
    user, setUser, orders, setOrders, products, setProducts, users, setUsers,
    categories, setCategories, currency, setCurrency, addOrder, updateOrderStatus,
    updateOrderItems, isSaaSAuthenticated, setIsSaaSAuthenticated, loading, refreshOrders
  }), [user, orders, products, users, categories, currency, isSaaSAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <NotificationProvider>
          <MainLayout>
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
          </MainLayout>
        </NotificationProvider>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
