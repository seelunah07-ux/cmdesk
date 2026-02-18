
import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { OrderStatus, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboardView: React.FC = () => {
  const context = useContext(AppContext);

  const stats = useMemo(() => {
    const totalOrders = context?.orders.length || 0;
    const activeOrders = context?.orders.filter(o => [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)).length || 0;
    const revenue = context?.orders.filter(o => o.status === OrderStatus.PAID).reduce((sum, o) => sum + o.total, 0) || 0;
    
    const data = [
      { name: 'Lun', sales: 400 },
      { name: 'Mar', sales: 300 },
      { name: 'Mer', sales: 600 },
      { name: 'Jeu', sales: 800 },
      { name: 'Ven', sales: 900 },
      { name: 'Sam', sales: 1200 },
      { name: 'Dim', sales: 1000 },
    ];

    return { totalOrders, activeOrders, revenue, data };
  }, [context?.orders]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-white border-r p-6 flex flex-col space-y-8 sticky top-0 md:h-screen z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span className="font-black text-xl text-gray-900 tracking-tighter">GastroFlow</span>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Réglages Devise</label>
          <div className="flex space-x-2">
            {[Currency.ARIARY, Currency.USD, Currency.EURO].map((c) => (
              <button
                key={c}
                onClick={() => context?.setCurrency(c)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  context?.currency === c 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white text-gray-400 border border-gray-100 hover:border-orange-200'
                }`}
              >
                {c === Currency.ARIARY ? 'Ar' : c}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[8px] font-bold text-gray-400 text-center uppercase">
            1 USD = 4500 Ar | 1 EUR = 5200 Ar
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-widest">
             <span>Tableau de Bord</span>
          </Link>
          <Link to="/admin/products" className="flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:bg-gray-50 font-bold text-xs uppercase tracking-widest transition-colors">
             <span>Inventaire</span>
          </Link>
          <Link to="/admin/users" className="flex items-center space-x-3 p-3 rounded-xl text-gray-400 hover:bg-gray-50 font-bold text-xs uppercase tracking-widest transition-colors">
             <span>Personnel</span>
          </Link>
        </nav>

        <button onClick={() => context?.setUser(null)} className="text-gray-400 hover:text-red-500 flex items-center space-x-3 p-3 transition-colors">
          <span className="font-bold text-[10px] uppercase tracking-widest">Déconnexion</span>
        </button>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter uppercase">Statistiques Entreprise</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{formatValue(stats.revenue)}</h3>
              <p className="text-green-500 text-[9px] mt-2 font-black uppercase tracking-widest">+12% Gain</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Actif</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{stats.activeOrders} Commandes</h3>
              <p className="text-orange-500 text-[9px] mt-2 font-black uppercase tracking-widest">En Direct</p>
           </div>
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Volume Total</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{stats.totalOrders}</h3>
              <p className="text-gray-400 text-[9px] mt-2 font-black uppercase tracking-widest">Compteur Journalier</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 mb-10">
           <h3 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-widest">Performance Hebdomadaire</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.data}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold'}} />
                  <Bar dataKey="sales" radius={[12, 12, 0, 0]}>
                    {stats.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? '#f97316' : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
