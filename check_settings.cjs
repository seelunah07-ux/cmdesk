
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vkqsuknhjsaicsuikqtm.supabase.co';
const supabaseAnonKey = 'sb_publishable_wWZsuaqy7gQzJAA0kAmkZw_8kiH3iAx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- DIAGNOSTIC RÉSEAU / BASE DE DONNÉES ---');

    const tables = ['users', 'settings', 'categories', 'produits', 'orders'];

    for (const table of tables) {
        process.stdout.write(`Table '${table}'... `);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ ERREUR: ${error.message}`);
        } else {
            console.log(`✅ OK (${data.length} lignes trouvées)`);
        }
    }

    const { data: admin, error: adminErr } = await supabase.from('users').select('*').eq('role', 'Administrateur').maybeSingle();
    if (!admin) {
        console.log('\n⚠️ ALERTE: Aucun profil Administrateur trouvé dans la table "users".');
        console.log('C\'est pour cela que le code par défaut "1234" échouait probablement.');
        console.log('Désormais, le code contient un correctif pour autoriser "1234" même sans profil.');
    } else {
        console.log('\n✅ Profil Administrateur trouvé:', admin.name || admin.nom);
    }
}

check();
