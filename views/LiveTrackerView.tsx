
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { OrderStatus, Currency } from '../types';
import { ordersApi } from '../src/lib/supabase';

const LiveTrackerView: React.FC = () => {
  const context = useContext(AppContext);
  const rawOrders = context?.orders || [];
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null);
  const [isAddingItems, setIsAddingItems] = React.useState(false);
  const [pendingAdditions, setPendingAdditions] = React.useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState('Tout');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Group orders by table number
  const groupedOrders = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    rawOrders.forEach(order => {
      if (!groups[order.tableNumber]) groups[order.tableNumber] = [];
      groups[order.tableNumber].push(order);
    });
    return Object.entries(groups).map(([tableNumber, orders]) => {
      const total = orders.reduce((sum, o) => sum + o.total, 0);
      // Status priority: PENDING > PREPARING > READY
      let status = OrderStatus.READY;
      if (orders.some(o => o.status === OrderStatus.PENDING)) status = OrderStatus.PENDING;
      else if (orders.some(o => o.status === OrderStatus.PREPARING)) status = OrderStatus.PREPARING;

      return {
        tableNumber,
        status,
        total,
        orders,
        customerName: orders.find(o => o.customerName)?.customerName
      };
    }).sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
  }, [rawOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-cyan-100 text-cyan-600 border-cyan-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-600 border-blue-200';
      case OrderStatus.READY: return 'bg-green-100 text-green-600 border-green-200';
      case OrderStatus.PAID: return 'bg-gray-100 text-gray-400 border-gray-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const formatPrice = (priceInAr: number) => {
    if (context?.currency === Currency.ARIARY) return `${priceInAr.toLocaleString()} Ar`;
    return `${(priceInAr / 4000).toLocaleString()} $`;
  };

  const getProduct = (id: string) => context?.products.find(p => p.id === id);

  const startAddingItems = (tableNum: string) => {
    setSelectedTable(tableNum);
    setIsAddingItems(true);
    setPendingAdditions([]);
  };

  const handleAddProduct = (product: any) => {
    setPendingAdditions(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx > -1) {
        const newArr = [...prev];
        newArr[idx] = { ...newArr[idx], quantity: newArr[idx].quantity + 1 };
        return newArr;
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  };

  const validateAdditions = async () => {
    if (!selectedTable || pendingAdditions.length === 0) {
      setSelectedTable(null);
      setPendingAdditions([]);
      setIsAddingItems(false);
      return;
    }

    const tableData = groupedOrders.find(g => g.tableNumber === selectedTable);
    const newTotal = pendingAdditions.reduce((acc, item) => {
      const p = getProduct(item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);

    // Create a NEW order ticket for the kitchen so they only see the new items
    const newOrder = {
      tableNumber: selectedTable,
      customerName: tableData?.customerName || null,
      items: pendingAdditions,
      status: OrderStatus.PENDING,
      total: newTotal,
      timestamp: new Date()
    };

    try {
      await context?.addOrder(newOrder);

      const itemsDescription = pendingAdditions.map(i => {
        const p = getProduct(i.productId);
        return `${i.quantity}x ${p?.name}`;
      }).join(', ');

      ordersApi.broadcast('new_order' as any, {
        tableNumber: selectedTable,
        isAddition: true,
        newItems: itemsDescription
      });

      context?.refreshOrders();
    } catch (err) {
      console.error('Error adding addition:', err);
    }

    setSelectedTable(null);
    setPendingAdditions([]);
    setIsAddingItems(false);
  };

  const currentTableData = React.useMemo(() =>
    groupedOrders.find(g => g.tableNumber === selectedTable),
    [groupedOrders, selectedTable]
  );

  const currentTotalWithAdditions = React.useMemo(() => {
    const baseTotal = currentTableData?.total || 0;
    const additionsTotal = pendingAdditions.reduce((acc, item) => {
      const p = getProduct(item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);
    return baseTotal + additionsTotal;
  }, [currentTableData, pendingAdditions, context?.products]);

  const filteredProducts = React.useMemo(() =>
    context?.products.filter(p =>
      (selectedCategory === 'Tout' || p.category === selectedCategory) &&
      p.isActive &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [],
    [context?.products, selectedCategory, searchQuery]
  );

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen pb-32">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Service en Direct</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Consolidation par Table</p>
          </div>
          <div className="flex items-center space-x-3 bg-white px-5 py-2.5 rounded-full border border-gray-100 shadow-sm">
            <div className={`w-2 h-2 rounded-full animate-pulse ${groupedOrders.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-gray-900 text-[10px] font-black uppercase tracking-widest">Connecté</span>
          </div>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="text-center py-40 opacity-20">
            <span className="text-6xl mb-6 block">🍽️</span>
            <p className="font-extrabold uppercase tracking-[0.3em] text-xs">Aucune table active</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedOrders.map((group) => (
              <div
                key={group.tableNumber}
                className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl transition-all shadow-lg ${group.status === OrderStatus.READY ? 'bg-green-500' : 'bg-gray-900'}`}>
                      {group.tableNumber}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm flex items-center tracking-tighter">
                        Table {group.tableNumber}
                        {group.customerName && <span className="ml-2 text-[9px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{group.customerName}</span>}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 opacity-50">{group.orders.length} ticket(s)</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border-2 text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor(group.status)}`}>
                    {group.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => { setSelectedTable(group.tableNumber); setIsAddingItems(false); }}
                    className="flex-1 bg-gray-50 text-gray-900 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    Addition
                  </button>
                  <button
                    onClick={() => startAddingItems(group.tableNumber)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    + Ajouter
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Total Cumulé</span>
                  <span className="text-[12px] font-black text-gray-900">{formatPrice(group.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details / Invoice Modal */}
      {selectedTable && !isAddingItems && currentTableData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setSelectedTable(null)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl shadow-xl">
                {selectedTable}
              </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Addition Table {selectedTable}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Détail Consolidé</p>
            </div>

            <div className="bg-gray-50 rounded-[2.5rem] p-6 mb-8 max-h-[40vh] overflow-y-auto hide-scrollbar">
              <div className="space-y-6">
                {currentTableData.orders.map((order: any, oIdx: number) => (
                  <div key={order.id} className="pt-4 first:pt-0 border-t first:border-0 border-gray-200/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Ticket #{oIdx + 1}</span>
                      <span className="text-[8px] font-bold text-gray-400 capitalize">{order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item: any, iIdx: number) => {
                        const p = getProduct(item.productId);
                        return (
                          <div key={iIdx} className="flex justify-between items-center text-[10px] font-bold text-gray-700 uppercase">
                            <span className="flex-1">{p?.name || 'Article'} <span className="text-gray-400 lowercase italic ml-1">x{item.quantity}</span></span>
                            <span className="font-black text-gray-900 ml-4">{formatPrice((p?.price || 0) * item.quantity)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center px-4 mb-8">
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Net à Payer</span>
              <span className="text-2xl font-black text-blue-600 tracking-tighter">{formatPrice(currentTableData.total)}</span>
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {selectedTable && isAddingItems && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Compléter Table {selectedTable}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nouveaux articles pour la cuisine</p>
              </div>
              <button onClick={() => { setSelectedTable(null); setIsAddingItems(false); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black">✕</button>
            </div>

            <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-4 pb-2">
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

            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-2xl py-3 px-10 text-[10px] font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all shadow-inner"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-[12px]">🔍</span>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar mb-8">
              {pendingAdditions.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                  <p className="text-[8px] font-black text-yellow-600 uppercase mb-2 tracking-widest">En attente d'envoi :</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingAdditions.map((item, idx) => (
                      <span key={idx} className="bg-white px-3 py-1.5 rounded-xl text-[9px] font-bold text-gray-800 shadow-sm">
                        {getProduct(item.productId)?.name} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={() => handleAddProduct(product)}
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-2 group-active:scale-90 transition-transform overflow-hidden relative">
                      <img src={product.image} className="w-full h-full object-contain" alt={product.name} />
                      <div className="absolute inset-0 bg-blue-600/0 group-active:bg-blue-600/10 transition-colors" />
                    </div>
                    <h3 className="text-[7px] font-bold text-gray-900 mt-2 text-center uppercase truncate w-full">{product.name}</h3>
                    <p className="text-[8px] font-black text-blue-600">{formatPrice(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-[2.5rem] flex justify-between items-center text-white shadow-2xl shadow-blue-200">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-blue-100 opacity-60">Suppléments à envoyer</span>
                <span className="text-xl font-black tracking-tighter">
                  {formatPrice(pendingAdditions.reduce((acc, item) => acc + (getProduct(item.productId)?.price || 0) * item.quantity, 0))}
                </span>
              </div>
              <button
                onClick={validateAdditions}
                disabled={pendingAdditions.length === 0}
                className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                Envoyer Cuisine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackerView;
