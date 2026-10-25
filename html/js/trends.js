// ==========================================
// 1. ZIJBALK (MOBIEL OVERLAY + KRUISJE), DROPDOWN & DARK MODE
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
        if (sidebar.classList.contains('mobile-open')) {
            sluitMobielMenu();
        } else {
            openMobielMenu();
        }
    });
}

if (closeMobileMenuBtn) closeMobileMenuBtn.addEventListener('click', sluitMobielMenu);
sidebarOverlay.addEventListener('click', sluitMobielMenu);
sidebarOverlay.addEventListener('touchstart', sluitMobielMenu, { passive: true });

const allSideMenu = document.querySelectorAll('#sidebar .side-menu a:not(.dropdown-btn)');
allSideMenu.forEach(item => {
    item.addEventListener('click', function () {
        sluitMobielMenu();
    });
});

const allDropdowns = document.querySelectorAll('#sidebar .dropdown-btn');
allDropdowns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault(); 
        const parentLi = this.parentElement;
        parentLi.classList.toggle('show-menu');
    });
});

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
        herberekenGrafiekHoogte();
    });
}

window.addEventListener('pageshow', () => {
    syncThemaMetOpslag();
    herberekenGrafiekHoogte();
});

// ==========================================
// 2. SUB-TABS WISSELEN BINNEN TRENDS.HTML
// ==========================================
const subTabLinks = document.querySelectorAll('.sub-tab-link');
const viewKwartier = document.getElementById('view-kwartier');
const viewMaand = document.getElementById('view-maand');
const viewSeizoen = document.getElementById('view-seizoen');
const viewJaar = document.getElementById('view-jaar');

const kalenderPeriodeSectie = document.getElementById('periode-kalender-sectie');
const kalenderMaandSectie = document.getElementById('maand-kalender-sectie');
const kalenderJaarSectie = document.getElementById('jaar-kalender-sectie');

function openTab(tabNaam) {
    subTabLinks.forEach(l => l.classList.remove('active-sub'));
    const targetLink = document.querySelector(`.sub-tab-link[data-tab="${tabNaam}"]`);
    if (targetLink) targetLink.classList.add('active-sub');

    if (viewKwartier) viewKwartier.style.display = 'none';
    if (viewMaand) viewMaand.style.display = 'none';
    if (viewSeizoen) viewSeizoen.style.display = 'none';
    if (viewJaar) viewJaar.style.display = 'none';
    
    if (kalenderPeriodeSectie) kalenderPeriodeSectie.style.display = 'none';
    if (kalenderMaandSectie) kalenderMaandSectie.style.display = 'none';
    if (kalenderJaarSectie) kalenderJaarSectie.style.display = 'none';

    if (tabNaam === 'kwartier') {
        if (viewKwartier) viewKwartier.style.display = 'flex';
        if (kalenderPeriodeSectie) kalenderPeriodeSectie.style.display = 'block';
        laadKwartierProfielData();
    } else if (tabNaam === 'maand') {
        if (viewMaand) viewMaand.style.display = 'flex';
        if (kalenderMaandSectie) kalenderMaandSectie.style.display = 'block';
        bouwZijbalkMaandKalender();
        laadMaandOverzicht();
    } else if (tabNaam === 'seizoen') {
        if (viewSeizoen) viewSeizoen.style.display = 'flex';
        initSeizoenJaarChecks();
        laadSeizoensProfiel();
    } else if (tabNaam === 'jaar') {
        if (viewJaar) viewJaar.style.display = 'flex';
        if (kalenderJaarSectie) kalenderJaarSectie.style.display = 'block';
        bouwZijbalkJaarKalender();
        laadJaarOverzicht();
    }
    herberekenGrafiekHoogte();
}

subTabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const gekozenTab = this.getAttribute('data-tab');
        openTab(gekozenTab);
        window.history.pushState({}, '', `trends.html?tab=${gekozenTab}`);
        sluitMobielMenu();
    });
});

document.addEventListener("DOMContentLoaded", () => {
    initUitklapbareStatistieken();
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || 'kwartier';
    if (viewKwartier) {
        openTab(tabParam);
    }
});

// ==========================================
// 3. PERIODE KALENDER (Start- & Einddatum selecteren)
// ==========================================
let eindDatum = new Date();
eindDatum.setHours(0, 0, 0, 0);

let startDatum = new Date(eindDatum);
startDatum.setDate(eindDatum.getDate() - 7);

let kalenderMaandDatum = new Date(eindDatum.getFullYear(), eindDatum.getMonth(), 1);
let wachtOpTweedeKlik = false;

