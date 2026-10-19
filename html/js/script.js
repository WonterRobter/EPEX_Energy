// ==========================================
// 0. BEVEILIGING (Tijdelijk uitgeschakeld)
// ==========================================
/*
const ingelogdeGebruiker = localStorage.getItem('loggedInUser') || sessionStorage.getItem('loggedInUser');
if (!ingelogdeGebruiker) {
    window.location.href = 'login.html';
    throw new Error("Niet ingelogd, script gestopt.");
}
*/

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
    const labelStatNu = document.getElementById('label-stat-nu');

    if (isZelfdeDag(actieveDatum, vandaag)) {
        liveIndicator.style.visibility = 'visible';
        labelStatNu.innerText = 'Huidige EPEX (Live)';
    } else {
        liveIndicator.style.visibility = 'hidden';
        labelStatNu.innerText = 'Laatste EPEX van dag';
    }

    bouwKalender(kalenderMaandDatum);
    laadEpexData(formatteerApiDatum(actieveDatum));
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
        dagDiv.addEventListener('click', () => veranderActieveDag(celDatum));
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
// 3. LEGENDA KNOPPEN (Lijnen aan/uit zetten)
// ==========================================
let datasetZichtbaar = [true, true, true, true];

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
// 4. CUSTOM PLUG-IN VOOR HUIDIGE TIJD LIJN OP VANDAAG
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
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)'; // Lichtgrijs lijntje voor het huidige uur
        ctx.stroke();
        ctx.restore();
    }
};

Chart.register(huidigeTijdLijnPlugin);

// ==========================================
// 5. DATA OPHALEN & GRAFIEK TEKENEN
// ==========================================
let epexGrafiek = null;

async function laadEpexData(datumString) {
    try {
        // Zorg dat hij de exacte URL aanroept (pas 192.168.1.130:1880 aan als jouw Node-RED op een ander IP/poort draait)
        const url = `http://192.168.1.130:1880/api/prijzen?datum=${datumString}`;
        console.log("Ophalen van URL:", url); // Open je F12 Console in de browser om dit te zien!

        const response = await fetch(url);
        const data = await response.json();

        const nu = new Date();
        if (isZelfdeDag(actieveDatum, nu)) {
            const tijdStr = nu.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('live-text').innerText = `Live (laatst bijgewerkt: ${tijdStr})`;
        }

        const heeftData = data && data.some(d => d.prijs !== null || d.onbalans_kwartier !== null || d.onbalans_minuut !== null);

        if (!heeftData) {
            document.getElementById('stat-nu').innerText = "Geen data";
            document.getElementById('stat-gem').innerText = "Geen data";
            document.getElementById('stat-minmax').innerText = "Geen data";
            if (epexGrafiek) epexGrafiek.destroy();
            return;
        }

        let som = 0;
        let aantalEpex = 0;
        let minPrijs = Infinity, minTijd = "--:--";
        let maxPrijs = -Infinity, maxTijd = "--:--";

        let labelsTijd = [];
        let dataEpex = [];
        let dataOnbalans15m = [];
        let dataOnbalans1m = [];
        let dataDrempel = [];

        data.forEach(item => {
            const tijdKort = item.tijdstip.split(' ')[1] || item.tijdstip;
            labelsTijd.push(tijdKort);

            const prijs = item.prijs !== null && item.prijs !== undefined ? Number(item.prijs) : null;
            dataEpex.push(prijs);
            dataOnbalans15m.push(item.onbalans_kwartier ?? null);
            dataOnbalans1m.push(item.onbalans_minuut ?? null);
            dataDrempel.push(25);

            if (prijs !== null && !isNaN(prijs)) {
                som += prijs;
                aantalEpex++;
                if (prijs < minPrijs) { minPrijs = prijs; minTijd = tijdKort; }
                if (prijs > maxPrijs) { maxPrijs = prijs; maxTijd = tijdKort; }
            }
        });

        const gemiddelde = aantalEpex > 0 ? (som / aantalEpex) : 0;

        const huidigeTijdStr = nu.getHours().toString().padStart(2, '0') + ":" + nu.getMinutes().toString().padStart(2, '0');
        let huidigItem = data.find(item => item.tijdstip.endsWith(huidigeTijdStr));
        let geldigeEpexPunten = data.filter(item => item.prijs !== null);
        let prijsNu = (huidigItem && huidigItem.prijs !== null) 
                      ? Number(huidigItem.prijs) 
                      : (geldigeEpexPunten.length > 0 ? Number(geldigeEpexPunten[geldigeEpexPunten.length - 1].prijs) : 0);

        document.getElementById('stat-nu').innerHTML = `<span style="color: #ef4444;">€ ${prijsNu.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('stat-gem').innerHTML = `<span style="color: #ef4444;">€ ${gemiddelde.toFixed(2)}</span> <span class="unit-label">€/MWh</span>`;
        document.getElementById('stat-minmax').innerHTML = `<span style="color: #10b981;">${minPrijs.toFixed(2)}</span> <span class="unit-label">(${minTijd})</span> / <span style="color: #ef4444;">${maxPrijs.toFixed(2)}</span> <span class="unit-label">(${maxTijd})</span>`;

        // --- GRAFIEK TEKENEN ---
        const ctx = document.getElementById('dagGrafiek').getContext('2d');
        if (epexGrafiek) epexGrafiek.destroy();

        epexGrafiek = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsTijd,
                datasets: [
                    {
                        label: 'EPEX',
                        data: dataEpex,
                        borderColor: '#22d3ee',
                        backgroundColor: 'rgba(34, 211, 238, 0.12)',
                        borderWidth: 2,
                        stepped: true,
                        fill: true,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        hidden: !datasetZichtbaar[0]
                    },
                    {
                        label: 'Onbalans Kwartier',
                        data: dataOnbalans15m,
                        borderColor: '#f97316',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        hidden: !datasetZichtbaar[1]
                    },
                    {
                        label: 'Onbalans Minuut',
                        data: dataOnbalans1m,
                        borderColor: '#a855f7',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        stepped: true,
                        fill: false,
                        pointRadius: 0,
                        pointHitRadius: 8,
                        hidden: !datasetZichtbaar[2]
                    },
                    {
                        label: 'Drempel €25',
                        data: dataDrempel,
                        borderColor: '#ef4444',
                        borderWidth: 1.5,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHitRadius: 0,
                        fill: false,
                        hidden: !datasetZichtbaar[3]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: true,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false,
                    includeInvisible: false // Negeert verborgen lijnen zodat de muis direct naar de actieve punten grijpt
                    
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#8b9bb4',
                            autoSkip: false,
                            maxRotation: 0,
                            callback: function(val, index) {
                                const label = this.getLabelForValue(val);
                                return label && label.endsWith(':00') ? label : '';
                            }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(139, 155, 180, 0.08)' },
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
                    legend: { display: false }
                }
            }
        });

    } catch (error) {
        console.error("Fout bij ophalen van API:", error);
        document.getElementById('stat-nu').innerText = "API Fout";
    }
}

// ==========================================
// 6. ELKE MINUUT AUTOMATISCH VERVERSEN (OP VANDAAG)
// ==========================================
setInterval(() => {
    const nu = new Date();
    if (isZelfdeDag(actieveDatum, nu)) {
        laadEpexData(formatteerApiDatum(actieveDatum));
    }
}, 60000);

veranderActieveDag(new Date());