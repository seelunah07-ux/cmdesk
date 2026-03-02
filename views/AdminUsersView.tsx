
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
      <div className="flex-1 p-8 bg-gray-50 min-h-screen">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Gestion du Personnel</h2>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Gérez votre équipe et leurs permissions</p>
               </div>
               <button
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-100 flex items-center space-x-3 active:scale-95 transition-all hover:bg-blue-700"
               >
                  <span className="text-lg">+</span>
                  <span>Recruter un Employé</span>
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {context?.users.map(u => (
                  <div key={u.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/40 transition-all group">
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center font-black text-3xl text-gray-300 uppercase shadow-inner border border-gray-100">
                           {u.name[0]}
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase mb-3 bg-gray-100 text-gray-500 tracking-widest">
                              {u.role}
                           </span>
                           <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                 {u.isActive ? 'En Service' : 'Désactivé'}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="mb-8">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-1 uppercase group-hover:text-blue-600 transition-colors uppercase">{u.name}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{u.email}</p>
                     </div>

                     <div className="flex space-x-3 border-t border-gray-50 pt-8">
                        <button className="flex-1 py-4 bg-gray-50 rounded-2xl text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Détails</button>
                        <button
                           onClick={() => toggleUserStatus(u.id)}
                           className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${u.isActive ? 'bg-red-50 text-red-600 shadow-red-50 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-600 shadow-green-50 hover:bg-green-600 hover:text-white'
                              }`}
                        >
                           {u.isActive ? 'Suspendre' : 'Réactiver'}
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
