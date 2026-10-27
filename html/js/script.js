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
// 2. DATUM BEHEER & KALENDER
// ==========================================
let actieveDatum = new Date();
let kalenderMaandDatum = new Date();

function isZelfdeDag(d1, d2) {
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

function veranderActieveDag(nieuweDatum) {
    actieveDatum = new Date(nieuweDatum);
    kalenderMaandDatum = new Date(actieveDatum.getFullYear(), actieveDatum.getMonth(), 1);

    document.getElementById('pagina-titel').innerText = `Dagverloop - ${formatteerTitelDatum(actieveDatum)}`;

    const vandaag = new Date();
    const liveIndicator = document.getElementById('live-indicator');
    if (isZelfdeDag(actieveDatum, vandaag)) {
        liveIndicator.style.visibility = 'visible';
    } else {
        liveIndicator.style.visibility = 'hidden';
    }

    bouwKalender(kalenderMaandDatum);
    laadEpexData(formatteerApiDatum(actieveDatum), true);
}

function bouwKalender(datum) {
    const maandNamen = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    document.getElementById('kalender-maand').innerText = `${maandNamen[datum.getMonth()]} ${datum.getFullYear()}`;
    
    const dagenContainer = document.getElementById('kalender-dagen');
    dagenContainer.innerHTML = "";

    const eersteDag = new Date(datum.getFullYear(), datum.getMonth(), 1).getDay();
    const startOffset = (eersteDag === 0 ? 6 : eersteDag - 1);
    const aantalDagen = new Date(datum.getFullYear(), datum.getMonth() + 1, 0).getDate();
    const vandaag = new Date();

    for (let i = 0; i < startOffset; i++) {
        dagenContainer.innerHTML += `<div></div>`;
    }

    for (let d = 1; d <= aantalDagen; d++) {
        const celDatum = new Date(datum.getFullYear(), datum.getMonth(), d);
        let classes = "cal-day";
        if (isZelfdeDag(celDatum, actieveDatum)) classes += " selected";
        if (isZelfdeDag(celDatum, vandaag)) classes += " today";

        const dagDiv = document.createElement('div');
        dagDiv.className = classes;
        dagDiv.innerText = d;
        dagDiv.addEventListener('click', () => {
            veranderActieveDag(celDatum);
            sluitMobielMenu();
        });
        dagenContainer.appendChild(dagDiv);
    }
}

document.getElementById('kalender-prev').addEventListener('click', () => {
    kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() - 1);
    bouwKalender(kalenderMaandDatum);
});
document.getElementById('kalender-next').addEventListener('click', () => {
    kalenderMaandDatum.setMonth(kalenderMaandDatum.getMonth() + 1);
    bouwKalender(kalenderMaandDatum);
});

document.getElementById('btn-prev-day').addEventListener('click', () => {
    const gisteren = new Date(actieveDatum);
    gisteren.setDate(gisteren.getDate() - 1);
    veranderActieveDag(gisteren);
});
document.getElementById('btn-today').addEventListener('click', () => {
    veranderActieveDag(new Date());
});
document.getElementById('btn-next-day').addEventListener('click', () => {
    const morgen = new Date(actieveDatum);
    morgen.setDate(morgen.getDate() + 1);
    veranderActieveDag(morgen);
});

// ==========================================
// 3. LEGENDA KNOPPEN & INSTELLINGEN
// ==========================================
const prefEpex = localStorage.getItem('pref_lijn_epex') !== 'false';
const prefOnb15 = localStorage.getItem('pref_lijn_onb15') !== 'false';
const prefOnb1 = localStorage.getItem('pref_lijn_onb1') === 'true';

let datasetZichtbaar = [prefEpex, prefOnb15, prefOnb1, prefEpex];

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#custom-legend .legend-item').forEach(item => {
        const index = parseInt(item.getAttribute('data-dataset'));
        if (!isNaN(index) && datasetZichtbaar[index] === false) {
            item.classList.add('hidden-dataset');
        }
    });
});

