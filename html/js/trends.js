// ==========================================
// 1. ZIJBALK (MOBIEL OVERLAY), DROPDOWN & DARK MODE
// ==========================================
const sidebar = document.getElementById('sidebar');
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function sluitMobielMenu() {
    sidebar.classList.remove('mobile-open');
}

if (menuBar) {
    menuBar.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', sluitMobielMenu);
}

// Sluit het mobiele menu zodra je op een echte link klikt (behalve de Trends-uitklapknop zelf)
const allSideMenu = document.querySelectorAll('#sidebar .side-menu a:not(.dropdown-btn)');
allSideMenu.forEach(item => {
    item.addEventListener('click', function () {
        sluitMobielMenu();
    });
});

// Dropdown functionaliteit voor Trends: ENKEL open/dicht klappen
const allDropdowns = document.querySelectorAll('#sidebar .dropdown-btn');
allDropdowns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault(); 
        const parentLi = this.parentElement;
        parentLi.classList.toggle('show-menu');
    });
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

// ==========================================
// 2. SUB-TABS WISSELEN BINNEN TRENDS.HTML (Met Zijbalk-Kalenders)
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

    // Verberg eerst alle schermen en zijbalk-kalenders
    viewKwartier.style.display = 'none';
    viewMaand.style.display = 'none';
    if (viewSeizoen) viewSeizoen.style.display = 'none';
    if (viewJaar) viewJaar.style.display = 'none';
    
    kalenderPeriodeSectie.style.display = 'none';
    kalenderMaandSectie.style.display = 'none';
    kalenderJaarSectie.style.display = 'none';

    if (tabNaam === 'kwartier') {
        viewKwartier.style.display = 'flex';
        kalenderPeriodeSectie.style.display = 'block';
        laadKwartierProfielData();
    } else if (tabNaam === 'maand') {
        viewMaand.style.display = 'flex';
        kalenderMaandSectie.style.display = 'block';
        bouwZijbalkMaandKalender();
        laadMaandOverzicht();
    } else if (tabNaam === 'seizoen') {
        if (viewSeizoen) viewSeizoen.style.display = 'flex';
    } else if (tabNaam === 'jaar') {
        viewJaar.style.display = 'flex';
        kalenderJaarSectie.style.display = 'block';
        bouwZijbalkJaarKalender();
        laadJaarOverzicht();
    }
}

subTabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const gekozenTab = this.getAttribute('data-tab');
        openTab(gekozenTab);
        window.history.pushState({}, '', `trends.html?tab=${gekozenTab}`);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || 'kwartier';
    openTab(tabParam);
});

// ==========================================
// 3. PERIODE KALENDER (Start- & Einddatum selecteren)
// ==========================================
let eindDatum = new Date();
eindDatum.setHours(0, 0, 0, 0);

let startDatum = new Date(eindDatum);
startDatum.setDate(eindDatum.getDate() - 7); // Standaard afgelopen 7 dagen

let kalenderMaandDatum = new Date(eindDatum.getFullYear(), eindDatum.getMonth(), 1);
let wachtOpTweedeKlik = false; // Houdt bij of de gebruiker net een 1e datum heeft aangeklikt

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
        // 1e klik: Stel het startpunt in
        startDatum = d;
        eindDatum = d;
        wachtOpTweedeKlik = true;
        bouwPeriodeKalender(kalenderMaandDatum);
    } else {
        // 2e klik: Stel het eindpunt in (en wissel om als 2e klik vóór de 1e klik ligt)
        if (d < startDatum) {
            eindDatum = startDatum;
            startDatum = d;
        } else {
            eindDatum = d;
        }
        wachtOpTweedeKlik = false;
        bouwPeriodeKalender(kalenderMaandDatum);
        laadKwartierProfielData();
    }
}

function bouwPeriodeKalender(datum) {
    const maandNamen = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    document.getElementById('kalender-maand').innerText = `${maandNamen[datum.getMonth()]} ${datum.getFullYear()}`;
    
    const dagenContainer = document.getElementById('kalender-dagen');
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

document.getElementById('kalender-prev').addEventListener('click', () => {
    kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() - 1);
    bouwPeriodeKalender(kalenderMaandDatum);
});
document.getElementById('kalender-next').addEventListener('click', () => {
    kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() + 1);
    bouwPeriodeKalender(kalenderMaandDatum);
});

