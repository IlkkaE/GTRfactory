# FEATURE BRIEF — lapa yhteiseen etunäkymään

10.9.2026. ARKISTOITU TOTEUTUKSEN TYÖBRIEF. Sovelluksen toteutus valtuutettiin käyttäjän pyynnöllä näyttää lapa oletuksena kaulassa ykkösnäkymässä ja lähentää se klikkauksesta sallittuun muokkaukseen. Tämä rajattu ensitoteutus korvaa aiemman toteuttamattoman lapasuunnitelman laajemman editorityönkulun tältä osin. Voimassa oleva koko FEATURE BRIEF ja ledger ovat [FEATURE_BRIEF.md:n aktiivisessa nykytilaosiossa](../FEATURE_BRIEF.md#toteutettu-nykytila--lapa-kaulan-yhteydessä-v7-1092026); tutkimukset pysyvät historiallisena näyttönä.

## Tavoite
Oletuslapa näkyy Etu-kuvassa satulan jatkeena. Sen valinta lähentää samaa piirtoaluetta ja avaa vapaan siluetin node- ja kahvamuokkauksen nykyisillä kontekstityökaluilla. Sovita palauttaa koko kitaran.

## Ei-tavoitteet
Ei erillistä lapasivua tai osanavigointipainikkeita, uutta headstock-lomakeluonnosta, vapaasti editoitavaa viritinriviä, globaalia kielivetojen optimointia, valmistusvientiä, migraatiota, Z-akselia tai muutoksia FretFactoryyn/vendor-alueeseen.

## Käyttäjän vahvistamat päätökset
Käyttäjän seitsemänkielinen SVG on tasajaon ja muodon referenssi; 8-kielinen johdetaan siitä yhden reikävälityksen lisäyksellä. M6 Mini pienellä metallinupilla, virittimet yhdellä suoralla reunalla, vakio reunaetäisyys ja tasajako. Muotoa saa rajoittaa virittimien kohdalla. Kaulan ja tallan mittoja ei muuteta lapatuloksen kaunistamiseksi. Vanhojen projektiversioiden tukea ei tarvita.

## Sallitut paikalliset oletukset
Rajattu lapatuki 6/7/8 kielelle. Käytetään viimeksi varmennetun referenssin p=23,659459422 mm, h=12,999420166 mm ja päätyvaroja 15,356555724 / 17,661135847 mm. Kuusikielinen johdetaan samalla säännöllä; pääagentin probe varmisti todelliset oletusmitat (E–E 35,814 mm ja laudan leveys 41,910 mm) sekä M6-tilavarauksen. Lavan perusmuoto säilytetään kanonisessa referenssikoordinaatistossa ja näytön muunnos lasketaan aina tästä, ei kumuloida. Kulman jatkokehitys/optimointi ei sisälly tähän; käytetty tasajakoinen referenssi ei takaa nollakulmaa. Käyttöliittymä kertoo lasketun suurimman satulakulman rehellisesti ilman keksittyä hyväksyntärajaa.

## Käyttäytymispolut
1. Uusi projekti näyttää nykyisen 25,5 tuuman / 22 nauhan / 6 kielen kaulan ja siihen kuuluvan lavan, reiät oikeassa millimetrikoossa. Etukuvan sovitus sisältää koko lavan. Taka ja Tasku säilyvät ennallaan.
2. Lavan klikkaus, kosketus tai Enter/Space valitsee muokkauskohteen ja sovittaa lavan suureen Etu-kuvaan. Pelkkä valinta/kamera ei muuta dokumenttia tai undo-historiaa. Pikkukuva valitsee edelleen näkymän.
3. Satulan kaksi liittymäpäätä ja niiden jatkuvuuden vaatimat kahvat sekä viritinreunan molemmat päät/segmentti/kahvat ovat lukittuja. Kärjen ja vastakkaisen sivun vapaita nodeja/kahvoja voidaan siirtää. Ensiversion lavatyökalut ovat vapaiden nodejen siirto, koordinaatit ja kahvojen veto. Topologian lisäys/poisto, solmutyypin vaihto ja segmenttityypin vaihto jäävät lavassa myöhemmäksi; rungon työkalut säilyvät. Suojattua geometriaa ei saa kiertää muiden työkalujen kautta.
4. Yksi kelvollinen veto tai työkalutoimi on yksi undo-askel. Escape, pointercancel, blur ja näkymän vaihto peruuttavat keskeneräisen vedon. Kelvoton muutos ei korvaa viimeistä kelvollista muotoa; syy näytetään. Sovita poistuu lavan lähennyksestä; runko/kaula/pickup-työkalujen nykyiset polut säilyvät.
5. Satulaliittymä seuraa oikeita laudan reunapisteitä ja sivujen jatkosuuntaa. Kaulan mittojen muuttaminen nykyisessä neckDraftissa säilyttää käyttäjän lavan perusmuodon. 6→8→6 palauttaa muodon samoilla kaulaparametreilla ilman kumuloituvaa skaalausta. Undo/redo sekä tallennus/avaus säilyttävät kaulan ja siihen kuuluvan lavan yhdessä.
6. Nykyinen 1–12-kielinen kaulaeditori ja sen tuonti säilyvät. Lapatukea vailla olevasta kielimäärästä kerrotaan selkeästi eikä kaulamuutosta estetä sen vuoksi. Tuetun kielimäärän fyysisesti ristiriitainen lapa/kaulayhdistelmä ilmoitetaan nykyisessä neckDraftissa korjattavana virheenä; hyväksyttyä kaulaa tai käyttäjän muotoa ei korvata hiljaisesti. Lapatiedot säilyvät paluuta varten. Ei virheellistä M6-mahtuvuusväitettä. Kaulaton dokumentti pysyy kaulattomana; visuaalinen kaulatemplate/lapa otetaan käyttöön vain nykyisen kaulaluonnoksen hyväksynnällä.

## Muutettavat vastuualueet tai tiedostot
src/headstock/ (pieni versionoitu template, muunnokset, suojaukset, tangentit, M6-tilavaraukset ja validointi); model/project.ts ja file/projectFile.ts (v7); store.ts (muokkauskohde ja yhteiset transaktiot); App.tsx, EditorCanvas.tsx, ContextTools.tsx, NumericCoordinate.tsx, neckView.ts ja rajattu CSS. Vastaavat yksikkö-/integraatio-/E2E-testit. Ei lähde-SVG/PDF:n tai suurten tutkimus-JSONien bundlausta.

## Säilytettävät rajat
Kanoninen millimetrigeometria, kiinteä rungon keskinode, nykyinen kaulatasku/päätyvara/pickup-logiikka, satula- ja tallakontaktit, saman kielen indeksit ja yksi tangenttihaara. Virittimen reiät ja osat eivät skaalaudu siluetin mukana. Kaulasuunnittelun nykyinen pending/save/undo-suoja säilyy.

## Tietomalli- ja rajapintamuutokset
Projektiformaatti v7 ja versionoitu kaulaan kuuluva lavan perusmuoto. V1–v6 hylätään ennen työn korvaamista, ei migraatiota. Luku validoi rakenteen, äärelliset koordinaatit, tunnisteet, käyrät, tekniset kokorajat, lukittujen osien muuttumattomuuden sekä tuettujen kielimäärien johdetun hard-geometrian. Kamera ja valintatila eivät ole projektitietoa. Koneistosovituksen tila johdetaan nykyisestä kaulasta/muodosta, sitä ei lueta luotettuna tallennettuna väitteenä.

## Toteutusjärjestys
Geometria ja 6/7/8-oraclet → v7 ja store/transaktiot → Etu-piirto, valinta, lähennys ja node-työkalut → relevantit regressiot ja tuore build → riippumaton QA ja selaintarkistus → nykytiladokumentit.

## Hyväksymiskriteerit
Kaikki yllä olevat käyttäytymispolut toimivat. Suljettu siluetti ei leikkaa itseään tai sisällä degeneraatiota. Bore/aluslevy/koneistorunko/korvake ovat puun sisällä, nupin pyörimisalue puun ulkopuolella, eri koneistojen tilavaraukset eivät leikkaa. Käyrävarmennus ei perustu vain nodejen sijaintiin. Kielijänteet ovat pylvään tangentteja eivätkä leikkaa muita pylväitä/kieliä; kulmapoikkeama näkyy. Liittymät ja viritinreuna säilyvät kaikissa editointipoluissa. Oletus6 sekä kalibroidut7/8 mahtuvat; mahdoton vapaa muoto hylätään. Raja-arvoista ei johdeta fyysisen valmistuksen takuuta.

## Testit ja muut varmennustasot
Geometrian 6/7/8 tunnetut tulokset, vakio pitch/offset/halkaisijat, saumapisteet ja tangentit, kielipisteiden muuttumattomuus, negatiiviset hardware/self-intersection-tapaukset; store dirty/undo/redo/cancel/target/view/new/open, kaulanmuutos ja 6→8→6; v7 roundtrip ja v6/virheellisen rakenteen atominen hylkäys. E2E oletusnäkymä, hiiri/näppäimistö/kosketus, lähennys/Sovita, sallitut ja suojatut editit sekä tallennus/avaus. Projektin komennot peräkkäin: npm run typecheck, npm run test:run, npm run build, npm run test:e2e (sisältää buildin). Käytä jo voimassa olevaa build-näyttöä kun mahdollista. Paikallinen Edge tuoreessa previewssä 4174; desktop ja kapea Chromium-simulaatio, konsoli ja layout tarkistetaan. CUA-host käynnistys estyi ACL-helperiin; projektin Playwright toimii erillisenä paikallisena selainvarmennuksena. Ei fyysistä tai julkaistua näyttöä.

## Dokumentaatiovaikutukset
FEATURE_BRIEF omistaa lopullisen rajauksen ja ledgerin; tämä työbrief liitetään siihen. README ja AGENTS on päivitetty varmennettuun v7-nykytilaan. Historialliset tutkimukset eivät muutu sovellusnäytöksi.

## Riskit
Lukitusten kiertäminen viereisen noden/segmentin kautta, muunnosten kumuloituminen, kaulamuutoksen aiheuttama mahtuvuusvirhe, stale selection/kamera/open, kapean näytön osumat ja liian karkea käyränäytteistys. Tasajako ei takaa suoraa kielivetoa. M6 tarkistus on nimellinen 2D-tilavaraus.

## Ratkaisematta jääneet asiat
Ei käyttäjäpäätöstä estämässä tätä rajattua polkua. Tulevat kulmasäädöt/solver, muut kielimäärät ja hardwaremallit eivät kuulu ensitoteutukseen. feature_architect palautti NO QUESTIONS NEEDED / DESIGN READY. Hänen rajauksensa mukaisesti lavan topologiatyökalut jäävät jatkoon, vapaat node- ja kahvamuutokset toteutetaan nyt.

## Toteutusvaltuutuksen tila ja peruste
VOIMASSA: käyttäjän 10.9.2026 toteutuspyyntö lavan oletusnäkyvyydestä ja klikkaamalla lähennetystä muokkauksesta. Ei Git-/julkaisulupaa. Työnkulkunäytteiden keruu ei ole käytössä. Baseline: tmp/headstock-integration-baseline (91 tiedostoa ja hashes.json).
