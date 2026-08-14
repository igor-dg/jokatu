# Jokatu! — Euskara praktikatzeko jokoak

## Deskribapena

Jokatu! euskara ikasteko jokoen aplikazio nagusia da, Vue.js eta Capacitor-ekin eraikia. Web-app soil bezala hasi zen proiektua, baina gaur egun bere identitate propioa duen aplikazio natiboa da (Android eta iOS), Google Play-n beta itxian dagoena.

Edukiak hainbat iturritatik datoz: sinonimoak eta C1 mailako hiztegia **IKA** euskaltegi sareak (https://ika.eus) eskainitakoak dira; Hiztegle-ren hitz-corpusa Euskal Hiztegiaren Maiztasun Egituratik (EHME, https://www.ehu.eus/ehg/ehme/datu.htm) dator; definizioak Harluxet Hiztegi Entziklopedikotik eta itzulpenak Elhuyar Hiztegitik ateratzen dira.

**Beta bertsioan izena emateko eta informazio gehiago: https://idg.eus/jokatu**

## Ezaugarriak

- **Hiztegle**: "Wordle" erako jokoa, euskarazko definizioekin eta hiztegi-ikaskuntzan oinarrituta. Eguneroko erronka bat dauka (egun bakoitzeko hitz bera denontzat, kalendario finko batekin) eta modu librea, nahi adina aldiz jolasteko.
- **Sinonimoen jokoa**: Euskal hiztegia aberasteko eta sinonimoak ikasteko jokoa.
- **Sinonimoen zerrenda**: Ikasgelan erabilitako euskarazko sinonimoen bilduma osoa.
- **C1 mailako hiztegia**: Euskal hizkuntzaren ikasgaietan erabiltzen diren terminoen bilduma, bilatzaile eta definizio-bistaratzearekin.
- **Aditz laguntzaileak**: Euskal aditz osagarriak ikasteko eta praktikatzeko joko interaktiboa, sistema guztiekin (NOR, NOR-NORI, NOR-NORK, NOR-NORI-NORK) eta denbora ezberdinekin.
- **Aditz taulak**: Aditz laguntzaileen taula osoak ikusteko aukera.
- **Estatistikak eta aurrerapena**: Zure ikasketa-prozesua jarraitzeko datu eta grafikoak (gailuan bertan gordeta, IndexedDB bidez), eguneroko helburu eta jarraipen-serie (streak) batekin.

## Proiektuaren egitura

```
/
├── src/                 # Aplikazioaren iturburu kodea (Vue 3 SPA)
│   ├── components/      # Berrerabilgarriak diren osagaiak, jokoka antolatuta
│   ├── composables/     # Aplikazioan zehar erabilgarriak diren funtzioak (adib. estatistiken zerbitzua)
│   ├── data/            # JSON/TXT datuak (hiztegiak, aditzak, Hiztegle-ren hitz-zerrendak eta eguneroko kalendarioa)
│   ├── router/          # Nabigazioaren kudeaketa (web historia edo hash, plataformaren arabera)
│   ├── services/        # Hiztegi-APIarekiko konexioa eta hitz-balidazioa
│   ├── utils/           # Laguntza-funtzioak
│   └── views/           # Aplikazioaren orri nagusiak
├── public/              # Web-eraikuntzan estatiko agertzen diren fitxategiak
├── android/             # Proiektu natibo Android-a (Capacitor)
├── ios/                 # Proiektu natibo iOS-a (Capacitor)
├── tools/               # Hitz-zerrendak sortzeko script-ak (garapenerako, ez da runtime-ean erabiltzen)
└── vite.config.js       # Vite konfigurazioa
```

## Instalazioa

```bash
# Proiektua klonatu
git clone https://github.com/igor-dg/jokatu.git
cd jokatu

# Menpekotasunak instalatu
npm install

# Garapen zerbitzaria abiarazi
npm run dev
```

Proiektua abiarazita, nabigatzailean `http://localhost:5173` helbidean (edo Vite-k adierazitako portuan) sartuko zara, web bertsioarekin.

## Garapena

```bash
# Web bertsiorako garapen zerbitzaria
npm run dev

# Web bertsioa produkziorako eraiki
npm run build

# App natiborako eraiki (Capacitor-ek erabiliko duen bundlea)
npm run build:native

# Android-en probatu (eraiki + cap sync + gailuan/emuladorean abiarazi)
npm run cap:android

# iOS-en probatu
npm run cap:ios

# Capacitor-en proiektu natiboak eguneratu web-eraikuntza berriarekin, eraiki gabe
npm run cap:sync
```

Android edo iOS proiektu natiboetan aldaketaren bat egin ondoren (adib. hitz-zerrenda berri bat gehitu), gogoratu `npm run cap:sync` (edo `cap:android`/`cap:ios`) exekutatzea APK/IPA berri bat sortu aurretik, web-eraikuntza berria proiektu natiboetara kopiatzeko.

## Teknologiak

- [Vue.js 3](https://vuejs.org/) - JavaScript framework-a
- [Vue Router](https://router.vuejs.org/) - Orrialdeen kudeaketarako
- [Capacitor](https://capacitorjs.com/) - App natiboa (Android/iOS) sortzeko
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework-a
- [Vite](https://vitejs.dev/) - Eraikitze eta garapen tresna
- [Apexcharts](https://apexcharts.com/) - Estatistiken bisualizaziorako grafikoak
- [Lucide](https://lucide.dev/) - Ikonoen liburutegia

## Proiektuan laguntzea

Proiektu honetan lagundu nahi baduzu, oso ondo etorria zara! Hainbat modutan lagundu dezakezu:

1. **Kode-hobekuntzak**: Interfazea hobetu, errendimendua optimizatu, edo funtzionalitate berriak proposatzeko.
2. **Akatsen zuzenketak**: Aurkitutako akatsak zuzendu edo jakinarazteko.
3. **Eduki-gehiketak**: Hiztegi berriak, aditz-eredu gehiago, edo sinonimo-zerrenda zabaltzeko.
4. **Itzulpenak**: Interfazea beste euskalkietara egokitzeko.

Laguntzeko prozesua:

1. Proiektuaren fork bat sortu GitHub-en
2. Zure aldaketetarako adar berri bat sortu (`git checkout -b nire-hobekuntza`)
3. Zure aldaketak egin eta commit-era bidali (`git commit -am 'Hobekuntza: azalpena'`)
4. Zure adarrera igo (`git push origin nire-hobekuntza`)
5. Pull Request bat sortu

## Lizentzia

Proiektu honen kodea (`src/`, `android/`, `ios/` eta gainerako tresneria) **PolyForm Noncommercial 1.0.0** lizentziaren pean argitaratzen da. Lizentziari buruzko informazio gehiago nahi izanez gero, proiektuaren erroan dagoen `LICENSE` fitxategia kontsultatu, edo <https://polyformproject.org/licenses/noncommercial/1.0.0>.

Lizentzia horrek edonori baimentzen dio kodea erabili, aldatu eta banatzea **helburu ez-komertzialetarako** (ikasketa, esperimentazioa, ekarpenak...). Erabilera komertzialerako (adib. edukiaren edo kodearen bertsio propio bat merkaturatzeko), harremanetan jarri idg.eus-ekin.

**Oharra datuen inguruan**: lizentzia horrek ez ditu estaltzen `src/data/` eta `public/data/` direktorioetan bildutako hiztegi-edukiak (hitz-zerrendak, definizioak, itzulpenak). Eduki horiek jatorrizko iturrien eskubideen pean daude (ikus [Egileak eta eskerrak](#egileak-eta-eskerrak)), eta ez daude berrerabilgarri lizentzia honen bidez.

## Egileak eta eskerrak

- [Idg.eus](https://idg.eus) - Proiektuaren garapena
- [IKA Euskaltegiak](https://ika.eus) eta, batez ere, Anjel Txisbert - Sinonimoak eta C1 mailako hiztegia
- [EHME - Euskal Hiztegiaren Maiztasun Egitura](https://www.ehu.eus/ehg/ehme/datu.htm) - Hiztegle-ren hitz-corpusa
- Harluxet Hiztegi Entziklopedikoa - Definizioak
- Elhuyar Hiztegia - Itzulpenak
