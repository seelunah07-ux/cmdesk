
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { OrderStatus, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';

const CashierView: React.FC = () => {
  const context = useContext(AppContext);

  const readyOrders = useMemo(() => 
    context?.orders.filter(o => o.status === OrderStatus.READY) || [],
    [context?.orders]
  );

  const handlePayment = (orderId: string) => {
    context?.updateOrderStatus(orderId, OrderStatus.PAID);
    alert('Paiement réussi. Reçu généré.');
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Encaisser</h1>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
          {readyOrders.length} Notes prêtes à solder
        </p>
      </div>

      <div className="space-y-6">
        {readyOrders.map(order => (
          <div key={order.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center space-x-4">
                 <div className="w-14 h-14 bg-green-50 rounded-[1.5rem] flex items-center justify-center font-black text-green-600 text-xl border border-green-100">
                   {order.tableNumber}
                 </div>
                 <div>
                    <h3 className="font-black text-gray-900 uppercase text-[10px] flex items-center tracking-tighter">
                      Table {order.tableNumber}
                      {order.customerName && (
                        <span className="ml-2 text-[8px] bg-gray-900 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                          {order.customerName}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5 opacity-50">#{order.id.slice(0,5)}</p>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Total</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{formatPrice(order.total)}</p>
               </div>
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
                 <span className="text-lg font-black text-orange-500 tracking-tighter">{formatPrice(order.total)}</span>
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

        {readyOrders.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 opacity-10 text-center">
            <span className="text-8xl mb-6">🏜️</span>
            <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Aucune Note Prête</h3>
            <p className="font-bold uppercase tracking-widest text-[10px] mt-2">Les caisses sont à jour</p>
          </div>
        )}
      </div>
      <div className="h-24" />
    </div>
  );
};

export default CashierView;
