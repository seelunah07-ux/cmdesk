
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { OrderStatus } from '../types';

const KitchenDisplayView: React.FC = () => {
  const context = useContext(AppContext);
  
  const activeOrders = useMemo(() => 
    context?.orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING) || [],
    [context?.orders]
  );

  const getProductName = (id: string) => context?.products.find(p => p.id === id)?.name || 'Inconnu';

  const markStatus = (orderId: string, status: OrderStatus) => {
    context?.updateOrderStatus(orderId, status);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6">
      <div className="mb-8">
         <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Flux Cuisine</h1>
         <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">{activeOrders.length} Commandes en attente</p>
      </div>

      <div className="space-y-6">
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            {order.status === OrderStatus.PREPARING && (
              <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gray-900 rounded-3xl flex items-center justify-center text-white text-xl font-black">
                  {order.tableNumber}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase text-xs flex items-center">
                    Table {order.tableNumber}
                    {order.customerName && <span className="ml-2 bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[8px] tracking-normal capitalize">{order.customerName}</span>}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold">{order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === OrderStatus.PREPARING ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-2 mb-8">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <span className="text-xs font-black text-gray-700 uppercase">{getProductName(item.productId)}</span>
                  <span className="bg-gray-900 text-white w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              {order.status === OrderStatus.PENDING ? (
                <button 
                  onClick={() => markStatus(order.id, OrderStatus.PREPARING)}
                  className="flex-1 bg-blue-500 text-white font-black py-4 rounded-3xl uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                >
                  Confirmer Réception
                </button>
              ) : (
                <button 
                  onClick={() => markStatus(order.id, OrderStatus.READY)}
                  className="flex-1 bg-orange-500 text-white font-black py-4 rounded-3xl uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100 active:scale-95 transition-transform"
                >
                  Marquer comme Prêt
                </button>
              )}
            </div>
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
             <span className="text-6xl mb-4">🍳</span>
             <h2 className="text-xl font-black uppercase tracking-widest text-center">Aucune commande</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplayView;
