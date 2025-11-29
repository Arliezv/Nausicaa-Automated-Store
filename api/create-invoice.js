// /api/create-invoice.js

// (1) Import Xendit SDK
const { Xendit } = require('xendit-node');

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

        // INI ADALAH PANGGILAN FUNGSI YANG BENAR
        const invoice = await Invoice.createInvoice({ // HANYA SATU OBJEK INI { ... }
            externalId: externalId,
            amount: amountInIDR,
            payerEmail: 'arlieztopia@gmail.com', // PASTIKAN SUDAH GANTI DENGAN EMAIL KAMU YG AKTIF!
            description: `Pembelian Rank ${rank} untuk IGN: ${ign}`,
            
            // (3) METADATA
            metadata: {
                player_ign: ign,
                rank_name: rank
            },
            
            // (4) CALLBACK URL
            callbackVirtualAccount: `${req.headers.origin}/api/xendit-webhook`,
            
            paymentMethods: ['QRIS', 'ID_OVO', 'BCA', 'BRI', 'PERMATA'], 
        });

        // (5) Kirim link pembayaran kembali ke JavaScript di index.html
        res.status(200).json({ invoice_url: invoice.invoice_url });

    } catch (error) {
        // Ini adalah cara untuk menampilkan pesan error Xendit di log Vercel
        console.error('Xendit Error:', error.message); 
        res.status(500).json({ message: 'Gagal membuat invoice: ' + error.message });
    }
};