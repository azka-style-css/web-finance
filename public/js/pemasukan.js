async function loadData() {
    const res = await fetch('/pemasukan');
    const data = await res.json();
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada data pemasukan</td></tr>`;
        return;
    }

    data.forEach((row, i) => {
        const tgl = row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : '-';
        const tglDisplay = tgl !== '-'
            ? new Date(row.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
            : '-';
        const ket = (row.keterangan || '').replace(/`/g, "'");

        tbody.innerHTML += `
            <tr id="row-${row.id_pemasukan}">
                <td class="col-id">${row.id_pemasukan}</td>
                <td id="tgl-${row.id_pemasukan}">${tglDisplay}</td>
                <td id="nominal-${row.id_pemasukan}" class="col-total">Rp ${Number(row.nominal).toLocaleString('id-ID')}</td>
                <td id="ket-${row.id_pemasukan}" class="col-ket">${row.keterangan || '-'}</td>
                <td class="col-action">
                    <div class="action-btns">
                        <button class="btn-edit btn-sm" onclick="editRow('${row.id_pemasukan}', '${tgl}', ${row.nominal}, \`${ket}\`)">Edit</button>
                        <button class="btn-delete btn-sm" onclick="confirmDelete('${row.id_pemasukan}')">Delete</button>
                    </div>
                </td>
            </tr>`;
    });
}

function editRow(id, tanggal, nominal, keterangan) {
    document.getElementById(`tgl-${id}`).innerHTML =
        `<input type="date" class="inline-input" id="input-tgl-${id}" value="${tanggal}">`;
    document.getElementById(`nominal-${id}`).innerHTML =
        `<input type="number" class="inline-input" id="input-nominal-${id}" value="${nominal}" min="1">`;
    document.getElementById(`ket-${id}`).innerHTML =
        `<input class="inline-input" id="input-ket-${id}" value="${keterangan}">`;
    document.querySelector(`#row-${id} .col-action`).innerHTML = `
        <div class="action-btns">
            <button class="btn-save btn-sm" onclick="saveRow('${id}')">Save</button>
            <button class="btn-cancel btn-sm" onclick="loadData()">Cancel</button>
        </div>`;
}

async function saveRow(id) {
    const tanggal    = document.getElementById(`input-tgl-${id}`).value;
    const nominal    = parseFloat(document.getElementById(`input-nominal-${id}`).value);
    const keterangan = document.getElementById(`input-ket-${id}`).value;

    if (!nominal || nominal <= 0) return showToast('Nominal harus lebih dari 0', 'error');

    const res = await fetch(`/pemasukan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, nominal, keterangan })
    });
    if (res.ok) { showToast('Data berhasil diperbarui', 'success'); loadData(); }
    else showToast('Gagal memperbarui data', 'error');
}

function confirmDelete(id) {
    showConfirm(`Hapus transaksi ${id}?`, () => deleteRow(id));
}

async function deleteRow(id) {
    const res = await fetch(`/pemasukan/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Data berhasil dihapus', 'success'); loadData(); }
    else showToast('Gagal menghapus data', 'error');
}

async function showAddForm() {
    document.getElementById('add-form').classList.remove('hidden');
    document.getElementById('add-tanggal').valueAsDate = new Date();
    clearErrors();
    const res = await fetch('/pemasukan/next-id');
    const result = await res.json();
    document.getElementById('add-id').value = result.id;
}

function hideAddForm() {
    document.getElementById('add-form').classList.add('hidden');
    clearErrors();
    ['add-tanggal','add-nominal','add-keterangan'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function clearErrors() {
    ['err-tanggal','err-nominal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    ['add-tanggal','add-nominal'].forEach(id => {
        document.getElementById(id).classList.remove('input-invalid');
    });
}

function setError(fieldId, errId, msg) {
    document.getElementById(fieldId).classList.add('input-invalid');
    document.getElementById(errId).textContent = msg;
}

async function addData() {
    clearErrors();
    const id_pemasukan = document.getElementById('add-id').value;
    const tanggal      = document.getElementById('add-tanggal').value;
    const nominal      = parseFloat(document.getElementById('add-nominal').value);
    const keterangan   = document.getElementById('add-keterangan').value;

    let valid = true;
    if (!tanggal)                { setError('add-tanggal','err-tanggal','Tanggal wajib diisi'); valid = false; }
    if (!nominal || nominal <= 0){ setError('add-nominal','err-nominal','Nominal harus > 0'); valid = false; }
    if (!valid) return;

    const res = await fetch('/pemasukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pemasukan, tanggal, nominal, keterangan })
    });
    if (res.ok) { showToast('Data berhasil ditambahkan', 'success'); hideAddForm(); loadData(); }
    else showToast('Gagal menyimpan data', 'error');
}

// ── Toast notifikasi ──────────────────────────────────────
function showToast(msg, type = 'success') {
    // Tutup confirm kalau ada
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast app-toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ── Confirm dialog pakai toast ────────────────────────────
function showConfirm(msg, onOk) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast app-toast-confirm';
    toast.innerHTML = `
        <span class="toast-msg">${msg}</span>
        <div class="toast-actions">
            <button class="toast-btn-ok" onclick="handleConfirmOk()">OK</button>
            <button class="toast-btn-cancel" onclick="handleConfirmCancel()">Cancel</button>
        </div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    window._confirmCallback = onOk;
}

function handleConfirmOk() {
    const toast = document.getElementById('app-toast');
    if (toast) { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }
    if (window._confirmCallback) { window._confirmCallback(); window._confirmCallback = null; }
}

function handleConfirmCancel() {
    const toast = document.getElementById('app-toast');
    if (toast) { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }
    window._confirmCallback = null;
}

document.addEventListener('DOMContentLoaded', () => { loadData(); });