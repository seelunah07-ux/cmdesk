
import React, { useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { OrderStatus, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ordersApi, Order as SupaOrder } from '../src/lib/supabase';

const AdminDashboardView: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();
  const [allOrders, setAllOrders] = useState<SupaOrder[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch ALL orders (including paid/historical) for dashboard stats
  const fetchOrders = () => {
    ordersApi.getAll().then(setAllOrders).catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const paidOrders = allOrders.filter(o => o.status === 'Payé');
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = allOrders.length;

    // Active orders from context (real-time)
    const activeOrders = context?.orders.filter(o => [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)).length || 0;

    // Weekly performance: compute sales per day for the current week (Mon–Sun)
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const monday = new Date(now);
    const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = weekDays.map((name, i) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const daySales = paidOrders
        .filter(o => {
          const orderDate = new Date(o.date_creation);
          return orderDate >= dayStart && orderDate < dayEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);

      return { name, sales: daySales };
    });

    const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    return { totalOrders, activeOrders, revenue, data, todayIndex };
  }, [allOrders, context?.orders]);

  const formatValue = (priceInAr: number) => {
    if (context?.currency === Currency.ARIARY) {
      return `${priceInAr.toLocaleString()} Ar`;
    } else if (context?.currency === Currency.USD) {
      return `$${(priceInAr / EXCHANGE_RATES.USD).toFixed(2)}`;
    } else if (context?.currency === Currency.EURO) {
      return `€${(priceInAr / EXCHANGE_RATES.EURO).toFixed(2)}`;
    }
    return `${priceInAr.toLocaleString()} Ar`;
  };

  const handleClearTransactions = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer TOUTES les transactions ? Cette action est irréversible.')) {
      setIsDeleting(true);
      try {
        await ordersApi.deleteAll();
        fetchOrders();
        context?.refreshOrders();
        alert('Toutes les transactions ont été effacées.');
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression des transactions.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F0FBFF] p-6 pb-32 font-['Outfit']">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif text-[#134E4A] italic" style={{ fontFamily: "'Playfair Display', serif" }}>Statistiques</h1>
      </div>

      {/* Revenue Hero Card */}
      <div className="bg-[#14B8D4] rounded-[2.5rem] p-8 mb-6 shadow-[0_10px_30px_rgba(20,184,212,0.25)] relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <p className="text-white/90 text-sm font-bold tracking-tight">Chiffre d'Affaire</p>
          <div className="text-3xl font-serif text-white italic" style={{ fontFamily: "'Playfair Display', serif" }}>
            {formatValue(stats.revenue)}
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm">
          <p className="text-[#22D3EE] text-[2.5rem] font-black leading-none mb-2">{stats.activeOrders}</p>
          <p className="text-[#22D3EE] text-[9px] font-black uppercase tracking-wider">Service Actif</p>
        </div>
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-sm">
          <p className="text-[#22D3EE] text-[2.5rem] font-black leading-none mb-2">{stats.totalOrders}</p>
          <p className="text-[#22D3EE] text-[9px] font-black uppercase tracking-wider">Total Commandes</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-1 gap-4 mb-10">
        <button
          onClick={() => navigate('/admin/products')}
          className="bg-white rounded-[1.5rem] p-5 flex items-center justify-center space-x-3 shadow-sm active:scale-95 transition-transform"
        >
          <span className="text-2xl">📦</span>
          <span className="text-[#134E4A] font-black text-[10px] uppercase tracking-widest">Inventaire</span>
        </button>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-[2.5rem] p-8 mb-10 shadow-sm border border-white/50">
        <h3 className="text-[#22D3EE] font-black text-[10px] uppercase tracking-widest mb-6 px-1">Performance Hebdomadaire</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.data}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }}
                formatter={(value: number) => [formatValue(value), 'Ventes']}
              />
              <Bar dataKey="sales" radius={[8, 8, 8, 8]} barSize={24}>
                {stats.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === stats.todayIndex ? '#22D3EE' : '#F1F5F9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-[#22D3EE] font-black text-[10px] uppercase tracking-widest">Dernières Transactions</h3>
          <button
            onClick={() => navigate('/cashier')}
            className="text-[#22D3EE] font-bold text-[10px] uppercase tracking-widest flex items-center"
          >
            Voir tout <span className="ml-1">→</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-white/50">
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-50 bg-gray-50/50">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Table</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</span>
          </div>

          <div className="divide-y divide-gray-50">
            {allOrders.filter(o => o.status === 'Payé').slice(0, 5).map(order => (
              <div key={order.id} className="grid grid-cols-3 gap-4 p-6 items-center">
                <div className="text-center">
                  <span className="bg-[#F8FAFC] w-10 h-10 rounded-xl flex items-center justify-center mx-auto text-xs font-black text-slate-700 border border-slate-100 italic">
                    {order.table_number}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {new Date(order.date_creation).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-[11px] font-black text-slate-700 text-right italic">
                  {formatValue(order.total)}
                </div>
              </div>
            ))}
            {allOrders.filter(o => o.status === 'Payé').length === 0 && (
              <div className="py-12 text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Aucune transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Section */}
      <div className="mt-12 bg-white/50 rounded-[2rem] p-8 flex items-center justify-between border border-white">
        <div>
          <h3 className="text-[#22D3EE] font-black text-[10px] uppercase tracking-widest">Maintenance Système</h3>
          <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-1">Actions Sensibles</p>
        </div>
        <button
          onClick={handleClearTransactions}
          disabled={isDeleting}
          className="bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] px-6 py-4 rounded-2xl flex items-center space-x-3 transition-colors disabled:opacity-50"
        >
          <span role="img" aria-label="trash">🗑️</span>
          <span className="font-black text-[10px] uppercase tracking-widest">Effacer</span>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardView;