document.querySelectorAll('#custom-legend .legend-item').forEach(item => {
    item.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-dataset'));
        datasetZichtbaar[index] = !datasetZichtbaar[index];
        this.classList.toggle('hidden-dataset', !datasetZichtbaar[index]);
        if (epexGrafiek) {
            epexGrafiek.setDatasetVisibility(index, datasetZichtbaar[index]);
            epexGrafiek.update();
        }
    });
});

// ==========================================
// 4. CUSTOM PLUG-INS VOOR CHART.JS
// ==========================================
const huidigeTijdLijnPlugin = {
    id: 'huidigeTijdLijn',
    afterDraw(chart) {
        if (!isZelfdeDag(actieveDatum, new Date())) return;

        const nu = new Date();
        const tijdStr = nu.getHours().toString().padStart(2, '0') + ":" + nu.getMinutes().toString().padStart(2, '0');
        
        const labels = chart.data.labels;
        const index = labels.indexOf(tijdStr);
        if (index === -1) return;

        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const xCoord = xAxis.getPixelForValue(index);

        const ctx = chart.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xCoord, yAxis.top);
        ctx.lineTo(xCoord, yAxis.bottom);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
        ctx.stroke();
        ctx.restore();
    }
};

function berekenTouchOfMuisX(chart, e) {
    if (typeof e.x === 'number' && !isNaN(e.x)) return e.x;
    const rect = chart.canvas.getBoundingClientRect();
    const native = e.native;
    if (native) {
        if (native.touches && native.touches.length > 0) return native.touches[0].clientX - rect.left;
        if (native.changedTouches && native.changedTouches.length > 0) return native.changedTouches[0].clientX - rect.left;
        if (typeof native.clientX === 'number') return native.clientX - rect.left;
    }
    return null;
}

if (typeof Chart !== 'undefined') {
    Chart.Interaction.modes.kwartierSnap = function(chart, e) {
        const xAxis = chart.scales.x;
        const xPixel = berekenTouchOfMuisX(chart, e);
        if (xPixel === null) return [];

        let rawIndex = xAxis.getValueForPixel(xPixel);
        if (rawIndex === undefined || rawIndex === null || isNaN(rawIndex)) return [];
        
        rawIndex = Math.max(0, Math.min(chart.data.labels.length - 1, Math.round(rawIndex)));

        const minuutActief = chart.isDatasetVisible(2);
        let targetIndex = minuutActief ? rawIndex : Math.round(rawIndex / 15) * 15;
        targetIndex = Math.min(chart.data.labels.length - 1, targetIndex);

        const items = [];
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (!chart.isDatasetVisible(datasetIndex) || datasetIndex === 3) return;

            const meta = chart.getDatasetMeta(datasetIndex);
            const element = meta.data[targetIndex];
            const waarde = dataset.data[targetIndex];

            if (element && waarde !== null && waarde !== undefined) {
                items.push({ element, datasetIndex, index: targetIndex });
            }
        });
        return items;
    };
    Chart.register(huidigeTijdLijnPlugin);
}