function isZelfdeDag(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function formatteerTitelDatum(datum) {
    const d = datum.getDate().toString().padStart(2, '0');
    const m = (datum.getMonth() + 1).toString().padStart(2, '0');
    const y = datum.getFullYear();
    return `${d}/${m}/${y}`;
}

function formatteerApiDatum(datum) {
    const d = datum.getDate().toString().padStart(2, '0');
    const m = (datum.getMonth() + 1).toString().padStart(2, '0');
    const y = datum.getFullYear();
    return `${y}-${m}-${d}`;
}

function klikOpKalenderDag(geklikteDatum) {
    const d = new Date(geklikteDatum);
    d.setHours(0, 0, 0, 0);

    if (!wachtOpTweedeKlik) {
        startDatum = d;
        eindDatum = d;
        wachtOpTweedeKlik = true;
        bouwPeriodeKalender(kalenderMaandDatum);
    } else {
        if (d < startDatum) {
            eindDatum = startDatum;
            startDatum = d;
        } else {
            eindDatum = d;
        }
        wachtOpTweedeKlik = false;
        bouwPeriodeKalender(kalenderMaandDatum);
        laadKwartierProfielData();
        sluitMobielMenu();
    }
}

function bouwPeriodeKalender(datum) {
    const elMaand = document.getElementById('kalender-maand');
    const dagenContainer = document.getElementById('kalender-dagen');
    if (!elMaand || !dagenContainer) return;

    const maandNamen = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    elMaand.innerText = `${maandNamen[datum.getMonth()]} ${datum.getFullYear()}`;
    dagenContainer.innerHTML = "";

    const eersteDag = new Date(datum.getFullYear(), datum.getMonth(), 1).getDay();
    const startOffset = (eersteDag === 0 ? 6 : eersteDag - 1);
    const aantalDagen = new Date(datum.getFullYear(), datum.getMonth() + 1, 0).getDate();
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);

    for (let i = 0; i < startOffset; i++) {
        dagenContainer.innerHTML += `<div></div>`;
    }

    for (let d = 1; d <= aantalDagen; d++) {
        const celDatum = new Date(datum.getFullYear(), datum.getMonth(), d);
        celDatum.setHours(0, 0, 0, 0);

        let classes = "cal-day";
        const isStart = isZelfdeDag(celDatum, startDatum);
        const isEnd = isZelfdeDag(celDatum, eindDatum);

        if (isStart) classes += " range-start";
        if (isEnd) classes += " range-end";
        if (celDatum > startDatum && celDatum < eindDatum) classes += " in-range";
        if (isZelfdeDag(celDatum, vandaag) && !isStart && !isEnd) classes += " today";

        const dagDiv = document.createElement('div');
        dagDiv.className = classes;
        dagDiv.innerText = d;
        dagDiv.addEventListener('click', () => klikOpKalenderDag(celDatum));
        dagenContainer.appendChild(dagDiv);
    }
}

const kalPrev = document.getElementById('kalender-prev');
const kalNext = document.getElementById('kalender-next');
if (kalPrev) {
    kalPrev.addEventListener('click', () => {
        kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() - 1);
        bouwPeriodeKalender(kalenderMaandDatum);
    });
}
if (kalNext) {
    kalNext.addEventListener('click', () => {
        kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() + 1);
        bouwPeriodeKalender(kalenderMaandDatum);
    });
}

// ==========================================
// 4. LEGENDA KNOPPEN (Onbalans 1m standaard UIT op index 2)
// ==========================================
let datasetZichtbaar = [true, true, false, true, true];

document.querySelectorAll('#profiel-legend .legend-item').forEach(item => {
    item.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-dataset'));
        datasetZichtbaar[index] = !datasetZichtbaar[index];
        this.classList.toggle('hidden-dataset', !datasetZichtbaar[index]);
        if (profielGrafiek) {
            profielGrafiek.setDatasetVisibility(index, datasetZichtbaar[index]);
            profielGrafiek.update();
        }
    });
});

// ==========================================
// 5. KWARTIER-SNAPPER (Muis én Touch) & KLEURFUNCTIE
// ==========================================
function berekenTouchOfMuisX(chart, e) {
    if (typeof e.x === 'number' && !isNaN(e.x)) return e.x;
    const rect = chart.canvas.getBoundingClientRect();
    const native = e.native;
    if (native) {
        if (native.touches && native.touches.length > 0) {
            return native.touches[0].clientX - rect.left;
        }
        if (native.changedTouches && native.changedTouches.length > 0) {
            return native.changedTouches[0].clientX - rect.left;
        }
        if (typeof native.clientX === 'number') {
            return native.clientX - rect.left;
        }
    }
    return null;
}

if (typeof Chart !== 'undefined') {
    Chart.Interaction.modes.kwartierSnapProfiel = function(chart, e) {
        const xAxis = chart.scales.x;
        const xPixel = berekenTouchOfMuisX(chart, e);
        if (xPixel === null) return [];

        let rawIndex = xAxis.getValueForPixel(xPixel);
        if (rawIndex === undefined || rawIndex === null || isNaN(rawIndex)) return [];
        
        rawIndex = Math.max(0, Math.min(chart.data.labels.length - 1, Math.round(rawIndex)));

        let targetIndex = rawIndex;
        if (chart.data.labels.length > 200) {
            const minuutActief = chart.isDatasetVisible(2);
            targetIndex = minuutActief ? rawIndex : Math.round(rawIndex / 15) * 15;
            targetIndex = Math.min(chart.data.labels.length - 1, targetIndex);
        }

        const items = [];
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (!chart.isDatasetVisible(datasetIndex)) return;

            const meta = chart.getDatasetMeta(datasetIndex);
            const element = meta.data[targetIndex];
            const waarde = dataset.data[targetIndex];

            if (element && waarde !== null && waarde !== undefined) {
                items.push({ element, datasetIndex, index: targetIndex });
            }
        });
        return items;
    };
}

