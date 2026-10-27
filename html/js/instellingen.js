// ==========================================
// 1. ZIJBALK & DARK MODE (Standaard functionaliteit)
// ==========================================
const sidebar = document.getElementById('sidebar');
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const closeMobileMenuBtn = document.getElementById('close-mobile-menu');

let sidebarOverlay = document.getElementById('sidebar-overlay');
if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
}

function openMobielMenu() {
    sidebar.classList.add('mobile-open');
    sidebarOverlay.classList.add('active');
}

function sluitMobielMenu() {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
}

if (menuBar) {
    menuBar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('mobile-open')) sluitMobielMenu();
        else openMobielMenu();
    });
}
if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', sluitMobielMenu);
sidebarOverlay.addEventListener('click', sluitMobielMenu);

const switchMode = document.getElementById('switch-mode');
function syncThemaMetOpslag() {
    const isDark = localStorage.getItem('dark-mode') !== 'disabled';
    if (switchMode) switchMode.checked = isDark;
    document.body.classList.toggle('dark', isDark);
}
syncThemaMetOpslag();

if (switchMode) {
    switchMode.addEventListener('change', function () {
        if (this.checked) {
            document.body.classList.add('dark');
            localStorage.setItem('dark-mode', 'enabled');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('dark-mode', 'disabled');
        }
    });
}

// ==========================================
// 2. INSTELLINGEN LOGICA & OPSLAAN
// ==========================================

const elEenheid = document.getElementById('setting-eenheid');
const elFormuleA = document.getElementById('setting-formule-a');
const elFormuleB = document.getElementById('setting-formule-b');
const elLijnEpex = document.getElementById('setting-lijn-epex');
const elLijnOnb15 = document.getElementById('setting-lijn-onb15');
const elLijnOnb1 = document.getElementById('setting-lijn-onb1');
const btnSave = document.getElementById('btn-save-settings');

function laadHuidigeInstellingen() {
    elEenheid.value = localStorage.getItem('pref_eenheid') || 'MWh';
    elFormuleA.value = localStorage.getItem('pref_formule_a') || ''; 
    elFormuleB.value = localStorage.getItem('pref_formule_b') || ''; 
    
    // Lees schakelaars (standaard: EPEX = aan, Onb15 = aan, Onb1 = uit)
    elLijnEpex.checked = localStorage.getItem('pref_lijn_epex') !== 'false';
    elLijnOnb15.checked = localStorage.getItem('pref_lijn_onb15') !== 'false';
    elLijnOnb1.checked = localStorage.getItem('pref_lijn_onb1') === 'true';
}

btnSave.addEventListener('click', () => {
    localStorage.setItem('pref_eenheid', elEenheid.value);
    localStorage.setItem('pref_formule_a', elFormuleA.value !== '' ? elFormuleA.value : '');
    localStorage.setItem('pref_formule_b', elFormuleB.value !== '' ? elFormuleB.value : '');
    
    localStorage.setItem('pref_lijn_epex', elLijnEpex.checked ? 'true' : 'false');
    localStorage.setItem('pref_lijn_onb15', elLijnOnb15.checked ? 'true' : 'false');
    localStorage.setItem('pref_lijn_onb1', elLijnOnb1.checked ? 'true' : 'false');

    const origineleTekst = btnSave.innerHTML;
    btnSave.innerHTML = `<i class='bx bx-check'></i> Opgeslagen!`;
    btnSave.style.background = 'var(--green)';
    
    setTimeout(() => {
        btnSave.innerHTML = origineleTekst;
        btnSave.style.background = 'var(--blue)';
    }, 2000);
});

laadHuidigeInstellingen();