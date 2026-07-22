// ============================================================
// NETLIFY FUNCTION : INSCRIPTION → AIRTABLE
// ============================================================

const https = require('https');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = 'appKXledVY9ADzxai';
const AIRTABLE_TABLE = 'Inscriptions';

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }

    const body = JSON.parse(event.body);
    const { name, email, password, profile } = body;

    if (!name || !email || !password || !profile) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Champs manquants' }) };
    }

    const record = {
        records: [{
            fields: {
                'Nom': name,
                'Email': email,
                'Mot de passe': password,
                'Profil': profile,
                'Date': new Date().toISOString()
            }
        }]
    };

    const options = {
        hostname: 'api.airtable.com',
        path: `/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    if (res.statusCode >= 400) {
                        console.error('Erreur Airtable:', jsonResponse);
                        resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erreur Airtable' }) });
                    } else {
                        resolve({ statusCode: 200, body: JSON.stringify({ success: true }) });
                    }
                } catch (error) {
                    resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erreur de traitement' }) });
                }
            });
        });

        req.on('error', () => {
            resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erreur de connexion' }) });
        });

        req.write(JSON.stringify(record));
        req.end();
    });
};