function bepaalPrijsKleur(prijs) {
    if (prijs < 0) return '#10b981';
    if (prijs < 50) return '#84cc16';
    if (prijs < 100) return '#8b9bb4';
    if (prijs < 175) return '#f87171';
    return '#ef4444';
}

// ==========================================
// 6. DATA OPHALEN & KWARTIERPROFIEL TEKENEN
// ==========================================
let profielGrafiek = null;

async function laadKwartierProfielData() {
    const titelEl = document.getElementById('profiel-titel');
    if (!titelEl) return;

    try {
        titelEl.innerText = `Kwartierprofielen (${formatteerTitelDatum(startDatum)} tot ${formatteerTitelDatum(eindDatum)})`;

        const startStr = formatteerApiDatum(startDatum);
        const eindStr = formatteerApiDatum(eindDatum);
        const url = `/api/kwartierprofiel?start=${startStr}&eind=${eindStr}&_t=${Date.now()}`;

        const response = await fetch(url);
        const data = await response.json();

        const heeftData = data && data.some(d => d.epex_gem !== null || d.onb15_gem !== null);
        if (!heeftData) {
            document.getElementById('profiel-gem').innerText = "Geen data";
            document.getElementById('profiel-min').innerText = "Geen data";
            document.getElementById('profiel-max').innerText = "Geen data";
            if (profielGrafiek) {
                profielGrafiek.destroy();
                profielGrafiek = null;
            }
            return;
        }

        let som = 0;
        let aantalKwartieren = 0;
        let goedkoopsteGem = Infinity, goedkoopsteTijd = "--:--";
        let duursteGem = -Infinity, duursteTijd = "--:--";

        let labelsTijd = [];
        let dataEpexGem = [];
        let dataOnb15Gem = [];
        let dataOnb1Gem = [];
        let dataEpexMin = [];
        let dataEpexMax = [];

        data.forEach(item => {
            const t = item.tijdstip;
            labelsTijd.push(t);

            dataEpexGem.push(item.epex_gem);
            dataOnb15Gem.push(item.onb15_gem);
            dataOnb1Gem.push(item.onb1_gem);
            dataEpexMin.push(item.epex_min);
            dataEpexMax.push(item.epex_max);

            const isKwartier = (t.endsWith(':00') || t.endsWith(':15') || t.endsWith(':30') || t.endsWith(':45'));
            if (isKwartier && item.epex_gem !== null && !isNaN(item.epex_gem)) {
                const val = Number(item.epex_gem);
                som += val;
                aantalKwartieren++;
                if (val < goedkoopsteGem) { goedkoopsteGem = val; goedkoopsteTijd = t; }
                if (val > duursteGem) { duursteGem = val; duursteTijd = t; }
            }
        });

        const periodeGem = aantalKwartieren > 0 ? (som / aantalKwartieren) : 0;
        const kleurGem = bepaalPrijsKleur(periodeGem);
        const kleurMin = bepaalPrijsKleur(goedkoopsteGem);
        const kleurMax = bepaalPrijsKleur(duursteGem);

        document.getElementById('profiel-gem').innerHTML = 
            `<span style="color: ${kleurGem};">€ ${periodeGem.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('profiel-min').innerHTML = 
            `<span style="color: var(--dark); font-size: 16px;">${goedkoopsteTijd}</span> <span style="color: ${kleurMin}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('profiel-max').innerHTML = 
            `<span style="color: var(--dark); font-size: 16px;">${duursteTijd}</span> <span style="color: ${kleurMax}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;

        if (profielGrafiek) {
            profielGrafiek.data.labels = labelsTijd;
            profielGrafiek.data.datasets[0].data = dataEpexGem;
            profielGrafiek.data.datasets[1].data = dataOnb15Gem;
            profielGrafiek.data.datasets[2].data = dataOnb1Gem;
            profielGrafiek.data.datasets[3].data = dataEpexMin;
            profielGrafiek.data.datasets[4].data = dataEpexMax;

            datasetZichtbaar.forEach((zichtbaar, idx) => {
                profielGrafiek.setDatasetVisibility(idx, zichtbaar);
            });

            profielGrafiek.update();
            herberekenGrafiekHoogte();
            return;
        }

        const ctx = document.getElementById('profielGrafiek').getContext('2d');
        profielGrafiek = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsTijd,
                datasets: [
                    {
                        label: 'Gem. EPEX',
                        data: dataEpexGem,
                        borderColor: '#438ce6',
                        backgroundColor: 'rgba(67, 140, 230, 0.15)',
                        borderWidth: 2,
                        stepped: true,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        hidden: !datasetZichtbaar[0]
                    },
                    {
                        label: 'Gem. Onbalans (15m)',
                        data: dataOnb15Gem,
                        borderColor: '#f97316',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        hidden: !datasetZichtbaar[1]
                    },
                    {
                        label: 'Gem. Onbalans (1m)',
                        data: dataOnb1Gem,
                        borderColor: '#a855f7',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        hidden: !datasetZichtbaar[2]
                    },
                    {
                        label: 'Min EPEX',
                        data: dataEpexMin,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderDash: [4, 4],
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        hidden: !datasetZichtbaar[3]
                    },
                    {
                        label: 'Max EPEX',
                        data: dataEpexMax,
                        borderColor: '#ef4444',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderDash: [4, 4],
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        hidden: !datasetZichtbaar[4]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 4, right: 6, bottom: 8, left: 0 }
                },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
                animation: {
                    duration: 250,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'kwartierSnapProfiel',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4',
                            autoSkip: false,
                            maxRotation: 0,
                            padding: 4,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                if (!label || !label.endsWith(':00')) return '';
                                const uur = parseInt(label.split(':')[0], 10);
                                if (window.innerWidth <= 768) {
                                    return (uur % 3 === 0) ? label : '';
                                }
                                if (window.innerWidth <= 1150) {
                                    return (uur % 2 === 0) ? label : '';
                                }
                                return label;
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 255, 255, 0.25)'; 
                                }
                                return 'rgba(139, 155, 180, 0.08)';
                            }
                        },
                        ticks: { color: '#8b9bb4' },
                        title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnapProfiel',
                        intersect: false,
                        animation: {
                            duration: 150,
                            easing: 'easeOutCubic'
                        },
                        callbacks: {
                            label: function(context) {
                                const naam = context.dataset.label || '';
                                const waarde = context.parsed.y;
                                if (waarde === null || waarde === undefined) return null;
                                return ` ${naam}: € ${Math.round(waarde)} /MWh`;
                            }
                        }
                    }
                }
            }
        });

        herberekenGrafiekHoogte();
    } catch (error) {
        console.error("Fout bij ophalen van kwartierprofiel:", error);
    }
}

// ==========================================
// 7. MAANDOVERZICHT LOGICA & ZIJBALK MAAND-KALENDER
// ==========================================
let actieveMaandDatum = new Date();
let maandKalenderJaar = actieveMaandDatum.getFullYear();
let maandGrafiek = null;
let datasetZichtbaarMaand = [true, true, false, true, true];

const maandNamenKort = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const maandNamenVol = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function bouwZijbalkMaandKalender() {
    const labelEl = document.getElementById('mk-year-label');
    const grid = document.getElementById('mk-maanden-grid');
    if (!labelEl || !grid) return;

    labelEl.innerText = maandKalenderJaar;
    grid.innerHTML = '';

    for (let m = 0; m < 12; m++) {
        const btn = document.createElement('div');
        btn.className = 'cal-item-btn';
        if (maandKalenderJaar === actieveMaandDatum.getFullYear() && m === actieveMaandDatum.getMonth()) {
            btn.classList.add('active');
        }
        btn.innerText = maandNamenKort[m];
        btn.addEventListener('click', () => {
            actieveMaandDatum.setFullYear(maandKalenderJaar);
            actieveMaandDatum.setMonth(m);
            bouwZijbalkMaandKalender();
            laadMaandOverzicht();
            sluitMobielMenu();
        });
        grid.appendChild(btn);
    }
}

const mkPrev = document.getElementById('mk-prev-year');
const mkNext = document.getElementById('mk-next-year');
if (mkPrev) mkPrev.addEventListener('click', () => { maandKalenderJaar--; bouwZijbalkMaandKalender(); });
if (mkNext) mkNext.addEventListener('click', () => { maandKalenderJaar++; bouwZijbalkMaandKalender(); });

const btnPrevMaand = document.getElementById('btn-prev-maand');
const btnNextMaand = document.getElementById('btn-next-maand');
const btnMaandSel = document.getElementById('btn-maand-selector');

if (btnPrevMaand) {
    btnPrevMaand.addEventListener('click', () => {
        actieveMaandDatum.setMonth(actieveMaandDatum.getMonth() - 1);
        maandKalenderJaar = actieveMaandDatum.getFullYear();
        bouwZijbalkMaandKalender();
        laadMaandOverzicht();
    });
}
if (btnNextMaand) {
    btnNextMaand.addEventListener('click', () => {
        actieveMaandDatum.setMonth(actieveMaandDatum.getMonth() + 1);
        maandKalenderJaar = actieveMaandDatum.getFullYear();
        bouwZijbalkMaandKalender();
        laadMaandOverzicht();
    });
}
if (btnMaandSel) {
    btnMaandSel.addEventListener('click', () => {
        actieveMaandDatum = new Date();
        maandKalenderJaar = actieveMaandDatum.getFullYear();
        bouwZijbalkMaandKalender();
        laadMaandOverzicht();
    });
}

document.querySelectorAll('#maand-legend .legend-item').forEach(item => {
    item.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-dataset'));
        datasetZichtbaarMaand[index] = !datasetZichtbaarMaand[index];
        this.classList.toggle('hidden-dataset', !datasetZichtbaarMaand[index]);
        if (maandGrafiek) {
            maandGrafiek.setDatasetVisibility(index, datasetZichtbaarMaand[index]);
            maandGrafiek.update();
        }
    });
});

async function laadMaandOverzicht() {
    const jaar = actieveMaandDatum.getFullYear();
    const maand = actieveMaandDatum.getMonth() + 1;
    const maandNaamVol = maandNamenVol[maand - 1];

    document.getElementById('maand-titel').innerText = `Maandoverzicht (${maandNaamVol} ${jaar})`;

    try {
        const url = `/api/maandoverzicht?jaar=${jaar}&maand=${maand}&_t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        const heeftData = data && data.some(d => d.epex_gem !== null);

        if (!heeftData) {
            document.getElementById('maand-stat-gem').innerText = "Geen data";
            document.getElementById('maand-stat-min').innerText = "Geen data";
            document.getElementById('maand-stat-max').innerText = "Geen data";
            if (maandGrafiek) { maandGrafiek.destroy(); maandGrafiek = null; }
            return;
        }

        let som = 0, aantalDagen = 0;
        let goedkoopsteGem = Infinity, goedkoopsteDag = "--";
        let duursteGem = -Infinity, duursteDag = "--";

        let labelsDag = [], dataEpexGem = [], dataOnb15Gem = [], dataOnb1Gem = [], dataEpexMin = [], dataEpexMax = [];

        data.forEach(item => {
            labelsDag.push(`${item.dag} ${maandNaamVol.substring(0, 3)}`);
            dataEpexGem.push(item.epex_gem);
            dataOnb15Gem.push(item.onb15_gem);
            dataOnb1Gem.push(item.onb1_gem);
            dataEpexMin.push(item.epex_min);
            dataEpexMax.push(item.epex_max);

            if (item.epex_gem !== null && !isNaN(item.epex_gem)) {
                som += item.epex_gem;
                aantalDagen++;
                if (item.epex_gem < goedkoopsteGem) { goedkoopsteGem = item.epex_gem; goedkoopsteDag = item.dag; }
                if (item.epex_gem > duursteGem) { duursteGem = item.epex_gem; duursteDag = item.dag; }
            }
        });

        const maandGem = aantalDagen > 0 ? (som / aantalDagen) : 0;

        document.getElementById('maand-stat-gem').innerHTML = `<span style="color: ${bepaalPrijsKleur(maandGem)};">€ ${maandGem.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('maand-stat-min').innerHTML = `<span style="color: var(--dark); font-size: 16px;">${goedkoopsteDag} ${maandNaamVol}</span> <span style="color: ${bepaalPrijsKleur(goedkoopsteGem)}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('maand-stat-max').innerHTML = `<span style="color: var(--dark); font-size: 16px;">${duursteDag} ${maandNaamVol}</span> <span style="color: ${bepaalPrijsKleur(duursteGem)}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;
        
        if (maandGrafiek) {
            maandGrafiek.data.labels = labelsDag;
            maandGrafiek.data.datasets[0].data = dataEpexGem;
            maandGrafiek.data.datasets[1].data = dataOnb15Gem;
            maandGrafiek.data.datasets[2].data = dataOnb1Gem;
            maandGrafiek.data.datasets[3].data = dataEpexMin;
            maandGrafiek.data.datasets[4].data = dataEpexMax;
            datasetZichtbaarMaand.forEach((zichtbaar, idx) => { maandGrafiek.setDatasetVisibility(idx, zichtbaar); });
            maandGrafiek.update();
            herberekenGrafiekHoogte();
            return;
        }

        const ctx = document.getElementById('maandGrafiek').getContext('2d');
        maandGrafiek = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsDag,
                datasets: [
                    { type: 'bar', label: 'Gem. EPEX', data: dataEpexGem, backgroundColor: 'rgba(67, 140, 230, 0.75)', borderColor: '#438ce6', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[0] },
                    { type: 'bar', label: 'Gem. Onbalans (15m)', data: dataOnb15Gem, backgroundColor: 'rgba(249, 115, 22, 0.65)', borderColor: '#f97316', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[1] },
                    { type: 'bar', label: 'Gem. Onbalans (1m)', data: dataOnb1Gem, backgroundColor: 'rgba(168, 85, 247, 0.65)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[2] },
                    { type: 'line', label: 'Min EPEX', data: dataEpexMin, borderColor: '#10b981', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#10b981', hidden: !datasetZichtbaarMaand[3] },
                    { type: 'line', label: 'Max EPEX', data: dataEpexMax, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', hidden: !datasetZichtbaarMaand[4] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 4, right: 6, bottom: 8, left: 0 }
                },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
                animation: {
                    duration: 250,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'kwartierSnapProfiel',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4',
                            autoSkip: true,
                            maxTicksLimit: window.innerWidth <= 768 ? 8 : 16,
                            maxRotation: 0,
                            padding: 4
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 255, 255, 0.25)'; 
                                }
                                return 'rgba(139, 155, 180, 0.08)';
                            }
                        },
                        ticks: { color: '#8b9bb4' },
                        title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnapProfiel',
                        intersect: false,
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.parsed.y;
                                if (val === null || val === undefined) return null;
                                return ` ${ctx.dataset.label}: € ${Math.round(val)} /MWh`;
                            }
                        }
                    }
                }
            }
        });

        herberekenGrafiekHoogte();
    } catch (error) {
        console.error("Fout bij ophalen van maandoverzicht:", error);
    }
}

