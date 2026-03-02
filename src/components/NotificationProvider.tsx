
import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppContext } from '../../App';
import { OrderStatus } from '../../types';
import { ordersApi, supabase } from '../lib/supabase';

// ─── Web Audio Notification Sound ─────────────────────────────────────────────
// ─── Toast Component ──────────────────────────────────────────────────────────
interface Toast {
    id: string;
    message: string;
    icon: string;
    type: 'info' | 'success' | 'warning';
}

const TOAST_COLORS = {
    info: 'bg-blue-600 text-white shadow-blue-200',
    success: 'bg-green-600 text-white shadow-green-200',
    warning: 'bg-amber-500 text-white shadow-amber-200',
};

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const context = useContext(AppContext);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const prevOrdersRef = useRef<string>('');
    const audioContextRef = useRef<AudioContext | null>(null);

    // ─── Sound System ────────────────────────────────────────────────────────
    const playNotificationSound = useCallback(() => {
        const enabled = localStorage.getItem('gastroflow_sound') !== 'off';
        if (!enabled) return;

        try {
            // Use the primed context if available
            let ctx = audioContextRef.current;

            // Fallback if not primed (though it should be)
            if (!ctx) {
                ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Pleasant multi-tone chime
            oscillator.type = 'sine';
            const now = ctx.currentTime;
            oscillator.frequency.setValueAtTime(880, now);       // A5
            oscillator.frequency.setValueAtTime(1108.73, now + 0.12); // C#6
            oscillator.frequency.setValueAtTime(1318.51, now + 0.24); // E6

            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            oscillator.start(now);
            oscillator.stop(now + 0.5);
        } catch (e) {
            console.warn('Sound play failed:', e);
        }
    }, []);

    // Prime the audio engine on first user interaction (critical for Mobile/Browser policies)
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                // Play a silent buffer to "unlock" audio on mobile
                const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start(0);

                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
                console.log('Audio Context Unlocked');
            }
        };

        window.addEventListener('click', initAudio, { once: true });
        window.addEventListener('touchstart', initAudio, { once: true });
        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };
    }, []);

    const addToast = useCallback((message: string, icon: string, type: Toast['type'] = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev.slice(-3), { id, message, icon, type }]);
        playNotificationSound();
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, [playNotificationSound]);

    // ─── Instant Broadcast Listener ──────────────────────────────────────────
    useEffect(() => {
        if (!context?.user) return;

        const channel = ordersApi.onNotification((event, payload) => {
            // This is INSTANT via Supabase Broadcast (WebSocket)
            if (event === 'new_order') {
                if (payload.isAddition) {
                    addToast(`Addition Table ${payload.tableNumber} : ${payload.newItems}`, '🍳', 'info');
                } else {
                    addToast(`Nouvelle commande — Table ${payload.tableNumber}`, '🔔', 'warning');
                }
                context.refreshOrders(); // Forced instant refresh
            } else if (event === 'order_ready') {
                addToast(`Table ${payload.tableNumber} — Commande Prête !`, '✅', 'success');
                context.refreshOrders(); // Forced instant refresh
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [context?.user, context?.refreshOrders, addToast]);

    // ─── DB State Sync Listener (Fallback) ──────────────────────────────────
    useEffect(() => {
        if (!context?.orders) return;

        const currentKey = context.orders
            .map(o => `${o.id}:${o.status}`)
            .sort()
            .join('|');

        if (prevOrdersRef.current && prevOrdersRef.current !== currentKey) {
            const prevMap = new Map(
                prevOrdersRef.current.split('|').filter(Boolean).map(s => {
                    const [id, status] = s.split(':');
                    return [id, status] as [string, string];
                })
            );

            context.orders.forEach(order => {
                const prevStatus = prevMap.get(order.id);
                // We only handle transitions NOT already covered by the instant broadcast
                // or as a safety net if broadcast fails
                if (prevStatus && prevStatus !== order.status) {
                    if (order.status === OrderStatus.READY && prevStatus !== OrderStatus.READY) {
                        // Sound/Toast will be triggered by broadcast mostly, but this ensures sync
                    }
                }
            });
        }

        prevOrdersRef.current = currentKey;
    }, [context?.orders, addToast]);

    return (
        <>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[200] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast-enter pointer-events-auto flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl ${TOAST_COLORS[toast.type]}`}
                    >
                        <span className="text-2xl flex-shrink-0">{toast.icon}</span>
                        <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{toast.message}</p>
                    </div>
                ))}
            </div>
        </>
    );
};

export default NotificationProvider;