// ==========================================
// 4. LEGENDA KNOPPEN (Onbalans 1m standaard UIT op index 2)
// ==========================================
// [Gem EPEX, Gem Onb 15m, Gem Onb 1m (false), Min EPEX, Max EPEX]
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
// 5. KWARTIER-SNAPPER & KLEURFUNCTIE
// ==========================================
Chart.Interaction.modes.kwartierSnapProfiel = function(chart, e) {
    const xAxis = chart.scales.x;
    const rect = chart.canvas.getBoundingClientRect();
    const xPixel = e.native ? (e.native.clientX - rect.left) : e.x;

    let rawIndex = xAxis.getValueForPixel(xPixel);
    if (rawIndex === undefined || rawIndex === null) return [];
    
    rawIndex = Math.max(0, Math.min(chart.data.labels.length - 1, Math.round(rawIndex)));

    // Als Gem. Onbalans (1m) (dataset 2) uit staat -> snap naar 00, 15, 30, 45!
    const minuutActief = chart.isDatasetVisible(2);
    let targetIndex = minuutActief ? rawIndex : Math.round(rawIndex / 15) * 15;
    targetIndex = Math.min(chart.data.labels.length - 1, targetIndex);

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
    try {
        document.getElementById('profiel-titel').innerText = 
            `Kwartierprofielen (${formatteerTitelDatum(startDatum)} tot ${formatteerTitelDatum(eindDatum)})`;

        const startStr = formatteerApiDatum(startDatum);
        const eindStr = formatteerApiDatum(eindDatum);
        const url = `http://192.168.1.130:1880/api/kwartierprofiel?start=${startStr}&eind=${eindStr}&_t=${Date.now()}`;

        const response = await fetch(url);
        const data = await response.json();

        const heeftData = data && data.some(d => d.epex_gem !== null || d.onb15_gem !== null);
        if (!heeftData) {
            document.getElementById('profiel-gem').innerText = "Geen data";
            document.getElementById('profiel-min').innerText = "Geen data";
            document.getElementById('profiel-max').innerText = "Geen data";
            
            // DE FIX: Zet de grafiek op null nadat je hem vernietigt!
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

        // Vul de 3 statistiekblokken precies zoals in de screenshot
        document.getElementById('profiel-gem').innerHTML = 
            `<span style="color: ${kleurGem};">€ ${periodeGem.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('profiel-min').innerHTML = 
            `<span style="color: #ffffff; font-size: 20px;">${goedkoopsteTijd}</span> <span style="color: ${kleurMin}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('profiel-max').innerHTML = 
            `<span style="color: #ffffff; font-size: 20px;">${duursteTijd}</span> <span style="color: ${kleurMax}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;

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
                        borderColor: '#22d3ee',
                        backgroundColor: 'rgba(34, 211, 238, 0.12)',
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
                animation: {
                    duration: 350,
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
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return label && label.endsWith(':00') ? label : '';
                            }
                        }
                    },
                    y: {
                        suggestedMin: 0, // Dwingt de as om altijd minimaal vanaf 0 te beginnen (of lager bij negatief)
                        grid: { 
                            color: function(context) {
                                // Maak de 0-lijn zelf een klein beetje lichter zodat hij opvalt
                                if (context.tick.value === 0) {
                                    return 'rgba(255, 255, 255, 0.15)'; 
                                }
                                return 'rgba(139, 155, 180, 0.08)';
                            }
                        },
                        ticks: { color: '#8b9bb4' },
                        title: {
                            display: true,
                            text: '€ / MWh',
                            color: '#8b9bb4',
                            font: { size: 11 }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnapProfiel',
                        intersect: false,
                        animation: {
                            duration: 200,
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
    document.getElementById('mk-year-label').innerText = maandKalenderJaar;
    const grid = document.getElementById('mk-maanden-grid');
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
        });
        grid.appendChild(btn);
    }
}

document.getElementById('mk-prev-year').addEventListener('click', () => {
    maandKalenderJaar--;
    bouwZijbalkMaandKalender();
});
document.getElementById('mk-next-year').addEventListener('click', () => {
    maandKalenderJaar++;
    bouwZijbalkMaandKalender();
});

// Pijltjes & "Deze maand"-knop boven de grafiek
document.getElementById('btn-prev-maand').addEventListener('click', () => {
    actieveMaandDatum.setMonth(actieveMaandDatum.getMonth() - 1);
    maandKalenderJaar = actieveMaandDatum.getFullYear();
    bouwZijbalkMaandKalender();
    laadMaandOverzicht();
});
document.getElementById('btn-next-maand').addEventListener('click', () => {
    actieveMaandDatum.setMonth(actieveMaandDatum.getMonth() + 1);
    maandKalenderJaar = actieveMaandDatum.getFullYear();
    bouwZijbalkMaandKalender();
    laadMaandOverzicht();
});
document.getElementById('btn-maand-selector').addEventListener('click', () => {
    actieveMaandDatum = new Date();
    maandKalenderJaar = actieveMaandDatum.getFullYear();
    bouwZijbalkMaandKalender();
    laadMaandOverzicht();
});

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
        const url = `http://192.168.1.130:1880/api/maandoverzicht?jaar=${jaar}&maand=${maand}&_t=${Date.now()}`;
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
        document.getElementById('maand-stat-min').innerHTML = `<span style="color: #ffffff; font-size: 20px;">${goedkoopsteDag} ${maandNaamVol}</span> <span style="color: ${bepaalPrijsKleur(goedkoopsteGem)}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('maand-stat-max').innerHTML = `<span style="color: #ffffff; font-size: 20px;">${duursteDag} ${maandNaamVol}</span> <span style="color: ${bepaalPrijsKleur(duursteGem)}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;

        if (maandGrafiek) {
            maandGrafiek.data.labels = labelsDag;
            maandGrafiek.data.datasets[0].data = dataEpexGem;
            maandGrafiek.data.datasets[1].data = dataOnb15Gem;
            maandGrafiek.data.datasets[2].data = dataOnb1Gem;
            maandGrafiek.data.datasets[3].data = dataEpexMin;
            maandGrafiek.data.datasets[4].data = dataEpexMax;
            datasetZichtbaarMaand.forEach((zichtbaar, idx) => { maandGrafiek.setDatasetVisibility(idx, zichtbaar); });
            maandGrafiek.update();
            return;
        }

        const ctx = document.getElementById('maandGrafiek').getContext('2d');
        maandGrafiek = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsDag,
                datasets: [
                    { type: 'bar', label: 'Gem. EPEX', data: dataEpexGem, backgroundColor: 'rgba(34, 211, 238, 0.65)', borderColor: '#22d3ee', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[0] },
                    { type: 'bar', label: 'Gem. Onbalans (15m)', data: dataOnb15Gem, backgroundColor: 'rgba(249, 115, 22, 0.65)', borderColor: '#f97316', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[1] },
                    { type: 'bar', label: 'Gem. Onbalans (1m)', data: dataOnb1Gem, backgroundColor: 'rgba(168, 85, 247, 0.65)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarMaand[2] },
                    { type: 'line', label: 'Min EPEX', data: dataEpexMin, borderColor: '#10b981', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#10b981', hidden: !datasetZichtbaarMaand[3] },
                    { type: 'line', label: 'Max EPEX', data: dataEpexMax, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', hidden: !datasetZichtbaarMaand[4] }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 350, easing: 'easeOutQuart' },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8b9bb4' } },
                    y: { suggestedMin: 0, grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 155, 180, 0.08)' }, ticks: { color: '#8b9bb4' }, title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function(ctx) { const val = ctx.parsed.y; if (val === null || val === undefined) return null; return ` ${ctx.dataset.label}: € ${Math.round(val)} /MWh`; } } }
                }
            }
        });
    } catch (error) {
        console.error("Fout bij ophalen van maandoverzicht:", error);
    }
}