// ==========================================
// 5. REKENMACHINE & EENHEDEN FUNCTIES
// ==========================================
function berekenPrijs(waardeMWh, isMeldingLijn = false) {
    if (waardeMWh === null || waardeMWh === undefined) return null;
    
    const eenheid = localStorage.getItem('pref_eenheid') || 'MWh';
    
    // Uitzondering: Als dit de vaste Melding-lijn is, reken dan GEEN kosten, pas enkel de eenheid aan!
    if (isMeldingLijn) {
        if (eenheid === 'ckWh') return waardeMWh / 10;
        if (eenheid === 'kWh') return waardeMWh / 1000;
        return waardeMWh;
    }

    let prijsCents = waardeMWh / 10; 
    
    const extraAan = localStorage.getItem('pref_toggle_extra') === 'true';
    
    if (extraAan) {
        let aStr = localStorage.getItem('pref_formule_a');
        let bStr = localStorage.getItem('pref_formule_b');
        if (aStr && bStr) {
            aStr = aStr.replace(',', '.');
            bStr = bStr.replace(',', '.');
            const a = parseFloat(aStr);
            const b = parseFloat(bStr);
            if (!isNaN(a) && !isNaN(b)) {
                prijsCents = a + (b * waardeMWh); 
            }
        }
        
        let extraStr = localStorage.getItem('pref_extra_kosten');
        if (extraStr) {
            const extra = parseFloat(extraStr.replace(',', '.'));
            if (!isNaN(extra)) prijsCents += extra;
        }
        
        let btwStr = localStorage.getItem('pref_btw');
        if (btwStr) {
            const btw = parseFloat(btwStr.replace(',', '.'));
            if (!isNaN(btw)) prijsCents = prijsCents * (1 + (btw / 100));
        }
    }

    if (eenheid === 'ckWh') return prijsCents;
    if (eenheid === 'kWh') return prijsCents / 100;
    
    return prijsCents * 10; // MWh = centen * 10
}

function getEenheidLabel() {
    const eenheid = localStorage.getItem('pref_eenheid') || 'MWh';
    if (eenheid === 'ckWh') return 'c€/kWh';
    if (eenheid === 'kWh') return '€/kWh';
    return '€/MWh';
}

function formatGetal(waarde, maxDec) {
    if (waarde === null || waarde === undefined) return null;
    return parseFloat(waarde.toFixed(maxDec));
}

// ==========================================
// 6. KLEURBEPALING PRIJZEN (Op basis van ruwe waarde)
// ==========================================
function bepaalPrijsKleur(prijsMWh) {
    if (prijsMWh < 0) return '#10b981';
    if (prijsMWh < 75) return '#84cc16';
    if (prijsMWh < 125) return '#8b9bb4';
    if (prijsMWh < 200) return '#f87171';
    return '#ef4444';
}

