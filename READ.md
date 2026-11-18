# ⚡ EPEXenergy

**EPEXenergy** is een zelfgehost, open-source energiedashboard (PWA) voor de Belgische elektriciteitsmarkt. Het combineert **EPEX Spot day-ahead prijzen** met **Elia onbalansprijzen** (per kwartier en per minuut) in één overzichtelijke webapplicatie met historische data vanaf **30 september 2019**.

Gebouwd door **Wonter (Wouter De Laet)**.

---

## ✨ Functionaliteiten

### 📊 Dashboard & Visualisaties
* **Vandaag (Actueel):** Live overzicht van de EPEX-prijzen (vandaag en morgen vanaf ~13:00u CET) gecombineerd met de actuele Elia kwartier- en minuutonbalans.
* **Trends — Kwartierprofielen:** Gemiddelde, minimale en maximale prijzen per kwartier over een vrij te kiezen datumbereik.
* **Trends — Maandoverzicht:** Dagelijkse gemiddelden en extremen (min/max) binnen een gekozen maand.
* **Trends — Seizoensprofiel:** Vergelijk gemiddelde dagprofielen per seizoen (Lente, Zomer, Herfst, Winter) over meerdere jaren heen.
* **Trends — Jaaroverzicht:** Maandelijkse gemiddelden en extremen per jaar (geoptimaliseerd zonder minutendata voor directe laadtijden).
* **Trends — Datakwaliteit (Missing Minutes):** 2x2 dashboard met 7-daagse uptime, totaal gemiste minuten, zwaarste storing ooit, maandelijkse en jaarlijkse verdeling, storingspatroon per uur van de dag (`00u–23u`) en een doorzoekbaar logboek.

### 🧮 Persoonlijke Tariefformule & Instellingen
* Schakel naadloos tussen **€/MWh**, **c€/kWh** en **€/kWh**.
* Reken ruwe beursprijzen realtime om naar je eigen leverancierstarief via `a + (b × EPEX)`, aangevuld met vaste extra kosten en BTW.
* Kies standaard zichtbare grafieklijnen en schakel tussen **Donkere** en **Lichte modus**.

### 🤖 Automatisering, Watchdog & Telegram
* **Dagelijkse EPEX-update:** Stuurt automatisch een Telegram-overzicht zodra de prijzen voor morgen beschikbaar zijn (inclusief tijdsloten onder € 25/MWh en onder € 0/MWh).
* **Prijsalarm:** Waarschuwt 15 minuten vooraf wanneer de EPEX-prijs onder de ingestelde drempel zakt.
* **Nachtelijke Watchdog & Auto-Rescue:** Controleert elke ochtend om 07:30 of er gaten zitten in de data van gisteren (Elia) of vandaag (EPEX), probeert ontbrekende records automatisch opnieuw op te halen via de archief-API's en logt permanente gaten in MariaDB.

---

## 🏗️ Architectuur & Tech Stack

De volledige stack draait via **Docker Compose** (o.a. getest op een Proxmox-homelab):

| Service | Container | Rol |
| :--- | :--- | :--- |
| **Nginx** | `epex_nginx` | Serveert de statische frontend (`html/`) en proxiet `/api/*` naar Node-RED |
| **Node-RED** | `epex_nodered` | Data-collectors, Watchdog/Rescue-flows, Telegram-bots en REST API |
| **InfluxDB 2.7** | `epex_influxdb` | Tijdreeksdatabase (`energie_db`) voor `epex_kwartier`, `onbalans_kwartier` en `onbalans_minuut` |
| **MariaDB** | `epex_mariadb` | Relationele database voor gebruikers (`gebruikers`) en datakwaliteit (`data_gaten`) |
| **phpMyAdmin** | `epex_phpmyadmin` | Webinterface voor beheer van MariaDB (poort `8081`) |

**Frontend:** Vanilla HTML5, CSS3, JavaScript, Chart.js, Boxicons & Progressive Web App (Service Worker + Manifest).

---

## 🔌 API Endpoints (Node-RED)

