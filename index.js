const express = require('express');
const app = express();
const db = require('./connect');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/dashboard.html');
});

// DATA KAS - get all data including dynamic month columns
app.get('/data-kas', (req, res) => {
    db.query('SELECT * FROM data_kas ORDER BY absen', (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Add a new month column (e.g. "juli", "august")
app.post('/data-kas/add-column', (req, res) => {
    let { column } = req.body;
    column = column.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!column) return res.status(400).json({ message: 'Invalid column name' });

    db.query(`ALTER TABLE data_kas ADD COLUMN \`${column}\` INT UNSIGNED DEFAULT 0`, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') return res.status(400).json({ message: 'Column already exists' });
            throw err;
        }
        res.json({ message: 'Column added successfully' });
    });
});

// Update status value for a specific student and month column
app.put('/data-kas/:absen/:column', (req, res) => {
    const { absen, column } = req.params;
    const { value } = req.body;
    const safeColumn = column.replace(/[^a-z0-9_]/g, '');

    db.query(`UPDATE data_kas SET \`${safeColumn}\` = ? WHERE absen = ?`, [value, absen], (err) => {
        if (err) throw err;
        res.json({ message: 'Updated successfully' });
    });
});

// PEMASUKAN
app.get('/pemasukan', (req, res) => {
    db.query('SELECT * FROM pemasukan ORDER BY tanggal DESC', (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.get('/pemasukan/next-id', (req, res) => {
    db.query('SELECT id_pemasukan FROM pemasukan ORDER BY id_pemasukan DESC LIMIT 1', (err, result) => {
        if (err) throw err;
        let nextNum = 1;
        if (result.length > 0) {
            const lastId = result[0].id_pemasukan;
            const lastNum = parseInt(lastId.replace(/\D/g, ''), 10);
            nextNum = lastNum + 1;
        }
        const newId = 'PM' + String(nextNum).padStart(4, '0');
        res.json({ id: newId });
    });
});

app.put('/pemasukan/:id', (req, res) => {
    const { id } = req.params;
    const { tanggal, nominal, keterangan } = req.body;
    db.query('UPDATE pemasukan SET tanggal = ?, nominal = ?, keterangan = ? WHERE id_pemasukan = ?', [tanggal, nominal, keterangan, id], (err) => {
        if (err) throw err;
        res.json({ message: 'Updated successfully' });
    });
});

app.post('/pemasukan', (req, res) => {
    const { id_pemasukan, tanggal, nominal, keterangan } = req.body;
    db.query('INSERT INTO pemasukan (id_pemasukan, tanggal, nominal, keterangan) VALUES (?, ?, ?, ?)', [id_pemasukan, tanggal, nominal, keterangan], (err) => {
        if (err) throw err;
        res.json({ message: 'Added successfully' });
    });
});

// PENGELUARAN
app.get('/pengeluaran', (req, res) => {
    db.query('SELECT * FROM pengeluaran ORDER BY tanggal DESC', (err, result) => {
        if (err) {
            console.error('Gagal mengambil data pengeluaran:', err);
            return res.status(500).json({ message: 'Gagal mengambil data pengeluaran' });
        }
        res.json(result);
    });
});

app.post('/pengeluaran', (req, res) => {
    const { tanggal, item, harga_item, jumlah_item, total_harga, keterangan } = req.body;
    
    // Generate ID otomatis
    db.query('SELECT id_pengeluaran FROM pengeluaran ORDER BY id_pengeluaran DESC LIMIT 1', (err, result) => {
        if (err) throw err;
        let nextNum = 1;
        if (result.length > 0) {
            const lastId = result[0].id_pengeluaran; // e.g. "PG0001"
            const lastNum = parseInt(lastId.replace(/\D/g, ''), 10);
            nextNum = lastNum + 1;
        }
        const id_pengeluaran = 'PG' + String(nextNum).padStart(5, '0');

        db.query(
            'INSERT INTO pengeluaran (id_pengeluaran, tanggal, item, harga_item, jumlah_item, total_harga, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_pengeluaran, tanggal, item, harga_item, jumlah_item, total_harga, keterangan],
            (err) => {
                if (err) throw err;
                res.json({ message: 'Added successfully', id: id_pengeluaran });
            }
        );
    });
});

app.put('/pengeluaran/:id', (req, res) => {
    const { id } = req.params;
    const { tanggal, item, harga_item, jumlah_item, total_harga, keterangan } = req.body;
    db.query('UPDATE pengeluaran SET tanggal = ?, item = ?, harga_item = ?, jumlah_item = ?, total_harga = ?, keterangan = ? WHERE id_pengeluaran = ?', [tanggal, item, harga_item, jumlah_item, total_harga, keterangan, id], (err) => {
        if (err) throw err;
        res.json({ message: 'Updated successfully' });
    });
});

app.post('/pengeluaran', (req, res) => {
    const { id_pengeluaran, tanggal, item, harga_item, jumlah_item, total_harga, keterangan } = req.body;
    db.query('INSERT INTO pengeluaran (id_pengeluaran, tanggal, item, harga_item, jumlah_item, total_harga, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)', [id_pengeluaran, tanggal, item, harga_item, jumlah_item, total_harga, keterangan], (err) => {
        if (err) throw err;
        res.json({ message: 'Added successfully' });
    });
});

app.delete('/pengeluaran/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM pengeluaran WHERE id_pengeluaran = ?', [id], (err) => {
        if (err) {
            console.error('Gagal menghapus data pengeluaran:', err);
            return res.status(500).json({ message: 'Gagal menghapus data' });
        }
        res.json({ message: 'Deleted successfully' });
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});