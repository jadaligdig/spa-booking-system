// Navigation and authentication helpers

const PAGES = [
    ['customers.html', 'Customers'],
    ['branches.html', 'Branches'],
    ['services.html', 'Services'],
    ['availability.html', 'Availability'],
    ['alerts.html', 'Alerts & Audit'],
    ['reports.html', 'Reports']
];

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

function requireLogin() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

function renderNav() {
    const nav = document.getElementById('nav') ||
        document.getElementById('nav-container');

    if (!nav) return;

    const user = getUser();

    const links = PAGES.map(([href, label]) =>
        `<a href="/${href}">${label}</a>`
    ).join('');

    nav.innerHTML = `
        <strong>SPA Booking</strong>
        ${links}
        <span class="spacer"></span>
        <span>${user ? user.full_name + ' (' + user.role + ')' : ''}</span>
        <a href="#" id="logoutBtn">Logout</a>
    `;

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

function setLoading(isLoading) {
    document.getElementById('loading')
        ?.classList.toggle('on', isLoading);
}

function clearMsg() {
    const msg = document.getElementById('msg');
    if (msg) msg.className = 'msg';
}

function showMsg(message, type = 'error', errors = []) {
    const msg = document.getElementById('msg');
    if (!msg) return;

    msg.className = 'msg ' + type;
    msg.textContent = message +
        (errors.length ? ' - ' + errors.join('; ') : '');
}