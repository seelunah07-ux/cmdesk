
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { Product, OrderStatus, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';

const ServerOrderView: React.FC = () => {
  const context = useContext(AppContext);
  const categories = context?.categories || [];
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [table, setTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [serverName, setServerName] = useState(() => {
    const name = context?.user?.name || '';
    if (name === 'Sarah Smith' || name === 'Service') return '';
    return name;
  });

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() =>
    context?.products.filter(p =>
      (selectedCategory === 'Tout' || p.category === selectedCategory) &&
      p.isActive &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [context?.products, selectedCategory, searchQuery]
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
    if (!table.trim()) {
      alert("Veuillez saisir un numéro de table.");
      return;
    }

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      tableNumber: table,
      customerName: customerName || existingOrderForTable?.customerName,
      serverName: serverName,
      items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })),
      status: OrderStatus.PENDING,
      timestamp: new Date(),
      total: cartTotal
    };

    context?.addOrder(newOrder);
    setCart({});
    setCustomerName('');
    setTable('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-[140px] animate-fade-in">
      {/* Header — Precise Image Match */}
      <div className="px-5 pt-3 pb-5 border-b border-gray-100 bg-white">
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Table Input Container */}
          <div className="col-span-3 flex items-center space-x-2">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg overflow-hidden shrink-0">
              <input
                type="text"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                placeholder="N°"
                className="w-full h-full bg-transparent text-center text-white font-black text-sm outline-none placeholder:text-red-300 placeholder:font-normal"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-black text-gray-900 leading-none text-[8px] uppercase tracking-tighter truncate">TABLE {table || '?'}</h2>
              <p className="text-[6px] font-black text-red-600 uppercase tracking-widest mt-1">
                {existingOrderForTable ? 'OUVERTE' : 'NEUVE'}
              </p>
            </div>
          </div>

          {/* Customer Input Container */}
          <div className="col-span-5 relative">
            <input
              type="text"
              placeholder="Client (Optionnel)"
              value={customerName || existingOrderForTable?.customerName || ''}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl py-2.5 px-3 pr-8 text-[9px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-1 focus:ring-gray-200 transition-all shadow-inner"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 text-[10px]">👤</span>
          </div>

          {/* Server Info Container */}
          <div className="col-span-4 relative">
            <input
              type="text"
              placeholder="Serveur"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full bg-blue-50/50 border-0 rounded-2xl py-2.5 px-3 pr-8 text-[9px] font-bold text-blue-600 placeholder:text-blue-300 focus:ring-1 focus:ring-blue-200 transition-all shadow-inner"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 text-[10px]">👔</span>
          </div>
        </div>
      </div>

      {/* Categories — Horizontal Scroll with Red Highlight */}
      <div className="w-full overflow-x-auto hide-scrollbar bg-white py-4 border-b border-gray-50">
        <div className="flex items-center space-x-2 px-6 min-w-max">
          {context?.categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-black text-[9px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="px-5 mt-2">
        <div className="relative group">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-10 text-[10px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all shadow-inner"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[12px]">🔍</span>
        </div>
      </div>

      {/* Product Grid — 4 Columns for Android App Feel */}
      <div className="px-5 py-6 grid grid-cols-4 gap-x-3 gap-y-6">
        {filteredProducts.map(product => {
          const quantity = cart[product.id] || 0;
          return (
            <div
              key={product.id}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => addToCart(product.id)}
            >
              {/* Product Image Frame */}
              <div className="relative w-full aspect-square bg-white rounded-[1.2rem] shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center justify-center p-2 active:scale-90 transition-transform duration-200">
                <img
                  src={product.image}
                  className="max-h-full max-w-full object-contain drop-shadow-sm"
                  alt={product.name}
                  loading="lazy"
                />
                {quantity > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] border-2 border-white shadow-md animate-in zoom-in duration-300">
                    {quantity}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="mt-2 text-center w-full">
                <h3 className="font-black text-gray-900 text-[6.5px] uppercase tracking-tighter leading-none line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-blue-600 font-black text-[9px] mt-0.5">
                  {formatPrice(product.price).replace(' Ar', '')} <span className="text-[6.5px]">Ar</span>
                </p>

                {/* Micro-Controls */}
                {quantity > 0 && (
                  <div className="flex items-center justify-center space-x-1 mt-1 animate-in slide-in-from-top-1 fade-in" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-300 font-black text-[12px] p-0.5 hover:text-red-500 transition-colors"
                    >
                      −
                    </button>
                    <span className="font-black text-gray-900 text-[8px] w-2">{quantity}</span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="text-blue-600 font-black text-[12px] p-0.5 hover:text-blue-800 transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Dark Order Summary Button */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-[95px] left-1/2 -translate-x-1/2 w-[92%] z-50 max-w-[400px]">
          <button
            onClick={handleSendOrder}
            className="w-full bg-[#111827] text-white h-[54px] rounded-[1.2rem] shadow-2xl flex items-center justify-between px-6 transition-all active:scale-95 border border-white/5"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-black text-white text-[10px]">
                  +{Object.values(cart).reduce((a: number, b: number) => a + b, 0)}
                </span>
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px] text-white">ENVOYER</span>
            </div>

            <span className="font-black text-blue-400 text-[14px] tracking-tight">
              {formatPrice(cartTotal)}
            </span>
          </button>
        </div>
      )}
    </div>


  );
};

export default ServerOrderView;
