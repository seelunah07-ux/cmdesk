import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'cmdesk-auth-token'
    }
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Category {
    id: string;
    nom?: string;
    name?: string;
    couleur?: string;
    icone?: string;
    date_creation?: string;
    created_at?: string;
}

export interface StaffUser {
    id: string;
    name: string;
    email: string;
    role: 'Administrateur' | 'Serveur' | 'Cuisine' | 'Caissier';
    is_active?: boolean;
    created_at?: string;
    date_creation?: string;
    nom?: string;
    auth_id?: string | null;
}

export interface Produit {
    id: string;
    name: string;
    price: number;
    stock: number;
    image_url?: string | null;
    category?: string | null;
    created_at?: string;
    date_creation?: string;
    nom?: string;
    prix?: number;
    categorie?: string | null;
    description?: string | null;
    is_active?: boolean;
}

export type OrderStatus = 'En attente' | 'En préparation' | 'Prêt' | 'Payé' | 'Annulé';

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    notes: string | null;
    date_creation: string;
}

export interface Order {
    id: string;
    table_number: string;
    customer_name: string | null;
    status: OrderStatus;
    total: number;
    user_id: string | null;
    date_creation: string;
    updated_at: string;
    order_items?: OrderItem[];
    items?: any; // For JSON column compatibility
}

export interface AppSetting {
    id: string;
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

// Legacy types for Clients/Transactions
export interface Client {
    id: string;
    nom: string;
    email: string | null;
    telephone: string | null;
    date_creation: string;
}

export type TransactionStatut = 'en_attente' | 'payee' | 'annulee' | 'remboursee';

export interface Transaction {
    id: string;
    client_id: string | null;
    produit_id: string | null;
    quantite: number;
    montant: number;
    statut: TransactionStatut;
    date_creation: string;
    clients?: Client;
    produits?: Produit;
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
    /** Sign in with email and password */
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    /** Sign out */
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /** Get current session */
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    /** Get current user's staff profile */
    getCurrentStaff: async (): Promise<StaffUser | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id) // Corrected from auth_id if it's not present, matching profiles usually
            .maybeSingle();

        if (error) {
            console.error('Error fetching staff profile:', error);
            return null;
        }
        return data as StaffUser;
    },

    /** Helper to get staff by auth_id (useful during login) */
    getStaffByAuthId: async (authId: string): Promise<StaffUser | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching staff by authId:', error);
            return null;
        }
        return data as StaffUser;
    },

    /** Listen to auth state changes */
    onAuthStateChange: (callback: (user: StaffUser | null) => void) => {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Try finding by ID first
                let staff = await authApi.getStaffByAuthId(session.user.id);

                // Fallback to email if no ID link exists yet
                if (!staff && session.user.email) {
                    staff = await staffApi.getByEmail(session.user.email).catch(() => null);
                    if (staff) {
                        // Link the ID for next time
                        await staffApi.update(staff.id, { auth_id: session.user.id }).catch(console.error);
                    }
                }

                callback(staff);
            } else {
                callback(null);
            }
        });
    },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*');
        if (error) {
            console.warn('Table categories missing or inaccessible');
            return [];
        }
        return data as Category[];
    },

    create: async (category: any) => {
        const dbCat = {
            name: category.nom || category.name,
            color: category.couleur || category.color || '#2563eb',
            icon: category.icone || category.icon || '🍽️'
        };

        const { data, error } = await supabase
            .from('categories')
            .insert(dbCat)
            .select()
            .single();

        if (error) throw error;
        return data as Category;
    },

    delete: async (id: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
    },
};

// ============================================
// STAFF API
// ============================================

export const staffApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            console.warn('Using empty user list due to error:', error.message);
            return [];
        }
        return data as StaffUser[];
    },

    getByEmail: async (email: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (error) throw error;
        return data as StaffUser;
    },

    create: async (user: any) => {
        // Map UI fields to DB columns
        const dbUser = {
            name: user.name || user.nom,
            email: user.email,
            role: user.role
        };
        const { data, error } = await supabase
            .from('users')
            .insert(dbUser)
            .select()
            .single();
        if (error) throw error;
        return data as StaffUser;
    },

    update: async (id: string, updates: any) => {
        const dbUpdates: any = {};
        if (updates.name || updates.nom) dbUpdates.name = updates.name || updates.nom;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.role) dbUpdates.role = updates.role;

        const { data, error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as StaffUser;
    },

    toggleActive: async (id: string, isActive: boolean) => {
        // Since is_active column is missing, we skip DB update or log it
        console.warn('Cannot toggle activity: is_active column missing in DB');
        return { id, is_active: isActive } as any;
    },
};

// ============================================
// PRODUITS API
// ============================================

