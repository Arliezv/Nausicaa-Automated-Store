// /api/xendit-webhook.js

// (1) Import RCON Client
const Rcon = require('rcon-client').Rcon; 

// (2) SETUP RAHASIA: Ambil detail rahasia dari Environment Variables Vercel
const XENDIT_WEBHOOK_SECRET = process.env.XENDIT_WEBHOOK_SECRET; 
const MINECRAFT_RCON_PASSWORD = process.env.RCON_PASSWORD; 
const MINECRAFT_RCON_IP = process.env.RCON_IP; 
const MINECRAFT_RCON_PORT = 25555; // Ganti jika port RCON kamu berbeda!

module.exports = async (req, res) => {
    
    // (3) Verifikasi Keamanan Webhook
    const receivedSignature = req.headers['x-callback-token'];
    
    if (receivedSignature !== XENDIT_WEBHOOK_SECRET) {
        console.warn('Forbidden: Invalid Webhook Secret received.');
        return res.status(403).end('Forbidden: Invalid Webhook Secret');
    }

    const event = req.body;

    // (4) Cek Status Pembayaran (Harus LUNAS)
    if (event.status !== 'PAID' && event.status !== 'SETTLED') {
        return res.status(200).end('Payment not successful, ignoring.');
    }

    try {
        // (5) Ambil Data Player dari Metadata
        const ign = event.metadata.player_ign;
        const rank = event.metadata.rank_name;
        
        if (!ign || !rank) {
            return res.status(400).end('Data IGN atau Rank hilang.');
        }

        // (6) Koneksi RCON ke Server Minecraft (ACTION!)
        console.log(`Attempting RCON command: lp user ${ign} parent set ${rank}`);
        
        const client = new Rcon({
            host: MINECRAFT_RCON_IP,
            port: MINECRAFT_RCON_PORT,
            password: MINECRAFT_RCON_PASSWORD,
        });
        
        const command = `lp user ${ign} parent set ${rank}`;
        
        await client.connect();
        await client.send(command);
        client.disconnect();

        // (7) Selesai: Beri respon 200 OK ke Xendit
        console.log(`SUCCESS: Rank ${rank} given to player ${ign}.`);
        res.status(200).end('Rank given successfully.');

    } catch (err) {
        console.error('Processing/RCON Error:', err.message);
        res.status(500).end('Internal Server Error while processing RCON.');
    }
};