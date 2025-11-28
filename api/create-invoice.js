// /api/create-invoice.js

// (1) Import Xendit SDK
const Xendit = require('xendit-node');

// (2) SETUP RAHASIA: Ambil Secret Key dari Environment Variable (Harus di-set di Vercel nanti!)
const x = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY }); 
const { Invoice } = x;
const invoiceSpecificOptions = {};

module.exports = async (req, res) => {
    // Hanya proses request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { ign, rank, price } = req.body;

    if (!ign || !rank || !price) {
        return res.status(400).json({ error: 'Data tidak lengkap. IGN/Rank/Harga hilang.' });
    }

    try {
        const externalId = `NN-${rank}-${Date.now()}-${ign.toUpperCase()}`;
        const amountInIDR = price; 

        const invoice = await Invoice.createInvoice(invoiceSpecificOptions, {
            externalId: externalId,
            amount: amountInIDR,
            payerEmail: 'arlieztopia@gmail.com', // Ganti dengan emailmu
            description: `Pembelian Rank ${rank} untuk IGN: ${ign}`,
            
            // (3) METADATA: Data penting yang akan dibaca Webhook (File selanjutnya)
            metadata: {
                player_ign: ign,
                rank_name: rank
            },
            
            // (4) CALLBACK URL: Link ke file API kita yang satunya!
            callbackVirtualAccount: `${req.headers.origin}/api/xendit-webhook`,
            
            paymentMethods: ['QRIS', 'ID_OVO', 'BCA', 'BRI', 'PERMATA'], 
        });

        // (5) Kirim link pembayaran kembali ke JavaScript di index.html
        res.status(200).json({ invoice_url: invoice.invoice_url });

    } catch (error) {
        console.error('Xendit Error:', error.message);
        res.status(500).json({ error: 'Gagal membuat invoice di Xendit. Cek API Key.' });
    }
};