// ==========================================
// 8. JAAROVERZICHT LOGICA & ZIJBALK JAAR-KALENDER
// ==========================================
let actiefJaar = new Date().getFullYear();
let jaarGridStart = actiefJaar - 5;
let jaarGrafiek = null;
let datasetZichtbaarJaar = [true, true, false, true, true];

function bouwZijbalkJaarKalender() {
    const eindJaar = jaarGridStart + 11;
    const labelEl = document.getElementById('jk-range-label');
    const grid = document.getElementById('jk-jaren-grid');
    if (!labelEl || !grid) return;

    labelEl.innerText = `${jaarGridStart} - ${eindJaar}`;
    grid.innerHTML = '';

    for (let y = jaarGridStart; y <= eindJaar; y++) {
        const btn = document.createElement('div');
        btn.className = 'cal-item-btn';
        if (y === actiefJaar) btn.classList.add('active');
        btn.innerText = y;
        btn.addEventListener('click', () => {
            actiefJaar = y;
            bouwZijbalkJaarKalender();
            laadJaarOverzicht();
            sluitMobielMenu();
        });
        grid.appendChild(btn);
    }
}

const jkPrev = document.getElementById('jk-prev-range');
const jkNext = document.getElementById('jk-next-range');
if (jkPrev) jkPrev.addEventListener('click', () => { jaarGridStart -= 12; bouwZijbalkJaarKalender(); });
if (jkNext) jkNext.addEventListener('click', () => { jaarGridStart += 12; bouwZijbalkJaarKalender(); });

