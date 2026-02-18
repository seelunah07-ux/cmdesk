
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { Product, OrderStatus, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';

const ServerOrderView: React.FC = () => {
  const context = useContext(AppContext);
  const categories = context?.categories || [];
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [table, setTable] = useState('1');
  const [customerName, setCustomerName] = useState('');

  const filteredProducts = useMemo(() =>
    context?.products.filter(p => p.category === selectedCategory && p.isActive) || [],
    [context?.products, selectedCategory]
  );

  const activeReadyOrders = useMemo(() =>
    context?.orders.filter(o => o.status === OrderStatus.READY).length || 0,
    [context?.orders]
  );

  const existingOrderForTable = useMemo(() =>
    context?.orders.find(o => o.tableNumber === table && o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED),
    [context?.orders, table]
  );

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newVal = (prev[productId] || 0) - 1;
      if (newVal <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newVal };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((acc: number, [id, qty]: [string, number]) => {
      const prod = context?.products.find(p => p.id === id);
      return acc + (prod?.price || 0) * qty;
    }, 0);
  }, [cart, context?.products]);

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

  const handleSendOrder = () => {
    if (Object.keys(cart).length === 0) return;

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      tableNumber: table,
      customerName: customerName || existingOrderForTable?.customerName,
      items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      status: OrderStatus.PENDING,
      timestamp: new Date(),
      total: cartTotal
    };

    context?.addOrder(newOrder);
    setCart({});
    setCustomerName('');
    alert(existingOrderForTable ? `Mis à jour pour la Table ${table}` : `Commande envoyée pour la Table ${table}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-32">
      <div className="bg-white p-6 pb-4 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${existingOrderForTable ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-100 text-blue-600'}`}>
            {table}
          </div>
          <select
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="opacity-0 absolute w-10 h-10 left-6"
          >
            {[1, 2, 3, 4, 5, 6, 10, 12, 15, 20].map(t => <option key={t} value={String(t)}>{t}</option>)}
          </select>
          <div>
            <h2 className="font-black text-gray-900 leading-none uppercase text-sm tracking-tighter">Table {table}</h2>
            <p className={`text-[9px] uppercase font-bold tracking-widest mt-1 ${existingOrderForTable ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}>
              {existingOrderForTable ? 'Note Ouverte' : 'Nouvelle Note'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {activeReadyOrders > 0 && (
            <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full flex items-center space-x-1">
              <span className="text-[10px] font-black uppercase tracking-tighter">{activeReadyOrders} Prêt(s)</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Nom du Client (Optionnel)"
            value={customerName || existingOrderForTable?.customerName || ''}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-5 text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-20">👤</span>
        </div>
      </div>

      <div className="px-6 py-4 flex space-x-3 overflow-x-auto hide-scrollbar bg-white shadow-sm border-b touch-pan-x active:cursor-grabbing">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2 rounded-2xl whitespace-nowrap font-bold text-[10px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-[2rem] p-4 shadow-sm flex flex-col items-center text-center border border-gray-100 transition-all hover:border-blue-300"
          >
            <div
              className="relative mb-3 cursor-pointer group active:scale-95 transition-transform"
              onClick={() => addToCart(product.id)}
            >
              <img src={product.image} className="w-24 h-24 object-cover rounded-[1.5rem] shadow-md group-hover:shadow-lg transition-shadow" alt={product.name} />
              {cart[product.id] && (
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-4 border-white">
                  {cart[product.id]}
                </div>
              )}
            </div>

            <div className="cursor-pointer mb-2" onClick={() => addToCart(product.id)}>
              <h3 className="font-bold text-gray-800 text-[10px] mb-1 line-clamp-1 uppercase tracking-tighter">{product.name}</h3>
              <p className="text-blue-600 font-black text-sm">
                {formatPrice(product.price)}
              </p>
            </div>

            {cart[product.id] ? (
              <div className="flex items-center bg-gray-50 rounded-2xl p-1 mt-auto">
                <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-gray-400 hover:text-red-500">-</button>
                <span className="w-8 font-black text-gray-900 text-xs">{cart[product.id]}</span>
                <button onClick={() => addToCart(product.id)} className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-blue-600">+</button>
              </div>
            ) : (
              <div className="h-10 mt-auto" />
            )}
          </div>
        ))}
      </div>

      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto z-50">
          <button
            onClick={handleSendOrder}
            className="w-full bg-gray-900 text-white py-5 rounded-[2rem] shadow-2xl flex items-center justify-between px-8 transition-transform active:scale-95"
          >
            <div className="flex items-center space-x-3 text-left">
              <span className="bg-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                +{Object.values(cart).reduce((a: number, b: number) => a + b, 0)}
              </span>
              <div className="flex flex-col">
                <span className="font-black uppercase tracking-widest text-sm">{existingOrderForTable ? 'Mettre à jour' : 'Envoyer'}</span>
                {existingOrderForTable && <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest">Ajout à la note</span>}
              </div>
            </div>
            <span className="font-black text-blue-600 text-lg">
              {formatPrice(cartTotal)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ServerOrderView;