// ==========================================
// 8. JAAROVERZICHT LOGICA & ZIJBALK JAAR-KALENDER
// ==========================================
let actiefJaar = new Date().getFullYear();
let jaarGridStart = actiefJaar - 5; // Toont blok van 12 jaar rondom huidig jaar
let jaarGrafiek = null;
let datasetZichtbaarJaar = [true, true, false, true, true];

function bouwZijbalkJaarKalender() {
    const eindJaar = jaarGridStart + 11;
    document.getElementById('jk-range-label').innerText = `${jaarGridStart} - ${eindJaar}`;
    const grid = document.getElementById('jk-jaren-grid');
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
        });
        grid.appendChild(btn);
    }
}

document.getElementById('jk-prev-range').addEventListener('click', () => {
    jaarGridStart -= 12;
    bouwZijbalkJaarKalender();
});
document.getElementById('jk-next-range').addEventListener('click', () => {
    jaarGridStart += 12;
    bouwZijbalkJaarKalender();
});

// Pijltjes & "Dit jaar"-knop boven de grafiek
document.getElementById('btn-prev-jaar').addEventListener('click', () => {
    actiefJaar--;
    if (actiefJaar < jaarGridStart) jaarGridStart -= 12;
    bouwZijbalkJaarKalender();
    laadJaarOverzicht();
});
document.getElementById('btn-next-jaar').addEventListener('click', () => {
    actiefJaar++;
    if (actiefJaar > jaarGridStart + 11) jaarGridStart += 12;
    bouwZijbalkJaarKalender();
    laadJaarOverzicht();
});
document.getElementById('btn-jaar-selector').addEventListener('click', () => {
    actiefJaar = new Date().getFullYear();
    jaarGridStart = actiefJaar - 5;
    bouwZijbalkJaarKalender();
    laadJaarOverzicht();
});

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
        const url = `http://192.168.1.130:1880/api/jaaroverzicht?jaar=${actiefJaar}&_t=${Date.now()}`;
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
            labelsMaand.push(maandNamenVol[mIndex]);
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
        document.getElementById('jaar-stat-min').innerHTML = `<span style="color: #ffffff; font-size: 20px;">${goedkoopsteMaandNaam}</span> <span style="color: ${bepaalPrijsKleur(goedkoopsteGem)}; font-size: 13px;">(€${goedkoopsteGem.toFixed(2)})</span>`;
        document.getElementById('jaar-stat-max').innerHTML = `<span style="color: #ffffff; font-size: 20px;">${duursteMaandNaam}</span> <span style="color: ${bepaalPrijsKleur(duursteGem)}; font-size: 13px;">(€${duursteGem.toFixed(2)})</span>`;

        if (jaarGrafiek) {
            jaarGrafiek.data.labels = labelsMaand;
            jaarGrafiek.data.datasets[0].data = dataEpexGem;
            jaarGrafiek.data.datasets[1].data = dataOnb15Gem;
            jaarGrafiek.data.datasets[2].data = dataOnb1Gem;
            jaarGrafiek.data.datasets[3].data = dataEpexMin;
            jaarGrafiek.data.datasets[4].data = dataEpexMax;
            datasetZichtbaarJaar.forEach((zichtbaar, idx) => { jaarGrafiek.setDatasetVisibility(idx, zichtbaar); });
            jaarGrafiek.update();
            return;
        }

        const ctx = document.getElementById('jaarGrafiek').getContext('2d');
        jaarGrafiek = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labelsMaand,
                datasets: [
                    { type: 'bar', label: 'Gem. EPEX', data: dataEpexGem, backgroundColor: 'rgba(34, 211, 238, 0.65)', borderColor: '#22d3ee', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarJaar[0] },
                    { type: 'bar', label: 'Gem. Onbalans (15m)', data: dataOnb15Gem, backgroundColor: 'rgba(249, 115, 22, 0.65)', borderColor: '#f97316', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarJaar[1] },
                    { type: 'bar', label: 'Gem. Onbalans (1m)', data: dataOnb1Gem, backgroundColor: 'rgba(168, 85, 247, 0.65)', borderColor: '#a855f7', borderWidth: 1, borderRadius: 4, hidden: !datasetZichtbaarJaar[2] },
                    { type: 'line', label: 'Min EPEX', data: dataEpexMin, borderColor: '#10b981', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#10b981', hidden: !datasetZichtbaarJaar[3] },
                    { type: 'line', label: 'Max EPEX', data: dataEpexMax, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], fill: false, pointRadius: 3, pointBackgroundColor: '#ef4444', hidden: !datasetZichtbaarJaar[4] }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: { duration: 350, easing: 'easeOutQuart' },
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8b9bb4' } },
                    y: { suggestedMin: 0, grid: { color: (ctx) => ctx.tick.value === 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(139, 155, 180, 0.08)' }, ticks: { color: '#8b9bb4' }, title: { display: true, text: '€ / MWh', color: '#8b9bb4', font: { size: 11 } } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function(ctx) { const val = ctx.parsed.y; if (val === null || val === undefined) return null; return ` ${ctx.dataset.label}: € ${Math.round(val)} /MWh`; } } }
                }
            }
        });
    } catch (error) {
        console.error("Fout bij ophalen van jaaroverzicht:", error);
    }
}

// Start kalender en laad direct de afgelopen 7 dagen
bouwPeriodeKalender(kalenderMaandDatum);
laadKwartierProfielData();