const btnPrevJaar = document.getElementById('btn-prev-jaar');
const btnNextJaar = document.getElementById('btn-next-jaar');
const btnJaarSel = document.getElementById('btn-jaar-selector');

if (btnPrevJaar) {
    btnPrevJaar.addEventListener('click', () => {
        actiefJaar--;
        if (actiefJaar < jaarGridStart) jaarGridStart -= 12;
        bouwZijbalkJaarKalender();
        laadJaarOverzicht();
    });
}
if (btnNextJaar) {
    btnNextJaar.addEventListener('click', () => {
        actiefJaar++;
        if (actiefJaar > jaarGridStart + 11) jaarGridStart += 12;
        bouwZijbalkJaarKalender();
        laadJaarOverzicht();
    });
}
if (btnJaarSel) {
    btnJaarSel.addEventListener('click', () => {
        actiefJaar = new Date().getFullYear();
        jaarGridStart = actiefJaar - 5;
        bouwZijbalkJaarKalender();
        laadJaarOverzicht();
    });
}

document.querySelectorAll('#jaar-legend .legend-item').forEach(item => {
    item.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-dataset'));
        datasetZichtbaarJaar[index] = !datasetZichtbaarJaar[index];
        this.classList.toggle('hidden-dataset', !datasetZichtbaarJaar[index]);
        if (jaarGrafiek) {
            jaarGrafiek.setDatasetVisibility(index, datasetZichtbaarJaar[index]);
            jaarGrafiek.update();
        }
    });
});

