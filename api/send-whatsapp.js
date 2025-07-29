// Vercel API route for WhatsApp proxy
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({
                success: false,
                error: 'Phone and code are required'
            });
        }

        // TextMeBot API configuration from environment variables
        const TEXTMEBOT_API_KEY = process.env.TEXTMEBOT_API_KEY || 'jYg9R67hoNMT';
        const TEXTMEBOT_API_URL = process.env.TEXTMEBOT_API_URL || 'https://api.textmebot.com/send.php';
        const REGISTERED_PHONE = process.env.REGISTERED_PHONE || '6285890033683';

        const message = `Kode verifikasi Temanly Anda: ${code}\n\nJangan bagikan kode ini kepada siapa pun.\n\nKode berlaku selama 10 menit.`;

        // Construct API URL - send to registered number
        const url = `${TEXTMEBOT_API_URL}?recipient=${REGISTERED_PHONE}&apikey=${TEXTMEBOT_API_KEY}&text=${encodeURIComponent(message)}`;

        console.log('Sending WhatsApp to registered number:', REGISTERED_PHONE);
        console.log('Verification code:', code);

        // Make API request to TextMeBot
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Temanly-WhatsApp-Service/1.0'
            }
        });

        const responseText = await response.text();
        
        console.log('TextMeBot response:', {
            status: response.status,
            body: responseText
        });

        if (response.ok) {
            res.json({
                success: true,
                message: `WhatsApp message sent to registered number: ${REGISTERED_PHONE}`,
                code: code,
                response: responseText
            });
        } else {
            res.status(500).json({
                success: false,
                error: `TextMeBot API error: ${response.status} - ${responseText}`
            });
        }

    } catch (error) {
        console.error('WhatsApp proxy error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