// ==========================================
// 7. ALTIJD LIVE PRIJS OPHALEN
// ==========================================
async function updateHuidigeLivePrijs() {
    try {
        const vandaagStr = formatteerApiDatum(new Date());
        const url = `/api/prijzen?datum=${vandaagStr}&_t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        const nu = new Date();
        const huidigeTijdStr = nu.getHours().toString().padStart(2, '0') + ":" + nu.getMinutes().toString().padStart(2, '0');
        
        let huidigItem = data.find(item => item.tijdstip.endsWith(huidigeTijdStr));
        let geldigeEpexPunten = data.filter(item => item.prijs !== null);
        
        let prijsNu = (huidigItem && huidigItem.prijs !== null) 
                      ? Number(huidigItem.prijs) 
                      : (geldigeEpexPunten.length > 0 ? Number(geldigeEpexPunten[geldigeEpexPunten.length - 1].prijs) : 0);

        const kleurNu = bepaalPrijsKleur(prijsNu);
        
        const berekendePrijsNu = berekenPrijs(prijsNu, true);
        const eenheidL = getEenheidLabel();
        const dec = eenheidL === '€/MWh' ? 2 : 4;
        const weerPrijs = formatGetal(berekendePrijsNu, dec);
        const isCent = eenheidL.includes('c€');
        
        document.getElementById('stat-nu').innerHTML = `<span style="color: ${kleurNu};">${isCent ? '' : '€ '}${weerPrijs}</span> <span class="unit-label">${eenheidL}</span>`;
        document.getElementById('label-stat-nu').innerText = 'Huidige EPEX (Live)';
    } catch (error) {
        console.error("Fout bij ophalen ALTIJD LIVE prijs:", error);
    }
}

// ==========================================
// 8. DATA OPHALEN & GRAFIEK TEKENEN
// ==========================================
let epexGrafiek = null;

async function laadEpexData(datumString, metAnimatie = false) {
    try {
        const url = `/api/prijzen?datum=${datumString}&_t=${Date.now()}`;
        const response = await fetch(url);
        const data = await response.json();

        const nu = new Date();
        if (isZelfdeDag(actieveDatum, nu)) {
            const tijdStr = nu.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('live-text').innerText = `Live (laatst bijgewerkt: ${tijdStr})`;
        }

        const heeftData = data && data.some(d => d.prijs !== null || d.onbalans_kwartier !== null || d.onbalans_minuut !== null);

        if (!heeftData) {
            document.getElementById('stat-gem').innerText = "Geen data";
            document.getElementById('stat-minmax').innerText = "Geen data";
            if (epexGrafiek) { epexGrafiek.destroy(); epexGrafiek = null; }
            return;
        }

        let som = 0, aantalEpex = 0;
        let minPrijsRu = Infinity, minTijd = "--:--";
        let maxPrijsRu = -Infinity, maxTijd = "--:--";
        let labelsTijd = [], dataEpex = [], dataOnbalans15m = [], dataOnbalans1m = [], dataDrempel = [];

        data.forEach(item => {
            const tijdKort = item.tijdstip.split(' ')[1] || item.tijdstip;
            labelsTijd.push(tijdKort);

            const ruweEpex = item.prijs !== null && item.prijs !== undefined ? Number(item.prijs) : null;
            
            dataEpex.push(berekenPrijs(ruweEpex));
            dataOnbalans15m.push(berekenPrijs(item.onbalans_kwartier ?? null));
            dataOnbalans1m.push(berekenPrijs(item.onbalans_minuut ?? null));
            dataDrempel.push(berekenPrijs(25, true));

            const isKwartier = (tijdKort.endsWith(':00') || tijdKort.endsWith(':15') || tijdKort.endsWith(':30') || tijdKort.endsWith(':45'));
            if (isKwartier && ruweEpex !== null && !isNaN(ruweEpex)) {
                som += ruweEpex; 
                aantalEpex++;
                if (ruweEpex < minPrijsRu) { minPrijsRu = ruweEpex; minTijd = tijdKort; }
                if (ruweEpex > maxPrijsRu) { maxPrijsRu = ruweEpex; maxTijd = tijdKort; }
            }
        });

        const gemiddeldeRuw = aantalEpex > 0 ? (som / aantalEpex) : 0;
        const kleurGem = bepaalPrijsKleur(gemiddeldeRuw);
        const eenheidL = getEenheidLabel();
        const decStat = eenheidL === '€/MWh' ? 2 : 4;
        const isCent = eenheidL.includes('c€');

        const gemBer = formatGetal(berekenPrijs(gemiddeldeRuw, true), decStat);
        const minBer = formatGetal(berekenPrijs(minPrijsRu, true), decStat);
        const maxBer = formatGetal(berekenPrijs(maxPrijsRu, true), decStat);

        document.getElementById('stat-gem').innerHTML = `<span style="color: ${kleurGem};">${isCent ? '' : '€ '}${gemBer}</span> <span class="unit-label">${eenheidL}</span>`;
        document.getElementById('stat-minmax').innerHTML = `<span style="color: #10b981;">${minBer}</span> <span class="unit-label">(${minTijd})</span> / <span style="color: #ef4444;">${maxBer}</span> <span class="unit-label">(${maxTijd})</span>`;

        if (epexGrafiek) {
            epexGrafiek.data.labels = labelsTijd;
            epexGrafiek.data.datasets[0].data = dataEpex;
            epexGrafiek.data.datasets[1].data = dataOnbalans15m;
            epexGrafiek.data.datasets[2].data = dataOnbalans1m;
            epexGrafiek.data.datasets[3].data = dataDrempel;
            datasetZichtbaar.forEach((zichtbaar, idx) => epexGrafiek.setDatasetVisibility(idx, zichtbaar));
            epexGrafiek.options.scales.y.title.text = eenheidL;
            epexGrafiek.update(metAnimatie ? 'default' : 'none');
            herberekenGrafiekHoogte();
            return;
        }

        const ctx = document.getElementById('dagGrafiek').getContext('2d');
        epexGrafiek = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsTijd,
                datasets: [
                    { label: 'EPEX Prijs', data: dataEpex, borderColor: '#438ce6', backgroundColor: 'rgba(67, 140, 230, 0.15)', borderWidth: 2, stepped: true, fill: true, pointRadius: 0, pointHoverRadius: 5, hidden: !datasetZichtbaar[0] },
                    { label: 'Onbalans (15m)', data: dataOnbalans15m, borderColor: '#f97316', backgroundColor: 'transparent', borderWidth: 2, stepped: true, fill: false, pointRadius: 0, pointHoverRadius: 5, hidden: !datasetZichtbaar[1] },
                    { label: 'Onbalans (1m)', data: dataOnbalans1m, borderColor: '#a855f7', backgroundColor: 'transparent', borderWidth: 1.5, stepped: true, fill: false, pointRadius: 0, pointHoverRadius: 4, hidden: !datasetZichtbaar[2] },
                    { label: 'Melding', data: dataDrempel, borderColor: '#ef4444', borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0, pointHoverRadius: 0, fill: false, hidden: !datasetZichtbaar[3] }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 4, right: 6, bottom: 8, left: 0 } },
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
                animation: { duration: 250, easing: 'easeOutQuart' },
                interaction: { mode: 'kwartierSnap', intersect: false },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4', autoSkip: false, maxRotation: 0,
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                if (!label || !label.endsWith(':00')) return '';
                                const uur = parseInt(label.split(':')[0], 10);
                                if (window.innerWidth <= 768) return (uur % 3 === 0) ? label : '';
                                if (window.innerWidth <= 1150) return (uur % 2 === 0) ? label : '';
                                return label;
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: function(ctx) { return ctx.tick.value === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(139, 155, 180, 0.08)'; } },
                        ticks: { color: '#8b9bb4' },
                        title: { display: true, text: eenheidL, color: '#8b9bb4', font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'kwartierSnap',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const naam = context.dataset.label || '';
                                const waarde = context.parsed.y;
                                if (waarde === null || waarde === undefined) return null;
                                
                                const eenh = getEenheidLabel();
                                const isCent = eenh.includes('c€');
                                const decT = eenh === '€/kWh' ? 3 : 2; 
                                const weerg = formatGetal(waarde, decT);
                                
                                return ` ${naam}: ${isCent ? '' : '€ '}${weerg} ${eenh.replace('c€/kWh', 'c€').replace('€/kWh', '').replace('€/MWh', '')}`;
                            }
                        }
                    }
                }
            }
        });
        herberekenGrafiekHoogte();
    } catch (error) {
        console.error("Fout bij ophalen van API:", error);
    }
}

// ==========================================
// 9. UITKLAPBARE STATISTIEKEN OP MOBIEL
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

// ==========================================
// 10. SCHERM- EN GRAFIEKHOOGTE VERGRENDELING
// ==========================================
function herberekenGrafiekHoogte() {
    [0, 60, 200, 400].forEach(delay => {
        setTimeout(() => {
            const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${h}px`);
            if (epexGrafiek) epexGrafiek.resize();
        }, delay);
    });
}

window.addEventListener('load', herberekenGrafiekHoogte);
window.addEventListener('resize', herberekenGrafiekHoogte);
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', herberekenGrafiekHoogte);
}

// ==========================================
// 11. OPSTARTEN & 1-MINUUT TIMERS
// ==========================================
setInterval(() => {
    updateHuidigeLivePrijs();
    const nu = new Date();
    if (isZelfdeDag(actieveDatum, nu)) {
        laadEpexData(formatteerApiDatum(actieveDatum), false); 
    }
}, 60000);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js?v=200')
            .then(reg => console.log('PWA Service Worker geregistreerd!', reg))
            .catch(err => console.error('PWA registratie mislukt:', err));
    });
}

initUitklapbareStatistieken();
updateHuidigeLivePrijs();
veranderActieveDag(new Date());