async function laadJaarOverzicht() {
    document.getElementById('jaar-titel').innerText = `Jaaroverzicht (${actiefJaar})`;

    try {
        const url = `/api/jaaroverzicht?jaar=${actiefJaar}&_t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        const heeftData = data && data.some(d => d.epex_gem !== null);

        if (!heeftData) {
            document.getElementById('jaar-stat-gem').innerText = "Geen data";
            document.getElementById('jaar-stat-min').innerText = "Geen data";
            document.getElementById('jaar-stat-max').innerText = "Geen data";
            if (jaarGrafiek) { jaarGrafiek.destroy(); jaarGrafiek = null; }
            return;
        }

        let som = 0, aantalMaanden = 0;
        let goedkoopsteGem = Infinity, goedkoopsteMaandNaam = "--";
        let duursteGem = -Infinity, duursteMaandNaam = "--";

        let labelsMaand = [], dataEpexGem = [], dataOnb15Gem = [], dataOnb1Gem = [], dataEpexMin = [], dataEpexMax = [];

        data.forEach(item => {
            const mIndex = item.maand - 1;
            labelsMaand.push(window.innerWidth <= 768 ? maandNamenKort[mIndex] : maandNamenVol[mIndex]);
            dataEpexGem.push(item.epex_gem);
            dataOnb15Gem.push(item.onb15_gem);
            dataOnb1Gem.push(item.onb1_gem);
            dataEpexMin.push(item.epex_min);
            dataEpexMax.push(item.epex_max);

            if (item.epex_gem !== null && !isNaN(item.epex_gem)) {
                som += item.epex_gem;
                aantalMaanden++;
                if (item.epex_gem < goedkoopsteGem) { goedkoopsteGem = item.epex_gem; goedkoopsteMaandNaam = maandNamenVol[mIndex]; }
                if (item.epex_gem > duursteGem) { duursteGem = item.epex_gem; duursteMaandNaam = maandNamenVol[mIndex]; }
            }
        });

        const jaarGem = aantalMaanden > 0 ? (som / aantalMaanden) : 0;

        document.getElementById('jaar-stat-gem').innerHTML = `<span style="color: ${bepaalPrijsKleur(jaarGem)};">€ ${jaarGem.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('jaar-stat-min').innerHTML = `<span style="color: var(--dark); font-size: 16px;">${goedkoopsteMaandNaam}</span> <span style="color: ${bepaalPrijsKleur(goedkoopsteGem)}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('jaar-stat-max').innerHTML = `<span style="color: var(--dark); font-size: 16px;">${duursteMaandNaam}</span> <span style="color: ${bepaalPrijsKleur(duursteGem)}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;

        if (jaarGrafiek) {
            jaarGrafiek.data.labels = labelsMaand;
            jaarGrafiek.data.datasets[0].data = dataEpexGem;
            jaarGrafiek.data.datasets[1].data = dataOnb15Gem;
            jaarGrafiek.data.datasets[2].data = dataOnb1Gem;
            jaarGrafiek.data.datasets[3].data = dataEpexMin;
            jaarGrafiek.data.datasets[4].data = dataEpexMax;
            datasetZichtbaarJaar.forEach((zichtbaar, idx) => { jaarGrafiek.setDatasetVisibility(idx, zichtbaar); });
            jaarGrafiek.update();
            herberekenGrafiekHoogte();
            return;
        }

        const ctx = document.getElementById('jaarGrafiek').getContext('2d');
        jaarGrafiek = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsMaand,
                datasets: [
                    { type: 'bar', label: 'Gem. EPEX', data: dataEpexGem, backgroundColor: 'rgba(67, 140, 230, 0.75)', borderColor: '#438ce6', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[0] },
                    { type: 'bar', label: 'Gem. Onbalans (15m)', data: dataOnb15Gem, backgroundColor: 'rgba(249, 115, 22, 0.65)', borderColor: '#f97316', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarJaar[1] },
                    { type: 'bar', label: 'Gem. Onbalans (1m)', data: dataOnb1Gem, backgroundColor: 'rgba(168, 85, 247, 0.65)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarJaar[2] },
                    { type: 'line', label: 'Min EPEX', data: dataEpexMin, borderColor: '#10b981', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#10b981', hidden: !datasetZichtbaarJaar[3] },
                    { type: 'line', label: 'Max EPEX', data: dataEpexMax, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', hidden: !datasetZichtbaarJaar[4] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 4, right: 6, bottom: 8, left: 0 }
                },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
                animation: {
                    duration: 250,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'kwartierSnapProfiel',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4',
                            autoSkip: false,
                            maxRotation: 0,
                            padding: 4
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 255, 255, 0.25)'; 
                                }
                                return 'rgba(139, 155, 180, 0.08)';
                            }
                        },
                        ticks: { color: '#8b9bb4' },
                        title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnapProfiel',
                        intersect: false,
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.parsed.y;
                                if (val === null || val === undefined) return null;
                                return ` ${ctx.dataset.label}: € ${Math.round(val)} /MWh`;
                            }
                        }
                    }
                }
            }
        });

        herberekenGrafiekHoogte();
    } catch (error) {
        console.error("Fout bij ophalen van jaaroverzicht:", error);
    }
}