Alle endpoints zijn bereikbaar via Nginx op `/api/...`:

* `GET /api/prijzen?datum=YYYY-MM-DD` — Dagprijzen (EPEX + Onbalans 15m & 1m)
* `GET /api/kwartierprofiel?start=YYYY-MM-DD&eind=YYYY-MM-DD` — Gemiddeld dagprofiel over een periode
* `GET /api/maandoverzicht?jaar=YYYY&maand=M` — Dagoverzicht voor een specifieke maand
* `GET /api/jaaroverzicht?jaar=YYYY` — Maandoverzicht voor een volledig jaar
* `GET /api/seizoensprofiel?jaren=2025,2026` — Seizoensvergelijking over één of meerdere jaren
* `GET /api/datakwaliteit` — Uptime, statistieken per maand/jaar/uur en het `data_gaten`-logboek
* `POST /api/login` & `POST /api/register` — Gebruikersauthenticatie via MariaDB

---

## 🚀 Installatie & Opstarten

### 1. Repository klonen
```bash
git clone [https://github.com/WonterRobter/EPEX_Energy.git](https://github.com/WonterRobter/EPEX_Energy.git)
cd EPEX_Energy

```

### 2. Omgevingsvariabelen instellen

Maak een `.env`-bestand aan in de rootmap voor Node-RED (o.a. voor de Telegram-meldingen):

```env
TELEGRAM_CHAT_ID=123456789
TELEGRAM_ADMIN_ID=123456789

```

*(Pas indien gewenst ook de wachtwoorden en InfluxDB-tokens in `docker-compose.yml` aan vóór je de containers voor het eerst start.)*

### 3. Containers starten

```bash
docker compose up -d

```

* **Webinterface:** `http://<server-ip>`
* **Node-RED Editor:** `http://<server-ip>:1880`
* **InfluxDB UI:** `http://<server-ip>:8086`
* **phpMyAdmin:** `http://<server-ip>:8081`

### 4. MariaDB tabellen aanmaken

Maak in de database `energie_db` de tabel voor datakwaliteit aan:

```sql
CREATE TABLE data_gaten (
    id INT AUTO_INCREMENT PRIMARY KEY,
    datum DATE NOT NULL,
    api_type VARCHAR(50) NOT NULL,
    aantal_gemist INT NOT NULL DEFAULT 0,
    gaten_details TEXT,
    laatst_gezien TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unieke_dag_api (datum, api_type)
);

```

### 5. Node-RED flows importeren

1. Open Node-RED (`:1880`) en importeer `flows.json`.
2. Configureer je Telegram-bot tokens in de Telegram-nodes en controleer de InfluxDB- en MariaDB-credentials.
3. *(Optioneel)* Importeer `Historische_Data_Import_19-24.json` en `Historische_Data_Import_24.json` om de historische prijzen vanaf 30 september 2019 in één keer binnen te halen.

---

## 📜 Databronnen & Licenties

Dit project maakt gebruik van openbare energiedata onder de **Creative Commons Attribution 4.0 International (CC BY 4.0)** licentie.

### Energy-Charts.info (Fraunhofer ISE)

Gebruikt voor Belgische EPEX Spot day-ahead elektriciteitsprijzen (`https://api.energy-charts.info/`).

> **Data License:** Unless stated otherwise, the data provided by the Energy-Charts API is licensed under the **CC BY 4.0** license. Proper attribution to **Energy-Charts.info** as the source is required.

### Elia Open Data

Gebruikt voor Belgische onbalansprijzen (`https://opendata.elia.be/`, datasets `ods161`, `ods162`, `ods133`, `ods134`, `ods046`, `ods047`).

> **Elia Open Data License:** The data provided for are governed by Creative Commons Attribution 4.0 International Public License ("Public License" or "CC BY 4.0").
> This Public License is governed by Belgian law. Any dispute concerning the conclusion, interpretation or execution of this Public License as well as any other dispute concerning or in connection with this Public License whether legal or factual, none excepted, shall be settled by the competent court of Brussels.