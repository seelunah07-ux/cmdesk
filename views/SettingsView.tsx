
import React, { useState, useContext, useRef } from 'react';
import { AppContext } from '../App';
import { Product, Currency } from '../types';
import { EXCHANGE_RATES } from '../constants';
import { produitsApi, storageApi, settingsApi } from '../src/lib/supabase';
import { UserRole } from '../types';

const SettingsView: React.FC = () => {
  const context = useContext(AppContext);
  const categories = context?.categories || [];
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('gastroflow_sound') !== 'off');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pins, setPins] = useState<{ [key: string]: string }>({
    'Administrateur': '',
    'Serveur': '',
    'Cuisine': '',
    'Caissier': ''
  });
  const [isSavingPin, setIsSavingPin] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchPins = async () => {
      const roles = ['Administrateur', 'Serveur', 'Cuisine', 'Caissier'];
      const fetchedPins: { [key: string]: string } = {};
      for (const role of roles) {
        const pin = await settingsApi.get(`pin_${role}`);
        fetchedPins[role] = pin || (role === 'Administrateur' ? '1234' : '');
      }
      setPins(fetchedPins);
    };
    if (context?.user?.role === UserRole.ADMIN) {
      fetchPins();
    }
  }, [context?.user?.role]);

  const handleUpdatePin = async (role: string, newPin: string) => {
    if (newPin.length !== 4) return;
    setIsSavingPin(role);
    try {
      await settingsApi.set(`pin_${role}`, newPin);
      setPins(prev => ({ ...prev, [role]: newPin }));
    } catch (err) {
      console.error('Error updating PIN:', err);
    } finally {
      setIsSavingPin(null);
    }
  };

  const products = context?.products || [];

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('gastroflow_sound', newVal ? 'on' : 'off');

    // Test sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
      setTimeout(() => ctx.close(), 400);
    } catch (e) { }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      let imageUrl = editingProduct.image;
      if (selectedFile) {
        imageUrl = await storageApi.uploadProductImage(selectedFile, editingProduct.id);
      }

      await produitsApi.update(editingProduct.id, {
        nom: editingProduct.name,
        prix: editingProduct.price,
        image_url: imageUrl,
        stock: editingProduct.isActive ? 100 : 0
      });

      context?.setProducts(prev =>
        prev.map(p => p.id === editingProduct.id ? { ...editingProduct, image: imageUrl } : p)
      );
      setEditingProduct(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error saving product:', err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      setSelectedFile(file);
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
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Configuration Terminal</h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gérez vos périphériques et catalogue local</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-10">
          {/* Section Config Globale */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h2 className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] mb-6 flex items-center">
              <span className="mr-3 text-xl">🌍</span> Préférences Système
            </h2>

            {/* Notification Sound */}
            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">Son de Notification</span>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Jouer un son lors d'un changement de statut</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleSound}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${soundEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${soundEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section PIN (Admin Only) */}
        {context?.user?.role === UserRole.ADMIN && (
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm mb-10">
            <h2 className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] mb-6 flex items-center">
              <span className="mr-3 text-xl">🔐</span> Codes PIN de Sécurité
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(pins).map(([role, pin]) => (
                <div key={role} className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{role}</span>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase">Accès protégé par PIN</p>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="----"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPins(prev => ({ ...prev, [role]: val }));
                        if (val.length === 4) handleUpdatePin(role, val);
                      }}
                      className="w-20 bg-white border-0 rounded-xl px-3 py-2 text-center font-black tracking-[0.5em] text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none shadow-sm"
                    />
                    {isSavingPin === role && (
                      <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[8px] text-gray-400 font-bold uppercase tracking-widest text-center">
              Les modifications sont enregistrées automatiquement dès que 4 chiffres sont saisis.
            </p>
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <h2 className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] flex items-center">
              <span className="mr-3 text-xl">📋</span> Catalogue Rapide
            </h2>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filtrer les articles..."
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-3.5 px-6 pl-12 text-sm font-bold focus:bg-white focus:border-blue-100 focus:ring-0 transition-all placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 opacity-40">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => setEditingProduct(product)}
                className={`bg-white rounded-[2rem] p-5 border-2 border-gray-50 flex items-center justify-between transition-all hover:border-blue-400 active:scale-95 cursor-pointer group ${!product.isActive ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <img src={product.image} className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-500" alt="" />
                    {!product.isActive && <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-pulse" />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${product.isActive ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                  <span className="text-gray-200 text-2xl font-light transform transition-transform group-hover:translate-x-1">›</span>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                    onClick={() => setEditingProduct({ ...editingProduct, isActive: !editingProduct.isActive })}
                    className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all w-full border-2 ${editingProduct.isActive
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
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
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
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 uppercase tracking-widest"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
