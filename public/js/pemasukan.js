async function loadData() {
    const res = await fetch('/pemasukan');
    const data = await res.json();
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tgl = row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : '';
        tbody.innerHTML += `
            <tr>
                <td>${row.id_pemasukan}</td>
                <td>${tgl}</td>
                <td>Rp ${Number(row.nominal).toLocaleString('id-ID')}</td>
                <td class="wrap-text">${row.keterangan || '-'}</td>
            </tr>`;
    });
}

async function showAddForm() {
    document.getElementById('add-form').classList.remove('hidden');
    const res = await fetch('/pemasukan/next-id');
    const result = await res.json();
    document.getElementById('add-id').value = result.id;
}

function hideAddForm() {
    document.getElementById('add-form').classList.add('hidden');
}

async function addData() {
    const id_pemasukan = document.getElementById('add-id').value;
    const tanggal = document.getElementById('add-tanggal').value;
    const nominal = document.getElementById('add-nominal').value;
    const keterangan = document.getElementById('add-keterangan').value;

    if (!tanggal || !nominal) {
        alert('Please fill in date and amount');
        return;
    }

    await fetch('/pemasukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pemasukan, tanggal, nominal, keterangan })
    });

    document.getElementById('add-tanggal').value = '';
    document.getElementById('add-nominal').value = '';
    document.getElementById('add-keterangan').value = '';
    hideAddForm();
    loadData();
}

loadData();