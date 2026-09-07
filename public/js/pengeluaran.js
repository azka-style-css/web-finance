async function loadData() {
    const res = await fetch('/pengeluaran');
    const data = await res.json();
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Belum ada data pengeluaran</td></tr>`;
        return;
    }

    data.forEach((row, i) => {
        const tgl = row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : '-';
        const tglDisplay = tgl !== '-'
            ? new Date(row.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
            : '-';
        const ket = (row.keterangan || '').replace(/`/g, "'");
        const itemEsc = (row.item || '').replace(/`/g, "'");

        tbody.innerHTML += `
            <tr id="row-${row.id_pengeluaran}">
                <td class="col-num">${i + 1}</td>
                <td class="col-id">${row.id_pengeluaran}</td>
                <td id="tgl-${row.id_pengeluaran}">${tglDisplay}</td>
                <td id="item-${row.id_pengeluaran}" class="col-item">${row.item}</td>
                <td id="harga-${row.id_pengeluaran}">Rp ${Number(row.harga_item).toLocaleString('id-ID')}</td>
                <td id="jml-${row.id_pengeluaran}" class="col-center">${row.jumlah_item}</td>
                <td id="total-${row.id_pengeluaran}" class="col-total">Rp ${Number(row.total_harga).toLocaleString('id-ID')}</td>
                <td id="ket-${row.id_pengeluaran}" class="col-ket">${row.keterangan || '-'}</td>
                <td class="col-action">
                    <div class="action-btns">
                        <button class="btn-edit btn-sm" onclick="editRow('${row.id_pengeluaran}', '${tgl}', \`${itemEsc}\`, ${row.harga_item}, ${row.jumlah_item}, \`${ket}\`)">Edit</button>
                        <button class="btn-delete btn-sm" onclick="confirmDelete('${row.id_pengeluaran}')">Delete</button>
                    </div>
                </td>
            </tr>`;
    });
}

function editRow(id, tanggal, item, harga, jumlah, keterangan) {
    document.getElementById(`tgl-${id}`).innerHTML =
        `<input type="date" class="inline-input" id="input-tgl-${id}" value="${tanggal}">`;
    document.getElementById(`item-${id}`).innerHTML =
        `<input class="inline-input" id="input-item-${id}" value="${item}">`;
    document.getElementById(`harga-${id}`).innerHTML =
        `<input type="number" class="inline-input" id="input-harga-${id}" value="${harga}" min="1" oninput="updateInlineTotal('${id}')">`;
    document.getElementById(`jml-${id}`).innerHTML =
        `<input type="number" class="inline-input inline-input-sm" id="input-jml-${id}" value="${jumlah}" min="1" oninput="updateInlineTotal('${id}')">`;
    document.getElementById(`total-${id}`).innerHTML =
        `<span id="inline-total-${id}" class="col-total">Rp ${Number(harga * jumlah).toLocaleString('id-ID')}</span>`;
    document.getElementById(`ket-${id}`).innerHTML =
        `<input class="inline-input" id="input-ket-${id}" value="${keterangan}">`;
    document.querySelector(`#row-${id} .col-action`).innerHTML = `
        <div class="action-btns">
            <button class="btn-save btn-sm" onclick="saveRow('${id}')">Save</button>
            <button class="btn-cancel btn-sm" onclick="loadData()">Cancel</button>
        </div>`;
}

function updateInlineTotal(id) {
    const harga  = parseFloat(document.getElementById(`input-harga-${id}`).value) || 0;
    const jumlah = parseFloat(document.getElementById(`input-jml-${id}`).value) || 0;
    document.getElementById(`inline-total-${id}`).textContent =
        `Rp ${(harga * jumlah).toLocaleString('id-ID')}`;
}

async function saveRow(id) {
    const tanggal    = document.getElementById(`input-tgl-${id}`).value;
    const item       = document.getElementById(`input-item-${id}`).value.trim();
    const harga_item  = parseFloat(document.getElementById(`input-harga-${id}`).value);
    const jumlah_item = parseFloat(document.getElementById(`input-jml-${id}`).value);
    const keterangan  = document.getElementById(`input-ket-${id}`).value;

    if (!item)                            return showToast('Item tidak boleh kosong', 'error');
    if (!harga_item  || harga_item  <= 0) return showToast('Unit price harus lebih dari 0', 'error');
    if (!jumlah_item || jumlah_item <= 0) return showToast('Quantity harus lebih dari 0', 'error');

    const total_harga = harga_item * jumlah_item;
    const res = await fetch(`/pengeluaran/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, item, harga_item, jumlah_item, total_harga, keterangan })
    });
    if (res.ok) { showToast('Data berhasil diperbarui', 'success'); loadData(); }
    else showToast('Gagal memperbarui data', 'error');
}

function confirmDelete(id) {
    showConfirm(`Hapus transaksi ${id}?`, () => deleteRow(id));
}

async function deleteRow(id) {
    const res = await fetch(`/pengeluaran/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Data berhasil dihapus', 'success'); loadData(); }
    else showToast('Gagal menghapus data', 'error');
}

function showAddForm() {
    document.getElementById('add-form').classList.remove('hidden');
    document.getElementById('add-tanggal').valueAsDate = new Date();
    clearErrors();
}

function hideAddForm() {
    document.getElementById('add-form').classList.add('hidden');
    clearErrors();
    ['add-tanggal','add-item','add-harga','add-jumlah','add-keterangan']
        .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('total-preview').textContent = 'Total: Rp 0';
}

function clearErrors() {
    ['err-tanggal','err-item','err-harga','err-jumlah'].forEach(id => {
        document.getElementById(id).textContent = '';
    });
    ['add-tanggal','add-item','add-harga','add-jumlah'].forEach(id => {
        document.getElementById(id).classList.remove('input-invalid');
    });
}

function setError(fieldId, errId, msg) {
    document.getElementById(fieldId).classList.add('input-invalid');
    document.getElementById(errId).textContent = msg;
}

function updateTotalPreview() {
    const harga  = parseFloat(document.getElementById('add-harga').value) || 0;
    const jumlah = parseFloat(document.getElementById('add-jumlah').value) || 0;
    document.getElementById('total-preview').textContent =
        `Total: Rp ${(harga * jumlah).toLocaleString('id-ID')}`;
}

async function addData() {
    clearErrors();
    const tanggal    = document.getElementById('add-tanggal').value;
    const item       = document.getElementById('add-item').value.trim();
    const harga_item  = parseFloat(document.getElementById('add-harga').value);
    const jumlah_item = parseFloat(document.getElementById('add-jumlah').value);
    const keterangan  = document.getElementById('add-keterangan').value;
    const total_harga = harga_item * jumlah_item;

    let valid = true;
    if (!tanggal)                         { setError('add-tanggal','err-tanggal','Tanggal wajib diisi'); valid = false; }
    if (!item)                            { setError('add-item','err-item','Item wajib diisi'); valid = false; }
    if (!harga_item  || harga_item  <= 0) { setError('add-harga','err-harga','Harga harus > 0'); valid = false; }
    if (!jumlah_item || jumlah_item <= 0) { setError('add-jumlah','err-jumlah','Quantity harus > 0'); valid = false; }
    if (!valid) return;

    const res = await fetch('/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, item, harga_item, jumlah_item, total_harga, keterangan })
    });
    if (res.ok) { showToast('Data berhasil ditambahkan', 'success'); hideAddForm(); loadData(); }
    else showToast('Gagal menyimpan data', 'error');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-harga').addEventListener('input', updateTotalPreview);
    document.getElementById('add-jumlah').addEventListener('input', updateTotalPreview);
    loadData();
});