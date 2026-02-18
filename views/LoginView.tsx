
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Currency } from '../types';
import { authApi } from '../src/lib/supabase';

const LoginView: React.FC = () => {
  const context = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.signIn(email, password);
      // Auth state change in App.tsx will handle setting the user
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      if (message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    const roleEmails: Record<string, string> = {
      'Administrateur': 'admin@gastroflow.com',
      'Serveur': 'sarah@gastroflow.com',
      'Cuisine': 'kitchen@gastroflow.com',
      'Caissier': 'cashier@gastroflow.com',
    };
    if (roleEmails[role]) {
      setEmail(roleEmails[role]);
      setPassword('GastroFlow2024!');
    }
  };

  const roles = ['Administrateur', 'Serveur', 'Cuisine', 'Caissier'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 bg-white relative">
      {/* Sélecteur de devise */}
      <div className="absolute top-6 right-6 flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Devise:</span>
        <select
          value={context?.currency}
          onChange={(e) => context?.setCurrency(e.target.value as Currency)}
          className="bg-transparent text-[10px] font-black text-orange-600 uppercase border-none focus:ring-0 cursor-pointer"
        >
          <option value={Currency.ARIARY}>Ar (MGA)</option>
          <option value={Currency.USD}>$ (USD)</option>
          <option value={Currency.EURO}>€ (EUR)</option>
        </select>
      </div>

      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-100 transform -rotate-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">GastroFlow</h1>
        <p className="text-gray-400 mt-2 font-bold text-[10px] uppercase tracking-[0.2em]">Solution POS Professionnelle</p>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Identité</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-900"
            placeholder="Email du personnel"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-900"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-xs"
        >
          {loading ? 'Vérification...' : 'Déverrouiller le Terminal'}
        </button>
      </form>

      <div className="mt-12 w-full">
        <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.3em] mb-4">Accès rapide (démo)</p>
        <div className="grid grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => quickLogin(role)}
              className="py-3 px-4 border-2 border-gray-50 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-tighter hover:bg-orange-50 hover:border-orange-100 hover:text-orange-500 transition-all active:scale-95"
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
