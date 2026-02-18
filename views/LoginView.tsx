
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Currency } from '../types';
import { authApi, staffApi } from '../src/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'saas-login' | 'role-select';

// ─── Icons ────────────────────────────────────────────────────────────────────
const LogoIcon = () => (
  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const ChefIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M12 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.5V11h2a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7a2 2 0 012-2h2V9.5A4 4 0 0112 2z" />
  </svg>
);

const WaiterIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CashierIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
  </svg>
);

// ─── Role Card ────────────────────────────────────────────────────────────────
interface RoleCardProps {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  onClick: () => void;
  loading?: boolean;
  error?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({
  label, sublabel, icon, textColor, bgColor, borderColor, iconBg, onClick, loading, error
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 active:scale-95 hover:shadow-md disabled:opacity-60 group
      ${error ? 'border-red-200 bg-red-50' : `${borderColor} ${bgColor}`}`}
  >
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${textColor.replace('text-', 'border-')}`} />
      </div>
    )}
    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center ${textColor} transition-transform duration-200 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="text-center">
      <p className={`text-[11px] font-black uppercase tracking-widest ${error ? 'text-red-500' : textColor}`}>
        {error ? 'Aucun profil' : label}
      </p>
      <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{sublabel}</p>
    </div>
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const LoginView: React.FC = () => {
  const context = useContext(AppContext);

  const [step, setStep] = useState<Step>(context?.isSaaSAuthenticated ? 'role-select' : 'saas-login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // ── Step 1: SaaS owner login ───────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await authApi.signIn(email, password);
      if (user) {
        // Sign out immediately — we only needed to verify credentials
        // The role selector handles actual app access
        await authApi.signOut().catch(() => { });
        context?.setIsSaaSAuthenticated(true);
        setStep('role-select');
      }
    } catch (err: any) {
      // Supabase Auth error messages
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter.');
      } else {
        setError(msg || 'Erreur de connexion. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Direct role access ─────────────────────────────────────────────
  const handleRoleLogin = async (role: string) => {
    setRoleLoading(role);
    setRoleError(null);
    try {
      const allStaff = await staffApi.getAll();
      const member = allStaff.find(s => s.role === role && s.is_active);

      if (!member) {
        setRoleError(role);
        setTimeout(() => setRoleError(null), 2500);
        setRoleLoading(null);
        return;
      }

      context?.setUser({
        id: member.id,
        name: member.nom,
        email: member.email,
        role: member.role as any,
        isActive: member.is_active,
      });
    } catch (err) {
      console.error('Role login error:', err);
      setRoleLoading(null);
    }
  };

  const handleFullLogout = async () => {
    await authApi.signOut().catch(() => { });
    context?.setIsSaaSAuthenticated(false);
    setStep('saas-login');
    setEmail('');
    setPassword('');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white relative overflow-hidden">

      {/* Blue gradient header */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-blue-600 to-blue-700 rounded-b-[3rem]" />
      {/* Dot pattern overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-72 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Currency selector */}
      <div className="absolute top-5 right-5 z-10 flex items-center space-x-1.5 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/30">
        <span className="text-[8px] font-black uppercase text-white/80 tracking-widest">Devise:</span>
        <select
          value={context?.currency}
          onChange={(e) => context?.setCurrency(e.target.value as Currency)}
          className="bg-transparent text-[10px] font-black text-white uppercase border-none focus:ring-0 cursor-pointer"
        >
          <option value={Currency.ARIARY} className="text-gray-900">Ar (MGA)</option>
          <option value={Currency.USD} className="text-gray-900">$ (USD)</option>
          <option value={Currency.EURO} className="text-gray-900">€ (EUR)</option>
        </select>
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-6 text-center mt-2">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xl">
          <LogoIcon />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">GastroFlow</h1>
        <p className="text-white/70 mt-1 font-bold text-[8px] uppercase tracking-[0.2em]">Solution POS Professionnelle</p>
      </div>

      {/* ── STEP 1: SaaS Login ── */}
      {step === 'saas-login' && (
        <div className="relative z-10 w-full bg-white rounded-3xl shadow-2xl shadow-blue-100/60 p-6">
          <div className="mb-5">
            <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-tight">Connexion</h2>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Accédez à votre espace restaurant</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-900 text-sm"
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1.5 ml-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-900 text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                <span className="text-red-500 text-sm">⚠️</span>
                <p className="text-[10px] font-black uppercase text-red-600">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest text-[10px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Accéder à mon espace →'}
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.3em] mb-3">
              — ou —
            </p>
            <button
              type="button"
              onClick={() => {
                setError('');
                context?.setIsSaaSAuthenticated(true);
                setStep('role-select');
              }}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
            >
              🎯 Accès démo — choisir un rôle directement
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Role Selector ── */}
      {step === 'role-select' && (
        <div className="relative z-10 w-full bg-white rounded-3xl shadow-2xl shadow-blue-100/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('saas-login')}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex-shrink-0"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h2 className="text-[15px] font-black text-gray-900 uppercase tracking-tight">Qui êtes-vous ?</h2>
                <p className="text-[10px] text-gray-400 font-semibold">Choisissez votre poste</p>
              </div>
            </div>
            <button
              onClick={handleFullLogout}
              className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
            >
              Déconnexion
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              label="Serveur"
              sublabel="Prise de commandes"
              icon={<WaiterIcon />}
              textColor="text-blue-600"
              bgColor="bg-blue-50 hover:bg-blue-100"
              borderColor="border-blue-100 hover:border-blue-300"
              iconBg="bg-blue-100"
              loading={roleLoading === 'Serveur'}
              error={roleError === 'Serveur'}
              onClick={() => handleRoleLogin('Serveur')}
            />
            <RoleCard
              label="Cuisine"
              sublabel="Affichage cuisine"
              icon={<ChefIcon />}
              textColor="text-green-600"
              bgColor="bg-green-50 hover:bg-green-100"
              borderColor="border-green-100 hover:border-green-300"
              iconBg="bg-green-100"
              loading={roleLoading === 'Cuisine'}
              error={roleError === 'Cuisine'}
              onClick={() => handleRoleLogin('Cuisine')}
            />
            <RoleCard
              label="Caissier"
              sublabel="Encaissement"
              icon={<CashierIcon />}
              textColor="text-purple-600"
              bgColor="bg-purple-50 hover:bg-purple-100"
              borderColor="border-purple-100 hover:border-purple-300"
              iconBg="bg-purple-100"
              loading={roleLoading === 'Caissier'}
              error={roleError === 'Caissier'}
              onClick={() => handleRoleLogin('Caissier')}
            />
            <RoleCard
              label="Admin"
              sublabel="Tableau de bord"
              icon={<AdminIcon />}
              textColor="text-cyan-600"
              bgColor="bg-cyan-50 hover:bg-cyan-100"
              borderColor="border-cyan-100 hover:border-cyan-300"
              iconBg="bg-cyan-100"
              loading={roleLoading === 'Administrateur'}
              error={roleError === 'Administrateur'}
              onClick={() => handleRoleLogin('Administrateur')}
            />
          </div>

          {roleError && (
            <p className="mt-3 text-[9px] font-black uppercase text-center text-red-500 bg-red-50 p-2 rounded-xl">
              Aucun profil actif trouvé pour ce rôle
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="relative z-10 mt-5 text-[8px] text-gray-400 font-bold uppercase tracking-widest">
        GastroFlow © {new Date().getFullYear()} — Solution POS SaaS
      </p>
    </div>
  );
};

export default LoginView;
