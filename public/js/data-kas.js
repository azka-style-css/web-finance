const fixedColumns = ['nis', 'absen', 'nama'];
let rawData = [];
let pendingChanges = {};  // key -> nominal (angka)
let openDropdown = null;

async function loadData() {
    const res = await fetch('/data-kas');
    rawData = await res.json();
    pendingChanges = {};
    openDropdown = null;
    renderTable();
    updateSaveBar();
}

function renderTable() {
    if (rawData.length === 0) return;

    const allColumns = Object.keys(rawData[0]);
    const monthColumns = allColumns.filter(c => !fixedColumns.includes(c));

    const theadRow = document.getElementById('thead-row');
    theadRow.innerHTML = '<th>Absent</th><th>NIS</th><th>Name</th>' +
        monthColumns.map(m => `<th>${capitalize(m)}</th>`).join('');

    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    rawData.forEach(row => {
        const cells = monthColumns.map(m => {
            const key = `${row.absen}-${m}`;
            const nominal = pendingChanges[key] !== undefined
                ? pendingChanges[key]
                : (parseInt(row[m]) || 0);
            const isPending = pendingChanges[key] !== undefined;
            const pendingCls = isPending ? 'status-pending' : '';
            const isOpen = openDropdown === key;
            const isY = nominal >= 10000;

            if (isY) {
                return `<td class="status-cell">
                    <div class="status-cell-inner">
                        <button class="status-btn status-y ${pendingCls}"
                            onclick="setNominal(${row.absen}, '${m}', 0)">Y</button>
                    </div>
                </td>`;
            } else {
                const nominalLabel = (nominal > 0 && nominal < 10000)
                    ? `<span class="nominal-label">${formatNominal(nominal)}</span>`
                    : '';
                return `<td class="status-cell">
                    <div class="status-cell-inner">
                        <button class="status-btn status-n ${pendingCls}"
                            onclick="setNominal(${row.absen}, '${m}', 10000)">N</button>
                        ${nominalLabel}
                        <button class="dropdown-toggle ${isOpen ? 'active' : ''}"
                            onclick="toggleDropdown(event, '${key}', ${row.absen}, '${m}')">&#9660;</button>
                        ${isOpen ? buildDropdown(key, row.absen, m) : ''}
                    </div>
                </td>`;
            }
        }).join('');

        tbody.innerHTML += `<tr>
            <td>${row.absen}</td>
            <td>${row.nis || '-'}</td>
            <td>${row.nama}</td>
            ${cells}
        </tr>`;
    });
}

function formatNominal(n) {
    if (n <= 0) return '';
    const k = n / 1000;
    return (Number.isInteger(k) ? k : parseFloat(k.toFixed(1))) + 'k';
}
function showNotif(msg) {
    let notif = document.getElementById('notif-toast');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notif-toast';
        document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.classList.add('show');
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => notif.classList.remove('show'), 2500);
}

function buildDropdown(key, absen, month) {
    return `<div class="amount-dropdown">
        <button class="amount-option" onclick="selectAmount(event, ${absen}, '${month}', 5000)">5k</button>
        <div class="amount-custom">
            <input type="number" id="custom-${key}"
                min="0" max="20000" placeholder="0–20000"
                onclick="event.stopPropagation()"
                onkeydown="if(event.key==='Enter') confirmCustom(event, ${absen}, '${month}')">
            <button class="amount-ok" onclick="confirmCustom(event, ${absen}, '${month}')">OK</button>
        </div>
    </div>`;
}

function toggleDropdown(event, key, absen, month) {
    event.stopPropagation();
    openDropdown = openDropdown === key ? null : key;
    renderTable();
}

function selectAmount(event, absen, month, amount) {
    event.stopPropagation();
    setNominal(absen, month, amount);
    openDropdown = null;
    renderTable();
    updateSaveBar();
}

function confirmCustom(event, absen, month) {
    event.stopPropagation();
    const key = `${absen}-${month}`;
    const input = document.getElementById(`custom-${key}`);
    let val = parseInt(input.value, 10);

    // Validasi — ubah batas min/max di sini
    const MIN = 0;
    const MAX = 10000;

    if (isNaN(val) || val < MIN || val > MAX) {
        input.classList.add('input-error');
        input.placeholder = `${MIN}–${MAX}`;
        showNotif(`Nominal harus antara ${MIN} dan ${MAX}`);
        setTimeout(() => input.classList.remove('input-error'), 1500);
        return;
    }

    setNominal(absen, month, val);
    openDropdown = null;
    renderTable();
    updateSaveBar();
}

function setNominal(absen, column, nominal) {
    const key = `${absen}-${column}`;
    pendingChanges[key] = nominal;
    openDropdown = null;
    renderTable();
    updateSaveBar();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateSaveBar() {
    const count = Object.keys(pendingChanges).length;
    const bar = document.getElementById('save-bar');
    const countLabel = document.getElementById('pending-count');
    if (count > 0) {
        bar.classList.remove('hidden');
        countLabel.textContent = `${count} unsaved change${count > 1 ? 's' : ''}`;
    } else {
        bar.classList.add('hidden');
    }
}

async function saveChanges() {
    const keys = Object.keys(pendingChanges);
    for (const key of keys) {
        const lastDash = key.lastIndexOf('-');
        const absen = key.substring(0, lastDash);
        const column = key.substring(lastDash + 1);
        const value = pendingChanges[key]; // angka langsung
        await fetch(`/data-kas/${absen}/${column}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        });
    }
    loadData();
}

function cancelChanges() {
    pendingChanges = {};
    openDropdown = null;
    renderTable();
    updateSaveBar();
}

async function addMonth() {
    const column = document.getElementById('new-month-input').value.trim();
    if (!column) return;
    const res = await fetch('/data-kas/add-column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column })
    });
    const result = await res.json();
    if (!res.ok) {
        alert(result.message);
        return;
    }
    document.getElementById('new-month-input').value = '';
    loadData();
}

document.addEventListener('click', () => {
    if (openDropdown !== null) {
        openDropdown = null;
        renderTable();
    }
});

loadData();