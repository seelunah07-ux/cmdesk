
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { OrderStatus, Currency, Product } from '../types';
import { EXCHANGE_RATES } from '../constants';
import { ordersApi } from '../src/lib/supabase';

const CashierView: React.FC = () => {
  const context = useContext(AppContext);
  const [view, setView] = useState<'active' | 'history'>('active');
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(context?.categories[0] || '');

  const activeOrders = useMemo(() =>
    context?.orders.filter(o => [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)) || [],
    [context?.orders]
  );

  useEffect(() => {
    if (view === 'history') {
      ordersApi.getAll().then(all => {
        setHistoryOrders(all.filter(o => o.status === 'Payé'));
      });
    }
  }, [view]);

  const handlePayment = (orderId: string) => {
    context?.updateOrderStatus(orderId, OrderStatus.PAID);
    // Refresh history if we're on it
    if (view === 'history') {
      ordersApi.getAll().then(all => setHistoryOrders(all.filter(o => o.status === 'Payé')));
    }
  };

  const addToOrder = async (orderId: string, product: Product) => {
    const currentOrder = context?.orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const updatedItems = [...currentOrder.items];
    const itemIdx = updatedItems.findIndex(i => i.productId === product.id);

    if (itemIdx > -1) {
      updatedItems[itemIdx] = { ...updatedItems[itemIdx], quantity: updatedItems[itemIdx].quantity + 1 };
    } else {
      updatedItems.push({ productId: product.id, quantity: 1 });
    }

    const newTotal = updatedItems.reduce((acc, item) => {
      const p = context?.products.find(prod => prod.id === item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);

    // Update via context (which handles local + DB)
    context?.updateOrderItems(orderId, updatedItems, newTotal);
  };

  const getProduct = (id: string) => context?.products.find(p => p.id === id);

  const formatPrice = (priceInAr: number) => {
    if (context?.currency === Currency.ARIARY) {
      return `${priceInAr.toLocaleString()} Ar`;
    } else if (context?.currency === Currency.USD) {
      return `$${(priceInAr / EXCHANGE_RATES.USD).toFixed(2)}`;
    } else if (context?.currency === Currency.EURO) {
      return `€${(priceInAr / EXCHANGE_RATES.EURO).toFixed(2)}`;
    }
    return `${priceInAr.toLocaleString()} Ar`;
  };

  const filteredProducts = useMemo(() =>
    context?.products.filter(p => p.category === selectedCategory && p.isActive) || [],
    [context?.products, selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm mb-8 self-center space-x-1 border border-gray-100">
        <button
          onClick={() => setView('active')}
          className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          Encaisser
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          Historique
        </button>
      </div>

      {view === 'active' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto w-full">
          {activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:shadow-gray-200/50 transition-all">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-5">
                  <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-2xl border shadow-inner ${order.status === OrderStatus.READY ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                    {order.tableNumber}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase text-xs flex items-center tracking-tighter">
                      Table {order.tableNumber}
                      {order.customerName && (
                        <span className="ml-3 text-[9px] bg-gray-900 text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                          {order.customerName}
                        </span>
                      )}
                      <span className={`ml-2 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${order.status === OrderStatus.READY ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                        {order.status}
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1 opacity-50">#{order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingOrder(order)}
                  className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  Modifier
                </button>
              </div>

              <div className="bg-gray-50 rounded-[2rem] p-5 mb-6 space-y-3">
                <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-2 mb-2">
                  <span className="flex-1">Service</span>
                  <span className="w-20 text-center">Qté / PU</span>
                  <span className="w-20 text-right">Somme</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                  {order.items.map((item, idx) => {
                    const product = getProduct(item.productId);
                    const unitPrice = product?.price || 0;
                    const subtotal = unitPrice * item.quantity;

                    return (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                        <div className="flex-1 truncate pr-2">
                          <span className="block text-gray-900 truncate tracking-tighter">{product?.name || 'Article'}</span>
                        </div>
                        <div className="w-20 text-center text-gray-400 font-medium">
                          {item.quantity} <span className="text-[8px] opacity-30">@</span> {formatPrice(unitPrice)}
                        </div>
                        <div className="w-20 text-right font-black text-gray-900">
                          {formatPrice(subtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-dashed border-gray-300 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Net</span>
                  <span className="text-lg font-black text-blue-600 tracking-tighter">{formatPrice(order.total)}</span>
                </div>
              </div>

              <button
                onClick={() => handlePayment(order.id)}
                className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-gray-100 uppercase tracking-widest text-xs active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
              >
                <span className="text-lg">💰</span>
                <span>Finaliser la Note</span>
              </button>
            </div>
          ))}

          {activeOrders.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-24 opacity-10 text-center">
              <span className="text-8xl mb-6">🏜️</span>
              <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Aucune Note Active</h3>
              <p className="font-bold uppercase tracking-widest text-[10px] mt-2">Toutes les commandes sont réglées</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden max-w-[1400px] mx-auto w-full flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transactions (3 Derniers Jours)</h3>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase">Affichage: 10 max</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Table</th>
                  <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Articles</th>
                  <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Total</th>
                  <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {historyOrders
                  .filter(order => {
                    const orderDate = new Date(order.date_creation);
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    threeDaysAgo.setHours(0, 0, 0, 0);
                    return orderDate >= threeDaysAgo;
                  })
                  .slice(0, 10)
                  .map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-6">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-900 text-base border border-gray-100 shadow-inner group-hover:bg-white transition-colors">
                          {order.table_number}
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <p className="font-black text-gray-900 text-[10px] uppercase tracking-tighter">
                          {new Date(order.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(order.date_creation).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex -space-x-2 overflow-hidden">
                          {(order.order_items || []).slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-[9px] font-black text-gray-600 uppercase shadow-sm overflow-hidden">
                              {item.product_name?.slice(0, 2)}
                            </div>
                          ))}
                          {order.order_items?.length > 3 && (
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] font-black text-blue-600 shadow-sm">
                              +{order.order_items.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-black text-gray-900 tracking-tighter whitespace-nowrap">{formatPrice(order.total)}</p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">Payé</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-right">
                        <button
                          onClick={() => setSelectedHistoryOrder(order)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {historyOrders.filter(order => {
            const orderDate = new Date(order.date_creation);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            threeDaysAgo.setHours(0, 0, 0, 0);
            return orderDate >= threeDaysAgo;
          }).length === 0 && (
              <div className="py-32 text-center opacity-20">
                <span className="text-6xl mb-6 block">📂</span>
                <p className="font-black uppercase tracking-[0.2em] text-xs text-gray-900">Aucun historique récent (3j)</p>
              </div>
            )}
        </div>
      )}

      {/* Editing Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl safe-area-bottom animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Modifier Note {editingOrder.tableNumber}</h2>
              <button
                onClick={() => setEditingOrder(null)}
                className="bg-gray-100 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>

            <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-6">
              {context?.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap font-black text-[9px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 mb-8">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => addToOrder(editingOrder.id, product)}
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-2 group-active:scale-95 transition-transform overflow-hidden">
                    <img src={product.image} className="w-full h-full object-contain" alt={product.name} />
                  </div>
                  <h3 className="text-[7px] font-bold text-gray-900 mt-2 text-center uppercase truncate w-full">{product.name}</h3>
                  <p className="text-[8px] font-black text-blue-600">{formatPrice(product.price)}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 p-6 rounded-[2rem] flex justify-between items-center text-white">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nouveau Total</span>
                <span className="text-xl font-black tracking-tighter">{formatPrice(context?.orders.find(o => o.id === editingOrder.id)?.total || 0)}</span>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="bg-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Detail Modal */}
      {selectedHistoryOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Détails de la Note</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Table {selectedHistoryOrder.table_number} • #{selectedHistoryOrder.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryOrder(null)}
                className="bg-gray-100 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-6 mb-8">
              <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-200 pb-2 mb-4">
                <span className="flex-1">Article</span>
                <span className="w-20 text-center">Qté</span>
                <span className="w-20 text-right">Total</span>
              </div>

              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 hide-scrollbar">
                {(selectedHistoryOrder.order_items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                    <span className="flex-1 truncate">{item.product_name}</span>
                    <span className="w-20 text-center text-gray-400">{item.quantity}</span>
                    <span className="w-20 text-right font-black text-gray-900">{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-4 mt-6 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Payé</span>
                <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatPrice(selectedHistoryOrder.total)}</span>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center px-4 py-3 bg-green-50 rounded-2xl border border-green-100">
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Statut</span>
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Payé</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</span>
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  {new Date(selectedHistoryOrder.date_creation).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistoryOrder(null)}
              className="w-full mt-8 bg-gray-900 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs active:scale-[0.98] transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
};

export default CashierView;
