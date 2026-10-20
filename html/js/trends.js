// ==========================================
// 1. ZIJBALK, DROPDOWN & DARK MODE LOGICA
// ==========================================
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top > li > a:not(.dropdown-btn)');
allSideMenu.forEach(item => {
    const li = item.parentElement;
    item.addEventListener('click', function () {
        allSideMenu.forEach(i => i.parentElement.classList.remove('active'));
        li.classList.add('active');
    });
});

// Dropdown functionaliteit: ENKEL open/dicht klappen, niet selecteren!
const allDropdowns = document.querySelectorAll('#sidebar .dropdown-btn');
allDropdowns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault(); 
        const parentLi = this.parentElement;
        parentLi.classList.toggle('show-menu');
    });
});

const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');
menuBar.addEventListener('click', () => {
    sidebar.classList.toggle('hide');
    // Sluit alle dropdowns als de zijbalk krimpt
    if (sidebar.classList.contains('hide')) {
        document.querySelectorAll('#sidebar .side-menu li.dropdown').forEach(li => li.classList.remove('show-menu'));
    }
});

const switchMode = document.getElementById('switch-mode');
if (localStorage.getItem('dark-mode') === 'disabled') {
    document.body.classList.remove('dark');
    switchMode.checked = false;
} else {
    document.body.classList.add('dark');
    switchMode.checked = true;
}

switchMode.addEventListener('change', function () {
    if (this.checked) {
        document.body.classList.add('dark');
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('dark-mode', 'disabled');
    }
});