// ==========================================
// 9. SEIZOENSPROFIEL LOGICA & KLEURVERVAGING BIJ VERGELIJKEN
// ==========================================
let seizoenGrafiek = null;
let geselecteerdeSeizoenJaren = [new Date().getFullYear()];
let seizoenChecksGeinit = false;
let verborgenSeizoenLijnen = {};

const SEIZOEN_KLEUREN_RGB = {
    Lente:  [16, 185, 129],
    Zomer:  [234, 179, 8],
    Herfst: [249, 115, 22],
    Winter: [56, 189, 248]
};

function initSeizoenJaarChecks() {
    if (seizoenChecksGeinit) return;
    seizoenChecksGeinit = true;

    const container = document.getElementById('seizoen-jaren-checks');
    if (!container) return;
    container.innerHTML = '';

    const huidigJaar = new Date().getFullYear();
    const beschikbareJaren = [huidigJaar - 1, huidigJaar, huidigJaar + 1];

    beschikbareJaren.forEach(jaar => {
        const label = document.createElement('label');
        label.className = 'seizoen-jaar-check';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = jaar;
        cb.checked = geselecteerdeSeizoenJaren.includes(jaar);

        cb.addEventListener('change', () => {
            const aangevinkt = Array.from(container.querySelectorAll('input:checked')).map(el => parseInt(el.value, 10));
            if (aangevinkt.length === 0) {
                cb.checked = true;
                return;
            }
            geselecteerdeSeizoenJaren = aangevinkt.sort((a, b) => a - b);
            laadSeizoensProfiel();
        });

        label.appendChild(cb);
        label.appendChild(document.createTextNode(jaar));
        container.appendChild(label);
    });
}

