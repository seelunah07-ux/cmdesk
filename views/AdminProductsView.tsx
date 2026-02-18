
import React, { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { Product } from '../types';
import { produitsApi, categoriesApi, storageApi } from '../src/lib/supabase';

const AdminProductsView: React.FC = () => {
  const context = useContext(AppContext);
  const categories = context?.categories || [];
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const deleteProduct = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await produitsApi.delete(id);
        context?.setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Erreur lors de la suppression.');
      }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      let imageUrl = editingProduct.image;

      // Handle image upload if a new file was selected
      if (selectedFile) {
        imageUrl = await storageApi.uploadProductImage(selectedFile, editingProduct.id);
      }

      const productData = {
        nom: editingProduct.name,
        description: editingProduct.description || null,
        prix: editingProduct.price,
        stock: editingProduct.isActive ? 100 : 0, // Simplified stock handling
        image_url: imageUrl,
        categorie: editingProduct.category,
      };

      const exists = context?.products.find(p => p.id === editingProduct.id);
      if (exists) {
        await produitsApi.update(editingProduct.id, productData);
        context?.setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...editingProduct, image: imageUrl } : p));
      } else {
        const newProd = await produitsApi.create(productData);
        context?.setProducts(prev => [...prev, { ...editingProduct, id: newProd.id, image: imageUrl }]);
      }
      setEditingProduct(null);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert("Erreur lors de l'enregistrement: " + (err.message || "Erreur inconnue"));
    }
  };

  const addNewProduct = () => {
    setEditingProduct({
      id: crypto.randomUUID(),
      name: '',
      category: categories[0] || '',
      price: 0,
      image: 'https://via.placeholder.com/400',
      isActive: true
    });
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      try {
        await categoriesApi.create({
          nom: newCategory.trim(),
          couleur: '#2563eb',
          icone: '🍽️'
        });
        context?.setCategories([...categories, newCategory.trim()]);
        setNewCategory('');
      } catch (err) {
        console.error('Error adding category:', err);
      }
    }
  };

  const removeCategory = async (cat: string) => {
    if (confirm(`Supprimer la catégorie "${cat}" ? Les produits associés ne seront pas supprimés mais leur catégorie sera vide.`)) {
      try {
        const cats = await categoriesApi.getAll();
        const catObj = cats.find(c => c.nom === cat);
        if (catObj) {
          await categoriesApi.delete(catObj.id);
        }
        context?.setCategories(prev => prev.filter(c => c !== cat));
      } catch (err) {
        console.error('Error deleting category:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r p-6 flex flex-col space-y-8 sticky top-0 md:h-screen">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span className="font-black text-xl text-gray-900">GastroFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-xl text-gray-500 hover:bg-gray-50 font-semibold transition-colors">
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/products" className="flex items-center space-x-3 p-3 rounded-xl bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600">
            <span>Inventaire</span>
          </Link>
          <Link to="/admin/users" className="flex items-center space-x-3 p-3 rounded-xl text-gray-500 hover:bg-gray-50 font-semibold transition-colors">
            <span>Personnel</span>
          </Link>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Gestion de l'Inventaire</h2>
            <p className="text-gray-500">Gérez votre catalogue, prix et catégories</p>
          </div>
          <button onClick={addNewProduct} className="bg-blue-600 px-6 py-3 rounded-2xl font-bold text-white shadow-lg shadow-blue-100 flex items-center space-x-2">
            <span>Ajouter un Produit</span>
          </button>
        </div>

        {/* Gestion des Catégories */}
        <div className="bg-white rounded-[2rem] p-6 mb-8 border border-gray-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Gestion des Catégories</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <div key={cat} className="flex items-center bg-gray-50 border rounded-xl px-3 py-2 space-x-2 group">
                <span className="text-[10px] font-bold text-gray-700 uppercase">{cat}</span>
                <button onClick={() => removeCategory(cat)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Nouvelle catégorie..."
              className="bg-gray-50 border-0 rounded-xl px-4 py-2 text-sm font-bold flex-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="bg-gray-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Ajouter</button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50">
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {context?.products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <img src={p.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <p className="font-bold text-gray-900">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">{p.category}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{p.price.toLocaleString()} Ar</td>
                  <td className="px-6 py-4">
                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${p.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm">{p.isActive ? 'Actif' : 'Inactif'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-8">Fiche Produit</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <img src={editingProduct.image} className="w-32 h-32 rounded-[2rem] object-cover mx-auto shadow-xl" alt="" />
                <p className="text-center text-[10px] font-black text-gray-400 uppercase mt-2">Cliquer pour changer l'image</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <input
                type="text"
                placeholder="Nom du produit"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Prix (Ar)"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold"
                  required
                />
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex space-x-3">
                  <button type="submit" className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl uppercase text-xs">Enregistrer</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl uppercase text-xs">Annuler</button>
                </div>
                {context?.products.some(p => p.id === editingProduct.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteProduct(editingProduct.id);
                      setEditingProduct(null);
                    }}
                    className="w-full bg-red-50 text-red-600 font-extrabold py-4 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all border-2 border-red-100 mt-4 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Supprimer le produit</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsView;