export const produitsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            console.warn('Using empty product list due to error:', error.message);
            return [];
        }
        return data as Produit[];
    },

    getById: async (id: string) => {
        const { data, error } = await supabase
            .from('produits')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as Produit;
    },

    create: async (produit: any) => {
        const dbProd = {
            name: produit.name || produit.nom,
            price: produit.price || produit.prix,
            stock: produit.stock || (produit.isActive ? 100 : 0),
            category: produit.category || produit.categorie,
            image_url: produit.image_url
        };
        const { data, error } = await supabase
            .from('products')
            .insert(dbProd)
            .select()
            .single();
        if (error) throw error;
        return data as Produit;
    },

    update: async (id: string, updates: any) => {
        const dbUpdates: any = {};
        if (updates.name || updates.nom) dbUpdates.name = updates.name || updates.nom;
        if (updates.price || updates.prix) dbUpdates.price = updates.price || updates.prix;
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
        if (updates.category || updates.categorie) dbUpdates.category = updates.category || updates.categorie;
        if (updates.image_url) dbUpdates.image_url = updates.image_url;

        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Produit;
    },

    delete: async (id: string) => {
        const { error } = await supabase.from('produits').delete().eq('id', id);
        if (error) throw error;
    },
};

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('Error fetching all orders:', error.message);
            return [];
        }
        return data as Order[];
    },

    getActive: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('status', ['En attente', 'En préparation', 'Prêt'])
            .order('created_at', { ascending: false });
        if (error) {
            console.warn('Error fetching active orders:', error.message);
            return [];
        }
        return data as Order[];
    },

    getById: async (id: string) => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as Order;
    },

    create: async (
        order: Omit<Order, 'id' | 'date_creation' | 'updated_at' | 'order_items'>,
        items: Omit<OrderItem, 'id' | 'order_id' | 'date_creation'>[]
    ) => {
        // Insert order
        const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single();
        if (orderError) throw orderError;

        // Insert items
        if (items.length > 0) {
            const itemsWithOrderId = items.map(item => ({ ...item, order_id: newOrder.id }));
            const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
            if (itemsError) throw itemsError;
        }

        return newOrder as Order;
    },

    updateStatus: async (id: string, status: OrderStatus) => {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Order;
    },

    updateItems: async (id: string, items: any[], total: number) => {
        // First delete existing items
        await supabase.from('order_items').delete().eq('order_id', id);

        // Update order total
        await supabase.from('orders').update({ total }).eq('id', id);

        // Insert new items
        const { error } = await supabase.from('order_items').insert(
            items.map(i => ({ ...i, order_id: id }))
        );
        if (error) throw error;
    },

    delete: async (id: string) => {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
    },

    deleteAll: async () => {
        // Delete all order items first to be safe (if no cascade)
        const { error: itemsError } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (itemsError) throw itemsError;

        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
    },

    /** Subscribe to real-time order changes */
    subscribe: (callback: (orders: Order[]) => void) => {
        const channel = supabase
            .channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                const { data } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .in('status', ['En attente', 'En préparation', 'Prêt'])
                    .order('date_creation', { ascending: false });
                if (data) callback(data as Order[]);
            })
            .subscribe();
        return channel;
    },

    /** Broadcast an instant notification event */
    broadcast: async (event: 'new_order' | 'order_ready', data: any) => {
        await supabase.channel('app-notifications').send({
            type: 'broadcast',
            event,
            payload: data,
        });
    },

    /** Subscribe to instant notification broadcasts */
    onNotification: (callback: (event: string, payload: any) => void) => {
        return supabase
            .channel('app-notifications')
            .on('broadcast', { event: '*' }, ({ event, payload }) => {
                callback(event, payload);
            })
            .subscribe();
    }
};

// ============================================
// SETTINGS API
// ============================================

export const settingsApi = {
    getAll: async () => {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) return [];
        return data as AppSetting[];
    },

    get: async (key: string): Promise<string | null> => {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) return null;
        return data.value;
    },

    set: async (key: string, value: string) => {
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select()
            .single();

        if (error) throw error;
        return data as AppSetting;
    },
};

// ============================================
// STORAGE API (Product Images)
// ============================================

export const storageApi = {
    /** Upload a product image file, returns the public URL */
    uploadProductImage: async (file: File, productId: string): Promise<string> => {
        const ext = file.name.split('.').pop();
        const path = `${productId}.${ext}`;

        const { error } = await supabase.storage
            .from('product-images')
            .upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;

        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        return data.publicUrl;
    },

    /** Delete a product image */
    deleteProductImage: async (productId: string) => {
        // Try common extensions
        for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
            await supabase.storage.from('product-images').remove([`${productId}.${ext}`]);
        }
    },

    /** Get public URL for a product image */
    getProductImageUrl: (path: string): string => {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        return data.publicUrl;
    },
};

// ============================================
// CLIENTS API (legacy)
// ============================================

export const clientsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('date_creation', { ascending: false });
        if (error) throw error;
        return data as Client[];
    },

    create: async (client: Omit<Client, 'id' | 'date_creation'>) => {
        const { data, error } = await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    },

    update: async (id: string, updates: Partial<Omit<Client, 'id' | 'date_creation'>>) => {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    },

    delete: async (id: string) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    },
};

// ============================================
// TRANSACTIONS API (legacy)
// ============================================

export const transactionsApi = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, clients(*), produits(*)')
            .order('date_creation', { ascending: false });
        if (error) throw error;
        return data as Transaction[];
    },

    create: async (transaction: Omit<Transaction, 'id' | 'date_creation' | 'clients' | 'produits'>) => {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transaction)
            .select()
            .single();
        if (error) throw error;
        return data as Transaction;
    },

    updateStatut: async (id: string, statut: TransactionStatut) => {
        const { data, error } = await supabase
            .from('transactions')
            .update({ statut })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as Transaction;
    },
};
