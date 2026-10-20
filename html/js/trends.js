// ==========================================
// 1. ZIJBALK & DARK MODE LOGICA
// ==========================================
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
allSideMenu.forEach(item => {
    const li = item.parentElement;
    item.addEventListener('click', function () {
        allSideMenu.forEach(i => i.parentElement.classList.remove('active'));
        li.classList.add('active');
    });
});

const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');
menuBar.addEventListener('click', () => sidebar.classList.toggle('hide'));

// Lees de opgeslagen status uit (zodat hij niet ineens wit is als je van pagina wisselt)
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

// Hieronder gaan we in de volgende stappen de Trends-grafieken bouwen!