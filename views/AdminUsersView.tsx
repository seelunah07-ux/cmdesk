
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { staffApi, StaffUser } from '../src/lib/supabase';

const AdminUsersView: React.FC = () => {
   const context = useContext(AppContext);
   const [isAdding, setIsAdding] = React.useState(false);
   const [newUser, setNewUser] = React.useState({
      nom: '',
      email: '',
      role: 'Serveur' as StaffUser['role']
   });

   const toggleUserStatus = async (id: string) => {
      const user = context?.users.find(u => u.id === id);
      if (!user) return;

      try {
         await staffApi.toggleActive(id, !user.isActive);
         context?.setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
      } catch (err) {
         console.error('Error toggling user status:', err);
      }
   };

   const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const added = await staffApi.create({
            nom: newUser.nom,
            email: newUser.email,
            role: newUser.role,
            is_active: true,
            auth_id: null
         });
         context?.setUsers(prev => [...prev, added]);
         setIsAdding(false);
         setNewUser({ nom: '', email: '', role: 'Serveur' });
      } catch (err) {
         console.error('Error creating user:', err);
         alert("Erreur lors de la création de l'utilisateur. L'email est peut-être déjà utilisé.");
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
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
               <Link to="/admin/products" className="flex items-center space-x-3 p-3 rounded-xl text-gray-500 hover:bg-gray-50 font-semibold transition-colors">
                  <span>Inventaire</span>
               </Link>
               <Link to="/admin/users" className="flex items-center space-x-3 p-3 rounded-xl bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600">
                  <span>Personnel</span>
               </Link>
            </nav>
         </div>

         <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h2 className="text-3xl font-black text-gray-900">Gestion du Personnel</h2>
                  <p className="text-gray-500">Ajoutez des membres et gérez leurs accès</p>
               </div>
               <button
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600 px-6 py-3 rounded-2xl font-bold text-white shadow-lg shadow-blue-100 flex items-center space-x-2 active:scale-95 transition-all"
               >
                  <span>Ajouter un Employé</span>
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {context?.users.map(u => (
                  <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center font-black text-2xl text-gray-400 uppercase">
                           {u.name[0]}
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 bg-gray-100">
                              {u.role}
                           </span>
                           <span className={`text-[10px] font-bold uppercase ${u.isActive ? 'text-green-500' : 'text-red-500'}`}>
                              {u.isActive ? 'Actif' : 'Inactif'}
                           </span>
                        </div>
                     </div>

                     <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                        <p className="text-sm text-gray-400 font-medium">{u.email}</p>
                     </div>

                     <div className="flex space-x-3 border-t pt-6">
                        <button className="flex-1 py-3 border border-gray-100 rounded-xl text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors">Éditer</button>
                        <button
                           onClick={() => toggleUserStatus(u.id)}
                           className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                        >
                           {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {isAdding && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
               <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                  <h2 className="text-2xl font-black text-gray-900 uppercase mb-8 tracking-tighter">Nouvel Employé</h2>
                  <form onSubmit={handleAddUser} className="space-y-6">
                     <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Nom Complet</label>
                        <input
                           type="text"
                           placeholder="Ex: Jean Dupont"
                           value={newUser.nom}
                           onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                           className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Email Professionnel</label>
                        <input
                           type="email"
                           placeholder="email@gastroflow.com"
                           value={newUser.email}
                           onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                           className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Rôle & Accès</label>
                        <select
                           value={newUser.role}
                           onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                           className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 font-bold text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                        >
                           <option value="Serveur">Serveur (Prise de commande)</option>
                           <option value="Cuisine">Cuisine (Affichage écran)</option>
                           <option value="Caissier">Caissier (Paiement & Facturation)</option>
                           <option value="Administrateur">Administrateur (Gestion totale)</option>
                        </select>
                     </div>
                     <div className="flex space-x-3 pt-4">
                        <button type="submit" className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Enregistrer</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-400 font-black py-4 rounded-2xl uppercase text-xs tracking-widest active:scale-95 transition-all">Annuler</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminUsersView;
