
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../../App';
import { Currency, UserRole, OrderStatus } from '../../types';
import { EXCHANGE_RATES } from '../../constants';

const Sidebar: React.FC = () => {
    const context = useContext(AppContext);
    const location = useLocation();

    if (!context?.user) return null;

    const isAdmin = context.user.role === UserRole.ADMIN;
    const isCashier = context.user.role === UserRole.CASHIER;
    const isServer = context.user.role === UserRole.SERVER;
    const isKitchen = context.user.role === UserRole.KITCHEN;

    const readyOrdersCount = React.useMemo(() =>
        context?.orders.filter(o => o.status === OrderStatus.READY).length || 0,
        [context?.orders]
    );

    const links = isAdmin ? [
        { label: 'Tableau de Bord', path: '/admin', icon: '📊' },
        { label: 'Inventaire', path: '/admin/products', icon: '📦' },
        { label: 'Personnel', path: '/admin/users', icon: '👥' },
        { label: 'En Direct', path: '/live', icon: '📡', notify: readyOrdersCount > 0 },
        { label: 'Réglages', path: '/settings', icon: '⚙️' },
    ] : isCashier ? [
        { label: 'Encaisser', path: '/cashier', icon: '💰' },
        { label: 'En Direct', path: '/live', icon: '📡', notify: readyOrdersCount > 0 },
        { label: 'Réglages', path: '/settings', icon: '⚙️' },
    ] : isServer ? [
        { label: 'Commandes', path: '/server', icon: '📋' },
        { label: 'En Direct', path: '/live', icon: '📡', notify: readyOrdersCount > 0 },
        { label: 'Réglages', path: '/settings', icon: '⚙️' },
    ] : isKitchen ? [
        { label: 'Cuisine', path: '/kitchen', icon: '👨‍🍳' },
        { label: 'En Direct', path: '/live', icon: '📡', notify: readyOrdersCount > 0 },
        { label: 'Réglages', path: '/settings', icon: '⚙️' },
    ] : [];

    return (
        <div className="hidden lg:flex w-80 bg-white border-r border-gray-100 p-8 flex-col space-y-10 sticky top-0 h-screen z-20 shrink-0">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-blue-100 transform -rotate-12">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-2xl text-gray-900 tracking-tighter leading-none">CMDesk</span>
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Version Pro</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2 mt-4 overflow-y-auto hide-scrollbar">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4 ml-4">Navigation</p>
                {links.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center space-x-4 p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all group relative ${location.pathname === link.path
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]'
                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <span className={`text-lg transition-opacity ${location.pathname === link.path ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                            {(link as any).icon}
                        </span>
                        <span className="flex-1">{link.label}</span>
                        {(link as any).notify && (
                            <span className="w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                    </Link>
                ))}
            </nav>

            <div className="pt-8 border-t border-gray-50">
                <button
                    onClick={() => context?.setUser(null)}
                    className="w-full flex items-center space-x-4 p-4 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[11px] uppercase tracking-[0.2em] group"
                >
                    <span className="text-xl transition-transform group-hover:scale-110">🚪</span>
                    <span>Quitter</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
