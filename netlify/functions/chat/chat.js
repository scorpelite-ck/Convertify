// ============================================================
// NETLIFY FUNCTION : CHATBOT IA (API CLAUDE)
// ============================================================

const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    }

    const body = JSON.parse(event.body);
    const question = body.question;
    const context = body.context || '';

    if (!question) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Question manquante' }) };
    }

    const systemPrompt = `Tu es l'assistant IA de Convertify, un outil SaaS qui permet de créer des pages de vente en 5 minutes.
    
Règles :
- Sois professionnel, chaleureux et concis.
- Réponds en français.
- Si on te demande les prix, renvoie vers la page des tarifs.
- Si tu ne sais pas, propose de contacter le support.

Contexte : ${context}`;

    const requestData = JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }]
    });

    const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const jsonResponse = JSON.parse(data);
                    const reply = jsonResponse.content?.[0]?.text || 'Je n\'ai pas pu générer de réponse.';
                    resolve({ statusCode: 200, body: JSON.stringify({ answer: reply }) });
                } catch (error) {
                    resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erreur de traitement' }) });
                }
            });
        });

        req.on('error', () => {
            resolve({ statusCode: 500, body: JSON.stringify({ error: 'Erreur de connexion' }) });
        });

        req.write(requestData);
        req.end();
    });
};
