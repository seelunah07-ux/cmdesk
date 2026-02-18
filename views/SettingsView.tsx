
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { Product, Currency } from '../types';
import { CATEGORIES, EXCHANGE_RATES } from '../constants';

const SettingsView: React.FC = () => {
  const context = useContext(AppContext);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const products = context?.products || [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    context?.setProducts(prev => 
      prev.map(p => p.id === editingProduct.id ? editingProduct : p)
    );
    setEditingProduct(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Configuration Terminal</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Paramètres Opérationnels</p>
        </div>
      </div>

      {/* Section Config Globale */}
      <div className="bg-white rounded-[2rem] p-6 mb-8 border border-gray-100 shadow-sm">
         <h2 className="text-[10px] font-black uppercase text-gray-900 tracking-widest mb-4 flex items-center">
           <span className="mr-2">🌍</span> Préférences Globales
         </h2>
         <div className="space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Devise Active</span>
               <div className="text-right">
                <select 
                  value={context?.currency} 
                  onChange={(e) => context?.setCurrency(e.target.value as Currency)}
                  className="bg-gray-50 border-0 rounded-xl py-2 px-4 text-[10px] font-black text-orange-600 uppercase focus:ring-2 focus:ring-orange-500"
                >
                  <option value={Currency.ARIARY}>Ariary (Ar)</option>
                  <option value={Currency.USD}>Dollar ($)</option>
                  <option value={Currency.EURO}>Euro (€)</option>
                </select>
                <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">1$ = 4500Ar | 1€ = 5200Ar</p>
               </div>
            </div>
         </div>
      </div>

      <div className="mb-6 relative">
        <input 
          type="text"
          placeholder="Rechercher dans le catalogue..."
          className="w-full bg-white border-0 rounded-[1.5rem] py-4 px-6 pl-12 shadow-sm text-sm font-bold focus:ring-2 focus:ring-orange-500 placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 opacity-30">🔍</span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {filteredProducts.map(product => (
          <div 
            key={product.id} 
            onClick={() => setEditingProduct(product)}
            className={`bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all active:scale-95 cursor-pointer hover:border-orange-200 ${!product.isActive ? 'opacity-40 grayscale' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <img src={product.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt="" />
              <div>
                <h3 className="font-bold text-gray-900 text-xs uppercase tracking-tighter">{product.name}</h3>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-0.5">{formatPrice(product.price)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-red-400'}`}></div>
              <span className="text-gray-300 text-xl font-light">›</span>
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Modifier l'Article</h2>
              <button onClick={() => setEditingProduct(null)} className="text-2xl text-gray-300 hover:text-gray-900 transition-colors">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                  <img src={editingProduct.image} className="w-24 h-24 rounded-[2rem] object-cover shadow-2xl border-4 border-gray-50" alt="" />
                  <div className="absolute inset-0 bg-black/30 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Changer</span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Statut Inventaire</label>
                  <button 
                    type="button"
                    onClick={() => setEditingProduct({...editingProduct, isActive: !editingProduct.isActive})}
                    className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full border-2 ${
                      editingProduct.isActive 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}
                  >
                    {editingProduct.isActive ? 'En Stock' : 'Épuisé'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Nom du Produit</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Prix de Base (Ariary)</label>
                <p className="text-[8px] text-gray-400 font-bold uppercase mb-2">Conversion: {formatPrice(editingProduct.price)}</p>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    step="100"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-orange-500"
                  />
                  <select 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-orange-500 uppercase tracking-widest"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-gray-900 text-white font-black py-5 rounded-[2.5rem] uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all"
                >
                  Appliquer les Changements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="h-24" />
    </div>
  );
};

export default SettingsView;
