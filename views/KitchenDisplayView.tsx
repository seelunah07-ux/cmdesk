
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { OrderStatus, Order, OrderItem, Currency } from '../types';

const KitchenDisplayView: React.FC = () => {
  const context = useContext(AppContext);

  const [cancelOrderConfirm, setCancelOrderConfirm] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  const activeOrders = useMemo(() =>
    context?.orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING) || [],
    [context?.orders]
  );

  const getProduct = (id: string) => context?.products.find(p => p.id === id);
  const getProductName = (id: string) => getProduct(id)?.name || 'Inconnu';

  const markStatus = (orderId: string, status: OrderStatus) => {
    context?.updateOrderStatus(orderId, status);
  };

  const handleCancelConfirm = () => {
    if (cancelOrderConfirm) {
      context?.updateOrderStatus(cancelOrderConfirm, OrderStatus.CANCELLED);
      setCancelOrderConfirm(null);
    }
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditItems(order.items.map(item => ({ ...item })));
  };

  const handleEditQuantity = (productId: string, delta: number) => {
    setEditItems(prev => {
      const idx = prev.findIndex(i => i.productId === productId);
      if (idx > -1) {
        const newArr = [...prev];
        const newQty = newArr[idx].quantity + delta;
        if (newQty <= 0) {
          newArr.splice(idx, 1);
        } else {
          newArr[idx].quantity = newQty;
        }
        return newArr;
      }
      return prev;
    });
  };

  const saveEditedOrder = () => {
    if (editingOrder) {
      const newTotal = editItems.reduce((acc, item) => {
        const product = getProduct(item.productId);
        return acc + (product?.price || 0) * item.quantity;
      }, 0);
      context?.updateOrderItems(editingOrder.id, editItems, newTotal);
      setEditingOrder(null);
    }
  };

  const formatPrice = (priceInAr: number) => {
    if (context?.currency === Currency.ARIARY) return `${priceInAr.toLocaleString()} Ar`;
    if (context?.currency === Currency.EURO) return `€${(priceInAr / 4500).toFixed(2)}`;
    return `$${(priceInAr / 4000).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 md:p-8 animate-fade-in relative pb-32">
      {/* Header */}
      <div className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">Flux Cuisine</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {activeOrders.length} Commande{activeOrders.length !== 1 ? 's' : ''} en attente
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${activeOrders.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              {activeOrders.length > 0 ? 'En Service' : 'Repos'}
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {activeOrders.map(order => (
          <div key={order.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-shadow">
            {/* Status Strip */}
            {order.status === OrderStatus.PREPARING && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-r" />
            )}
            {order.status === OrderStatus.PENDING && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 rounded-r" />
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-900 rounded-2xl md:rounded-3xl flex items-center justify-center text-white text-lg md:text-xl font-black shadow-lg">
                  {order.tableNumber}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 uppercase text-[11px] md:text-xs flex items-center flex-wrap gap-1.5">
                    Table {order.tableNumber}
                    {order.customerName && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg text-[8px] tracking-normal capitalize">
                        {order.customerName}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <p className="text-[10px] text-gray-400 font-bold">
                      {order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {order.serverName && (
                      <span className="text-[8px] font-black text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-lg uppercase tracking-tight border border-blue-100/50 flex items-center space-x-1">
                        <span>👔</span>
                        <span>{order.serverName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${order.status === OrderStatus.PREPARING
                ? 'bg-blue-100 text-blue-600'
                : 'bg-amber-100 text-amber-600'
                }`}>
                {order.status === OrderStatus.PREPARING ? '🔥 En cours' : '⏳ New'}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-gray-100 transition-colors">
                  <span className="text-[11px] md:text-xs font-black text-gray-700 uppercase tracking-tight">{getProductName(item.productId)}</span>
                  <span className="bg-gray-900 text-white w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs shadow-sm">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setCancelOrderConfirm(order.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-black px-4 py-3.5 md:py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[14px] active:scale-95 transition-all flex items-center justify-center shadow-sm"
                title="Annuler"
              >
                ❌
              </button>
              <button
                onClick={() => openEditModal(order)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-black px-4 py-3.5 md:py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[14px] active:scale-95 transition-all flex items-center justify-center shadow-sm"
                title="Modifier"
              >
                ✏️
              </button>

              {order.status === OrderStatus.PENDING ? (
                <button
                  onClick={() => markStatus(order.id, OrderStatus.PREPARING)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black py-3.5 md:py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <span>🔥</span>
                  <span>Commencer</span>
                </button>
              ) : (
                <button
                  onClick={() => markStatus(order.id, OrderStatus.READY)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3.5 md:py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-green-100 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <span>✅</span>
                  <span>Prêt</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {activeOrders.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
            <span className="text-5xl">🍳</span>
          </div>
          <h2 className="text-lg font-black uppercase tracking-widest text-gray-300 text-center">Aucune commande</h2>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">En attente de nouvelles commandes...</p>
        </div>
      )}

      {/* Modals placed outside of regular flow */}
      {/* Cancel Confirmation Modal */}
      {cancelOrderConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setCancelOrderConfirm(null)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-gray-900 text-center uppercase tracking-tighter mb-2">Annuler la Commande ?</h2>
            <p className="text-xs font-bold text-gray-400 text-center mb-8">Cette action est irréversible. La commande sera supprimée de la cuisine.</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCancelOrderConfirm(null)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-black py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Retour
              </button>
              <button
                onClick={handleCancelConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl md:rounded-3xl uppercase tracking-widest text-[10px] shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Oui, Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setEditingOrder(null)}>
          <div
            className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 max-h-[85vh] flex flex-col relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Modifier Table {editingOrder.tableNumber}</h2>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mise à jour Cuisine</p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 custom-scrollbar">
              {editItems.map((item, idx) => {
                const product = getProduct(item.productId);
                return (
                  <div key={idx} className="bg-gray-50 flex items-center justify-between p-4 rounded-2xl border border-gray-100/50">
                    <div className="flex-1 truncate pr-4">
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight block truncate">
                        {product?.name || 'Inconnu'}
                      </span>
                      <span className="text-[9px] font-bold text-blue-600">
                        {formatPrice(product?.price || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2.5 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-sm shrink-0">
                      <button
                        onClick={() => handleEditQuantity(item.productId, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 font-black flex items-center justify-center transition-all"
                      >
                        −
                      </button>
                      <span className="font-black text-gray-900 text-sm min-w-[18px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleEditQuantity(item.productId, 1)}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 font-black flex items-center justify-center transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              {editItems.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-xs font-black uppercase tracking-widest leading-loose">Aucun article<br />sélectionné</p>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="p-6 bg-white border-t border-gray-50 shrink-0">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nouveau Total</span>
                  <span className="text-xl font-black text-gray-900 tracking-tighter">
                    {formatPrice(editItems.reduce((acc, item) => acc + (getProduct(item.productId)?.price || 0) * item.quantity, 0))}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold py-4 rounded-2xl uppercase tracking-widest text-[9px] transition-all"
                >
                  Retour
                </button>
                <button
                  onClick={saveEditedOrder}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplayView;

