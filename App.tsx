
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
  isSaaSAuthenticated: boolean;
  setIsSaaSAuthenticated: (val: boolean) => void;
  loading: boolean;
}

export const AppContext = React.createContext<AppContextType | null>(null);

// Helper: convert Supabase StaffUser → app User
const staffToUser = (s: StaffUser): User => ({
  id: s.id,
  name: s.nom,
  email: s.email,
  role: s.role as UserRole,
  isActive: s.is_active,
});

// Helper: convert Supabase Produit → app Product
const supaProduitToProduct = (p: SupaProduit): Product => ({
  id: p.id,
  name: p.nom,
  category: p.categorie || '',
  price: p.prix,
  image: p.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  description: p.description || undefined,
  isActive: p.stock > 0,
});

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

  const handleLogout = async () => {
    // Return to role selection instead of full logout
    context?.setUser(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-3 px-6 z-50 shadow-2xl safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={`flex flex-col items-center space-y-1 transition-all ${location.pathname === tab.path ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
      <button onClick={handleLogout} className="flex flex-col items-center space-y-1 text-gray-400">
        <span className="text-xl">🚪</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Quitter</span>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrencyState] = useState<Currency>(Currency.ARIARY);
  const [isSaaSAuthenticated, setIsSaaSAuthenticatedState] = useState<boolean>(() => {
    return localStorage.getItem('gastroflow_saas_auth') === 'true';
  });
  const [loading, setLoading] = useState(true);

  // Track whether the current user was set via direct role login (no Supabase Auth session)
  const directLoginRef = React.useRef(false);

  // Wrapper: when setting user directly (role login), mark as direct
  // When clearing (logout), clear the flag too
  const setUser = React.useCallback((u: User | null) => {
    if (u) {
      directLoginRef.current = true;
    } else {
      directLoginRef.current = false;
    }
    setUserState(u);
  }, []);

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods, staff, savedCurrency] = await Promise.all([
          categoriesApi.getAll(),
          produitsApi.getAll(),
          staffApi.getAll(),
          settingsApi.get('currency'),
        ]);

        setCategories(cats.map(c => c.nom));
        setProducts(prods.map(supaProduitToProduct));
        setUsers(staff.map(staffToUser));
        if (savedCurrency) {
          setCurrencyState(savedCurrency as Currency);
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      }
    };

    loadData();
  }, []);

  // Handle auth state
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const session = await authApi.getSession();
        if (session && mounted) {
          const staff = await authApi.getCurrentStaff().catch(() => null);
          if (staff) {
            // Restore from real Supabase Auth session — not a direct login
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

    // Listen to auth changes
    const { data: { subscription } } = authApi.onAuthStateChange(async (staffUser) => {
      if (!mounted) return;

      if (staffUser) {
        // Auth session found — always update from Supabase Auth (admin login)
        directLoginRef.current = false;
        setUserState(staffToUser(staffUser));
      } else {
        // No auth session — only clear user if it wasn't a direct role login
        if (!directLoginRef.current) {
          setUserState(null);
        }
      }
      setLoading(false); // Auth state change also signals loading done
    });

    // Safety timeout to ensure we don't stay stuck forever
    const timeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Load active orders when user logs in
  useEffect(() => {
    if (!user) return;
    ordersApi.getActive().then(supaOrders => {
      const mapped = supaOrders.map(o => mapSupaOrder(o));
      setOrders(mapped);
    }).catch(console.error);

    // Real-time subscription
    const channel = ordersApi.subscribe((supaOrders) => {
      setOrders(supaOrders.map(o => mapSupaOrder(o)));
    });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const mapSupaOrder = (o: SupaOrder): Order => ({
    id: o.id,
    tableNumber: o.table_number,
    customerName: o.customer_name || undefined,
    status: o.status as OrderStatus,
    total: o.total,
    timestamp: new Date(o.date_creation),
    items: (o.order_items || []).map(item => ({
      productId: item.product_id || '',
      quantity: item.quantity,
      notes: item.notes || undefined,
    })),
  });

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await settingsApi.set('currency', c).catch(console.error);
  };

  const setIsSaaSAuthenticated = (val: boolean) => {
    setIsSaaSAuthenticatedState(val);
    if (val) {
      localStorage.setItem('gastroflow_saas_auth', 'true');
    } else {
      localStorage.removeItem('gastroflow_saas_auth');
    }
  };

  const addOrder = async (newOrder: Order) => {
    // Optimistic update
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
          if (idx > -1) {
            mergedItems[idx] = { ...mergedItems[idx], quantity: mergedItems[idx].quantity + newItem.quantity };
          } else {
            mergedItems.push(newItem);
          }
        });
        updated[existingIdx] = { ...existing, items: mergedItems, total: existing.total + newOrder.total, status: OrderStatus.PENDING, timestamp: new Date(), customerName: newOrder.customerName || existing.customerName };
        return updated;
      }
      return [newOrder, ...prev];
    });

    // Persist to Supabase
    try {
      const staffUser = users.find(u => u.email === user?.email);
      await ordersApi.create(
        {
          table_number: newOrder.tableNumber,
          customer_name: newOrder.customerName || null,
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
    } catch (err) {
      console.error('Error saving order to Supabase:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await ordersApi.updateStatus(orderId, status as SupaOrder['status']);
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const contextValue = useMemo(() => ({
    user, setUser, orders, setOrders, products, setProducts, users, setUsers,
    categories, setCategories, currency, setCurrency, addOrder, updateOrderStatus,
    isSaaSAuthenticated, setIsSaaSAuthenticated, loading
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
