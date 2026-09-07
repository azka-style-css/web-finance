function showToast(msg, type = 'success') {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = `app-toast app-toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function showConfirm(msg, onOk) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast app-toast-confirm';
    toast.setAttribute('role', 'alertdialog');
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

function closeConfirm() {
    const toast = document.getElementById('app-toast');
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
    window._confirmCallback = null;
}

function handleConfirmOk() {
    const callback = window._confirmCallback;
    closeConfirm();
    if (callback) callback();
}

function handleConfirmCancel() {
    closeConfirm();
}
