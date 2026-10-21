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

// ==========================================
// 2. SUB-TABS WISSELEN BINNEN TRENDS.HTML
// ==========================================
const subTabLinks = document.querySelectorAll('.sub-tab-link');
const viewKwartier = document.getElementById('view-kwartier');
const viewOverig = document.getElementById('view-overig');
const kalenderSectie = document.getElementById('periode-kalender-sectie');

subTabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        subTabLinks.forEach(l => l.classList.remove('active-sub'));
        this.classList.add('active-sub');

        const gekozenTab = this.getAttribute('data-tab');
        if (gekozenTab === 'kwartier') {
            viewKwartier.style.display = 'flex';
            viewOverig.style.display = 'none';
            kalenderSectie.style.display = 'block';
        } else {
            viewKwartier.style.display = 'none';
            viewOverig.style.display = 'flex';
            document.getElementById('overig-titel').innerText = this.innerText;
        }
    });
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

// Start kalender en laad direct de afgelopen 7 dagen
bouwPeriodeKalender(kalenderMaandDatum);
laadKwartierProfielData();