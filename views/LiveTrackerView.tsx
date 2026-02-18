
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { OrderStatus } from '../types';

const LiveTrackerView: React.FC = () => {
  const context = useContext(AppContext);
  const orders = context?.orders || [];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-blue-100 text-blue-600 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-600 border-orange-200';
      case OrderStatus.READY: return 'bg-green-100 text-green-600 border-green-200';
      case OrderStatus.PAID: return 'bg-gray-100 text-gray-400 border-gray-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Statut en Direct</h1>
        <span className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse font-bold uppercase tracking-tighter">Connecté</span>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <span className="text-4xl mb-4 block">📡</span>
            <p className="font-bold uppercase tracking-widest text-[10px]">En attente de commandes...</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg transition-colors ${order.status === OrderStatus.READY ? 'bg-green-500' : 'bg-gray-900'}`}>
                  {order.tableNumber}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 text-sm flex items-center">
                    Table {order.tableNumber}
                    {order.customerName && <span className="ml-2 text-[8px] text-orange-500 font-bold uppercase tracking-widest">({order.customerName})</span>}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">MàJ: {order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-2xl border-2 text-[8px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                {order.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveTrackerView;