async function laadSeizoensProfiel() {
    try {
        const jarenParam = geselecteerdeSeizoenJaren.join(',');
        const url = `/api/seizoensprofiel?jaren=${jarenParam}&_t=${Date.now()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (!result || !result.jaren) return;

        const labelsTijd = result.labels || [];
        const seizoenenVolgorde = ["Lente", "Zomer", "Herfst", "Winter"];
        const maxJaar = Math.max(...geselecteerdeSeizoenJaren);

        let datasets = [];
        const legendContainer = document.getElementById('seizoen-legend');
        legendContainer.innerHTML = '';

        geselecteerdeSeizoenJaren.forEach(jaar => {
            const jaarData = result.jaren[jaar];
            if (!jaarData) return;

            const jarenVerschil = maxJaar - jaar;
            const alpha = jarenVerschil === 0 ? 1.0 : (jarenVerschil === 1 ? 0.42 : 0.25);
            const lijnDikte = jarenVerschil === 0 ? 2.2 : 1.5;

            seizoenenVolgorde.forEach(seizoen => {
                const reeks = jaarData[seizoen] || [];
                const heeftData = reeks.some(v => v !== null && v !== undefined);

                if (!heeftData && geselecteerdeSeizoenJaren.length > 1 && jaar !== geselecteerdeSeizoenJaren[0]) {
                    return;
                }

                const [r, g, b] = SEIZOEN_KLEUREN_RGB[seizoen];
                const kleurRgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                const labelNaam = `${seizoen} ${jaar}`;
                const datasetIndex = datasets.length;
                const isVerborgen = !!verborgenSeizoenLijnen[labelNaam];

                datasets.push({
                    label: labelNaam,
                    data: reeks,
                    borderColor: kleurRgba,
                    backgroundColor: 'transparent',
                    borderWidth: lijnDikte,
                    stepped: true,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    hidden: isVerborgen
                });

                const legItem = document.createElement('div');
                legItem.className = 'seizoen-legend-item' + (isVerborgen ? ' hidden-dataset' : '');
                legItem.innerHTML = `<span class="seizoen-ring" style="border-color: ${kleurRgba};"></span><span>${labelNaam}</span>`;

                legItem.addEventListener('click', () => {
                    verborgenSeizoenLijnen[labelNaam] = !verborgenSeizoenLijnen[labelNaam];
                    const nuVerborgen = verborgenSeizoenLijnen[labelNaam];
                    legItem.classList.toggle('hidden-dataset', nuVerborgen);
                    if (seizoenGrafiek) {
                        seizoenGrafiek.setDatasetVisibility(datasetIndex, !nuVerborgen);
                        seizoenGrafiek.update();
                    }
                });

                legendContainer.appendChild(legItem);
            });
        });

        if (seizoenGrafiek) {
            seizoenGrafiek.destroy();
            seizoenGrafiek = null;
        }

        const ctx = document.getElementById('seizoenGrafiek').getContext('2d');
        seizoenGrafiek = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsTijd,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 4, right: 6, bottom: 8, left: 0 }
                },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
                animation: {
                    duration: 250,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'kwartierSnapProfiel',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4',
                            autoSkip: false,
                            maxRotation: 0,
                            padding: 4,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                if (!label || !label.endsWith(':00')) return '';
                                const uur = parseInt(label.split(':')[0], 10);
                                if (window.innerWidth <= 768) {
                                    return (uur % 3 === 0) ? label : '';
                                }
                                if (window.innerWidth <= 1150) {
                                    return (uur % 2 === 0) ? label : '';
                                }
                                return label;
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 255, 255, 0.25)'; 
                                }
                                return 'rgba(139, 155, 180, 0.08)';
                            }
                        },
                        ticks: { color: '#8b9bb4' },
                        title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnapProfiel',
                        intersect: false,
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.parsed.y;
                                if (val === null || val === undefined) return null;
                                return ` ${ctx.dataset.label}: € ${val.toFixed(2)} /MWh`;
                            }
                        }
                    }
                }
            }
        });

        herberekenGrafiekHoogte();
    } catch (error) {
        console.error("Fout bij ophalen van seizoensprofiel:", error);
    }
}

// ==========================================
// 10. UITKLAPBARE STATISTIEKEN & RESIZE-FIX
// ==========================================
function initUitklapbareStatistieken() {
    document.querySelectorAll('.box-info').forEach(box => {
        const firstLi = box.querySelector('li:first-child');
        if (firstLi && !firstLi.querySelector('.toggle-stats-arrow')) {
            const arrow = document.createElement('i');
            arrow.className = 'bx bx-chevron-down toggle-stats-arrow';
            firstLi.style.cursor = 'pointer';
            firstLi.insertBefore(arrow, firstLi.firstChild);

            firstLi.addEventListener('click', (e) => {
                e.stopPropagation();
                box.classList.toggle('expanded');
            });
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.box-info')) {
            document.querySelectorAll('.box-info').forEach(b => b.classList.remove('expanded'));
        }
    });
}

function herberekenGrafiekHoogte() {
    [50, 200, 450].forEach(delay => {
        setTimeout(() => {
            if (typeof profielGrafiek !== 'undefined' && profielGrafiek) profielGrafiek.resize();
            if (typeof maandGrafiek !== 'undefined' && maandGrafiek) maandGrafiek.resize();
            if (typeof jaarGrafiek !== 'undefined' && jaarGrafiek) jaarGrafiek.resize();
            if (typeof seizoenGrafiek !== 'undefined' && seizoenGrafiek) seizoenGrafiek.resize();
        }, delay);
    });
}

window.addEventListener('load', herberekenGrafiekHoogte);
window.addEventListener('resize', herberekenGrafiekHoogte);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA Service Worker geregistreerd!', reg))
            .catch(err => console.error('PWA registratie mislukt:', err));
    });
}

bouwPeriodeKalender(kalenderMaandDatum);