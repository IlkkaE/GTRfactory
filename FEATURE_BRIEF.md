# GTRfactory — FEATURE BRIEF v1, suunnittelutarkennus 9

## Julkinen lähdejulkaisu — 15.9.2026

Käyttäjä valtuutti tässä tehtävässä GTRFactoryn nykyisen lähdepuun julkisen GitHub-repositorion, commitin ja pushin. Julkinen repo sisältää sovelluslähteet, testit ja anonymisoidun/repo-relative reference-analysis-provenienssin; CDR-alkuperäiset, buildit, riippuvuudet ja paikalliset testiartefaktit säilyvät .gitignoressa.

Tämä nykytilamerkintä korvaa aiemmat nykytilan väitteet siitä, ettei lähderepoa julkaista. Vanhat ominaisuuskohtaiset "ei commitia/pushia" -rajaukset säilyvät oman historiallisensa toteutuskierroksen lupahistoriassa; ne eivät kumoa tämän pyynnön nimenomaista Git-julkaisulupaa.

## Paikallinen nykytila — 14.9.2026

Kätisyysvalinta on toteutettu editoriin, tallennukseen ja SVG/DXF/PDF-vientiin. Oikeakätisen kaula osoittaa oikealle ja vasenkätisen vasemmalle; tiedoston lopun suuntakorjausosio omistaa tämän tarkennuksen. Nykyinen formaatti on projektiv11 / headstockv3; oikeakätinen v10 voidaan lukea v11:ksi. Tuettuina ovat kolme kitaralapaa ja nelikielinen bassolapa. Tämän tiedoston lopun kätisyysosio ja sen lopullinen ledger omistavat nykyisen muutoksen paikallisen varmennuksen. Aiemmat päivätyt suunnitelmat ja tulokset säilyvät historiallisina. Tätä päivitystä ei ole julkaistu eikä FretFactory-työtilaa muutettu tällä kierroksella.

## Nykyinen tausta- ja julkaisutila — 12.9.2026

Käyttäjä valtuutti uusien taustakuvien käyttöönoton ja nykyisten muutosten
julkaisemisen FretFactory-sivustolla. GTRFactoryn kiinteä WebP-työpajatausta
näkyy tummien läpikuultavien canvas-pintojen läpi. Kuva ei muuta geometriaa,
vientisisältöä, työkaluja tai tallennusformaattia. FretFactoryn päivitetty
selainbuild-snapshot sisältää englanninkielisen UI:n, editorityökalut ja Save-
toiminnon. Aiemmat julkaisukiellot alla ovat historiallista näyttöä; nykyisen
julkaisun rajaus ja erillinen paikallinen/julkinen varmennus ovat FretFactoryn
`docs/workshop-release.md`-tiedostossa. GTRFactoryn lähderepositorio julkaistaan tässä tehtävässä julkisena GitHub-lähteenä.

Taustamuutoksen tarkistukset: 222/222 unit-testiä, muotoilu ja subpath-build PASS.
Itsenäinen selainvarmennus ja toteutunut Pages-julkaisu kirjataan yhteiseen
julkaisulegeriin; tätä merkintää ei pidetä julkisen ympäristön onnistumisväitteenä.

Nykyinen release sisältää avoimen Neck pocket -viennin, suoran `potero-v1`
profiilikorvauksen ja FretFactory-landingin uuden lyhyemmän hero-tekstin.
Julkaisun lopullinen julkinen näyttö kuuluu FretFactoryn workshop-ledgeriin;
GTRFactoryn lähderepositorio julkaistaan tässä tehtävässä erillisenä julkisena GitHub-lähteenä.

## FEATURE BRIEF — unified Save (local-only)

Tila: **TOTEUTETTU JA PAIKALLISESTI VARMENNETTU** (12.9.2026). Tämä osio korvaa aiempien osioiden Save as / Download project file -käyttäytymisen sekä uuden projektin `My guitar` -oletusnimen. Historialliset ledgerit kuvaavat omia lähtötilojaan.

### Tavoite

Yksi **Save** tallentaa nimetyn projektin. Nimetön projekti pyytää nimen. Seuraava tallennus käyttää samaa tiedostoa, kun projektin nimi ei muutu ja selain tukee tiedostokahvaa.

### Ei-tavoitteet

Ei julkaisemista, FretFactory-snapshotin päivitystä, taustakuvien käyttöönottoa, poteron kiertoa, Ctrl+S-oikotietä, kahvojen pysyvää tallennusta tai geometriamuutoksia.

### Käyttäjän vahvistamat päätökset

Save as ja Download project file korvataan yhdellä Save-toiminnolla. Jos selain ei tue ylikirjoitusta, Save lataa uuden kopion ja kertoo rajoituksesta; käyttäjä hyväksyi tämän erikseen. Nimen vaihto pyytää uuden tallennuskohteen.

### Sallitut paikalliset oletukset

Uusi projekti alkaa tyhjällä nimellä ja Name your project -paikkatekstillä. Nimi trimmataan, ja nimeämisdialogi hyväksyy 1–160 merkkiä. Tiedostonimi sanitisoidaan ja saa .gtrfactory-päätteen. Valitsimen fyysinen tiedostonimi ei muuta dokumentin nimeä. Vain viimeisin onnistunut tiedostokahvasidos säilytetään nykyisessä istunnossa.

### Käyttäytymispolut

1. File → Save avaa nimettömälle projektille Name your project -dialogin. Cancel/Esc ei muuta dokumenttia. Hyväksytty nimi tallennetaan dokumenttiin ja tallennus jatkuu samasta käyttäjäaktivoinnista.
2. Ensimmäinen natiivi Save pyytää kohteen. Sama nimi ja projektisukupolvi käyttävät seuraavalla Savella samaa kahvaa. Nimen vaihto pyytää uuden kohteen eikä itsessään muuta vanhaa tiedostoa.
3. Kahva sidotaan vasta onnistuneen write/close-ketjun jälkeen. Virhe abortoi kirjoituksen mahdollisuuksien mukaan, säilyttää virheen ja muokatun työn eikä käynnistä automaattista latausta. Peruuntuneen valitsimen jälkeen Save vapautuu uudelleen käytettäväksi.
4. Ilman tallennusrajapintaa Save aloittaa nimetyn kopion latauksen ja näyttää ylikirjoitusrajoituksen. Sovellus ei voi varmistaa latauksen lopullista levylle tallentumista.
5. Open validoi tiedoston ennen korvaamista. Natiivi avaus sitoo onnistuneesti avatun kahvan; tiedostosyöte ei sido kahvaa. New ja onnistunut Open vaihtavat sidoksen. Peruuntunut, virheellinen tai vanhentunut avaus säilyttää vanhan työn ja sidoksen. Uudelleenlataus unohtaa kahvan.
6. Tallennuksen tilannekuva on syvä kopio. Myöhempi muokkaus jää Modified-tilaan. Projektin vaihtuminen hylkää myöhässä palaavan valitsimen; jo alkanut vanhan tiedoston kirjoitus voi valmistua, mutta ei sido tai merkitse uutta projektia tallennetuksi. Päällekkäiset Savet estetään.
7. Aktiivinen veto sekä keskeneräinen tai virheellinen kaulaluonnos estävät tallennuksen. Nimetyn projektin puhdas kaulapaneeli säilyy auki. Nimettömän projektin puhdas luonnos suljetaan ennen nimeämistä, jotta nimeäminen voi muuttaa dokumenttia.

### Muutettavat vastuualueet tai tiedostot

FileActions.tsx omistaa nimeämisen, istuntokahvan, tallennuksen ja avauksen elinkaaren. projectFile.ts omistaa selainadapterit ja kirjoituksen virhekäsittelyn. App.tsx, model/project.ts, store.ts ja styles.css sisältävät rajatut nimi-/dialogimuutokset. Vastaavat unit- ja E2E-testit päivitettiin. Muutosten vertailupohja on tmp/save-workflow-before-20260912.

### Säilytettävät rajat

v9-skeema, käyttäjän tallentama geometria, millimetriyksiköt, parserin rajat, vientiroolit ja valmistusgeometria säilyvät. Riippuvuudet, lukitustiedosto, AGENTS.md ja index.html eivät muutu. FretFactory-julkaisusnapshot pysyy ennallaan.

### Tietomalli- ja rajapintamuutokset

Ei formaatti- tai migraatiomuutosta. Nimi saa olla tyhjä ennen tallennusta. React-refissä säilyvä {handle, generation, boundProjectName} ei kuulu Zustand-dokumenttiin tai JSON-tiedostoon. Selainadapteri erottaa OpenHandle-, SaveHandle- ja NativeWritable-rajat.

### Toteutusjärjestys

Hyväksytty brief → tiedostoadapteri ja tilannekuva → yksi Save/nimeäminen → Open/New-kahvan elinkaari → virhe- ja kaulaluonnospolkujen korjaukset → regressiot → riippumaton artefakti-QA → nykytiladokumentaatio.

### Hyväksymiskriteerit

Yksi englanninkielinen Save; pakollinen nimi tallennettaessa; saman kohteen ylikirjoitus ja uuden nimen kohdevalinta; selvä kopiolatauksen rajoitus; virheiden ja viiveiden aikana työ säilyy; kahva ei tallennu v9-dokumenttiin; desktop ja kapea näkymä säilyvät käytettävinä.

### Testit ja muut varmennustasot

Ledger erottaa unit/build-tulokset, paikallisen selaimen ja oikean selainartefaktin. OPFS-kahvat varmentavat oikean selaimen kirjoitusrajapinnan, eivät Windowsin tiedostovalitsimen käyttöliittymää. Käyttöjärjestelmän valitsin, julkinen ympäristö ja fyysinen valmistus eivät kuulu varmennettuihin tasoihin.

### Dokumentaatiovaikutukset

README:n oletusnimi ja tallennusohjeet sekä tämä nykytilabrief päivitetään. Aiemmat ominaisuudet ja historiallinen näyttö säilytetään.

### Riskit

Selain voi estää tiedostoluvan tai nimetä ladatun kopion uudelleen. Sidos on istuntokohtainen. Latauksen käynnistyminen ei takaa levylle tallentumista. Myöhässä valmistuvat operaatiot erotetaan projektisukupolvella ja tilannekuvalla.

### Ratkaisematta jääneet asiat

Tuotepäätöksiä tai epäonnistuneita tämän muutoksen hyväksymiskriteerejä ei ole avoinna. Windowsin oma tiedostovalitsin ja julkaistu ympäristö ovat varmentamatta. Selainnäyttö on jaettu kokoajon muuttumattomiin läpäisseisiin tapauksiin sekä lopulliseen rajattuun korjausajoon; uutta yhtenäistä 122/122-kokoajoa ei tehty.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Paikallinen toteutus on valtuutettu käyttäjän yhdistetyn Save-toiminnon pyynnöllä sekä selainlatausvaratien hyväksynnällä. Julkaisukielto säilyy: ei commitia, pushia, deployta eikä snapshotin päivitystä.

### VERIFICATION LEDGER — unified Save

| Tarkistus | Komento tai menetelmä | Tulos / todistettava asia | Ajankohta ja voimassaolo |
|---|---|---|---|
| Unit | `npm run test:run -- --reporter=json --outputFile=tmp/save-workflow-verification/final-unit.json` | 222/222 PASS | 12.9.2026; lopullinen sovelluslähde |
| Build ja tyypit | `npm run build` | PASS; index-Dbe66510.js | 12.9.2026; lopullinen sovelluslähde |
| Muotoilu | `npm run format:check` | PASS | 12.9.2026; lopullinen lähde ja testifixtuurit |
| Koko E2E:n lähtöajo | Playwright, 2 workers, list/json; tmp/save-workflow-verification/full-e2e.json | 112/122 PASS, 10 FAIL. Viisi tapausta kahdessa koossa odotti vanhaa oletusnimeä/historiaa tai tiedostovalitsinta. Ei kokoajon PASS-väitettä. | 12.9.2026; sama lopullinen sovellusbuild, ennen viiden testifixtuurin korjausta |
| Fixtuurikorjaukset | Kaksi rajattua 10 testin ajoa; focused-fixture-regression*.log | Ensimmäinen 8/10: testiin tuotiin vahingossa kaulaton starter. Korjattu varsinaiseen aloitusdokumenttiin. Toinen 8/10: kaksi desktop-aikakatkaisua; mobiilivastineet PASS. Assertioita ei heikennetty. | 12.9.2026; historiallinen epäonnistumisnäyttö, lopputarkistus alla |
| Lopullinen rajattu E2E | Playwright CLI, Save ja viisi korjattua regressiota; `--reporter=list,json --workers=2`; tmp/save-workflow-verification/final-save-regression.json/log | 24/24 PASS, 1.3 min. Seitsemän Save-tapausta ja kaikki viisi korjattua regressiota kahdessa koossa läpäisevät; myös aiemmat kaksi aikakatkaisua. | 12.9.2026; lopullinen build ja testifixtuurit. Kokoajon 112 muuttumattoman tapauksen näyttö säilyy; ei uutta yhtenäistä 122/122-ajoa. |
| Riippumaton selain-/tiedosto-QA | Edge; tmp/save-workflow-verification/runtime-qa.cjs ja report.json; OPFS-readback sekä fallback.gtrfactory | PASS: saman nimen ja Open-kahvan Save muuttavat tiedoston starter-03-koordinaatteja ilman uutta valitsinkutsua. Nimen vaihto säilyttää vanhat tavut; fallback on kelvollinen nimetty v9-JSON ja näyttää kopiorajoituksen. Desktop 1440 px ja mobile 390 px: konsoli-/sivuvirheitä 0, mobiilissa ei vaakaylivuotoa. | 12.9.2026; lopullinen build index-Dbe66510.js. OS-valitsin korvattu testissä oikean OPFS-kahvan palauttavalla adapterilla, ei Windows-dialogin näyttöä. |
| Julkaisu / OS-valitsin | Ei tehty | Julkaisematon; Windowsin natiivia valitsinta ei varmennettu | 12.9.2026; avoin erillinen näyttötaso |

## FEATURE BRIEF — English UI localization (local-only)

Tila: **TOTEUTETTU JA PAIKALLISESTI VARMENNETTU** (12.9.2026). Tämä osio kuvaa nykyisen GTRFactory-sovelluksen englanninkielisen käyttöliittymän; se ei muuta aiempien ominaisuuksien historiallisia brief-osioita.

### Tavoite

Käyttöliittymän, saavutettavuusnimien, dialogien, tila- ja virheviestien, tuonti-/vientitekstien sekä PDF:n ihmislukuisen tekstin yhtenäinen englanti. Uuden projektin oletusnimi on `My guitar` ja HTML-dokumentin kieli `en`.

### Ei-tavoitteet ja säilytettävät rajat

Ei kielivalitsinta, i18n-kerrosta, visuaalista uudistusta tai tallennettujen käyttäjänimien kääntämistä. v9-skeema, avaintunnisteet, vientiroolit ja -tasot, lähdetiedostonimet sekä millimetrigeometria säilyvät. Headstockin näkyvät mallinimet ovat englantia, mutta niiden tunnisteet ja lähdetiedostot eivät muutu.

### Toteutus ja varmennus

Muutos koskee sovelluksen käyttäjälle näkyviä tekstiresursseja ja niiden renderöintiä; NeckWorkspace-ryhmien paikalliset välilehtiavaimet sekä niiden ARIA-tunnisteiden normalisointi ovat ainoa tarkastuksessa todettu rakenteellinen poikkeus. Geometria- ja vientilogiikka säilyivät muuttumattomina.

### VERIFICATION LEDGER — English UI localization

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Sovellustestit | `npm run test:run -- --reporter=json --outputFile=tmp/english-unit.json` | 209/209 testiä, 26 tiedostoa PASS | 12.9.2026; nykyinen lähdekoodi |
| Tyyppi, build ja muotoilu | `npm run build`; `npm run format:check` | PASS; build-assets `index-BAXcERj7.js` ja `pdf-bIP_sEFD.js` | 12.9.2026; nykyinen lähdekoodi |
| Koko E2E | `PLAYWRIGHT_JSON_OUTPUT_NAME=tmp/english-e2e.json node node_modules/@playwright/test/cli.js test --workers=2 --max-failures=3 --reporter=list,json` | 102/102 testiä PASS, exit 0 | 12.9.2026; lopullinen paikallinen production preview 4174 |
| Selain- ja käyttöliittymä-QA | Riippumaton Edge-tarkistus, työpöytä 1440×900 ja mobiili 390×844 | VERIFIED; englanninkieliset polut, ei vaakaylivuotoa, konsoli- ja sivuvirheitä 0 | 12.9.2026; fresh production preview |
| PDF-artefakti | Selainladattu PDF ja tekstin/rakenteen tarkistus | Englanninkieliset otsikot ja ohjeet todettu ladatusta tiedostosta | 12.9.2026; paikallinen artefakti |
| Julkaisu | Git/public snapshot/deploy | Ei tehty; käyttäjä on pyytänyt pitämään muutokset paikallisina | 12.9.2026; avoin |

Fyysistä tulostetta, laitetta, CNC:tä, julkaistua ympäristöä tai julkaisupakettia ei ole tällä muutoksella varmennettu. GTRFactory-repository on edelleen paikallinen/unborn Git-tila; commitia, pushia tai deployta ei tehdä tässä vaiheessa.

## FEATURE BRIEF — editor tools (local-only)

Tila: **TOTEUTETTU JA VARMENNETTU** (12.9.2026). Tämä osio kuvaa editorityökalujen nykyisen käyttäytymisen ja täydentää aiempia historiallisia osioita muuttamatta niitä.

### Tavoite

Toteuttaa käyttäjän viisi muutosta: headstockin avaus neck-editorista, takapoteron suunnan korjaus, alkuperäisen rungon vertailuhaamu, outline-reset sekä nelitilainen magneettigridi. Kaikki uudet käyttöliittymätekstit ovat englanniksi.

### Ei-tavoitteet

Ei fyysistä valmistuskelpoisuusväitettä, 3D- tai Z-mittoja, automaattista muiden osien resetointia, grid-snapin laajentamista numero- tai näppäimistösyöttöön, eikä käyttäjän lataaman Reference overlayn muuttamista built-in Show original body -toiminnoksi.

### Käyttäjän vahvistamat päätökset

Grid kiertää Off → 10 mm → 5 mm → 1 mm → Off ja tarttuu vain rungon pisteiden ja kahvojen osoitinvetoihin. Käyttäjän viiden kohdan toteutuspyyntö sekä Grid-tarkennusten hyväksyntä valtuuttavat paikalliset muutokset. Julkaisukielto säilyy.

### Sallitut paikalliset oletukset

Show original body on oletuksena päällä, istuntokohtainen ja erillinen Reference overlaysta. Reset palauttaa vain outlinen, säilyttää muut osat ja on kumottava ilman erillistä vahvistusta. Grid ja haamu eivät tallennu projektitiedostoon.

### Käyttäytymispolut

1. Headstockin valinta hiirellä tai Enter/Space-näppäimellä avaa headstock-työtilan. Muuttumaton neck-draft suljetaan ilman dokumentti-/historiavaikutusta. Kelvollinen keskeneräinen draft avaa **Apply neck changes and edit headstock?** -modaalin: **Apply and continue** hyväksyy muutoksen yhtenä undo-askeleena ja avaa lavan; **Cancel** tai Esc säilyttää luonnoksen. Virheellinen luonnos jää korjattavaksi.
2. **Show original body** näyttää starter-outlinen ohuena violettina katkoviivana, oletuksena päällä. Kerros ei ota osumia eikä muuta mittoja, kameraa, historiaa tai vientiä. Se näkyy kolmessa runkonäkymässä ja pikkukuvissa, piilotetaan neck/headstock-editoinnissa ja säilyttää checkboxin istuntotilan. **Reference overlay** on erillinen käyttäjän lataama referenssi.
3. **Reset body** palauttaa vain outlinen, säilyttää nimen, neck/headstockin, pickupit ja takapoteron sekä johtaa nykyisen kaulaliittymän tai manuaalisen taskun uudelleen. Muuttava reset on yksi Undo/Redo-askel; ennallaan oleva on no-op. Yhteensopimaton liittymä tai uuden outlinen ulkopuolelle jäävä pickup estää resetin atomisesti. Null-liittymä säilyy nullina. Drag, neck-draft ja headstock-editointi estävät painikkeen käytön. Kamera, yksikkö ja Grid-/haamuasetukset säilyvät.
4. **Grid** kiertää **Off → 10 mm → 5 mm → 1 mm → Off**. Vain rungon solmu- ja kahvaosoitinvedot kohdistuvat maailman millimetrikoordinaatteihin myös Back-näkymässä. Ryhmän ankkurin snap-delta siirtää koko ryhmää muuttamatta suhteita. Smooth-vastakahva noudattaa vanhaa tangenttisääntöä. Numerot, näppäimistö, Add point, headstock, pickupit ja takapotero eivät snapaa. Zoom-outissa piirretään harvemmat viivat, mutta snap säilyy valitussa tarkkuudessa. Off säilyttää vapaan vedon.
5. Takapoteron kanonisen X-muunnoksen merkki korjataan molemmille profiilipoluille. Yleinen Back-peilaus ja vientiroolit säilyvät. Vanhojen v9-projektien keskipiste, koko ja profiiliversio eivät muutu, mutta esikatselu, containment ja vienti käyttävät korjattua suuntaa.

### Muutettavat vastuualueet tai tiedostot

App.tsx omistaa istuntokontrollit ja siirtymädialogin; EditorCanvas.tsx esityskerrokset; editor/grid.ts ja useCanvasInteractions.ts kohdistuksen; store.ts reset-transaktion; model/project.ts starter-outline-kloonin; electronicsCavity/index.ts suuntamuunnoksen. Rajatut tyylit ja vastaavat yksikkö-/store-/E2E-testit päivitettiin. FretFactory-snapshotia ei päivitetä.

### Säilytettävät rajat

v9-tallennus, koneelliset tunnisteet, vientiroolit ja -tasot, käyttäjän tallentama sisältö, canonical millimetreihin perustuva geometria sekä erillinen Reference overlay säilyvät.

### Tietomalli- ja rajapintamuutokset

Ei v9-muutosta tai migraatiota. Storeen lisättiin resetBodyOutline; canvas/hook saa esitys- ja grid-propsit. App omistaa haamun ja Gridin istuntotilan, ei projektidokumentti.

### Toteutusjärjestys

Diagnoosi ja brief → grid-/starter-apurit ja reset → esityskerrokset ja snap → cavity-suuntakorjaus ja neck/headstock-siirtymä → yksikkö- ja E2E-testit → riippumaton selain-/artefakti-QA → reset-testien lähtötilojen vahvistus → dokumentaatio.

### Hyväksymiskriteerit

Edellä kuvatut viisi käyttäytymispolkua toteutuvat. Headstock-siirtymä ei hävitä luonnosta; haamu on ei-interaktiivinen; reset säilyttää muut osat ja kumoutuu täsmällisesti; Grid ei vaikuta rajauksen ulkopuolisiin syötteisiin; takapoteron molemmat profiilit vastaavat Back-suuntaa myös SVG/DXF/PDF-viennissä. Desktop ja 390 px mobiilisimulaatio eivät tuota konsolivirheitä tai vaakavuotoa.

### Testit ja muut varmennustasot

Unit- ja focused-testit, build, format, paikallinen Edge-E2E, riippumaton selain-QA sekä ladattujen SVG/DXF/PDF-artefaktien rakenne- ja visuaalitarkistus on kirjattu ledgeriin alla. Fyysistä paperitulostetta, CAD-ohjelmaa, laitetta tai julkaistua ympäristöä ei ole varmennettu.

### Dokumentaatiovaikutukset

README kuvaa nykyiset editorityökalut; aiemmat historialliset briefit ja ledgerit säilyvät ennallaan.

### Riskit ja ratkaisematta jääneet asiat

Oleelliset riskit ovat resetin liittymä-/pickup-yhteensopivuus, Back-muunnoksen kaksoispeilaus, ryhmäsnapin geometrian vääristyminen ja luonnoksen häviäminen siirtymässä. Näitä on varmennettu testeillä ja paikallisella QA:lla. Sisältöpäätöksiä ei ole avoinna; fyysinen tulostus, kolmannen osapuolen CAD ja julkaistu ympäristö jäävät erillisiksi varmennustasoiksi.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

TOTEUTUSVALTUUTUS KÄYTETTY paikalliseen editorityökalujen toteutukseen. Julkaisu, snapshotin päivitys, commit, push ja deploy ovat edelleen käyttäjän erikseen pidättämät.

### VERIFICATION LEDGER — editor tools

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Unit- ja fixture-testit | `npm run test:run` sekä focused store -ajo | 220/220 koko unit; focused 21/21 PASS; aidosti neckless manual-pocket, muutettu neck/headstock ja kelvollinen expanded-body-pickup ennen reset-hylkäystä | 12.9.2026; lopulliset testit |
| Tyyppi, build ja muotoilu | `npm run typecheck`; `npm run build`; `npm run format:check` | PASS; build `index-0Hy6afwL.js` | 12.9.2026; nykyinen lähdekoodi |
| Koko E2E | `node node_modules/@playwright/test/cli.js test --reporter=list`; tuore `.last-run.json` passed ja listaus 108 testiä | 108/108 PASS; workerin ajotulos ja pääagentin tulostila-/testimäärätarkistus | 12.9.2026; paikallinen production preview; myöhemmät muutokset vain reset-testifikstuureihin ja dokumentaatioon |
| Uudet editoripolut | Kohdennettu desktop/mobile Edge-ajo | 6/6 PASS; headstock, modal, reset, ghost ja grid | 12.9.2026; paikallinen selain |
| Riippumaton QA | Edge 1440×900 ja 390×844 | VERIFIED; konsoli- ja sivuvirheet 0, ei vaakaylivuotoa | 12.9.2026; fresh production preview |
| Vienti-artefaktit | `tmp/editor-tools-qa/back.svg`, `back.dxf`, `back.pdf`; `artifact-check.json` ja Poppler-renderi | PASS; SVG-profiilien 19/47 pistettä vastaavat alkuperäisen profiilin peilausta, DXF 26/64 Cartesian-pistettä täsmäävät; mm-yksiköt, roolit, PDF-vektorit ja ulkoasu tarkistettu | 12.9.2026; ladatut paikalliset artefaktit |
| Julkaisu | Git/public snapshot/deploy | Ei tehty; publication hold voimassa | 12.9.2026; avoin |

Artefaktien ensimmäinen vertailu antoi väärän poikkeaman, koska yksikkötestit olivat ylikirjoittaneet vanhan all.svg/all.dxf-vertailutuloksen. Korjattu riippumaton tarkistus käyttää muuttumatonta ennen-toteutusta otettua lähdeprofiilin kopiota. PDF:n visuaalinen tarkistus tehtiin ladatusta tiedostosta; se ei todista paperin fyysistä mittakaavaa. Porttiristiriitatestiä ei uusittu, koska porttikonfiguraatio ei muuttunut eikä käyttäjän dev-palvelinta pysäytetty.

## FEATURE BRIEF — Neck pocket export matching the editor

Julkaisupäivitys 13.9.2026: tämä korjaus on julkaistu käyttäjän erillisellä luvalla FretFactoryn snapshotissa, commit `3c2aff12890ee20c834c02c540856181ea2b7ea2`, GitHub Pages -ajo `34719976408` PASS. Julkiset desktop/mobile-reitit sekä ladatut SVG/DXF/PDF-artefaktit varmennettu: kuusi manifest-hashia täsmää, taskun SVG/DXF ja PDF-renderi vastaavat hyväksyttyjä artefakteja ja Back-SVG on ennallaan. Näyttö: FretFactoryn `.cache/pocket-release-live/results.json` ja `deployment.md`. Alla olevat tämän toteutuskierroksen julkaisemattomuus- ja valtuutusrajaukset ovat nyt historiallisia. Fyysistä tulostetta, CAD-tuontia tai natiivia tiedostovalitsinta ei varmennettu; GTR-lähderepositorio säilyi tuolloin paikallisena; tämä historiallinen julkaisu ei sisältänyt lähdeluovutusta.

Tila: **TOTEUTETTU JA QA-VARMENNETTU** (13.9.2026). Tämä on nykyinen toteutussopimus. Kaulataskuvienti käyttää samaa kanonista sapluunageometriaa kuin editori: yksi suljettu `CUT_OUTER`-ulkomitta sisältää rungon yläosan materiaalin ja kaulataskun avoimen kaulaloven. “Suljettu” tarkoittaa koko sapluunan ulkoreunaa, ei taskun suun sulkemista.

### Tavoite

Tuottaa SVG-, DXF- ja PDF-viennissä editorin **Neck pocket** -kuvaa vastaava sapluuna. Vientipolku perustuu suoraan `pocketTemplateGeometry(document).cut`-tulokseen ja säilyttää täsmälliset Bézier-, line- ja circularArc-segmentit.

### Ei-tavoitteet

Taskun suun poikki ei lisätä leikattavaa tai viitteellistä sulkuviivaa. Erillistä `ROUTE_NECK_POCKET`-U-reittiä ei tuoteta. Muu editori, v9-tallennus, muut vientiosat, manuaalinen tasku ja julkaisu eivät kuulu tähän korjaukseen.

### Käyttäjän vahvistamat päätökset

Tulosteen on vastattava editorin Neck pocket -kuvaa: rungon yläosan materiaali säilyy ja tasku jää kaulan tulosuunnasta avoimeksi koloksi.

### Sallitut paikalliset oletukset

Taskun alareuna on sama jaettu oletus kuin editorissa: `max(pocket end Y) + 20 mm`. Keskiviiva viedään vain valittuna ja sen rooli on `REFERENCE_CENTERLINE`, rajattuna vientialueen sisään. **Nut/bridge references** on keskiviivasta erillinen valinta eikä lisää taskun suulle viivaa.

### Käyttäytymispolut

1. **Neck pocket** valittuna kaikki kolme formaattia muodostavat yhden suljetun `CUT_OUTER`-perimeterin, joka kiertää rungon yläosan ja liittyy taskun sivuihin, päätyyn ja kaariin ilman suun poikki kulkevaa segmenttiä.
2. Vienti säilyttää editorin kanoniset segmentit ja 1:1 millimetrit. Valinnainen keskiviiva on erillinen katkoviivainen `REFERENCE_CENTERLINE`.
3. Puuttuva kaula tai virheellinen yhteinen taskutemplate estää viennin ja näyttää jaetun diagnostiikan; manuaalista fallbackia ei käytetä.

### Muutettavat vastuualueet tai tiedostot

`src/export/geometry.ts`, `src/export/export.test.ts`, `tests/e2e/export.spec.ts`, README ja tämä brief. Editorin template-geometriaa ei muutettu.

### Säilytettävät rajat

Geometria pysyy kanonisena millimetrimallina, exportin olemassa oleva rajaus ja kierto säilyvät, ja muut osat sekä vientiroolit pysyvät ennallaan. Suljettu kokonaisperimeter ja avoin taskun suu pidetään eri käsitteinä.

### Tietomalli- ja rajapintamuutokset

Ei tallennus- tai julkisen rajapinnan muutosta. Kaulataskun yhtenäinen polku käyttää `CUT_OUTER`-roolia; `ROUTE_NECK_POCKET` poistuu tästä vientipolusta. Keskiviivan tarkka rooli `REFERENCE_CENTERLINE` säilyy.

### Toteutusjärjestys

Yhteisen template-polun käyttö viennissä, vanhan U-reitin ja suu-viitteen poisto, regressiontestit, build/format, selain- ja artefaktivarmennus sekä dokumentaation synkronointi.

### Hyväksymiskriteerit

Editorin ja SVG/DXF/PDF-viennin taskun perimeterin segmentit täsmäävät; rungon yläosan materiaali on mukana; taskun suu on avoin; ylimääräistä `ROUTE_NECK_POCKET`-reittiä tai mouth-bridgeä ei ole; invalid/missing-neck-polut fail closed; muut exportit säilyvät.

### Testit ja muut varmennustasot

Focused export 28/28 PASS, koko unit 227/227 PASS, buildin tyyppitarkistus ja format PASS. Kohdennettu Playwright-vienti `export.spec.ts` 8/8 PASS tuotantopreview’ssa desktop/mobile-projekteilla; koko E2E-ajoa ei uusittu. Erillinen artefaktikoe käytti kokoja 1440×900 ja 390×844. Kuusi tuoretta SVG/DXF/PDF-latausta tarkistettiin: SVG vastasi editoria 251 näytteellä (suurin ero 0,000407838 mm), kummankin DXF:n 19 segmenttiä ja 64 pistettä täsmäsivät ladattuun SVG:hen, molemmat PDF:t olivat yksisivuisia (888,656 × 917,626 pt). Rootin visuaalinen tarkistus vahvisti yläosan materiaalin ja avoimen kolon; molempien renderöityjen PNG-kuvien SHA-256 oli `7B85BD499C8E24BBA1A9EACB5BA711CB0D88939F8A49D1A4E3EC50A75695D3CD`. Selainvirheet 0. Popplerin olemassa oleva Symbol-fonttivaroitus ei estänyt renderöintiä. Riippumaton QA-verdict: VERIFIED, lähdekatselmuksen ja rootin artefaktinäytön perusteella.

### Dokumentaatiovaikutukset

README:n vanha U-only-kuvaus korvataan tällä nykytilalla. Julkaistua ympäristöä, fyysistä paperitulostetta, natiivia Save As -dialogia tai kolmannen osapuolen CAD-tuontia ei ole varmennettu.

### Riskit

Fyysinen jyrsintä ja paperin mittakaava ovat edelleen todentamatta. PDF:n Symbol-fonttivaroitus on tunnettu renderöintivaroitus.

### Ratkaisematta jääneet asiat

Ei avoimia toteutuspäätöksiä tässä korjauksessa. Julkaisu ei kuulu tähän kierrokseen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Toteutusvaltuutus käytetty käyttäjän pyytämään tulostuskuvan korjaukseen. Ei julkaisu-, commit- tai deploy-valtuutusta tässä tehtävässä.

### VERIFICATION LEDGER — current Neck pocket export

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Unit, type, build, format | `npm run test:run`; `npm run build` (sisältää `tsc -b`); `npm run format:check` | 227/227 unit PASS; tyypit, build ja format PASS; bundle `index-D2Qet-nP.js`, SHA-256 `BB4A8CCB73E8CFE6BA5E7AD18CCDC56915040363C1F4B1C9AEE73B8297562304` | 13.9.2026; nykyinen lähde |
| Export regression | `npm exec vitest run src/export/export.test.ts` | Ensimmäinen ajo 26/28: kaksi fixture-virhettä. Korjattu ajo 28/28 PASS; korjaukset koskivat vanhentunutta radius-snapshotia ja käytetyn upper-chainin ulkopuolista NaN-solmua | 13.9.2026; nykyinen lähde |
| Browser export | Playwright `tests/e2e/export.spec.ts` | 8/8 PASS production preview’ssa desktop/mobile; console/page errors 0 | 13.9.2026; paikallinen Edge |
| Downloaded artifacts | `tmp/pocket-body-qa/browser.cjs`, `results.json`, SVG/DXF/PDF + Poppler | 6 latausta tarkistettu; editoripariteetti, DXF-rakenteet ja PDF-renderöinti hyväksytty; QA VERIFIED | 13.9.2026; paikalliset artefaktit |
| Publication / physical output | Git/public environment, paper, native Save As, CAD | Ei tehty / ei varmennettu | 13.9.2026; avoin |

## FEATURE BRIEF — open neck-pocket export (historical / superseded)

Tila: **HISTORIALLINEN / SUPERSEDED**. Tämä osio säilytetään päätös- ja varmennushistoriana; sen open-U-only-sopimus ei kuvaa nykyistä toteutusta.

### Tavoite

Viedä **Neck pocket** -valinnalla avoin U-muotoinen jyrsintäraja kaulan tulosuunnasta. Vientiin kuuluvat taskun sivut ja pää nykyisellä kulmasäteellä ja sovitusvaralla sekä valinnaiset keskilinja ja mittatiedot.

### Ei-tavoitteet ja säilytettävät rajat

Vientiin ei kuulu ympäröivä rungon tai yläosan template-ääriviiva (`CUT_OUTER`) eikä taskun suuta sulkeva `REFERENCE`-viiva. Tämä koskee vain vientiä: editorin suljettu upper-template preview säilyy. Muu osavienti, v9-skeema, canonical millimetreihin perustuva geometria, kaaret ja `fitAllowance` säilyvät. Manuaalista fallback-vientiä ei ole.

### Käyttäytymispolut

1. **Neck pocket** valittuna SVG-, DXF- tai PDF-vienti muodostaa avoimen U:n kaulan tulosuunnasta ilman ympäröivää body/template-leikkausreunaa ja ilman suun sulkevaa referenssiviivaa.
2. Keskilinja ja mittatiedot ovat valinnaisia vientisisältöjä eivätkä sulje U:ta. Vientigeometria säilyy mm-pohjaisena; pyöristykset ovat analyyttisia ympyräkaaria ja nollasäteinen tasku kolme suoraa viivaa.
3. Jos kaula puuttuu, vienti estyy viestillä **No neck has been created**. Käyttäjän käsin tekemää manuaalista taskua ei käytetä tämän vientipolun varakappaleena.

### Hyväksymiskriteerit

Kaulataskun SVG/DXF/PDF sisältävät avoimen U:n oikeassa tulosuunnassa; `CUT_OUTER` ja mouth-`REFERENCE` puuttuvat; valinnainen keskiviiva, mitat, kaaret ja sovitusvara säilyvät; editorin suljettu preview ja kaikki muut exportit säilyvät.

### Testit ja muut varmennustasot

Focused export -ajo 27/27 PASS. Koko unit-ajo 224/224 PASS koskee samaa tuotantolähdettä ennen viimeisiä testilisäyksiä; koko ajoa ei uusittu testilisäysten jälkeen. Kohdennettu export-E2E 8/8 PASS desktop- ja mobiilipoluilla sekä typecheck/build/format PASS. QA varmisti SVG/DXF/PDF-matriisin refs OFF/ON -tiloissa, ladatut artefaktit ja visuaalisen PDF-renderöinnin. Fyysistä paperitulostetta, CAD-ohjelmaa, natiivia Save As -dialogia tai julkaistua ympäristöä ei ole varmennettu.

### Käyttäjän vahvistamat päätökset

Ulompi sapluunareuna pois; kaulatasku avoimena kaulan tulosuunnasta.

### Sallitut paikalliset oletukset

Sama korjaus koskee kaikkia kolmea vientiformaattia. Valinnainen keskilinja, mittatiedot, nimi ja kalibrointi säilyvät; suuaukon ylittävää referenssiä ei jätetä vientiin.

### Muutettavat vastuualueet tai tiedostot

`src/export/geometry.ts`, `src/export/model.ts`, `src/editor/ExportDialog.tsx`, `src/export/export.test.ts`, `tests/e2e/export.spec.ts`, README ja tämä brief.

### Tietomalli- ja rajapintamuutokset

Ei tallennus- tai julkisen rajapinnan muutosta. Nykyinen `ROUTE_NECK_POCKET`-rooli korvaa erillisen taskuviennin `CUT_OUTER`-roolin; polku on avoin. Sisäinen osatunniste `pocket` säilyy.

### Toteutusjärjestys

Automaattisen taskun avoin vientiraja, referenssin poisto ja englanninkieliset nimet, regressiontestit, riippumaton selain- ja artefaktitarkistus, dokumentaatio.

### Dokumentaatiovaikutukset

README kuvaa avoimen viennin erillään editorin muuttumattomasta yläosasapluunasta. Tämä osio täsmentää historiallista vientisopimusta.

### Riskit

Fyysistä mittakaavaa tai jyrsintätulosta ei ole kokeiltu. PDF-renderöinnin Symbol-fonttivaroitus ei estänyt kuvan tarkastusta. Kalibrointimerkin aiempi yhdistetty piirto säilyy; sitä ei muutettu tässä työssä.

### Ratkaisematta jääneet asiat

Ei avoimia toteutuskysymyksiä tässä rajauksessa. Julkaisu ja fyysinen valmistusvarmennus eivät kuulu tähän kierrokseen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Toteutusvaltuutus käytetty paikallisesti käyttäjän pyytämään ulkoreunan poistoon ja vahvistukseen “Kaulan tulosuunnasta avoimena”. Ei uutta commit-, push- tai julkaisulupaa.

### VERIFICATION LEDGER — open neck-pocket export

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Unit- ja focused-testit | `npm run test:run`; `npx vitest run src/export/export.test.ts` | 224/224 koko unit ennen viimeisiä testilisäyksiä, samalla tuotantolähteellä; final focused 27/27 PASS | 12.9.2026; tuotantolähde muuttumaton |
| E2E | `npx playwright test tests/e2e/export.spec.ts --workers=2 --reporter=list` | Ensin 6 PASS / 2 FAIL: uusi testi kielsi myös sallitut nimi- ja kalibrointiviitteet. Testiodotuksen rajauksen jälkeen 8/8 PASS | 12.9.2026; lopullinen build |
| Build ja muotoilu | typecheck, build, format:check | PASS; build `index-CkSYTKqa.js` | 12.9.2026; nykyinen lähde |
| Artefaktit ja QA | `tmp/open-pocket-qa/*`, Edge desktop/mobile × refs OFF/ON × SVG/DXF/PDF; Poppler ja rootin kuvakatselmus | 12 tuoretta latausta PASS; SVG 77.968806 × 72.045378 mm/viewBox, DXF `INSUNITS=4` ja `ROUTE_NECK_POCKET` ilman `CUT_OUTER`; PDF:n avoin suu ja keskiviiva/mitat tarkistettu. PDF yksi sivu 680.315 × 300.601 pt. QA VERIFIED, konsoli/assetit PASS | 12.9.2026; viitevalinta asetettu jokaisen formaattivaihdon jälkeen; aiempi QA-skriptin ennen formaattivaihtoa asettama viitepari ei ollut kelvollista näyttöä |
| Julkaisu | Git/public snapshot/deploy | Ei tehty; publication hold voimassa | 12.9.2026; avoin |

## FEATURE BRIEF — direct electronics-cavity profile replacement (local-only)

Tila: **TOTEUTETTU JA QA-VARMENNETTU** (12.9.2026). Tämä osio kuvaa nykyisen `potero-v1` / version 1 -profiilin suoran korvauksen ja säilyttää aiemmat potero-osioiden historialliset merkinnät.

### Tavoite

Korvata hyväksytyllä potero-SVG-lähteellä `potero-v1` suoraan sekä uusissa että olemassa olevissa v9-dokumenteissa, jotta editori ja vienti käyttävät samaa nykyistä lähdegeometriaa.

### Ei-tavoitteet ja säilytettävät rajat

Ei schema-migraatiota, uutta profiili-ID:tä tai versionvaihtoa. Tallennettu keskipiste, vaakamitta, pystymitta, Back-muunnos, muut editori- ja vientipolut sekä v9 säilyvät. Lähdesivun 237 × 123 mm koko ei ole poteron geometriaraja.

### Käyttäytymispolut

1. Uusi starter-potero ja olemassa olevan v9-dokumentin `potero-v1` käyttävät samaa Desktop-lähteestä sovelluskoodiin muunnettua profiilia. Sovellus ei tarvitse alkuperäistä Desktop-tiedostoa ajon aikana.
2. Nykyisen lähdeprofiilin ulkorajan mitat ovat 176.06686788504933 × 81.36283544639431 mm, minX 27.481942 ja minY 26.03734748455872. Nämä ovat uuden projektin horizontalMm/verticalMm-oletukset. Oletussijainti säilyy `(centerXmm=0, centerYmm=210)`; Back-transform vaihtaa akselit ennallaan.
3. Ulko- ja sisäprofiilit ovat suljettuja; ulkoreunassa on 5 kuutiollista Bézier-käyrää ja 3 suoraa, sisäreunassa 14 kuutiollista Bézier-käyrää ja 4 suoraa. Nykyiset vientiroolit säilyvät, mutta niiden geometria vaihtuu hyväksytysti uuteen muotoon.

### Käyttäjän vahvistamat päätökset

Suora korvaus samalla profiilitunnisteella ja versiolla, vaikka olemassa olevien projektien valmistusgeometria muuttuu. Ei tässä pyynnössä julkaisulupaa.

### Sallitut paikalliset oletukset

Uusi projekti käyttää lähdepolun luonnollisia mittoja ilman sivumarginaaleja tai strokea. Vanha projekti säilyttää tallennetut mitat ja keskipisteen; sisä- ja ulkoreuna käyttävät samaa ulkorajoihin perustuvaa muunnosta.

### Muutettavat vastuualueet tai tiedostot

`src/electronicsCavity/index.ts`, `src/model/project.ts` (vain starter-mitat), `src/electronicsCavity/index.test.ts`, `src/export/export.test.ts`, README, tämä brief ja AGENTSin nykytilan mitat.

### Tietomalli- ja rajapintamuutokset

Ei rakennemuutoksia eikä migraatiota. `potero-v1` / versio 1 tarkoittaa käyttäjän hyväksymänä poikkeuksena uutta geometriaa myös olemassa olevissa v9-projekteissa.

### Toteutusjärjestys

Lähdepolkujen tarkka muunnos, analyyttisten ulkorajojen ja starter-mittojen päivitys, regressiontestit ja build, riippumaton lähdekatselmus, rootin selain-/artefaktivarmennus, dokumentaatio.

### Hyväksymiskriteerit

Uusi ja olemassa oleva v9 käyttävät korvattua sama-ID-profiilia ilman migraatiota; tallennettu centre/vaaka-/pystymitta eivät muutu; molemmat polut ovat suljettuja ja Back-suunta säilyy; kaikki muut ominaisuudet, mukaan lukien avoin Neck pocket -vientikorjaus, säilyvät.

### Testit ja muut varmennustasot

Final focused 38/38 ja full unit 227/227 PASS, build ja format PASS. Kohdennettu rear-cavity + export E2E 12/12 PASS desktop/mobile. Riippumaton lähde-, selain- ja artefakti-QA VERIFIED; ladatut SVG/DXF/PDF-tiedostot tarkistettiin. Fyysistä paperia, CAD-tuontia, natiivia Save As -dialogia tai julkaistua ympäristöä ei ole varmennettu.

### Dokumentaatiovaikutukset

README kuvaa uuden nykyisen geometrian ja erottaa sen aiemmista historiallisista mittamerkinnöistä. AGENTS sisältää vain nykytilan mittoja täydentävän annotaation; vanha kierrosloki säilyy.

### Riskit ja ratkaisematta jääneet asiat

PDF:n Poppler Symbol-fonttivaroitus on pre-existing renderöintivaroitus eikä estänyt visuaalista tarkistusta. Ei avoimia toteutuspäätöksiä; julkaisu ja fyysinen valmistusvarmennus ovat tämän rajauksen ulkopuolella.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

TOTEUTUSVALTUUTUS KÄYTETTY käyttäjän nimenomaiseen suoraan `potero-v1`-profiilin vaihtoon myös olemassa olevissa v9-projekteissa. Käyttäjän ilmoittama noin tunnin ohjelmajulkaisun perustelu ei ole tämän työn itsenäisesti varmennettua näyttöä. Commit, push, snapshot-päivitys ja deploy eivät kuulu tähän kierrokseen.

### VERIFICATION LEDGER — direct cavity replacement

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Lähdeprofiili | Desktop `potero.svg`, SHA-256 `FA26B9BA4415E01F357636796EF7C307A88A59B091EAA0C76E54B2AAE77A80A5` | Ulkoraja 176.06686788504933 × 81.36283544639431 mm; sivu 237 × 123 mm erillinen | 12.9.2026; nykyinen lähde |
| Ensimmäiset tarkistukset | Lähdekatselmus ja focused-testit | Ensimmäinen 10/10 ei todistanut oikeita mittoja: ohjauspistekuori korjattiin analyyttisiksi Bézier-rajoiksi. Myös väärä 15 Bézier-segmentin testiodotus korjattiin lähteen 14 segmentiksi. | 12.9.2026; korvattu lopullisella näytöllä |
| Unit/focused | `npm run test:run`; `npx vitest run src/electronicsCavity/index.test.ts src/export/export.test.ts` | Full unit 227/227; focused 38/38 PASS | 12.9.2026; lopullinen lähde |
| Build/format | `npm run build`; `npm run format:check` | PASS; build `index-ClTnX1hl.js` | 12.9.2026; nykyinen lähde |
| Kohdennettu E2E | `npx playwright test tests/e2e/rear-cavity.spec.ts tests/e2e/export.spec.ts --workers=2 --reporter=list` | 12/12 PASS desktop/mobile | 12.9.2026; paikallinen preview |
| Riippumaton lähde-QA | Arkkitehdin vain luku -vertailu alkuperäiseen SVG:hen ja lähtökopioon | VERIFIED; tarkat käyrät, rajat ja ennallaan säilyvä muunnos. Yhteensopivuustesti käyttää ohjelmallista v9-fixturea. Erillisen qa_verifier-agentin jatkaminen estyi agenttirajaan; root teki selain- ja artefaktikokeet. | 12.9.2026; lopullinen lähde |
| Selain ja artefaktit | `tmp/cavity-replacement-qa/browser.cjs` ja `tmp/cavity-replacement-qa/results.json`; kuusi SVG/DXF/PDF-latausta desktop/mobile | PASS; konsoli/pageerror/assetit/overflow 0. Lähdevertailu 101 pistettä per reuna: max 0.000324 mm canvas, 0.000453 mm SVG. DXF:n 90 pistettä per lataus täsmäsivät SVG:hen 0.000002 mm toleranssilla. | 12.9.2026; paikalliset artefaktit |
| PDF-kuva ja metadata | Poppler-renderit, rootin kuva-arvio ja `pdfinfo` | Molemmat reunat näkyvät oikein. Yksi sivu 1676.13 × 1030.66 pt; desktop/mobile-renderit identtiset (SHA-256 `8785357096EC7B230C11DAD443711F56CEB127718F32A0B3CC565280E60900D8`). | 12.9.2026; ei fyysisen tulosteen näyttö |
| Julkaisu | Git/public snapshot/deploy | Ei tehty; publication hold voimassa | 12.9.2026; avoin |

Päiväys: 6.9.2026  
Tila: **DESIGN READY** koko v1:n suunnitelmalle; runkoeditorivaihe valmistui 6.9.2026 ja sen mittaviiva-, haamu- ja bodytemplate-laajennus on toteutettu sekä QA-varmennettu 8.9.2026.  
Integroitu kaulasuunnittelu, automaattinen tasku ja lapaeditorin rajattu ensiversio on toteutettu; voimassa oleva näyttö on tämän tiedoston lopussa.
Tämä brief säilyttää koko v1:n suunnitelman, toteutusrajat ja varmennusledgerin. README kuvaa toteutunutta editorin nykytilaa. Käyttäjän 6.9.2026 tarkennus: oma runkomalli ja eri muotokielten hybridit ovat päätavoite. Geneerisen Strat-aloitusmuodon ei tarvitse jäljentää mitään tiettyä tehdasmallia. Tarkennus 3 määrittää kolmen näkymän käyttöliittymän ja kahden muokkaustyökalun ehdotuksen. Tarkennus 4 määrittää kaulataskusapluunan rungon yläosan muotoiseksi kappaleeksi, jossa on taskuaukko. Tarkennus 5 rajaa etu- ja takanäkymän sisällöksi rungon ulkoreunan ja keskiviivan. Tarkennus 6 lisää joka näkymään leveys- ja pituussuunnan mm/tuuma-asteikot. Tarkennus 7 tasaa suuren näkymän ulkokehyksen ylä- ja alareunan oikeanpuoleisen pikkunäkymäpinon kanssa. Tarkennus 8 vahvistaa suoran solmu- ja kahvamuokkauksen rungon muotoilutavaksi; muodon valitsevat geometriavalikot eivät kuulu työnkulkuun. Tarkennus 9 kirjaa toteutusvalmiusarvion ja käyttäjän vahvistaman laakeriterään perustuvan 1:1-sapluunamenetelmän. Myöhempi toteutustarkennus vaihtoi runkoeditorin käynnistysmuodoksi käyttäjän `CDR/bodytemplate.svgz`-aineistosta ennalta muunnetun 21 solmun käyrän sekä lisäsi rungon ääriarvoihin perustuvat mittaviivat, katkoviivaisen keskiviivan, istuntokohtaisen haamureferenssin ja lukitun kaulaliittymän.

## Tavoite

Helppokäyttöinen 2D-vektorieditori oman sähkökitaran rungon suunnitteluun. Käyttäjä aloittaa ennalta muunnetusta bodytemplate-lähtömuodosta, muotoilee runkoa vapaasti ja yhdistää eri muotojen osia omaksi hybridikseen. FretFactory-tuonti kohdistaa kaulan ja kielten osumalinjan tallalla. Valmiista omasta suunnitelmasta viedään kolme sapluunaa: etu, taka ja kaulatasku.

Helppous tarkoittaa rungon solmujen ja niiden kahvojen suoraa muokkausta, solmuryhmien muotoilua ja ääriviivan osien yhdistelyä samassa piirtoalueessa. Aloitusmuodon solmujen lukumäärä tai muoto ei rajoita lopputulosta.

Mittatarkkuus tarkoittaa käyttäjän oman suunnitelman mittojen säilymistä editorista sapluunaan. 1:1-vienti on samankokoinen kuin käyttäjän millimetreinä määrittämä malli. Rungon ei tarvitse vastata olemassa olevan tehdaskitaran muotoa tai mittoja. Kaulan mitat ja kaulataskun sovitus säilyvät teknisinä vaatimuksina.

## Ei-tavoitteet

- Olemassa olevien kitaramallien tarkat tehdaskopiot tai valmiiksi varmennettujen 1:1-kitaramallien kirjasto.
- Automaattinen kokorungon prosenttimorfaus ja kaikkien 142 CDR-mallin suora tuonti. Hybridi toteutetaan käyttäjän ohjaamalla osien yhdistelyllä ja muotoilulla.
- Mikrofonien, elektroniikan, tremolon ja muiden laitteiden kolot tai poraukset.
- Tallan fyysiset mitat, kiinnitysreiät, tallakirjasto ja intonaatiokompensaation laskenta.
- 3D-rungot, vatsaviisteet, käsivarren viisteet, kaarevat kannet, kaulan kallistuksen tai korkeuden ratkaiseminen.
- G-koodi, työstöradat, konekohtainen CAM ja automaattinen laserin leikkausraon kompensointi.
- Mielivaltaisen SVG- tai PDF-tiedoston automaattinen tulkitseminen FretFactory-kaulaksi.
- Pilvitili, yhteistyömuokkaus ja sovelluskauppajulkaisu.

## Käyttäjän vahvistamat päätökset

1. Aloitusmuoto on käyttäjän `CDR/bodytemplate.svgz`-aineistosta ennalta muunnettu runko. Se ei ole minkään tietyn mallin, vuosikerran tai tehdasmitoituksen 1:1-jäljennös. Aiempi geneeristä Strat-tyyliä koskenut lähtömuotopäätös on tämän tarkennuksen myötä korvattu tällä käyttäjän toimittamalla lähteellä.
2. Ensimmäisessä versiossa etu- ja takasapluunoissa on rungon ääriviiva. Muut laitekolot tulevat myöhemmin.
3. Erillinen kaulataskusapluuna kuuluu ensimmäiseen versioon.
4. Tuotosten pitää palvella sekä 1:1-paperitulostusta että laser-/CNC-vektorityönkulkua.
5. Tallasta tarvitaan vain linja, jolla kielet osuvat tallaan, ei muita tallan mittoja.
6. Kaulan kantapään pääty, taskun pituus ja sovitusvara täydennetään GTRfactoryssa tuonnin jälkeen.
7. CDR-mallit edustavat käyttäjän mahdollisesti tavoittelemia muotoja. Myös niiden väliset hybridit pitää voida suunnitella.
8. Ohjelman tarkoitus on antaa käyttäjälle mahdollisuus suunnitella oma malli, eikä tarjota olemassa olevien kitaroiden valmiita 1:1-kopioita.
9. Käyttöliittymä käyttää samoja tekniikoita kuin FretFactory.
10. Esillä on kolme näkymää: yksi suuri muokkausnäkymä ja kaksi pientä esikatselua, kumpikin 1/4 suuren koosta. Etu-, taka- ja kaulataskun routing-näkymän voi valita suureksi painikkeilla 1, 2 ja 3. Suuressa näkymässä tehdyt muutokset päivittyvät samalla muihin näkymiin.

11. Kaulataskun routing-sapluunassa on kaulataskun vaatima kolo ja kitaran rungon yläosa. Sen ulkomuoto seuraa käyttäjän suunnitteleman rungon yläosaa.

12. Etu- ja takanäkymissä näytetään bodyn ulkoreunan muoto ja keskiviiva. Kaulataskua ei korosteta eikä esitetä erillisenä sisärajana näissä kuvissa. Käyttäjän 8.9.2026 integraatiotarkennus lisää etunäkymään oikein sijoitetun kaulan satulaan asti ilman nauhoja; rungon reunaviiva näkyy kaulan läpi liittymässä. Tarkennus koskee suunnittelun esikatselua, etu- ja takasapluunoiden valmistusraja säilyy rungon ääriviivana.

13. Kaikissa kolmessa kuvassa on leveys- ja pituussuunnan mm/tuuma-asteikot mittasuhteiden arviointia varten.

14. Suuren ikkunan yläreuna on ylemmän pikkunäkymän yläreunan tasalla ja alareuna alemman pikkunäkymän alareunan tasalla.

15. Rungon muotoilu tehdään suoraan esikatselussa nodeilla eli solmuilla ja niihin liittyvillä työkaluilla. Geometriaa kuvaavat valikot eivät ole rungon muotoilutapa.

16. Ensimmäisen version sapluunat tehdään laakeriterälle, jonka laakeri ja terä ovat saman halkaisijan kokoiset: 1:1-sapluuna ilman kopioholkkikorjausta. Käyttäjä vahvisti tämän toteutusvalmiusarvion yhteydessä 6.9.2026.

## Sallitut paikalliset oletukset

- Ensiversio on tietokoneen selaimessa toimiva sovellus, jota käytetään hiirellä ja näppäimistöllä. Projektit tallentuvat paikallisiksi tiedostoiksi.
- FretFactoryn lähdekoodista varmennettu toteutuspohja: React ja TypeScript, Vite, Zustand-tilanhallinta, Reactin renderöimä SVG sekä CSS Grid. Sama pino valitaan GTRfactoryyn. FretFactoryn Paper.js on taustagrafiikassa, eikä nykyinen Preview ole Paper.js-editori. Geometriaydin pidetään käyttöliittymästä riippumattomana.
- Pikkunäkymän aiempi 1/4-koko tulkitaan tarkennuksen 7 jälkeen likimääräiseksi pinta-alatavoitteeksi. Ulkokehysten ylä- ja alareunojen tasaus on ensisijainen; otsakkeet, asteikkokaistat ja pikkunäkymien väli huomioidaan kokonaiskorkeudessa. Suuri piirtoalue täyttää jäljelle jäävän korkeuden. Tämä ei tarkoita valmistusmittakaavaa 1:4.
- Työpöydällä suuri näkymä on vasemmalla ja pienet päällekkäin oikealla. Kapealla näytöllä pienet asettuvat rinnakkain suuren alle. Jokaisen näkymän identiteetti säilyy: 1 = etu, 2 = taka, 3 = kaulatasku.
- Pienin käytännöllinen työkalusarja on tässä suunnitteluehdotuksessa kaksi pysyvää tilaa: Muotoile ja Piirrä osuus. Solmukomennot näkyvät valinnan yhteydessä. Tämä on suunnitteluratkaisu käyttäjän pyytämään arvioon, ei väite käyttäjän erillisestä työkalumäärän hyväksynnästä.
- Kanoninen geometria tallennetaan millimetreinä. Millimetri- ja tuumanäyttö eivät muuta tallennettuja mittoja. Asteikot käyttävät yhteistä mm/tuuma-valintaa; muunnos on täsmälleen 25,4 mm = 1 in.
- Asteikkojen nollapisteeksi oletetaan x = 0 keskilinjalle ja y = 0 kaulan liittymän suulle. Suunnat nimetään samassa koordinaatistosopimuksessa kuin kaulatuonti. Takaa katsottuna vaakakoordinaattien suunta peilautuu geometrian mukana; numeroiden teksti pysyy oikein päin.
- Aiempi keskusteluluonnoksen käsin kirjoitettu Bézier-muoto ei määritä nykyistä lähtörunkoa. Nykyinen käynnistysmuoto on `CDR/bodytemplate.svgz`-aineistosta muunnettu ja sen koordinaatit ovat millimetrejä.
- Rungolla on yksi suljettu ääriviiva. Sen segmentit voivat olla suoria tai kuutiollisia Bézier-käyriä, ja pisteet sileitä tai kulmikkaita.
- Hybridin perustyökalu kopioi yhden yhtenäisen ääriviivan osan ja korvaa sillä käyttäjän valitseman osan omasta rungosta. Liittymiä ja osan muotoa voi muokata ennen hyväksymistä.
- Muotolähteenä voi käyttää tallennettua omaa GTRfactory-runkoa tai erikseen valmisteltua yksittäistä SVG-ääriviivaa. SVG:stä valitaan ääriviiva ja sen sijoituskoko nimenomaisesti; koko piirustusarkista ei arvata valmistusrunkoa. Tuonnin yksikkötulkinta ja käyttäjän haluama koko näytetään. Nämä muotolähteet ovat erillisiä FretFactory-kaulatuonnista.
- Bodytemplate-lähtömuodon mitat säilyvät ohjelman oletusarvoina ja käyttäjä voi muuttaa vapaata ääriviivaa. Lähteen fyysinen valmistusmittaus ei ole editorin käynnistymisen ehto.
- Etu ja taka ovat saman rungon näkymiä. Takasapluuna peilataan pitkittäisen instrumenttiakselin suhteen; se ei ole erikseen muokattava runkokopio.
- Kaulataskusapluunan alareuna rajataan kaula-akseliin nähden poikittaisella suoralla taskun päädyn alapuolelta. Rajaus on sapluunan oma parametri ja sitä voi siirtää; rungon koko ääriviiva säilyy ennallaan. Tarkka oletusetäisyys on paikallinen toteutusratkaisu.
- Projektin sekä vientien nimi on käyttäjän määritettävissä. Tallennuskohde valitaan selaimen tukemalla tiedostodialogilla tai selaimen lataustoiminnolla.

## Käyttäytymispolut

### 1. Aloita rungosta

Uusi projekti avaa geneerisen Strat-tyylisen vektoriääriviivan. Etu- ja takasapluunakuvassa on ulkoreuna ja keskiviiva; mitat näytetään piirtoalueen yhteydessä ja mitta-asteikko sen laidalla. Käyttäjä näkee rungon suunnittelumitat ja voi muuttaa niitä sekä muotoilla runkoa ennen kaulan tuontia. Pohjan ei tarvitse vastata mitään CDR-mallia tai tehdaskitaraa. Kaulataskuvienti edellyttää kaulan tuontia ja sen puuttuvien mittojen täydentämistä.

### 2. Tuo FretFactory-malli

Tiedoston avaus ja pudotus käyttävät samaa tuontipolkua: tarkastus → esikatselu → kohdistus → hyväksytty projektimuutos. Tuonti tuo nimetyt kaulan sivureferenssit, satulareferenssin, kielikohtaiset osumapisteet tallalla sekä niitä vastaavan linjan tai kaaren.

Tuotu geometria sijoitetaan projektin kaulakoordinaatistoon jäykällä siirrolla ja kierrolla. Mittakaavaa ei soviteta silmämääräisesti. Basson ja diskantin merkitys ei vaihdu peilauksen yhteydessä.

Kaulan vaihtaminen näyttää muutoksen ennen hyväksyntää ja merkitsee aiemman taskumäärittelyn tarkistettavaksi. Virhe tai peruutus jättää projektin ennalleen. Tuonnista tallentuu oma kopio, lähdeversio ja tarkistustieto; alkuperäistiedoston myöhempi muutos ei muuta projektia.

### 3. Muotoile runkoa

Käyttäjä muokkaa samaa runkoääriviivaa kahdella työkalulla. Erillistä aloittelija- ja asiantuntijatilaa ei tarvita: Muotoile-työkalu näyttää rungon muokattavat solmut suuressa kuvassa. Solmun valinta näyttää siihen liittyvät kahvat. Solmua vetämällä siirretään reunapistettä, ja kahvoilla säädetään kaaren suuntaa ja kaarevuutta. Useita solmuja voidaan valita ja muuntaa yhdessä. Reunan suora veto on saman solmugeometrian lisätoiminto. Sarvien, vyötärön ja alaosan muokkaus perustuu aina nykyiseen käyrään, myös hybridiosan vaihdon jälkeen.

#### Kolmen näkymän työtila

Työpöydällä suuren näkymän koko ulkokehys ulottuu täsmälleen oikeanpuoleisen pikkunäkymäpinon yläreunasta alareunaan. Kehysten tasaus säilyy koonmuutoksissa ja kaikissa 1/2/3-vaihdoissa. Piirtoalueen muuttunut kuvasuhde vaikuttaa vain kameraan ja asteikkojen sijoitteluun, ei rungon geometriaan. Kapean näytön pinottu asettelu säilyy.

Yläpalkin nimetyt painikkeet **1 Etu**, **2 Taka** ja **3 Tasku** vaihtavat halutun kuvan suureksi. Muut kaksi täyttävät pienet paikat numerojärjestyksessä. Pikkunäkymän otsakkeen napsautus käyttää samaa vaihtotoimintoa. Numeronäppäimet toimivat editorin ollessa aktiivinen, mutta eivät kirjoitettaessa mittakenttään tai muuhun syötteeseen. Painike ilmaisee aktiivisen näkymän myös muuten kuin värillä.

Etu- ja takanäkymän pohjana ovat rungon ulkoreuna ja keskiviiva. Integraatiosuunnitelman 8.9.2026 tarkennuksessa etunäkymään lisätään kaulamallin fyysinen ääriviiva sekä kielten satula- ja tallakontakteja kuvaavat linjat todellisessa mittakaavassa ja samassa sijoituksessa kuin automaattinen tasku. Nauhoja ei piirretä etunäkymään. Rungon reunaviiva säilyy kokonaisena ja näkyvänä myös kaulan peittämällä liittymäalueella; kaulan mahdollinen täyttö ei peitä sitä eikä kaulaa ja runkoa yhdistetä uudeksi leikkuureunaksi. Kaulataskun erillistä sisäreunaa tai laskennan kaula-apuviivoja ei lisätä näihin runkonäkymiin. Satula- ja tallalinjat näkyvät etunäkymässä; takanäkymä säilyy rungon ulkoreunan ja keskiviivan kuvana. Tämä koskee sekä suurta että pientä näkymää ja kaikkia näkymänvaihtoja. Suuressa näkymässä valitun rungon reunan solmut ja tangenttikahvat näkyvät muokkaustyökaluina; kaulan piirto ei estä niiden valintaa. Pienissä ei ole muokkauskahvoja. Kaulataskun kuva ja sen kohdistusviitteet kuuluvat näkymään 3; virhekohdat voidaan näyttää niiden korjaamisen aikana. Kaikki kolme renderöidään samasta projektista ja samasta keskeneräisen muokkauksen esikatselusta; jokaisella ei ole omaa runkokopiota. Veto päivittyy kaikkiin saman näyttökehyksen aikana. Näytön päivitys voidaan tahdistaa requestAnimationFrameen; raskaat valmistustarkastukset tehdään tapahtuman lopussa, eivät jokaisessa osoitintapahtumassa.

Jokaisella näkymällä on oma suurennus ja panorointi. Isosta pieneksi siirretty kuva sovitetaan esikatseluun, mutta sen aiempi suuren näkymän zoomaus ja panorointi muistetaan. Kaulataskun oletussovitus näyttää koko yläosan muotoisen sapluunan sarvineen, taskuaukon ja sapluunan alarajauksen. Näkymässä on todellinen valmistettava sapluunamuoto, ei suorakaiteista apulevyä koko rungon päällä. Kamera ei muuta mallin mittoja, eikä jatkuva automaattisovitus saa siirtää kuvaa kesken vedon.

Takaa muokattaessa osoittimen sijainti muunnetaan ensin näkymästä takaisin kanoniseen millimetrikoordinaatistoon. Geometria peilataan vain esitystä varten. Tekstit, numerot ja käyttöliittymäpainikkeet säilyvät oikein päin. Rungon solmun valinta säilyy etu-/takanäkymää vaihdettaessa pysyvän tunnisteen avulla.

Taskunäkymässä sapluunan runkoa seuraavaa ulkoreunaa voi valita ja muokata samalla Muotoile-työkalulla: muutos kohdistuu yhteiseen runkoääriviivaan. Sapluunan poikittainen alareuna on erillinen rajauskahva, eikä sen siirto muuta runkoa. Kaulasta johdetut taskun sivut eivät ole vapaasti venytettäviä runkosolmuja: taskun valinta avaa päädyn, pituuden, säteen, sivusiirtymän ja sovitusvaran asetukset. Parametrikahvat muuttavat samoja arvoja kuin numerokentät. Piirrä osuus ja rungon solmukomennot ovat käytettävissä vain, kun muokkauksen kohteena on runko. Taskun suuviiva säilyy viitteenä eikä siitä tehdä leikkuureunaa.

Näkymän vaihto ei muuta geometriaa eikä undo-historiaa. Keskeneräinen osoitinveto peruuntuu ennen vaihtoa. Piirtämisen tai hybridin valmisteluvaihe voi jatkua näkymän vaihdon yli samoilla kanonisilla pisteillä; sitä ei hyväksytä vaihdon sivuvaikutuksena. Esc peruu keskeneräisen tapahtuman. Yksi valmis veto tai hyväksytty uusi osuus on yksi undo-tapahtuma. Kumoa, tee uudelleen ja numeerinen muutos päivittävät kaikki kolme näkymää.

#### Leveys- ja pituusasteikot

Jokaisella kuvalla on vaakasuuntainen asteikko yläreunassa ja pystysuuntainen asteikko vasemmassa reunassa. Yksikkö näkyy asteikkojen kulmassa. Sama mm/tuuma-valinta päivittää molemmat asteikot kaikissa kolmessa näkymässä sekä mittojen tekstinäytöt. Myös pienissä kuvissa numerot säilyvät luettavina: merkintöjä harvennetaan käytettävissä olevan tilan mukaan.

Asteikkoviivat lasketaan samasta millimetri–näkymä-muunnoksesta kuin itse geometria. Zoom, panorointi, näkymän koonmuutos, Sovita ja etu-/taka-/taskunäkymän vaihto päivittävät asteikot. Sovitusalueen mahdolliset tyhjät reunat ja takanäkymän peilaus otetaan mukaan muunnokseen; pelkkä ruudun leveyden jakaminen mallin viewBox-leveydellä ei riitä kaikissa kuvasuhteissa. Jokainen pikkukuva näyttää oman sovituksensa asteikon.

Asteikon jako vaihtuu zoomin mukaan, ja tekstin koko pysyy ruudulla luettavana. Asteikot sijaitsevat rungon piirtoalueen ulkopuolella. Pikkunäkymien noin 1/4-pinta-alatavoite joustaa ulkokehysten reunatasauksen hyväksi; asteikkokaistat ja otsakkeet sisältyvät kehysten kokonaiskorkeuteen. Rungon leveys ja pituus näytetään lisäksi tekstinä, jotta koon ymmärtäminen ei edellytä kahden asteikkoluvun vähentämistä.

Näytön zoomkerroin on suhteessa näkymään sovitukseen; se ei väitä näytöllä näkyvän kuvan olevan fyysisesti 1:1. Asteikot kuvaavat suunnitelman todellisia mittoja. Käyttöliittymän asteikkokaistat eivät ole valmistusviennin leikkuugeometriaa; viennin fyysiset mitat ja erilliset paperin tarkistusmitat säilyvät aiemman sopimuksen mukaisina.

#### Pysyvät työkalut

Rungon sarville, vyötärölle tai perälle ei tarjota geometrisia muotovalikoita. Solmun lisääminen, poistaminen sekä sileäksi tai kulmaksi muuttaminen ovat valintaan kohdistuvia työkalupainikkeita. Solmutyökalun nimi voi kuvata toimintoa, mutta käyttäjän ei tarvitse avata geometriaa luettelevaa pudotusvalikkoa tai ominaisuuspaneelia muotoillakseen runkoa. Millimetri-/tuuma-asteikot ja tarkat mitat tukevat suoraa muokkausta. Kaulataskun aiemmin sovitut numeeriset mitat ja sovitusvara pysyvät erillisenä valmistusmäärittelynä.

| Työkalu | Käyttäjän toiminta | Soveltuvuus rungon muotoiluun |
| --- | --- | --- |
| **Muotoile** (oletus) | Napsauta pistettä tai kaarta, vedä reunaa, pistettä tai tangenttikahvaa. Shift lisää valintaan; laatikkovalinta valitsee alueen solmuja. Valintakehyksestä siirto, leveys-/korkeusskaalaus ja kierto; tarkka numerosyöttö on valinnainen tuki eikä muotoilun edellytys. | Sarven pidentäminen, vyötärön siirto, offset, alaosan leventäminen ja liitosten viimeistely. |
| **Piirrä osuus** | Valitse nykyiseltä ääriviivalta alku, loppu ja korvattava kulkusuunta. Napsautus lisää kulmapisteen; veto lisää käyräpisteen kahvoineen. Päätä valittuun loppupisteeseen. Enter tai näkyvä Hyväksy korvaa osuuden; Esc tai Peruuta hylkää sen. | Uusi sarvi, singlecut-leikkaus tai V-perä ilman kymmenien vanhojen solmujen siirtelyä. |

Piirtäminen tuottaa yhden uuden kaariketjun valmistelualueelle. Se ei lisää toista irrallista runkoa eikä avaa hyväksyttyä ääriviivaa. Rajapisteet voi lisätä vanhan käyrän keskelle muotoa muuttamatta. Kohdeosuuden ulkopuolinen geometria säilyy. Liittymät ja topologia tarkistetaan ennen hyväksyntää samalla korvausmekanismilla kuin hybridiosan liittämisessä.

#### Valinnan yhteydessä näkyvät komennot

| Komento | Tarkka vaikutus |
| --- | --- |
| **Lisää piste** | Jakaa valitun viivan tai Bézier-segmentin muuttamatta sen muotoa. Näkyvä painike; kaksoisnapsautus on oikotie. |
| **Poista piste** | Yhdistää viereiset segmentit ja pitää polun suljettuna. Käyrän muoto voi muuttua paikallisesti; poistettu osuus ja muutos ovat palautettavissa yhdellä undo-toiminnolla. Degeneroituneeseen polkuun johtava poisto estetään. |
| **Sileä / kulma** | Sileässä kahvat ovat samalla tangenttisuoralla, mutta niiden pituuksia saa säätää itsenäisesti. Kulmassa kahvat ovat riippumattomat. Muutos vaikuttaa valitun pisteen liittymään ja sen viereisiin segmentteihin. |
| **Suora / käyrä** | Vaihtaa valitun segmentin tyypin. Suorasta käyräksi alustetaan sama suora geometria, jota voi tämän jälkeen taivuttaa. Käyrästä suoraksi poistaa kaarevuuden ja säilyttää päätepisteet. Päätesolmujen sileystila ratkaistaan näkyvästi kulmaksi, jos viereistä segmenttiä muuttamaton suora ei säilytä tangenttia. |
| **Korvaa osuudella** | Käynnistää olemassa olevan hybridipolun: kopioitu ketju → suunta ja koko → liittymät → hyväksyntä. Käyttää samoja valinta- ja muotoilutoimintoja, joten kolmatta pysyvää työkalua ei tarvita. |

Reunan suora veto muokkaa valittua segmenttiä ja pitää sen päätepisteet paikallaan. Suora segmentti muuttuu tarvittaessa käyräksi. Jos liittymän sileys edellyttäisi valitsemattoman naapurisegmentin muuttamista, sitä ei muuteta piilossa: käyttäjä laajentaa valintaa tai sallii kyseiseen liittymään kulman. Osuuden siirto, skaalaus ja kierto näyttävät ennen hyväksyntää, mitkä liittymäsegmentit muuttuvat; rajapisteiden ankkurointi on saatavilla, kun naapurigeometria halutaan säilyttää.

Yleistoiminnot ovat Kumoa / Tee uudelleen, erikseen käyttöön otettava muokkausruudukko, valittava tarttuminen, mitat ja numerosyöttö. Keskiviiva näkyy etu-, taka- ja taskunäkymässä. Se on kohdistusviite, ei leikattava reuna. Näkymän siirto toimii välilyönti + veto tai keskipainikkeella, zoom hiiren rullalla sekä näkyvillä +/−/Sovita-painikkeilla. Vasemman painikkeen normaali veto kuuluu muotoilulle; FretFactoryn nykyistä vasemman vedon panorointia ei kopioida sellaisenaan. Oikoteitä vastaavat näkyvät komennot, joten työnkulku ei edellytä piilossa olevien eleiden tuntemista.

Erillisiä kynä-, vapaakäsi-, solmunlisäys-, solmunpoisto-, kääntö-, skaalaus-, tangentti- tai offset-työkalutiloja ei tarvita v1:een. Symmetrinen tangenttitila, koko rungon automaattinen silotus ja boolean-työkalut eivät kuulu minimiin. Tavoite ei ole pienin mahdollinen painikemäärä vaan vähäinen tilanvaihto ja löydettävät toiminnot.

Kaula, kaulatasku ja tallan osumalinja ovat oletuksena lukittuina. Pelkkä rungon muotoilu ei muuta niiden mittoja tai keskinäistä sijaintia. Käyttäjä voi kohdistaa kaulakokonaisuuden erillisessä toiminnossa.

### 4. Yhdistä muotoja hybridiksi

Käyttäjä avaa yhden tai useamman oman tallennetun rungon tai valmistellun SVG-ääriviivan lukituksi muotoreferenssiksi. Referenssit näkyvät erillisinä kohteina eikä niitä viedä sapluunaan. Valinta, tuonti tai niiden skaalaaminen ei muuta nykyistä runkoa tai kaulaa.

Käyttäjä valitsee lähteen ääriviivasta kaksi rajapistettä ja niiden välisen kopioitavan osuuden, esimerkiksi sarven, vyötärön tai alaosan. Suljetulla polulla valittu kulkusuunta määrää, kumpi kahdesta mahdollisesta osuudesta kopioidaan. Rajapiste voi jakaa käyrän keskeltä muotoa muuttamatta. Lähteestä syntyy itsenäinen kopio valmistelualueelle.

Seuraavaksi käyttäjä rajaa omasta rungosta korvattavan osuuden. Esikatselu näyttää osan suunnan, siirron, kierron, mittakaavan ja molemmat liittymät. Koon muuttaminen koskee vain kopioitua muotoa. Osan kulkusuunnan kääntäminen ei peilaa kitaraa tai vaihda basson ja diskantin merkitystä.

Käyttäjä sovittaa uuden osan päät, muotoilee käyrää ja valitsee kummallekin liittymälle kulman tai sileän tangentin. Sileys toteutetaan ensin uuden osan tangenttikahvoilla; korvattavan osuuden ulkopuolinen ääriviiva pysyy geometrisesti samana. Jos myös naapurialuetta halutaan muuttaa, käyttäjä laajentaa valintaa.

Hyväksyntä korvaa valitun osuuden ja liittymät yhtenä peruttavana tapahtumana. Tulos on yksi suljettu runkoääriviiva. Katkos, haara, nollapituinen sovitus tai itseleikkaus pitää ratkaista esikatselussa ennen hyväksymistä; peruutus palauttaa aiemman tilan. Kaula, tasku ja tallan osumalinja pysyvät lukittuina.

Yhdistelyä voi toistaa eri lähteistä ja jatkaa tavallisilla muokkaustyökaluilla. Esimerkiksi Strat-tyylinen yläosa, offset-vyötärö ja V-tyylinen alaosa voivat muodostaa yhden käyttäjän oman rungon. Tämän ei tarvitse jäädä tunnistettavaksi kopioksi yhdestä lähteestä.

### 5. Täydennä kaulatasku

Käyttäjä määrittää kaulan kantapään päädyn sijainnin, taskun pituuden, päätymuodon ja sovitusvaran. Pituus mitataan kaula-akselin suunnassa. Sovitusvaran käyttöliittymä ilmoittaa yksiselitteisesti kokonaisleveyden muutoksen; puolikas lisätään kummallekin sivulle.

Taskun sivut seuraavat vahvistettua kaulan sivugeometriaa. Otelaudan reuna ei yleisesti todista fyysisen kaulankannan leveyttä: oletus yhteisistä sivulinjoista näytetään ja käyttäjä voi antaa kantapään sivusiirtymän. Taskun sovitusvara on tästä erillinen arvo.

Ensiversiossa pääty voi olla suora tai suorasta päädystä yhteisellä kulmasäteellä pyöristetty. Tätä ei nimitetä automaattisesti minkään valmiin tehdaskaulan tarkaksi sovitteeksi.

Taskun työstettävä raja avautuu rungon reunaan: P1 → P2 → P3 → P4. Pisteiden P4 ja P1 välille ei synny työstettävää suuviivaa. Kitaran puurunkoon tasku jyrsitään syvennyksenä. Kaulataskusapluunassa sama alue on läpi avoin aukko. Etu- ja takasapluunien runkoääriviivoihin ei lisätä taskun muotoista läpileikkausta.

Fyysinen kaulataskusapluuna muodostuu käyttäjän oman rungon yläosasta ja siihen avatusta kaulataskun kolosta. Sen ulkoreuna seuraa sarvia, kaulan liittymäaluetta ja sivuja yhteisen runkoääriviivan mukaan. Alareuna sulkee yläosasta rajatun kappaleen taskun päädyn alapuolelta. Näin ulkomuoto tarjoaa kohdistusreferenssin samaan omaan runkoon.

Taskun avoin suu liittyy yläosan ulkoreunaan. Valmistettavan sapluunakappaleen suljettu leikkuureuna sisältää yläosan ulkoreunan, alarajauksen sekä taskun sivut ja päädyn. Taskun suun yli ei leikata sulkevaa viivaa. Työkalua ohjaava taskureuna ja sapluunan muu ulkoreuna säilyvät semanttisesti eri rooleina, jotta samaa reunaa ei viedä leikkaukseen kahdesti.

Yläosan leveys ja muoto johdetaan aina nykyisestä rungosta, myös hybridin tai sarven muokkauksen jälkeen. Käyttäjä voi siirtää sapluunan alarajausta taskun alapuolella tukipinnan kasvattamiseksi. Katkaisu ei saa leikata taskua tai tuottaa irrallisia sapluunan osia. Mahdoton rajaus osoitetaan esikatselussa ja estää kaulataskusapluunan valmistusviennin.

Päivitetty rajaus 9.9.2026: jyrsintäsyvyydet ja Z-akseli eivät kuulu ohjelmaan myöskään työohjekenttinä. Kaulataskun pituussuuntainen ulottuminen runkoon määritetään 2D-geometriasta; kaulakulma ja jyrsimen asetukset jäävät ohjelman ulkopuolelle.

### 6. Tarkista kolme sapluunaa

| Tuotos | Työstöä ohjaava sisältö | Referenssit |
| --- | --- | --- |
| Etu | Rungon suljettu ulkoreuna | Keskiviiva kohdistusviitteenä; etupuolen tunniste piirtoalueen ulkopuolella |
| Taka | Sama ulkoreuna takaa katsottuna | Keskiviiva kohdistusviitteenä; takapuolen tunniste piirtoalueen ulkopuolella |
| Kaulatasku | Rungon yläosan muotoinen sapluuna, jossa kaulasta johdettu taskuaukko; mukana sulkeva alareuna | Keskilinja, taskun suu, sovitustiedot |

Etu- ja takasapluunien yhteinen geometria on tietoinen v1-rajaus. Niitä voidaan tarvita eri puolten työvaiheissa, mutta ne eivät tässä versiossa kuvaa eri koloryhmiä tai rungon viisteitä.

### 7. Vie ja tallenna

Paperille tuotetaan koko sapluunan 1:1-vektori-PDF sekä A4/A3-laatoitus, sivutunnisteet, limitys, kohdistusristit ja 100 mm tarkistusmitat kahteen suuntaan. Tiedosto sisältää ohjeen tulostaa todellisessa koossa ilman sivulle sovittamista.

SVG sisältää eksplisiittiset fyysiset mitat ja millimetripohjaisen viewBoxin. DXF käyttää millimetrejä ja nimettyjä kerroksia. Leikkausgeometria sekä viittaus- ja merkintäaineisto toimitetaan selvästi erotettuina; pelkkä väri tai piilotettu SVG-ryhmä ei ole suoja vahingossa leikkaamiselta. Tallan osumalinja kuuluu erilliseen referenssiaineistoon. Sen tuonti, mitat ja kohdistus säilyvät aiemmin sovittuina, vaikka linjaa ei esitetä etu-/takasapluunakuvissa. Paperin kohdistus- ja mittakaavamerkit sijoitetaan runkoääriviivan ulkopuolelle.

Virheellinen geometria estää kyseisen valmistusviennin ja osoittaa ongelmakohdan. Luonnoksen saa silti tallentaa. Vienti käyttää hyväksyttyä omaa runkoääriviivaa ja valitun sapluunan sisältöä; muotoreferenssit ja käyttämättömät osat jäävät pois. Projektin avaus palauttaa saman hybridigeometrian, kaulatuonnin, taskun, lukitukset ja vientiasetukset.

## Muutettavat vastuualueet tai tiedostot

GTRfactory on uusi projekti repositorion juuressa. Toteutus jaetaan projektimalliin, geometriaytimeen, tuontiin, editoriin, sapluunageometriaan ja vientiin. Ehdotettu hakemistojako: src/model, src/geometry, src/import, src/editor, src/templates ja src/export.

Geometriaydin omistaa myös käyrän jakamisen, kaariketjun kopioinnin, sovitusmuunnokset, liittymät ja korvaamisen. Editorin valmistelualue omistaa keskeneräisen esikatselun myös Piirrä osuus -toiminnolle. Editorin yhteinen Zustand-tila omistaa aktiivisen työkalun, näkymän ja kanonisen valinnan; näkymäkohtaiset kamerat pysyvät erillään geometriasta. Kolme SVG-näkymää käyttävät samaa johdettua geometriaa ja suurena näkyvä näkymä liittää siihen muokkauskerroksen. Projektimalli omistaa hyväksytyn runkopolun ja kopioidut muotoreferenssit; undo/redo käsittelee korvauksen yhtenä tapahtumana.

FretFactoryyn ehdotetaan pientä SVG-viennin laajennusta: versionoitu geometrinen metadata ja semanttiset roolit. Nykyisen näkyvän SVG:n geometrian pitää säilyä ennallaan. Kaulankannan käyttöliittymää ei rakenneta FretFactoryyn.

## Säilytettävät rajat

- Geometriaydin omistaa mallin; näkymän pikselit ja SVG-DOM eivät ole valmistusmittojen lähde.
- Muotoreferenssien alkuperäinen tehdasmittakaava ei rajoita oman rungon suunnittelua. Käyttäjän valitsema sijoituskoko kirjataan malliin; viennin mitat verrataan omaan projektigeometriaan.
- Osan korvaus muuttaa vain valittua kaariketjua. Kopioinnin esikatselu ja muotoreferenssit ovat erillisiä hyväksytystä runkoääriviivasta.
- Rungon muotoilu ei venytä mensuuria, kaulataskua tai tallan osumalinjaa.
- Tallan koko osumalinja säilyy, myös multiscale-/curved-tuonnissa; sitä ei korvata pelkkien päätepisteiden suoralla.
- Taskun tavoitepinta, koko rungon ääriviiva ja yläosasta johdettu fyysisen sapluunan leikkuureuna pysyvät eri objekteina. Yläosasapluuna johdetaan yhteisestä rungosta; sen alarajaus tai taskuaukko ei muuta koko rungon etu-/takaääriviivaa.
- Laserin leikkausrako ja CNC-työkalukorjaukset kuuluvat jatkokäsittelyyn. Nimellismittoja ei muuteta niillä huomaamatta.
- Tuonnin tietotarkastus ei suorita SVG:n skriptejä eikä lataa ulkoisia viitteitä.
- FretFactory-kaulaa esittävää vanhaa metadataa vailla olevaa SVG:tä ei tulkita automaattisesti mitalliseksi kaulamalliksi. Ensiversio ohjaa viemään kaulan uudelleen tuetusta FretFactory-versiosta. Muotoreferenssin SVG-tuonti on erillinen toiminto eikä se korvaa tätä kaulasopimusta.

## Tietomalli- ja rajapintamuutokset

Projektitiedosto sisältää skeemaversion, mm-yksikön, nimetyn koordinaatiston, geneerisen aloitusmuodon version, muokattavan ääriviivan pysyvine solmu- ja segmenttitunnisteineen, kaulatuonnin kopion, kohdistuksen, taskumäärittelyn, kaulataskusapluunan poikittaisen alarajauksen kaulakoordinaatistossa ja vientiasetukset.

Muotoreferenssit tallennetaan itsenäisinä geometriakopioina yksikkötulkintoineen ja sijoitusmuunnoksineen. Hyväksytyn kopio-osan alkuperätieto voi sisältää lähteen tunnisteen ja tiivisteen, valitun segmenttiketjun sekä sijoitusmuunnoksen. Kaikki viennin tarvitsema geometria sisältyy omaan projektiin; alkuperäistiedoston poistaminen ei riko sitä.

Projektimalli erotetaan editorin istuntotilasta: aktiivinen näkymä, työkalutila, valinta, kamerat ja käynnissä oleva muokkaustapahtuma eivät ole valmistusgeometriaa. Luonnosmuutoksen esikatselu johdetaan kerran yhteisestä tapahtumasta kaikkiin näkymiin; tallennus ja vienti eivät saa vahingossa käyttää osittain hyväksyttyä ketjua. Keskeneräinen piirtäminen pitää hyväksyä tai perua ennen valmistusvientiä.

Segmenttityypit ovat vähintään line ja cubicBezier. Liittymät tallentavat kulma- tai sileystilan. Korvaustapahtuma sisältää ennen/jälkeen-geometrian ja liittymät; undo palauttaa myös segmenttijärjestyksen ja tunnisteet. Muokkaushistorian säilymistä sovelluksen uudelleenkäynnistyksen yli ei edellytetä, mutta hyväksytyn hybridin geometria säilyy.

FretFactory-SVG:n metadata sisältää vaihtosopimuksen version, lähdeversion, yksikön, origon, akselien suunnat, nimetyt bass-/treble-sivureferenssit, satulareferenssin, kielten tunnisteet ja kaikki tallan osumapisteet sekä niiden täsmällisen viiva-/käyrägeometrian. Metadatan ja SVG-polkujen välinen muunnos määritellään eksplisiittisesti.

GTRfactory ei toteuta FretFactoryn mensuuri- tai curved-algoritmia uudelleen. Raakaparametrit eivät yksin korvaa geometriatiedonsiirtoa. Vanhojen projektiversioiden tuki luvataan vasta, kun formaatti on julkaistu ja tuki testattu.

## Toteutusjärjestys

Ensimmäinen käyttökelpoinen editorivaihe ja koko v1 ovat eri valmistumistavoitteita. Editorivaihe todistaa oikean aloitusääriviivan, millimetripohjaisen projektimallin ja tallennuksen, koko runkoreunan solmu-/kahvamuokkauksen, kumoamisen sekä synkronoidut näkymät asteikkoineen. Ennen kaulatuontia taskunäkymä ilmoittaa puuttuvasta kaulasta; se ei esitä esimerkkiaukkoa valmistuskelpoisena sapluunana. FretFactory-tuonti, hybridiosan korvaus, kaulataskusapluuna ja kaikki sovitut viennit kuuluvat edelleen koko v1:een.

1. Muunna käyttäjän `CDR/bodytemplate.svgz`-lähteen ulkoreuna ja keskiviiva kanoniseen mm-koordinaatistoon tarkoituksenmukaisiksi solmuiksi. Varmenna polun geometria ja lähtömitat; ajonaikaista CDR-tuontia ei tässä vaiheessa tarvita.
2. Lukitse geometriakoordinaatisto, SVG-vaihtosopimus ja esimerkkitiedostot.
3. Rakenna GTRfactoryn projektimalli ja geometriaydin tallennus–avaus-kierroksineen.
4. Lisää FretFactoryn metadata ja varmista oikean ladatun SVG:n tuonti GTRfactoryyn.
5. Rakenna kolmen SVG-näkymän runko ja yhteinen muokkaustila. Toteuta Muotoile, Piirrä osuus, tilannekomennot, muotoreferenssin avaus, ääriviivan osan kopiointi ja korvaaminen, liittymien sovitus sekä lukittu kaulakohdistus.
6. Toteuta kaulataskun täydennys ja fyysisen sapluunan muodostus.
7. Viimeistele kolmen esikatselun sapluunasisällöt ja toteuta SVG/DXF sekä 1:1-PDF-laatoitus.
8. Varmenna kokonaiset käyttöpolut, ladatut tiedostot ja nykytiladokumentaatio.

## Hyväksymiskriteerit

- Sarven, vyötärön ja alaosan muokkaus onnistuu piirtoalueen solmuilla, kahvoilla ja valintaan liittyvillä työkalupainikkeilla avaamatta geometriavalikoita. Sileä/kulma on valitun solmun työkalu, ei nimettyyn rungonosaan sidottu muotovalitsin.

- Kaikissa kolmessa näkymässä on vaaka- ja pystyasteikko sekä näkyvä yksikkö. Keskiviivan x = 0 ja valitun y-origon kohdalla asteikot vastaavat mallikoordinaatistoa, myös peilatussa takanäkymässä.
- Yksikön vaihto säilyttää geometrian ja muuttaa vain lukujen esityksen. 25,4 mm vastaa 1 tuumaa; toistuvat vaihdot eivät muuta projektimittoja.
- Zoom, panorointi, Sovita, näkymän vaihto ja koonmuutos pitävät asteikot geometrian kohdalla. Erilaiset kuvasuhteet ja SVG-sovituksen tyhjät reunat eivät siirrä merkintöjä väärään paikkaan.
- Asteikkonumerot eivät mene päällekkäin pienissä kuvissa. Rungon leveys ja pituus näytetään tekstinä samassa yksikössä, ja ne säilyvät kameran muutoksissa samoina.
- Etu- ja takakuva sisältävät rungon ulkoreunan ja keskiviivan ilman taskun sisärajaa tai muita pysyviä apuviivoja; rajaus säilyy kaikkien 1/2/3-vaihtojen jälkeen. Suuren editorin valintakahvat säilyvät käytettävissä. Taskunäkymän aukko, yläosan muoto ja kohdistusviitteet säilyvät.
- Kaikki kolme näkymää ovat esillä; yksi on suuri ja kaksi muuta noin 1/4 sen piirtoalueesta. Työpöydällä suuren kehyksen yläreuna vastaa ylemmän pikkunäkymän yläreunaa ja alareuna alemman pikkunäkymän alareunaa kaikissa 1/2/3-vaihdoissa ja koonmuutoksissa. Painikkeet 1/2/3 ja pienen näkymän otsake käyttävät samaa vaihtopolkua. Syötekentässä kirjoitetut numerot eivät vaihda näkymää.
- Veto, numerosyöttö, undo/redo ja hyväksytty tai peruttu osanvaihto näkyvät kaikissa kolmessa näkymässä samasta geometriaversiosta. Zoomaus ja näkymän vaihtaminen eivät muuta mallia tai undo-historiaa.
- Takanäkymässä tehty epäsymmetrinen muutos osuu oikeaan kanoniseen solmuun ja päivittyy etunäkymään; tekstit eivät peilaudu. Testi kattaa myös zoomauksen ja panoroinnin jälkeisen vedon.
- Suureen näkymään palaaminen palauttaa sen aiemman kameran. Pikkunäkymät pysyvät luettavina eivätkä näytä suurikokoisia solmu- tai tangenttikahvoja.
- Kahdella pysyvällä työkalulla voi venyttää sarven, siirtää vyötäröä, piirtää V-perän ja liittää toisen rungon osuuden. Työnkulut onnistuvat myös näkyvillä komennoilla ilman kaksoisnapsautuksen tai näppäinoikoteiden tuntemista.
- Solmun lisäys säilyttää käyrän muodon; poisto säilyttää sulkeutuneisuuden ja on peruttavissa. Sileä/kulma- ja suora/käyrä-vaihdot toimivat ilman viereisten osuuksien piilomuutoksia.
- Piirrä osuus ja hybridi käyttävät samaa atomista korvausmekanismia: valmistelu ei muuta hyväksyttyä runkoa, ja peruutus tai epäonnistunut hyväksyntä ei jätä osittaista ketjua.
- Taskun valinta tuo näkyviin mittoihin perustuvat asetukset. Rungon vapaa muokkaus ei ohita kaulatuonnin lukituksia eikä tee taskun suuviivasta leikkausreunaa.
- Geneerisestä aloitusmuodosta voidaan tehdä offset-, singlecut- ja kulmikas/V-tyyppinen oma ääriviiva ilman tiedoston käsin muokkausta. Tehdasmallin identtisyys ei ole hyväksymiskriteeri.
- Käyttäjä voi yhdistää vähintään kahden muotoreferenssin osia yhteen runkoon ja jatkaa tuloksen muokkausta. Sekä pehmeän että kulmikkaan osan sovitus onnistuu myös silloin, kun lähteissä on eri määrä solmuja.
- Kopiointi ja esikatselu eivät muuta lähdettä tai nykyistä runkoa. Peruutus ei jätä osittaista muutosta.
- Korvaus muuttaa vain valittua ääriviivan osuutta ja tuottaa yhden suljetun polun ilman haaroja, aukkoja tai itseleikkauksia. Pistejatkuvuus vaaditaan aina, tangenttijatkuvuus vain käyttäjän valitsemissa sileissä liittymissä.
- Kaulan liittymäalueen muokkaus ei siirrä taskua. Valmis valmistusvienti tarkistaa edelleen rungon ja taskun liittymän.
- Yksi undo palauttaa korvausta edeltäneen segmenttijärjestyksen, tunnisteet ja liittymät; redo palauttaa saman hybridin.
- Tallennus ja uudelleenavaus säilyttävät hybridin ilman alkuperäisen muotolähteen saatavuutta. Muotoreferenssit ja käyttämättömät osat puuttuvat kaikista valmistusvienneistä.
- Rungon muokkaus ei muuta lukitun kaulan tai osumalinjan geometriaa.
- Sekä samanmensuurinen että erimittainen curved-kaula tuodaan oikein; basson ja diskantin vaihtuminen havaittaisiin testissä.
- Tasku voidaan viimeistellä GTRfactoryssa ilman FretFactoryyn lisättyä kantapäämallia.
- Taskun sivut, pääty ja sovitusvara vastaavat annettuja arvoja; suuviiva puuttuu työstöpolusta.
- Kaulataskusapluunan ulkoreuna seuraa nykyisen rungon yläosaa sarvineen ja sivuineen. Taskun kohdalla on läpi avoin kolo. Suorakaiteinen erillinen apulevy ei täytä tätä kriteeriä.
- Sarven tai muun yläosan muokkaus päivittää myös taskusapluunan ulkoreunan. Sapluunan alarajauksen siirtäminen säilyttää koko rungon ja taskun mitat.
- Taskusapluuna on yksi yhtenäinen kappale, jonka leikkuureuna on suljettu; taskun suuta ei suljeta eikä yhteisiä reunoja leikata kahdesti. Taskuun osuva tai irrallisia osia tuottava alarajaus estää tämän sapluunan valmistusviennin.
- Takasapluuna vastaa tarkkaa peilausta; peilaus kahdesti palauttaa alkuperäisen geometrian.
- Projektin avaus, tuonnin peruutus, virheellinen tuonti ja undo/redo säilyttävät määritellyn tilan.
- SVG-, DXF- ja PDF-artefaktien mitat vastaavat samaa mallia. Laskennallisen vientivertailun tavoiteraja on 0,01 mm; käyrän mahdollisen DXF-polyline-approksimaation enimmäispoikkeama on 0,05 mm. Nämä ovat ohjelmistotavoitteita, eivät fyysisen valmistuksen tarkkuuslupauksia.
- Itseleikkaus, katkennut ääriviiva, mahdoton päätysäde ja virheellinen taskun/rungon liittymä estävät niihin liittyvän valmistusviennin.
- 100 mm tarkistusmitat sekä sivujen kohdistukset ovat mukana paperiaineistossa.
- Käyttäjä voi nimetä projektin ja kaikki vientitulokset.

## Testit ja muut varmennustasot

Automaattisesti tarkistetaan geometria, yksiköt, käyrien muunnokset, peilaus, sovitusvara, tuontiversiot, virhepalautuminen ja tallennuksen round-trip. Hybridin testit kattavat rajapisteen lisäämisen käyrän keskelle, suljetun polun kummankin valintasuunnan, eri solmumäärät, osan suunnan kääntämisen, kulma- ja tangenttiliitokset, degeneroituneen sovituksen, itseleikkaukset sekä korvauksen atomisen undo/redo-toiminnan. Kohdeketjun ulkopuolinen geometria ja lukitut kauladatumit verrataan ennen ja jälkeen.

UI-varmennus kattaa asteikkojen ja geometrian kohdistuksen etu-/taka-/taskunäkymissä eri kuvasuhteilla, zoomilla ja panoroinnilla sekä mm/tuuma-vaihdon ja tekstimitat. Lisäksi se kattaa hiiren ja näppäimistön kautta samat näkymänvaihdot, numerokentän suojauksen, keskeneräisen vedon peruutuksen vaihdossa, kameran palautumisen, osan piirtämisen/perumisen ja yhteisen live-esikatselun. Solmuoperaatioiden geometriatestit kattavat suoran ja kuutiollisen käyrän täsmällisen jakamisen, paikallisen poiston, tangenttitilat, valinnan muunnokset ja peilatun osoitinkoordinaatiston. Kaulataskun parametrit tarkistetaan myös silloin, kun tasku on suurena. Yläosasapluunan testeissä tarkistetaan sarvimuutoksen välittyminen, alarajauksen riippumattomuus koko rungosta, taskuaukon avoin suu, yhtenäinen kappale, suljettu yksinkertainen leikkuureuna sekä saman reunan esiintyminen valmistusaineistossa vain kerran. Työpöytäasettelun kehysten ylä- ja alareunojen tasaus, likimääräinen pinta-alasuhde ja kapean näkymän luettavuus tarkistetaan selaimessa; vasta tämän jälkeen käytettävyyttä voi väittää varmennetuksi.

Kokonaispolun testi kattaa geneerisen aloituksen, kahden eri muotolähteen käytön hybridissä, FretFactory-tuonnin, taskun, viennit ja uudelleenavauksen ilman alkuperäisiä lähdetiedostoja. Muotoilun onnistumista arvioidaan CDR-aineiston esittämää vaihtelua ja niiden yhdistelmiä vasten.

Tuoreessa paikallisessa selaimessa tarkistetaan muokkaus, näppäimistö, undo/redo, näkymien vaihto, todellinen lataus ja konsoli. Ladatut SVG/DXF/PDF-tiedostot luetaan uudelleen ja niiden mitat, käyrät, kerrokset, sivut ja referenssiroolit varmennetaan.

FretFactoryn toteutusmuutoksen tarkistukset ovat npm run test:run ja npm run build sekä uusi SVG-vienti. GTRfactoryn nykyisen projektipohjan tarkistuskomennot on määritetty package.jsonissa ja kuvattu README.md:ssä. CAD-geometrian ja valmistusvientien testit lisätään niitä toteutettaessa.

Fyysinen tulostus-, sapluunanleikkaus- ja kaulataskun koejyrsintänäyttö kirjataan erikseen. Niitä ei korvata ohjelmistotesteillä.

## Dokumentaatiovaikutukset

Toteutuksen jälkeen ylläpidetään README-käyttöohje oman rungon ja hybridien suunnitteluun, geometrian ja projektiformaatin sopimus (myös osien korvaus ja lähteiden omistajuus), FretFactory-tuonnin sopimus sekä oman suunnitelman sapluunoiden valmistus- ja tulostusohje. FretFactoryn vientidokumentaatio päivitetään toteutuneeseen metadataan. Tämä brief säilyy suunnittelupäätösten lähteenä.

## Riskit

- Muotoreferenssin koon hiljainen muuttuminen voi sekoittaa oman rungon mitat. Käyttäjän pitää nähdä ja valita sijoituskoko; valmistusviennin on säilytettävä projektin mitat. Lähteen tehdasmittakaavan vastaavuus ei ole vaatimus.
- Eri solmumäärien ja suuntien yhdistely voi synnyttää väärän kaariketjun, terävän liittymän tai itseleikkauksen. Ne pitää näyttää esikatselussa; automatiikka ei saa muuttaa muita rungon osia huomaamatta.
- FretFactoryn dokumentaatio ja nykyinen koodi ovat kielten indeksijärjestyksestä ristiriidassa. Sopimuksen pitää käyttää nimettyjä rooleja ja epäsymmetristä testimallia.
- Otelaudan reuna ei kaikissa kaularakenteissa ole sama kuin kantapään reuna.
- Valinta- ja muunnoskahvojen pitää toimia myös lisättyjen tai poistettujen solmujen jälkeen; ne eivät saa palauttaa vanhaa muotoa.
- Liian vähäinen työkalumäärä voi piilottaa toiminnot. Kaksi pysyvää tilaa riittää vain, jos lisääminen, poistaminen, liittymätila ja hybridikomennot ovat näkyvästi löydettävissä.
- Peilauksen tekeminen sekä malliin että esitykseen kääntäisi takanäkymän väärin. Sama koordinaattimuunnos palvelee piirtämistä, osavalintaa ja osoitintapahtumia.
- Kolmen SVG:n raskas päivitys voi nykiä. Yhteinen geometrian laskenta, kehyksiin tahdistettu esikatselu ja lopputarkastusten erottaminen jatkuvasta vedosta varmennetaan toteutuksessa.
- Pieni sisäkaari voi olla geometrisesti kelvollinen mutta käytettävälle terälle mahdoton. Vienti näyttää mitan, eikä ohjelma väitä käyttäjän työkalun sopivuutta tarkistamatta sitä.
- Tulostin ja jatkokäsittelyohjelma voivat skaalata muuten oikein muodostetun tiedoston.

## Ratkaisematta jääneet asiat

Laakeriterään perustuva 1:1-menetelmä on nyt käyttäjän vahvistama. Tämän rajauksen toteutuksen aloittamista estäviä avoimia käyttäjäpäätöksiä ei ole tunnistettu. Seuraavat asiat ratkaistaan toteutuksessa näyttöön perustuen:

- Geneerisen aloitusmuodon tarkat oletusmitat ja solmujen sijoittelu ovat paikallisia suunnitteluratkaisuja. Nykyinen yhden solmun keskusteluluonnos ei ole aloitusääriviiva tai koko editorin toteutuspohja. Oikea mitoitettu Strat-tyylinen käyrä tarkastellaan ensimmäisessä editorivaiheessa; tarkkaa tehdas-Strat-pohjaa ei tarvitse hankkia.
- Aiemmin keskustelussa ehdotetut leveys 250–450 mm ja pituus 350–600 mm olivat alustavia kokosuosituksia, eivät käyttäjän hyväksymiä rajoja. Niitä ei oteta valmistusvientiä tai muokkausta estäviksi rajoiksi. Numeerinen varoitusalue ja aihio-/konekohtainen rajatoiminto ovat erillisiä myöhempiä ehdotuksia eivätkä tämän briefin toteutusvaatimuksia. Geometrian validointi säilyy hyväksymiskriteerien mukaisena.
- FretFactory-vaihtosopimuksen täsmällinen skeema, koordinaatiston muunnos ja nimetyt bass-/treble-roolit suljetaan ennen tuontivaiheen toteutusta. Lähdekoodin ja dokumentaation indeksiristiriita ratkaistaan todellista geometriaa ja epäsymmetristä vienti–tuontinäytettä vasten. Käyttäjältä ei kysytä teknisiä indeksiarvoja. Nykyinen SVG-vienti ei sisällä ehdotettua vaihtometadataa.
- Geometriatyökalujen ja vientikirjastojen lopullinen valinta edellä sovittuja kriteerejä vasten.
- Muiden selainten tuen laajuus ja fyysisen koevalmistuksen järjestely. Projektipohjan paikalliset URL:t ja Edge-varmennus on määritetty toteutusvaiheen profiilissa.

## Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Projektipohja valmistui 6.9.2026. Käyttäjä valtuutti seuraavan runkoeditorivaiheen pyynnöllä ”jatketaan runkoeditoriin”. Aktiivinen toteutusrajaus on alla kuvattu käyttökelpoinen runkoeditori ja oman projektin tallennus/avaus. Koko v1:n DESIGN READY -suunnitelma säilyy tulevien piirtämis-, hybridi-, tuonti- ja vientivaiheiden lähteenä. FretFactoryn lähteitä, alkuperäistä CDR-aineistoa tai keskustelun mockupia ei muuteta. Commitia, remotea, pushia tai julkaisua ei tehdä.

## Valmistunut toteutusvaihe — runkoeditori

 Tila: **ALKUPERÄINEN EDITORIVAIHE TOTEUTETTU JA QA-VARMENNETTU 6.9.2026; TÄSMENNETTY JA QA-VARMENNETTU 8.9.2026**. Tämä vaihe kattaa käyttökelpoisen paikallisen editorin ja oman `.gtrfactory`-projektin tallennus-/avauspolun. Koko v1:n FretFactory-tuonti, hybridit, varsinainen kaulatasku ja valmistusviennit ovat edelleen suunnitelmaa.


### Tavoite

Muokattava käyttäjän bodytemplate-lähteestä muunnettu lähtörunko sekä oman työn tallennus ja avaaminen. Yksi millimetrimalli tuottaa kolme samanaikaisesti päivittyvää näkymää.

### Ei-tavoitteet

FretFactory-/CDR-/SVG-tuonti, hybridilähteiden yhdistäminen, Piirrä osuus, ryhmän skaalaus/kierto, taskuaukon muodostaminen ja valmistusviennit kuuluvat myöhempiin vaiheisiin.

### Käyttäjän vahvistamat päätökset

FretFactoryn tekniikat, solmuihin perustuva muotoilu, käyttäjän `CDR/bodytemplate.svgz`-aineistosta muunnettu lähtömuoto, kolme näkymää ja 1/2/3-vaihto, suuren kuvan reunojen tasaus pieniin kuviin, mm/tuuma-asteikot sekä ulkoreuna ja katkoviivainen keskiviiva etu-/takakuviin. Kaulataskun varsinainen sapluuna sisältää myöhemmin rungon yläosan ja avoimen taskuaukon. Käynnistysmuodon kaulaliittymän kolme ankkuria ja kaksi segmenttiä ovat tässä vaiheessa lukittuja; lukitus koskee segmentteihin osallistuvia kahvoja, kun taas `starter-21.in` ja `starter-02.out` jäävät vapaiksi. Muu ääriviiva on muokattavissa.

### Sallitut paikalliset oletukset

Tämä editorivaihe sisältää paikallisen versionoidun .gtrfactory-projektin, jotta muotoilutyö säilyy. Kaulan puuttuessa taskunäkymä näyttää vain yhteisen rungon yläosan. Teknisiä tiedosto-/lukurajoja ei tulkita hyväksytyiksi kitaran kokorajoiksi. Historia rajataan 100 muutokseen.

### Käyttäytymispolut

1. Käynnistys ja Uusi avaavat oman lähtömuodon. Tallentamattoman työn korvaaminen uudella tai avatulla projektilla vahvistetaan. Peruutus säilyttää dokumentin ja historian; hyväksytty vaihto aloittaa uuden historian.
2. Solmun, kahvan ja valittujen solmujen ryhmän veto muuttaa kanonista millimetrimallia. Kaikki kolme näkymää näyttävät saman keskeneräisen esikatselun. Valitun ryhmän solmuun tarttuminen säilyttää ryhmän; Shift vaihtaa valintaa ja tyhjältä alueelta alkava veto valitsee laatikolla.
3. Lisää piste jakaa valitun segmentin muotoa muuttamatta. Poisto yhdistää reunan paikallisesti ja estää alle kolmen solmun ääriviivan. Sileä/Kulma muuttaa valitun solmun tangenttiehtoa, Suora/Käyrä vain valittua segmenttiä ja säilyttää naapurisegmenttien geometrian.
4. Hallitut X/Y-kentät käyttävät nykyistä mm/in-yksikköä. Enter tai fokuksen poistuminen hyväksyy muokatun kelvollisen luvun kerran; tyhjä/virheellinen syöte ja Esc eivät muuta geometriaa. Pelkkä kentän kohdistaminen ei pyöristä mittoja. Nuolinäppäimet eivät muokkaa runkoa syötekentässä.
5. Numeropainikkeet, 1/2/3-näppäimet ja pikkukuvan otsake vaihtavat suuren näkymän samaa polkua pitkin. Keskeneräinen veto perutaan ennen vaihtoa. Valinta säilyy solmutunnisteilla.
6. Etu-/takakuvassa ovat ulkoreuna ja katkoviivainen keskiviiva ilman tasku-/tallaviitteitä. Taka on vain esityspeilaus, ja sekä osoitin että asteikot käyttävät samaa muunnosta. Taskukuvassa näkyvät yläosan solmut ovat muokattavia suurena; rajaus ei lisää leikkausviivaa tai taskuaukkoa dokumenttiin.
7. Kuusi asteikkoa, rungon vieressä olevat vaaka- ja pystymittaviivat, solmukentät ja leveys/pituus käyttävät samaa näyttöyksikköä. Mittaviivat lasketaan suljetun Bézier-ääriviivan todellisista ääriarvoista; niiden apuviivat päättyvät bounds-rajaukselle eivätkä väitä osuvansa käyrän yksittäiseen kosketuspisteeseen. Mittatekstit pysyvät pikselikokoisina ja asteikot kohdistuvat myös peilauksessa, zoomissa ja panoroinnissa.
8. Rulla, +/− ja Sovita ohjaavat suurta kameraa; välilyönti+veto, keskipainikkeen veto tai näkyvä Siirrä näkymää -komento panoroi. Suuri kamera ei autosovitu vedon/commitin mukana. Näkymäkohtaiset kamerat muistuvat ja pikkukuvat sovittuvat omiin ruutuihinsa.
9. Pointerdown ottaa lähtötilan, pointermove päivittää esikatselun ja pointerup hyväksyy yhden muutoksen. Esc/pointercancel/näkymänvaihto peruvat vedon. Kumoa kesken dokumenttivedon peruu sen ensin. Undo/redo säilyttää täsmälliset dokumentit ja tunnisteet; valinta, yksikkö ja kamera eivät lisää historiaa. Muuttumaton veto ei lisää tapahtumaa.
10. Tallenna nimellä kutsuu tuetun selaimen dialogia suoraan käyttäjän toiminnosta. Nimetty selainlataus on myös aina näkyvänä vaihtoehtona. Vain hyväksytty dokumenttisnapshot tallennetaan. Dialogin peruutus ei aloita latausta; kirjoitusvirhe ei merkitse työtä tallennetuksi. Vasta valmis kirjoitus ja sulku päivittävät tallennusbaselinen; myöhempi muokkaus jää muuttuneeksi.
11. Avaa validoi koko tiedoston ennen atomista korvaamista. Virheellinen formaatti, versio, rakenne, luvut tai teknisten rajojen ylitys säilyttävät työn. Operaatiotunniste sekä dokumentin revisio ja projektisukupolvi estävät vanhaa asynkronista lukua korvaamasta uudempaa työtä.
12. Haamumalliksi ladataan yksi `.gtrfactory`-, PNG- tai JPEG-tiedosto istuntoa varten. Käyttäjä voi näyttää/piilottaa haamun, säätää peittävyyttä, korkeutta kuvasuhteen säilyttäen, X/Y-siirtoa, keskitystä ja poistoa. Haamu piirretään kaikkiin kolmeen näkymään niiden peilaus- ja rajauslogiikkaa noudattaen, mutta se ei muuta dokumenttia, dirty-tilaa, historiaa tai rungon mittoja. Uusi projekti ja sivun uudelleenlataus tyhjentävät haamun.
13. Aloitusmuodon kaulaliittymän suojattu ketju sisältää ankkurit `starter-21`, `starter-01`, `starter-02` sekä segmentit `starter-21` ja `starter-01`. Suojattujen solmujen koordinaatit ja suojattuihin segmentteihin osallistuvat kahvat eivät muutu veto- tai numeromuokkauksella; `starter-21.in` ja `starter-02.out` jäävät vapaiksi ja liittymän ulkopuolinen geometria säilyy muokattavana. Vanha v1-projekti avautuu v2-muotoon ilman tätä suojausta.

### Muutettavat vastuualueet tai tiedostot

src/model omistaa dokumentin ja lähtömuodon, src/geometry geometrian, src/store.ts hyväksytyn dokumentin/esikatselun/historian ja UI-tilan, src/file validaation ja tiedostoadapterit, src/editor SVG:n/muunnokset/osoittimen/kentät/tiedostokäytön sekä App ja styles asettelun. Vitest ja tests/e2e kattavat yllä kuvatut polut. README, AGENTS ja FEATURE_BRIEF omistavat nykytiladokumentaation.

### Toteutusjärjestys

Millimetrimalli ja geometria → dokumenttitransaktiot/historia → yhteiset näkymät ja muokkaus → projektitiedosto → automaattiset ja selain-/artefaktitestit → riippumaton QA → nykytiladokumentaatio. Vaihe on toteutettu.

### Hyväksymiskriteerit

- Käyttäjän bodytemplate-lähteestä muunnettu lähtömuoto, koko vapaan suljetun reunan muokkaus, todelliset käyrämitat sekä lukittu kaulaliittymän ketju.
- Solmu-/kahva-/ryhmämuokkaus, valinta, lisäys/poisto ja tangentti-/segmenttikomennot toimivat yhteisessä mallissa, myös peilatusta taka- ja rajatusta yläosanäkymästä.
- Yksi hyväksytty veto on yksi kumottava muutos; peruutus ja näkymänvaihto palauttavat lähtötilan. Muokkaus ei riko projektin rakenteellista uudelleenavattavuutta.
- Suuri kuva ja pienet kuvat ovat työpöydällä tasattuja, kapea asettelu ei vuoda vaakasuunnassa. Kuusi asteikkoa vastaavat todellista näkymämuunnosta.
- Numeeriset kentät eivät hyväksy tyhjää, keskeneräistä tai peruttua syötettä eivätkä pyöristä koskematonta geometriaa.
- Tiedoston nimi, mm-geometria ja tunnisteet säilyvät oikeassa ladatussa ja uudelleenavatussa .gtrfactory-artefaktissa.
- Tallennuksen ja avauksen peruutus-, virhe- ja kilpailutilanteet säilyttävät uudemman työn. Undo tallennettuun snapshotiin poistaa dirty-tilan.
- Relevantit tyyppi-/geometria-/store-/formaatti-/selainkokeet ja riippumaton QA läpäisevät, dokumentaatio vastaa toteutusta. Valmistusvientiä tai fyysistä mittakaavaa ei johdeta editorin näytöstä.

### Testit ja muut varmennustasot

Vitest tarkistaa geometrian, mm/px-muunnokset, historian, parserin ja tiedostoadapterit. Playwright käyttää oikeita osoitin-/näppäimistöpolkuja, tuoretta tuotantobuildiä, konsoli-/pageerror-/window.error-kuuntelua, leveää/kapeaa asettelua sekä oikeaa ladattua ja uudelleenavattua projektitiedostoa. Riippumaton QA täydentää erillisillä elinkaarikokeilla; tulokset ovat tämän vaiheen ledgerissä.

### Dokumentaatiovaikutukset

README kuvaa toteutuneen käytön ja AGENTS projektin suoritusprofiilin. Tämä brief säilyttää vaiheen hyväksytyn käyttäytymisrajauksen, teknisen sopimuksen ja näyttötasot. Koko v1:n myöhempiä toimintoja ei kuvata valmiiksi.

### Riskit

Itseleikkausvaroitus on rajattu approksimaatio. Selainlataus ja natiivi tiedostodialogi ovat eri tallennustapoja. Natiivi käyttöjärjestelmän dialogi, valmistusartefaktit ja fyysinen mittakaava eivät kuulu tämän näytön kattavuuteen.

### Ratkaisematta jääneet asiat

Ei avoimia editorivaiheen tai manuaalisen kaulataskuvaiheen toteutusta estäviä vikoja. FretFactory-vaihtosopimus ja automaattinen kaulatuonti, piirtämis-/hybridilaajennukset sekä valmistusviennit säilyvät seuraavien vaiheiden suunnitelmana.

### Toteutunut nykytila

- Käynnistys avaa `CDR/bodytemplate.svgz`-lähteestä ennalta muunnetun 21 solmun suljetun cubic/line-solmuääriviivan. Lähteen mitat ovat noin 309,6 × 451,3 mm; kyse on käyttäjän muokattavaksi tarkoitetusta lähtömuodosta, ei ajonaikaisesta CDR-tuonnista.
- Pino on React + TypeScript + Vite + Zustand. Kanoninen geometria on millimetreinä; projektin koordinaatistosopimus sisältää centerline-, neck-joint-mouth- ja down-suunnat. Projektin nimi ja stable ID:t säilyvät tiedostossa.
- Kolme yhteistä näkymää ovat työpöydällä suuri vasen näkymä ja kaksi pientä oikealle pinottua näkymää. Etu- ja takanäkymät näyttävät vain ulkoreunan ja katkoviivaisen keskiviivan. Taskunäkymässä näkyy yläosan rajattu runko ja manuaalisesti määritetty avoin U-muotoinen taskuluonnos. Suuren etu- ja takanäkymän mittaviivat perustuvat todellisiin Bézier-ääriarvoihin; pikkunäkymissä ja taskunäkymässä mittaviivoja ei näytetä.
- Suuren näkymän solmut ja kahvat ovat muokattavia. Shift- ja laatikkovalinta, ryhmäsiirto, hiiri- ja nuolisiirto (1 mm, Shift 10 mm), takanäkymän peilausta seuraavat nuolisiirrot, pisteen lisäys, poisto, sileä/kulma sekä suora/käyrä toimivat. X/Y mm/in -syötteet hyväksytään Enterillä tai blurilla ja perutaan Escillä.
- Undo/redo toimii Ctrl/Cmd+Z-, Ctrl/Cmd+Shift+Z- ja Ctrl+Y-oikoteillä. Välilyönti+veto tai keskipainikkeen veto panoroi; rulla, +/− ja Sovita zoomaavat. Suuren näkymän kamera muistetaan ja pienet sovitetaan omaan kokoonsa.
- Tallenna nimellä käyttää tuettua selaimen natiivirajapintaa; selainfallback lataa käyttäjän nimeämän tiedoston. Avaa validoi ennen nykyisen työn vaihtamista, ja peruutus-, virhe- sekä vanhentuneen avauksen polut säilyttävät työn ja dirty-snapshotin. `.gtrfactory`-formaatti on v3 ja sisältää tarvittaessa kaulataskun parametrit sekä suu-referenssin; v1/v2 avautuvat v3:nä ilman taskua.
- Haamumalli on istuntokohtainen lukittu referenssi. Yksi `.gtrfactory`-, PNG- tai JPEG-tiedosto voidaan näyttää kaikissa kolmessa näkymässä; näkyvyys, peittävyys, korkeus kuvasuhteen säilyttäen, X/Y-siirto, keskitys ja poisto ovat säädettävissä. Se ei vaikuta dokumenttiin, historiaan, dirty-tilaan tai rungon mittoihin.
- Aloitusmuodon kaulaliittymän kolme ankkuria (`starter-21`, `starter-01`, `starter-02`) ja kaksi segmenttiä (`starter-21`, `starter-01`) ovat lukittuja. Lukitus koskee solmujen koordinaatteja sekä suojattuihin segmentteihin osallistuvia kahvoja; `starter-21.in` ja `starter-02.out` ovat vapaita. Muu reuna säilyy muokattavana.

### Tietomalli- ja rajapintamuutokset

`src/model/project.ts` ja `src/file/projectFile.ts` määrittävät versionoidun JSON-sopimuksen: `format: "gtrfactory-project"`, `version: 2`, `units: "mm"`, `name`, `coordinateSystem: "centerline-neck-joint-mouth-down"`, `starter: { id: "gtr-strat-v1", version: 1|2 }` sekä `body.outline: { closed: true, nodes }` ja `body.neckJointBoundary`. Solmu sisältää `id`, `x`, `y`, `kind: "smooth" | "corner"`, suhteelliset `inHandle`/`outHandle`-vektorit `{ dx, dy }` tai null ja `outgoing: "line" | "cubicBezier"`. Kuutiokäyrä käyttää lähtösolmun outHandlea ja seuraavan solmun inHandlea. Sileältä solmulta vaaditaan kaksi nollasta poikkeavaa, vastakkaissuuntaista kahvaa samalla tangentilla; pituudet saavat erota. Viivasegmentin passiiviset kahvat voivat säilyä tiedostossa, mutta ne eivät vaikuta geometriaan. `neckJointBoundary` nimeää lukitun ketjun ankkurit ja segmenttien aloitukset. V1-tiedosto hyväksytään ja muunnetaan avattaessa v2-dokumentiksi ilman suojattua ketjua. Historia rajataan 100 muutokseen. Haamureferenssi on erillinen käyttöliittymän istuntotila eikä kuulu projektiformaattiin.

Tekniset rajat ovat 2 MiB UTF-8-tiedosto, 2000 solmua ja koordinaattien/kahvojen itseisarvo enintään 1 000 000 mm. Nämä eivät ole yleisiä kitaran kokorajoja. Itseleikkausvaroitus käyttää kuutiokäyrien 16 näytettä ja enintään 250 000 pari-vertailua; tulos on approksimaatio luonnosvaroitukseksi eikä valmistuskelpoisuuden todiste.

### Säilytettävät rajat

Tässä vaiheessa ei ole FretFactory-, CDR-, SVG- tai hybridituontia, Piirrä osuus -toimintoa, ryhmän skaalausta/kiertoa, todellista kaulataskuaukkoa eikä SVG-, DXF- tai PDF-valmistusvientiä. `bodytemplate.svgz` on käynnistysmuotoon ennalta muunnettu lähde, ei ajonaikainen CDR/SVG-tuonti. Haamureferenssi tukee tässä vaiheessa vain `.gtrfactory`-, PNG- ja JPEG-tiedostoja; SVG-, PDF- ja CDR-haamut sekä referenssikirjasto ovat suunnitelmaa. FretFactory-tuonti, kaulaliittymän automaattinen mitoitus ja tallan osumalinjan käsittely ovat edelleen suunnitelmaa. Nämä ja valmistuksen fyysinen varmennus säilyvät koko v1:n suunnitelmana. Natiivia käyttöjärjestelmän Save As -dialogia ei ole testattu; adapteripolut ja selainlataus on testattu. Mobiilinäyttö on Chromium-simulaatio, ei fyysinen puhelin- tai Safari-koe. Julkaistua ympäristöä ei ole varmennettu.

### VERIFICATION LEDGER — runkoeditori

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| Automaattiset editoritestit | `npm run test:run` | 35/35 Vitest-testiä kuudessa tiedostossa PASS | 6.9.2026, lopullinen lähde | Voimassa, kunnes relevantti lähde tai testi muuttuu |
| Tyyppitarkistus ja build | `npm run typecheck`; `npm run build` | PASS; tuotantobundlessa 47 moduulia | 6.9.2026, lopullinen lähde | Voimassa, kunnes relevantti lähde tai asetus muuttuu |
| Laaja selainkoe | `npm run test:e2e`, Edge desktop + iPhone 13 -kokoinen Chromium | 18/18 PASS, 31,3 s; pointer-, näkymä-, tiedosto- ja virhepolut sekä konsoli tarkistettu | 6.9.2026, tuotantobuildi | Paikallinen selain; simulaatio, ei fyysinen koe |
| Wheel-kohdekoe | rajattu Playwright-koe | 2/2 PASS, 6,8 s; wheel-zoom, kamerat ja sivuvieritys | 6.9.2026 | Paikallinen selain |
| Keyboard-kohdekoe | rajattu Playwright-koe | 2/2 PASS, 5,5 s; desktop + mobile; 22 erillistä tapausta yhteensä kolmessa ajossa, ei yksi 22/22-ajokokonaisuus | 6.9.2026 | Paikallinen selain |
| Riippumaton editori-QA | `editor_qa`, Terra/medium; lähde- ja selainkatselmus sekä lisätapaukset | VERIFIED; 1280 desktop / 390 mobile, ei ylivuotoa tai virheitä, yhteinen path, pointercancel, roundtrip-lataus ja dirty-snapshot varmennettu | 6.9.2026, `tmp/editor-independent-qa/` | Riippumaton paikallinen QA; natiividialogia/fyysistä laitetta ei kata |
| Historiallinen dev-selainnäyttö ennen 8.9. täsmennystä | projektin Playwright + Edge, `http://127.0.0.1:5174/` | HTTP 200, title GTRfactory, 3 näkymää, 24 muokattavaa solmua, 322,4 × 454,1 mm, overflow=false, console/page/window errors=[]; 1/2/3-vaihdot onnistuivat | 2026-09-06T20:36:14.976Z; `tmp/editor-dev-final.json`, `tmp/editor-dev-final.png` | Historiallinen lähtömuodon näyttö; 8.9.2026 täsmennyksen nykyinen näyttö on tämän briefin uudemmassa ledgerissä |
| CDR- ja FretFactory-säilyminen | SHA-256 ja Git-status | 144 CDR-tiedostoa täsmäsivät; FretFactory puhdas `main...origin/main`, HEAD `89f94c0e693b75528a41ac8fd8b682c04899f7fb`; suojatut riippuvuus-, portti- ja konfiguraatiotiedostot säilyivät | 2026-09-06T20:25:59.7899730Z | Voimassa kunnes vastaavat tiedostot muuttuvat |
| Ensimmäiset toteutusvirheet | Worker/root-lähdekatselmointi ja alkuvaiheen tyyppi-/sopimustestit | Ensimmäinen rajatun ydinkierroksen virhe oli geometriamoduulin TS1002-syntaksivirhe. Myöhemmin täydennettiin yhtenäinen suljettu polku, kahva-/poistoinvariantit ja saved-snapshot-baseline; lähdemallin negatiiviset nollat normalisoitiin JSON-roundtripiä varten. Korjaukset sisältyvät 35 läpäisseen testin näyttöön. | Editorin toteutuskierrokset 6.9.2026 | Historiallinen virhenäyttö, ei avoin vika |
| Ensimmäinen laaja selainajoyritys | Tuotantobuild ja Playwrightin Node-puolen parserituonti | Testien lataus pysähtyi starter.jsonin puuttuvaan JSON-import-attribuuttiin. Korjattu `with { type: 'json' }`; seuraavat tuotanto- ja selainajot läpäisivät tämän polun. | 6.9.2026 | Historiallinen työkaluketjun yhteensopivuusvirhe |
| Panoroinnin runtime-virhe | runtime_diagnostician, oikea Edge ja tilapäinen focus-vertailu; tmp/editor-pan-diagnosis | Ensimmäisessä laajassa 14 tapauksen ajossa 12 läpäisi, kaksi pan-koetta epäonnistui: SVG:n fokus vieritti sivua 4/200 px. `preventScroll:true` korjasi syyn. | 6.9.2026, desktop ja kapea Chromium | Korjattu; myöhempi laaja 18 tapauksen ajo läpäisi |
| Alkumitoitus ja valintalaatikkokoe | Sama runtime_diagnostician, DOM-/pointer-tapahtumien jäljitys | Väliaikainen 600×500-alkukoko aiheutti todellisen mittauskilpailun: SVG piirtyy nyt vasta mitatun koon jälkeen. Valintalaatikkotestin veto alkoi viewportin ulkopuolelta; testi vierittää SVG:n näkyviin ennen koordinaattien mittausta. Vaatimusta ei heikennetty. | 6.9.2026, 18 tapauksen väliajo 14/18 ennen korjauksia | Korjattu; viimeinen laaja ajo 18/18 |
| Näytön riippumattomuus ja dokumenttikatselmointi | editor_feature_worker Terra/high, pääagentin korjaukset, runtime_diagnostician, editor_qa Terra/medium ja docs_sync; yksi lähdekirjoittaja kerrallaan | Riippumaton QA hyväksyi editorin. Pääagentti tarkisti myös viimeisen Space-korjauksen rajauksen, nykytiladokumentit, formaattikenttien nimet, oikotiet ja hyväksymiskriteerien säilymisen. Näytekeruuta ei käynnistetty. | 6.9.2026, viimeistelty editorivaihe | Käytetyt näyttötasot on erotettu; ei julkaisu- tai fyysistä näyttöä |

Automaattiset testit, paikallinen selain, ladattu projektitiedosto, julkaistu ympäristö ja fyysinen valmistus ovat eri varmennustasoja. Tässä vaiheessa ladattu `.gtrfactory` roundtrip on varmennettu, mutta valmistusartefaktia, julkaistua ympäristöä ja fyysistä koetta ei ole.

### VERIFICATION LEDGER — mittaviivat, lähtömuoto, haamumalli ja lukittu kaulaliittymä

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| Lähde ja lähtömuoto | `tmp/measure-ghost-ledger.md`, lähdevertailu ja `starter.json`-tarkistus | Käynnistysmuoto perustuu `CDR/bodytemplate.svgz`-lähteeseen: 21 solmua, lähteen keskilinja muunnettu kanoniseen X=0-koordinaatistoon, lähtömitat noin 309,6 × 451,3 mm. | 8.9.2026, lähteen SHA-256 kirjattu ledgeriin | Voimassa kunnes lähtömuoto tai muunnos muuttuu |
| Mittaviivat ja keskiviiva | Tuore paikallinen Edge-UI-QA, desktop ja kapea näkymä | Suuri etu- ja takanäkymä näyttää rungon ääriarvoihin perustuvat vaaka- ja pystymittaviivat mm/in-yksikössä; katkoviivainen keskiviiva näkyy täytön päällä. Pikkunäkymät ja kaulataskunäkymä säilyvät ilman mittaviivoja. | 8.9.2026, `tmp/qa-measure-ghost-result.json` ja kuvakaappaukset | Paikallinen selain-QA; ei fyysinen mittakaavakoe |
| Haamureferenssi | Tuore Edge-UI-QA, oikeat PNG- ja JPEG-lataukset | Yksi istuntokohtainen haamu voidaan ladata, näyttää/piilottaa, himmentää, keskittää, poistaa ja sijoittaa X/Y-siirrolla sekä korkeudella kuvasuhteen säilyttäen. Se näkyy kolmessa näkymässä peilaus- ja rajauslogiikkaa noudattaen eikä vaikuta mittoihin, bounds-arvoihin, dirty-tilaan, historiaan tai tallennettuun projektiin. | 8.9.2026, `tmp/qa-measure-ghost-result.json` | Vain `.gtrfactory`, PNG ja JPEG; SVG/PDF/CDR-haamut eivät ole toteutettu |
| Haamun syöterajat | `referenceOverlay`-lähdekatselmus ja selain-QA | Projektit luetaan nykyisellä parserilla; rasterit tarkistetaan dekoodattuna PNG/JPEG-kuvana. Raja-arvot ovat 10 MiB, 8192 px sivu ja 16 MP. | 8.9.2026 | Voimassa kunnes referenssiparseri muuttuu |
| Lukittu kaulaliittymä ja formaatti | Tuore Edge-UI-QA, oikea veto-, undo-, lataus- ja v1-roundtrip | `neckJointBoundary` suojaa starter-ketjun ankkurit ja segmentit; suojatut koordinaatit ja kahvat eivät muutu, rajapisteen vapaa ulostulokahva muuttaa polkua ja undo palauttaa sen. Tallennettu projekti on v2; vanha v1 avautuu v2:na ilman suojausta. | 8.9.2026, `tmp/qa-lock-roundtrip-result.json` | Voimassa kunnes project-malli, parseri tai lukitussäännöt muuttuvat |
| Automaattiset tarkistukset | `npm run test:run`, `npm run build`, E2E 26 tapausta kahdessa ajossa | Unit: 40/40 PASS. Build PASS, bundle `index-BljVUstG.js`. E2E: ensimmäinen ajo 24/26 PASS, kaksi vanhentuneen conversion-assertionin testiä korjattiin ja rajattu uusinta 2/2 PASS; yksittäistä puhdasta 26/26-kokonaisajoa ei väitetä. | 8.9.2026, nykyinen lähde | Voimassa kunnes relevantti lähde tai testi muuttuu |
| Riippumaton QA | `final_editor_qa`, tuore Edge, desktop 1280×820 ja kapea 390×844 | VERIFIED: PNG/JPEG lataus ja renderöinti, mirror/crop, mittaviivat, lukitus, undo, dirty/bounds-erillisyys sekä console/pageerror/overflow tarkistettu. | 8.9.2026, ledgeriin kirjatut QA-artefaktit | Paikallinen selain; ei natiivin Save As -dialogin, valmistusartefaktin tai fyysisen kokeen näyttö |

### Toteutusvaltuutuksen tila ja peruste

Käyttäjän pyyntö ”jatketaan runkoeditoriin” valtuutti tämän vaiheen toteutuksen. Valtuutus ei kata FretFactoryn lähteitä, julkaisemista, Git-ulkoistoimia tai koko v1:n suunniteltuja tuonti- ja vientiominaisuuksia. Työnkulkunäytteiden keruu ei ole projektissa käytössä.
## Historiallinen integraatiosuunnitelma — FretFactory osaksi GTRfactorya, 8.9.2026

Tila: **HISTORIALLINEN SUUNNITTELURAJAUS**. Tämä osio säilyttää alkuperäiset päätökset, tutkimuksen ja suunnittelupolun taustana. Toteutunut nykytila ja sen varmennus ovat myöhemmässä FretFactory-kaulaintegraation toteutusosiossa.

### Tavoite

Kaulan suunnittelu, rungon muotoilu ja kaulataskun sovitus tehdään samassa GTRfactory-projektissa. FretFactoryn todellinen kaulageometria määrää taskun sivut, nauhat, satulareferenssin ja kielten osumalinjan tallalla. Kaulan kapenemista ei piirretä uudelleen erillisillä leveyssäädöillä.

### Ei-tavoitteet

Ei nykyisen FretFactory-sivun sellaisenaan upottamista, GTRfactoryn sisäistä rinnakkaista kaulalaskentaa taskulle, uutta yleistä SVG-tulkintaa, laitteistokoloja, Z-syvyyttä, mensuurin venytystä tai tehdaskaulan kantapään automaattista tunnistamista pelkästä nauhamäärästä. Oma fyysinen pääty muodostetaan erikseen määritellyllä päätyvaralla ja pyöristyksellä. Ensivaiheen ulkopuolelle jäävät merkit, satulakompensaatio, kielisuositukset ja otelaudan valmistusviennit; niitä ei tuoda kaulaeditorin mukana automaattisesti. Valmistusviennit säilyvät erillisenä myöhempänä kokonaisuutena. Nykyisen FretFactoryn sivustokuori, mainokset, taustaanimaatio ja palvelukohtaiset rekisteröinnit eivät ole kaulageometrian riippuvuuksia. Integraation aloittaminen ei edellytä julkaistun FretFactoryn rakenteen muuttamista.

### Käyttäjän vahvistamat päätökset

- Käyttäjän jatkotarkennus 8.9.2026: ”Fretfactory säilyy itsenäisenä julkaistuna sovelluksena. GTRfactoryssä kehitetään kahden ohjelman yhdistämistä yhdeksi omaksi ohjelmakseen.” Tuotteet, kehitystyötilat ja julkaisut säilyvät erillisinä. GTRfactory omistaa yhdistetyn ohjelman kehityksen.
- Kaulataskun sivut tulevat kaulamallista ja kapenevat satulaa kohti. Erillinen taskun suun ja päädyn leveyden käsinsyöttö poistuu tavoitellusta käyttöpolusta.
- Keskimmäinen kolmesta suojatusta bodynodesta pysyy täsmälleen paikallaan. Sivupisteet sovitetaan kaulageometriaan.
- Umpinaisen päädyn molemmilla kulmilla on yksi yhteinen tangentiaalinen kulmasäde.
- Etu/taka säilyttävät rungon ulkoreunan ja keskiviivan; tasku ja sen kohdistusviitteet kuuluvat näkymään 3. Käyttäjän uusin 8.9.2026 tarkennus lisää etunäkymään kaulan oikealle paikalle satulaan asti ilman nauhoja. Rungon reunaviiva näkyy kaulan läpi liittymässä. Tallasta tarvitaan vain kaikkien kielten osumalinja tai -käyrä.
- Fyysinen kantapään päättyminen ja sovitusvara täydennetään GTRfactoryssa.
- Käyttäjän uusin rajaus 8.9.2026: ensin kaulasuunnittelu, esikatselu ja automaattinen kaulatasku. Kaulaan muodostetaan fyysinen rungonpuoleinen pääty, jossa huomioidaan taskun suljetun pään kulmasäde.
- Satulasta tallaan ulottuva laskentageometria säilyy kielten osumakohtien laskemiseksi. Se erotetaan esikatselun fyysisistä kaulan reunoista, jotka päättyvät kantapäähän.
- Käyttäjän korjaus 8.9.2026: edellisessä viivapyynnössä tarkoitettiin kielten kohtaamiskohtia **tallalla**. Myös satulalinja näytetään. Etunäkymään tuodaan siis sekä tallan osumalinja että satulalinja kaulamallin todellisista kontaktipisteistä. Molemmat säilyttävät mallin mukaisen suoran, vinon tai kaarevan muodon ja käyttävät kaulan samaa mittakaavaa ja sijoitusta. Nauhoja ei lisätä etunäkymään.

### Sallitut paikalliset oletukset ja vaihtoehdot

Toteutukseen lukittu 8.9.2026 käyttäjän hyväksymän suunnitelman ja arkkitehdin jatkoarvion perusteella:

- Oma Kaula-työtila; uusi projekti alkaa ilman kaulaa, ja **Luo kaula** liittää sen yhteen projektiin. Lähtömallissa säädettävä päätyvara on 10 mm, otelauta ja kantapää päättyvät samaan tasoon, kulmasäde on yhteinen ja sovitusvara säilyy X-kokonaisleveyslisänä. Alla olevan taustatutkimuksen ehdotusmuoto kuvaa päätöksen valmistelua; nämä valinnat on nyt hyväksytty toteutuksen lähtökohdaksi.
- Lähde on FretFactory HEAD `89f94c0e693b75528a41ac8fd8b682c04899f7fb`, puhdas main. Kopioidaan puhtaat `src/geom/core.ts`, `curved.ts`, `naming.ts` ja `pchip.ts` GTRfactoryn versionoituun omaan alueeseen ja dokumentoidaan alkuperä sekä mahdolliset sovitukset. FretFactoryn sivustoa, storea tai riippuvuuksia ei kopioida kokonaisuutena. Bass = vasen / indeksillä 0 ja treble = oikea / indeksillä strings−1 varmennetaan todellisesta laskennasta, ei ristiriitaisista kommenteista.
- Projektiformaatti v4: kaulaparametrit, laskentaversio, tulosgeometrian snapshot, sijoitus ja fyysinen pääty tallennetaan. Snapshotin johdonmukaisuus validoidaan; tuntematon laskentaversio hylätään selkeästi eikä lasketa hiljaa uudelleen nykyversiolla.
- V1–v3 avautuvat ilman kaulaa; runko ja kelvollinen v3-tasku säilyvät tunnistettuna vanhana luonnoksena. Sen manuaalinen leveyksien käyttöliittymä poistuu. Kaulan luonti/tuonti korvaa vanhan taskun selkeästi nimetyn toiminnon kautta yhtenä kumottavana muutoksena. Projektia ilman lukittua kolmen solmun liittymää ei muuteta arvaamalla; kaulan liitos näyttää rajoituksen.
- Aiemman FretFactory-mallin ensimmäinen siirtopolku on tunnetun `#state=`-URL:n parametrien liittäminen. Kaulan oleelliset parametrit validoidaan ilman hiljaista rajausta; tuntemattomia toimintoja ei suoriteta eikä URL:ia haeta verkosta. SVG-tuonti jää myöhempään vaiheeseen. Nykyinen FretFactory-hash ei itsessään sisällä formaattiversiota.
- Pääagentti tuotti alkuperäisestä FretFactory-laskennasta viisi riippumatonta vertailutapausta ennen toteutusta: tasa- ja curved-kuusikielinen, curved-kahdeksankielinen, nelikielinen basso ja yksikielinen. Lähdetiivisteet ja fixturet sitovat vertailun kyseiseen lähde-HEADiin.

Suositus on GTRfactoryn integroitu Kaula-työtila. Runkotyötilan nykyinen 1/2/3-näkymäjako säilyy; Kaula-työtila ei korvaa näiden painikkeiden merkitystä. FretFactoryn jatko itsenäisenä julkaistuna sovelluksena on vahvistettu.

Ensivaiheen tekninen suositus on tuoda FretFactoryn kaulalaskenta hallittuna lähdemoduulina GTRfactoryyn ja sovittaa tarvittavat kaulaeditorin osat GTRfactoryn omaan tilaan. Lähdecommit, tiedostot ja sovitusmuutokset dokumentoidaan; vertailutestit sitovat laskennan tunnettuun FretFactory-versioon. GTRfactory ei käytä ajonaikaista riippuvuutta erikseen julkaistusta FretFactory-sivustosta tai paikallisesta sisarhakemistosta. Yhteinen kirjasto voidaan myöhemmin ottaa käyttöön erikseen versionoituina riippuvuuksina, jos ylläpidon tarve sen perustelee. Tämä paketointisuositus on tekninen ehdotus, ei käyttäjän erikseen vahvistama vaatimus.

Vaihtoehtoinen pienempi ratkaisu on vain versionoitu tiedostosiirto kahden erillisen sovelluksen välillä. Se edellyttää muutosten uudelleentuontia eikä vastaa yhtä hyvin pyyntöä liittää FretFactory osaksi GTRfactorya. Integraation tietosopimus suunnitellaan niin, että tiedostosiirto voidaan silti tarjota myöhemmin; tiedostosiirtoa ei aseteta sisäisen työtilan pakolliseksi välivaiheeksi.

#### Fyysisen päädyn ehdotus ja taustatutkimus, 8.9.2026

Viimeisen nauhan, otelaudan päädyn ja taskuun tulevan kantapään päädyn välillä ei oleteta yleistä tehdasmittaa. [eGuitarPlansin The Components: Part 1 -suunnitteluohje](https://www.laguitarra-blog.com/wp-content/uploads/2012/06/the_components_pt1-2.pdf) käyttää viimeisestä nauhasta otelaudan rungonpuoleiseen päätyyn 3/8 tuumaa eli 9,525 mm. Tämä on yhden rakentamisohjeen lähtöarvo, ei kaikkien sähkökitaroiden standardi. Alkuperäisen eGuitarPlans-ohjeen sisältö tarkistettiin verkossa indeksoidusta PDF-kopiosta; se ei ole mittaus nykyisestä bodytemplate-aineistosta.

[Warmothin omassa rakennekuvauksessa](https://warmoth.com/guitar-neck-fret-numbers) 21-nauhaisen otelauta päättyy kantapään tasoon, tavallisen 22-nauhaisen otelauta jatkuu kantapään yli 1/4 tuumaa (6,35 mm) ja 24-nauhaisen jatkoversiossa 1,062 tuumaa (noin 26,97 mm). Nämä kaksi jälkimmäistä lukua ovat **otelaudan ylityksiä kantapäästä**, eivät viimeisen nauhan ja päädyn välejä. Ne eivät määritä samaa rakennetta kaikille 22- tai 24-nauhaisille kauloille.

Suunnitteluehdotus ensimmäiselle omalle kaulamallille:

- Otelauta ja taskuun tuleva kantapää seuraavat samoja sivureferenssejä ja päättyvät samaan pyöristettyyn päätyyn. Erillinen pitkittäinen otelaudan ylitys jätetään myöhempään vaiheeseen. Tämä on rajausehdotus, ei käyttäjän vielä vahvistama yleispätevä kaularakenne.
- Päätylinja on suora ja kohtisuorassa kaulan keskilinjaan nähden. Sen paikka johdetaan viimeisen nauhaviivan/-käyrän rungonpuoleisimmasta kohdasta ja säädettävästä päätyvarasta. Ehdotettu oletus on **10 mm**; se on pyöristetty ohjelman lähtöarvo, ei valmistusstandardi tai automaattinen sopivuustakuu. Etäisyys mitataan kaulan pituussuunnassa nauhan keskiviivasta suoraan päätylinjaan.
- Molempiin päätykulmiin tehdään sivujen todelliset kulmat huomioivat tangentiaaliset ympyräkaaret. Käyttäjän yksi taskun kulmasäde ohjaa myös kaulan vastakappaleen kulmia. Nollaväljyydellä kaulan ja taskun suljetun pään rajat yhtyvät.
- Säde ei saa leikata viimeistä nauhaa eikä poistaa sitä näkyvistä. Tarkistus kattaa koko viimeisen nauhan sekä päätykaaret; pelkkä nauhan keskilinjaleikkaus tai päätylinjan paikka ei riitä kaareville/monimittaisille nauhoille. Päätyvara suoraan linjaan ja todellinen pienin etäisyys pyöristettyyn päätyyn erotetaan. Nauhan leveys ja fyysinen puuvara eivät vielä sisälly pelkkään nauhan keskiviivan geometriseen tarkistukseen.
- Sovitusvaran nykyinen merkitys säilyy ehdotuksessa: kokonaisleveyden lisäys X-suunnassa, puolet kummallekin sivulle. Fyysisen kaulan mitat eivät muutu sovitusvarasta; taskun pääty-Y ja kulmasäde pysyvät samoina kuin kaulassa. Suoralla päätypinnalla ei ole pituusvälystä ja kulmavälys vaihtelee. Tätä ei kuvata tasaiseksi normaalivälykseksi. Positiivisen välyksen kaula–tasku-sisältyminen varmennetaan myös epäsymmetrisillä sivuilla; negatiivinen lisä on tarkoituksellinen ahdistus, ei geometrisesti väljä sovitus.

FretFactoryn nykyinen `overhang` tarkoittaa ulomman kielen keskilinjan ja otelaudan sivureunan väliä kummallakin puolella. Se ei ole tämän kohdan pitkittäinen otelaudan ylitys tai päätyvara; uudet käsitteet tarvitsevat omat kenttänsä.

### Käyttäytymispolut

1. Käyttäjä avaa samassa projektissa Kaula-työtilan ja määrittää FretFactoryn nykyisillä kaulasäätimillä mensuurit, kielimäärän, nauhat ja kielijaon/reunavaran. Työtila näyttää kaulan esikatselun. Bodymuoto säilyy.
2. Hyväksytty muutos laskee kaulageometrian kerran. Sama tulos palvelee kaulaesikatselua, taskua ja tallan osumalinjaa. Laskennan satula–talla-sivureferenssit säilyvät, mutta fyysisen kaulan ääriviiva rajataan omaan päätyynsä. Kieliviivat jatkuvat tallan osumalinjalle. Työtilan vaihto ei nollaa kaulaa tai runkoa.
3. Kaulan keskilinja kohdistetaan rungon keskilinjalle. Käyttäjä valitsee liittymän nauhan ja tarvittaessa pitkittäisen hienosiirron. Kyseisen aidon nauhageometrian keskilinjaleikkaus kohdistetaan kiinteään suun vertailupisteeseen. Ensimmäiseen versioon ei ehdoteta vapaata kaulakiertoa.
4. Satula, nauhat, kaulan sivut ja tallan osumalinja siirtyvät yhtenä kokonaisuutena. Mensuuria tai geometrian mittakaavaa ei muuteta kohdistuksessa.
5. Fyysinen kantapään pääty muodostuu viimeisen nauhan ja käyttäjän säädettävän päätyvaran perusteella edellä ehdotetulla rajatulla liitosmallilla. Ohjelma johtaa taskun pituuden tästä ja suun referenssistä; päätyvara ja taskun pituus eivät ole itsenäisiä ristiriitaisia arvoja. Viimeinen nauha, otelaudan pää ja fyysinen kantapää erotetaan tietomallissa myös silloin, kun kahden jälkimmäisen päädyt yhtyvät. Päätyvaran muutos ei siirrä satulaa, nauhoja tai tallan osumalinjaa; nauhaan perustuvan liittymäsijoituksen muutos siirtää koko kaulageometriaa suhteessa runkoon.
6. Taskun sivut saadaan kaulan sivureferensseistä sijoituksen ja kokonaisväljyydestä puolittain jaetun sovitusvaran avulla. Sivujen ei oleteta olevan symmetrisiä eikä umpinaisen päädyn kulmien 90 astetta. Nykyinen käsin syötetty symmetrinen suu-/päätyleveysmalli ei kelpaa monimittakaulatuonnin tietomalliksi.
7. Yhteinen kulmasäde pyöristää kaulan ja taskun umpikulmat tangentiaalisesti. Sen kelpoisuus tarkistetaan molempien kappaleiden sivu-/päätypituuksista ja viimeisen nauhan suhteesta pyöristettyyn päätyyn. Kaulan muutos voi tehdä aiemmasta säteestä tai sijoituksesta epäkelvon; se näytetään korjattavana virheenä eikä korjata muuttamalla mensuuria, leikkaamalla nauhaa, kasvattamalla päätyvaraa huomaamatta tai piilottamalla vanhaa taskua uudeksi.
8. Uusi/Avaa/Tallenna/Kumoa/Tee uudelleen käsittelevät yhtä projektia. Kaulatyötilan luonnos ja keskeneräinen muokkaus kuuluvat samaan transaktiomalliin; yksi käyttäjän muokkaus kumoaa kaulan ja siitä johdetut muutokset yhdessä. Epäkelpo syöte ei korvaa viimeistä kelvollista projektitilaa. Tallennetun projektin uudelleenavaus ei edellytä toista selainta tai FretFactory-palvelinta.
9. Runkotyötilan etunäkymä näyttää kaulan kantapäästä satulaan asti ilman nauhoja. Se käyttää kaulatyötilan ja taskun samaa sijoitusmuunnosta; kaulaa ei asemoida kuvaan erikseen silmämääräisesti. Rungon liittymän reunaviiva piirretään kaulan mahdollisen täytön päälle ja pysyy valittavana runkoreunana. Sama esitys säilyy etunäkymän vaihtuessa suuresta pieneksi ja takaisin sekä kaulan mittojen, sijoituksen, kumoamisen ja uudelleenavauksen jälkeen. Ilman kaulaa näkyy rungon nykyinen etunäkymä. Sovita näyttää rungon ja kaulan satulaan asti; sovitus ei muuta millimetrimittoja eikä kamera siirry kesken muokkauksen. Rungon leveys-/pituusmitat tarkoittavat edelleen rungon omia ääriarvoja. Kaula-työtilan nauhaesikatselu ja taskun laskennassa tarvittavat nauhat säilyvät.

### Muutettavat vastuualueet tai tiedostot

- GTRfactoryyn tuotava, lähdeversioon sidottu kaulageometriamoduuli: lähtöaineistona FretFactoryn `src/geom`, tarvittavat parametrit, tyypit ja yksiköt. Olemassa olevat algoritmit ja vertailutestit säilyvät lähtökohtana; FretFactoryn omaa lähdehakemistoa ei muuteta osana tätä tuontia.
- GTRfactoryyn sovitettavat kaulasäätimet ja Preview: React-työtila, joka ottaa projektitilan ja muutostoiminnot rajapinnan kautta. Globaalia FretFactoryn `useAppState`-singletonia ei tuoda rinnakkaiseksi projektinomistajaksi.
- FretFactoryn `main.tsx`, App-sivustokuori, URL-jakotila ja ulkoiset rekisteröinnit jäävät itsenäisen sovelluksen vastuulle. Integroitu työtila ei kirjoita GTRfactoryn osoiteriviä, otsikkoa tai globaaleja palvelurekisteröintejä omatoimisesti.
- GTRfactoryn projektimalli, parseri, store, uusi Kaula-työtila sekä taskugeometrian sovitin: omistavat kokonaisen kitaraprojektin, historian ja sijoituksen. Kaula-UI:n tyylit ja näppäimistökomennot rajataan aktiiviseen työtilaan.

### Säilytettävät rajat

Kaikessa kanonisessa geometriassa mm; mm/in on näyttömuunnos. GTRfactoryssa kaulaesikatselu, tasku ja tallalinja käyttävät yhtä FretFactorysta peräisin olevaa geometriamoduulia; mensuuri- tai curved-laskentaa ei toteuteta erikseen uudelleen. Kiinteä bodyn keskinode ei liiku. Rungon vapaa solmumuokkaus ei muuta kaulan mensuuria tai parametreja. Haamureferenssit eivät vaikuta kaulaan tai taskuun. Runkotyötilan 1/2/3-esikatselut, suojaus ja tallennuksen virhepolut säilyvät. GTRfactoryn muutos tai julkaisu ei automaattisesti päivitä itsenäistä FretFactorya.

### Tietomalli- ja rajapintamuutokset

Ehdotus: versionoitu kaulasopimus sisältää parametrilähteen ja käytetyn geometriaversion sekä tulosgeometrian: nimetyt bass-/treble-sivureferenssit, keskilinja ja koordinaatisto, satulareferenssi kaikkien kielten kontaktipisteineen ja niitä kuvaavine viivoineen/käyrineen, numeroidut nauhaviivat/-käyrät, kielten tunnisteet ja kaikkien kielten täsmällinen tallan osumageometria. Etunäkymän satula- ja tallalinjat käyttävät tätä samaa laskettua geometriaa. Parametrit mahdollistavat kaulan jatkomuokkauksen; täsmällinen geometria ja versio säilyttävät vanhan suunnitelman uudelleenavauksessa. Laskentaversion päivitys ei saa hiljaisesti muuttaa tallennettua geometriaa.

Projektin uusi versio tallentaa kaulasopimuksen, kaulan sijoituksen, fyysisen kantapään määrittelyn ja taskun sovitus-/sädeasetukset. Päätymalli ja päätyvara erotetaan laskentageometriasta; esikatselun rajaus ei poista tallareferenssejä. Sovitusvaran X-kokonaisleveysmerkitys tallennetaan yksiselitteisesti eikä v3-lukua tulkita uudeksi normaalisiirroksi. Pelkät käsin annetut kaksi leveyslukua eivät enää omista taskun sivuja. Sivukohtaiset suorat/referenssit säilytetään erillisinä myös epäsymmetrisissä malleissa. Vanhaa v3-manuaalitaskua ei saa nimetä FretFactory-kaulaksi: se avataan tunnistettuna vanhana luonnoksena, body säilytetään, ja kaula liitetään ennen uuden automaattisen taskun käyttöä. Tarkka skeema ja vanhan luonnoksen korvauspolku lukitaan toteutusbriefissä.

Ensimmäisen liitosmallin rajaus on sovittava: taskuun tuleva kantapää seuraa FretFactoryn sivureferenssejä. Otelaudan reunaa ei saa väittää yleispätevästi fyysiseksi kantapääksi; poikkeavaa kantapääprofiilia vaativat kaulat tarvitsevat myöhemmän nimenomaisen geometrian, eivät piilotettua arvausta tai vapaata taskuleveyden säätöä.

### Toteutusjärjestys

1. Tuoteraja on vahvistettu: FretFactory säilyy itsenäisenä, yhdistämistä kehitetään GTRfactoryssa. Valitaan FretFactoryn tarkka lähdeversio ja rajataan GTRfactoryyn tuotavat moduulit sekä alkuperätiedon ylläpito.
2. Määritellään kaulasopimus ja talletetaan nykyisestä FretFactory-geometriasta vertailuaineistot. Varmistetaan bass-/treble-puolten merkitys koodista ja testeistä ennen sopimuksen lukitsemista.
3. Tuodaan laskenta ja sovitetaan kaulaeditorin tarvittavat osat GTRfactoryn omiksi moduuleiksi, erillään FretFactoryn sivustokuoresta. Julkaistun FretFactoryn toiminta säilyy ennallaan; integroitu laskenta varmennetaan valittua lähdeversiota vasten.
4. Lisätään GTRfactoryn Kaula-työtila, projektitila ja tallennus/history. Tähän vaiheeseen liittyy todellinen kaulan luonti ja jatkomuokkaus samassa sovelluksessa.
5. Kytketään nauhaan perustuva sijoitus, fyysinen kantapää, automaattinen kapeneva tasku ja tallan osumalinja. Poistetaan käsin annettujen taskuleveyksien käyttöpolku; vanhat projektit käsitellään eksplisiittisesti.
6. Lisätään tarvittaessa itsenäisen FretFactoryn versionoitu tiedostosiirto samaan sopimukseen. Säilytetään alkuperäinen vaatimus käyttää aiemmin tehtyjä kaulamalleja, mutta vanhaa nimetöntä SVG:tä ei tulkita automaattisesti kaulageometriaksi.

### Hyväksymiskriteerit

- Sama kaula antaa GTRfactoryssa ja valitussa FretFactory-lähdeversiossa saman geometrisen tuloksen sovittuun toleranssiin, myös monimittakaulassa ja kaarevilla nauhoilla. Mahdolliset myöhemmät tarkoitukselliset algoritmimuutokset versionoidaan ja dokumentoidaan erikseen.
- Kaulan muutos päivittää taskun oikeat, mahdollisesti eri kulmassa olevat sivut ja tallan osumalinjan; manuaalisia taskuleveyksiä ei ole.
- Fyysinen kaula päättyy esikatselussa omaan pyöristettyyn päätyynsä. Päätyvaran tai kulmasäteen muuttaminen ei muuta satulan, nauhojen tai tallan laskettua sijaintia. Tallalle jatkuvat laskentasivut eivät näy fyysisinä kaulan reunoina.
- Etunäkymä näyttää kaulan satulaan asti oikeassa millimetrimittakaavassa ja taskun kanssa samassa sijoituksessa, ilman nauhoja. Rungon liittymän reunaviiva näkyy kaulan läpi ja runkosolmujen muokkaus toimii myös päällekkäisellä alueella. Tämä säilyy suuren/pienen näkymän vaihdossa, kaulan muutoksissa, kumoamisessa ja projektin uudelleenavauksessa. Etunäkymän kaulapiirto on esikatselugeometriaa eikä muuta etusapluunan leikkuureunaa.
- Tallan osumalinja kulkee kaulamallin kaikkien kielten tallakontaktien kautta ja satulalinja vastaavien satulakontaktien kautta. Molemmat näkyvät etunäkymässä sekä suurena että pienenä ilman nauhoja. Kaulan mittojen tai sijoituksen muutokset, kumoaminen ja uudelleenavaus säilyttävät kontaktien ja viivojen vastaavuuden. Vino tai kaareva referenssi ei muutu esityksessä oletetuksi suoraksi poikkiviivaksi. Tallasta ei piirretä muita mittoja tai laitteiston ääriviivaa.
- Nollaväljyydellä kaulan ja taskun päätyprofiilit yhtyvät; positiivisen leveyslisän tasku sisältää kaulan taskuun tulevan osan. Liian suuri säde tai viimeistä nauhaa leikkaava pääty hylätään näkyvästi. Epäsymmetriset sivut ja koko kaareva viimeinen nauha kuuluvat tarkistukseen.
- Kiinteä keskinode säilyy täsmälleen, nauhasijoitus ei venytä mensuuria ja yksi kulmasäde säilyy tangentiaalisena kummallakin puolella.
- Työtilan vaihto, projektiavaus, kumoaminen ja virheellinen syöte eivät sekoita kahden sovelluksen tiloja tai hävitä bodymuokkauksia.
- Vanha projektigeometria ei muutu laskentakirjaston versionvaihdossa ilman nimenomaista päivityspolkua.

### Testit ja muut varmennustasot

Vertailut nykyiseen FretFactory-laskentaan ja vientiartefakteihin; tasa- ja monimittakaulat, useat kielimäärät, kaarevat nauhat sekä bass-/treble-identiteetti. Yksikkö- ja sopimustestit mm/in-muunnoksille, nauhavalinnalle, erillisille sivureferensseille ja säderajoille. Projektiversiotestit sekä oikea tiedoston tallennus ja uudelleenavaus. Molempien sovellusten testit/buildit peräkkäin; GTRfactoryn tuore desktop/kapea selainkoe ja itsenäisen FretFactoryn säilymisen koe. Geometrian näytöllä toimiminen ei korvaa valmistusartefaktin tai fyysisen sapluunan tarkistusta.

### Dokumentaatiovaikutukset

Tämä osio kuvaa suunnitelmaa ja käyttäjän korjattua tavoitetta. README pysyy nykyisen toteutuksen kuvauksena toteutukseen asti. Toteutuksen jälkeen README, kaulasopimus, projektiformaatti ja molempien sovellusten ajantasaiset käyttö-/geometriakuvaukset synkronoidaan.

### Riskit

Kaksi lähdekopiota eriytyy; globaali store, CSS ja URL-hash voivat vuotaa työtilojen välillä; raakamuuttujista uudelleenlaskettu geometria voi muuttua kirjastoversion vaihdossa. FretFactoryn nykyinen otelautamalli ei määritä fyysistä kantapäätä. GTRfactoryn tämänhetkinen symmetrinen manuaalitasku tarvitsee erillisiin sivureferensseihin perustuvan sovittimen. Nämä ovat suunnittelu- ja yhteensopivuusrajoja, eivät tämän kierroksen sovelluskorjauksia.

### Ratkaisematta jääneet asiat

Ei toteutusta estäviä tuotevalintoja. Lähdemoduuli, v4, v3-luonnoksen korvauspolku, ensimmäinen URL-parametrituonti sekä yhteisen päädyn 10 mm:n lähtöarvo on lukittu yllä. Poikkeama hyväksymiskriteereistä palautetaan arvioitavaksi. Fyysinen valmistusvarmennus ja SVG-/valmistusviennit kuuluvat myöhempiin vaiheisiin.

### Toteutusvaltuutuksen tila ja peruste

Voimassa: käyttäjän ”Lähde toteuttamaan suunnitelmaa” 8.9.2026 valtuuttaa tämän integraation toteutuksen ja varmennuksen GTRfactoryssa. FretFactory-sisarhakemisto säilyy vain luku -tilassa. Git- tai julkaisutoimia ei ole valtuutettu.

### VERIFICATION LEDGER — suunnitelman lähdenäyttö

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Tekniikka ja omistajuus | Molempien package.json; GTR project.ts; FretFactory App/main/store/Preview/share luettu | Yhteinen React/TS/Vite/Zustand-pohja; FretFactoryn globaali store, URL-synkronointi ja sivustokuori tarvitsevat rajatun sovittimen | 8.9.2026 | Nykyisen lähteen suunnittelunäyttö |
| Geometriaraja | FretFactory curved/naming/exporter sekä nykyinen brief ja GTR project.ts | Aidot sivu-/nauha-/satula-/tallareferenssit olemassa laskennassa; nykyinen SVG ei sisällä aiemmin ehdotettua semanttista kaulasopimusta; GTR v3 tallentaa vielä manuaaliset leveydet | 8.9.2026 | Kunnes kyseinen lähde muuttuu |
| Arkkitehtuurivertailu | feature_architect dimension_reference_design + pääagentin lähdekatselmointi | Integroitu kaulatyötila suositus; itsenäisen FretFactoryn jatko avoin; ei DESIGN READY -väitettä | 8.9.2026 | Alustava suunnitelma, ei toteutustesti |
| Vahvistettu tuoteraja | Käyttäjän jatkotarkennus, sama arkkitehti ja pääagentin suunnitelmapäivitys | FretFactory säilyy itsenäisenä julkaistuna sovelluksena; yhdistämisen omistaa GTRfactory. Ensivaiheen ehdotus on hallittu moduulituonti ja vertailut valittuun lähdeversioon. | 8.9.2026 edellisen arkkitehtuurivertailun jälkeen | Korvaa itsenäistä jatkoa koskevan avoimen kysymyksen; ei kooditoteutusta |
| Työtilan rajaus | FretFactory git status; GTR Git-juuri ja manifesti | FretFactory puhdas main; GTR oma juurensa. Tässä kierroksessa muutettiin vain tätä suunnitteludokumenttia. | 8.9.2026 | Tämän kierroksen näyttö |
| Fyysisen päädyn lähtöarvo ja rakenneraja | eGuitarPlansin alkuperäisen ohjeen verkossa indeksoitu PDF-kopio; Warmothin Number of Frets -rakennekuvaus; lähteet yllä | 3/8 tuumaa on yhden ohjeen viimeisen nauhan jälkeinen päätyvara. Warmothin 6,35/26,97 mm ovat otelaudan ylityksiä kantapäästä. Ehdotus 10 mm ei ole yleinen valmistusstandardi. | 8.9.2026, käyttäjän taustatutkimuspyyntö | Suunnittelun lähdenäyttö; ei fyysinen mittaus |
| Laskennan ja fyysisen reunan erottelu | FretFactory curved.ts:n nut/bridge-laskenta, core.ts ja instruments.ts; GTR neckPocket.ts:n fit/radius luettu | Satula–talla-laskenta säilytetään. overhang on sivureunavara. v3-sovitusvara on X-kokonaisleveyslisä. | 8.9.2026 | Luettu lähdetila; ei uutta sovellustoteutusta |
| Päädyn geometrian arvio | Sama feature_architect dimension_reference_design, rajattu jatko ja pääagentin vastatarkistus | Yhteinen R ja leveämmät taskusivut eivät automaattisesti aiheuta törmäystä; välys ei ole tasainen normaalisiirto. Sopimus säilyttää nykyisen leveysselitteen ja vaatii sisältymis-/koko nauhan tarkistukset. | 8.9.2026 | Suunnitteluarvio, ei ajettu geometriatesti |
| Etunäkymän yhdistetty kaula | Käyttäjän tarkennus ja pääagentin brief-päivitys | Kaula satulaan asti oikeaan paikkaan ilman nauhoja; rungon reunaviiva näkyy liittymässä kaulan läpi. Suunnittelun esikatselu ja rungon sapluunan leikkuureuna erotettu. | 8.9.2026, päätytutkimuksen jälkeen | Vahvistettu vaatimus ja suunnittelupäivitys; ei sovelluksen selain- tai testinäyttöä |
| Satulan kontaktiviiva | Käyttäjän tarkennus ja pääagentin brief-päivitys | Etunäkymän satulalinja johdetaan kaulan mitoista ja kaikkien kielten todellisista satulakontakteista; sama mittakaava ja sijoitus kuin kaulalla. | 8.9.2026, etunäkymän yhdistämisen jälkeen | Vahvistettu vaatimus; ei toteutus- tai testinäyttöä |
| Tallalinjan korjaus ja molempien linjojen näkyminen | Käyttäjän korjaus ja pääagentin brief-päivitys | Viivapyynnön pääkohde oli talla; myös satulalinja säilyy. Etunäkymässä näytetään molemmat kaulamallista johdettuina. Aiempi etunäkymän tallalinjakielto korvattu tässä suunnitelmassa. | 8.9.2026, satulatarkennuksen jälkeen | Korvaa edellisen rivin rajauksen pelkkään satulalinjaan; ei toteutus- tai testinäyttöä |
| Toteutusvalmius ja lähtövertailut | feature_architect dimension_reference_design: DESIGN READY; Git/manifestit; alkuperäisen FF-geometrian suoritus ja SHA-256-tiivisteet | GTRfactory oma repo, Node 24.15.0/npm 12.0.1; FretFactory puhdas yllä mainittu HEAD. Viisi golden-tapausta ja lähtökopio GTR:n tmp/neck-integration-baseline-kansiossa. | 8.9.2026 ennen workeria | Toteutuksen lähtötila; ei integraation läpäisyväite |

## Valmistunut toteutusvaihe — FretFactory-kaulaintegraatio

Tila: **TOTEUTETTU JA RIIPPUMATTOMASTI QA-VARMENNETTU 8.9.2026**. GTRfactoryssa on Kaula-työtila, FretFactoryn lähdeversioon sidottu laskenta, URL-parametrien tuonti, kaulan fyysinen pääty, automaattinen taskusovitus ja etunäkymän kaulalinjat. FretFactoryn erillinen sovellus ja sen lähdekoodi säilyvät muuttumattomina.

### Tavoite

Yhdistää kaulan suunnittelu, rungon liittymä, tasku ja tallan kielten osumalinja samaan GTRfactory-projektiin käyttäen alkuperäisen FretFactory-version laskentaa.

### Ei-tavoitteet

Ei FretFactoryn sovelluksen upottamista tai muuttamista, yleistä SVG-tuontia, laitteistokoloja, Z-syvyyttä, fyysistä valmistusvientia, natiivin Save As -dialogin tai fyysisen valmistuksen todistetta.

### Käyttäjän vahvistamat päätökset

FretFactory säilyy itsenäisenä julkaistuna sovelluksena; GTRfactory omistaa yhdistetyn työnkulun. Kaulan sivut, nauhat, satula- ja tallalinjat tulevat FretFactory-laskennasta. Kaulan fyysinen pääty ja sovitusvara täydennetään GTRfactoryssa. Kolmen suojatun liittymänoden keskimmäisen X/Y pysyvät täsmälleen paikoillaan; sivunodejen sijainti seuraa kaulan leveyttä. Kaulan ja taskun umpinaisen päädyn molemmat kulmat käyttävät yhtä yhteistä kulmasädettä.

### Sallitut paikalliset oletukset

**Luo kaula** käyttää oletuksena kuutta kieltä, 22 nauhaa, 647,7 mm mensuuria, liittymänauhaa 12, siirtoa 0 mm, päätyvaraa 10 mm, sädettä 6 mm ja kokonaisväljyysarvoa 0 mm. Kielijako on uloimpien kielten keskikohtien väli; `overhang` on kummankin sivun erillinen reunanvara. Yksiköt ovat sisäisesti millimetrejä, käyttöliittymä tukee mm/in-arvoja ja desimaalipilkkua. Tunnetun FretFactoryn tuetun alueen ulkopuoliset arvot hylätään, niitä ei clampata.

### Käyttäytymispolut

1. Kaula-työtilassa käyttäjä luo uuden kaulan tai tuo tunnetun `#state=`-URL:n. Tuonti vaatii kaikki olennaiset parametrit, ei käytä verkkoa eikä arvaa puuttuvia arvoja.
2. Kaulan esikatselu näyttää frets/stringit ja fyysisen pyöristetyn kantapään. Yksi lomakkeen hyväksyntä on yksi transaktio; Enter/Hyväksy hyväksyy, Esc/Palauta palauttaa ja blur säilyttää luonnoksen myös työtila- tai yksikkövaihdossa.
3. Tasku johdetaan kaulan sivuista. Nollaväljyys yhtyy kaulaan; positiivinen kokonaisväljyys jaetaan ±puolikkaaksi. Negatiivinen arvo on tarkoituksellinen ahdistus ja näytetään selitteenä.
4. Etunäkymä näyttää fyysisen kaulan satulasta kantapäähän, satulalinjan ja tallan kielten osumalinjan ilman nauhoja; bodyreuna näkyy kaulan päällä liittymässä. Taka näyttää bodyreunan ja keskiviivan. Kaulataskunäkymässä näkyvät avoin U ja yläosa.
5. Uusi/Avaa/Undo/Redo ja tallennettu v4-projekti säilyttävät atomisen kaulamuutoksen. V1/v2/v3 säilyvät body-projekteina; v3-tasku on vain vanha read-only-luonnos, jonka **Luo kaula** korvaa.

### Muutettavat vastuualueet tai tiedostot

Kaulalaskenta ja sovitus ovat `src/neck/fretfactoryGeometry.ts`, `src/neck/vendor/{core,curved,naming,pchip}.ts`, `automaticPocket.ts`, `heelClearance.ts`, `neckView.ts` ja `importFretFactory.ts`. UI on `src/editor/NeckWorkspace.tsx`; projektiformaatti ja transaktiot ovat `src/model/project.ts`, `src/file/projectFile.ts` ja `src/store.ts`.

### Säilytettävät rajat

Vendoroidut neljä FretFactory-moduulia vastaavat alkuperäistä HEAD-versiota `89f94c0e693b75528a41ac8fd8b682c04899f7fb`. FretFactoryn työtila pysyy puhtaana. Rungon vapaa muokkaus, body-mittaviivat, haamut ja suojaus säilyvät; body-mitat eivät sisällä kaulaa.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti on v4. `neck` sisältää parametrien lisäksi `calculationVersion`-tunnisteen, sijoituksen, fyysisen päädyn, sovitusvaran, tulosgeometrian snapshotin ja muuttumattoman liittymäreferenssin. Automaattista taskua ei tallenneta erillisenä geometriakopiona: uuden kaulan yhteydessä `body.neckPocket` on `null`, ja tasku johdetaan kaulan tiedoista. Tuntematon laskentaversio, puuttuva pakollinen parametri, ristiriitainen snapshot tai manipuloitu liittymä hylätään. V1/v2/v3 avautuvat ilman kaulaa; vanha v3-tasku säilyy tunnistettuna legacy-luonnoksena ja korvautuu vain käyttäjän käynnistämällä kaulan luonnilla tai tuonnilla.

### Toteutusjärjestys

FretFactory-lähdevertailut → vendor-moduulit → v4-malli/parseri → Kaula-työtila → sijoitus, pääty ja tasku → etu-/taka-/taskunäkymät → selain- ja riippumaton QA. Vaihe on toteutettu.

### Hyväksymiskriteerit

- Viisi alkuperäiseen FretFactory-HEADiin sidottua golden-tapausta vastaavat laskentaa.
- Kaulan muutos päivittää taskun sivut, fyysisen päädyn, satula-/tallalinjat ja sijoituksen yhdessä transaktiossa.
- PCHIP-kontakti- ja heel-clearance-tarkistus hylkää epävarman tai törmäävän geometrian; jatkuva käyrätarkistus käyttää kontrollikuorta/de Casteljau-rajoja ja määritettyjä toleransseja.
- V4-roundtrip, URL-tuonti, legacy-hylkäys, mm/in ja desktop/kapea selainpolku toimivat.

### Testit ja muut varmennustasot

59/59 unit, typecheck ja build PASS (`index-Cb20a2Qq.js`) ennen viimeistä pientä UI-korjausta. E2E:n aiempi kokoajo oli 34/34, exit 0, desktop ja iPhone 13 -kokoinen Chromium. Riippumaton QA **VERIFIED**: `tmp/neck-integration-qa-ledger.md`, `tmp/neck-integration-qa.json` ja `tmp/qa-neck-legacy.json`; kaula, tasku, kontaktiviivat, v4-lataus ja legacy-hylkäys tarkistettu, console-virheitä ja overflowia ei havaittu. Viimeisen UI-korjauksen jälkeen typecheck ja build läpäisivät uudella buildillä (`index-BOzIEPcF.js`), ja rajattu kaulaintegraation E2E oli 8/8, exit 0. Kokoajoa ei toistettu tämän pienen muutoksen jälkeen. Windowsin preview-sulkemisen korotettu taskkill oli testipalvelimen cleanup-toimi, ei sovellusvirhe. Ei fyysistä valmistus-, natiivia dialogi- tai julkaistun ympäristön näyttöä.

### Dokumentaatiovaikutukset

README kuvaa nykyisen kaulatyötilan ja importin. Tämä brief omistaa v4-sopimuksen, kaulaintegraation rajauksen ja ledgerin. Aiempi manuaalinen v3-vaihe merkitään historialliseksi.

### Riskit

PCHIP- ja jatkuvan käyrän collision-tarkistus on laskennallinen suunnittelutarkistus; se ei ole fyysisen valmistuksen todistus. Päätyvara on Y-etäisyys viimeisen nauhan maksimikoordinaatista tasaiseen päätyyn, ei pienin puuvaran mitta pyöristetyn päädyn ympärillä.

### Ratkaisematta jääneet asiat

Yleinen CAD/SVG-tuonti, hybridin muokkaustyökalut, hardware-kolot, FretFactoryn edistyneet ominaisuudet ja v1:n valmistusviennit ovat jäljellä. FretFactoryn lähdemuutosta ei tehty eikä erillistä valtuutusta ole saatu.

### Toteutusvaltuutuksen tila ja peruste

Käyttäjän pyyntö ”Lähde toteuttamaan suunnitelmaa.” valtuutti kaulaintegraation GTRfactoryssa. FretFactoryn repo, Git-toimet, julkaisu ja fyysinen valmistus eivät kuuluneet valtuutukseen.

### VERIFICATION LEDGER — FretFactory-kaulaintegraatio

Täydellinen näyttö on tiedostoissa tmp/neck-integration-root-ledger.md ja tmp/neck-integration-qa-ledger.md; yksityiskohtaiset QA-artefaktit ovat tmp/neck-integration-qa.json ja tmp/qa-neck-legacy.json.

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Laskenta, v4, migraatiot ja virhepolut | npm run test:run | PASS 59/59 unit-testiä; FretFactoryn viisi golden-tapausta, PCHIP-kontaktit, v4-roundtrip, v1–v3-rajat ja atomisuus | 8.9.2026 ennen viimeistä UI-korjausta | Kunnes relevantti lähde tai testi muuttuu |
| Tyyppitarkistus ja tuotantobuildi | npm run build (sisältää tsc -b) | PASS; build index-BOzIEPcF.js | 8.9.2026 viimeisen UI-korjauksen jälkeen | Kunnes relevantti lähde tai konfiguraatio muuttuu |
| Koko selainregressio | npm run test:e2e | PASS 34/34, exit 0; desktop ja iPhone 13 -kokoinen Chromium | 8.9.2026 ennen viimeistä UI-korjausta | Historiallinen näyttö; muuttuneiden polkujen kokonaisnäyttö vanheni |
| Rajattu kaulaintegraation selainkoe | npx playwright test tests/e2e/neck.spec.ts | PASS 8/8, exit 0; desktop ja iPhone 13 -kokoinen Chromium, uusi projekti nollaa virheilmoituksen; console/pageerror ja overflow PASS | 8.9.2026 build index-BOzIEPcF.js, viimeisen UI-korjauksen jälkeen | Kunnes kaulan UI, testi tai build muuttuu |
| Riippumaton selain-QA | final_editor_qa, artefaktit tmp/neck-integration-qa-ledger.md, tmp/neck-integration-qa.json, tmp/qa-neck-legacy.json | VERIFIED; kaula, automaattinen tasku, kontaktiviivat, v4-lataus, legacy-polut, mm/in, console ja overflow tarkistettu | 8.9.2026 ennen viimeistä UI-korjausta | Paikallinen selainnäyttö; ei fyysinen valmistuskoe |
| Jatkuvan päätytarkistuksen matematiikka | feature_architect, vain luku -katselmus heelClearance.ts / neckPocket.ts | Hyväksytty: cap-chordit ovat konservatiivinen sisäapproksimaatio, cubic-kontrollikuori ja de Casteljau varmentavat koko käyrän. Positiivinen X-väljyys sisältää fyysisen kaulan kelvollisilla sivuilla, samalla R:llä ja pääty-Y:llä. | 8.9.2026 ennen viimeistä UI-korjausta | Geometria ennallaan; ei fyysisen valmistuksen näyttö |
| FretFactoryn erillisyys | vain luku -SHA-tarkistus ja Git-tila | FretFactoryn 65 lähdetiedoston SHA:t muuttuivat 0; alkuperäinen työtila säilyi koskemattomana | 8.9.2026 | Kunnes FretFactory muuttuu |
| Valmistus ja julkaisu | Ei vienti-, natiivi-, julkaisu- tai fyysistä koetta | Ei näyttöä; CAD/SVG, hybridit, kolot ja valmistusviennit jäävät myöhempään vaiheeseen | 8.9.2026 | Avoin myöhemmälle vaiheelle |
## Historiallinen toteutusvaihe — manuaalinen v3-kaulatasku (korvattu)

Tila: **HISTORIALLINEN, KAULAINTEGRAATION KORVAAMA 8.9.2026**. Näkymään 3 lisättiin manuaalisesti määritettävä avoin U-muotoinen taskuluonnos ja projektiformaatin v3-tuki. Uuden kaulan luonnin yhteydessä tätä luonnosta ei enää käytetä ensisijaisena työnkulkuna; v3-tasku säilyy vain tunnistettuna vanhana luonnoksena.

### Tavoite

Käyttäjän suoraan GTRfactoryssa määritettävä kaulataskun 2D-luonnos, jonka keskireferenssi pysyy kiinteänä ja jonka päätykulmissa on yhteinen todellinen säde.

### Ei-tavoitteet

Ei FretFactory-tuontia, nauhasijoitusta, tallan mitoitusta, Z-syvyyttä, CAD-booleania tai valmistuskelpoista vientiä.

### Käyttäjän vahvistamat päätökset

Keskimmäinen body-node ei liiku myöskään järjestelmän sovituksessa; sivut sovitetaan kaulan leveyteen. Umpinaisen päädyn molemmille kulmille on yksi yhteinen sädesäätö. Etu/taka näyttävät vain bodyreunan ja keskiviivan.

### Sallitut paikalliset oletukset

Muokattavat esimerkkialkuarvot ovat suu 56 mm, kanta 56 mm, pituus 76 mm, kokonaisväljyys 0 mm ja säde 6 mm; nämä eivät ole käyttäjän vahvistamia kaulan mittoja. Pituus mitataan keskireferenssin Y-koordinaatista ja väljyys jaetaan ±puolikkaaksi X-suunnassa. Suun Y-arvot säilyvät ja X-erot skaalataan. Vapaat endpoint-kahvat ja vasemman päätepisteen vapaa lähtevä segmenttityyppi säilyvät. Säde 0 sallii kulman; liian suuri säde hylätään. Mm/in-kentät hyväksyvät desimaalipilkun.

### Käyttäytymispolut

1. Näkymän 3 **Määritä kaulatasku** luo luonnoksen oletusarvoilla ja kertoo, ettei mittaa ole tuotu kaulasta.
2. Kentät muuttavat taskua atomisesti; Enter/blur hyväksyy, Esc peruu ja virheellinen arvo säilyttää projektin.
3. Taskun suu korvataan näkymässä 3 avoimella U-polulla. Yläosan alaraja on taskun päädyn alla vähintään 20 mm, fallback 230 mm. Etu/taka eivät näytä taskun sisäreunaa.
4. Yksi säde tuottaa kaksi tangentiaalista SVG A -kaarta. Containment on näytepohjainen luonnosvaroitus, ei CAD-boolean.
5. Uusi ja sivun lataus aloittavat ilman taskua. Onnistunut Avaa palauttaa v3-tiedostoon tallennetun taskun; v1/v2 avautuvat ilman taskua. Undo/redo palauttavat kyseisen historiatilan taskun ja dirty seuraa projektin muutoksia.

### Muutettavat vastuualueet tai tiedostot

`src/geometry/neckPocket.ts`, `src/model/project.ts`, `src/file/projectFile.ts`, `src/store.ts`, `src/editor/NeckPocketControls.tsx`, `EditorCanvas.tsx` ja niiden testit omistavat geometrian, v3-formaatin, transaktiot ja UI:n.

### Säilytettävät rajat

Bodyeditorin suojattu kaulaliittymä, vapaat endpoint-kahvat, kolme näkymää ja haamumalli säilyvät. FretFactoryn lähdekoodia ei muutettu eikä julkaisu- tai Git-toimia tehty.

### Tietomalli- ja rajapintamuutokset

Formaatti on v3. `body.neckPocket` on `null` tai sisältää parametrit, `datumNodeId`-tunnisteen, suuketjun suunnan ja alkuperäisen kolmen noden `referenceBoundaryNodes`-snapshotin. V1/v2 migroituu v3:n `null`-tilaan koordinaatit säilyttäen. Snapshot estää peräkkäisen leveyssovituksen virheen kertymisen.

### Toteutusjärjestys

Geometriaydin → formaatti/migraatio → store → tasku-UI/näkymä 3 → selain- ja riippumaton QA. Vaihe on toteutettu.

### Hyväksymiskriteerit

- Keskinode pysyy täsmälleen paikallaan ja sivut sovittuvat leveyteen.
- U-aukko näkyy taskunäkymässä, etu/taka eivät näytä sisäreunaa.
- Sädekaaret ovat tangentiaalisia ja samaa sädettä; liian suuri säde hylätään.
- Mm/in, undo/redo, dirty, v3-roundtrip ja v1/v2-migraatio toimivat.

### Testit ja muut varmennustasot

Worker: 48/48 unit, typecheck ja build PASS (`index-CeJauXIf.js`). Rootin korotettu `npm run test:e2e`: 28/28 PASS, desktop ja kapea Edge. Riippumaton QA **VERIFIED** (`tmp/qa-pocket-fix-result.json`): 56 mm ↔ 2,204724 in, 60,05 mm roundtrip, säde/vapaa endpoint/v3-roundtrip, 76 mm ilman varoitusta, 500 mm varoitus, console-virheitä ja overflowia ei havaittu. Ei fyysisen valmistuksen, natiivin Save As -dialogin tai julkaisun näyttöä.

### Dokumentaatiovaikutukset

README kuvaa manuaalisen taskun nykyisen käytön. FretFactory-tuonti, automaattinen kohdistus ja valmistusvienti säilyvät koko v1:n myöhempinä vaiheina.

### Riskit

Containment-varoitus on approksimaatio eikä todista valmistuskelpoisuutta. 2D-luonnos ei ratkaise jyrsinnän syvyyttä tai fyysistä sopivuutta.

### Ratkaisematta jääneet asiat

FretFactory-viennin erillislupa on kysytty, mutta vastausta ei ole saatu eikä muutosta tehty. Kaulatuonti, nauhasijoitus, tallan osumalinjan tuonti ja valmistusvienti ovat avoimia.

### Toteutusvaltuutuksen tila ja peruste

Käyttäjän pyyntö ”Lähdetään toteuttamaan tämän ja antamiesi ideoiden pohjalta” sekä kiinteää keskinodea ja yhteistä kulmasädettä koskevat tarkennukset valtuuttivat tämän GTRfactory-vaiheen. Käsin täydennettävä tasku toteutettiin riippumattomana osana odotettaessa FretFactory-viennin erillislupaa; käyttäjän ei väitetä rajanneen koko pyyntöään vain manuaaliseen vaiheeseen. Valtuutus ei kata Git-toimia, julkaisua tai fyysistä valmistusta.

### VERIFICATION LEDGER — manuaalinen kaulatasku

| Tarkistus | Komento tai menetelmä | Tulos ja todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Geometria, tila ja tiedostot | Worker: `npm run test:run`, `npm run typecheck`, `npm run build` | PASS 48/48 testiä, tyyppitarkistus ja build; kiinteä datum, säteet, v3 ja vapaat segmentit | 8.9.2026, `index-CeJauXIf.js` | Kunnes relevantti lähde, testi tai konfiguraatio muuttuu |
| Koko selainregressio ja uusi taskupolku | Pääagentti: `npm run test:e2e`, Windowsin korotettu paikallinen suoritus testipalvelimen sulkemista varten | PASS 28/28, exit 0, 1,1 min; tuore build, desktop Edge ja kapea Chromium-simulaatio, todellinen v3-lataus/uudelleenavaus | 8.9.2026, sama build | Kunnes relevantti UI, formaatti tai testi muuttuu |
| Riippumaton QA | `final_editor_qa`, tuoreet Edge-kontekstit 1280/390 px, `tmp/qa-pocket-fix-result.json` ja selaimella ladatut projektit | VERIFIED; vapaa Suora-segmentti säilyy sädesäädön ja v3-avauksen yli, 56 mm ↔ 2,204724 in, 60,05 mm säilyy; normaali 76 mm tasku ilman varoitusta, 500 mm tasku varoittaa; ei konsolivirheitä tai ylivuotoa | 8.9.2026 korjauskierroksen jälkeen | Paikallinen selainnäyttö, ei fyysinen valmistuskoe |
| QA:n ensimmäiset löydökset | Sama QA ja pääagentin lähdekatselmointi | FAILED: vapaa lähtevä segmentti lukittui parserissa ja liian pitkä tasku jäi varoituksetta. Molemmat korjattu ja uudelleen varmennettu yllä. | 8.9.2026 ennen korjauskierrosta | Historiallinen, ei avoin vika |
| FretFactory-raja | Pääagentti: lähdekoodin vain luku -tarkistus ja `git status --short --branch` | Työtila puhdas `main...origin/main`; SVG-viennin semanttinen laajennus ja siihen perustuva tuonti tekemättä, erillislupakysymys avoin | 8.9.2026 lopputila | Kunnes FretFactory muuttuu tai käyttäjä päättää rajauksesta |
| Valmistus ja julkaisu | Ei vienti-, fyysistä, natiivin Save As -dialogin tai julkaistun ympäristön koetta | Ei näyttöä; manuaalinen esikatselu ei ole valmistusvalmis sapluuna | 8.9.2026 | Avoin myöhemmälle vaiheelle |

Yksityiskohtaiset väliaikaiset artefaktit ovat `tmp/neck-pocket-ledger.md`- ja `tmp/qa-pocket-*.json`-tiedostoissa. Aiemmat ledger-osiot säilyvät historiallisina.

## Valmistunut toteutusvaihe — projektipohja

Tila: **VALMIS JA VARMENNETTU 6.9.2026**. Tämä valmisteluvaihe edeltää ensimmäistä käyttökelpoista editoria; sen valmistuminen ei tarkoita editorin tai koko v1:n valmistumista.

### Tavoite

Oma paikallinen Git-repo päähaaralla main ja käynnistyvä React/TypeScript/Vite-sovellus Zustandilla. Kehitys-URL on http://127.0.0.1:5174 ja tuotantoesikatselun URL http://127.0.0.1:4174. Molemmissa käytetään strictPort-asetusta.

### Ei-tavoitteet

Ei CAD-geometriaa tai esimerkkirunkoa, solmueditoria, kolmen CAD-näkymän toimintoja, pysyvää projektiformaattia, FretFactory-tuontia, valmistusvientejä, FretFactory-lähdemuutoksia tai ulkoisia julkaisu- ja Git-toimia.

### Käyttäjän vahvistamat päätökset

Projektipohjan perustaminen on valtuutettu yllä lainatulla pyynnöllä. FretFactoryn tekniikoita käytetään aiemman päätöksen mukaisesti. Koko v1:n tuoterajaukset säilyvät.

### Sallitut paikalliset oletukset

Käytetään paikallisessa FretFactoryssa varmennettuja React 18-, Zustand 4-, TypeScript 5-, Vite 7- ja Vitest 3 -versioita. Täsmälliset suorat riippuvuudet ja npm-lukitustiedosto kirjataan. Nykyinen Node 24.15.0 ja npm 12.0.1 dokumentoidaan; GTRfactory ei edellytä globaalien työkalujen päivitystä. Playwright asennetaan projektiriippuvuudeksi ja paikallisena selaimena käytetään asennettua Edgeä; selainasennuksen tarve dokumentoidaan. CDR-alkuperäiset ja johdetut suuret referenssiartefaktit säilyvät levyllä sovellusbundlen ja oletusarvoisen Git-seurannan ulkopuolella. Analyysin Markdown- ja JSON-dokumentit säilyvät seurattavina.

### Käyttäytymispolut

Asennus npm ci -komennolla → kehityskäynnistys → GTRfactoryn aloitusnäkymä → sivun uudelleenlataus säilyttää rehellisen projektipohjan tilan. Näkymä toimii leveällä ja kapealla näytöllä. Se ei näytä toimimattomia editori- tai vientipainikkeita. Varattu portti estää palvelimen käynnistyksen eikä ohjaa huomaamatta toiseen projektiin. Tuotantokäännös ja sen tuore selainkoe käyttävät samaa App-käynnistyspolkua. Zustand omistaa vain todellisen nykyisen sovellusvaiheen, ei kuvitteellista CAD-tilaa.

### Muutettavat vastuualueet tai tiedostot

GTRfactoryn package.json ja lukitustiedosto, Node-version määritys, .gitignore, paikallinen .git-alustus, index.html, src-käynnistys/App/tyylit/store, TypeScript/Vite/Vitest/Playwright-asetukset, rajatut smoke-testit, README.md, AGENTS.md ja tämä FEATURE_BRIEF.md. Luodaan vain nyt tarvittavia moduuleja. FretFactory ja alkuperäinen CDR-aineisto säilyvät muuttumattomina.

### Säilytettävät rajat

Nykyiset suunnittelupäätökset ja taustamateriaalit säilyvät. Ei tehtaan 1:1-mallia esittävää testirunkoa. Myöhempi geometria on mm-pohjainen, näkymämuunnokset erillisiä. Kehityspalvelin sidotaan paikalliseen osoitteeseen. Ei remotea, commitia tai julkaisua.

### Tietomalli- ja rajapintamuutokset

Vain sovelluksen käynnistys ja nykyvaiheen paikallinen tila. Ei pysyvää formaattia, kaulatuonnin sopimusta, tallennusta tai ulkoista rajapintaa.

### Toteutusjärjestys

1. Projektiasetukset, riippuvuudet ja Git-alustus.
2. Käynnistyvä, saavutettava aloitusnäkymä ja todellisen sovellusvaiheen tila.
3. Komponentti-/käynnistystason Vitest-smoke ja projektikohtainen Playwright-varmennus.
4. Asennuksen, typecheckin, testien, tuotantobuildin ja tuoreen selaimen tarkistus sekä riippumaton QA.
5. Nykytiladokumentaatio ja verification ledger todelliseen lopputulokseen.

### Hyväksymiskriteerit

- Git-juuri on repositorion juuri ja alkuhaara main; kyseinen historiallinen lähtötila ei sisältänyt committeja tai remoteja.
- npm ci asentaa omat riippuvuudet lukitustiedostosta. Projektin testit eivät vaadi Codexin mukana toimitettua Node-/Playwright-kirjastopolkua.
- Dev käyttää porttia 5174 ja preview porttia 4174; porttikonflikti palauttaa virheen.
- App näyttää GTRfactoryn ja projektipohjan vaiheen. Ei editorin, tuonnin tai vientien valmistumisväitettä eikä näennäistoimintoja.
- Työpöytä- ja kapea näkymä ovat luettavia ilman vaakaylivuotoa.
- TypeScript, Vitest ja build läpäisevät; Playwright tarkistaa oikean URL:n, uudelleenlatauksen ja aloitusnäkymän ilman console.error-, pageerror- tai window.error-tapahtumia.
- Selainkoe tehdään myös tuoreesta tuotantobuildista; testiajo ei käytä huomaamatta valmiiksi käynnissä olevaa muuta palvelinta.
- Gitin seurantaan tarjoutuvat vain tarkoituksenmukaiset lähteet, testit ja dokumentit; riippuvuudet, buildit, väliaikaistulokset ja CDR-alkuperäiset jäävät ulkopuolelle.
- README ja AGENTS kuvaavat toimivat komennot ja valmistuneen rajauksen. FretFactoryn työtila ja CDR-aineisto säilyvät ennallaan.

### Testit ja muut varmennustasot

Varmenna npm ci, tyyppitarkistus, rajattu Vitest-smoke, build, tuore paikallinen selain työpöytä- ja kapealla leveydellä, uudelleenlataus sekä varatun portin polku. Tarkista oikean buildin näkymä ja selainvirheet. Tarkista Git-tila ja taustamateriaalin säilyminen. Testitulokset kirjataan VERIFICATION LEDGER -taulukkoon komennon/menetelmän, tuloksen, todistettavan asian, lähtötilan/ajankohdan ja voimassaolon kanssa. Valmistusartefakti- ja fyysinen varmennus eivät sovellu tähän vaiheeseen. Työnkulkunäytteiden keruuta ei ole otettu projektissa käyttöön; sitä ei käynnistetä automaattisesti.

### Dokumentaatiovaikutukset

README kuvaa nykyisen toiminnan ja käynnistyksen. AGENTS kuvaa projektin suoritusprofiilin, dokumenttien vastuut ja varmennuksen rajat; globaalia työnkulkua ei kopioida rinnakkaisena sopimuksena. FEATURE_BRIEF säilyttää suunnitelman, vaiheen rajauksen, toteutusvaltuutuksen ja varmennusnäytön. Suunniteltuja CAD-toimintoja ei dokumentoida toteutetuiksi.

### Riskit

Codexin tavallinen komentoympäristö epäonnistuu setup refresh -alustukseen; toimiva erikseen hyväksytty suoritusreitti mahdollistaa tämän työn. Käyttäjän järjestelmäasetuksia tai sandboxin suojaustasoa ei muuteta. Asennuksen tai selaimen saatavuuden puutteet raportoidaan todellisena puuttuvana näyttönä. Vältetään tarpeettomia editoriarkkitehtuurin ja tiedostoformaatin lukituksia.

### Ratkaisematta jääneet asiat

Ei projektipohjan aloittamista estäviä käyttäjäpäätöksiä. CAD:n koordinaatti-, tuonti- ja vientisopimukset kuuluvat myöhempiin vaiheisiin.

### Toteutusvaltuutuksen tila ja peruste

Voimassa tässä vaiheessa: käyttäjän 6.9.2026 pyyntö ”Lähdetään toteutuksen ensimmäiseen vaiheeseen projektipohjan perustamisen kautta.”

## VERIFICATION LEDGER — suunnittelun lähtönäyttö

Tämä taulukko säilyttää ennen sovelluspohjan perustamista kertyneen historian. Sen puuttuvaa toteutusta tai valtuutusta kuvaavat rivit koskevat kyseistä lähtötilaa; nykyinen tila ja ne korvaava näyttö ovat alempana projektipohjan toteutus- ja QA-taulukoissa.

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| GTRfactoryn juuri | Hakemistolistaus ja Git-juuren kysely | Hakemisto oli tyhjä; ei Git-repoa, manifestia tai omaa AGENTS.md:tä | 6.9.2026 ennen tämän briefin luontia | Kuvaa lähtötilaa |
| FretFactoryn juuri | git rev-parse --show-toplevel, git status --short --branch | Erillinen FretFactory-työtila, puhdas main | HEAD 89f94c0e693b75528a41ac8fd8b682c04899f7fb, 6.9.2026 | Voimassa tämän lähtöversion osalta |
| Tuonnin tietosisältö | src/types.ts, src/utils/exporters.ts, src/utils/share.ts ja src/geom/curved.ts luettu | Ei kantapäämallia; reunoja jatketaan satulalta tallalle; nykyisessä SVG:ssä ei ehdotettua metadataa | Sama HEAD | Lähdekoodinäyttö, ei ajettu tuontikoe |
| Yksiköt | src/utils/units.ts ja SVG:n muodostus luettu | Sisäiset pituudet ja viewBox mm, fyysiset width/height mm tai in | Sama HEAD | Lähdekoodinäyttö |
| Kielten merkitys | src/geom/naming.ts ja curved.ts verrattu MULTISCALE_BEHAVIOR.md:hen | Koodissa bass-indeksi 0, diskantti viimeinen; dokumentti sanoo toisin | Sama HEAD | Ristiriita vaatii uuden sopimuksen testin; ei korjattu |
| Tuoterajaus | Käyttäjän vastaukset tässä keskustelussa | Oma runko ja hybridit, geneerinen Strat-aloitus, ääriviivat, erillinen tasku, molemmat vientitavat, vain tallan osumalinja, taskun täydennys GTRfactoryssa | 6.9.2026, tarkennus 2 | Voimassa kunnes käyttäjä muuttaa rajausta |
| Hybridin suunnitelma | Sama feature_architect arvioi rajatun muutoksen vain luku -tilassa | Käyttäjän ohjaama kaariketjun kopiointi, korvaus ja liittymien sovitus sopivat yhden suljetun runkopolun malliin; lisäkysymyksiä ei tarvita | 6.9.2026, tarkennus 2 | Suunnittelunäyttö, ei toteutuksen testitulos |
| Valmistuslähteet | Alla mainitut verkkolähteet | Taustatieto sapluunamenetelmästä ja aiemmin tutkittu piirustuslähde | 6.9.2026 | Tehdaspohjan hankinta ei ole enää toteutusehto; valmistusmenetelmän lähde säilyy taustatietona |
| Suunnitteludokumenttien johdonmukaisuus | Dokumenttidiffin katselmointi, vanhentuneiden tehdaspohjavaatimusten haku ja paikallisten linkkien tarkistus | Vanhat hankintavaatimukset poistettu, seitsemän käyttäytymispolkua, ei rikkinäisiä paikallisia linkkejä | 6.9.2026, tarkennus 2 | Dokumenttinäyttö; sovelluskoodia ei muutettu |
| UI-tekniikat | FretFactoryn package.json, src/App.tsx, src/components/Preview.tsx, src/store.state.ts ja src/styles/ui.css luettu | React/TypeScript/Vite, Zustand, React-SVG ja CSS Grid varmennettu; nykyinen vasen veto panoroi eikä vielä muokkaa solmuja | HEAD 89f94c0e693b75528a41ac8fd8b682c04899f7fb, 6.9.2026 | Lähdekoodinäyttö; uuden editorin käyttäytyminen on suunnitelma |
| UI:n rajaus ja minimit | Käyttäjän UI-pyyntö sekä saman feature_architect-agentin rajattu vain luku -arvio | Kolme yhteiseen tilaan perustuvaa näkymää, Muotoile ja Piirrä osuus sekä valinnan tilannekomennot; lisäkysymyksiä ei tarvita | 6.9.2026, tarkennus 3 | Suunnittelunäyttö; työkalusarjan helppoutta ei ole käyttäjätestattu |
| UI-suunnitelman johdonmukaisuus | tmp/reference-analysis/check_ui_brief.py, tmp/ui-design-revision.diff ja pääagentin katselmointi | Seitsemän käyttäytymispolkua, paikalliset linkit kunnossa; aiempi perus-/tarkka-tilan jako korvattu kahdella työkalulla; uusi ehdotus erotettu käyttäjän vahvistamista päätöksistä | 6.9.2026, tarkennus 3 | Dokumenttinäyttö; FretFactoryn työpuu säilyi puhtaana |
| UI-asetteluluonnos | tmp/reference-analysis/check_ui_mockup.cjs; paikallinen Edge, 1024/736/360 px, vaalea/tumma; kuvakaappaukset katsottu | Näkymänvaihdot ja esimerkin sileä/kulma-valinnan yhteinen päivitys toimivat; ei ylivuotoa tai konsolivirheitä. Näyttö: tmp/ui-layout-verification.json | 6.9.2026, tarkennus 3 | Vain keskustelun asetteluluonnos; ei CAD-geometrian, sovelluksen tai valmistusviennin varmennus |
| Taskusapluunan muoto | Käyttäjän tarkennus ja tämän briefin kohdat 3, 5, 6 sekä hyväksymiskriteerit | Yläosan muotoinen sapluuna ja taskuaukko korvaavat aiemman suorakaiteisen levyn tulkinnan; alarajaus on erillinen sapluunaparametri | 6.9.2026, tarkennus 4 | Suunnittelunäyttö; avoimen taskunsuun aiempi rajaus säilyy |
| Yläosasapluunan luonnos | tmp/reference-analysis/check_pocket_preview.cjs; Edge 1024/736/360 px, vaalea/tumma; työpöytä- ja kapean näkymän kuvat katsottu | Taskuaukko on avoin, yläosan sarvet mukana, alaosa rajattu pois; sarvimuutos välittyy taskukuvaan ja näkymät vaihtuvat. Ei ylivuotoa tai konsolivirheitä. Näyttö: tmp/pocket-upper-verification.json | 6.9.2026, tarkennus 4 | Vain keskusteluluonnoksen varmennus; ei valmistusgeometrian tai fyysisen sapluunan koe |
| Etu- ja takakuvan sisältö | Käyttäjän tarkennus; esikatselun piirtohaaran ja briefin katselmointi | Ulkoreuna ja keskiviiva molemmissa kuvissa; tasku- ja muut apuviivat poistettu näistä näkymistä. Muokkauskahvat säilyvät suuren editorin työkaluina | 6.9.2026, tarkennus 5 | Suunnittelu ja keskusteluluonnos; ei sovellustoteutus |
| Etu- ja takakuvan selainvarmennus | tmp/reference-analysis/inspect_front_back.cjs, paikallinen Edge; kuvakaappaus katsottu | Jokaisessa 1/2/3-vaihdossa molemmilla runkokuvilla yksi ulkoreuna ja yksi keskiviiva, ei tasku- tai tallaviivoja. Taskusapluuna säilyi, ei konsolivirheitä. Näyttö: tmp/outline-centerline-inspection.json | 6.9.2026, tarkennus 5 | Vain keskusteluluonnoksen varmennus |
| Asteikkojen rajaus | Käyttäjän pyyntö ja briefin kohdat Leveys- ja pituusasteikot sekä hyväksymiskriteerit | Molemmat akselit kaikissa kuvissa, yhteinen mm/tuuma-valinta ja sama geometrinen näkymämuunnos | 6.9.2026, tarkennus 6 | Suunnittelunäyttö; nykyinen esimerkkirunko ei ole lopullinen Strat-pohja |
| Asteikkoluonnoksen varmennus | tmp/reference-analysis/inspect_rulers.cjs, Edge 1024/736/360 px, vaalea/mm ja tumma/in; kuvat katsottu | Kuusi asteikkoa, ei päällekkäisiä lukuja tai ylivuotoa. Yksikönvaihto säilytti polun ja zoomin; zoom säilytti tekstimitat. Vaaka-asteikon kohdistus vastasi geometriamuunnosta myös takanäkymässä. Alkutarkistuksen reunuksen aiheuttama noin 5 px poikkeama korjattu. Näyttö: tmp/ruler-inspection.json | 6.9.2026, tarkennus 6 | Keskusteluluonnos; panorointia, lopullista Strat-pohjaa tai fyysistä mittakaavaa ei varmennettu |
| Näkymäkehysten tasaus | tmp/reference-analysis/check_aligned_previews.cjs; tuore paikallinen Edge, 1024/736/561/560/360 px, vaalea/mm ja tumma/in, kaikki 1/2/3-vaihdot; työpöydän ja kapean näkymän kuvat katsottu | 30 tilaa läpäisi tarkistuksen. Työpöydällä ylä- ja alareunojen poikkeama alle 1 px, 1024 px leveydessä 0 px. Kuusi asteikkoa säilyivät kohdistettuina alle 1 px poikkeamalla, ei päällekkäisiä asteikkolukuja, ylivuotoa tai konsolivirheitä. Näyttö: tmp/aligned-previews-verification.json | 6.9.2026, tarkennus 7 | Keskusteluluonnos; korvaa tarkennuksen 6 täsmällisen 1/4-asettelutulkinnan. Ei sovelluksen tai valmistuksen varmennus |
| Solmuihin perustuva muotoilu | Käyttäjän tarkennus; tmp/reference-analysis/check_node_demo.cjs ja check_aligned_previews.cjs; tuore paikallinen Edge; työpöydän ja kapean näkymän kuvat katsottu | Geometriapudotusvalikko poistettu. Yhden esimerkkisarven solmun ja kahvojen veto päivittää kaikki kolme kuvaa; sileän solmun kahvat säilyvät samalla suoralla, kulmasolmun kahvat liikkuvat itsenäisesti. Kumoa/tee uudelleen, Esc, nuolinäppäimet, peilattu taka ja taskun ulkoreunan muokkaus tarkistettu. Asteikot ja reunatasaus säilyvät. Näyttö: tmp/node-demo-verification.json ja tmp/aligned-previews-verification.json. Ensimmäisen vetotarkistuksen löytämä paikallisen tekstikorvauksen väärä kohde korjattu ja tarkistus läpäisty | 6.9.2026, tarkennus 8 | Keskusteluluonnos: yksi muokattava esimerkkisolmu. Ei koko CAD-editorin, solmujen lisäyksen/poiston tai valmistusgeometrian varmennus |
| Luonnoksen ResizeObserver-korjaus | runtime_diagnostician: lähde- ja erillissivudiagnoosi; pääagentti: skillin render.py-iframe ja tmp/reference-analysis/check_resize_embed.cjs, window.error-kuuntelu; check_node_demo.cjs ja check_aligned_previews.cjs | Ennen korjausta 10 ResizeObserver-virhettä kapean upotuksen koonmuutoksissa, pageerror/console tyhjät. Observerin DOM-päivitys siirretty yhteen jonotettuun requestAnimationFrame-kutsuun. Sama 66 tilan iframe-koe korjauksen jälkeen: 0 window.error-virhettä, ei jatkuvaa mutaatiosilmukkaa eikä ylivuotoa. Solmut, kahvat, kumoaminen, asteikot ja reunatasaus läpäisivät tarkistukset. Näyttö: tmp/resize-before-verification.json, tmp/resize-after-verification.json, tmp/resize-fix-evidence.json | 6.9.2026, tarkennuksen 8 luonnoksen paikallinen virhekorjaus | Paikallinen iframe- ja selainnäyttö; Codexin elävää upotuspintaa ei tarkastettu erikseen. Ei CAD-sovelluksen tai valmistusgeometrian varmennus |
| Toteutusvalmiuden arvio | Sama feature_architect-agentti, nykyinen brief ja pääagentin FretFactory-lähdeluku; käyttäjän laakeriterävastaus | Laakeriterä/1:1 vahvistettu. Aloitusmuoto, koko ääriviivan työkalut ja vaihtosopimus ovat toteutustehtäviä. Kokorajaehdotuksia ei muuteta hyväksytyiksi vaatimuksiksi. Ensimmäinen editorivaihe erotettu koko v1:stä. FretFactory edelleen puhdas HEAD 89f94c0e693b75528a41ac8fd8b682c04899f7fb; SVG:n vaihtometadata puuttuu ja bass-/treble-indeksien dokumenttiristiriita säilyy | 6.9.2026, tarkennus 9 | Suunnittelu- ja lähdekoodinäyttö; ei sovellustoteutusta tai uutta toteutusvaltuutusta |
| Kehitysympäristön lähtötarkistus | node --version, npm --version, git --version, Get-Command; FretFactory npm run test:run ja npm run build; git status; selain-/SVG-työkalujen tarkistus | Node 24.15.0, npm 12.0.1, Git 2.53.0; Edge 152 ja Inkscape 1.4.3 käytettävissä, Codexin bundled Playwright 1.62.1. FretFactory 13 testitiedostoa / 59 testiä ja build läpäisivät; Git-työpuu puhdas. GTRfactoryssa ei vielä Git-repoa, package.jsonia, projektiriippuvuuksia tai omaa AGENTS.md:tä. Tavallinen exec_command epäonnistui setup refresh -alustusvirheeseen; erikseen hyväksytty suoritusreitti toimi | 6.9.2026, FretFactory HEAD 89f94c0e693b75528a41ac8fd8b682c04899f7fb | Todistaa nykyisen FretFactory-työkaluketjun. GTRfactoryn projektipohjan, toistettavien testien ja Codexin tavallisen komentoympäristön valmistelu on vielä tekemättä; ei GTRfactory-sovellustoteutusta |
| Sovellustestit, selain ja artefakti | Ei toteutusta | Ei ajettu eikä väitetä läpäistyiksi | Suunnitteluvaihe | Avoin toteutusvaiheeseen |
| Fyysinen valmistus | Ei koetta | Ei näyttöä paperin tai sapluunan fyysisestä tarkkuudesta | Suunnitteluvaihe | Avoin |

## Käyttäjän toimittama taustamateriaali (6.9.2026)

CDR-kansiossa on 142 CorelDRAW X6 -piirustusta sekä yksi SVG ja yksi PDF. Käyttäjä valtuutti niiden käytön projektin taustamateriaalina. Kuuden edustavan CDR-mallin muunnos SVG:ksi ja visuaalinen tarkastus onnistuivat; tekstiasettelussa on muunnospuutteita. Rakenne- ja metatietotarkastus tehtiin kaikille 142 CDR-tiedostolle.

Aineisto kuvaa käyttäjän mahdollisesti tavoittelemia omia runkoja ja niiden hybridejä. Sitä käytetään sekä yksittäisten muokkausten että eri lähteistä yhdistettyjen kokonaisuuksien arviointiin. Mukana tullut RG-SVG on nykyisellä 96 px/in -tulkinnalla noin 8,19 % pienempi kuin saman CDR-mallin muunnos; tämä on lähteen yksikkötulkintaa koskeva havainto. Se ei estä muodon hyödyntämistä: käyttäjä määrittää omaan projektiin haluamansa koon. Alkuperäiset tiedostot säilytettiin muuttumattomina.

Stratocaster-pohjan puuttuminen tiedostonimistä ei ole este: geneerinen Strat-tyylinen aloitusmuoto piirretään ohjelmaa varten. Kaikkia lähdemalleja ei tarvitse tuotteistaa valmiiksi mallikirjastoksi. Käyttäjän vaatimus koskee oman mallin ja hybridien suunnitteluvapautta.

Tarkastuksen rajat, näytteet, tiivisteet ja mittavertailu: [CDR-aineistoraportti](reference-analysis/README.md).

## Taustalähteet

- [Electric Herald: Stratocaster Templates](https://www.electricherald.com/fender-stratocaster-templates/) oli aiemmin tutkittu piirustuslähde. Geneerisen aloitusmuodon toteutus ei enää riipu tämän tai muun tehdasmallia kuvaavan piirustuksen hankinnasta.
- [StewMac: Ball Bearing Router Bits](https://www.stewmac.com/stewmac-essentials/ball-bearing-router-bits) kuvaa sapluunajyrsintään tarkoitetut terät, joiden ohjainlaakeri vastaa terän halkaisijaa. Tämä tukee valittua 1:1-sapluunamenetelmää.
- FretFactoryn paikallinen lähdekoodi yllä mainitussa HEAD-versiossa on tuontisuunnitelman ensisijainen lähde.


## VERIFICATION LEDGER — projektipohjan toteutus

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| Git-juuri ja rajaus | `git init -b main`, `git status --short`, FretFactoryn lähtötilan pääagentin vain luku -tarkistus | GTRfactory on oma paikallinen Git-repo haaralla `main`; committeja tai remotea ei luotu. Seurattavat tiedostot ovat uusia Gitissä seuraamattomia tiedostoja, koska committia ei pyydetty. FretFactory säilyi puhtaana `main...origin/main`-tilassa HEAD `89f94c0e693b75528a41ac8fd8b682c04899f7fb`. | 6.9.2026 projektipohja | Voimassa kunnes Git- tai rajausasetukset muuttuvat |
| Taustamateriaalin säilyminen | Pääagentin riippumaton SHA-256-lähtötarkistus; `.gitignore` ja `git check-ignore -v` | Kaikki 144 CDR-tiedostoa, yhteensä 44 120 972 tavua, vastasivat ennen kirjoituksia lähdetiivisteitä. `CDR/`, muunnetut ja renderoidut referenssit sekä analyysin PNG/SVG-kuvat ovat Gitin ja bundlen ulkopuolella; Markdown-, JSON- ja CSV-analyysit eivät ole yleisohituksen piirissä. | 6.9.2026 ennen projektipohjan kirjoituksia | Historiallinen lähtönäyttö; lopputilan SHA-256-tarkistus on kirjattu erikseen alle |
| Lukittu asennus | `npm ci` | 112 pakettia asennettu, auditointi 0 haavoittuvuutta. Projektissa on oma `package-lock.json`; testit eivät käytä Codexin runtime-polkuja. npm esti esbuildin postinstall-skriptin allowScripts-politiikan vuoksi, mutta Viten tuotantobuild käytti asennettua alustapakettia ja läpäisi. | Node 24.15.0, npm 12.0.1, 6.9.2026 | Voimassa kunnes relevantti asennus- tai lock-tiedosto muuttuu; `package-lock.json`-muutos vanhentaa näytön |
| Ensimmäinen relevantti build-virhe | Alkuvaiheen rinnakkainen `npm ci` + `npm run build` | Build palautti `'vite' is not recognized'`, koska samanaikainen `npm ci` poisti ja loi `node_modules/.bin`-hakemiston uudelleen buildin aikana. Se ei ollut Vite- tai lähdekoodivika. Korjauksen jälkeen tarkistukset ajettiin peräkkäin ja build läpäisi. | 6.9.2026 | Historiallinen virhenäyttö; ei avoin virhe |
| Tyyppitarkistus ja komponenttismoke | `npm run typecheck`; `npm run test:run` | `tsc -b` läpäisi projektiviitteet. Vitest 3.2.7: 1 testitiedosto / 1 testi läpäisi; testi renderöi oikean React `App`-komponentin Zustand-tilalla palvelinrenderöinnissä ja varmistaa toteutetun vaiheen sekä rehellisen rajauksen. | Tuore `npm ci`, 6.9.2026 | Voimassa kunnes relevantti lähde- tai asetustiedosto muuttuu |
| Tuotantobuild | `npm run build` | TypeScript ja Vite 7.3.6 läpäisivät; 39 moduulia, `dist/index.html` ja pakatut CSS/JS-tuotokset muodostuivat. | Tuore `npm ci`, 6.9.2026 | Voimassa kunnes relevantti lähde- tai asetustiedosto muuttuu |
| Kiinteän portin virhepolku | `npm run test:port-conflict` | Oma Node-smoke varasi Viten konfiguraation mukaiset `127.0.0.1:5174`- ja `127.0.0.1:4174`-portit vuorollaan. Dev ja preview palauttivat odotetun porttikonfliktivirheen; palvelin ei vaihtanut huomaamatta porttia. | Tuore tuotantobuild, 6.9.2026 | Voimassa kunnes Vite- tai porttiasetus muuttuu |
| Tuore tuotantobuild selaimessa | `npm run test:e2e`; Playwrightin `webServer` `reuseExistingServer:false`, Edge, desktop ja iPhone 13 -kokoinen Chromium-profiili | Playwrightin viimeinen ajo: `passed`, 2 testiä läpäisi. Testi tekee uuden buildin, käynnistää previewn osoitteessa `127.0.0.1:4174`, lataa sivun, tarkistaa otsikon ja rajauksen, lataa sivun uudelleen sekä kuuntelee `console.error`-, `pageerror`- ja `window.error`-tapahtumat. Molemmissa leveyksissä ei ollut vaakaylivuotoa tai selainvirheitä. Kuvakaappaukset: `test-results/foundation-project-foundat-4dec5-load-without-browser-errors-desktop-edge/desktop-edge.png` ja `test-results/foundation-project-foundat-4dec5-load-without-browser-errors-mobile-edge/mobile-edge.png`. | Tuore build, 6.9.2026 | Paikallinen selainnäyttö; ei julkaistu ympäristö |
| Valmistusartefakti ja fyysinen mittakaava | Ei sovellu projektipohjaan | PDF-, SVG- ja DXF-vientejä tai fyysisiä sapluunoita ei ole toteutettu eikä varmennettu. | 6.9.2026 | Avoin myöhemmälle vientivaiheelle |
| Riippumaton QA ja lopputilan selainkoe | foundation_qa: `npm run typecheck`, `npm run test:port-conflict`, `npm run test:e2e` (tuore build + 2 Edge/Chromium-koetta); pääagentin uusi dev-koe | PASS 6.9.2026: typecheck, Vitest 1/1, build, porttikonflikti dev+preview, E2E 2/2 desktop+kapea Chromium, reload, `console.error`/`pageerror`/`window.error` ja overflow läpäisivät. Dev-koe 2026-09-06T19:03:32.007Z: HTTP 200, otsikot `Projektipohja on valmis` ja `Runkoeditori`, errors=[] ja overflow=false. | QA 6.9.2026; dev-koe 2026-09-06T19:03:32.007Z | Voimassa kunnes relevantti lähde-, testi- tai asetustiedosto muuttuu; paikallinen selain, ei julkaisu- tai fyysinen koe |
| Aineiston ja FretFactoryn lopputila | Pääagentti: kaikki source-inventory.jsonin SHA-256-tiivisteet verrattu CDR-tiedostoihin; FretFactoryn git status ja rev-parse HEAD | Kaikki 144 tiedostoa täsmäsivät, mismatches=[]. FretFactory puhdas main...origin/main, HEAD 89f94c0e693b75528a41ac8fd8b682c04899f7fb. GTRfactoryn main-haaralla ei committeja tai remotea. | 2026-09-06T19:02:26.969Z | Todistaa tämän lopputilan; relevantti tiedosto- tai Git-muutos vanhentaa näytön |
| Käyttäjälle käynnistetty kehitysnäkymä | npm run dev; HTTP-pyyntö; pääagentin tuore Edge-koe projektin omalla Playwrightilla | Kehityspalvelin jäi käyntiin osoitteeseen http://127.0.0.1:5174, PID 26844. HTTP 200, title GTRfactory, odotetut otsikot, errors=[] ja overflow=false. Kuva tmp/foundation-dev-final.png. Codex-paneelin avauspyyntö palautti queued, joten paneelin näyttämistä ei väitetä varmennetuksi. | Selainkoe 2026-09-06T19:03:32.007Z | Paikallinen dev-selainnäyttö; palvelimen tila koskee tätä ajankohtaa. Tuotantobuildin ja valmistuksen näyttötasot ovat erilliset |

### Projektipohjan QA-korjauskierros — 6.9.2026

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| E2E:n tyyppikattavuus | `tsconfig.node.json` sisältää `tests/e2e`, DOM-, DOM.Iterable-, Node- ja Playwright-tyypit; `npm run typecheck` | `tsc -b` tarkistaa nyt Playwright-testit osana projektiviitteitä. Ensimmäinen ajo havaitsi vahingossa syntyneen kirjaimellisen kenoviiva–n-merkkiparin sisältäneen tekstikorvausvirheen; korjauksen jälkeen tyyppitarkistus läpäisi. | QA-korjauskierros 6.9.2026 | Voimassa kunnes relevantti testi- tai TypeScript-asetustiedosto muuttuu |
| Todellisen Vite-konfiguraation porttivirheet | `npm run test:port-conflict`; Viten `loadConfigFromFile` ja projektin Vite-bin ilman testin lisäämiä host-, portti- tai strictPort-argumentteja | Testi luki `vite.config.ts`:stä `server`- ja `preview`-asetukset, varasi kummankin portin vuorollaan ja käynnisti `vite dev` sekä `vite preview` niiden omalla asetuksella. Molemmat palauttivat odotetun virheen: dev `127.0.0.1:5174`, preview `127.0.0.1:4174`. Timeout ja prosessin/portin sulku säilyvät testissä. | QA-korjauskierros 6.9.2026 | Voimassa kunnes relevantti Vite-asetus muuttuu |
| Päivitetty aloitusnäkymä | `npm run test:run`; `npm run test:e2e` | Aloitusnäkymä näyttää nykyisen projektipohjan lisäksi seuraavan vaiheen tekstin: `Seuraavaksi`, `Runkoeditori` ja suunnitellut runkoeditorin osat ilman FretFactory-sopimustekstiä. React-smoke ja tuore tuotantobuildin Edge-koe läpäisivät. | Tuore build 6.9.2026 | Voimassa kunnes relevantti UI-lähdetiedosto muuttuu |
| Tuore tuotantobuild selaimessa | `npm run test:e2e`, Playwright `webServer` `reuseExistingServer:false`, Edge desktop ja iPhone 13 -kokoinen Chromium-profiili | 2/2 testiä läpäisi. Lataus, reload, uusi seuraavan vaiheen teksti, `console.error`, `pageerror`, `window.error` ja vaakaylivuoto tarkistettiin. Kuvakaappaukset: `test-results/foundation-project-foundat-4dec5-load-without-browser-errors-desktop-edge/desktop-edge.png` ja `test-results/foundation-project-foundat-4dec5-load-without-browser-errors-mobile-edge/mobile-edge.png`. Vanha E2E-ajo vapautti portit; myöhempi dev-palvelin jäi pääagentin koeajoa varten käyntiin. | Tuore build 6.9.2026 | Voimassa kunnes relevantti lähde-, testi- tai asetustiedosto muuttuu; paikallinen selainnäyttö, ei julkaistu ympäristö |







## Vaakanäkymä — toteutettu ja riippumattomasti QA-varmennettu 8.9.2026

### Tavoite

Runkonäkymät ja Kaula-työtilan esikatselu esitetään vaakana siten, että kaula osoittaa oikealle. Työpöydän pikkunäkymäsarake on kavennettu ilman muutosta kanoniseen geometriaan.

### Ei-tavoitteet

Kanoninen mm-geometria, X/Y-kentät, v4-projektiformaatti, taskulaskenta, FretFactory-vendor ja sisarprojekti eivät muutu. Muutos ei lisää CAD/SVG-tuontia, hybriditoimintoja, laitteistokoloja tai valmistusvientiä.

### Käyttäjän vahvistamat päätökset

1/2/3-näkymät ja suuren näkymän pikkupino säilyvät. Kaula osoittaa oikealle. Pikkusarake saa olla desktopissa 300–390 px; mobiilin pino säilyy.

### Sallitut paikalliset oletukset

`screenX=offsetX-worldY*s` ja `screenY=offsetY+worldX*s`; takanäkymä peilaa vain screenY:n X-osan. Vaaka-asteikko kuvaa worldY-pituutta ja pystyasteikko worldX-leveyttä. `Y↔`- ja `X↕`-merkinnät, vasen/oikea-nuolet ja ylös/alas-nuolet seuraavat näytön suuntaa. Pikkusarake käyttää `clamp(300px,24vw,390px)`-rajausta desktopissa ja aiempi asettelu alle 850 px leveydellä.

### Käyttäytymispolut

Aukeaminen, näkymänvaihto, solmu- ja kahvaveto, valintalaatikko, zoomaus, panorointi, Sovita, nuolinäppäimet, haamumalli ja Kaula-esikatselu käyttävät samaa muunnosta. Bodyn leveysmitta on vasemmalla ja pituusmitta alhaalla; kaula osoittaa oikealle ja satula- sekä tallalinja seuraavat kaulan geometriaa. Kaikki kolme body-näkymää päivittyvät samasta kanonisesta projektista.

### Muutetut vastuualueet tai tiedostot

`viewport.ts`, `EditorCanvas.tsx`, `App.tsx`, `NeckWorkspace.tsx`, `styles.css` sekä niiden kolme rajattua testiä. Malli-, formaatti-, kaulalaskenta- ja FretFactory-tiedostoja ei muutettu.

### Säilytettävät rajat

Kanoninen data ja v4-formaatti säilyvät. FretFactory pysyy erillisenä. Vaakanäkymä on näyttö- ja syötemuutos, ei valmistusgeometrian muutos.

### Tietomalli- ja rajapintamuutokset

Ei muutoksia tietomalliin, projektiformaattiin tai ulkoiseen rajapintaan.

### Toteutusjärjestys

Yhteinen viewport-muunnos → renderöinti ja syötteet → breakpointit ja korttiasettelu → kohdistetut testit → tuore selain-QA → dokumentaatio.

### Hyväksymiskriteerit

Negatiivinen Y näkyy oikealla kaikissa näkymissä, taka peilaa X:n mutta ei kaulaa vasemmalle, keskiviiva on vaakana, asteikot ja mittaviivat ovat oikein suunnatut, nuolet/veto/marquee/zoom/pan/Sovita toimivat ja kaulapreviewin satula on oikealla. Kapealla näytöllä ei ole vaakaylivuotoa.

### Testit ja muut varmennustasot

Workerin 60/60 unit-testiä läpäisivät. Tuoreella buildillä ajettu koko E2E oli 38/38 PASS ennen viimeistä pystyrulerin tekstirajan korjausta; sen jälkeen kohdistettu layout-koe oli 2/2 PASS ja riippumaton follow-up-QA VERIFIED. Kokoajoa ei toistettu tekstirajakorjauksen jälkeen. QA kattoi leveydet 1440, 851, 850, 481, 480 ja 390 px; console-, window.error- ja overflow-tarkistukset läpäisivät. Näyttö ei kata fyysistä mittakaavaa, vientiä, natiivia Save As -dialogia, Safaria tai julkaistua ympäristöä.

### Dokumentaatiovaikutukset

README kuvaa vaakanäkymän, asteikkojen suunnan, nuolinäppäinten toiminnan ja Kaula-esikatselun oikealle suuntautumisen. Tämä brief omistaa vaakanäkymän toteutuneen rajauksen ja ledgerin.

### Riskit

Muunnoksen renderöinnin ja syötteiden eriytyminen voisi kääntää akselit eri tavoin; yhteinen viewport-sopimus ja selainkokeet pienentävät tätä riskiä. Mittakaava- ja valmistuskelpoisuutta ei ole varmennettu.

### Ratkaisematta jääneet asiat

Ei tämän muutoksen toteutusta estäviä asioita. Fyysiset sapluunat, valmistusviennit ja muut v1:n myöhemmät ominaisuudet pysyvät aiemmin rajattuina.

### Toteutusvaltuutuksen tila ja peruste

Käyttäjän vaakanäkymää koskeva pyyntö valtuutti tämän rajatun UI-muutoksen. Git-, julkaisu-, valmistus- ja FretFactoryn lähdemuutoksia ei tehty.

### VERIFICATION LEDGER — vaakanäkymä

| Tarkistus | Menetelmä | Tulos | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Muutosraja ja kanoninen data | SHA-256 vertailu `tmp/horizontal-view-baseline`-aineistoon | Vain 8 UI/testitiedostoa muuttui; mallin, geometrian, v4:n ja vendorin tiedostot säilyivät | 8.9.2026 | Kunnes lähde muuttuu |
| Unit-testit | `npm run test:run` | PASS 60/60 | 8.9.2026 | Kunnes lähde tai testi muuttuu |
| Koko E2E ennen label-korjausta | `npx playwright test` tuoretta buildiä vasten | PASS 38/38, desktop + iPhone 13 Chromium | 8.9.2026 ennen pystyrulerin tekstirajan korjausta | Historiallinen näyttö vaikutusalueen ulkopuoliselle toiminnalle |
| Pystyrulerin label-korjaus | Kohdistettu layout-koe | PASS 2/2; alaraja jättää X↕-merkinnälle tilan | 8.9.2026 tuoreen buildin jälkeen | Kunnes ruler-renderöinti muuttuu |
| Riippumaton selain-QA | Edge: 1440/851/850/481/480/390 px ennen tekstirajakorjausta, 1440/850/390 px korjauksen jälkeen; `tmp/horizontal-view-qa-ledger.md` ja follow-up-artifaktit | VERIFIED; kolme body-näkymää ja kaulallinen etu, oikea akselisuunta, satula/talla, console/window.error tyhjä ja overflow false | 8.9.2026 label-korjauksen jälkeen | Paikallinen selain-QA; ei Safari-, julkaisu-, export- tai fyysinen koe |
| Laskennan säilyminen | 45 GTRfactory-tiedoston baseline-vertailu | 8 vaakanäkymän UI/testitiedostoa muuttui; suojatut 30 geometry/model/neck/file/store/main/editorContracts-kohdetta ennallaan | 8.9.2026 | Kunnes lähde muuttuu |
| Vienti ja fyysinen valmistus | Ei koetta | Ei näyttöä; myöhempi vaihe | 8.9.2026 | Avoin |

## FEATURE BRIEF — yhteinen kitaraeditori ja suora valinta (8.9.2026)

**Tila: TOTEUTETTU — lopullinen varmennus ja rajat alla.** Tämä vaihe korvaa erillisen Kaula-työtilan ja aiemman yhteisen editorin painikkeita sisältäneen asetteluehdotuksen.

### Tavoite

Kaula suunnitellaan samassa Etu-näkymässä kuin runko. Kolme kitaraikkunaa säilyvät näkyvissä, ja kuville jää mahdollisimman paljon tilaa.

### Ei-tavoitteet

Ei kaulan vapaata solmumuokkausta, uusia hardware-koloja, tallan rakennemallia, valmistusvientiä, formaattiversion vaihtoa tai FretFactoryn sisarprojektin muutosta. CAD/SVG-tuonti ja hybriditoiminnot säilyvät myöhemmässä rajauksessa.

### Käyttäjän vahvistamat päätökset

Erillinen kaulasuunnittelusivu poistuu. Kaula, satulalinja ja todellinen tallan kielikontaktiviiva näkyvät Etu-näkymässä. Kaula osoittaa oikealle. Runko-, Kaula-, Etu-, Taka-, Tasku- ja Piilota säädöt -tilanvaihtopainikkeita ei tarvita. Kaulan puuttuessa käytetään 25,5 tuuman ja 22 nauhan templatea. Rungon liittymäreuna näkyy kaulan läpi; Taka säilyy bodyreunana ja keskiviivana.

### Sallitut paikalliset oletukset

Uusi projekti sisältää puhtaana lähtötilana 647,7 mm / 22 nauhan / 6 kielen kaulan nykyisillä muilla oletuksilla. Desktopin pikkusarake on 180–240 px ja avattu kaulapaneeli 182 px korkea. Paneelissa näytetään yksi kenttäryhmä kerrallaan; kapeassa asettelussa kentät ovat kahdessa sarakkeessa. Kaulan nauha- ja kieliapuviivat näkyvät automaattisesti vain kaulasäätöjen aikana. Ne leikataan fyysisen kaulan alueelle.

### Käyttäytymispolut

1. Käynnistys ja Uusi näyttävät oletuskaulan, siihen perustuvan liittymän ja automaattisen taskun. Lähtötila on puhdas ja historia tyhjä.
2. Etukuvan kaulan valinta hiirellä, kosketuksella tai näppäimistöllä avaa alapaneelin. Erillistä kaula-SVG:tä tai sivua ei ole.
3. Pikkukuvan koko pinta vaihtaa sen suureksi. Myös Enter/välilyönti sekä 1/2/3-oikotiet toimivat. Näkymien otsikot ovat tekstejä.
4. Perusmitat-, Sovitus-, Lisäasetukset- ja Tuonti-ryhmät säilyttävät keskeneräiset kentät. Millimetri-/tuumavaihto säilyttää arvot; muuttamattomia tarkkoja parametreja ei pyöristetä takaisin dokumenttiin.
5. Kelvollinen kaulaluonnos päivittää kaulan, satulan, tallalinjan, bodyliittymän ja taskun kaikissa kolmessa näkymässä. Virheellinen syöte säilyttää viimeisen kelvollisen esikatselun selvästi ilmoitettuna ja estää hyväksymisen.
6. Hyväksy tai kentän Enter tekee yhden kumottavan muutoksen ja sulkee paneelin. Peru muutokset tai Esc palauttaa hyväksytyn dokumentin ja sulkee paneelin. Puhdas hyväksyntä ei lisää historiaa.
7. Muuttumaton paneeli sulkeutuu myös bodyn, tyhjän piirtoalueen tai toisen näkymän valinnasta. Paneelin sulkeva bodyn valinta ei aloita samassa pointerdownissa vetoa muuttuvalla kamerakoolla.
8. Muuttunut kaulaluonnos estää bodymuokkauksen ja dokumentin undo/redo-toiminnot hyväksyntään/peruutukseen asti. Näkymää voi silti vaihtaa; paneeli ja luonnos säilyvät, jotta taskua voi tarkastella suurena. Panorointi, zoom ja Sovita ovat käytettävissä.
9. Tiedosto-valikon tallennus/lataus ei sivuuta muuttunutta luonnosta. Uusi/Avaa vahvistaa tallentamattoman työn korvaamisen. Peruttu, epäonnistunut tai vanhentunut avaus säilyttää dokumentin ja luonnoksen. Lukemisen aikainen kaulamuutos huomioidaan erillisellä monotonisella revisionilla.
10. Kaulaton aiempi projekti avautuu muuttumattomana. Tunnistetun kaulaliittymän yhteydessä Etu näyttää katkoviivaisen oletuskaulatemplaten. Valinta käynnistää kaulan luontiluonnoksen; vasta Hyväksy korvaa mahdollisen vanhan v3-taskun. Peru ja yksi Kumoa palauttavat alkuperäisen tilanteen. Ilman kaulaliittymää sijoitusta ei arvata, mutta runko avautuu ja tallentuu.
11. Kamera sovitetaan projektin avaamiseen tai käyttäjän Sovita-toiminnolla, ja uuden projektin oletuskaula mahtuu heti kuvaan. Kenttämuutos tai hyväksyntä ei nollaa kameraa. Pikkukuvien sovitus on itsenäinen. Solmujen valinta ei muuta tilarivin korkeutta; päällekkäisissä valintakohdissa solmu on kahvan edellä, ja lähennys erottaa lähekkäiset kahvat.

### Muutettavat vastuualueet tai tiedostot

`App.tsx`: yksi editori, paneeli, varoitukset ja kameran rajat. `NeckWorkspace.tsx`: ryhmitelty alapaneeli ja täsmällinen lomakeluonnos. `EditorCanvas.tsx`: suora valinta, kaulatemplate, apuviivat ja osumajärjestys. `store.ts`: oletusprojektitehdas, yhteinen kaulamuutoksen laskenta, preview/commit/peruutus. `FileActions.tsx`: valikko ja luonnoksen tiedostosuoja. `ReferenceControls.tsx` ja `styles.css`: kompakti tila. Vastaavat store-, SSR- ja E2E-testit päivitettiin.

### Säilytettävät rajat

Kanoninen millimetrigeometria, v4, kaulan kapeneminen, kaulaliittymän keskimmäinen kiinteä node ja kaulan päädyn/taskun yhteinen säde säilyvät. `neckView` ja sen `bridgePath` ovat yhteinen geometrialähde; tallalinjaa ei korvata oletussuoralla eikä siihen lisätä kompensaatiota tai tallan mittoja. Haamumalli säilyy istuntokohtaisena. Taka- ja taskunäkymän sisältörajat sekä FretFactoryn erillisyys säilyvät.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti ei muutu. Tilapäinen `neckDraft` omistaa kelvollisen esikatseludokumentin, parametrit, luontitilan, pending-tilan ja virheen. `neckDraftRevision` on monotoninen tiedostoavauksen kilpailutilanteita varten. Kaulaluonnos ja bodyveto eivät voi omistaa esikatselua samanaikaisesti. Luonnos lasketaan aina hyväksytystä dokumentista, ja hyväksyntä sekä `configureWholeNeck` käyttävät yhteistä laskentaa. Luonnos ei muuta document/history/future/revision/baseline/dirty-tilaa ennen hyväksyntää. Parseri ei lisää kaulaa legacy-dokumenttiin.

### Toteutusjärjestys

Oletuskaula ja preview/commit → yhteinen paneeli ja suoravalinta → tiedostosuoja ja legacy-template → asettelu → yksikkö- ja selainregressiot → riippumaton diagnoosi/QA → nykytiladokumentaatio. Feature-workerin välivaihe jäi kesken; pääagentti viimeisteli lähteet ja testit.

### Hyväksymiskriteerit

Edellä kuvatut aloitus-, valinta-, muokkaus-, hyväksyntä-, peruutus-, tuonti- ja tiedostopolut on toteutettu. Kolme kuvaa säilyvät, erilliset tilanvaihtopainikkeet poistuvat ja suljettu paneeli vapauttaa tilan kuville. Oletuskaula on 647,7 mm / 22 nauhaa. Kelvollinen esikatselu, virhesuoja, yhden muutoksen historia, legacy-säilyminen ja kameran vakaus on varmennettu. Kapeassa Chromium-kokeessa ei ole vaakaylivuotoa.

### Testit ja muut varmennustasot

Yksikkötestit 65/65 PASS ja lopullinen tuoreeseen buildiin kohdistunut E2E 46/46 PASS. Browser-E2E kattaa desktop-Edgen ja iPhone 13 -kokoisen Chromium-simulaation. Projektitiedostoja ladattiin ja avattiin uudelleen. Tämä ei ole valmistusartefakti-, fyysisen mittakaavan, natiivin Save As -dialogin, Safari- tai julkaistun ympäristön näyttöä. Porttikonfliktitestiä ei uusittu, koska palvelinkonfiguraatio ei muuttunut.

### Dokumentaatiovaikutukset

README kuvaa nykyisen yhden editorin käytön, oletuskaulan, kaulaluonnoksen, suoran valinnan ja tiedostopolut. AGENTS-suoritusprofiili kertoo nykyisen varmennuksen. Tämä brief omistaa tuoterajauksen ja ledgerin.

### Riskit

Valmistuskelpoisuutta ei ole varmennettu. Pienessä koko kitaran sovituksessa lähellä olevat kahvat vaativat lähennystä. Aiemmassa kahdella työntekijällä ajetussa selainkierroksessa esiintyi hostin `ERR_NO_BUFFER_SPACE`-resurssivirhe; sovelluksen liian pienen SVG-mittauskoon suoja korjattiin ja lopullinen ajo läpäisi yhdellä työntekijällä. Hostin resurssiongelman poistumista ei väitetä sovelluskorjauksen ansioksi.

### Ratkaisematta jääneet asiat

Ei tämän vaiheen toteutusta estäviä asioita. Valmistusvienti, fyysiset kokeet ja aiemmin myöhemmäksi rajatut ominaisuudet jäävät omiin vaiheisiinsa.

### Toteutusvaltuutuksen tila ja peruste

Käyttäjän ”Toteutus niin, että…” ja ”jos kaulaa ei ole, käytetään 25.5 skaalaista 22 nauhaista kaulaa templatena” valtuuttivat tämän vaiheen. Ei Git- tai julkaisutoimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — yhteinen editori

| Tarkistus / kriteeri | Komento tai menetelmä | Tulos / todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Kanoninen laskenta ja formaatti | SHA-256-vertailu `tmp/unified-editor-baseline`-kopioon, 18 ei-testitiedostoa geometry/model/neck/file-alueilta | 18/18 muuttumatta; v4, vendor ja geometrialähteet säilyivät | 8.9.2026 | Kunnes nämä lähteet muuttuvat |
| Store, parseri, geometria ja SSR | `npm run test:run` | PASS 65/65; preview-omistajuus, invalid-apply, yksi undo, oletusbaseline ja aiemmat geometriatestit | 8.9.2026 viimeistelty store/lomake | Myöhemmät vain renderöintiin liittyvät korjaukset lisäksi E2E:ssä |
| Tyyppitarkistus ja build | `npm run build` | PASS; `index-DJ7AWltg.js`, `index-Cd0RvX9a.css` | 8.9.2026 viimeinen lähde | Kunnes lähde muuttuu |
| Täysi E2E | `npx playwright test --workers=1 --max-failures=2 --reporter=line`; `tmp/unified-e2e-verified.log` | PASS 46/46; desktop Edge ja iPhone 13 Chromium; muokkaus, kaulaluonnos, tiedostot ja legacy-polut | 8.9.2026 viimeisen buildin jälkeen | Paikallinen automatisoitu selainnäyttö |
| Ladatut projektitiedostot | E2E-lataus, JSON-tarkistus ja uudelleenavaus | Oletuskaulan, tuonnin, v4:n ja legacy-kehon säilyminen PASS | Sama lopullinen E2E | Projektitiedosto, ei valmistusartefakti |
| Riippumaton diagnoosi | `tmp/unified-qa-diagnosis.json` ja trace | Inspectorin 26→36px-kasvu siirsi kameraa; mobiilissa kahva sieppasi node03-osuman. Korjaukset varmennettu lopullisessa E2E:ssä | 8.9.2026 ennen korjauksia / jälkeen | Näytetyt juurisyyt ja regression kattavuus |
| Aiempien kierrosten rajat | `tmp/unified-e2e-first.log`, `tmp/unified-e2e-final.log` | Ensin 43/46 (kaksi juurisyytä, kolme failurea), sitten 45/46 (host-resurssi + liian pieni SVG). Lopullinen 46/46 korvaa nämä tulokset | 8.9.2026 | Historiallinen; ei sekoiteta lopulliseen näyttöön |
| Työnjaon ja dokumentoinnin rajat | Lähdediffi ja `tmp/unified-editor-verification.md` | Yksi lähdekirjoittaja kerrallaan. Runtime-diagnostician- ja docs-sync-spawnit estyivät agenttien määrärajaan; olemassa oleva QA teki riippumattoman diagnoosin, pääagentti päivitti dokumentit QA:n jälkeen | 8.9.2026 | Ei puuttuvaa toteutus- tai dokumentointityötä |
| Riippumaton lopputilan QA | Uusi tuotantobuildin Edge-preview: 1440×1000, 850×900 ja 390×844; `tmp/unified-editor-qa-ledger.md`, `tmp/unified-final-qa.json` | VERIFIED; suora valinta, oletuskaula, luonnoksen virhe- ja hyväksyntäpolut, näkymävaihto, vakaa kamera, node-osumat ja ryhmäveto. Kolmen SVG:n mitat vakaat; konsoli, window.error ja vaakaylivuoto puhtaat. Kuvat `tmp/unified-final-qa-1440.png` ja `tmp/unified-final-qa-390.png` | 8.9.2026 lopullinen build, ei lähdemuutoksia testin jälkeen | Paikallinen Edge; ei fyysinen puhelin, Safari tai valmistuskoe |

## FEATURE BRIEF — valinnan mukaiset kontekstityökalut (9.9.2026)

**Tila: TOTEUTETTU — riippumaton QA VERIFIED. Lopullinen varmennus ja sen rajat alla.**

### Tavoite

Pisteen ja reunaviivan valinta tuo esiin niille kuuluvat työkalut kiinteässä alaosan kontekstirivissä. Reunaviivan Lisää piste käyttää osoitettua kohtaa ja näyttää ennakkomerkin. Automaattisen taskun kumman tahansa suljetun päätykulman valinta avaa kaulan Sovitus-ryhmän yhteiseen kulmasäteeseen.

### Ei-tavoitteet

Ei haamumallin kehitystä tai nykyisen toiminnon poistamista. Ei satula-/tallalinjan konteksteja, uusia ryhmämuunnoksia, kelluvia valikoita, taskun itsenäistä siirtoa tai erillisiä kulmasäteitä. Ei muutosta v4-formaattiin, kaula-/taskulaskentaan, FretFactory-vendoriin tai sisarprojektiin. Ei Git- tai julkaisutoimia.

### Käyttäjän vahvistamat päätökset

Käyttäjä hyväksyi edellisen ehdotuksen toteutettavaksi ja rajasi haamukuvan kehityksen pois: ”Toteutetaan. Postetaan haamukuvan kehityksestä.” Toteutetaan piste-/reunaviivatyökalut, osoitettu pisteenlisäys ja taskunkulman yhteinen sädesäätö.

### Sallitut paikalliset oletukset

Kontekstirivi sijaitsee nykyisen inspectorin yhteydessä ja varaa runkomuokkauksessa saman korkeuden myös ilman valintaa. Kaulaluonnoksen aikana erillinen rungon kontekstirivi piilotetaan, jotta kuvien tila käytetään kauladockiin. Nykyinen NODE > HANDLE -osumaetusija säilyy. Segmentin lähin parametri t ratkaistaan kanonisesta geometriasta eikä SVG-polun pituusosuudesta. Lähimmän pisteen haku on deterministinen ja testattava, myös degeneroituneella tai voimakkaasti kaarevalla segmentillä. Suora käyttää analyyttistä projektiota; kuutiokäyrä vertailee etäisyyden kaikkia stationaarisia kohtia ja päätepisteitä skaalatussa koordinaatistossa. Lisäys sallitaan vain aidossa sisäpisteessä; päätepisteeseen ei synny duplikaattia. Osuma-alueet ovat ruutupikseleinä zoomista riippumatta. Näppäimistöllä valittu segmentti voi käyttää t=0.5:tä näkyvällä ennakkomerkillä.

### Käyttäytymispolut

1. Ilman valintaa alarivi näyttää valintaohjeen. Yksi vapaa node näyttää X/Y-, Sileä/Kulma- ja Poista piste -toiminnot. Monivalinta näyttää lukumäärän ja nykyiset sallitut toiminnot; veto ja nuolisiirto säilyvät. Ei uusia ryhmämuunnoksia.
2. Lukittu node kertoo lukituksen syyn ja tarjoaa yhteyden kaulan sovitukseen, kun olemassa oleva kaula on muokattavissa. Lukitusta ei pureta.
3. Reunaviivan valinta näyttää Lisää piste-, Suora- ja Käyrä-toiminnot nykyisine suojauksineen. Ennakkomerkki on kohdassa B(t). Lisäys käyttää nykyistä de Casteljau-jakoa, säilyttää muodon, valitsee uuden noden ja on yksi undo-askel.
4. Vain suuren Tasku-näkymän suljetun pään kulmat avaavat kauladockin Sovitus-ryhmään ja fokusoivat Kulmasäde-kentän. Molemmat kulmat korostuvat. Säde 0 on myös valittavissa. Taskua ei voi vetää itsenäisesti.
5. Kulmavalinta käyttää olemassa olevaa kaulaluonnosta: keskeneräiset tai virheelliset kentät, viimeinen kelvollinen preview ja hyväksy/peru-suojat säilyvät. Pelkkä valinta ei muuta dokumenttia tai historiaa. Sädemuutoksen hyväksyntä on nykyiseen tapaan yksi undo-askel.
6. Kaulattoman legacy-projektin kulmavalinta ei luo kaulaa eikä korvaa vanhaa taskua. Näytetään tarvittaessa selitys kaulan käyttöönoton tarpeesta.
7. Node/segmentti/tyhjä/lukittu-valintojen vaihto ei muuta piirtoalueen kokoa tai kameraa desktopissa eikä 850/390 px:n näkymissä. Keskeneräinen kaulaluonnos estää edelleen bodymuokkauksen hyväksyntään/peruutukseen asti.
8. Pikkunäkymät vaihtavat vain suurta näkymää. Haamumallin nykyinen toiminta, 1/2/3, zoom/pan, mm/in, Tiedosto ja undo/redo säilyvät. Valittaville uusille kohteille tarjotaan myös näppäimistöreitti.

### Muutettavat vastuualueet tai tiedostot

App.tsx ja tarvittaessa uusi ContextTools.tsx: kiinteä kontekstirivi. store.ts: väliaikainen selectedSegmentT ja valinnan elinkaari. Uusi editor/segmentSelection.ts sekä testit: lähin parametri olemassa olevia segmentPoints/cubicAt-apuja käyttäen. EditorCanvas.tsx: pisteenlisäysmerkki, valinta ja taskukulmien osumat/korostus. NeckWorkspace.tsx: Sovitus-ryhmän ja radiusMm-kentän fokuspyyntö. styles.css/tarvittaessa editor-CSS: vakaa asettelu. Store-, SSR- ja E2E-testit päivitetään. README ja tämän briefin ledger päivitetään varmennuksen jälkeen. ReferenceControls, referenceOverlay, model/file/neck/vendor sekä nykyinen geometry-laskenta säilyvät muuttumattomina.

### Säilytettävät rajat

Kanoninen mm, yhteinen kolmen näkymän geometria, suojatut ankkurit/kahvat/segmentit, taskun ja kaulan yhteinen säde, v4 ja nykyinen undo/redo säilyvät. Node on kahvan yläpuolella, kahva segmentin/semanttisen taskuosuman yläpuolella. Ennakko- ja korostusmerkit eivät sieppaa osumia. Node- ja segmenttivalinta sulkevat toisensa pois. Pikkunäkymässä ei ole sisäisiä muokkausosumia. Kauladraftin hyväksyntä/peruutus/preview sekä asynkronisen avaamisen suojat säilyvät.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti ei muutu. Session valinta saa selectedSegmentT:number|null ja selectSegment vastaanottaa t:n. Valinnan tyhjennys, dokumentin vaihto, undo/redo ja kaulaluonnoksen avaus siivoavat myös t:n. addPoint käyttää valittua t:tä; nykyiset ohjelmalliset eksplisiittiset t-kutsut säilyvät tarvittaessa. Dockin ryhmä-/kenttäfokuspyyntö on vain UI-tilaa ja sisältää muuttuvan tokenin, jotta toistuva kulmavalinta toimii myös paneelin ollessa jo auki.

### Toteutusjärjestys

Testattava lähimmän parametrin haku → valinta/lisäys/merkki → kiinteä kontekstirivi → taskukulman radiusreitti → relevantit unit/build/E2E → riippumaton QA → dokumentaatio. Worker toimitti osittaisen välivaiheen; pääagentti otti lähde- ja testiomistajuuden, viimeisteli laskennan ja toteutti loput polut. Vain yksi agentti kirjoitti lähteitä kerrallaan.

### Hyväksymiskriteerit

- Oikeat toiminnot näkyvät tyhjälle, yhden noden, monivalinnan, lukitun noden ja segmentin kontekstille; vanha kuuden runkotyökalun yläpalkki poistuu.
- Kontekstinvaihto ei muuta suuren piirtoalueen kokoa eikä kameramuunnosta desktop/850/390-koossa. Ei vaakaylivuotoa eikä peittyviä olennaisia toimintoja.
- Suoran ja kuutiokäyrän eri kohtiin tehty valinta tuottaa todellisen B(t)-merkin. Lisätty node osuu merkkiin, ja näytteistetty muoto säilyy. Päätepiste-/degeneraatiotapaukset eivät tuota duplikaatteja tai kaada sovellusta.
- Yksi undo/redo kumoaa/palauttaa lisäyksen. Valittu t ei jää väärälle segmentille eikä vaikuta projektin tallennukseen.
- Node > handle -etu säilyy, myös pienessä koko kitaran sovituksessa.
- Molemmat taskukulmat toimivat säteillä 6 ja 0; Sovitus ja fokus yhteiseen kenttään toimivat hiirellä/kosketuksella/näppäimistöllä. Kulmien korostus kuvaa samaa asetusta.
- Kulmavalinta ei hävitä pending/invalid-kaulaluonnosta tai luo kaulaa legacy-projektiin. Sädemuutos päivittää kaulan ja taskun yhdessä ja on yksi hyväksyttävä muutos.
- Nykyiset näppäimistö-, marquee-, pan/zoom-, tiedosto-, draft-, legacy- ja haamumallipolut säilyvät.

### Testit ja muut varmennustasot

Unit: lähin t suoralla, epäsymmetrisellä kuutiolla, lähellä päitä sekä degeneroituneella/voimakkaasti taipuvalla käyrällä; jaon piste/muoto, tilan nollaus ja undo. E2E: kontekstit, oikea piste/ennakkomerkki myös takapeilauksessa, vakaat mitat ja kamera, molemmat kulmat/0-säde, fokus, pending/invalid/legacy, node-osuma ja nykyiset regressiot. Suorita projektin juuressa peräkkäin npm run test:run, npm run build, npx playwright test --workers=1. E2E käyttää tuoretta buildia portissa4174 ja asennettua Edgeä; dev5174 jätetään käyntiin. Riippumaton QA tarkistaa tuoreen paikallisen näkymän ja konsolin 1440/850/390-koossa. Palvelinkonfiguraatio ei muutu, joten porttikonfliktitestiä ei tarvitse uusia. Ei fyysisen laitteen, Safarin tai valmistusmittakaavan näyttöä.

### Dokumentaatiovaikutukset

README: toteutunut kontekstivalinta, pisteenlisäys ja taskusäteen suora reitti. FEATURE_BRIEF: lopputila ja VERIFICATION LEDGER. AGENTS: nykyinen varmennusprofiili tarvittaessa. Haamumallia ei kuvata laajentuneena.

### Riskit

Käyrän pituusosuus ja t eivät ole sama asia. Kontekstin korkeus ei saa riippua sisällöstä. Uudet osumat eivät saa peittää nodeja/kahvoja. Säde0 tarvitsee pisteosuman. Kauladockin fokuspyyntö ei saa nollata formia tai luonnosta. Nämä rajat varmennettiin yksikkötesteillä, E2E:llä ja riippumattomalla lähde- sekä selainarviolla. Pienessä sovituksessa segmentin läheinen node tai kahva voittaa osuman; valinnan tyhjennys ja lähennys auttavat erottamaan kohteet.

### Ratkaisematta jääneet asiat

Ei estäviä avoimia löydöksiä. Haamumallin ja satula-/tallalinjojen kontekstien kehitys ei kuulu tähän vaiheeseen.

### Toteutusvaltuutuksen tila ja peruste

Valtuutettu käyttäjän yllä siteeratulla toteutuspyynnöllä. Arkkitehti tarkisti rajauksen (NO QUESTIONS NEEDED / DESIGN READY). Pääagentti tarkensi toteutusapurin editor-alueelle laskennan säilyttämiseksi. Työnkulkunäytteiden keruu ei ole käytössä. Ei commit-/julkaisulupaa.

### VERIFICATION LEDGER — kontekstityökalut

| Tarkistus | Menetelmä | Tulos | Lähtötila / ajankohta | Voimassaolo |
| --- | --- | --- | --- | --- |
| Työtila ja rajaus | Git juuri, package.json, AGENTS ja lähde-/testiluku | Repositorion juuri; Node24.15.0/npm12.0.1; ei valmistus- tai haamulaajennusta | 9.9.2026, tmp/contextual-editor-baseline-20260909 (54 tiedostoa + SHA-manifest) | Toteutuksen lähtötila |
| Muutosraja | SHA-256-vertailu baselineen; node tmp/audit-contextual-scope.mjs | Suojatut 18 model/file/geometry/neck-alueen ei-testitiedostoa muuttumatta; vendor/reference ja FretFactory pysyivät ennallaan | 9.9.2026 lopullinen työpuu | Kunnes näitä lähteitä muutetaan |
| Yksikkötestit | npm run test:run | PASS 80/80, 13 tiedostoa; lähin t, lineaarinen sijoitus, jaon muodon säilyminen, valintatilan elinkaari ja olemassa olevat polut | 9.9.2026 10:08, lopullinen logiikka; myöhempi muutos vain kontekstirivin CSS-piilotus | CSS-muutos lisäksi E2E- ja selain-QA:ssa |
| Tyyppitarkistus ja tuotantobuild | npm run build | PASS; index-Cs9Qg9xf.js ja index-C0rSNJ1O.css | 9.9.2026 viimeisen CSS-muutoksen jälkeen | Lopullinen sovelluslähde |
| Koko E2E lopullisella sovelluslähteellä | npx playwright test --workers=1 --max-failures=2 --reporter=line; tmp/contextual-e2e-final.log | 57/58 PASS. Ainoa virhe: uuden mobiilitestin segmenttiosuma kohdistui valitun noden kahvaan | 9.9.2026 tuore build | Muut 57 tapausta voimassa; sovelluslähde ei muuttunut tämän jälkeen |
| Osumadiagnoosi ja korjattu testi | Riippumaton Edge elementFromPoint / trace; npx playwright test tests/e2e/contextual.spec.ts --grep 'curve click marker' --workers=1 --reporter=line; tmp/contextual-touch-verified.log | PASS 2/2, desktop ja mobiili. Testi tyhjentää nodevalinnan ennen segmenttiosumaa; runtime-osumaetusijaa ei muutettu | 9.9.2026; vain testin valintajärjestys muuttui | 57 hyväksyttyä tapausta ja korjattu 2/2 kattavat kaikki 58 tapausta; ei yksittäistä 58/58-kokoajoa |
| Riippumaton lähde- ja selain-QA | tmp/contextual-qa-ledger.md; tmp/contextual-browser-qa.json; Edge 1440×900, 850×800 ja 390×664 | VERIFIED. Kontekstit, marker, yhteinen sädefokus, vakaat SVG-mitat/kamera, osumaetusija, luonnoksen ja legacyn suojat; ei konsolivirheitä tai vaakaylivuotoa | 9.9.2026 tuore paikallinen preview | Paikallinen Edge, ei fyysisen laitteen näyttö |
| Kauladockin lopullinen tilankäyttö | tmp/contextual-neck-open-qa.json ja contextual-neck-open-{1440,850,390}.png | PASS kaikissa kolmessa koossa: rungon kontekstirivi piiloutuu dockin ajaksi, kolme SVG:tä pysyvät kelvollisina; konsoli ja vaakaylivuoto puhtaat | 9.9.2026 lopullinen CSS/build | Voimassa |
| Aikaisemmat korjauskierrokset | tmp/contextual-e2e-first.log ja riippumaton mobiiliosumadiagnoosi | Ensimmäinen 57/58-kierros: testi osui nodeen. Seuraava osuma osui valinnan näyttämään kahvaan. Sovelluksen node > handle > segmentti -etu toimi vaaditusti | 9.9.2026 | Historiallinen syy testin korjaukselle; ei väitetty sovellusviaksi |
| Työnjako ja dokumentointi | Brief, lähdediffi, QA-ledger, README ja AGENTS | Arkkitehti suunnitteli, workerin osittaisen tuloksen viimeisteli pääagentti, QA teki riippumattoman arvion ja diagnoosin. runtime_diagnostician- ja docs_sync-spawn estyivät agenttien määrärajaan; olemassa oleva QA diagnosoi ja pääagentti synkronoi dokumentit hyväksytyn QA:n jälkeen | 9.9.2026 | Ei puuttuvaa dokumentointi- tai varmennustyötä; työnkulkunäytteiden keruu ei käytössä |
| Varmennustasojen rajat | Paikallinen build, testit ja selain | Ei valmistusartefakti-, fyysisen mittakaavan, natiivin Save As -dialogin, Safari-, julkaisu- tai fyysisen laitteen koetta tässä muutoksessa. Nykyisten projektitiedostojen lataus-/avausregressiot läpäisivät E2E:n | 9.9.2026 | Rajoja ei päätellä automaattisesta tai paikallisesta selainnäytöstä |

## FEATURE BRIEF — mikrofonikolojen valikko ja keskiviivasijoitus (9.9.2026)

**Tila: TOTEUTETTU JA RIIPPUMATTOMASTI QA-VARMENNETTU.** Toteutettu käyttäjän pyynnöstä: Jatketaan mikrofonikolojen kehittämistä.

### Tavoite

Etu-näkymään lisättiin rungon keskiviivalla liikkuvien 2D-mikrofonikolojen valikko. Uusi projekti aloittaa yhdellä SH-12-humbuckerilla. Valittu kolo avaa vain siihen liittyvät kontekstityökalut.

### Ei-tavoitteet

Ei vapaata sivuttaissiirtoa tai kiertoa, kolon node-editointia tai skaalausta, elektroniikka- ja paristokoloja, johdotusta, yleistä mikrofonitietokantaa, kolon syvyysmallia tai valmistusvientiä. Profiilit eivät lupaa kaikkien samannimisten mikrofonien tai laitteistojen sopivuutta.

### Käyttäjän vahvistamat päätökset

Käyttäjä vahvisti yhden oletushumbuckerin, kolon valinnasta avautuvat työkalut, profiilivalikon sekä sen, että kaulan asetusten muutos pitää sijoitetun kolon rungossa paikallaan ja päivittää etäisyyden tallaan.

### Sallitut paikalliset oletukset

Uuden projektin SH-12 sijoitetaan 50 mm:n päähän tallan kontaktikäyrän keskiviivaleikkauksesta, kolon keskeltä mitattuna, jos profiili mahtuu. Tämä on suunnittelun aloitussijainti, ei akustinen optimointiväite. Muut lisäykset käyttävät suurinta kelvollista vapaata keskiviivaväliä.

Viisi profiilia ovat nimettyjä version 1 suunnittelutilavarauksia: SH-12 Humbucker (86 × 40 mm, R3, oma tutkimusprofiili), SSL-1 Strat single-coil (lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm reunavara), STR-1 Tele neck (lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm reunavara), STL-1b Tele bridge (lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm reunavara, nimetty 17° variantti) ja SP90 SGZ P-90 soapbar (87,5 × 36,5 mm, R7,35, oma 1 mm reunavara). Tarkat lähteet ja rajoitukset ovat [pickup-katalogissa](reference-analysis/pickup-cavity-catalog.md).

### Käyttäytymispolut

1. Uusi projekti sisältää täsmälleen yhden SH-12-kolon. Vanha v1–v4-projekti avautuu ilman koloja. Viimeisen kolon poisto jättää projektin kolottomaksi eikä oletusta palauteta.
2. **+ Mikrofonikolo** on käytettävissä ilman kohdevalintaa. Valikko näyttää nimen, SVG-esikatselun ja mitat. Onnistunut lisäys sijoittaa koko profiilin kelvolliseen kohtaan, valitsee sen ja vaihtaa Etu-näkymään. No-fit jättää dokumentin ennalleen.
3. Etu-näkymän kolon klikkaus valitsee sen ja avaa kontekstityökalut. Valinta ei muuta projektia tai undo-historiaa. Koloa voi vetää vain keskilinjalla; valmis veto, lisäys, mallinvaihto, etäisyyden hyväksyntä ja poisto ovat kukin yksi undo-askel. Esc peruu vedon tai kenttäluonnoksen.
4. Etäisyys tallaan lasketaan kolon keskeltä kaarevan PCHIP-kontaktiviivan keskiviivaleikkaukseen maailman X=0-kohdassa. Mm- ja tuumasyöte validoidaan ennen hyväksyntää. Virheellinen syöte ei muuta viimeistä hyväksyttyä sijaintia.
5. Koko suljettu profiilipolku tarkistetaan rungon, automaattisen kaulataskun, muiden kolojen ja tallan kontaktiviivan suhteen. Käyrät näytteistetään 0,01 mm editoritoleranssilla ja kontakti hylätään 0,03 mm varalla; nämä ovat laskennan rajoja eivätkä fyysisen valmistuksen toleranssilupaus. Kaulan muutos säilyttää centerYmm-arvot; ristiriita estää hyväksynnän eikä koloja siirretä hiljaa.
6. Taka näyttää rungon ääriviivan ja keskiviivan, ja Tasku kaulataskun esikatselun. Pickupit piirretään vain Etu-näkymään; taka- ja taskuvalinta tyhjentää pickup-kontekstin.

### Muutettavat vastuualueet ja tiedostot

Toteutus käyttää mikrofoniprofiilirekisteriä ja lähdepiirroksista johdettuja kuperia muotoja, v5-mallia ja parseria, store-tilaa, Etu-näkymän piirtoa ja osumia, valikkoa, kontekstityökaluja, tyylejä ja näiden testejä. FretFactoryn lähde ja vendor-alue eivät muuttuneet.

### Säilytettävät rajat

Kanoninen millimetrigeometria, kolon centerYmm rungon koordinaatistossa, suojattu kaulaliittymä ja FretFactoryn vendor-alue säilyvät. Tallan kontaktiviiva on laskennallinen kielten kohtaamislinja, ei tallalaitteiston mitoitus. Bridge-käyrän päätepisteiden vaakasuora jatko on editorin sijoituskonventio leveille korvakkeille.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti on v5. pickupCavities sisältää pysyvän id:n, profileId- ja profileVersion-viitteen sekä centerYmm-arvon. v1–v4 avataan tyhjällä listalla; eksplisiittinen tyhjä v5 säilyy. Tuntematon profiili tai versio hylätään atomisesti. Tekninen enimmäismäärä on 64.

### Toteutusjärjestys

Lähdeprofiilien geometria ja sijoitusrajoitukset, v5-malli ja legacy-polut, oletuskolo ja valikko, valinta/veto/tarkka syöte/mallinvaihto/poisto/undo, kaulamuutoksen atominen tarkistus, testit ja selain-QA.

### Hyväksymiskriteerit

Uusi-, legacy- ja tyhjäprojekti käyttäytyvät yllä kuvatusti. Kaikki viisi valikon profiilia voidaan lisätä vain kelvolliseen paikkaan, koko polku tarkistetaan, keskiviivaveto ja mm/in-syöttö toimivat, mallinvaihto/poisto/undo säilyttävät hyväksytyn tilan, kaulamuutos ei siirrä koloja ja v5-tallennus/avaus säilyttää profiiliversion sekä sijainnin.

### Testit ja muut varmennustasot

npm run test:run PASS 97/97 (15 tiedostoa) ja npm run build PASS lopullisella lähteellä. Koko E2E oli 67/68 PASS; yksi olemassa oleva testi pysähtyi Edge-hostin ERR_NO_BUFFER_SPACE-virheeseen ennen käyttäjätoimintoa. Sama testi ajettiin muuttumattomalla lähteellä erikseen 2/2 PASS. Kaikki 10 pickup-E2E-tapausta läpäisivät. Riippumaton paikallinen Edge-QA koossa 1440 × 900, 850 × 800 ja 390 × 664 oli VERIFIED: valikko ja kontekstityökalut pysyivät näkyvissä, konsolivirheitä ja vaakaylivuotoa ei ollut.

Geometriatestit olivat 9/9 PASS. Näyttö koskee paikallista selainta ja automaattisia testejä. Valmistusartefaktia, CNC-jyrsintää, syvyyttä, fyysistä sovitusta, natiivin Save As -dialogia, Safaria, julkaisua tai fyysistä laitetta ei ole varmennettu.

Historiallinen tutkimusnäyttö alla kuvaa toteutusta edeltänyttä vaihetta. Se ei korvaa lopullista toteutusnäyttöä.

### VERIFICATION LEDGER — aiempi tutkimus ja suunnitelma (historiallinen)

| Tarkistus tai kriteeri | Menetelmä | Tulos / todistettava asia | Ajankohta tai lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- |
| Projekti ja nykyiset rajat | Git-juuri, package.json, AGENTS, nykyinen tutkimus ja lähteiden read-only-kartoitus | Oikea projekti repositorion juuressa; yhden kolon havainnollistus on erillinen artefakti | 9.9.2026, ennen dokumenttimuutoksia | Tämän tutkimuksen lähtötila |
| Fyysiset profiiliperheet | Katalogiin linkitetyt Seymour Duncan-, Warmoth-, StewMac-, Lollar- ja TV Jones -lähteet | Yhdeksän perhettä ja fyysisen muodon/kiinnityksen erot tutkittu; muiden kuin nykyisen SH-12-luonnoksen täsmällisiä kolopolkuja ei varmennettu | 9.9.2026 | Tutkimusnäyttö, ei valmistusnäyttö |
| Rungossa pysyvä sijainti | Käyttäjän vastaus kaulan muutoksen vaikutuksesta | Kolo pysyy paikallaan; tallaan näytetty etäisyys muuttuu | 9.9.2026 | Vahvistettu tuotevaatimus |
| Arkkitehtiarvio | Olemassa oleva feature_architect, vain luku -tehtävä ja jatkotarkistus käyttäjän vastauksen jälkeen | NO QUESTIONS NEEDED / DESIGN READY UI- ja sijoituslogiikalle; profiilien lähdevarmennus toteutusporttina | 9.9.2026 | Suunnitelma; ei toteutuksen QA |
| Dokumenttien eheys | Kirjoitettujen tutkimus- ja brief-osien luku, linkkikohteiden ja tilaväitteiden tarkistus | Suunnitelma erotettu nykyisestä sovelluksesta ja aiemmasta SH-12-havainnollistuksesta | 9.9.2026 | Dokumenttimuutoksen tarkistus |
| Sovellus-, selain-, vienti- ja fyysinen näyttö | Ei ajettu tässä tutkimuksessa | Sovellusta ei muutettu. Aikaisemman havainnollistuksen testit eivät todista tulevan valikon tai usean kolon integraation toimintaa | 9.9.2026 | Ei uutta näyttöä näiltä tasoilta |

### Dokumentaatiovaikutukset

README kuvaa käyttäjän toteutuneen käytön ja tämä brief säilyttää rajat sekä varmennusnäytön. Tutkimuskatalogi säilyttää yhdeksän profiiliperheen taustan ja viiden toteutetun nimiprofiilin lähdetiedot.

### Riskit

Konservatiivinen suunnittelutilavaraus voi poistaa puuta enemmän kuin tietyn valmistajan optimointireitti. Korvakkeet, ruuvien liikevara, metallikansi, kiinnitys ja syvyys vaihtelevat malleittain. Tele bridge -profiilin 17° on johdettu variantti, ei tallalevyn sovitusvarmennus. 2D-containment ja collision eivät todista valmistuskelpoisuutta tai rakenteen lujuutta.

### Ratkaisematta jääneet asiat

Muita tutkimuskatalogin profiiliperheitä ei ole toteutettu valikkoon. Fyysinen sovitusvarmennus ja 2D-valmistusviennit ovat erillisiä jatkoaiheita. Päivitetty rajaus 9.9.2026 sulkee Z-akselin ja jyrsintäsyvyydet pysyvästi pois ohjelmasta.

### Toteutusvaltuutuksen tila ja sen peruste

Käyttäjän pyyntö Jatketaan mikrofonikolojen kehittämistä valtuutti tämän integraation. Ei Git- tai julkaisutoimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — mikrofonikolojen toteutus

| Tarkistus / kriteeri | Komento tai menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähteet ja profiilit | `tmp/pickup-source-ledger.md`; viiden PDF:n kuvallinen mittatarkistus ja `src/pickup/source-hulls.json` | Viisi nimettyä suunnitteluprofiilia; piirroksen ulkomitat erotettu ruuvijaosta ja sivukuvan korkeudesta | Lähdepohjaiset 2D-tilavaraukset ja omat sovitusvarat; ei yleissapluunoita | 9.9.2026 lähdetutkimus | Kunnes profiili tai lähde muuttuu |
| Geometria ja riippumaton arkkitehtiarvio | `tmp/pickup-geometry-tests-final.log`; `pickup_geometry_review` | 9/9 PASS; READY PER BOUNDARY | Kokonaisen polun sisälläolo, loven läpi kulkeva reuna, todellinen törmäys, PCHIP-keskikohta ja vapaan paikan haku | 9.9.2026 lopullinen geometria | Sama rekisteri ja laskenta |
| Yksikkö-, store- ja parseritestit | `npm run test:run`; `tmp/pickup-final-unit.log` | 97/97 PASS, 15 tiedostoa; ei SSR-varoitusta | V5/legacy/tyhjä/tuntematon profiili, yksi undo, muutoksen atomisuus ja kaulan mukana liikkumaton kolo | 9.9.2026 klo 12.23, lopullinen lähde | Lähde pysynyt samana |
| TypeScript ja tuotantobuild | `npm run build`; `tmp/pickup-final-build.log` | PASS; `index-D2sVBo_J.js`, `index-Iay1IVli.css` | Lopullinen lähde kääntyy tuotantoon | 9.9.2026 klo 12.23 | Sama lähde ja riippuvuudet |
| Koko E2E | `npx playwright test --workers=1 --max-failures=2 --reporter=line`; `tmp/pickup-final-e2e.log` | 67/68 PASS, kaikki 10 uutta pickup-tapausta PASS; yksi aiempi koe keskeytyi sivun latauksessa `net::ERR_NO_BUFFER_SPACE`-virheeseen | Uudet käyttö-, virhe-, mm/in-, valikko-, tallennus-/avaus- ja kaulamuutospolut sekä muut hyväksytyt regressiot | 9.9.2026 sama tuotantobuild | 67 hyväksyttyä tapausta; ei yksittäistä 68/68-kokoajoa |
| Riippumaton kohdennettu regressio | `npx playwright test tests/e2e/contextual.spec.ts --grep "both pocket corners" --workers=1 --reporter=line`; `tmp/pickup-qa-pocket-target.log` | 2/2 PASS, desktop ja mobiili | Kokoajossa ennen toimintoaan keskeytynyt taskukulmatesti toimii muuttumattomalla lähteellä | 9.9.2026, sama tuotantobuild | Ei poista kokoajon host-virhettä |
| Riippumaton lähde- ja selain-QA | `tmp/pickup-final-qa.md`, `tmp/pickup-final-browser-qa.json`; Edge 1440×900, 850×800, 390×664 | VERIFIED; ei estäviä löydöksiä, konsolivirheitä tai vaakaylivuotoa; valikot mahtuvat; Sovita pitää kaulan kuvassa | Näkyvä paikallinen käyttö, kontekstivalinta, näppäinten eristys ja virhesuoja | 9.9.2026, lopullinen build; pääagentti tarkisti myös kuvat | Paikallinen Edge, ei fyysinen puhelin tai Safari |
| Korjauskierrokset | `tmp/pickup-root-ledger.md`, ensimmäiset geometry/UI-lokit ja riippumaton runtime-diagnoosi | Varhaisen toteutuksen containment/kaarisampling/SH12-kulmat korjattiin; geometria-oraclen datum.x korjattiin. UI-testin väärä tab-valitsin ja kuvankaappauksen aiheuttama resize erotettiin sovellusvirheistä | Aiemmat välitulokset eivät ole lopullisen toteutuksen näyttöä; normaalin viewportin kuvaus säilyttää avoimen valikon | 9.9.2026 ennen lopullisia ajoja | Historiallinen korjausnäyttö |
| Rajaus ja dokumentointi | Baseline `tmp/pickup-editor-baseline-20260909-111738`, `tmp/pickup-final-scope-audit.json`, README/AGENTS/katalogi/brief | Lähde rajattu pickup-integraatioon; vendor, sisarprojekti, riippuvuudet ja Vite-konfiguraatio säilyivät. Dokumentit päivitetty QA:n jälkeen | Yksi lähdekirjoittaja kerrallaan; ei Git- tai julkaisutoimia | 9.9.2026; workerin osittaisen työn viimeisteli pääagentti, docs_syncin dokumentit tarkisti ja viimeisteli pääagentti | Dokumentointi vastaa toteutusta |
| Työnjako | FEATURE BRIEF ja väliledgerit | feature_worker (medium), feature_architect, runtime_diagnostician, qa_verifier ja docs_sync; pääagentin katselmus ja viimeistely | Riippumaton geometria-arvio, diagnoosi ja QA; työnkulkunäytteiden keruu ei ole käytössä | 9.9.2026 | Ei arviota token- tai käyttökuluista |
| Käynnissä oleva kehitysnäkymä | `tmp/pickup-dev-20260909.log`; HTTP GET | HTTP 200, Vite valmis osoitteessa `http://127.0.0.1:5174/` | Sovellus on paikallisesti käynnistetty; UI-QA tehtiin erikseen tuotantopreviewssä 4174 | 9.9.2026 lopullinen lähde | Käynnistysnäyttö, ei julkaisu |
| Varmennuksen rajat | Brief, testit ja QA | Jyrsintäsyvyydet pysyvästi ohjelman ulkopuolella; ei valmistusvientiä/-artefaktia, fyysistä sovitusta, natiivin Save As -dialogia, Safari- tai julkaisuvarmennusta | Automaattinen geometria ja paikallinen selain eivät todista valmistuskelpoisuutta | 9.9.2026 | Jyrsintäsyvyydet pysyvästi pois; muut näyttötasot todentamatta |

## FEATURE BRIEF — 7/8-kieliset kolot ja nauhaan kohdistuva kaula (9.9.2026)

Tila: TOTEUTETTU JA VARMENNETTU. Riippumaton qa_verifier hyväksyi sovellustoteutuksen; pääagentti tarkisti ja viimeisteli docs_syncin dokumentaatiomuutokset. Tämä vaihe korvaa aiemmat nykytilaväitteet profiilimäärästä, kaulan oletussijoituksesta ja kontekstipaneelin paikasta.

### Tavoite

Yhdeksän nimettyä 2D-mikrofoniprofiilia, nauhalla määritettävä kaulan sijoitus kiinteään keskinodeen sekä kontekstityökalut ja kaulapaneeli suuren kuvan yläpuolella.

### Ei-tavoitteet

Z-akseli, jyrsintäsyvyydet, syvyystasot ja 3D ovat pysyvästi ohjelman ulkopuolella. Tässä vaiheessa ei lisätty vapaata pickup-kiertoa, sivuttaissiirtoa, skaalausta, automaattista konfliktien ratkaisua, muita hardware-koloja tai valmistusvientiä. Muiden 2D-kolojen ja 2D-valmistusvientien jatkosuunnitelmat säilyvät.

### Käyttäjän vahvistamat päätökset

Mukana ovat 7- ja 8-kielisten nimetyt mikrofonikolot. Kaulan sijainti määräytyy valitun nauhan suhteesta lukittuun keskinodeen. Mikrofonikolot pysyvät rungon koordinaateissa kaulamuutoksen aikana, ja ristiriitainen muutos hylätään atomisesti. Kontekstipaneelit ovat työtilan yläpuolella. Ohjelma on pysyvästi 2D.

### Sallitut paikalliset oletukset

Uusi projekti käyttää edelleen kuusikielistä, 25,5 tuuman / 22 nauhan kaulaa. Sen 17. nauha kohdistuu keskinodeen offsetilla 0 mm. Oletus on tämän projektin lähtökohta, ei yleinen valmistajastandardi. Uuden lyhyemmän kaulan luonnissa ankkuri on min(17, nauhamäärä); olemassa olevan kaulan nauhaa ei muuteta hiljaa.

Neljä uutta version 1 profiilia ovat SD HB7 ja HB8 uncovered passive mount sekä EMG707 ja EMG808 soapbar. SD:n suorakulmaisia runko- ja korvatilavarauksia kasvatetaan 3 mm per sivu ja kaikki 12 kulmaa pyöristetään R2,5:llä; tämä ei ole tasainen 3 mm reunavälys. EMG:n 1 mm reunavara kasvattaa kuoren R3,175-kulmat R4,175:een. Tarkat mitat, tunnisteet ja valmistajien piirustukset on koottu [pickup-katalogiin](reference-analysis/pickup-cavity-catalog.md).

### Käyttäytymispolut

1. Uusi projekti saa yhden SH-12-kolon 50 mm:n päähän tallan kontaktiviivasta, kolon keskeltä mitattuna. Sen paikka lasketaan uuden kaulan sijoituksen jälkeen.
2. **Nauha keskinoden kohdalla** hyväksyy kokonaisluvun 1–kaulan nauhamäärä. Nauhan muuttaminen nollaa offsetin samassa luonnoksessa. Valitun nauhan tarkka PCHIP-käyrän paikallinen X=0-kohta siirtyy keskinoden koordinaatteihin.
3. Tavallinen Pituussiirto-kenttä on poistettu. Vanha offset säilyy avauksessa, tallennuksessa, puhtaassa hyväksynnässä ja muiden kaula-asetusten muutoksissa. Ei-nollainen arvo näytetään, ja **Kohdista nauha keskinodeen** nollaa sen vain käyttäjän valinnasta.
4. FretFactory-tuonti päivittää kaulan parametrit ja säilyttää GTRfactoryssa jo määritetyn sijoituksen sekä päätyasetukset. Liian pieni tuotu nauhamäärä hylätään; ankkuria ei hiljaa siirretä. Kaulaton legacy-template ei muuta tallennettua dokumenttia ennen hyväksymistä.
5. Kelvollinen luonnos päivittyy kaikkiin esikatseluihin. Hyväksy tekee yhden undo-askeleen; peru palauttaa hyväksytyn dokumentin. Virhe säilyttää viimeisen kelvollisen esikatselun ja estää hyväksymisen. Pickupien centerYmm säilyy; konfliktin ratkaiseminen edellyttää erillistä kolon siirtämistä tai poistamista.
6. Lisää- ja Vaihda malli -valikot näyttävät kaikki yhdeksän profiilia, kielimäärän, SVG-kuvan ja 2D-mitat. Kielimäärä ei pakota suodatusta tai vaihda olemassa olevia profiileja. End- ja nuolinäppäimet vierittävät valitun rivin näkyviin.
7. Kontekstirivi ja sen korvaava kaulapaneeli ovat DOMissa työtilan yläpuolella. Tavallisten valintojen vaihtaminen säilyttää piirtoalueen koon; kaulapaneeli käyttää aiempaa omaa korkeuttaan. Etu sisältää kaulan ja pickupit, Taka reunan ja keskiviivan, Tasku rungon yläosan ja avoimen U:n.

### Muutettavat vastuualueet tai tiedostot

Sovellusmuutokset: src/pickup/profiles.ts, src/neck/fretfactoryGeometry.ts (oletusvakio), src/store.ts, src/editor/NeckWorkspace.tsx, src/editor/PickupMenu.tsx ja src/App.tsx. Testimuutokset: profiles.test.ts, pickupTransactions.test.ts, pickups.spec.ts ja uusi tests/e2e/neck-anchor.spec.ts. CSS ja ContextTools-komponentin lähde eivät muuttuneet. README, AGENTS, tämä brief ja pickup-katalogi synkronoitiin.

### Säilytettävät rajat

Kanoniset millimetrit, muuttumaton keskinode ja liittymäreferenssi, kapenevat sivut, tarkka PCHIP-laskenta, yhteinen päätyradius, viiden aiemman version 1 profiilin polut ja pickupien runkokoordinaatit säilyvät. FretFactory-sisarprojekti, vendor, riippuvuudet ja Vite-konfiguraatio säilyvät muuttumattomina. 2D-tarkistus ei todista fyysistä sovitusta.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti säilyy v5:nä. NeckPlacement säilyttää joinFret- ja offsetMm-tiedot; PickupCavity profiilitunnisteen, version ja centerYmm-arvon. Rekisteriin lisättiin stringCount: 6 | 7 | 8 ja neljä uutta version 1 tunnistetta. Tuntematon profiili tai versio hylätään. Aiempi sovellusversio ei tunne uusia profiileja.

### Toteutusjärjestys

Arkkitehtiarvio ja lähdetutkimus; workerin profiili-, sijoitus- ja UI-toteutus; pääagentin lähdekatselmus ja kaulan puuttuvien E2E-polkujen täydennys; peräkkäiset testit ja visuaalinen tarkistus; riippumaton QA; docs_sync ja pääagentin dokumentaatiokatselmus. Yksi lähde- tai dokumenttikirjoittaja kerrallaan.

### Hyväksymiskriteerit

Yhdeksän suljettua, lähdevaipan sisältävää ja mitoilleen tarkistettua profiilia; uudet profiilit lisättävissä ja tallennettavissa v5:een; oletus 17 kaikissa uuden kaulan luontipoluissa; tarkka nauha–keskinode-kohdistus myös kaarevalla moniskaalalla; legacy-offsetin säilytys ja eksplisiittinen nollaus; muuttumaton kaulaton legacy ennen hyväksyntää; yksi undo ja atomiset konfliktit; pickupien muuttumaton centerYmm; yläpaneeli ja toimiva valikko desktopissa sekä 850/390-pikselin näkymissä; pysyvä 2D-raja dokumentaatiossa.

### Testit ja muut varmennustasot

Node 24.15.0 / npm 12.0.1. Unit- ja integraatiotestit 101/101 PASS, build PASS, pickup-E2E 14/14 PASS ja lisätty kaula-ankkuri-E2E 4/4 PASS. Yksi kokonainen E2E-ajo läpäisi 76/76. Pääagentin visuaalinen tarkistus läpäisi 3/3 koossa 1440×900, 850×800 ja 390×664; ei konsolivirheitä tai vaakaylivuotoa. Riippumaton qa_verifier hyväksyi sovelluksen lähdekatselmuksen ja tämän näytön perusteella. Sovelluslähde ei muuttunut workerin tuotantobuildin jälkeen; lisä-E2E-tiedosto ja dokumentit eivät muuttaneet bundlea. Muuttumatonta porttikonfiguraatiota ei testattu uudelleen eikä dev-palvelinta pysäytetty.

### Dokumentaatiovaikutukset

README ja AGENTS kuvaavat 22-nauhaisen kaulan kohdistuksen 17. nauhasta, yhdeksän profiilia, legacy-offsetin ja yläpaneelin. Katalogissa ovat valmistajien lähteet ja omat suunnitteluvarat. Aiemmat syvyysominaisuuden jatkosuunnitelmat on korjattu pysyväksi rajaukseksi. Aiemmat testitulokset säilyvät historiallisina.

### Riskit

7/8-kielisyys ei määritä yhtä yleistä kolokokoa. Profiilit ovat nimettyjä suunnittelutilavarauksia. SD-piirustukset tarkistettiin myös kuvina; EMG707/808:n virallinen PDF-teksti tarkistettiin, mutta kuvatarkistus ei onnistunut työkalun ja Cloudflare-haasteen vuoksi. Vanhan 12. nauhan sijoituksen vaihtaminen 17:ään voi aiheuttaa konfliktin paikallaan pysyvän pickupin kanssa; ohjelma ei ratkaise sitä siirtämällä koloa.

### Ratkaisematta jääneet asiat

Ei estäviä toteutuskysymyksiä. Fyysinen sovitus, valmistusartefakti, natiivi käyttöjärjestelmän Save As -dialogi, Safari, julkaistu ympäristö ja fyysinen laitekoe ovat todentamatta. Z ja jyrsintäsyvyydet eivät ole avoimia ominaisuuksia. Muiden 2D-kolojen ja 2D-valmistusvientien jatkovaiheet vaativat oman toteutuksen ja varmennuksen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Käyttäjän pyyntö lisätä 7/8-kielisten profiileja, siirtää valikko ja kohdistaa kaula nauhalla valtuutti toteutuksen. Ei Git-, julkaisu- tai deploy-toimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — 7/8-kieliset kolot ja nauhaan kohdistuva kaula

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähteet | Valmistajapiirustukset ja tmp/extended-pickup-sources/ledger.md | SD7/8 kuvat tarkistettu; EMG707/808 PDF-teksti tarkistettu | Nimetyt XY-vaipat ja omat varat, ei ruuvijaon käyttöä ulkomittana | 9.9.2026 | EMG-kuvatarkistus puuttuu |
| Unit ja integraatio | npm run test:run; tmp/extended-worker-unit-coverage-final.log | 101/101 PASS | Profiilimäärä, mitat, lähdevaipan sisälläolo, sijoitus, transaktiot ja v5-roundtrip | 9.9.2026, lopullinen lähde ja testit | Sama laskenta ja rekisteri |
| Build | npm run build; tmp/extended-worker-build.log | PASS; index-CqhZI0w9.js / index-Iay1IVli.css | TypeScript ja tuotantobundle | 9.9.2026, worker-build | Sovelluslähde säilyi tämän jälkeen |
| Pickup-E2E | npx playwright test tests/e2e/pickups.spec.ts --workers=1 --reporter=line; tmp/extended-worker-e2e-final.log | 14/14 PASS | 9 vaihtoehtoa ja End-vieritys, 17→16/undo, paikallaan pysyvä kolo ja virhepolut | 9.9.2026, sama build | Paikallinen Edge ja iPhone 13 -kokoinen Chromium |
| Legacy ja tuonti | npx playwright test tests/e2e/neck-anchor.spec.ts --workers=1 --reporter=line; tmp/extended-root-anchor-e2e.log | 4/4 PASS | 8,5 mm/in-offset, muuttumaton avaus/tallennus/hyväksyntä, kohdistus+undo; tuonti säilyttää join16/end12,75/radius7,25 ja hylkää frets12 ilman hiljaista siirtoa | 9.9.2026, uusi pääagentin E2E | Sama lähde ja testi |
| Koko E2E | npx playwright test --workers=1 --max-failures=2 --reporter=line; tmp/extended-root-full-e2e.log | 76/76 PASS yhdessä 2,5 minuutin ajossa | Koko desktop- ja mobiiliregressio | 9.9.2026, sama build | Ei tämän vaiheen avoimia testivirheitä |
| Visuaalinen tarkistus | tmp/extended-visual-qa.mjs/json ja extended-qa-*.png; pääagentin kuvakatselmus | 3/3 PASS; ei konsolivirheitä/vaakaylivuotoa | Paneeli kuvan yläpuolella, vakaa tavallinen konteksti, viimeinen valikkokohta näkyy, EMG808-vaihto ja kaulan muutos säilyttävät kolon paikan | 9.9.2026; 1440×900, 850×800, 390×664 | Paikallinen Edge, ei fyysinen puhelin |
| Riippumaton QA | extended_guitar_qa:n lähdekatselmus ja yllä oleva näyttö; tmp/extended-root-qa-ledger.md | VERIFIED, ei estäviä sovelluslöydöksiä | Briefin kriteerit ja säilytettävät rajat | 9.9.2026, lopullinen sovelluslähde | Dokumentit tarkistettiin erikseen tämän jälkeen |
| Rajaus ja dokumentointi | 80 tiedoston baseline; tmp/extended-scope-before-docs.json; nykytiladokumenttien katselmus | Ennen docs-vuoroa 10 vanhaa tiedostoa muuttui ja uusi neck-anchor.spec.ts lisättiin; ei vendor-, sisarprojekti-, dependency-, Vite- tai Git-muutoksia | Rajattu paikallinen toteutus | 9.9.2026; baseline tmp/extended-guitar-baseline-20260909 | Pääagentti viimeisteli docs_syncin muutokset |
| Korjauskierrokset ja työnjako | Worker-lokit ja tmp/extended-root-qa-ledger.md | Vanha 5-odotus, here-string-rivinvaihdot, TS-kenttätyyppi ja EMG-testin teräväkulmainen oletus korjattiin; lähdekatselmus korjasi lähde-URL:t, import-clampin, lomakeresetin ja tuplamuunnoksen | Historialliset epäonnistuneet ajot eivät ole lopullista hyväksyttyä näyttöä | 9.9.2026; feature_architect, feature_worker medium, qa_verifier medium, docs_sync ja pääagentti | Ei workflow sample -keruuta tai arviota tokenikuluista |
| Käynnissä oleva ohjelma | HTTP GET http://127.0.0.1:5174/ | HTTP 200; aiempi dev-PID 9620 säilyi | Paikallinen kehityspalvelin käynnissä; tilapäinen 4174-preview suljettu | 9.9.2026 lopputarkistus | Ei julkaisuvarmennusta |



## FEATURE BRIEF — Kaulan ja otelaudan erilliset päädyt (9.9.2026)

Tila: TOTEUTETTU JA VARMENNETTU. Strict-kierroksen unit-, build-, E2E- ja riippumaton QA-näyttö on kirjattu alla. E2E-kattavuus koostuu kolmesta ajosta, ei yhdestä kokoajosta.

### Tavoite

Kaulan fyysisellä kantapäällä ja otelaudalla on erilliset päätyvarat. Kaulataskun pääty johdetaan vain kantapäästä, ja Etu-näkymä erottaa valittavan otelaudan fyysisestä kantapäästä.

### Ei-tavoitteet

Ei uusia kaulasivuja, erillistä otelaudan kulmasäätöä, sivuttaista ylitystä, valmistusvientiä tai muutoksia FretFactoryyn/vendor-alueeseen. Z-akseli, jyrsintäsyvyydet ja 3D pysyvät kokonaan ulkopuolella.

### Käyttäjän vahvistamat päätökset

Kaulan päätyvara on fyysisen pyöristetyn kantapään mitta ja otelaudan päätyvara sen erillinen mitta. Otelaudan päätyvaran on oltava aidosti suurempi kuin kaulan päätyvara. Koko viimeisen nauhan PCHIP-käyrän on pysyttävä fyysisen kantapään sisällä; otelaudan ylitys on nauhatonta aluetta. Mikrofonikolot pysyvät runkokoordinaateissa kaulan muuttuessa.

### Sallitut paikalliset oletukset

Molemmat varat mitataan viimeisen nauhan rungonpuoleisimmasta pisteestä keskiviivan suuntaisesti (`lastFretMaxY`). Uuden kuusikielisen, 22-nauhaisen ja 25,5 tuuman / 647,7 mm:n kaulan oletukset ovat kaulan päätyvara 10 mm, otelaudan päätyvara 16,35 mm, kulmasäde 6 mm, kokonaisväljyys 0 mm, liittymän 17. nauha ja offset 0 mm. Erotus 6,35 mm näytetään otelaudan ylityksenä. Nämä ovat sovelluksen aloitusarvoja, eivät valmistajastandardi.

### Käyttäytymispolut

1. Uusi kaula, FretFactory-tuonti ilman olemassa olevaa kaulaa ja nykyisen kaulattoman v6-projektin tilapäinen template käyttävät samoja oletuksia. Template ei muuta tallennettua dokumenttia ennen hyväksyntää.
2. Sovitus-ryhmässä ovat Kaulan päätyvara- ja Otelaudan päätyvara-kentät. Kentät hyväksyvät mm- ja tuumasyötteen; erotus näytetään ylityksenä. Nykyinen yhteinen Kulmasäde pyöristää kantapään, otelaudan ja taskun päätykulmat. Kokonaisväljyys vaikuttaa vain taskuun.
3. Otelaudan muutos vaikuttaa vain otelaudan ääriviivaan ja pickupien sallittuun alueeseen. Se ei muuta heel/tasku/nut/bridge/joint/pickup-centerY-arvoja. Kantapään muutos vaikuttaa kantapäähän ja taskuun, ei otelaudan päähän, satulaan tai tallaan.
4. Etu näyttää valittavan umpinaisen otelaudan, ohuen katkoviivaisen fyysisen kantapään ja näkyvän rungon reunan; kantapään osoitin ei ota pointer-tapahtumia. Taka säilyy rungon reunana ja keskiviivana. Tasku näyttää vain kantapäästä johdetun avoimen U:n.
5. Viimeisen nauhan koko käyrä tarkistetaan fyysisen pyöristetyn kantapään sisällä. Liian pieni vara, board <= heel, mahdoton säde, epäkelpo numero tai pickup-konflikti säilyttää viimeisen kelvollisen esikatselun ja estää hyväksynnän atomisesti.
6. Hyväksyntä on yksi undo-askel. FretFactory-URL säilyttää molemmat päätyarvot ja sijoituksen. Virheellinen v6-avaus hylätään ennen avoimen työn korvaamista.
7. Vain v6-projektit luetaan. v1–v5 hylätään selkeästi; migraatiota, vanhan taskun säilymistä tai vanhan version avaamista ei luvata.

### Muutettavat vastuualueet tai tiedostot

NeckEnd-, kaulageometria-, tasku-, näkymä-, store-, projektitiedosto-, pickup- ja editorikomponentit sekä niitä vastaavat testit. README, AGENTS, tämä brief ja reference-analysis/neck-end-overhang.md kuvaavat toteutuneen muutoksen. Vendor, sisarprojekti ja profiilien mitat/config eivät muutu.

### Säilytettävät rajat

Millimetrit kanonisena yksikkönä; yhteinen lastFretMaxY-datum, keskinode ja liittymäreferenssi; nauhaan kohdistus, nykyisen v6:n tallennetun offsetin säilytys ja erillinen nollaus, kapenevat sivut, PCHIP-kontaktit, runkoon kiinnitetyt pickup-koordinaatit, nykyiset yhdeksän profiilia, yläpaneeli ja kolme synkronista näkymää. Vain 2D. Collision- ja containment-tarkistukset eivät todista valmistuskelpoisuutta.

### Tietomalli- ja rajapintamuutokset

Projektiversio on 6. NeckEnd.endMarginMm säilyttää kantapään varan ja fretboardEndMarginMm otelaudan varan. Snapshotissa säilyvät vastaavat päätykoordinaatit; molemmat johdetaan lastFretMaxY-datumista. V6-parseri validoi formaatin, molemmat mitat ja snapshotin ennen hyväksyntää. Aiemmat versiot hylätään ilman migraatiota.

### Toteutusjärjestys

Lähdetutkimus ja brief; toteutus ja testit; pääagentin katselmus; riippumaton QA; docs_sync ja loppukatselmus. Yksi seurattujen tiedostojen kirjoittaja kerrallaan.

### Hyväksymiskriteerit

Kaksi toimivaa mittaa ja 6,35 mm:n oletuserotus; strict board > heel; viimeisen nauhan koko käyrä fyysisen kantapään sisällä; Etu näyttää molemmat päät ja Tasku vain taskun; tarkka v6-tallennus/avaus, tuonti ja undo; v1–v5 hylkäys atomisesti; pickup-konflikti atominen; sovellus säilyttää 2D- ja yhdeksän profiilin rajat.

### Testit ja muut varmennustasot

Unit- ja integraatiotestit 104/104 PASS, build ja typecheck PASS. E2E-näyttö on 61 + 2 + 15 = 78 PASS kolmesta ajosta. Edge- ja iPhone 13 -kokoinen Chromium-simulaatio ovat selainnäyttöä; eivät fyysinen laite tai Safari. Aiempi 1440/850/390 Edge- ja konsolinäyttö säilyy voimassa, koska SVG/CSS ei muuttunut strict-kierroksella.

### Dokumentaatiovaikutukset

README ja AGENTS kuvaavat v6-only-lukua, kahta päätyvaraa, strict-ehtoa ja viimeisen nauhan containment-rajaa. Tämä osio ja tutkimusmuistio erottavat valmistajaesimerkit sovelluksen omista oletuksista. Historiallisia testituloksia ei esitetä nykyisenä näyttönä.

### Riskit

Otelaudan pidentäminen voi estyä pickup-konfliktin vuoksi. Yhteinen kulmasäde voi rajoittaa viimeisen nauhan mahtumista; rajoitusta ei ohiteta. 2D-tarkistus ei osoita fyysistä valmistuskelpoisuutta.

### Ratkaisematta jääneet asiat

Ei estäviä sovelluskysymyksiä. Fyysinen sovitus, valmistusartefakti, natiivi Save As, julkaistu ympäristö, Safari ja fyysinen laitekoe ovat todentamatta. Z, syvyydet ja 3D eivät ole avoimia ominaisuuksia.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Käyttäjä valtuutti tutkimuksen, suunnittelun ja toteutuksen sekä viimeisessä tarkennuksessa v6-only- ja strict board > heel -rajat. Ei Git-, julkaisu- tai deploy-toimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — Erilliset päädyt

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Strict-geometria ja v6 | tmp/neck-ends-strict-root-ledger.md; tmp/neck-ends-strict-qa-ledger.md | QA VERIFIED; heel >= 0, board > heel, koko viimeinen PCHIP-käyrä heelissä | Tiukat päätyrajat, v6-only ja atomisuus | 9.9.2026, strict-lähde | Voimassa lähdehashiin |
| Unit ja integraatio | npm run test:run; tmp/neck-ends-strict-unit.log | 104/104 PASS | Geometria, store, formaatti, pickupit ja transaktiot | 9.9.2026 | Nykyinen lähde |
| Tyyppitarkistus ja build | `npm run build` (sisältää `tsc -b` -tyyppitarkistuksen); tmp/neck-ends-strict-build.log | PASS | TypeScript ja tuotantobuild | 9.9.2026 | Nykyinen lähde |
| E2E-kattavuus | tmp/neck-ends-strict-full-e2e-final.log; tmp/neck-ends-strict-corrected-e2e.log; tmp/neck-ends-strict-remaining-e2e.log | Kaikille 78 tapaukselle PASS-näyttö kolmesta ajosta: 61 + 2 + 15. Laaja ajo päättyi 61 PASS / 2 FAILED / 15 ajamatta; virhetekstiodotuksen testikorjauksen jälkeen 2 epäonnistunutta ja 15 ajamatta jäänyttä läpäisivät | Kaikki 78 nykyistä tapausta saman sovellushashin vasten | 9.9.2026 | Ei yksittäinen 78/78-kokoajo; ei fyysinen laite/Safari |
| UI, konsoli ja kuvat | tmp/neck-ends-qa.mjs/json; pääagentin Edge- ja kuvakatselmus | 3/3 PASS; SVG/CSS muuttumaton strict-kierroksella | Kentät, kerrokset, luettavuus, ei ylivuotoa tai konsolivirheitä | 9.9.2026 | Paikallinen selain; ei julkaisuvarmennusta |
| Lähde- ja rajausauditointi | tmp/neck-ends-strict-source-hashes.json; strict-ledger | 0 sovelluslähteen hash-muutosta buildin jälkeen; vendor, riippuvuudet ja portit koskemattomat | Näyttö vastaa nykyistä lähdettä ja rajaus säilyy | 9.9.2026 | Voimassa tähän hash-tilaan |

#### Tekemättä jääneet varmennukset

Ei fyysistä valmistuskelpoisuutta tai mittakaavaa, valmistusvientiä, natiivia Save As -dialogia, julkaistua ympäristöä, Safaria tai fyysistä laitetta koskevaa varmennusta.

#### Korjauskierrokset ja loppukatselmus

Ensimmäisessä strict-yksikköajossa vanha v1-avausodotus korjattiin uuteen vaatimukseen. Ensimmäinen strict-koko-E2E pysähtyi kahteen v1-muotoista onnistumisaineistoa käyttävään testiin (19 PASS / 2 FAILED / 57 ajamatta); aineistot päivitettiin kelvollisiksi v6-projekteiksi muuttamatta stale-read- tai haamun muuttumattomuusassertteja. Seuraavan laajan ajon kahdessa epäonnistumisessa parserin odotettiin käyttävän lomakkeen virhetekstiä; vain testin tekstiodotus korjattiin. Sovelluslähde ei muuttunut lopullisten korjausajojen välillä. Aiemman väliversion migraatio- ja tasapäisyysnäyttö on historiallista, eikä se todista nykyistä v6-only-käyttäytymistä.

Dokumentaatio päivitettiin docs_sync-agentilla ja pääagentin loppukatselmuksessa. Pääagentti täydensi säilytettävät käyttöpolut, mittauskohdan ja tarkat komentolokit. Pelkät dokumenttimuutokset eivät uusi muuttumattoman sovelluslähteen testinäyttöä.

## FEATURE BRIEF — Lavan muokkaus ja virittimien sijoittelu (9.9.2026)

Tila: DESIGN READY. Tämä on toteuttamaton suunnitelma; sovellus säilyy v6:ssa. Tutkimus ja arkkitehtuurin katselmus on tehty. Toteutusvaltuutus puuttuu. Tämä osio omistaa tämän ominaisuuden suunnitelman; lähteet ja johtolaskut ovat tiedostossa reference-analysis/headstock-tuners.md.

### Tavoite

Lapa liittyy kaulaan satulan molemmissa päissä ja sitä muokataan Etu-näkymässä nykyisillä node- ja kahvatyökaluilla. Ohjelma sijoittaa yhden sivun virittimet käyttäjän muotoon, huomioi virittimen vaatiman tilan ja etsii mahdollisimman suoran kielivedon todellisista satula- ja tallakontakteista. Käyttäjä näkee ristiriidan ja voi korjata luonnoksen ennen hyväksyntää.

### Ei-tavoitteet

Ei erillistä lapasivua tai Runko/Kaula/Lapa-navigointipainikkeita, kahden sivun viritinryhmiä, yleistä viritinvalikoimaa, kielten paksuus- tai käämintäkerrosmallia, valmistusvientiä tai taaksepäin yhteensopivuutta. Ei muutoksia FretFactoryyn tai vendor-alueeseen. Z-akseli, jyrsintäsyvyydet, lavan pystysuuntainen kallistus ja 3D pysyvät kokonaan ulkopuolella.

### Käyttäjän vahvistamat päätökset

- Lapa näkyy ensimmäisen näkymän kaulan jatkeena ja liittyy saumattomasti satulan molempiin päihin.
- Ensimmäisessä versiossa kaikki virittimet ovat samalla puolella. Schaller M6 Mini on lähtömalli.
- Käyttäjän muoto ohjaa reikien automaattista sijoittelua. Epäkelvon luonnoksen hyväksyminen estetään.
- Virittimien alueella myös reunan muokkausta saa rajoittaa.
- Käyttäjä haluaa 6→7/8-kielisessä mallissa koko lavan mittasuhteiden kasvavan viritinsivun mukana; satulan kielijako huomioidaan samalla reunan kulmassa. Tämä korvaa aiemman oletuksen vapaan siluetin muuttumattomasta fyysisestä koosta kielimäärän vaihtuessa.
- Kielimäärä ja satulan kielivälit huomioidaan. Kulman pienentämisen vaatima pituus selitetään viritinrivin ja suoran kielivedon geometrisena suhteena.

### Sallitut paikalliset oletukset

Ensiprofiili käyttää M6 Minin pientä metallinuppia. Liittymään valitaan G1-jatkuvuus: päätepisteet ja kahvojen suunnat johdetaan kaulan sivuista, kahvan pituutta voidaan muuttaa tangenttisuunnassa. Nämä ovat teknisiä valintoja, eivät käyttäjän erikseen vahvistamia valmistajamittoja.

Säilytetään kaulan nykyinen 1–12 kielen sopimus; tärkeimmät käyttöesimerkit ovat 6, 7 ja 8 kieltä. V1:n oletus on bassopuolen viritinrivi. Käyttäjän kaaren ei tarvitse olla suora: suora rivi on sijoittelun alustus. Sovellusprofiili yksilöi asennussuunnan, koneiston kätisyyden ja oikean käämintäpuolen.

25 mm:n pylväsjako ja 12,7 mm:n etäisyys reunasta ovat ensimmäisen sijoittelun tavoitearvoja, eivät Schallerin minimimittoja. Kovat rajat perustuvat profiilin koko tasogeometriaan ja erikseen nimettyihin suunnitteluvaroihin. Varat, numeeriset toleranssit ja etsinnän rajat lukitaan geometriavaiheessa ennen UI-toteutusta.

### Käyttäytymispolut

1. Uuden projektin 25,5 tuuman / 22 nauhan / kuuden kielen kaulaan muodostetaan kelvollinen oletuslapa. Kaulaton projekti pysyy kaulattomana; tilapäinen kaulatemplate saa lavan vastaavan luonnoksen. Template ei muuta dokumenttia ennen hyväksyntää.
2. Lavan klikkaus valitsee lavan ja avaa sen node-työkalut ison kuvan yläpuolelle. Muotoa, reikiä ja kielijänteitä näytetään samassa Etu-kuvassa. Muokkauksessa näytetään myös koneistojen tilavaraukset ja tarvittavat rajoitteet; tavallinen näkymä pidetään luettavana.
3. Kaksi satulaliittymän pistettä ovat johdettuja ja lukittuja. Vapaat nodet ja kahvat muokkaavat lavan ääriviivaa. Virittimien puoleinen reunajakso on tunnistettu erikseen, ja sen sallitut muodot rajoittuvat kelvollisiin sijoitteluihin. Reunajakson tunnisteet säilyvät nodea lisättäessä tai poistettaessa.
4. Vedon aikana piirretään käyttäjän ehdottama muoto ja ratkaistaan reiät rajatulla, deterministisellä haulla. Muuta lavan muotoa ei pidennetä tai muuteta huomaamatta. Epäkelpo ehdotus pysyy näkyvänä, ristiriita korostetaan ja hyväksyntä estyy. Vanhaa reikäratkaisua ei esitetä uutena kelvollisena ratkaisuna.
5. Suorassa rivissä rinnakkaisille kielille s = W/(N-1), D sin(alpha) = s ja L = W/sin(alpha). W on uloimpien kielten väli satulalla, alpha rivin kulma kielten suuntaan ja L ensimmäisen ja viimeisen pylvään väli. Kulman pienentyessä tarvittava L kasvaa. Kulman kasvua rajoittaa virittimien mahtuminen; kaava ei määrää koko lavan pituutta. Kaareva reuna ja todelliset kielisuunnat ratkaistaan koko geometriasta.
6. Satulan kontaktit otetaan kaulan snapshotin todellisista kielipisteistä; uloimpia laudan reunapisteitä ei tulkita kieliksi. Jokaista kieltä jatketaan tallalta satulan kautta lavalle. Näkyvä vapaa jänne päättyy oman pylvään kehän tangenttipisteeseen, ei porausreiän keskelle.
7. Kelvollinen lapaluonnos hyväksytään yhtenä undo-askeleena. Peru palauttaa hyväksytyn tilan. Undo/redo palauttaa muodon ja sitä vastaavat reiät yhdessä. Tallennus ei vie keskeneräistä luonnosta dokumentiksi.
8. Kaulan mittojen tai FretFactory-tuonnin muuttuessa käyttäjän perusmuoto säilyy kuusikielisessä baseOutline-koordinaatistossa. Fyysinen siluetti johdetaan siitä kielimäärän kokokertoimella ja kielijaon tasokierrolla; satulaliittymä ja reikäratkaisu lasketaan uudelleen. Epäkelvossa yhdistelmässä käyttäjä voi korjata lapaa samassa kaulan kokonaisluonnoksessa tai perua kaulamuutoksen. Molemmat hyväksytään yhtenä transaktiona; erilliset luonnokset eivät saa lukita käyttäjää tilanteeseen, jota ei voi korjata. Henkilökohtaista lapaa ei korvata automaattisesti oletuksella.
9. Projektin avaus tarkistaa muodon, profiilin ja snapshotin ennen avoimen työn vaihtamista. Virhe tai vanhentunut asynkroninen vastaus ei muuta työtä. Vain uusi v7-sopimus hyväksytään toteutuksen jälkeen.
10. Etu-pikkukuva käyttää samaa geometriaa. Taka pysyy rungon ulkoreunana ja keskiviivana, Tasku ylävartalona ja kaulataskuna. Etunäkymän sovitus sisältää lavan; rungon mittaviivaimet mittaavat edelleen runkoa. Nodea vedettäessä näkymää ei soviteta uudelleen automaattisesti.

### Muutettavat vastuualueet tai tiedostot

- src/model/project.ts: kaulaan kuuluva lapa ja tuleva projektiversio 7.
- Uusi src/headstock/: profiili, satulan paikallinen koordinaatisto, liittymä, sijoittelu, validointi ja piirrettävä geometria.
- src/neck/neckView.ts: Etu-geometrian koostaminen ja näkymän rajat.
- src/store.ts: body/headstock-muokkauskohde, luonnosten omistajuus, kaulan ja lavan atominen hyväksyntä sekä undo/redo.
- EditorCanvas.tsx, ContextTools.tsx, pieni HeadstockWorkspace.tsx ja App.tsx: osan valinta, samat node-toiminnot, virhetieto ja yläpaneeli. Ei toista itsenäistä vektorieditoria.
- projectFile.ts ja FileActions.tsx: v7-parseri, snapshotin tarkistus, avaus/tallennus ja keskeneräisen luonnoksen suojaus.
- Rajatut geometria-, store-, tiedosto- ja E2E-testit sekä tarvittava CSS. Tarkat nykyiset polut varmistetaan ennen toteutusta.

### Säilytettävät rajat

Kanoninen geometria on millimetreissä. Runko, keskimmäinen kiinteä liittymänode, nauhaan kohdistus, kapeneva kaulatasku, erilliset kaulan ja otelaudan päätyvarat, viimeisen nauhan mahtuminen fyysiseen kantapäähän ja runkoon kiinnitetyt mikrofonikolot säilyvät. Kaula osoittaa ruudulla oikealle. Kolme synkronista näkymää, valinta kuvasta, pikkukuvat/1–2–3, zoom/pan, näppäimistö ja kapea näkymä säilyvät. FretFactory ja vendor pysyvät muuttumattomina. Tämän työn aikana nykyinen toteutus ja formaatti säilyvät v6:ssa.

### Tietomalli- ja rajapintamuutokset

Lapa kuuluu NeckDocumentiin. Muoto tallennetaan kuusikielisen peruskoon baseOutlineen paikallisina mm-koordinaatteina. ReferenceStrings, templateId/version ja scalePolicyVersion yksilöivät peruskoon ja muunnospolitiikan. Fyysinen siluetti ja liittymäpisteet johdetaan ja virittimien reunajakso nimetään. Profiilissa ovat yksilöity M6 Mini -variantti, lähderevisio ja versio. Sijoittelun snapshot tallentaa kielen indeksin, pylvään keskuksen, viritinkohtaisen orientaation, tangenttipisteen ja käämintähaaran sekä laskentaversion. Kaareva rivi ei käytä pakollista yhteistä orientaatiota. Lukija varmentaa snapshotin uudelleen laskettua geometriaa vasten.

Pakollinen uusi lapatieto nostaa projektiformaatin v7:ään. V1–v6 hylätään selkeästi; migraatiota ei toteuteta. neck:null on sallittu kaulaton tapaus. Satulan reunapisteitä, kielipisteitä ja kanonisia world-koordinaatteja ei sekoiteta paikallisiin lapakoordinaatteihin.

Kovat ehdot: yksinkertainen äärellinen ääriviiva ja kelvollinen liittymä; reiän, aluslevyn ja vaaditun kiinnitysalueen mahtuminen puulle; koneistojen ja nuppien tilavarat, ulospäin avautuva käyttötila, kielten järjestys, risteämättömyys ja muiden pylväiden välttäminen. Pylväälle päättyvä jänne on tangentti. Koneisto voi ulottua reunan yli vain profiilin siihen tarkoitetuilta osilta.

Pehmeä tavoite: minimoida ensin suurin satulan sivuttaiskäännös ja sitten käännösten summa, tavoitevälien poikkeamat ja aiemman ratkaisun tarpeeton liike. cross(u_i, C_i-S_i) = sigma*r kuvaa vain täysin suoran vedon ideaalia; se ei ole kaikkien muotojen pakollinen hyväksymisehto. Haun päättyminen ilman ratkaisua erotetaan todistetusta geometrisesta ristiriidasta. Globaalia optimia ei luvata.

### Toteutusjärjestys

1. Käyttäjän toteutuspyynnön jälkeen varmista lähteen lähtötila, vanhat muutokset ja suoritusympäristö. Repossa ennestään seurannan ulkopuoliset lähteet eivät ole tämän työn uusia muutoksia.
2. Geometriakoe: mittapiirustusten ankkuroitu konservatiivinen 2D-profiili, oikeat etu/taka- ja kätisyysmuunnokset, suunnitteluvarat, toleranssit ja rajoitettu deterministinen sijoittelu. Todista ensin yksinkertaiset laskuesimerkit ja mahdottomat muodot. Jos luotettava profiili ei synny, palauta DESIGN DEVIATION.
3. Tietomalli, v7-parseri ja kaulan/lavan yhteinen luonnos- ja transaktiopolku testeineen.
4. Etunäkymän lapa, valinta ja nykyisten node-työkalujen kytkentä, viritinalueen rajoitteet ja virhepalaute.
5. Relevantit tarkistukset peräkkäin, pääagentin katselmus, riippumaton qa_verifier, korjaukset ja docs_sync. Vain yksi seurattujen tiedostojen kirjoittaja kerrallaan.

### Hyväksymiskriteerit

- Lapa liittyy satulaan aukottomasti, liittymän pisteitä ei voi siirtää tai poistaa ja G1-suunnat säilyvät kaulaa muutettaessa.
- Lapa valitaan ja muokataan Etu-kuvassa ilman uutta navigointisivua; muut kaksi näkymää ja rungon mitat säilyvät.
- Jokaisella 1–12 kielen kaulalla on yksi oma viritin per kieli tai selkeä korjattava luonnosvirhe. 6/7/8-kieliset kelvolliset esimerkit sekä 1/12-raja- ja tilanpuutetapaukset varmennetaan.
- Todelliset kontaktit, pylvään säde, tangenttijänteet, oikea käämintähaara ja viritinkohtainen suunta toteutuvat. Suoraan vetoon päästään toteuttamiskelpoisessa ideaaliesimerkissä, mutta pieni poikkeama sallitaan kovat ehdot täyttävässä muodossa.
- Kulman/pituuden kaavat täsmäävät rinnakkaiseen suoramalliin; nollakulma ja lähes yhdensuuntaiset leikkaukset käsitellään ilman äärettömiä koordinaatteja tai jumiutumista.
- Väärä reunaetäisyys, törmäys, väärä kielijärjestys tai epäonnistunut haku eivät tuota hyväksyttyä reikäratkaisua. Palautuminen kelvolliseksi toimii ilman muodon häviämistä tai reikien tarpeetonta hyppimistä.
- Nodejen lisäys, poisto ja kahvat säilyttävät lukitut liittymät ja semanttisen viritinreunan. Kaula/lapa-kokonaisluonnoksen korjaaminen ja peruminen on mahdollista myös kielimäärän kasvettua.
- Apply, cancel, undo/redo, tallennus/avaus ja tuonti pitävät muodon, kaulan ja reikäsnapshotin atomisesti yhdessä. Virheellinen v7 tai v1–v6 eivät korvaa nykyistä työtä.

### Testit ja muut varmennustasot

Suunniteltu unit/integration: profiilien ankkurointi, ympyrätangentit ja kätisyys, kaavojen laskuesimerkit, multiskaala/kaareva satula, 1–12, rungosta riippumaton paikallinen koordinaatisto, G1, kaareva viritinreuna, reiät/levy/ruuvi/nuppi-tilavaraukset, toleranssien molemmat puolet, no-crossing, determinismi, rajattu haku, luonnoksen palautuminen, yhteinen transaktio ja v7-snapshotin manipulointi.

E2E ja paikallinen selain: tuore oikea URL, lavan valinta ja node-vedot, invalid/apply/cancel/undo, kaulan muutos ja lavan korjaus samassa luonnoksessa, tuonti, tallennus/avaus, pikkukuvat, mitat, zoom/pan ja 1–2–3, leveä ja kapea näkymä sekä selainkonsoli. Regressiot kohdistetaan säilytettäviin runko-, kaula- ja pickup-polkuhin. npm run typecheck, npm run test:run, npm run build ja relevantti npm run test:e2e suoritetaan projektin juuressa peräkkäin. Muuttumattoman porttikonfiguraation testiä ei uusita ilman muutos- tai epäselvyyssyytä.

Tämä päivätty suunnittelumerkintä tehtiin ennen sovellustoteutusta; nykyinen sovelluksen testinäyttö on tämän tiedoston lopun v7-ledgerissä. Paikallinen selain ei todista fyysistä valmistusta tai mittakaavaa.

### Dokumentaatiovaikutukset

FEATURE_BRIEF omistaa suunnitelman ja uuden ledgerin. reference-analysis/headstock-tuners.md sisältää ensisijaiset lähteet, laskut ja oletusten erot. README ja AGENTS päivitetään vasta toteutuksen ja varmennuksen jälkeen kuvaamaan oikeaa v7-nykytilaa. Lähde-PDF:t ja suuret tutkimuskuvat säilyvät Gitin ja bundlen ulkopuolella.

### Riskit

Piirrosten eri projektiot ja kätisyys voivat johtaa väärään tilavaraukseen, ellei niitä ankkuroida ennen UI:ta. Kaareva reuna vaatii viritinkohtaisen suunnan ja täyden törmäystarkistuksen. Liian tiukka lavan muoto ei välttämättä salli suurempaa kielimäärää; käyttäjälle on annettava korjauspolku. Rajattu sijoitteluhaku voi jättää mahdollisen ratkaisun löytämättä, eikä sitä saa ilmoittaa matemaattiseksi mahdottomuudeksi. 2D-geometria ei todista puun lujuutta, sormien todellista käyttötilaa tai viritysvakautta. Kielten paksuuksia ja käämintäkerroksia ei mallinneta.

### Ratkaisematta jääneet asiat

Ei käyttäjän päätöstä edellyttäviä tuoterajauksia. Toteutuksen geometriavaiheessa ratkaistaan nimettyjen suunnitteluvarojen luvut, konservatiivinen profiili, sijoittelun toleranssit ja hakubudjetti; niitä ei esitetä jo varmennettuina. Lavan mallin nimi tai valmistajan 1:1-ulkoasu ei ole vaatimus. Valmistusvienti ja fyysinen sovitus eivät sisälly tähän vaiheeseen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Suunnittelu ja tutkimus on valtuutettu pyynnöllä suunnitella lavan editointi, käyttäjän valinnoilla M6 Mini / muoto ohjaa sekä jatkokysymyksillä muotorajoista ja kielijaon suhteesta viritinväliin. Sovelluksen toteutusta ei ole tässä ominaisuudessa pyydetty. Aiemman kaulan päätyominaisuuden toteutuslupa ei laajene lapaan. Ei Git-, julkaisu- tai deploy-toimia.

### VERIFICATION LEDGER — Lavan suunnittelu

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Sovelluksen liittymäkohdat | Pääagentin ja feature_architectin vain luku -kartoitus: model, neckView, store, parseri, editori ja testit | Kartoitettu | Nykyinen v6, 1–12 kieltä, kontaktipisteet ja luonnosten omistajuus | 9.9.2026, nykyinen työtila | Varmistetaan uudelleen toteutuksen alussa muutosten osalta |
| Valmistajamitat | Neljän mitta-PDF:n teksti, Poppler-renderöinti ja kokonaissivujen kuvakatselmus; lähteet tutkimusmuistiossa | Tarkistettu | Pylväs/poraus/levy/nuppi erotettu; mallikohtaiset jaot | 9.9.2026; piirustusten revisiot 2018/2021 ja lähde-PDF:t | Lähdeaineiston näyttö, ei fyysinen mittaus tai toteutettu profiili |
| Kulma, kielijako ja pituus | Analyyttinen johdanto ja numeeriset 6/7/8-esimerkit: W=35 mm, D=25 mm | L=125/150/175 mm; alpha=16,2602/13,4934/11,5370 astetta | Rinnakkaisten kielten ja suoran viritinrivin riippuvuus | 9.9.2026 | Vain ilmoitetut geometriset oletukset |
| Arkkitehtuurin katselmus | feature_architect; pääagentin kuusi korjausta: v7, oletukset, tangentti/tavoite, orientaatio, lähdepolku, testien toistorajaus | DESIGN READY; ei estävää tuotekysymystä | Toteutuskelpoinen rajaus ja geometriavaiheen ehdot | 9.9.2026 | Suunnittelun näyttö |
| Sovellus, UI ja formaatti | Ei lähdemuutoksia eikä sovellustestiajoja tässä suunnittelussa | EI TOTEUTETTU | Ei uutta lapaominaisuutta tai v7-lukijaa nykyisessä ohjelmassa | 9.9.2026 | Toteutuksessa tarvitaan uusi näyttö |
| Valmistus ja fyysinen sopivuus | Ei valmistusartefaktia tai laitekoetta | EI VARMENNETTU | Vain 2D-suunnitelma | 9.9.2026 | Ei valmistuskelpoisuusväitettä |

#### HISTORIALLINEN SUUNNITELMA — Lähdemallin täsmennys — lapamalli.svg (9.9.2026)

Tämä päivätty lähde- ja suunnitteluosio kuvaa toteutusta edeltänyttä tilaa. Sen toteutunut korvaava nykytila on tämän tiedoston lopun v7-osiossa.

Käyttäjän antamaa lapamalli.svg:tä käytetään oletuslavan siluetin lähtökohtana. Käyttäjän ehdottama Ibanez RG -vertailu tarkentaa asettelua ja satulaliittymää. Lähdekopio on CDR/headstock-research/lapamalli.svg, mitta-analyysi reference-analysis/lapamalli-template.json ja perustelut reference-analysis/headstock-tuners.md. Tämän valinnan lisääminen suunnitelmaan ei tarkoita sovelluksen toteutuspyyntöä.

Mallin pitkä viisto suora reuna (154,2855 mm, 17,5686 astetta SVG:n vaakasuuntaan) on oletuksen viritinreunajakso. Sen sisäpuolelle alustetaan samansuuntainen viritinrivi. Vasemman avoimen pään kaksi pistettä (42,6803 mm toisistaan) toimivat satulaliittymän lähtöpisteinä ja johdetaan lopullisessa mallissa kaulan satulan päistä. Niiden vähäinen x-ero oikaistaan johdetussa geometriassa ja liittymäkahvat sovitetaan kaulan sivuihin. Suljettu laskenta-alue muodostetaan satularajalla; käyttäjän lähdetiedosto säilyy muuttamattomana. Kärkeä tai siluetin rajaavan suorakulmion keskipistettä ei käytetä kaulaan kohdistamisen perustana.

Vapaan siluetin mittasuhteet säilytetään kielimäärän kokokertoimella ja kielijaon tasokierrolla alla kuvatulla säännöllä. Satulaliitos sovitetaan erikseen kaulan todellisiin mittoihin. Uuden kaulan ja M6 Mini -virittimien kelvollisuus tarkistetaan jo määritellyllä ratkaisulla. RG-mallin valokuva ei ole tarkkojen reikien mittojen lähde eikä vaihda valittua viritinprofiilia. Template ei sisällä valmiita viritinreikiä.

Lisätty varmennusnäyttö: lähde-SVG:n rakenne ja mm-mittakaava luettu; polku renderöity ja katsottu; suoran reunan pituus/kulma laskettu ja rajaus luettu SVG-geometriasta. RG421:n virallista etukuvaa katsottu ja sen sekä RG550:n ilmoitettu 43 mm:n satulaleveys tarkistettu valmistajan sivuilta. Tämä oli lähteen ja toteutusta edeltäneen suunnitelman näyttöä 9.9.2026; sovelluksen lapaominaisuus on sittemmin toteutettu v7-nykytilana tämän tiedoston lopussa.


#### HISTORIALLINEN SUUNNITELMA — Kielimäärä, suhteellinen kasvu ja viritinreunan kulma (9.9.2026)

Käyttäjän tarkennus: 6→7/8-kielisessä mallissa suoran viritinsivun lisäksi koko lavan mittasuhteiden pitää kasvaa; satulan kielijako vaikuttaa reunan kulmaan. Alla oleva numeerinen politiikka on paikallinen sijoittelun alustus, ei valmistajan mitoitussääntö tai jo toteutettu toiminto. Se korvaa edellisen vapaan lavan kiinteän fyysisen koon oletuksen. Tämä oli DESIGN READY -suunnitelma ennen toteutusvaltuutusta 9.9.2026; toteutunut rajaus kuvataan tämän tiedoston lopun v7-nykytilaosiossa.

Kasvu: kuusikielisen lapamalli-templaten versionoitu vertailureuna L6=154,285547 mm. Paikallinen lisäpituus Pseed=25 mm yhtä kuuden ylittävää viritintä kohti. N≤6: k=1. N>6: Lseed=L6+(N−6)×Pseed ja k=Lseed/L6. Alkuperäisessä templatessa N7 tuottaa 179,2855 mm ja k=1,16204, N8 204,2855 mm ja k=1,32407. N9–12 käyttää samaa sääntöä; N1–5 ei automaattisesti kutistu. L6 ja Pseed ovat versionoidun politiikan vakioita. Niitä ei lasketa uudelleen käyttäjän muokkaamasta reunasta, jotta yhden noden veto ei käynnistä koko siluetin reskaalauksen takaisinkytkentää. Käyttäjän muuttuneeseen perusmuotoon sovelletaan samaa kerrointa, joten sen reuna voi poiketa lähtötemplaten esimerkkimitoista.

Kulma: rinnakkaisten kielten suorassa ideaalirivissä s=W/(N−1) ja alphaIdeal=asin(s/D), missä W on uloimpien kielten keskipisteiden väli satulalla, ei laudan leveys reunavaroineen. Kun D säilyy, tiheämpi kielijako loiventaa ja harvempi jyrkentää riviä. Kun N kasvaa ja W säilyy, kulma pienenee; jos W kasvaa suhteessa N−1:een, kulma säilyy. N≥6:n kulma-alustuksessa käytetään D=Pseed ja rotationDelta=alphaIdeal−referenceTemplateAngle. Vapaata siluettia kierretään tällä erotuksella tasokuvassa satulan keskireferenssistä. Offset-kalibrointia, joka pakottaisi aloituskulman takaisin SVG:n arvoon, ei lisätä: myös kuusikielinen alkumalli voi sopeutua kaulan mittoihin. N1–5 säilyttää lähdemallin kulman; yhdelle kielelle ei lasketa N−1-jakoa. Nykyinen W≤100 mm pitää N≥6:n asin-argumentin määriteltynä. Poikkeavia arvoja ei clampata kelvollisiksi.

Muoto: vapaille nodeille ja absoluuttisille Bézier-kontrollipisteille tehdään yksi samankaltaisuusmuunnos p_physical=O_current+R(rotationDelta)×k×p_base. Näin vapaan osan suhteet ja suora segmentti säilyvät, mutta sen asento ja koko mukautuvat. Anisotrooppista venytystä tai pelkän viritinsegmentin paikallista kääntöä ei tehdä. Satulan kaksi ankkuria ja liittymän kahvasuunnat johdetaan nykyisestä kaulasta; ensimmäinen ja viimeinen olkasegmentti mukautuvat niihin erikseen.

Kanoninen baseOutline ei muutu N- tai W-parametrin vaihtuessa. Näytössä tehty node- tai kahvamuutos muunnetaan takaisin R(−rotationDelta)×(p_physical−O_current)/k. Koon ja kulman muutoksia ei kumuloida aiempaan näyttögeometriaan. Ilman muotoedittejä 6→8→6 samoihin kaulaparametreihin palauttaa täsmälleen saman baseOutlinen; 8-koossa tehty tietoinen muotoeditti säilyy sen suhteellisena versiona muissa koissa.

Kaulan parametrit ja hardware: stringSpanNut, stringSpanBridge ja overhang eivät muutu automaattisesti Kielet-kentän mukana. Oletuksen W=35,814 mm ja reunavara 3,048 mm/puoli tuottavat 41,91 mm:n satulaleveyden. Satula-ankkurit noudattavat tätä todellista geometriaa. Porausreiät, pylväät, aluslevyt, ruuvialueet, koneistot ja suunnitteluvarat säilyvät fyysisissä millimetreissä; niitä ei suurenneta lavan mukana.

Kelvollisuus: Pseed ei ole Dmin, valmis reikäjako tai mahtumislupaus. AlphaIdeal on rinnakkaiskielisen mallin alustus. Todelliset moniskaalan/kaarevan satulan S_i/B_i-suunnat, pylväiden tangentit ja hardware-tilavaraukset ratkaistaan erikseen. Käyttäjän muokkaamalla perusmuodolla reunan absoluuttinen kulma voi poiketa lähtötemplaten ideaalista; muotoeditit säilytetään. Epäkelpo yhdistelmä jää yhteiseen kaula/lapa-luonnokseen korjattavaksi. Solver ei lisää piilossa kasvua, kiertoa tai paikallista venytystä.

V7-suunnitelman lisätiedot: kuusikielinen baseOutline, templateId/version, referenceStrings=6, referenceTunerEdgeLengthMm=154,285547, referenceTunerEdgeAngleDeg=17,568636 sekä versionoitu seed-/muunnospolitiikka. Snapshot sisältää johdetun shapeScale- ja rotationDelta-arvon sekä fyysisen siluetin ja viritinlayoutin. Parseri johtaa muunnoksen uudelleen ja hylkää ristiriitaisen snapshotin. Pelkkä perusmuoto tai vanha fyysinen outline eivät korvaa näitä tietoja.

Lisätyt hyväksymiskriteerit ja testit: k(1…6)=1, 7/8-esimerkit ja 12-raja; fixed-W vs fixed-s kulmat; N1 ei jakoa; toistuva 6→8→6 sekä N/W-palautus ilman baseOutline-muutosta; 8-koossa tehty node/kahva-editti ja inverssi; muokatun viritinreunan aiheuttaman reskaalauskierteen puuttuminen; alkuperäisen kokoiset hardware-osat ja muuttumattomat nut-parametrit; v7 roundtrip ja manipuloitu muunnossnapshot; kaulamuutoksen, FretFactory-tuonnin, apply/cancel/undo/redo- ja tiedostopolut. Kaikki nämä ovat sovelluksessa vielä toteuttamatta ja testaamatta.

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähtömitat ja kaulaparametrit | lapamalli-template.json; src/neck/fretfactoryGeometry.ts; src/editor/NeckWorkspace.tsx | L6=154,285547 mm; W=35,814 mm; reunavara 3,048 mm/puoli; kentät erillisiä | Kielimäärän, kielijaon ja satulaleveyden ero | 9.9.2026, v6-lähde | Ei toteutettua lapatransformia |
| Kasvu ja kulmakaava | Analyyttinen johdanto ja numeeriset 6/7/8-esimerkit, D=25 mm | N7 k=1,16204; N8 k=1,32407; fixed-W loiventaa, fixed-s säilyttää kulman | Suunnittelupolitiikan alustus | 9.9.2026 | Ei hardware-fit tai fyysinen varmennus |
| Arkkitehtuurin jatkokatselmus | Sama feature_architect, vain luku; pääagentin valinta käyttää suoraa alphaIdeal-alustusta ilman offset-kalibrointia | Ei estävää tuotekysymystä | Yksi perusmuoto, kasvu+tasokierto, inverssi ja v7-luonnospolku | 9.9.2026 | Sovelluksen toteutus ja testit tekemättä |

#### Suoran kielivedon mittaus ja testaus (9.9.2026)

Aiempi headstock-string-count-muotohavainnollistus ei laske reikiä, tangentteja tai kääntymiskulmia. Käyttäjä kysyi, miten mahdollisimman suora kieliveto todennetaan ja onko se huomioitu. Tavoite ja tangenttiehto olivat jo suunnitelmassa. Nykyinen keskustelun kasvu-/kulmahavainnollistus ei kuitenkaan sijoita virittimiä, laske kielikohtaisia tangentteja tai mittaa kääntymiskulmia. Sen onnistunut ulkoasu ei ole näyttöä suorasta kielivedosta.

Mittari: kielikohtaiset B_i ja S_i ovat todelliset tallan ja satulan kontaktipisteet. u_i=normalize(S_i−B_i) on satulaan tulevan kielen jatkosuunta. Oman pylvään valitun käämintäpuolen tangenttipisteestä T_i saadaan v_i=normalize(T_i−S_i). Poikkeama theta_i=abs(atan2(cross(u_i,v_i),dot(u_i,v_i))) asteina. Nolla tarkoittaa samaa suuntaa tasokuvassa. T_i on oltava satulan lavanpuolella; väärää tangenttihaaraa tai taaksepäin kulkevaa jännettä ei saa hyväksyä pienimmän kulman vuoksi. Porausreiän keskipistettä ei käytetä kielikontaktina.

Testiesikatselun suunnitelma: piirretään kielikohtainen ideaalijatke satulalta katkoviivana sekä todellinen jänne satulalta oman pylvään tangenttipisteeseen. Näytetään valitun kielen poikkeama asteina, koko ratkaisun suurin poikkeama ja sen kielen tunniste. Reunaetäisyydet ja hardware-ristiriidat pysyvät erillisinä kelpoisuustietoina. Mitään lähteetöntä vihreä/punainen-kulmarajaa tai fysikaalista viritysvakausluokitusta ei lisätä.

Optimoinnin ja sen laadun hyväksymiskriteerit:

1. Ensin jokaisen sijoittelun tulee täyttää profiilin reuna-, hardware-, tangentti- ja risteämättömyysehdot. Hylättyä sijoittelua ei verrata kelvolliseen paremman kulman perusteella.
2. Kelvollisista ratkaisuista minimoidaan ensin max(theta_i), sitten kulmien summa, ja vasta sen jälkeen tavoitevälien ja edellisen sijoittelun poikkeamat. Yksi voimakkaasti kääntyvä kieli ei saa piiloutua keskiarvoon.
3. Rakennetussa kelvollisessa nollapoikkeaman esimerkissä sijoittelijan on löydettävä nolla laskentatoleranssin tarkkuudella. Nolla on tällöin myös todistettu alaraja. Tätä ei yleistetä kaikkiin käyttäjän muotoihin.
4. Varmennetaan 6/7/8-kieliset tapaukset samalla W:llä ja samalla viereisellä kielivälillä, todelliset oletuskaulan suunnat, moniskaala/kaareva satula sekä liian pieni tai muodoltaan mahdoton lapa. Väärä käämintäpuoli, keskelle pylvästä piirretty jänne ja muihin pylväisiin osuvat jänteet ovat erillisiä virhetapauksia.
5. Verrataan lopullista sijoittelua lähtösijoitteluun ja useista deterministisistä aloituksista saatuun tulokseen. Rajatussa pienessä vertailuongelmassa käytetään lisäksi tiheää riippumatonta hakua tai analyyttistä tunnettua ratkaisua. Heuristisen haun tulosta kutsutaan parhaaksi löydetyksi ratkaisuksi; sen globaalia optimaalisuutta ei väitetä ilman alarajaa tai muuta näyttöä.

Ensimmäiset mittarin vertailulaskut on tehty erillisinä analyyttisinä esimerkkeinä, ei nykyisen lapamallin sijoitteluratkaisuna. Satula S=(0,0), tuleva suunta (1,0), pylvään säde 3 mm: C=(100,3) antaa 0 astetta; C=(100,0) antaa noin 1,71913 astetta, vaikka keskelle piirretty viiva näyttäisi nollaa; C=(100,5) antaa noin 1,14542 astetta. Tangenttipisteen säde ja kohtisuoruus tarkistettiin, ja kulmaa verrattiin riippumattomaan suljetun muodon vertailulaskuun.

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Historiallisen kuvan laajuus | headstock-string-count.html luettu | Ei reikäpaikkoja, tangentteja tai theta-mittaria | Kuva oli alustuksen havainnollistus, ei suoran vedon testi | 9.9.2026 | Historiallinen keskusteluhavainnollistus |
| Mittarin analyyttiset vertailut | node tmp/headstock-straightness-check.mjs; reference-analysis/headstock-straightness-checks.json | 3/3 PASS; säde, tangenttikohtisuoruus, suunta ja odotettu kulma | Ero pylvään keskuksen ja todellisen tangenttipisteen välillä | 9.9.2026 | Vain esimerkkien mittausmatematiikka |
| Varsinainen sijoittelu | Ei toteutettua sijoittelijaa tai valmista hardware-profiilia | EI VARMENNETTU | Lapamallin todellinen kieliveto, mahtuminen ja haun laatu | 9.9.2026 | Tulevan toteutuksen testit tarvitaan |

Tämä täsmentää suunnitelman hyväksymiskriteerejä. Sovellusta tai aiempaa keskustelukuvaa ei muutettu. Fyysistä valmistusta tai viritysvakautta ei testattu.

## FEATURE BRIEF — Lavan kielivedon testiesikatselu, ensimmäinen toteutusvaihe (9.9.2026)

Tila: TOTEUTETTU JA VARMENNETTU geometriakokeena ja erillisenä keskustelun testiesikatseluna. Sovelluksen v6-lähde, käyttöliittymä ja formaatti eivät muuttuneet; tätä ei kuvata tuotanto-ominaisuutena.

### Tavoite

Toimiva, mitattu testiesikatselu, jossa käyttäjä vertaa 6/7/8-kielisen lapamallin kokoa, kielijakoa, todellisia viritinpylväitä ja kielten satulalla kääntymistä. Tulos sisältää deterministisen sijoittelun, ideaalijatkeet, tangenttijänteet, kielikohtaiset kulmat ja varmennuksen rajat.

### Ei-tavoitteet

Ei muutoksia tuotantosovelluksen src-alueeseen, v6-formaattiin, tallennukseen, käyttöliittymään, riippuvuuksiin, portteihin tai FretFactoryyn/vendor-alueeseen. Ei vielä täyttä M6-koneiston, ruuvin, nupin, puuvaran tai käyttötilan varmennusta. Ei valmistusvientiä, Z-akselia tai fyysistä valmistuskoetta.

### Käyttäjän vahvistamat päätökset

Lapamalli.svg on oletussiluetti, virittimet yhdellä viistolla suoralla reunalla, M6 Mini lähtöprofiili. Kielimäärä kasvattaa koko vapaata lapaa ja kielijako vaikuttaa kulmaan. Muoto ohjaa reikäsovitusta. Käyttäjä hyväksyi viimeksi suoran kielivedon testisuunnitelman ja pyysi jatkamaan siitä.

### Sallitut paikalliset oletukset

Lapa muunnetaan aiemmin kuvatulla tasaisella kasvulla ja tasokierrolla; Pseed=25 mm on alustus. Post r=3 mm, nimellinen poraus r=5 mm, aluslevy r=7,25 mm. Aluslevyt eivät saa leikata toisiaan tai lavan reunaa numeerinen geometriaepävarmuus huomioiden. Täydelle koneistolle ei keksitä hyväksyntävaippaa. Kätisyyteen sidottu oikea tangenttihaara ei ole vielä yksilöity M6-mallille: koe laskee ja nimeää molemmat haarat ja pitää niiden valinnan näkyvänä, eikä optimoi vaihtamalla haaraa salaa.

### Käyttäytymispolut

12 kaulaskenaariota: N=6/7/8 × sama uloimpien kielten väli / sama viereisten kielten väli × tasamensuuri / nimetty moniskaala ja kaareva satula. Fixed-total käyttää nut=35,814 ja bridge=49,784 mm; fixed-gap kasvattaa molemmat spanit suhteessa (N−1)/5. Oletus on 647,7/647,7 mm; paikallinen moniskaalaesimerkki 647,7/673,1 mm, anchorFret=7, curvedExponent=1,6. Nämä ovat kokeen nimetyt vaihtoehdot, eivät automaattinen sovellusmuutos.

Lue todelliset kontaktit nykyisestä pinnatusta calculateNeck-adapterista. Satulan reunapisteet erotetaan kielipisteistä. Transformoi lähdesiluetti, johda satula-ankkurit ja G1-liitos todellisesta kaulasta. Sijoita suora pylväsrivi reunan suuntaisesti; etsi globaalia normaali-/pituussiirtoa ja kielikohtaisia rajattuja 1D-paikkoja rivillä. Laske kummallekin nimetylle tangenttihaaralle ideaalijatkeet, todelliset jänteet, kulmat ja geometrinen kelpoisuus. Näytä lähtöehdotus ja löydetty ratkaisu vertailtavina.

Ristiriitainen tapaus näyttää syyn sekä ehdotuksen virheellisenä, eikä muuta sitä näennäiseksi onnistumiseksi. Yksi tunnettu nollakulman synteettinen vertailu ja yksi tarkoituksella liian pieni lapa kuuluvat varmennukseen. Normaali esikatselu näyttää vain geometrisesti tarkistetun osatason tilan sekä erikseen täyden koneiston tilan: todentamatta.

### Muutettavat vastuualueet tai tiedostot

scripts/headstock-lab/ omistaa toistettavan tutkimuslaskennan, generoinnin ja rajatut testit. reference-analysis/headstock-lab-results.json sisältää näyttöä ja tuloksia. Keskustelun testiesikatselu tallennetaan sallittuun threadin visualization-kansioon nimellä headstock-straightness-lab.html. Tmp on vain testilokeille ja selainkuville. FEATURE_BRIEF ja headstock-tuners.md synkronoidaan toteutuneeseen koetulokseen; sovelluksen README ei muutu tästä kokeesta.

### Säilytettävät rajat

Kaikki fyysiset mitat ovat millimetrejä. Posti/poraus/aluslevy eivät skaalaudu lavan mukana. Sama kieli säilyttää indeksinsä, eivätkä kielet risteä tai osu muihin pylväisiin. Source-SVG ja src/vendor pysyvät muuttumattomina. Sovellusbaseline: tmp/headstock-lab-source-baseline.json, 56 src/config-tiedostoa.

### Tietomalli- ja rajapintamuutokset

Vain tutkimustulos: tarkat inputit ja vendor/source-hashit, transformi, S/B/C/T per kieli, tangenttihaara ja kulma, min post pitch, reuna-/levy-/tangenttiresiduaalit, lähtö- ja loppuobjective, hakurajat, geometrinen ja aluslevytason status. fullM6FitStatus säilyy unverified. Ei projektiformaatin muutosta. Selain käyttää samaa laskentaa tai siitä generoituja tuloksia; selaimessa ei ylläpidetä erillistä käsin uudelleen kirjoitettua kieligeometriaa.

### Toteutusjärjestys

Worker toteuttaa laskennan, rajoitetun sijoittelun, regressiot ja fragmentin. Pääagentti tarkistaa tulokset, sitten riippumaton QA tarkistaa geometria- ja selainnäytön. Dokumentit päivitetään vasta tämän jälkeen. Yksi seurattujen tiedostojen kirjoittaja kerrallaan. Esbuildillä nykyisen adapterin voi bundlata vain muistissa tai väliaikaiseen lab-buildiin; mitään riippuvuutta ei asenneta tai vendor-lähdettä muuteta.

### Hyväksymiskriteerit

Kaikki 12 skenaariota ja molemmat nimetyt haarat on laskettu; jokaisen hyväksytyn ratkaisun post/order/crossing/tangentti- ja aluslevyrajat tarkistetaan. S/B on nykyisen adapterin dataa. Inputit, hashit, haku ja tulos toistuvat identtisellä ajolla. Kaavojen kasvu/kulma ja satula-ankkurit täsmäävät. Tunnettu 0°-vertailu läpäisee, ja mahdoton tapaus antaa ymmärrettävän virheen.

Objektiivi säilyy aiemman briefin mukaisena: ensin suurin kääntymiskulma, sitten kulmien summa, vasta sen jälkeen seed-välin ja sijoittelun poikkeamat. Verrataan erilliseen tiheään rajattuun vertailuhakuun; sen hakuluokka ja rajoitukset kirjataan. Etsintä ei saa olla vertailuhaun parasta huonompi ilmoitettua numeerista toleranssia enempää. Heuristista tulosta ei kutsuta globaalisti optimaaliseksi. Jos vertailu kattaa vain esimerkiksi tasajaollisten rivien alijoukon, se sanotaan erikseen eikä esitetä vapaamman haun globaalina todisteena.

Käyttäjä voi vaihtaa kielimäärää, span-vaihtoehtoa, kaulatyyppiä, tangenttihaaraa ja tarkasteltavaa kieltä; näkee ideaalijatkeen, tangenttijänteen, post/poraus/aluslevy-erot ja valitun/suurimman kulman. Muoto ei saa leikata pois pieniä poikkeamia tai nuppien paikkojen epävarmuutta piilottamalla statusta. Kuvan ja luvun on perustuttava samaan tulokseen.

### Testit ja muut varmennustasot

node --test scripts/headstock-lab/lab.test.mjs PASS 10/10 (22,066 s); selaincheck node scripts/headstock-lab/browser-check.mjs tmp/headstock-lab-preview.html PASS 4/4 matriisia ja 96 skenaariovalintaa. Mukana 12 skenaariota x 2 tangenttihaaraa, invariantit, 0-oracle, negatiiviset/order/crossing/posthit/nearparallel, determinismi ja DenseReference vain tasajaollisen rivin alijoukolle. Ensimmäinen 8/9-ajo ja 7/9-väliajo ovat historiallista korjausnäyttöä.

Testiesikatselu varmennettiin Edgellä koossa 736 ja 390, vaaleana ja tummana: 4/4 matriisia, 96 skenaariovalintaa, console errors 0 ja overflow 0. Pääagentti katsoi 736 light/dark ja 390 light -kuvat ilman layout-ongelmia. Tämä on paikallista selain- ja laskentanäyttöä, ei tuotantosovelluksen, fyysisen virittimen tai valmistuksen varmennusta.

### Dokumentaatiovaikutukset

FEATURE_BRIEFin ledger ja reference-analysis/headstock-tuners.md kuvaavat toteutuneen laboratoriokokeen sekä tulos-JSONin. Aiempi väite siitä, ettei nykyinen kuva laske, koskee historiallista headstock-string-count-kuvaa. Uusi koe ei tee app v7:ää valmiiksi.

### Riskit

Täysi M6-koneiston vaatima tila ja kätisyys eivät vielä ole todennettuja. Pienet kulmat voivat peittyä kuvan mittakaavaan; numerot ovat ensisijainen mittari. Rajattu solver voi jättää mahdollisen ratkaisun löytämättä. Kaarevan satulan keskireferenssi ja koordinaatiston kierto on johdettava oikein; lähdesiluetin pikselikeskitys ei riitä.

### Ratkaisematta jääneet asiat

Ei tämän kokeen toteutusta estäviä käyttäjäpäätöksiä. M6-kätisyyden ja koko koneiston ankkurointi jäävät täyden sovellusominaisuuden geometriavaiheeseen ja näkyvät kokeessa todentamattomina.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Voimassa käyttäjän pyynnöllä: Hyvä suunnitelma. Jatka tästä. Toteutettava ensimmäinen polku on juuri keskusteltu suorien kielivetojen testiesikatselu ja varmennus. Ei Git-, julkaisu- tai deploy-toimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — Lavan kielivedon testiesikatselu

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Laskenta ja regressiot | node --test scripts/headstock-lab/lab.test.mjs; tmp/headstock-lab-tests-final.txt | 10/10 PASS, 22,066 s | 12 skenaariota, 24 haaraa, invariantit, 0-oracle, determinismi | 9.9.2026, Generate3-aineisto | Laboratoriogeometria |
| Sijoittelutulos | reference-analysis/headstock-lab-results.json | 24/24 valid=true; 18 maxangle < 1e−8°; fixed-gap 6/7/8 nolla | Solverin rajatut geometria- ja aluslevyrajat | 9.9.2026 | Ei täyden M6-fitin tai globaalin optimin todiste |
| Selain ja kuvat | node scripts/headstock-lab/browser-check.mjs tmp/headstock-lab-preview.html; tmp/headstock-lab-browser-results.json ja 4 PNG | 4/4 matriisia; 96 valintaa toiminnallisessa ajossa; layout-only 4/4, errors 0, overflow 0, SVG-labelit 12 px | Kontrollit, numerot, virhe/recovery ja layout | 9.9.2026 | Paikallinen selain, ei Safari/fyysinen/julkaistu |
| Layout-only selain | node scripts/headstock-lab/browser-check.mjs tmp/headstock-lab-preview.html --layout-only; tmp/headstock-lab-browser-layout-results.json | 4/4, scenarios 0, errors 0, overflow 0, SVG-labelit 12 px | Lopullinen layout 736/390 light/dark | 9.9.2026 | Paikallinen selain, ei 96 tapauksen uusinta |
| Rajaus ja hashit | tmp/headstock-lab-source-baseline.json; 56 SHA256 | v6-sovellus ja config/source-baseline muuttumattomat | Koe on erillinen tuotantosovelluksesta | 9.9.2026 | Voimassa tähän hash-tilaan |
| Fyysinen valmistus | Ei artefaktia tai laitekoetta | EI VARMENNETTU | Ei fyysisen sopivuuden tai valmistuskelpoisuuden väitettä | 9.9.2026 | Ei kuulu kokeeseen |



### Jatkosuunnittelun vaatimus — 7- ja 8-kielisten kielijaon rajat (9.9.2026)

Kieliväliraportti [string-spacing-limits.md](reference-analysis/string-spacing-limits.md), joka laadittiin käyttäjän tutkimuspyynnön perusteella, määrittää paikallisen tasajaollisen suunnittelualueen seuraavasti. Rajat eivät ole yleisstandardi, eivätkä ne ole vielä sovelluksen validointia.

| Kielimäärä | Satulan viereinen jako | Tallan viereinen jako | Uloimpien kielten väli satulalla | Uloimpien kielten väli tallalla |
| --- | --- | --- | --- | --- |
| 7 | 6,5–7,5 mm | 10,0–11,0 mm | 39,0–45,0 mm | 60,0–66,0 mm |
| 8 | 6,5–7,5 mm | 10,0–11,0 mm | 45,5–52,5 mm | 70,0–77,0 mm |

Jako tarkoittaa kielten keskilinjojen poikittaista väliä. Tasajaollisessa mallissa uloimpien kielten kokonaisväli on W=(N−1)×s. Satulan ja tallan jaot käsitellään erikseen. Rajojen molemmat päätepisteet ovat sallittuja. Kaulan sivureunavarat lisätään kokonaisväliin erikseen, eivätkä ne sisälly taulukon lukuihin. Tiukka 0°-kieliveto, sama pylväiden reunaetäisyys ja tasavälinen viritinrivi on ratkaistava yhdessä; kielijakoalueen läpäisy ei itsessään takaa niiden yhteensopivuutta. Moniskaalan ja kaarevan satulan geometria vaatii oman projektionsa; nämä rajat eivät tee siitä automaattisesti tasajaollista.

Rajat ovat seuraavan suunnitteluvaiheen tuettu paikallinen alue. Alueen ulkopuolinen instrumentti ei ole tämän tutkimuksen perusteella mahdoton. Sovellukseen ei lisätty validointia, lavan sijoittelua, nollakulman ratkaisua tai valmistustodistetta. Aiemmat suoruus-, equal-offset- ja equal-pitch-yhteensopivuusvaraukset säilyvät erillisinä ehtoina. Kielimäärän tai jaon muutos ei muuta satula- tai tallakontakteja piilossa, eikä vanhaa kokonaisväliä puristeta huomaamatta.

Ennen lavan sijoittelun hyväksymistä tarkistetaan satulan ja tallan jako erikseen; virittimien mahtuminen tai pieni kulmapoikkeama ei hyväksy rajat ylittävää jakoa. Lavan pituus johdetaan vasta sallitun kaulan ja yhteensopivan viritinsijoittelun perusteella, eikä riittävän pitkä lapa tee kiellettyä jakoa sallituksi.

Seuraaviin hyväksymiskokeisiin kuuluvat molempien kielimäärien satula- ja tallajaon alarajat, ylärajat ja juuri rajojen ulkopuoliset arvot, kokonaisvälin muunnos, kaulaparametrien muuttumattomuus sijoittelussa sekä riittävän pitkän lavan ja kielletyn kielijaon ristiriita. Nämä ovat tulevan toteutuksen kokeita; niitä ei ole tässä toteutettu.

### VERIFICATION LEDGER — Kielijaon tutkimus

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähteet ja tutkimus | reference-analysis/string-spacing-limits.md; lähdeluenta; Hipshot-PDF:n pääagentin kuvakatselmus; Floyd-PDF:n arkkitehdin lähdeluenta | Tutkittu | Päätöksen vertailulähteet ja mittaerot | 9.9.2026 | Tutkimusnäyttö, ei sovellusvalidointi |
| Laskentatarkistus | node tmp/verify-string-spacing.mjs; tmp/string-spacing-verification.json | 19 laskua + 2 raporttitaulukkoa PASS | Muunnokset, rajat ja johdetut spanit | 9.9.2026 | Tutkimusaritmetiikka |
| Sovellusbaseline | Sama ajo; 56 source/config SHA256 | Ennallaan | Appin ja configin muuttumattomuus | 9.9.2026 | Ei UI- tai uutta validointinäyttöä |
| Toteutus ja valmistus | Ei sovellusmuutosta, lab-validointia tai valmistuskoetta | EI VARMENNETTU | Rajat eivät todista lavaratkaisua tai valmistusta | 9.9.2026 | Toteutukseen asti avoin |


## FEATURE BRIEF — Lavan tiukka kolmen ehdon toteutunut tutkimuskoe (9.9.2026)

Suunnittelu: DESIGN READY. Tila: TOTEUTETTU JA VARMENNETTU tutkimuskokeena. Tämä ei ole tuotantosovelluksen, v7-formaatin, UI:n, vendorin tai valmistuksen toteutus.

### Tavoite

Testata täsmällisesti, löytyykö 6-, 7- ja 8-kielisten tallennetuista kaulaskenaarioista sijoittelu, jossa suora kieliveto, suora tasavälinen pylväsrivi ja yhteinen reunaetäisyys ovat kaikki pakollisia.

### Ei-tavoitteet

Ei jatkuvan parametrialueen teoreemaa, käytännön soitettavuuden tai minimikulman todistusta, täyttä M6-fit-arviota, tuotanto-UI:ta, formaattimuutosta, valmistusvientiä tai fyysistä koetta. Numeerinen SVD on vain diagnostiikkaa.

### Käyttäjän vahvistamat päätökset

Käyttäjä vaati kaikkien kolmen geometriaehdon testaamista samanaikaisesti. Tutkimus kattaa paikallisena oletuksena molemmat yhteiset käämintäpuolet; satula- tai tallakontakteja ei siirretä kokeen ratkaisemiseksi.

### Sallitut paikalliset oletukset

39 varsinaista kaulaskenaariota: 6-kielisiä 3, 7-kielisiä 18 ja 8-kielisiä 18. Pylvään säde on 3 mm; kielten paksuutta ja käämintäkerroksia ei mallinneta. Koordinaatit tulkitaan tallennettuina binary64-arvoina ja muunnetaan tarkkaan Fraction-laskentaan.

### Käyttäytymispolut

Molemmat yhteiset sigma-haarat tuottavat 78 tapausta. Jokaiselle johdetaan exact Fraction -vasemman nollatilan todistus ja 80 desimaalin rationaalinen neliöjuuriväli. Jos wᵀb-väli sulkee nollan pois, tulos on EXACT_LINEAR_INFEASIBLE_CERTIFIED. Kolme rinnakkaista positiivista kontrollia ajetaan molemmilla haaroilla; epätasainen negatiivinen kontrolli hylätään.

### Muutettavat vastuualueet tai tiedostot

scripts/headstock-strict/ tuottaa ja analysoi tutkimusaineiston. reference-analysis/headstock-strict-inputs.json, headstock-strict-results.json ja headstock-strict-feasibility.md sisältävät näytön. Sovelluslähteitä ei muutettu.

### Säilytettävät rajat

FretFactory-vendor, GTRfactory v6, projektiformaatti, UI, config ja source-baseline säilyvät muuttumattomina. Täsmällinen sertifikaatti koskee vain ilmoitettuja tallennettuja tapauksia; se ei ole jatkuvan alueen tai fyysisen valmistuksen väite.

### Tietomalli- ja rajapintamuutokset

Ei tuotantotietomallin tai rajapinnan muutoksia. Tutkimustulos säilyttää exact-rational-rankin, Fraction-todistajan, sqrt-intervalin, SVD-diagnostiikan ja fyysisen kontrollin statuksen.

### Toteutusjärjestys

Root toteutti aineiston viennin, analyysin ja testin. Arkkitehti teki riippumattoman 180-digit Decimal + Fraction -matematiikka-auditin. Erillistä qa_verifier-roolin ajoa ei tehty; riippumaton näyttö on arkkitehdin matematiikka-auditointi.

### Hyväksymiskriteerit

Jokainen haara saa joko tarkasti varmennetun toimivan ratkaisun, epäyhteensopivuustodistuksen tai ratkaisemattoman tilan perusteluineen. Positiivisen kontrollin on läpäistävä ja negatiivisen hylkäännyttävä. Hakualgoritmin epäonnistumista tai yhtä huonoa pieninormiratkaisua ei saa kutsua mahdottomuustodisteeksi. Toteutunut tulos: kaikki 78 varsinaista haaraa ja kaksi negatiivista kontrollia saivat todistuksen; kuusi positiivista kontrollia sai EXACT_PHYSICAL_SOLUTION-statuksen. Vain näiden 80 hylkäystodistuksen wᵀb-väli sulkee nollan pois. Pienet alarajat 5,193e−10–1,92146e−7 mm eivät ole valmistusvirhe- tai kulmaraja.

### Testit ja muut varmennustasot

Rootin testi 7/7 PASS (0,250 s), arkkitehdin riippumaton testi 7/7 PASS (0,243 s) ja baseline-polun korjauksen jälkeinen rootin testi 7/7 PASS (0,252 s), loki tmp/headstock-strict-tests-final.txt. 56 app/config SHA256-hashia säilyivät ennallaan. Ei UI-, selain-, julkaisu-, fyysisen laitteen tai valmistusartefaktin varmennusta.

### Dokumentaatiovaikutukset

Tämä osio ja reference-analysis/headstock-strict-feasibility.md kuvaavat kokeen toteutuneen näytön. Aiempi rajattu headstock-lab säilyy omana kokeenaan; sen tuloksia ei yhdistetä tähän täsmälliseen sertifikaattiin. Raportin Python-ohje käyttää Windowsin eksplisiittistä runtimea; skriptit eivät sisällä hostipolkua.

### Riskit

Sertifikaatti koskee diskreettejä tallennettuja tapauksia ja täsmällisiä yhtäläisyyksiä. SVD:n pieninormiratkaisu ei kuvaa koko fyysistä ratkaisuperhettä. Positiivinen kontrolli todistaa vain erillisen ideaalisen osatason ratkaisun, ei täyttä M6-sopivuutta.

### Ratkaisematta jääneet asiat

Jatkuvan alueen kattavuus, sallittava poikkeama tai ehdon vapauttaminen, täysi M6-koneisto, käytännön soitettavuus ja valmistuskelpoisuus ovat avoinna.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

Käyttäjä valtuutti kokeen kaikkien kolmen ehdon pakollisuudesta. Ei commit-, julkaisu- tai deploy-toimia. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — Lavan tiukka kolmen ehdon koe

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Varsinainen strict-testi | & $strictPython -B scripts/headstock-strict/test_strict.py; runtime raportissa; tmp/headstock-strict-tests-final.txt | Ensimmäinen 7/7 (0,250 s), riippumaton 7/7 (0,243 s), polkukorjauksen jälkeen 7/7 (0,252 s) | 78 tapausta, 6 positive controlia, 2 negative controlia ja täsmälliset todistukset | 9.9.2026 | Tutkimuslaskenta |
| Riippumaton matematiikka-audit | 180-digit Decimal + Fraction, architect read-only | PASS: 80 sertifikaattia ja 6 positive controlia | Exact-statusten riippumaton vahvistus | 9.9.2026 | Ei qa_verifier-ajo |
| Tulosaineisto | reference-analysis/headstock-strict-results.json | 78 infeasible certified; 6 physical solution; 2 negative certified | Statusjakauma ja residualit | 9.9.2026 | 39 tallennettua skenaariota |
| Lähteet ja inputit | headstock-strict-inputs.json; headstock-strict-feasibility.md | Syötteet ja lähdehashit kirjattu | Käytetty kaulageometria ja menetelmä | 9.9.2026 | Näytteen rajaus |
| App-baseline | reference-analysis/headstock-strict-app-baseline.json; 56 SHA256 | Ennallaan | Ei sovellus-/config-muutosta | 9.9.2026 | Vain tähän hash-tilaan |
| Fyysinen/UI-taso | Ei app-UI-, valmistus- tai laitekoetta | EI VARMENNETTU | Strict-tulos ei todista näitä tasoja | 9.9.2026 | Ei kuulu kokeeseen |

## HISTORIALLINEN TOTEUTETTU NYKYTILA — Lapa kaulan yhteydessä (v7, 10.9.2026)

Tila: TOTEUTETTU JA VARMENNETTU v7-vaiheena 10.9.2026. Tämä päivätty osio on historiallinen; v8-nykytila ja sen ledger ovat tämän tiedoston lopussa. Historialliset tutkimukset eivät muutu sovellusnäytöksi.

### Tavoite
Oletuslapa näkyy Etu-kuvassa satulan jatkeena. Sen valinta lähentää samaa piirtoaluetta ja avaa vapaan siluetin node- ja kahvamuokkauksen nykyisillä kontekstityökaluilla. Sovita palauttaa koko kitaran.

### Ei-tavoitteet
Ei erillistä lapasivua tai osanavigointipainikkeita, uutta headstock-lomakeluonnosta, vapaasti editoitavaa viritinriviä, globaalia kielivetojen optimointia, valmistusvientiä, migraatiota, Z-akselia tai muutoksia FretFactoryyn/vendor-alueeseen.

### Käyttäjän vahvistamat päätökset
Käyttäjän seitsemänkielinen SVG on tasajaon ja muodon referenssi; 8-kielinen johdetaan siitä yhden reikävälityksen lisäyksellä. M6 Mini pienellä metallinupilla, virittimet yhdellä suoralla reunalla, vakio reunaetäisyys ja tasajako. Muotoa saa rajoittaa virittimien kohdalla. Kaulan ja tallan mittoja ei muuteta lapatuloksen kaunistamiseksi. Vanhojen projektiversioiden tukea ei tarvita.

### Sallitut paikalliset oletukset
Rajattu lapatuki 6/7/8 kielelle. Käytetään viimeksi varmennetun referenssin p=23,659459422 mm, h=12,999420166 mm ja päätyvaroja 15,356555724 / 17,661135847 mm. Kuusikielinen johdetaan samalla säännöllä; pääagentin probe varmisti todelliset oletusmitat (E–E 35,814 mm ja laudan leveys 41,910 mm) sekä M6-tilavarauksen. Lavan perusmuoto säilytetään kanonisessa referenssikoordinaatistossa ja näytön muunnos lasketaan aina tästä, ei kumuloida. Kulman jatkokehitys/optimointi ei sisälly tähän; käytetty tasajakoinen referenssi ei takaa nollakulmaa. Käyttöliittymä kertoo lasketun suurimman satulakulman rehellisesti ilman keksittyä hyväksyntärajaa.

### Käyttäytymispolut
1. Uusi projekti näyttää nykyisen 25,5 tuuman / 22 nauhan / 6 kielen kaulan ja siihen kuuluvan lavan, reiät oikeassa millimetrikoossa. Etukuvan sovitus sisältää koko lavan. Taka ja Tasku säilyvät ennallaan.
2. Avattu kaulaluonnos hyväksytään tai perutaan ennen lavan valintaa; sen automaattinen sulkeminen estettiin hyväksyntätarkistuksessa mahdollisen keskeneräisen syötteen menettämisen vuoksi. Lavan klikkaus, kosketus tai Enter/Space valitsee muokkauskohteen ja sovittaa lavan suureen Etu-kuvaan. Pelkkä valinta/kamera ei muuta dokumenttia tai undo-historiaa. Pikkukuva valitsee edelleen näkymän.
3. Satulan kaksi liittymäpäätä ja niiden jatkuvuuden vaatimat kahvat sekä viritinreunan molemmat päät/segmentti/kahvat ovat lukittuja. Kärjen ja vastakkaisen sivun vapaita nodeja/kahvoja voidaan siirtää. Ensiversion lavatyökalut ovat vapaiden nodejen siirto, koordinaatit ja kahvojen veto. Topologian lisäys/poisto, solmutyypin vaihto ja segmenttityypin vaihto jäävät lavassa myöhemmäksi; rungon työkalut säilyvät. Suojattua geometriaa ei saa kiertää muiden työkalujen kautta.
4. Yksi kelvollinen veto tai työkalutoimi on yksi undo-askel. Escape, pointercancel, blur ja näkymän vaihto peruuttavat keskeneräisen vedon. Kelvoton muutos ei korvaa viimeistä kelvollista muotoa; syy näytetään. Sovita poistuu lavan lähennyksestä; runko/kaula/pickup-työkalujen nykyiset polut säilyvät.
5. Satulaliittymä seuraa oikeita laudan reunapisteitä ja sivujen jatkosuuntaa. Kaulan mittojen muuttaminen nykyisessä neckDraftissa säilyttää käyttäjän lavan perusmuodon. 6→8→6 palauttaa muodon samoilla kaulaparametreilla ilman kumuloituvaa skaalausta. Undo/redo sekä tallennus/avaus säilyttävät kaulan ja siihen kuuluvan lavan yhdessä.
6. Nykyinen 1–12-kielinen kaulaeditori ja sen tuonti säilyvät. Lapatukea vailla olevasta kielimäärästä kerrotaan selkeästi eikä kaulamuutosta estetä sen vuoksi. Tuetun kielimäärän fyysisesti ristiriitainen lapa/kaulayhdistelmä ilmoitetaan nykyisessä neckDraftissa korjattavana virheenä; hyväksyttyä kaulaa tai käyttäjän muotoa ei korvata hiljaisesti. Lapatiedot säilyvät paluuta varten. Ei virheellistä M6-mahtuvuusväitettä. Kaulaton dokumentti pysyy kaulattomana; visuaalinen kaulatemplate/lapa otetaan käyttöön vain nykyisen kaulaluonnoksen hyväksynnällä.

### Muutettavat vastuualueet tai tiedostot
src/headstock/ (pieni versionoitu template, muunnokset, suojaukset, tangentit, M6-tilavaraukset ja validointi); model/project.ts ja file/projectFile.ts (v7); store.ts (muokkauskohde ja yhteiset transaktiot); App.tsx, EditorCanvas.tsx, ContextTools.tsx, NumericCoordinate.tsx, neckView.ts ja rajattu CSS. Vastaavat yksikkö-/integraatio-/E2E-testit. Ei lähde-SVG/PDF:n tai suurten tutkimus-JSONien bundlausta.

### Säilytettävät rajat
Kanoninen millimetrigeometria, kiinteä rungon keskinode, nykyinen kaulatasku/päätyvara/pickup-logiikka, satula- ja tallakontaktit, saman kielen indeksit ja yksi tangenttihaara. Virittimen reiät ja osat eivät skaalaudu siluetin mukana. Kaulasuunnittelun nykyinen pending/save/undo-suoja säilyy.

### Tietomalli- ja rajapintamuutokset
Projektiformaatti v7 ja versionoitu kaulaan kuuluva lavan perusmuoto. V1–v6 hylätään ennen työn korvaamista, ei migraatiota. Luku validoi rakenteen, äärelliset koordinaatit, tunnisteet, käyrät, tekniset kokorajat, lukittujen osien muuttumattomuuden sekä tuettujen kielimäärien johdetun hard-geometrian. Kamera ja valintatila eivät ole projektitietoa. Koneistosovituksen tila johdetaan nykyisestä kaulasta/muodosta, sitä ei lueta luotettuna tallennettuna väitteenä.

### Toteutusjärjestys
Geometria ja 6/7/8-oraclet → v7 ja store/transaktiot → Etu-piirto, valinta, lähennys ja node-työkalut → relevantit regressiot ja tuore build → riippumaton QA ja selaintarkistus → nykytiladokumentit.

### Hyväksymiskriteerit
Kaikki yllä olevat käyttäytymispolut toimivat. Suljettu siluetti ei leikkaa itseään tai sisällä degeneraatiota. Bore/aluslevy/koneistorunko/korvake ovat puun sisällä, nupin pyörimisalue puun ulkopuolella, eri koneistojen tilavaraukset eivät leikkaa. Käyrävarmennus ei perustu vain nodejen sijaintiin. Kielijänteet ovat pylvään tangentteja eivätkä leikkaa muita pylväitä/kieliä; kulmapoikkeama näkyy. Liittymät ja viritinreuna säilyvät kaikissa editointipoluissa. Oletus6 sekä kalibroidut7/8 mahtuvat; mahdoton vapaa muoto hylätään. Raja-arvoista ei johdeta fyysisen valmistuksen takuuta.

### Testit ja muut varmennustasot
Geometrian 6/7/8 tunnetut tulokset, vakio pitch/offset/halkaisijat, saumapisteet ja tangentit, kielipisteiden muuttumattomuus, negatiiviset hardware/self-intersection-tapaukset; store dirty/undo/redo/cancel/target/view/new/open, kaulanmuutos ja 6→8→6; v7 roundtrip ja v6/virheellisen rakenteen atominen hylkäys. E2E oletusnäkymä, hiiri/näppäimistö/kosketus, lähennys/Sovita, sallitut ja suojatut editit sekä tallennus/avaus. Projektin komennot peräkkäin: npm run typecheck, npm run test:run, npm run build, npm run test:e2e (sisältää buildin). Käytä jo voimassa olevaa build-näyttöä kun mahdollista. Paikallinen Edge tuoreessa previewssä 4174; desktop ja kapea Chromium-simulaatio, konsoli ja layout tarkistetaan. CUA-host käynnistys estyi ACL-helperiin; projektin Playwright toimii erillisenä paikallisena selainvarmennuksena. Ei fyysistä tai julkaistua näyttöä.

### Dokumentaatiovaikutukset
FEATURE_BRIEF omistaa lopullisen rajauksen ja ledgerin; tämä työbrief liitetään siihen. README ja AGENTS päivitettiin tuolloin varmennettuun v7-nykytilaan; nykyinen README/AGENTS-synkronointi kuuluu tämän tiedoston lopun v8-osioon. Historialliset tutkimukset eivät muutu sovellusnäytöksi.

### Riskit
Lukitusten kiertäminen viereisen noden/segmentin kautta, muunnosten kumuloituminen, kaulamuutoksen aiheuttama mahtuvuusvirhe, stale selection/kamera/open, kapean näytön osumat ja liian karkea käyränäytteistys. Tasajako ei takaa suoraa kielivetoa. M6 tarkistus on nimellinen 2D-tilavaraus.

### Ratkaisematta jääneet asiat
Ei käyttäjäpäätöstä estämässä tätä rajattua polkua. Tulevat kulmasäädöt/solver, muut kielimäärät ja hardwaremallit eivät kuulu ensitoteutukseen. feature_architect palautti NO QUESTIONS NEEDED / DESIGN READY. Hänen rajauksensa mukaisesti lavan topologiatyökalut jäävät jatkoon, vapaat node- ja kahvamuutokset toteutetaan nyt.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
VOIMASSA: käyttäjän 10.9.2026 toteutuspyyntö lavan oletusnäkyvyydestä ja klikkaamalla lähennetystä muokkauksesta. Ei Git-/julkaisulupaa. Työnkulkunäytteiden keruu ei ole käytössä. Baseline: tmp/headstock-integration-baseline (91 tiedostoa ja hashes.json).


### VERIFICATION LEDGER — lapaeditori

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Yksikkö- ja integraatiotestit | npm run test:run | 120/120 PASS, 17 tiedostoa, 3,70 s | Geometria, v7, transaktiot, kaulaton undo ja 6→5-tilasuoja | 10.9.2026 11:57:22, korjattu lähde | Voimassa; myöhemmät muutokset vain käyttämättömän importin poisto, tyhjän valinnan UI-ohje ja testit |
| Tyypit ja tuotantobuild | npm run test:e2e -komennon npm run build: tsc -b && vite build | PASS; index-o2LwOrxq.js | Lopullinen sovellus kääntyy | 10.9.2026, lopullinen E2E-build | Voimassa lopulliseen src-tilaan |
| Kaikki selainpolut | npm run test:e2e -- --reporter=line | 86/86 PASS, 3,0 min | Desktop Edge + iPhone13-kokoinen Chromium-simulaatio, 8 uutta lapatapausta | 10.9.2026 noin 12:02–12:05, tuore 4174-build | Voimassa; ei fyysinen puhelin/Safari |
| Riippumaton QA | qa_verifier lähdekatselmus, oma Edge 1440×900 ja 390×844, lopullinen ledger | VERIFIED; estäviä vikoja ei jäänyt | Valinta/lähennys, lukitukset, tilasuojat, ei konsolivirheitä/ylivuotoa | 10.9.2026; oma selain ennen viimeistä tilasuojaa, sen jälkeen korjauksen lähdekatselmus + lopullinen E2E | Ei julkaisu- tai valmistusnäyttö |
| Lopullinen visuaalinen tarkistus | node tmp/headstock-visual.mjs; 6 PNG-kuvaa + headstock-visual-result.json | 1440/850/390 koko- ja lähikuva; errors=[] ja overflow=false kaikissa | Lopullisen buildin piirto, työkalut ja kapea ohjeteksti | 10.9.2026 12:05:26, tuore Edge-preview 4174; pääagentti katsoi kuvat | Paikallinen selain |
| Ladattu projektitiedosto | E2E:n before/after/reopened.gtrfactory, pääagentin JSON-luku | V7, units=mm, headstock.version=1, 9 solmua; reopen täsmää | Todellinen selainlataus säilyttää lavan; body ja neck.snapshot eivät muutu lapaeditistä | 10.9.2026, desktop- ja mobile-ajon artefaktit test-resultsissä | Projektitiedosto, ei valmistusvienti tai natiivi Save As -koe |
| Muutosraja | SHA256 vs tmp/headstock-integration-baseline; tmp/headstock-final-source.json | 5/5 vendor-tiedostoa ja 7 vertailtua config/manifestia ennallaan; 56 nykyisen src-tiedoston hashit tallennettu | Vendorin ja vertailtujen konfiguraatioiden muuttumattomuus; sovelluksen lähteet muuttuvat tämän työn mukaisesti | 10.9.2026, ennen/jälkeen baseline | Vitest-configista ei lähtöhashia; FretFactory-työtilaan ei tehty kirjoituksia |
| Fyysinen valmistus ja julkaisu | Ei valmistusvientiä, laitekoetta tai deployta | EI VARMENNETTU | Nimellinen M6 2D-mahtuminen ei takaa valmistuskelpoisuutta | Tämä toteutus | Ei kuulu tähän työhön |

Ensimmäinen E2E-yritys pysähtyi JSON-importin puuttuvaan tyyppiattribuuttiin. Seuraava kokonaisajo oli 82/86 PASS ja 4 FAIL: kaksi uutta testiä käytti epäyksiselitteistä notice-locatoria; kahden mobiilitestin segmenttipiste jäi lavan sisältävässä kokonaissovituksessa solmun kosketusalueelle. Riippumaton runtime_diagnostician toisti jälkimmäisen ja varmisti segmentin valinnan neljän lähennyksen jälkeen. Testit korjattiin muuttamatta solmuprioriteettia. Näiden ajojen epäonnistumiset ovat historiallista korjausnäyttöä, eivät vihreä lopputulos. QA:n löytämä kumoamisen vanhentunut lapavalinta korjattiin store- ja UI-suojilla sekä regressiotestillä ennen lopullista 120/120- ja 86/86-näyttöä.

Dokumentaatio on synkronoitu toteutukseen. Historialliset tutkimukset säilyvät päivättyinä; tämä osio omistaa aktiivisen FEATURE BRIEFin ja ledgerin.

## TOTEUTETTU NYKYTILA — kolme lapamallia ja solmutopologia (v8, 10.9.2026)

Tila: TOTEUTETTU JA VARMENNETTU. Tämä aktiivinen osio korvaa aiemman kolme lapamallia -suunnittelun nykyisen editoritoteutuksen osalta. Historialliset tutkimukset ja aiemmat päivätyt briefit säilyvät sellaisina kuin ne olivat.

### Tavoite

Lapaeditissä + Mikrofonikolo poistuu käytöstä. HeadstockTools tarjoaa kuusikieliselle Inline-, 3+3 — Lapa 2- ja 3+3 — Lapa 3 -mallit sekä 7/8-kieliselle Inlinen. Vapaan lavakaaren solmuja voi lisätä ja poistaa atomisesti.

### Ei-tavoitteet

Ei 3+3-lapaa 7/8-kieliselle, ajonaikaista SVG-tuontia, uutta solveria, reikäpaikkojen vapaata muokkausta, node-/segmenttityyppityökaluja, migraatiota, valmistusvientiä, Z/3D:tä tai FretFactory/vendor-muutoksia.

### Käyttäjän vahvistamat päätökset

Kolme mallia ovat valittavissa kuusikieliselle kaulalle. Uusien lapojen lähdemuoto ja reikäjako säilyvät 1:1-mittakaavassa; aktiivinen v8-formaatti ja v1–v7-hylkäys ovat tarkoituksellisia.

### Sallitut paikalliset oletukset

Lähdeanalyysi on tiedostoissa `reference-analysis/headstock-variants-sources.md` ja `reference-analysis/headstock-variants-sources.json`; alkuperäiset SVG/CDR-lähteet eivät kuulu bundleen. Inline on tuettu 6/7/8-kielelle. 3+3-mallit ovat tuettuja kuudelle kielelle. Inline-reunan nykyiset neljä päätyasemaa ovat suojattuja ja vapaa kaari kulkee pisteestä 2 viimeiseen pisteeseen; sauma G1 säilyy. 3+3-malleissa on yhdeksän nimettyä solmua: 0/1/2/6/7/8 ovat suojattuja, 3/4/5 vapaita, 2.out/6.in vapaita kaaren liittymäkahvoja ja satulaliittymä sekä viritinreuna G1-suojattuja. Vapaalla kaarella säilyy vähintään yksi vapaa piste ja solmujen yläraja on 128. Nimellinen 2D M6-fit ei ole valmistuskelpoisuuden todistus.

### Käyttäytymispolut

1. Uusi projekti käynnistyy Inline-mallilla. Kuusikielinen lapa näyttää kolmen mallin valinnan; 7/8-kielisellä vain Inline on käytettävissä. 1–5/9–12-kielisen kaulan nykyinen lapatuki-ilmoitus säilyy.
2. Mallinvaihto säilyttää kunkin variantin muokkaukset, tyhjentää vanhan solmu-/segmenttivalinnan ja sovittaa lähikuvan. Vaihto on yksi undo-askel. 6→7/8-kaulaluonnos aktivoi Inlinen atomisesti; peruutus/undo palauttaa 3+3-tilan, ja kuuteen paluu jättää aktiiviseksi Inlinen, kunnes käyttäjä valitsee 3+3-mallin uudelleen.
3. 3+3-mallien lähdegeometria ja reiät säilyvät 1:1-mittakaavassa ilman hardware-mitoituksen skaalausta. Suojattujen solmujen/segmenttien/saumojen kautta ei voi kiertää lukituksia.
4. Vapaan reunan lisäys käyttää maailman koordinaatiston tarkkaa De Casteljau -jakoa, valitsee uuden pisteen ja säilyttää käyrän. Poisto ja Delete tekevät saman atomisen poiston. Tekstikentän Delete on suojattu, ja poisto hylätään, jos vapaita pisteitä jäisi alle yhden; 128 solmun raja koskee lisäystä ja parseria.
5. Kaikki mallinvaihdot, vedot, kahvat, koordinaatit, solmulisäykset/-poistot, kaulamuutos, tiedostoavaus ja tallennus käyttävät yhteisiä undo/cancel/selection-suojaavia tilarajoja. Mallikohtaiset variantit säilyvät tallennus/avaus-polussa.
6. + Mikrofonikolo unmountataan editingTarget=headstock-tilassa ja palautuu runkomuokkaukseen. Pickupin geometria, kaulan mitat ja body eivät muutu lapaeditistä.

### Muutettavat vastuualueet tai tiedostot

Toteutus on `src/headstock`-alueella, projektin v8-mallissa ja tiedostovalidoinnissa, store-transaktioissa sekä editorin kontekstityökaluissa; vastaavat unit/integration/E2E-testit kattavat polut. `reference-analysis/headstock-variants-sources.md/json` on lähdeanalyysiä, ei runtime-lähde.

### Säilytettävät rajat

Kanoninen millimetrigeometria, satula-/tallakontaktit, kaulan ja rungon mitat, kielen indeksit, Inline 6/7/8 -polut, FretFactoryn vendor-alue, portit, paketit, lukitustiedostot ja muut 2D/3D-valmistusrajat säilyvät.

### Tietomalli- ja rajapintamuutokset

Projektiformaatti on v8 ja vain v8 hyväksytään; v1–v7 hylätään atomisesti ilman migraatiota. Headstock v2 tallentaa aktiivisen mallin tunnisteen ja varianttikartan, jossa kunkin variantin kanoninen solmugeometria ja määrittelyversio validoidaan. Projektitiedoston avaaminen ei korvaa nykyistä työtä virheellisellä, vanhalla tai tuetuilla kielimäärillä ristiriitaisella tiedostolla.

### Toteutusjärjestys

Tämä toteutus ja sen testit ovat valmistuneet; nykytiladokumentit synkronoidaan vasta toteutus- ja varmennusnäytön perusteella.

### Hyväksymiskriteerit

Kolme mallia näkyvät ja vaihtuvat oikeille kielimäärille; suojat säilyvät; vapaan kaaren lisäys säilyttää tarkan käyrän; poisto/Delete käyttää samoja suojia; variantit, cancel/undo/redo, kaulamuutos sekä tallennus/avaus säilyttävät tilan; + Mikrofonikolo on lapaeditissä poissa. Inline- ja muu editorikäyttäytyminen säilyy.

### Testit ja muut varmennustasot

`npm run typecheck` PASS. `npm run test:run`: 140/140 PASS, 19 tiedostoa (10.9.2026 21:56, `tmp/variants-unit-final.log`). Tuotantobuildi PASS; tuotoksen tiedostot olivat `index-pV_bjjyK.js` ja `index-BWyWRjGv.css`. Suoran repo-CLI E2E-ajon (`node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line`) tulos oli 90 PASS + 2 FAIL, joissa epäonnistuminen johtui testin `toBeDisabled`-matcherista HTML:n disabled-attribuutin ollessa oikein; testiasertio korjattiin käyttämään attribuuttia ja propertyä, minkä jälkeen kohdennettu neck count change -ajo oli 2/2 PASS (16,3 s). Näin kaikki 92 skenaariota ovat varmennettuina nykyisestä sovelluksesta, mutta tätä ei merkitä yhdeksi 92/92 täysajoksi. Pääagentin visuaalisessa Edge-previewissä 1440/850/390 tulokset olivat `errors=[]`, ei ylivuotoa ja kaikki käyrät sisällä; 6 reikää ja 9 solmua 3+3-malleissa. Ladatut v8-projektit tarkistettiin JSON-tasolla: `version=8`, `headstock.version=2`, kolme varianttia, millimetriyksiköt sekä ennallaan säilyneet body- ja snapshot-tiedot. Selainnäyttö on paikallinen Edge/Chromium-simulaatio; ei fyysistä, julkaistua, natiivia Save As- tai valmistusnäyttöä.

### Dokumentaatiovaikutukset

README ja AGENTS kuvaavat nyt toteutunutta v8:aa. Tämä osio omistaa aktiivisen nykytilan ja ledgerin; aiemmat päivätyt v7- ja tutkimusosiot ovat historiallista taustaa eivätkä live-väitteitä.

### Riskit

3+3-mallien pienin nimellinen M6-nuppivara on Lapa 2:ssa noin 0,4398 mm; satulakulmat ovat mallikohtaisia (Inline noin 0,73°, Lapa 2 noin 5,23°, Lapa 3 noin 6,95°). Nämä ovat 2D-suunnittelutietoja eivätkä valmistuslupauksia. Muutokset eivät muuttaneet vendor-aluetta, pakettia, lockfilea tai portteja.

### Ratkaisematta jääneet asiat

Ei toteutusta estäviä asioita tässä rajauksessa. Julkaisu, natiivi Save As, fyysinen laite-/valmistuskoe ja valmistusvienti ovat edelleen varmentamatta. Rootin ja qa_verifierin runtime- ja selainvarmennus on erillistä näyttöä; tämä docs-sync-tehtävä ei lisää omaa runtime-QA:ta.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

VOIMASSA JA KÄYTETTY: käyttäjän 10.9.2026 pyyntö kolmen lavamallin, solmutopologian, Delete-poiston ja lapaeditin pickup-piilotuksen toteuttamisesta. Ei Git-/julkaisulupaa. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — kolme lapamallia ja solmutopologia

| Tarkistus / kriteeri | Komento / menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Tyypit | `npm run typecheck` | PASS | V8-lähde tyypittyy | 10.9.2026, korjattu lopullinen lähde | Voimassa |
| Unit/integration | `npm run test:run` | 140/140 PASS, 19 tiedostoa | Variantit, topologia, suojat, tilasiirtymät ja v8-tiedostopolut | 10.9.2026 21:56, `tmp/variants-unit-final.log` | Voimassa |
| Production build | `npm run build` | PASS; `index-pV_bjjyK.js`, `index-BWyWRjGv.css` | Tuotantobundle muodostuu | 10.9.2026, sama korjattu lähde | Voimassa |
| Täysi E2E-ajo | Suora repo-CLI: `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line` | 90 PASS + 2 FAIL; matcher-epäonnistumiset korjattiin testiasertioon | 90 skenaariota täydessä ajossa | 10.9.2026, 4,3 min, tuore build | Historiallinen ajotulos; ei yksin täysi 92/92 |
| Kohdennettu uusinta | `node node_modules/@playwright/test/cli.js test tests/e2e/headstock-variants.spec.ts --grep 'neck count change' --workers=2 --reporter=line,json --output=tmp/variants-count-recheck` sekä `PLAYWRIGHT_JSON_OUTPUT_FILE=tmp/variants-count-recheck.json` | 2/2 PASS, 16,3 s | Molemmat aiemmin matcherista estyneet skenaariot | 10.9.2026, korjattu testiasertio | Voimassa kohdennetuille poluille |
| Visuaalinen selainvarmennus | Rootin tuore Edge-preview, `tmp/variants-visual-results.json` | 9 tapausta (3 mallia × 3 kokoa), errors=[], ei ylivuotoa; käyrät sisällä | Piirto, responsiivisuus, pickup-piilotus ja varianttien rakenne | 10.9.2026, 1440/850/390 | Paikallinen selain; ei fyysinen laite |
| Ladattu v8-artefakti | E2E desktop/mobile -lataukset ja JSON-tarkistus | version 8, headstock v2, 3 varianttia, mm; body/snapshot ennallaan | Todellinen ladattu projektitiedosto säilyttää uuden rakenteen | 10.9.2026, test-results-artefaktit | Projektitiedosto; ei valmistusvienti |
| Riippumaton QA | qa_verifierin lähde/artefaktikatselmus ja Edge-runtime; `tmp/qa-variants-true-pointer-runtime-v2-result.json` | VERIFIED, ei estäviä löytöjä; actual-pointer-, add/delete- ja valintapolut PASS, errors=0, ei ylivuotoa | Lähdekoodin, artefaktin ja runtime-käyttäytymisen rakenne/suojat | 10.9.2026 | Paikallinen selainvarmennus; ei julkaisu- tai valmistusnäyttö |
| Muutosraja | Baseline `tmp/headstock-variants-baseline` ja `tmp/headstock-variants-changes.json` | vendor/FretFactory, package/lock/vite/playwright ennallaan | Muutos pysyy rajatussa sovellus- ja testijoukossa | 10.9.2026 | Ei FretFactory-työtilan muutoksia |
| Julkaisu/fyysinen valmistus | Ei deployta, natiivia Save As -koetta, fyysistä koetta tai valmistusvientiä | EI VARMENNETTU | Paikallinen näyttö ei todista näitä tasoja | Tämä toteutus | Ei kuulu tähän työhön |

Aiemmat v7-ledgerit, suunnitteluosiot ja epäonnistuneet ajot säilyvät historiallisina. Ne eivät kuvaa v8:n nykytilaa eivätkä muuta tämän lopun ledgerin varmennustasoja.




## Ylläpidettävyyskierros 1 — muotoilu ja CSS-kaskadi: TOTEUTETTU JA VARMENNETTU

### Tavoite
Aktiivisen lähteen luettavuus ja CSS:n keskeisten asettelusääntöjen konsolidointi. Sovelluksen toiminta ja ulkoasu säilyvät.

### Ei-tavoitteet
Ei store-/canvas-vastuiden refaktorointia, uusia ominaisuuksia, geometrian tai v8-formaatin muutoksia, DOM-/teksti-/selectorimuutoksia, komponenttien poistoa, lintteriä, CI-hookeja tai julkaisua. Vendor, JSON, fixturet, referenssit ja tutkimusskriptit jäävät muotoilun ulkopuolelle.

### Käyttäjän vahvistamat päätökset
Käyttäjän 11.9.2026 pyyntö ”Voidaanko aloittaa tämän suunnitelman pohjalta?” valtuutti aloittamisen katselmuksen pohjalta. Pääagentti rajasi ensimmäisen kierroksen muotoiluun ja CSS-kaskadiin; muut katselmuksen refaktorointiehdotukset jäävät myöhempiin kierroksiin.

### Sallitut paikalliset oletukset
Prettier 3.9.6 lukittiin kehitysriippuvuudeksi. Asetukset: semi false, singleQuote true, trailingComma all, printWidth 100, endOfLine lf. format ja format:check kattavat src/**/*.{ts,tsx,css} vendorin ulkopuolelta, tests/**/*.ts, vite.config.ts, vitest.config.ts, playwright.config.ts ja scripts/check-port-conflict.mjs. Dokumentit eivät kuulu muotoilukomentojen rajaukseen.

### Käyttäytymispolut
Muotoilu ja kirjoittamaton tarkistus käyttävät samaa tiedostojoukkoa; virheentunnistus ja palautus varmennettiin. Sovelluksen käynnistys, kolme näkymää, kontekstivalinta, kaulaluonnos, lapamallit, pickupit, valikot, undo/cancel sekä v8-tallennus/avaus säilyvät. Yhdeksän lähtötiedostoa tarvitsi kaksi formatteripassia ennen vakaata tulosta. Nykyinen joukko pysyi muuttumattomana seuraavalla passilla; mielivaltaisen syötteen yhden passin idempotenssia ei luvata.

### Muutettavat vastuualueet tai tiedostot
package.json/package-lock.json, .prettierrc.json, .prettierignore, rajattu aktiivinen lähde-/testi-/konfiguraatiojoukko mekaanisesti sekä src/styles.css:n asettelukaskadi. README, AGENTS ja tämä brief kuvaavat toteutuneen kehittäjätyönkulun ja varmennuksen.

### Säilytettävät rajat
Kanoniset millimetrit, v8 ja headstock v2, geometriatulokset, erillinen FretFactory-vendor, DOM, tekstit, selectorit, CSS-specificity ja komponenttikohtaiset CSS-tuonnit säilyvät. Breakpointit 1100/850/480, context-korkeudet 68/94/138, neck-korkeudet 182/245, popup-z-indeksit 100/10/9 sekä nykyinen mobiilin sivuvieritys säilyvät. Ei CSS @layer -muutosta. Portit pysyvät 5174/4174.

### Tietomalli- ja rajapintamuutokset
Ei runtime-, geometria- tai projektimuotomuutoksia. Kehittäjälle lisättiin vain format- ja format:check-komennot.

### Toteutusjärjestys
Lähdebaseline ja alkuperäinen selainaineisto; formatteri ja mekaaninen muotoilu; CSS-konsolidointi; lähdevertailu ja automaattitestit; CSS-korjaus ja uusi build; selain- ja kuvavertailu; täysi E2E; riippumaton QA; dokumentaatio. Vain yksi agentti kirjoitti lähteitä kerrallaan.

### Hyväksymiskriteerit
Muut kuin käsin konsolidoitu styles.css vastaavat formatterin vakaata baseline-tulosta. Ulkopuolinen aineisto säilyy. CSS:n computed-arvot, näkyvien elementtien mitat, vieritysmitat, SVG-maailmamuunnokset ja vertailukuvat vastaavat lähtötilaa. Nykyiset sovellussopimukset ja selainpolut läpäisevät. Toteutunut näyttö on alla ledgerissä.

### Testit ja muut varmennustasot
Format-tarkistus/virhepolku, tyyppi-, yksikkö-/integraatio-, portti- ja build-tarkistukset sekä E2E ajettiin peräkkäin. Valmis build varmennettiin projektin omalla Playwright-CLI:llä ilman ylimääräistä buildia. 96 CSS-tilaa sisältää breakpoint-parit; 27 kiinteän viewportin kuvaparia vertaa vanhaa ja nykyistä CSS:ää samassa DOM-tilassa. Paikallinen Edge ja kapea Chromium-simulaatio ovat eri näyttö kuin fyysinen laite, Safari, julkaisu tai valmistus.

### Dokumentaatiovaikutukset
README/AGENTS sisältävät formatterikomennot ja rajauksen. Tämä osio sisältää toteutuneen briefin ja ledgerin. Aiemmat tuotevaiheet säilyvät historiallisina.

### Riskit
Kaskadimuutoksessa havaittu alle 850 px:n editing-help flex-basis -poikkeama palautettiin. Suljetun details-sisällön mittausartefakti toistettiin identtisen CSS:n A/A-kontrollilla; piilotetun sisällön rect/scroll rajattiin pois, computed-arvot ja avoimen valikon mitat säilyivät vertailussa. Kahden fullPage-kuvan ajoitusherkkä zoom-ero korvattiin 27 identtisellä kiinteän viewportin kuvaparilla ja vakaiden maailmamuunnosten näytöllä.

### Ratkaisematta jääneet asiat
Ei tämän kierroksen estäviä avoimia asioita. Muut ylläpidettävyyskatselmuksen kehityskohteet eivät sisälly valmistumisväitteeseen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
Toteutusvaltuutus oli voimassa yllä mainitun aloittamispyynnön perusteella. Tarpeellinen E2E-varmennus sisältyi työhön. Git-, julkaisu- tai deploy-toimia ei tehty. Työnkulkunäytteiden keruu ei ole käytössä.

### VERIFICATION LEDGER — ylläpidettävyyskierros 1

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Päivä / lähde / voimassaolo |
| --- | --- | --- | --- | --- |
| Riippuvuus ja rajaus | `package.json`, `package-lock.json`, `.prettierrc.json`, `.prettierignore` | Prettier 3.9.6 täsmäversiona; lukkoon lisättiin vain Prettier | Formatterikäytäntö ja sovittu tiedostojoukko | 11.9.2026; root/worker-ledger; voimassa nykyiseen lock-tilaan |
| Vakaa muotoilu | `tmp/maintainability-01-exact-prettier-proof.json` | 63 tiedostoa PASS, ei mismatchia; 9 tarvitsi kaksi passia | Aktiivinen joukko vastaa vakaata Prettier-tulosta | 11.9.2026; worker + QA; voimassa lähdejoukon muuttuessa uudelleen varmennettava |
| Kirjoittamaton tarkistus ja virhepolku | `npm run format:check`; tilapäinen whitespace `src/main.tsx`:ssä ja palautus | PASS; virhe havaittiin ja palautuksen jälkeen PASS | Format-check toimii ja lähde palautettiin täsmälleen | 11.9.2026; worker-ledger; voimassa nykyisiin skripteihin |
| Tyypit, yksikkö/integratio ja portit | `npm run typecheck`; `npm run test:run`; `npm run test:port-conflict` | PASS; 140/140 testiä 19 tiedostossa; portit 5174/4174 PASS | Sovelluksen tyyppiverkko, olemassa olevat sopimukset ja porttirajat säilyivät | 11.9.2026; root/worker-ledger; voimassa nykyiseen lähde- ja testitilaan |
| Tuotantobuildi | `npm run build` | PASS; `index-ND3PxfIP.css`, `index-CboFI8WH.js` | Nykyinen tuotantobundle kääntyy | 11.9.2026; root-ledger; voimassa tähän buildiin |
| CSS-kaskadin runtime-vastaavuus | Rootin 96 tilan computed CSS/rect/scroll/world-state -koe, `tmp/maintainability-01-css-probe-results.json` | 96/96 PASS; A/A-kontrolli vahvisti suljetun details-rect-mittausartefaktin; avoin menu mitattiin | Lasketut tyylit, mitat, scroll- ja maailmatilat säilyvät; mittausrajaus ei peitä CSS-muutosta | 11.9.2026; root-ledger + QA-ledger; voimassa nykyiseen buildiin |
| Kuvallinen ja transform-vastaavuus | Kiinteän viewportin 27 PNG-parivertailu, `tmp/maintainability-01-fixed/results.json` | 27/27 identtistä, world transforms stable, errors 0, overflow 0 | Keskeisten käyttäjätilojen rasteri- ja SVG-maailmatila säilyvät | 11.9.2026; root/QA-ledger; paikallinen selainnäyttö |
| Selainpolut | `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line`; `tmp/maintainability-01-e2e.log` | Täysi 92/92 PASS, exit 0, 3,2 min | Nykyiset desktop- ja kapean Chromium-simulaation E2E-polut säilyvät | 11.9.2026; root-ledger; paikallinen Microsoft Edge, ei fyysinen laite tai Safari |
| Riippumaton QA | `tmp/maintainability-01-qa-ledger.md` | VERIFIED, ei estäviä löytöjä | Scope, diff-raja, CSS-vastaavuus ja varmennustasot katselmoitu | 11.9.2026; qa_verifier; voimassa nykyiseen lähde- ja artefaktitilaan |
| Muutosraja | `tmp/maintainability-01-root-ledger.json`, worker-ledger, QA-ledger | Ei toiminnallisia store-/canvas-/geometriamuutoksia, DOM-/v8-/vendor-/JSON-muutoksia tai tiedostopoistoa | Kierros jäi ylläpidettävyyteen ja CSS-kaskadiin | 11.9.2026; root/worker/QA; voimassa tähän diffin rajaan |
| Julkaisu ja fyysinen näyttö | Ei julkaisu-, native Save As-, valmistusartefakti- tai fyysistä laite-/kenttäkoetta | EI VARMENNETTU | Paikallinen automaatio ja selain eivät todista näitä tasoja | 11.9.2026; root/QA-ledger; tämän kierroksen ulkopuolella |

Aiempi headstock-vaiheen 90 täyden ajon + 2 kohdennetun uusinnan tulos säilyy historiallisena merkintänä. Tämän kierroksen E2E-tulos on itsenäinen täysi 92/92-ajo. Historiallisia epäonnistumisia ei tulkita avoimiksi nykyvioiksi.

Tämä kierros ei tee yleistä CAD/SVG-tuontia, hybridiä, muita 2D-hardware-koloja, valmistusvientiä, Z-akselia, jyrsintäsyvyyksiä tai 3D:tä valmiiksi. Git-, julkaisu-, deploy- ja fyysisen kokeen lupaa ei annettu.

## Ylläpidettävyyskierros 2 — kauladokumentin muodostus ja uudelleenlaskenta: TOTEUTETTU JA VARMENNETTU

### Tavoite
Keskittää kaulan tuonti-, luonti- ja muutosreittien yhteinen puhdas dokumentinmuodostus. Store säilyttää transaktiot, luonnoksen, undo-historian ja käyttöliittymätilan.

### Ei-tavoitteet
Ei käyttäjätoiminnon, geometrian, v8-formaatin, parserin, UI:n, vendorin, CSS:n, import-URL:n tai valmistuslogiikan muutosta.

### Käyttäjän vahvistamat päätökset
Käyttäjän pyyntö "Jatketaan" jatkoi hyväksyttyä ylläpidettävyystyötä. Kierros rajattiin kaulan yhteisen laskenta- ja päivityslogiikan keskittämiseen.

### Sallitut paikalliset oletukset
Uusi sisäinen moduuli käyttää nykyisiä laskenta-, default- ja lapatemplate-rajapintoja. Store säilyttää reittikohtaiset esiehdot ja virheviestit ennen kutsua.

### Käyttäytymispolut
Uuden kaulan luonti, tuonti sekä parametri-, placement-, end- ja koko-kaulamuutokset käyttävät samaa puhdasta derivointia ja säilyttävät nykyisen validointijärjestyksen, automaattisen taskunsuun muokkauksen ja 7/8-kielisen Inline-pakotuksen. Kaulaluonnoksen esikatselu perustuu hyväksyttyyn dokumenttiin; virhe säilyttää viimeisen kelvollisen esikatselun, hyväksyntä on yksi undo-askel ja peruutus palauttaa hyväksytyn dokumentin.

### Muutettavat vastuualueet tai tiedostot
`src/neck/neckDocument.ts` sisältää yhden puhtaan `deriveNeckDocument(document, request)`-derivaatiorajapinnan. Tagged request erottaa fresh-, import-, params-, placement-, end- ja whole-reitit. `src/store.ts` käyttää sitä ja säilyttää julkiset guardit, virheiden järjestyksen, transaktiot, draftin, undo-historian ja parserin rajat. Automaattinen taskunsuu, fyysinen kantapää ja 7/8-kielisen Inline käsitellään moduulin yksityisinä derivaatioina.

### Säilytettävät rajat
Kanoniset millimetrit, v8 JSON, nykyiset virheet ja niiden järjestys, manuaalinen taskuluonnos, vapaat runkokahvat, 6/7/8-kielinen lapa, FretFactory-vendor sekä parserin itsenäinen validointi säilyvät.

### Tietomalli- ja rajapintamuutokset
Ei projektidatan, tallennetun JSON:n, DOM:n, UI:n tai julkisen käyttöliittymärajapinnan muutoksia. Uusi moduuli on sovelluksen sisäinen.

### Toteutusjärjestys
Puhdas moduuli lisättiin, store-kutsut siirrettiin siihen ja kohdennetut regressiotestit lisättiin. Ennen/jälkeen-parity, tyypit, yksikkötestit, build ja selainvarmennus tehtiin peräkkäin.

### Hyväksymiskriteerit
Kaikki nykyiset kaulan luonti-, tuonti-, patch- ja luonnospolut tuottavat saman dokumentti- ja tilatuloksen kuin baseline. Syöteobjektit eivät aliaksen kautta muutu. Luonti rebases referenssin, tuonti säilyttää sen olemassa olevalla kaulalla. Nykyiset virheviestit, undo- ja preview-sopimukset säilyvät.

### Testit ja muut varmennustasot
Kohdennettu Vitest, `npm run typecheck`, `npm run test:run`, `npm run build` ja paikallinen Edge E2E ajettiin peräkkäin. Selain on erillinen näyttötaso eikä todista fyysistä valmistusta tai julkaisua.

### Dokumentaatiovaikutukset
Tämä brief ja AGENTS.md synkronoidaan toteutuneeseen nykytilaan. READMEä ei muuteta, koska käyttäjätoiminta ja tuotteen rajaus eivät muuttuneet.

### Riskit
Store-rajapinnan sisäinen refaktorointi voi muuttaa virheiden järjestystä tai luonnoksen tilasiirtymää. Parity-, test- ja selainnäyttö eivät osoittaneet tällaista muutosta.

### Ratkaisematta jääneet asiat
Ei toteutukseen tai tämän kierroksen varmennukseen jääneitä avoimia asioita. Native Save As-, julkaisu-, Safari-, fyysinen laite-, valmistus- ja manufacturing-näyttö jäivät tämän kierroksen ulkopuolelle.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
TOTEUTETTU JA VARMENNETTU: käyttäjän "Jatketaan" jatkoi aiemmin valtuutettua ylläpidettävyystyötä. Git-, julkaisu- ja deploy-lupaa ei ole.

### VERIFICATION LEDGER — ylläpidettävyyskierros 2

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Formatteri | `npm run format:check` | PASS | Dokumentoidun aktiivisen joukon muotoilu säilyi | 11.9.2026 / kierros 1:n vakaa lähtötila | Voimassa nykyiseen formatteriasetukseen |
| Kohdennetut testit | Kohdennettu Vitest-ajo | 3/3 PASS | Puhtaan derivoinnin reittisopimukset | 11.9.2026 / kierros 1:n lähdebaseline | Voimassa nykyiseen `neckDocument`-rajapintaan |
| Tyyppi-, yksikkö- ja integraatio | `npm run typecheck`; `npm run test:run` | Lopullinen typecheck PASS; 143/143 testiä 20 tiedostossa PASS. Ensimmäinen typecheck-yritys epäonnistui testin virheellisen `lapa2`-tunnisteen vuoksi; tunniste korjattiin `three-three-2`-arvoksi. | Tyyppiverkko ja sovelluksen testisopimukset säilyivät | 11.9.2026 / kierros 1:n lähdebaseline | Voimassa korjatun testitilan nykyversioon |
| Build | `npm run build`; `tmp/maintainability-02-build-equivalence.json` | PASS; lopullisen buildin `index-BYbdy7LR.js` ja `index-ND3PxfIP.css` hashit vastaavat testattua buildiä | Tuotantobundle kääntyy ja build-artefaktin hashit ovat yhtenevät | 11.9.2026 / kierros 1:n build-baseline | Voimassa tähän buildiin |
| Derivoinnin parity | `tmp/maintainability-02-parity-result.json` | 65/65 täsmällistä JSON-byte-identtistä vertailua PASS | Uusi puhdas derivointi tuottaa baselinea vastaavat dokumentit ja tilat | 11.9.2026 / kierros 1:n ennen-tila | Voimassa vertailtuihin 65 tilaan |
| Selainpolut | Paikallinen Microsoft Edge, desktop- ja mobile-simulaatio; E2E 92/92 | 92/92 PASS, 3,0 min, exit 0; console/pageerror/overflow-assertiot PASS ja uudet front-kuvat tarkastettu | Käyttäjäpolut säilyivät paikallisessa selainajossa | 11.9.2026 / lopullinen build | Paikallinen selain; ei Safari/fyysinen/julkaistu |
| QA | `tmp/maintainability-02-qa-ledger.md` | VERIFIED | Riippumaton scope-, diff- ja varmennuskatselmus | 11.9.2026 / lopullinen lähde | Voimassa tähän muutokseen |
| Worker-näyttö | `tmp/maintainability-02-worker-ledger.md` | Tarkistukset kirjattu; lähde- ja testiraja säilyi | Toteutuksen rajaus ja korjauspolku | 11.9.2026 / kierros 1:n baseline | Voimassa tähän diffin rajaan |
| Muutosraja | Root-ledger `tmp/maintainability-02-root-ledger.json` | Store ja uusi neckDocument/test coverage; ei UI-, schema-, vendor- tai käyttäytymismuutosta | Refaktorointi jäi sisäiseen laskenta- ja tilanmuodostusrajaan | 11.9.2026 / kierros 1:n baseline | Voimassa tähän diffin rajaan |
| Julkaisu ja fyysinen näyttö | Ei native Save As-, julkaisu-, Safari-, fyysistä laite- tai manufacturing-koetta | EI VARMENNETTU | Paikallinen automaatio ei todista näitä tasoja | 11.9.2026 / lopullinen lähde | Tämän kierroksen ulkopuolella |

## Ylläpidettävyyskierros 3A — canvas-geometrian valmistelu: TOTEUTETTU JA VARMENNETTU

### Tavoite
Erotetaan EditorCanvasin puhdas piirrettävän geometrian valmistelu omaksi moduulikseen säilyttäen piirron, näkymien ja muokkaustapahtumien käyttäytyminen.

### Ei-tavoitteet
Ei käyttöliittymä-, DOM-, tapahtumakäsittely-, store-, projekti-, parseri-, CSS-, vendor- tai geometriatulosten muutosta.

### Käyttäjän vahvistamat päätökset
Käyttäjän pyyntö ”Jatketaan tästä” valtuuttaa aiemmin ehdotetun EditorCanvas-vastuiden erottamisen ensimmäisen vaiheen: geometrian valmistelun.

### Sallitut paikalliset oletukset
Yksi sisäinen `prepareCanvasGeometry` palauttaa nykyiset piirtodatat alkuperäisiä solmuolioita säilyttäen. Muunnos, mittaviivat, viivaimet ja pikselisijainnit jäävät komponenttiin.

### Käyttäytymispolut
Etu-, taka- ja taskunäkymä valmistavat nykyisessä järjestyksessä rungon solmut, automaattisen taskun, vanhan manuaalisen taskuluonnoksen ja piirtopolun. Etunäkymän kaula käyttää templatea vain siinä näkymässä. Automaatin epäonnistuessa manuaalinen tasku jää fallbackiksi; virheellinen manuaalinen tasku jää ilman taskugeometriaa. Iso näkymä käyttää saamiaan sovitusrajoja ja pikkukuva nykyisiä runko-/etu-rajoja.

### Muutettavat vastuualueet tai tiedostot
`src/editor/canvasGeometry.ts` sisältää puhtaan `prepareCanvasGeometry`-valmistelun ja sen tasku-/piirtogeometrian apufunktiot. `src/editor/EditorCanvas.tsx` käyttää palautettua dataa; JSX-, tapahtumakäsittely-, tila-, viewport- ja pikselimuunnokset jäivät komponenttiin. `src/editor/canvasGeometry.test.ts` kattaa rajatut regressiot.

### Säilytettävät rajat
Kanoniset millimetrit, solmuidentiteetit, `pathD`-järjestys, taskukulmien nollaradius, valintatyökalut, kaula-/lapa-/pickup-piirto, template-eristys, pocket-bottom, v8 ja FretFactory-vendor säilyvät.

### Tietomalli- ja rajapintamuutokset
Ei tallennettavan mallin tai julkisen käyttöliittymän muutosta. Uusi moduuli on editorin sisäinen rajapinta.

### Toteutusjärjestys
Puhdas moduuli lisättiin, vain valmistelulohko siirrettiin komponentista siihen ja kohdennetut regressiotestit lisättiin. Ennen–jälkeen-geometria- ja kuvavertailu sekä automaattiset tarkistukset tehtiin.

### Hyväksymiskriteerit
Kaikkien kolmen näkymän solmuviitteet, piirtopolut, aktiivinen tasku, taskukulmat, kaulan piirto ja sovitusrajat vastaavat lähtötilaa. Syötettä ei muokata. Automaatti-, manuaali-, virhe- ja template-polut säilyvät.

### Testit ja muut varmennustasot
Kohdennettu Vitest kattaa näkymä-/pikkukuvayhdistelmät, automaatti- ja manuaalitaskun ensisijaisuuden, nolla- ja säderadiuksen sekä template-eristyksen. Typecheck, koko yksikkö-/integraatioajo, build ja paikallinen selainvertailu ajettiin. Täysi E2E-ajo tuotti 90 PASSia ja kaksi timeoutia; molemmat uusittiin kohdennetusti onnistuneesti. Selain ei todista julkaisu- tai valmistuskelpoisuutta.

### Dokumentaatiovaikutukset
README ei muutu ilman käyttäjätoiminnon muutosta. Tämä brief ja AGENTS.md synkronoidaan toteutuneen varmennuksen jälkeen.

### Riskit
Taskupiirtopolun sulkemisjärjestys, automaatti/manuaali-fallback tai pikkukuvan sovitus voi muuttua huomaamatta. Näitä verrataan lähtötilan 52 selaintapaukseen sekä yksikkötesteihin.

### Ratkaisematta jääneet asiat
Tapahtumakäsittelyn ja komponentin muun rakenteen erottaminen jää myöhempään ylläpidettävyyskierrokseen. Täyden E2E-ajon kaksi timeoutia liittyivät riippumattoman ajojäljen perusteella ulkoiseen runtime-keskeytykseen tai starvationiin; täsmällistä hostin nukkumis- tai sessiopysähdyssyytä ei varmistettu. Kummankin tapauksen kohdennettu uusinta onnistui.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
TOTEUTETTU JA VARMENNETTU: käyttäjän ”Jatketaan tästä” jatkoi aiemmin valtuutettua ylläpidettävyystyötä. Git-, julkaisu- ja deploy-lupaa ei ole.

### VERIFICATION LEDGER — ylläpidettävyyskierros 3A

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähtöaineisto | `tmp/maintainability-03-baseline` ja 52 selaintapausta | Tallennettu ennen lähdemuutosta | Vertailtava lähde- ja selainlähtötila | 11.9.2026 | Voimassa vertailussa |
| Muutosraja | `tmp/maintainability-03-scope.json`; lähde- ja testitarkistus | PASS; vain `EditorCanvas.tsx`, `canvasGeometry.ts`, `canvasGeometry.test.ts` ja tämä brief muuttuivat | Puhdas valmistelumoduuli lisättiin; JSX-, tapahtuma-, store-, malli-, formaatti-, CSS- ja vendor-rajat säilyivät | 11.9.2026 / ennen–jälkeen-hashit | Voimassa tähän diffin rajaan |
| Kohdennettu geometria | `npx vitest run src/editor/canvasGeometry.test.ts` | 11/11 PASS | Näkymä-/pikkukuvayhdistelmät, template-eristys, automaatti/manuaali-ensisijaisuus, säteet, kulmat, `pocketBottom` ja virheellinen manuaalitasku säilyvät | 11.9.2026 / lopullinen lähde | Voimassa muutettuun moduuliin |
| Muotoilu | `npm run format:check` | PASS | Aktiivisen formatterijoukon muotoilu säilyi | 11.9.2026 / lopullinen lähde | Voimassa tähän lähdetilaan |
| Tyyppi- ja yksikkötestit | `npm run typecheck`; `npm run test:run` | PASS; 154/154 testiä 21 tiedostossa | Uusi sisäinen moduuli tyypittyy ja sovelluksen automaattiset sopimukset säilyvät | 11.9.2026 / lopullinen lähde | Voimassa tähän lähdetilaan |
| Build | `npm run build` | PASS; `index-jHMVQZkX.js`, `index-ND3PxfIP.css` | Tuotantobundle muodostuu | 11.9.2026 / lopullinen lähde | Voimassa tähän buildiin |
| Selaingeometria ja rasterit | `node tmp/maintainability-03-capture.mjs before/after`; `node tmp/maintainability-03-compare.cjs` | PASS; 52/52 SVG-geometria-, teksti-, tick- ja transform-vertailua sekä 52/52 kiinteän viewportin PNG:tä identtisiä; konsoli-, pageerror- ja overflow-löydöksiä 0 | Refaktorointi säilyttää havaitun piirtogeometrian Edge-koissa 1440 ja 390 | 11.9.2026 / lopullinen build | Paikallinen selainnäyttö |
| Täysi E2E-ajo | `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line` | 90 PASS + 2 timeoutia, exit 1; ajoaika 1,6 h. Tämä ei ollut 92/92 PASS -ajo | 90 skenaariota läpäisi täyden ajon; kaksi tapausta jäi erikseen tutkittaviksi | 11.9.2026 / `tmp/maintainability-03-e2e.log` | Vain kyseisen ajon näyttö |
| Timeout-diagnoosi | Tallennettujen trace-jälkien riippumaton ajoitusvertailu | Molemmissa noin 89 min ulkoinen keskeytys/starvation ennen eri vaiheita; hostin sleep/pause on mahdollinen, muttei todistettu; lähdekorjausta ei tehty | Ei determinististä sovellus- tai assertiovirhettä | 11.9.2026 / `tmp/maintainability-03-timeout-diagnosis.json` | Rajattu syyarvio |
| Kohdennetut uusinnat | `neck.spec.ts`, `pickups.spec.ts`, desktop-edge, kaksi täsmätapausta | 2/2 PASS, 8,7 s, exit 0, muuttumaton lähde ja build | Molemmat timeout-tapaukset toimivat uusinnassa | 11.9.2026 / `tmp/maintainability-03-targeted-e2e.log` | Yhdessä täyden ajon kanssa kaikki 92 skenaariota katettu; ei yksi 92/92 täysajo |
| QA | `tmp/maintainability-03-qa-ledger.md` | VERIFIED; blocking defects none | Riippumaton lähde-, rajaus-, parity-, automaatti- ja selainnäytön katselmus | 11.9.2026 / lopullinen lähde | Voimassa tähän muutokseen |
| Julkaisu, natiivi Save As, Safari, fyysinen laite ja valmistus | Ei ajettu | EI VARMENNETTU | Paikallinen testaus ei todista näitä tasoja | 11.9.2026 / tämän kierroksen ulkopuolella | Ei sovellu tähän näyttöön |

## Ylläpidettävyyskierros 3B — EditorCanvasin vuorovaikutusohjain: TOTEUTETTU JA VARMENNETTU

### Tavoite
Erotetaan EditorCanvasin valinta-, veto-, panorointi-, zoomaus-, peruutus- ja eleiden elinkaarilogiikka `useCanvasInteractions`-hookiin. EditorCanvas kokoaa geometrian ja piirtää näkymän.

### Ei-tavoitteet
Ei käyttöliittymän, JSX-rakenteen, DOM-valitsimien, CSS:n, geometrian, kamerakaavojen, store-rajapinnan, v8-formaatin, parserin tai vendor-alueen muutosta.

### Käyttäjän vahvistamat päätökset
Käyttäjän “Jatketaan tästä” valtuutti 3A:n jälkeen vuorovaikutusvastuiden erottamisen.

### Sallitut paikalliset oletukset
Hook saa vain SVG-refin, näkymä- ja eleparametrit, aktiiviset solmut, muunnoksen, kameran, koon, generation- ja drag-arvon sekä tarvittavat valintakutsut. Se lukee tapahtumahetken tilan `useAppStore.getState()`-rajapinnasta eikä omista dokumenttia tai pysyvää kameraa. `isTyping` säilyy EditorCanvasin nykyisen tuonnin yhteensopivuuden vuoksi hookin re-exportina.

### Käyttäytymispolut
Node-, kahva-, headstock-, pickup-, marquee- ja pan-ele säilyttävät aloitushetken transformin, kameran ja valinnan. Kaulaluonnos estää runko- ja pickup-muokkauksen nykyviesteillä. Escape, pointercancel, lost capture, blur, resize, view-/generation-muutos ja unmount peruvat nykyisen eleen sekä palauttavat panoroinnin. Wheel estää vierityksen suuressa SVG:ssä ja zoomaa vain ilman aktiivista elettä. Ryhmäkäsittelijät, input-callbackit kaulalle, lavalle ja säteelle sekä ref- ja lifecycle-efektit säilyttävät nykyisen tilan.

### Muutettavat vastuualueet tai tiedostot
`src/editor/useCanvasInteractions.ts` omistaa eleen tilan, tapahtumakäsittelijät ja lifecycle-efektit. `src/editor/EditorCanvas.tsx` kytkee nimetyt käsittelijät nykyiseen JSX:ään ja säilyttää geometrian valmistelun sekä näkymän kokoamisen. Tämä brief dokumentoi toteutuksen ja näytön.

### Säilytettävät rajat
Kanoniset millimetrit, preview/accepted-erottelu, pointer capture, `preventScroll`-fokus, nykyiset store-transaktiot, draftit, undo/redo, protected-osat, headstock/pickup/body-prioriteetit sekä aria- ja data-attribuutit säilyvät.

### Tietomalli- ja rajapintamuutokset
Ei tallennettavan datan, store- tai julkisen rajapinnan muutosta. `isTyping` siirtyi sisäiseen hook-moduuliin ja re-exportataan EditorCanvasista Appin nykyisen tuonnin säilyttämiseksi. Hook on editorin sisäinen rajapinta.

### Toteutusjärjestys
Eleiden tila, käsittelijät ja efektit siirrettiin hookiin; JSX delegoi niihin nykyisillä callbackeilla, ryhmäkäsittelijöillä ja ref-rajapinnoilla. Ennen–jälkeen-elejälki, staattinen SVG/PNG-pariteetti, automaattiset tarkistukset ja täysi E2E ajettiin. 3A:n geometrian valmistelu säilytettiin erillisenä.

### Hyväksymiskriteerit
Node-, kahva-, headstock- ja pickup-veto, segmenttivalinta, marquee, taskukulman valinta, pan/zoom, draft-esto ja kaikki eleen peruutuspolut tuottavat lähtötilaa vastaavan dokumentti-, kamera-, preview- ja valintatilan. SVG:n rakenne ja 3A:n 52 staattista tilaa säilyvät.

### Testit ja muut varmennustasot
Ennen–jälkeen-elejälki kattoi node-, ryhmä-, kahva-, pan-, zoom-, marquee-, headstock-, pickup-, resize-, blur-, pointercancel-, lost-capture-, view- ja generation-polut. Muotoilu, tyyppitarkistus, yksikkö-/integraatioajo, build, 52 staattista SVG/PNG-vertailua ja täysi E2E ajettiin. Selain on paikallinen näyttötaso, ei valmistus- tai fyysinen laitetodistus.

### Dokumentaatiovaikutukset
FEATURE_BRIEF.md ja AGENTS.md synkronoitiin tämän varmennuksen jälkeen. README ei muutu, koska käyttäjätoiminto ei muutu.

### Riskit
Efektien riippuvuuden tai puhdistusjärjestyksen, eventin pysäytyksen, pointer capturen tai gesture-transformin muuttuminen voi muuttaa eleen tilaa. Ennen–jälkeen-elejälki, SVG/PNG-pariteetti ja E2E eivät osoittaneet tällaista muutosta.

### Ratkaisematta jääneet asiat
Tämä vuorovaikutus- ja geometriavalmistelun erottamisen vaihe on valmis. Renderöinnin lisäjako ei ole tämänhetkinen avoin tai valtuutettu työ. Julkaisu-, Safari-, fyysinen laite- ja valmistusartefaktinäyttö eivät kuulu tähän refaktorointiin.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
TOTEUTETTU JA VARMENNETTU: käyttäjän “Jatketaan tästä” jatkoi 3A:n jälkeen vuorovaikutusvastuiden erottamista. Git-, julkaisu- ja deploy-lupaa ei ole.

### VERIFICATION LEDGER — ylläpidettävyyskierros 3B

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lopulliset hashit | `tmp/maintainability-03b-root-ledger.json` | PASS; EditorCanvas `ff6c96e3e88614e455eb327b92037fd7c8c25f12cac9b9e3cabd91c3c52ca272`, hook `70e5713a2f53dc502c554b6b4e36e7b0350929ad2c4c27c7fdcb7bb36ee29b8f`, build JS `2398228bdbb187b08d9466f5d3741aa4cd74a59e1fb2c3fd4e2165ee3150524a`, CSS `b3861f5e6f64bb46a3d5b4731b0b40a71fd47c90d68063dde113b062e5fd2526` | Muutettu lähde ja tarkistettu build ovat yksilöitävissä täsmällisesti | 11.9.2026 / lopullinen 3B-lähde ja build | Voimassa näiden hashien säilyessä muuttumattomina |
| Muutosraja ja omistajuus | `tmp/maintainability-03b-root-ledger.json`; lähdehashit ja riippumaton QA | PASS; toteutusdifissä muuttuivat vain EditorCanvas.tsx ja uusi useCanvasInteractions.ts; tämän dokumentointisynkronoinnin lisäksi muuttui AGENTS.md; geometria-, store-, malli-, CSS-, vendor- ja README-rajat säilyivät | Vuorovaikutuslogiikka siirtyi hookiin ja EditorCanvas säilytti geometrian sekä JSX-kokoonpanon | 11.9.2026 / hashit `ff6c96e3e88614e455eb327b92037fd7c8c25f12cac9b9e3cabd91c3c52ca272`, `70e5713a2f53dc502c554b6b4e36e7b0350929ad2c4c27c7fdcb7bb36ee29b8f` | Voimassa näiden lähdetiedostojen säilyessä muuttumattomina |
| Muotoilu | `npm run format:check` | PASS | Aktiivisen formatterijoukon muotoilu säilyi | 11.9.2026 / lopullinen lähde | Voimassa tähän lähdetilaan |
| Tyyppi- ja yksikkötestit | `npm run typecheck`; `npm run test:run` | PASS; 154/154 testiä 21 tiedostossa | Hookin rajapinta tyypittyy ja sovelluksen automaattiset sopimukset säilyvät | 11.9.2026 / lopullinen lähde | Voimassa tähän lähdetilaan |
| Build | `npm run build` | PASS; `index-DY8Xb49j.js`, `index-ND3PxfIP.css` | Tuotantobundle muodostuu | 11.9.2026 / lopullinen lähde | Voimassa tähän buildiin |
| Eleiden parity | `node tmp/maintainability-03b-gestures.mjs after`; `node tmp/maintainability-03b-compare.cjs` | PASS; 36/36 tarkkaa tila- ja SVG-vertailua, errors=`[]` | Tallennetut veto-, valinta-, peruutus-, kamera- ja elinkaaripolut vastaavat baselinea | 11.9.2026 / ennen–jälkeen-elejälki | Voimassa muuttumattomaan toteutukseen |
| Staattinen renderöintiparity | `node tmp/maintainability-03b-capture-static.mjs after`; `node tmp/maintainability-03b-compare.cjs` | PASS; 52/52 SVG-vertailua ja 52/52 PNG-bytevertailua, console/pageerror/overflow 0 | Näkymät, taskut, kaulat, lavat ja kapea renderöinti säilyvät koissa 1440 ja 390 | 11.9.2026 / 3A-after vs 3B-after | Paikallinen Edge-selainnäyttö |
| JSX-rakenne | `tmp/maintainability-03b-jsx-parity.cjs` | PASS; event-attribuutit ja pelkästä tyhjätilasta koostuvat JSXText-solmut poistettuna rakenne ja muut attribuutit identtiset | JSX-kokoonpano ja muut kuin tapahtumakytkennät säilyivät | 11.9.2026 / ennen–jälkeen | Voimassa tähän lähdetilaan |
| Selain-E2E | `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line` | PASS; 92/92, 3,2 min, exit 0 | Kaikki nykyiset desktop-Edge- ja kapean Chromium-simulaation polut toimivat lopullisella buildillä | 11.9.2026 / `tmp/maintainability-03b-e2e.log` | Paikallinen selain; ei Safari/fyysinen/julkaistu |
| Riippumaton QA | `tmp/maintainability-03b-qa-ledger.md` | VERIFIED; blocking defects none | Riippumaton lähde-, parity-, scope- ja käyttöpolkujen katselmus | 11.9.2026 / lopulliset lähdehashit | Voimassa tähän muutokseen |
| Julkaisu, natiivi Save As, Safari, fyysinen laite ja valmistus | Ei ajettu | EI VARMENNETTU | Paikallinen testaus ei todista näitä tasoja | 11.9.2026 / tämän kierroksen ulkopuolella | Ei sovellu tähän näyttöön |


## Ylläpidettävyyskierros 4 — dokumenttitransaktiot: TOTEUTETTU JA VARMENNETTU

### Tavoite
Erotetaan storen dokumentin hyväksyntä-, peruutus-, undo- ja redo-siirtymät puhtaaseen sisäiseen moduuliin. Store säilyttää eleiden, kaulaluonnoksen ja käyttöliittymätilan omistajuuden.

### Ei-tavoitteet
Ei käyttäjätoimintojen, geometrian, v8-projektiformaatin, parserin, UI:n, CSS:n, vendorin, tiedostonavaus- tai tallennuspolun muutosta.

### Käyttäjän vahvistamat päätökset
Käyttäjän 11.9.2026 pyyntö “toteuta” valtuuttaa edellisessä ylläpidettävyyskatselmuksessa ehdotetun dokumenttitransaktioiden erottamisen.

### Sallitut paikalliset oletukset
Sisäinen `documentTransactions`-moduuli saa käyttää vain dokumenttikloonia, nykyistä parseri-/serialisointivalidointia ja rajattua EditorState-tyyppiä. Store välittää samat tilat ja säilyttää vartiointijärjestyksen.

### Käyttäytymispolut
Muutos hyväksytään vain validina dokumenttina, lisää täsmälleen yhden historiakopion, tyhjentää future-listan ja puhdistaa vanhentuneet valinnat. No-op ja virheellinen hyväksyntä tyhjentävät preview/drag-tilan nykyisin avaimin. Peruutus palauttaa vain kaulaluonnoksen esikatselun tai tyhjentää eleen. Undo/redo estyvät ensin kaulaluonnoksesta, sitten peruuttavat käynnissä olevan vedon, ja muuten siirtävät historiat, valinnat, revisionin ja dirty-tilan ennallaan säilyvillä clone-rajoilla. Kaulaluonnoksen hyväksyntä käyttää samaa hyväksyntäsiirtymää.

### Muutettavat vastuualueet tai tiedostot
`src/store/documentTransactions.ts` sisältää puhtaat vertailu- ja tilasiirtymäfunktiot. `src/store.ts` delegoi niihin hyväksynnän, peruutuksen, undo:n ja redo:n. Kaulaluonnoksen apply/cancel-orchestration ja eleiden vartiointi säilyvät storessa. Rajattu testi osoittaa nämä sopimukset. Tämä brief dokumentoi toteutuneen muutoksen ja varmennusledgerin.

### Säilytettävät rajat
Nykyiset patch-avaimet, virheviestit, vartiointijärjestys, 100 kohdan historia, dokumenttikloonit, valinnan puhdistus, headstock-tuki, neckDraft- ja drag-prioriteetti, generation/save-rajat sekä julkinen Store-rajapinta säilyvät. Ei muutoksia muualle lähteeseen.

### Tietomalli- ja rajapintamuutokset
Tallennettava data ja julkinen EditorState-rajapinta eivät muutu. Uusi moduuli on storen sisäinen toteutusrajapinta.

### Toteutusjärjestys
Tallennettiin ennen–jälkeen-storetason lähtöaineisto, lisättiin puhtaat siirtymät, kytkettiin store, lisättiin vain todellinen testiaukko ja ajettiin tyyppi-, yksikkö-, build- ja selainvarmennus. Riippumaton QA tehtiin vakaan lähteen jälkeen ja tämä dokumentointisynkronointi sen jälkeen.

### Hyväksymiskriteerit
Hyväksyntä, peruutus, undo ja redo tuottavat samat dokumentti-, preview-, history-, future-, selection-, dirty-, revision- ja message-patchit kuin lähtötila. Kaulaluonnos ja aktiivinen veto säilyttävät prioriteettinsa. Parserivirhe, no-op, katkenneet valinnat ja clone-identiteetti kattavat suorat testit.

### Testit ja muut varmennustasot
Suora moduulitesti kattaa no-opin, parserivirheen, historian, kloonauksen, valinnat sekä draft/drag-vartioiden prioriteetin. Root vertasi 108 tallennettua storen tilasiirtymää ja 3B:n 36 selainelettä ennen–jälkeen. Muotoilu, tyyppitarkistus, yksikkö-/integraatioajo, build, täysi E2E ja riippumaton QA tehtiin toteutuksen jälkeen. Paikallinen selain ei ole fyysinen, julkaisu- tai valmistusnäyttö.

### Dokumentaatiovaikutukset
FEATURE_BRIEF.md ja AGENTS.md synkronoitiin tästä toteutuneesta ja riippumattomasti varmennetusta kierroksesta. README ei muutu, koska käyttäjätoiminto ei muutu.

### Riskit
Patch-avaimen tai kloonausjärjestyksen muuttuminen voi jättää vanhan previewn, valinnan tai historian näkyviin. 108 tilasiirtymän oracle ja nykyiset käyttöpolkutestit on tarkoitettu juuri tämän havaitsemiseen.

### Ratkaisematta jääneet asiat
Ei toteutusta estäviä avoimia tuotepäätöksiä. Julkaisu-, natiivi Save As-, Safari-, fyysinen laite- ja valmistusvarmennus eivät kuulu tähän refaktorointiin.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
VOIMASSA: käyttäjän 11.9.2026 pyyntö “toteuta”. Valtuutus kattaa tämän briefin rajatun storen sisäisen refaktoroinnin ja siihen kuuluvan varmennuksen. Git-, julkaisu- ja deploy-lupaa ei ole.

### VERIFICATION LEDGER — ylläpidettävyyskierros 4

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähtötilan store-oracle | `tmp/maintainability-04-before.json` | PASS; tallennettu ennen lähdemuutosta, 108 tilasiirtymää | Vertailtava dokumentti-, preview-, historia-, valinta- ja viestitila | 11.9.2026 / 04-baseline | Voimassa vertailun lähtötilana |
| Kohdennettu transaktiotesti | `npx vitest run src/store/documentTransactions.test.ts` | PASS; 7/7 | No-op, parserivirhe, patch-avaimet, historia/klooni, valinta, draft/drag, undo/redo ja 100 kohdan raja | 11.9.2026 / lopullinen lähde | Voimassa lähdetiedostojen hashien säilyessä |
| Tyyppi- ja yksikkötestit | `npm run typecheck`; `npm run test:run` | PASS; 161/161 testiä 22 tiedostossa | Store- ja transaktiomoduulin rajapinta sekä nykyiset sovellussopimukset toimivat | 11.9.2026 / lopullinen lähde | Voimassa lähdetiedostojen hashien säilyessä |
| Muotoilu | `npm run format:check` | PASS | Aktiivisen formatterijoukon muotoilu säilyy | 11.9.2026 / lopullinen lähde | Voimassa lähdetiedostojen ja formatteriasetusten säilyessä |
| Store- ja geometriapariteetti | `node tmp/maintainability-04-probe.cjs tmp/maintainability-04-after.json`; `node tmp/maintainability-04-compare.cjs` | PASS; 108/108, failures `[]` | Dokumentti-, preview-, history-, future-, selection-, dirty-, revision- ja geometriatilasiirtymät vastaavat lähtötilaa | 11.9.2026 / before-oracle vs lopullinen lähde | Voimassa lähdetiedostojen ja baseline-riippuvuuksien säilyessä |
| Selain-elepariteetti | `tmp/maintainability-04-gesture-result.json` | PASS; 36/36, failures `[]`, errors `[]` | Valinta-, veto-, peruutus- ja kameratoiminnot säilyvät paikallisessa selaimessa | 11.9.2026 / 3B-elebaseline vs lopullinen lähde | Paikallinen Edge-selainnäyttö; voimassa toteutuksen säilyessä |
| Täysi selain-E2E | `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line` | PASS; 92/92, 3,6 min, exit 0 | Desktop-Edge- ja kapean Chromium-simulaation nykyiset käyttäjäpolut toimivat lopullisella buildillä | 11.9.2026 / `tmp/maintainability-04-e2e.log` | Paikallinen selain; ei Safari/fyysinen/julkaistu |
| Tuotantobuildi | `npm run build` | PASS; `index-Dhn3xVse.js`, `index-ND3PxfIP.css` | Tuotantobundle muodostuu | 11.9.2026 / lopullinen build | Voimassa ilmoitettujen build-hashien säilyessä |
| Lopulliset hashit | `tmp/maintainability-04-root-ledger.json` | PASS; `src/store.ts` `efc55396fb25bfaf8e806527e0b80c0b00756b02aa3334c5ebb267f8ad973fdd`; `src/store/documentTransactions.ts` `3c458e41ff2e9d7913351eba79cd97a674b745152cf2a975c06204355eac5fda`; testi `7d0ee398bec2a68bbebdba198b0b57fdf097f8c74239afe904c7af54ceaeff79` | Lopullinen lähde ja kohdennettu testi ovat yksilöitävissä | 11.9.2026 / lopullinen lähde | Voimassa ilmoitettujen hashien säilyessä |
| Muutosraja | `tmp/maintainability-04-scope.json`; rootin baseline-diffi | PASS; lähdemuutokset: `src/store.ts`, uusi transaktiomoduuli ja sen testi; dokumentointimuutokset: FEATURE_BRIEF.md ja AGENTS.md | UI, geometria, schema, vendor, config ja README säilyivät muuttumattomina | 11.9.2026 / 04-baseline vs lopullinen lähde | Voimassa ilmoitettujen lähdehashien säilyessä |
| Riippumaton QA | `tmp/maintainability-04-qa-ledger.md` | VERIFIED; blocking defects none | Riippumaton lähde-, rajaus-, parity-, automaatti- ja selainnäytön katselmus | 11.9.2026 / lopulliset lähdehashit | Voimassa ilmoitettujen hashien säilyessä |
| Safari-, julkaisu-, fyysinen laite- ja valmistusvarmennus | QA:n rajaus; ei ajettu | EI VARMENNETTU | Paikallinen automaattinen ja selainvarmennus ei todista näitä tasoja | 11.9.2026 / tämän kierroksen ulkopuolella | Ei sovellu tähän näyttöön |

## FEATURE BRIEF — Sapluunageometria

Tila: TOTEUTETTU JA VARMENNETTU. Sapluunageometria ja sen esikatseluintegraatio ovat toteutuneet; tiedostovienti ei kuulu tähän vaiheeseen.

### Tavoite

Muodostetaan puhdas millimetripohjainen sapluunageometria etu- ja takarungolle sekä todellinen suljettu, avoimella kaulalovella varustettu rungon yläosan taskusapluuna. Kelvollinen automaattinen tasku näkyy myös taskun esikatselussa.

### Ei-tavoitteet

Ei SVG-, DXF- tai PDF-tiedostovientiä, leikkausrajan käyttöliittymäsäätöä, mallin tai storen muutosta, Z/3D:tä, työkalun offsetia eikä valmistussertifikaattia. Mikrofonit, kaula, lapa, talla, kielet ja haamukuva eivät kuulu leikkuugeometriaan.

### Käyttäjän vahvistamat päätökset

Etu- ja takasapluunat ovat vain runkoääriviivoja; keskiviiva on erillinen kohdistusviite. Taskusapluuna sisältää rungon yläosan, kapenevat taskusivut ja yhteisen kulmasäteen. Menetelmä on 1:1-laakeriteräsapluuna. Käyttäjän pyyntö “Toteuta sapluunageometria” valtuuttaa tämän rajauksen.

### Sallitut paikalliset oletukset

Taskun leikkausrajan oletus on suljetun taskupään suurin Y + 20 mm, nykyisellä oletuksella noin 90,8587 mm. Sisäinen puhdas rajapinta voi vastaanottaa eksplisiittisen `cutY`-arvon myöhempää käyttöä varten, mutta sitä ei tallenneta eikä sille lisätä käyttöliittymää. Epäselvä tai tukematon tapaus palauttaa rakenteisen virheen: `invalid` tai `unsupported`, vakaa koodi ja suomenkielinen viesti. Käyrien adaptiivisen tarkistuksen toleranssi on 0,002 mm; selvän eron turvaraja on 0,0040001 mm. Leikkausjuurten ja päätepisteiden vertailuraja on 0,0000001 mm. Tarkistus käyttää rajattua jakosyvyyttä sekä reuna- ja vertailumäärää; rajan ylitys palauttaa unsupported-tilan. Nämä ovat laskennan rajoja, eivät fyysisen valmistuksen tarkkuuslupaus.

### Käyttäytymispolut

Etu lukee lähderungon täsmällisillä viiva- ja Bézier-kontrolleilla. Taka peilaa kaikki X-koordinaatit akselin X=0 suhteen. Tasku johtaa automaattisen taskun, kulkee vasemmalta liittymäankkurilta rungon pitkää ulkoketjua pitkin oikealle ankkurille ja leikkaa sen vaakasuoralla rajalla. Se vaatii kaksi varsinaista risteystä eikä hyväksy päätepiste-, tangentti- tai päällekkäisyystilannetta. Kuutiot katkaistaan De Casteljau -jaolla. Lopputulos on yksi suljettu leikkausreuna: vasen taskunsuu, vasen yläreuna, vasen risteys, pohjaviiva, oikea risteys, oikea yläreuna sekä taskun sivut ja pyöristetty pää takaisin suulle. Alkuperäinen suun Bézier ei kuulu leikkausreunaan.

Kelvollinen automaattinen tulos korvaa taskun esikatselussa vanhan koko rungon lovipolun. Alkuperäiset rungon solmut ovat yhä ainoat muokattavat solmut; johdettuja risteyksiä tai pohjaviivaa ei voi muokata eikä niistä synny historiaa tai likaisuutta. Solmut ja segmenttiosumat rajataan leikkausrajan alapuolelta pois. Kaulattomuus säilyttää nykyisen ilmoituksen. Vanha manuaalinen v8-taskuluonnos säilyy esikatseltavana ja muokattavana, mutta ei ole valmistussapluunatulos. Automaattisen taskun laskentavirhe ei kaada käyttöliittymää.

### Muutettavat vastuualueet tai tiedostot

Lisättiin `src/templates/templateGeometry.ts` ja sen testi sekä integroitiin `canvasGeometry.ts`, `EditorCanvas.tsx` ja taskun selainpolku. Toteutus kirjattiin briefiin ennen lähdemuutoksia; README ja AGENTS synkronoitiin QA:n jälkeen.

### Säilytettävät rajat

V8-formaatti, store, julkinen data, viewport, CSS, vendor-alue, nykyiset automaattisen taskun mitat, manuaalinen fallback, kamerat, yksiköt, undo/redo ja suojatut solmut säilyvät. Nykyinen 16 näytteen itseleikkausvaroitus ei ole valmistustarkastus eikä sapluunavalidoinnin todistus.

### Tietomalli- ja rajapintamuutokset

Sisäinen `TemplateGeometryResult` sisältää millimetrit, lajin, suljetun segmenttikontuurin tai `null`-arvon, erilliset keskiviiva- ja taskunsuureferenssit, tarkat rajat ja leikkausrajan sekä diagnostiikan. Segmentit ovat tyypitettyjä viivoja, kuutiollisia Béziereitä tai ympyräkaaria rooleilla `body-outline`, `template-bottom` ja `neck-pocket`. Polkusarjoitin muuntaa ne SVG-poluksi, mutta ei vie tiedostoa. Tallennettava malli ei muutu.

### Toteutusjärjestys

Tyypit, etu/taka ja sarjoitin → polynomijuurten rajaus ja De Casteljau -leikkaus → suljettu taskukontuuri ja referenssit → rajattu käyrä- ja topologiatarkistus → esikatseluintegraatio ja osumien rajaus → testit, riippumaton QA ja dokumentointisynkronointi.

### Hyväksymiskriteerit

Eturungon lähde säilyy täsmällisenä ja taka on sen täsmällinen peili. Oletusleikkausraja riippuu taskusta, ei kamerasta. Kelvollinen tasku on yksi suljettu kontuuri ilman suun leikkausosuutta ja kuutiollinen reuna säilyy käyränä. Kaikki roolit ovat yksikäsitteisiä. Rungon muokkaus päivittää yläosan, eksplisiittinen `cutY` muuttaa vain johdettua tulosta, ja 6/7/8-kieliset sekä moniskaala toimivat. Virheellinen tai epäselvä tulos sulkeutuu turvallisesti, mutta muokkaus ja tallennus säilyvät. Manuaali- ja kaulattomat polut säilyvät.

### Testit ja muut varmennustasot

Kohdennetut yksikkötestit (22/22) kattavat geometriamoduulin ja canvasintegraation keskeiset viiva-, Bézier-, peilaus-, sulkeuma- ja fallback-sopimukset. Riippumaton geometriaprobe (27/27) kattaa lisäksi 6/7/8-kielisen ja moniskaalaisen tuloksen, säteen 0, tangentti- ja solmutilanteet, topologiavirheet, risteysmäärän ja lähteen muuttumattomuuden. Selainvarmennus kattaa 104/104 front/back-regressiota, 52 capture-tilaa sekä taskun alarajan, osumarajauksen, virheellisen luonnoksen ja undo/tallennuspolun; täysi paikallinen E2E oli 92/92. Muotoilu, tyyppitarkistus, yksikköajo ja build ajettiin peräkkäin. Paikallinen selain ei todista fyysistä mittakaavaa tai valmistusta.

### Dokumentaatiovaikutukset

README ja AGENTS kuvaavat toteutuneen suljetun taskuesikatselun. Tiedostovientiä ei ole toteutettu.

### Riskit

Juurten numeerinen käyttäytyminen päätepisteissä ja tangenteissa on konservatiivisesti tukematon. Adaptiivinen tarkistus on rajatun työn numeerinen tarkistus, ei symbolinen CAD-todistus. Liittyvien segmenttien yhteinen päätepiste sallitaan, muut risteykset eivät. Takanäkymän kaksinkertainen peilaus vältetään pitämällä canvasin normaali runkopolku kanonisena.

### Ratkaisematta jääneet asiat

Ei toteutusta estäviä avoimia asioita. Leikkausrajan käyttöliittymä, pysyvyys, vientiformaatit, PDF ja fyysinen valmistustesti ovat erillisiä vaiheita.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

VOIMASSA: käyttäjän pyyntö “Toteuta sapluunageometria”. Valtuutus kattaa tämän briefin geometrian, esikatselun ja varmennuksen. Git-, julkaisu-, FretFactory- ja tiedostovientilupaa ei ole.

### VERIFICATION LEDGER — sapluunageometria

| Tarkistus / kriteeri | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähtötila | `tmp/template-geometry-baseline` ja hashit | Tallennettu ennen lähdemuutosta | Vertailtava sovellus- ja testilähde | 11.9.2026 | Vain lähtötilana |
| Kohdennettu sapluunageometria | `npx vitest run src/templates/templateGeometry.test.ts src/editor/canvasGeometry.test.ts` | PASS 22/22 | Geometriamoduulin ja canvasintegraation sopimukset | 11.9.2026 / korjattu lähdefreeze | Voimassa ilmoitetuille lähdehashille |
| Yksikkö- ja integraatioajo | `npm run test:run` | PASS 172/172, 23 tiedostoa | Nykyiset sovellussopimukset ja uusi geometria | 11.9.2026 / tuore lähde | Voimassa ilmoitetuille lähdehashille |
| Tyyppi, muotoilu ja build | `npm run typecheck`; `npm run format:check`; `npm run build` | PASS; build `index-ezfH08gp.js` | Rajapinta, aktiivinen muotoilu ja tuotantobundle | 11.9.2026 / source freeze | Voimassa ilmoitetuille lähdehashille ja buildille |
| Riippumaton geometriaprobe | `node tmp/template-geometry-independent.cjs` | PASS 27/27 | Reunaehdot, peilaus, tarkat käyrät, topologia ja muuttumattomuus | 11.9.2026 / korjattu source freeze | Voimassa ilmoitetuille lähdehashille |
| Front/back-regressio ja selaincapture | `node tmp/template-geometry-compare-front-back.cjs`; tuore capture | PASS 104/104; 52 tilaa, console 0, overflow 0 | Front/back säilyy ja selainrenderöinti toimii desktop- ja kapeissa koissa | 11.9.2026 / tuore build | Voimassa buildille `index-ezfH08gp.js` |
| Taskun UI-polut | `tmp/template-geometry-ui-result.json`; tuore 1440/390 selainkoe | PASS | Todellinen cutY, sulkeva alareuna, osumarajaus, virheellinen luonnos ja undo/tallennuspolku | 11.9.2026 / tuore build | Voimassa buildille `index-ezfH08gp.js` |
| Täysi paikallinen selain-E2E | `node node_modules/@playwright/test/cli.js test --workers=2 --reporter=line` | PASS 92/92, 3,8 min, exit 0 | Desktop Edge- ja kapean Chromium-simulaation polut | 11.9.2026 / tuore build | Paikallinen selain; ei Safari/fyysinen/julkaistu |
| Riippumaton QA | `tmp/template-geometry-qa-ledger.md` | VERIFIED; estäviä vikoja ei löytynyt | Lähde-, rajaus-, automaatti- ja selainnäytön katselmus | 11.9.2026 / lopulliset lähdehashit | Voimassa ilmoitetuille lähdehashille |

Ensimmäinen riippumattoman proben korjauskierros palautti 18/23 tarkistusta, koska body-tulos ohitti front/back-validoinnin. Validointi kytkettiin body-tulokseen; tämän jälkeen kohdennettu ajo, koko yksikköajo ja build läpäisivät. Tämä alkuperäinen korjaushavainto ei ole nykyinen avoin vika.

Lähde- ja build-hashit sekä komentotulokset: [worker-ledger](tmp/template-geometry-worker-ledger.md), [root-ledger](tmp/template-geometry-root-ledger.md) ja [riippumaton QA](tmp/template-geometry-qa-ledger.md).


## FEATURE BRIEF — Takapuolen elektroniikkapoteron editointi

Tila: TOTEUTETTU / QA VERIFIED. Päiväys 11.9.2026.

### Tavoite

Taka-näkymässä on valmiiksi sijoitettu potero käyttäjän potero.svg-mallista. Sitä voi valita, siirtää ja venyttää näkyvässä vaaka- tai pystysuunnassa. Kaksi sisäkkäistä suljettua reunaa ovat erillisiä geometrioita, jotka muuttuvat yhtenä kokonaisuutena.

### Ei-tavoitteet

Ei Z-akselia tai jyrsintäsyvyyksiä nyt eikä myöhemmin. Ei solmueditointia, kiertoa, reunojen erillistä muokkausta, vakio-offsetia, sädesäätöä, monen poteron hallintaa, lisää-/poista-toimintoja, kannen/ruuvien/komponenttien suunnittelua eikä valmistusvientiä tässä vaiheessa.

### Käyttäjän vahvistamat päätökset

Käyttäjä vahvisti 11.9.2026: molemmat reunat venyvät yhdessä, myös niiden välinen tukireunus muuttuu; poteroa saa siirtää vapaasti vetämällä. Lähtökohtana on valmiiksi sijoitettu template. Syvyyttä ei mallinneta.

### Sallitut paikalliset oletukset

Hyväksytty potero-SVG-lähde, SHA256 9c487e3094c079ea01ed8a95c809aab440c92b5dc52104e50e3da7a00489f8f8. SVG-arkin 237 × 123 mm ja viewBoxin suhde on 1 yksikkö/mm. Ulompi path1041 on noin 178,7524 × 81,3628 mm; sisempi path1042 noin 159,7120 × 74,6547 mm. Mitat ovat polkujen rajoja, ilman viivan paksuutta. Sisäreuna on lovellinen eikä ulkoreunan vakio-offset.

Yksi oletuspotero uuden projektin takaosaan, lähteen mittakaavassa. Tarkka sijainti valitaan starter-rungon sisälläolon ja visuaalisen sovituksen perusteella ennen vakion lukitsemista; pitkän sivun suunta vastaa Taka-näkymän vaakasuuntaa. Ei automaattista uudelleensijoittelua myöhemmissä runkomuutoksissa. Neljä sivukahvaa, ei kulmakahvoja. Kontekstipaneeli näyttää Vaakamitta- ja Pystymitta-lukemat nykyisessä mm/in-yksikössä; erillisiä numeerisia muokkauskenttiä ei tarvita ensimmäisessä vaiheessa. Nolla/negatiivinen koko ja numeerisesti epäselvä muutos hylätään; komponentteihin perustuvia vähimmäismittoja ei arvata.

### Käyttäytymispolut

1. Uusi projekti sisältää yhden varmennetusti rungon sisään sijoitetun poteron. Potero näkyy vain Taka-näkymässä, myös sen pikkukuvassa.
2. Suuressa Taka-näkymässä poteron sisustan tai reunan valinta korostaa molemmat reunat ja avaa kontekstin sekä neljä sivukahvaa. Kahvoilla on osumaprioriteetti poteron siirtoon nähden. Muu rungon muokkaus säilyy saavutettavana poteron ulkopuolelta tai valinnan poistamisen jälkeen.
3. Sisustan veto siirtää molempia reunoja yhdessä. Valitun poteron nuolinäppäimet siirtävät näkyvän suunnan mukaan 1 mm, Shiftillä 10 mm.
4. Vasemman/oikean kahvan veto muuttaa vaakamittaa, ylä-/alakahva pystymittaa. Vastakkainen sivu pysyy paikallaan; myös keskipiste päivittyy. Kumpaankin polkuun ja kaikkiin Bézier-kontrolleihin käytetään samaa positiivista affine-muunnosta. Lovet, tukireunus ja pyöristykset venyvät mukana.
5. Kahvat voi kohdistaa näppäimistöllä. Kohdistetun kahvan aktiivisen akselin nuolinäppäin muuttaa kyseisen reunan paikkaa 1 mm/Shift 10 mm vastakkaisen reunan pysyessä paikallaan. Kahva erotetaan koko poteron siirtovalinnasta.
6. Poteron oma siirto/venytys rungon ulkopuolelle, vastakkaisen reunan yli tai laskennan toleranssin ulkopuolelle ei korvaa viimeistä kelvollista esikatselua; syy näytetään. Kelvollinen valmis veto on yksi undo-askel. Escape, pointercancel, lost capture, blur, koon/näkymän tai projektin vaihto peruu keskeneräisen eleen.
7. Rungon muokkaus saa jättää poteron ulkopuolelle. Potero näkyy silloin virhekorostuksella ja korjattavalla ilmoituksella; runkomuokkausta ei estetä tämän uuden ominaisuuden takia. Potero ei liiku tai pienene itsestään. Rakenteellisesti kelvollinen projekti säilyy tallennettavana ja avattavana. Potero voidaan siirtää takaisin kelvolliseen paikkaan tai sen kokoa muuttaa kelvolliseksi. Tuleva poterovienti tarvitsee kelvollisen sijoituksen.
8. Etu-/Tasku-näkymä poistaa poteron muokkausvalinnan; pikkukuva vaihtaa näkymän nykyiseen tapaan. Kamera, zoom ja panorointi eivät muuta pysyviä poteron mittoja.
9. Undo/redo ja tallennus/avaus palauttavat sijainnin ja koon täsmällisesti. Poteron ja etupuolen mikrofonikolojen projektiopäällekkäisyys ei ole tässä 2D-mallissa automaattinen valmistusvirhe.

### Muutettavat vastuualueet tai tiedostot

Uusi src/electronicsCavity/ omistaa versionoidun profiilin, kahden polun affine-geometrian ja rungon sisälläolon tarkistuksen. src/model/project.ts ja tiedostoparseri omistavat tallennettavan rakenteen. src/store.ts ja src/store/documentTransactions.ts omistavat valinnan/preview/commit/cancel/undo-siirtymät. EditorCanvas, useCanvasInteractions, ContextTools, tarvittava App-näppäimistökytkentä sekä rajattu CSS omistavat Taka-piirron ja käyttöliittymän. Vastaavat yksikkö-, integraatio- ja E2E-testit sekä toteutuksen jälkeen README/AGENTS/FEATURE_BRIEF.

### Säilytettävät rajat

Yksi kanoninen millimetrimalli, nykyinen back-viewportin peilaus, kamerat, muut muokkauskohteet ja FretFactory säilyvät. Näkyvän Taka-kuvan suunta muunnetaan kanoniseen koordinaatistoon kerran; ei kaksoispeilausta. Poteron kaksi polkua eivät liity rungon ulkoreunan CUT-kontuuriin. Nykyiset etu-/takarunkosapluunat ja kaulataskusapluuna pysyvät ennallaan. Olemassa olevan rungon luonnosvaroituksen karkea näytteistys ei yksin riitä uuden poteron sisälläolon tarkistukseksi.

### Tietomalli- ja rajapintamuutokset

Toteutettu v9: body.rearElectronicsCavity on null tai rakenne, jossa profileId=potero-v1, profileVersion=1, centerXmm, centerYmm, horizontalMm ja verticalMm. Mitat kuvaavat ulomman polun näkyviä vaaka-/pystymittoja; mallin kaksi lähdepolkua säilyvät versionoidussa profiilissa. Tallennus ei sisällä viewport- tai näytön pikselikoordinaatteja.

Nykyisen kehityslinjan mukaisesti vanhojen versioiden migraatiota ei luvata: v8 ja vanhemmat hylätään atomisesti. Vain v9 luetaan. Parseri erottaa rakenteellisen kelvollisuuden sijoitusdiagnostiikasta, jotta runkomuutoksen ulkopuolelle jättämä potero voidaan tallentaa ja korjata.

Puhdas rearElectronicsCavityGeometry palauttaa kaksi erillistä suljettua, roolitettua polkua (outer-recess-boundary ja inner-cavity-boundary), tarkat segmentit/rajat ja sijoitusdiagnostiikan. Geometriat säilyvät virhetilassakin esikatseltavina; kelvollisuutta ei päätellä pelkästä polun olemassaolosta. Tuleva vienti käyttää geometriaa, ei editori-SVG:n takaisin jäsentämistä.

### Toteutusjärjestys

Lähtötila ja ledger → tarkka SVG-profiili ja normalisointi → yhteinen muunnos ja containment → v9/parseri → store-transaktiot → Taka-renderöinti ja neljä kahvaa → konteksti/näppäimistö → peräkkäiset tarkistukset ja riippumaton QA → nykytiladokumentaatio.

### Hyväksymiskriteerit

Yksi kelvollisesti esisijoitettu oletuspotero, kaksi lähteen tarkkaa polkua ja yksi yhteinen muunnos. Näkyminen vain Takana. Siirto ja yhden akselin venytys näkyvissä suunnissa, vastakkainen reuna lukittuna. Hiiri/kosketus/näppäimistö, selkeä valinta, kumottavat hyväksynnät ja kaikki peruutuspolut. Virheellinen poteromuutos ei korvaa kelvollista tilaa. Runkomuutos voi jättää korjattavan poteron muuttamatta sen dataa. Tallennus/avaus säilyttävät myös tämän tilanteen. Ei mittadriftiä eikä muutoksia nykyisiin sapluunoihin.

### Testit ja muut varmennustasot

Profiilin kaksi sulkeumaa, bboxit ja sisäkkäisyys; tarkat kontrollit sekä yhteinen epäsymmetrinen affine-muunnos. Positiivisuus, muuttumattomuus ja vastakkaisen reunan invarianssi. Koveran rungon containment, reunakosketus ja kaarien väliin jäävät leikkaukset; ei pelkkää kulmapisteiden sisälläoloa. Store-preview/commit/cancel/undo/redo ja bodymuutoksen diagnostiikka. V9 roundtrip sekä geometrisesti ulos jäävän mutta rakenteellisesti kelvollisen poteron roundtrip, tuntematon profiili ja vanhan version atominen hylkäys. Tuore Edge-E2E 1440/850/390: siirto, neljä kahvaa, näppäimistö, peilaus, zoom/pan, näkymät, peruutukset, tallennus/avaus, konsoli ja ylivuoto. Komennot projektiprofiilin mukaan peräkkäin. Tämä ei ole fyysisen kannen istuvuuden tai valmistuksen koe.

### Dokumentaatiovaikutukset

Tämä osio on suunnitelma. Toteutuksen jälkeen README kuvaa käyttötoiminnot; AGENTS päivitetään toteutuneelle formaatille ja varmennukselle. Molemmat rajat ja niiden yhteinen venytys dokumentoidaan 2D-geometriana. Nykytiladokumentteja ei päivitetä valmiiksi ennen toteutusta ja QA:ta.

### Riskit

Näkyvien akselien ja back-peilauksen sekoittaminen; resize-ankkurin tai dragin lähtömuunnoksen vaihtuminen eleen aikana; koveran rungon containmentin liian karkea tarkistus; poteron diagnostiikan sekoittaminen tiedoston rakenteelliseen virheeseen. Epäsymmetrinen venytys muuttaa myös pyöristyksiä, joten tässä ei luvata vakiona säilyvää jyrsinteräsädettä. Kahvojen osuma-alue toteutetaan näyttöpikseleinä zoomista riippumatta.

### Ratkaisematta jääneet asiat

Ei käyttäjän lisäpäätöstä vaativia esteitä tällä rajauksella. Tarkka starter-sijainti varmennetaan toteutuksessa; komponentit, kansi, ruuvit ja vienti vaativat erillisen jatkosuunnitelman. Z-akseli ja syvyydet pysyvät poissuljettuina.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

TOTEUTUSVALTUUTUS VOIMASSA. Käyttäjän pyyntö ”Toteutetaan suunnitelma” valtuuttaa tämän briefin toteutuksen ja varmennuksen. Git- tai julkaisutoimia ei ole valtuutettu.

### VERIFICATION LEDGER — suunnittelun lähtönäyttö (historiallinen)

| Tarkistus | Menetelmä | Tulos | Todistettava asia | Ajankohta / lähtötila | Voimassaolo |
| --- | --- | --- | --- | --- | --- |
| Lähde-SVG | XML-luku, SHA256, paikallinen Edge SVG getBBox ja renderöinti | Kaksi suljettua polkua, mitat kirjattu yllä | Lähtömalli ja yksiköt, ei valmistuskelpoisuus | 11.9.2026 / käyttäjän potero.svg | Tälle lähdehashille; tmp/electronics-cavity-source.json ja .png |
| Nykyinen editori | Arkkitehdin lähdekatselmointi | Soveltuvat Taka-/konteksti-/transaktiovastuut tunnistettu | Suunnitelman liitynnät | 11.9.2026 / nykyinen v8 | Suunnittelun lähtötila |
| Ominaisuuden toteutus ja testit | Ei ajettu | EI TOTEUTETTU | Ei toteutus- tai testiväitettä | 11.9.2026 | Avoin erilliselle toteutuspyynnölle |

### Toteutunut paikallinen ratkaisu

Oletuspotero on kohdassa (centerXmm=0, centerYmm=210), näkyvät mitat 178,75241179493025 × 81,36283544639434 mm. Ulko- ja sisäpolun 8/18 tarkkaa segmenttiä säilyvät; Taka-vaaka vastaa kanonista −Y-suuntaa ja Taka-pysty −X-suuntaa. Sijoitus käyttää muunnettujen käyrien adaptiivista litistystä (0,01 mm, syvyys 18, 20 000 pistettä), 0,03 mm kontaktirajaa ja olemassa olevan sapluunageometrian konservatiivista body-topologiatarkistusta. Epävarma tulos ei kelpaa poteron omaksi siirroksi. Parseri sallii rakenteellisesti kelvollisen korjattavan ulkopuolisen sijoituksen.

Viestialue vakautettiin 64 px korkeuteen: tallennusviestin poistuminen kasvatti aiemmin canvasia 609→639 px ja size-effect perui juuri alkaneen vedon. Tarkka pointer/ResizeObserver-trace todisti syyn. Säilytetty kokomuutossuoja peruu edelleen oikean ikkunakoon muutoksen. Poteron diagnostinen teksti näkyy valinnan kontekstissa.

### VERIFICATION LEDGER — toteutuksen lopullinen näyttö

| Tarkistus | Komento tai menetelmä | Tulos | Todistettava asia | Lähtötila / voimassaolo |
|---|---|---|---|---|
| Tyyppi ja build | npm run typecheck; npm run build | PASS, lopullinen index-CjeMIAlp.js | Lähde ja tuotantobundle | 11.9.2026, exit 0; nykyinen lähde |
| Yksikkö/integraatio | npm run test:run | 180/180 PASS, 24 tiedostoa | Geometria, parseri, transaktiot ja regressiot | Root ajo; myöhemmät muutokset vain status-CSS/kontekstiesitys/E2E-odotukset |
| Poteron kohdennettu ajo | Vitest src/electronicsCavity/index.test.ts | 8/8 PASS | Vastareuna, draft-esto, history, valid preview ja sisäkkäisyys | Riippumaton QA, nykyinen logiikka |
| Tarkka lähdevertailu | tmp/electronics-cavity-independent.cjs | 23/23 PASS | Lähde-SVG:n pisteet/kontrollit, muunnos, kovera 0,2 mm lovi, v9 roundtrip ja CUT-erottelu | Nykyinen geometria; electronics-cavity-independent-result.json |
| Käyttöliittymä | tmp/electronics-cavity-ui.mjs, Edge 1440/850/390 | 48/48 PASS, konsoli 0, ei vaakaylivuotoa | Kahvat, nuoli/pointer, undo/cancel, avaus/tallennus | Lopullinen build; electronics-cavity-ui-result.json |
| Koko E2E | Playwright, 2 workeria | 84/96 PASS, 12 versionumeroodotuksen virhettä (6,1 min) | Olemassa olevat polut ja uudet poterotestit | electronics-cavity-e2e.log; ei vihreä täysajo |
| Korjatut E2E-polut | Kohdennettu kuuden testin ajo desktop/mobile | 12/12 PASS (1,2 min), exit 0 | V9-odotuksilla sama tallennus/avauskäyttäytyminen | electronics-cavity-e2e-rerun.log; muu sovelluslähde muuttumaton |
| Lopullinen poteroregressio | Playwright rear-cavity.spec.ts | 4/4 PASS (29 s), exit 0 | Statusviestin jälkeinen veto, kahvat, cancel ja roundtrip | Lopullinen kontekstikorjaus; electronics-cavity-e2e-final.log |
| Riippumaton QA | electronics_cavity_qa | VERIFIED | Brief, lähde, yllä oleva näyttö ja invalid-valinnan korjausohje | electronics-cavity-qa-ledger.md; 11.9.2026 |
| Muotoilu ja scope | npm run format:check; baseline/hashvertailu | PASS; ei vendor/FretFactory-muutoksia | Rajattu muutosjoukko | electronics-cavity-scope.json; repo edelleen untracked |

Ensimmäiset katselmukset löysivät väärät kahvapaikat, kytkemättömän näppäimistökäsittelijän, puuttuvat draft-guardit, epävarman body-topologian sekä statusviestin aiheuttaman veto-peruutuksen. Ne korjattiin ja yllä oleva näyttö korvaa työvaiheiden vanhentuneet väitteet. Pickupin vastaavaa containment-helperiä ei yhdistetty tällä kierroksella; se jää ylläpidettävyysvaroitukseksi. Aiempi raakamuotoinen 52 tilan SVG-pariteetti ei ole tämän kierroksen väite, koska vakioitu footer muuttaa tarkoituksellisesti viewportin kokoa; kanonisen CUT-geometrian säilyminen tarkistettiin erikseen.

Ei valmistusvientiä/artefaktia, fyysistä valmistuskoetta, natiivia Save As -koetta, Safari-/laitekoetta, deployta tai Git-julkaisua. Dokumentaatio synkronoitiin rootin toimesta QA:n jälkeen, koska docs_sync-agentin käynnistys estyi työkalun thread-limitissä.

## FEATURE BRIEF — PDF-, DXF- ja SVG-vienti sekä osittainen tulostus

Tila: TOTEUTETTU JA VARMENNETTU. Tämä osio kuvaa v9-editoriin toteutetun PDF-, DXF- ja SVG-viennin sekä osittaisen 1:1-tulostuksen.

### Tavoite

Yksi Vie / tulosta -ikkuna tuottaa valituista kitaran osista PDF-, SVG- tai DXF-aineiston. Osien järjestys noudattaa CDR-mallia soveltuvin osin. Yksittäisen tai osittaisen valinnan piirustusalue mukautuu valittuun sisältöön pienellä marginaalilla. Mitat tulevat aina hyväksytystä GTRfactory-dokumentista.

### Ei-tavoitteet

Ei Z-akselia, sivuprofiileja, jyrsintäsyvyyksiä, työstöratoja, työkalu-/leikkuurakokorjausta, CDR-vientiä, ajonaikaista CDR-tulkintaa tai optimointia materiaalilevylle. Editorin ruutunäkymää ei tulosteta eikä sen DOMia käytetä vientigeometriana. Projektiformaatin muutosta tai migraatiota ei tarvita.

### Käyttäjän vahvistamat päätökset

PDF, DXF ja SVG kuuluvat samaan vienti- ja tulostusikkunaan. CDR:n erilliset osat ja asemointi ovat lähtökohta. Käyttäjä voi valita esimerkiksi vain otelaudan ja lavan tai kaulan ja rungon ilman otelautaa. Yksittäisten osien tulostusalue mukautuu kappaleen kokoon.

### Sallitut paikalliset oletukset

CDR:n suhteellinen järjestys säilyy, mutta tyhjät osapaikat ja rivit poistetaan. Kiinteää 1300 × 1300 mm lähdearkkia ei käytetä. Osat pidetään vaakasuunnassa, lapa oikealle. Koottu etukuva on valinnainen viitekuva, ei erillinen valmistettava kappale. Toteutuksessa käytettiin pääagentin käyttäjälle ilmoittamaa paikallista oletusta: Kaula sisältää lavan yhtenäisenä kontuurina, ja Lapa on lisäksi erikseen valittava detalji.

Marginaalin oletus on 10 mm, sallittu asetusalue 2–40 mm. PDF:n sivu voi olla kappaleen kokoinen tai A4/A3-sivuihin jaettu 1:1-alue. Tulostuksen sivulimitys on 10 mm; tulostusmarginaali ja limitys erotetaan toisistaan. Nimellismittakaava on aina 1:1, eikä sivulle sovittaminen muuta kappaleen kokoa. Asetukset ovat istuntotilaa eivätkä muuta projektin dirty-tilaa tai undo-historiaa. Yksi vientitoiminto tuottaa yhden valitun formaatin tiedoston.

### Käyttäytymispolut

1. Tiedosto-valikon Vie / tulosta avaa yhden modaalin. Vasemmalla ovat formaatti, osavalinnat ja vain kyseisen formaatin asetukset; oikealla koko aineiston esikatselu, mitat ja PDF-sivumäärä. Alareunassa ovat Peruuta, Tallenna ja PDF:n Avaa PDF tulostettavaksi.
2. Osavalinnat ovat erilliset: Runko — etu, Runko — taka, Kaula, Otelauta, Lapa ja Kaulataskusapluuna. Koottu etukuva on erillinen valinnainen yleiskuva. Oletusvalinnat ja esikatselu ilmaisevat aina tarkasti, mitä tiedostoon tulee.
3. Eturungon sisällöstä voi valita mikrofonikolot. Takarungossa elektroniikkapoteron kaksi reunaa valitaan yhdessä, mutta ne säilyvät erillisinä rooleina. Lavan mukana ovat oletuksena viritinreiät. Keskiviivat, satula-/tallaviite, osanimet, nauhaviivat ja tarkistusmitat ovat erillisiä lisätietovalintoja. Keskiviivat-valinta ohjaa katkoviivaisia keskiviivoja etu- ja takarungossa sekä kaulassa ja otelaudassa; lapa ei saa uutta keskiviivaa. Keskiviivat ovat PDF:ssä oletuksena päällä ja SVG/DXF:ssä oletuksena pois, ja niiden valinta on erillinen satula-/tallaviitteistä ja taskun suukäyristä. Nauhaviiva kuuluu FRET_GUIDE-rooliin, ei otelaudan ulkoreunan CUT-rooliin. PDF-piirustuksessa nauhaviivat ovat oletuksena mukana; koneaineiston SVG/DXF-viitteet valitaan erikseen.
4. Valitsemattomat osat poistuvat ennen sommittelua. Jäljellä olevat osat tiivistetään CDR:n järjestystä noudattaviin riveihin. Osat eivät jää alkuperäisen täyden arkin kaukaisiin koordinaatteihin. Pelkkä lapa tuottaa lavan kokoisen alueen; otelauta ja lapa sommitellaan lähelle toisiaan; kaula ja runko eivät sisällä otelaudan ulkoreunaa tai nauhoja, ellei niitä ole valittu.
5. Ensin lasketaan kunkin valitun osan tarkat rajat, sitten sommittelu, lopuksi koko valitun aineiston rajat ja marginaalit. Valitut tekstit ja kohdistusmerkit huomioidaan, jotta mikään ei leikkaudu. SVG:n viewBox ja fyysiset millimetrimitat sekä PDF:n erikoissivu perustuvat tähän alueeseen. DXF:ssä ei ole vastaavaa paperiarkkia: vain valitut entiteetit ja niitä vastaava rajaus viedään.
6. A4/A3-PDF käyttää saman rajatun alueen laatoitusta, limitystä, kohdistusmerkkejä ja sivutunnuksia. Suuri osa jaetaan sivuille; osaa ei pienennetä paperille. Tarpeettomia tyhjiä sivuja ei tuoteta. Valinnainen 100 mm tarkistusmitta ja tulostusohje kertovat tarkistettavan mittakaavan.
7. Vienti ottaa hyväksytystä documentista muuttumattoman snapshotin. Keskeneräinen veto tai kaulaluonnos on hyväksyttävä/peruttava ensin. Puuttuva tai virheellinen osa näyttää syyn; vain sitä sisältävä vientivalinta estyy. Esimerkiksi virheellinen takapotero ei estä pelkän kelvollisen otelaudan vientiä.
8. Tulosta käyttää samaa generoituvaa PDF-aineistoa ja avaa sen tulostettavaksi. Sovellus ei lupaa pakottaa tulostinajurin asetuksia. Käyttäjälle näytetään 100 % / Todellinen koko -ohje. Tulostusikkunan avautuminen ei ole todiste paperitulosteen mitasta.
9. Peruuttaminen ei lataa tiedostoa eikä muuta projektia. Muuttuneet osavalinnat päivittävät esikatselun ja sivumäärän ennen latausta.

### Mittatietolaatikko

Käyttäjän vahvistama lisäys: tulosteeseen ja vientitiedostoon saadaan kitaran mitat siistinä listana kehystettyyn laatikkoon. Tämä on toteutettu ominaisuus.

Vienti-ikkunan Mittatiedot-valinta näyttää tai piilottaa laatikon ja päivittää esikatselun. Paikallinen oletus: PDF:ssä laatikko on mukana oletuksena; SVG:ssä ja DXF:ssä sen saa erikseen mukaan. Laatikon oletussisältö rajautuu valittuihin osiin. Valinnainen Koko kitaran mittatiedot näyttää myös muiden osien tiedot, selvästi otsikoituna, tuomatta niiden piirustusgeometriaa vientiin.

Ehdotettu sisältö ryhmitellään osittain: rungon pituus ja suurin leveys; kaulan mensuuri (moniskaalassa molemmat reunamensuurit), kielimäärä, nauhamäärä, leveys satulalla ja kantapäässä sekä fyysisen kaulan pituus; otelaudan pituus, leveys satulalla ja rungonpuoleisessa päässä sekä oma päätyvara; lavan pituus, suurin leveys ja viritinreikien halkaisija; taskusapluunan yhteydessä taskun pituus, suu- ja päätyleveys sekä päätykulmien säde. Kaulan päätyvara ja otelaudan päätyvara nimetään erikseen. Vain mallista luotettavasti johdettavat arvot näytetään; puuttuva mitta jätetään pois. Ei paksuuksia, jyrsintäsyvyyksiä tai muita Z-mittoja.

Pituus ja leveys mitataan osan omassa pitkittäis- ja poikittaissuunnassa ennen arkkiasettelua. Kaulan pituuden otsikko kertoo, sisältyykö lapa siihen lopullisen osasopimuksen mukaan. Kaikki tiedot johdetaan samasta hyväksytystä dokumenttisnapshotista kuin vientigeometria. Laatikolla on yksi yksikkövalinta: mm, tuuma tai molemmat. Esitystarkkuus on alustavasti 0,1 mm / 0,001 tuumaa; tekstin pyöristys ei muuta geometriaa eikä ilmaise valmistustoleranssia.

Laatikko sijoitetaan osien viereen tai alle ilman päällekkäisyyttä. Sen otsikot, lukuarvot ja kehys lasketaan mukaan lopulliseen vientialueeseen marginaaleineen; kappaletta ei koskaan pienennetä laatikon mahduttamiseksi. Pienen osan yhteydessä laatikko voi siten kasvattaa arkkia. A4/A3-PDF:ssä laatikko pidetään kokonaisena yhdellä sivulla, tarvittaessa erillisellä tietosivulla, jotta luettava lista ei katkea sivusaumaan. Tämä tietosivu näkyy esikatselussa ja sivumäärässä.

ExportDrawing saa mittatietorivit ja niille erillisen REFERENCE_DIMENSIONS-roolin. Teksti ja laatikon kehys pysyvät erillään leikkaus-, poraus- ja jyrsintärooleista myös SVG/DXF-tiedostoissa.

Hyväksymiskriteerit ja varmennus täydentyvät: mittatietojen päälle/pois, yksittäisosan rajaus, koko kitaran tiedot ilman lisägeometriaa, yksiköt, pyöristys, moniskaalan kaksi mensuuria sekä erilliset päätyvarat tarkistetaan mallia vasten. Oikeista artefakteista tarkistetaan tekstin ja kehyksen mukanaolo, viiterooli, luettavuus, rajaus ja PDF:n ehjä laatikko. Mittatietojen muuttaminen ei muuta dokumenttia, geometriaa, mittakaavaa tai undo-historiaa.

### Muutettavat vastuualueet tai tiedostot

Toteutetut moduulit: src/export/model.ts, math.ts, geometry.ts, layout.ts, pages.ts, svg.ts, dxf.ts ja pdf.ts. ExportDialog omistaa istunnon vientiasetukset, FileActions yhteisen avausreitin. Nykyisiä templates-, neck-, headstock-, pickup- ja electronicsCavity-moduuleja täydennetään vain puuttuvien tarkkojen geometriarajapintojen osalta.

### Säilytettävät rajat

Hyväksytty kanoninen millimetrigeometria on ainoa mittalähde. Zoom, kamera, viivottimet, valintakahvat, haamukuva ja keskeneräinen preview eivät vaikuta vientiin. Etu-/takasapluunoiden peilaus tapahtuu kerran. CDR ohjaa asettelua, ei viedyn kitaran skaalaa. FretFactory/vendor ja v9-projektin tallennus/avaus säilyvät.

### Tietomalli- ja rajapintamuutokset

ExportDrawing sisältää valitut osat, niiden sijoitukset sekä viiva-, kuutio-Bézier-, ympyräkaari- ja ympyräentiteetit. Osalla on tunniste ja nimetty sisältörooli: CUT_OUTER, ROUTE_PICKUP, ROUTE_REAR_INNER, ROUTE_REAR_RECESS, DRILL_TUNER, FRET_GUIDE, REFERENCE, REFERENCE_CENTERLINE ja REFERENCE_DIMENSIONS. Keskiviiva käyttää SVG:ssä `stroke-dasharray=6 3`, PDF:ssä 6/3 mm:n katkoviivaa ja DXF:ssä `REFERENCE_CENTERLINE`-tasoa sekä `GTR_CENTERLINE`-viivatyyppiä (6 mm viiva, 3 mm väli). Kaulataskusapluunan yhtenäinen leikkauspolku käyttää CUT_OUTER-roolia; suukäyrät ovat viitteitä. Koottu yleiskuva ei saa muodostaa tahattomia kaksoisleikkuuratoja.

Nykyinen neckView.outlinePath kuvaa otelautaa. Fyysinen kaula johdetaan physicalHeel-profiilista ja otelauta physicalFretboard-profiilista; päätyvarat säilyvät erillisinä. Kaula+lapa-yhteiskontuuri liitetään tarkasta satularajasta ilman sisäistä poikkileikkausviivaa. Pickupin nykyistä path+samples-esitystä täydennetään tarkalla segmenttijonolla; näytepisteitä ei käytetä tarkkojen käyrien korvaajana DXF:ssä.

SVG sisältää fyysiset mm-mitat ja nimetyt ryhmät. DXF sisältää mm-yksikön, nimetyt tasot ja tarkat LINE/ARC/CIRCLE/SPLINE-entiteetit; jatko-ohjelman SPLINE-tuki varmennetaan. PDF säilyttää vektorit ja käyttää sivukoordinaattimuunnosta. Ympyräkaaren PDF-esityksen mahdollinen Bézier-approksimaatio on rajattava dokumentoituun toleranssiin, alustavasti enintään 0,01 mm.

### Toteutusjärjestys

Toteutunut järjestys: kaula–lapa-osasopimus → yhteinen geometriamalli ja osasopimukset → pickupin tarkat segmentit → osavalinnan sommittelu ja rajaus → SVG → DXF → PDF/sivutus → yhteinen modaali ja lataus/tulostus → artefakti- ja selainvarmennus → dokumentointi. PDF käyttää pdf-lib 1.17.1:tä erikseen ladattavana moduulina. SVG ja DXF muodostetaan yhteisestä analyyttisesta geometriasta.

### Hyväksymiskriteerit

Jokainen yksittäinen osa ja käyttäjän kaksi esimerkkivalintaa viedään ilman valitsemattomia osia tai tyhjiä paikkoja. Kaikki formaatit vastaavat samaa millimetrimallia ja sijoittelua. Fyysinen kaula ei käytä otelaudan pidempää päätyä. A4/A3-jako ei muuta mittakaavaa, leikkaa sisältöä tai lisää tyhjiä sivuja. Viitteet, poraukset ja jyrsittävät kontuurit erottuvat koneellisesti. Virheellinen osa voidaan poistaa valinnasta muiden viennin jatkamiseksi. Vienti ei muuta dokumenttia tai historiaa. Keskiviivan valinta piirtää tai piilottaa kaikki kyseisen vientipiirustuksen keskiviivat yhdessä; keskiviiva on katkoviiva etu- ja takarungossa, kaulassa ja otelaudassa, eikä muutos lisää lapaan keskiviivaa.

### Testit ja muut varmennustasot

Yksikkötestit: tarkat pääte-/kontrollipisteet, kaula–lapa-sauma, erilliset päädyt, 6/7/8 kieltä ja moniskaalakaula, symmetriasta poikkeavat osat, molemmat takapoteron reunat sekä yksittäis-/osittais-/täydet osavalinnat. Layout-testit todistavat rajauksen ja tyhjien paikkojen poistumisen.

Ladatut artefaktit luetaan riippumattomasti takaisin: SVG:n mm/viewBox/ryhmät, DXF:n yksiköt/tasot/käyrät/extents, PDF:n MediaBoxit, sivumäärä, vektorit, limitys ja tarkistusmitat. E2E tarkistaa modalin, osavalinnan, esikatselun, keskiviivan päälle/pois-valinnan, virheeston, peruutuksen ja todelliset lataukset sekä PDF-tulostusreitin. Paikallinen paperituloste mitataan erikseen ennen fyysisen 1:1-tulostuksen onnistumisväitettä.

### Dokumentaatiovaikutukset

Vienti toteutettiin ja riippumaton QA hyväksyi sen 12.9.2026. README ja AGENTS on synkronoitu tähän nykytilaan. Fyysinen paperimittaus, natiivi Save As, kolmannen osapuolen CAD-tuonti, julkaistu ympäristö ja deploy ovat edelleen erillisiä varmentamattomia tasoja.

### Riskit

Satulasauman väärä yhdistäminen, fyysisen kaulan sekoittuminen otelautaan, kaksinkertainen takapeilaus, DXF:n SPLINE-tuen vaihtelu, viitteiden tulkitseminen koneessa työstöksi sekä tulostinajurin skaalaus. Asettelusta poistettavat osat eivät saa jättää näkymättömiä entiteettejä tai kasvattaa rajausaluetta. Pitkät osanimet eivät saa muuttaa kappaleiden skaalaa.

### Ratkaisematta jääneet asiat

Ei tämän v1-toteutuksen kannalta avoimia sisältöpäätöksiä. Kaula sisältää lavan yhtenäisenä puuosana, ja Lapa voidaan viedä lisäksi erillisenä detaljina.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö

TOTEUTUSVALTUUTUS KÄYTETTY. Käyttäjän pyyntö “Toteutetaan ensimmäinen versio”, jota seurasi keskeytyksen jälkeen “Jatka siitä mihin jäätiin”, valtuutti tämän vientiversion toteutuksen. Valtuutus ei kata Git-, julkaisu- tai deploy-toimia.

### VERIFICATION LEDGER — suunnittelun lähtönäyttö (historiallinen)

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Repo ja manifesti | Git root ja package.json | Repositorion juuri, React/TS/Vite/Zustand | Tämä suunnittelukierros |
| CDR-asemointi | RG HT HH AANJ ja RGR FR HS alkuperäiset embedded-esikatselut | Koottu etukuva ylinnä, taka vasemmalla, detaljit oikealla, otelauta ja kaula alempina vaakariveinä | Vain asettelun esikuva |
| Lähteen skaala | reference-analysis/README.md ja conversion-evidence.json | 1300 mm lähdearkki ja aiempi SVG-mittakaavaero | Mitat otetaan GTRfactoryn mallista |
| Geometriarajapinnat | feature_architect, vain luku -kartoitus | Fyysinen kaula/otelauta erilliset; pickupin tarkka vientirajapinta puuttuu | Nykyisen koodin suunnitteluhavainto |
| Formaatit | Alla olevat ensisijaiset lähteet | Yksiköt, SVG-alue, DXF-entiteetit ja PDF-tulostusraja | Ei toteutus- tai artefaktivarmennusta |

Lähteet: [SVG:n koordinaatit ja yksiköt](https://www.w3.org/TR/SVG/coords.html), [DXF HEADER / INSUNITS](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm), [DXF SPLINE](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm), [Adobe: suurten PDF-piirustusten tulostus](https://helpx.adobe.com/acrobat/desktop/print-documents/set-up-and-print-pdfs/large-documents.html).


### VERIFICATION LEDGER — toteutunut vientiv1

| Tarkistus | Menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Sovelluksen testit ja tyyppitarkistus | `npm run test:run`, `npm run typecheck`, `npm run format:check`, `npm run build` | 195/195 testiä 25 tiedostosta PASS; 23/23 vientivariaatiota PASS; tyyppi-, muotoilu- ja build-tarkistus PASS | 12.9.2026, voimassa lähdekoodin säilyessä |
| Selainpolku | `npx playwright test tests/e2e/export.spec.ts` | 4/4 PASS desktop- ja mobiilikoolla; modal, osavalinta, mittayksiköt, lataukset, PDF-sivumäärä, peruutus ja tyhjävalinta tarkistettu; ei selainvirheitä tai vaakavuotoa | 12.9.2026, paikallinen Edge/Chromium-simulaatio |
| Ladatut artefaktit | Riippumaton ezdxf 1.4.4-, pypdf- ja pdfplumber-tarkistus | 14/14 artefaktia luettiin; SVG:n fyysiset mm-mitat/viewBox, DXF:n INSUNITS=4/tasot ja PDF:n vektori-MediaBoxit hyväksyttiin; 426 DXF-segmenttiä täsmäsi mallin kontrollipisteisiin, päätepisteisiin ja säteisiin | 12.9.2026, voimassa artefaktigeneraattorin säilyessä |
| Mittatietolaatikko ja sivutus | Ladattujen SVG/DXF/PDF-tiedostojen rakennetarkistus ja Poppler-esikatselu | Mittalaatikko, valittujen osien mukainen rajaus, A4/A3-sivutus, limitys ja luettavuus tarkistettu | 12.9.2026, paikallinen artefaktivarmennus |
| Tulostusraja | `tmp/export-v1/print-route.json`, selainkoe ja E2E | Dev-palvelimen popup navigoi generoidun blob-PDF:n selaimen PDF-katselimeen; consoleErrors=[]; 100 % / Todellinen koko -ohje näytetään. Tulostinajuria, natiivia Save As -dialogia tai paperin mittaa ei väitetä hallituksi | 12.9.2026, paikallinen selainpolku |

Varmennusledgerit: `tmp/export-v1/root-ledger.md`, `tmp/export-v1/qa-ledger.md` ja `tmp/export-centerlines/artifact-check.json`. Keskiviivojen vientikohtainen ajo 24/24, E2E 6/6 desktop- ja mobiilikoolla, typecheck ja build läpäisivät; artefaktitarkistus varmisti kuusi DXF-keskiviivaentiteettiä sekä PDF:n kuusi katkoviivapolkua valinnan ollessa päällä ja nolla valinnan ollessa pois ja visuaalinen PDF-renderöinti hyväksyttiin. Riippumaton QA on merkitty tilaan VERIFIED. Fyysinen paperituloste, kolmannen osapuolen CAD-ohjelma, julkaistu ympäristö ja deploy ovat edelleen varmentamatta.


Nykyisen PDF-esikatselun sivukortit näyttävät sivunumeron, paperikoon sekä rivin ja sarakkeen. Sivurajojen päällekkäiskuva ei kuulu tähän toteutukseen. A4/A3-suunnitelma rajaa ehdokassivujen määrän 500:aan; suurempi aineisto ohjataan pienempään osavalintaan tai kappalekokoiseen PDF:ään.


## FEATURE BRIEF — Bassolavat 4 ja 5 kielelle (13.9.2026)

Tila: **TOTEUTETTU JA PAIKALLISESTI VARMENNETTU**, QA VERIFIED (13.9.2026). Toteutusvaltuutus: käyttäjä pyysi "Kokeillaan toteuttaa nelikielisen basson ja viisikielisen basson lavat" aiemman mitoitusristiriidan ja kielten suoruuden käsittelyn jälkeen.

### Tavoite
Lisää hyväksytyn bassolapa-SVG-lähteen perusteella kaksi erillistä valittavaa ja nodeilla muokattavaa bassolapaa yhteiseen etunäkymään. Vaihto sovittaa kaulan, otelaudan, taskun ja tallalinjan atomisesti.

### Ei-tavoitteet
Ei Z-akselia, valmistuskelpoisuuden lupausta, Hipshot D-Tunerin erillistä sovitusmallia, uusia bassomikrofonikoloja, FretFactory-vendorin muutoksia tai yleistä SVG-tuontia. Ei vanhojen formaattien migraatiolupausta.

### Käyttäjän vahvistamat päätökset
Nelikielisen satulaleveys 42–44,5 mm. Reiät saavat siirtyä suorien kielten sovituksessa. Viisikielinen on erillinen malli. Kielen suora tallalta satulan kautta pylvään tangentille on pakollinen. Bassosta kitaralapaan palautetaan template-asetukset, ei vanhoja kitaraedittejä. Soittimen vaihto vaatii vahvistuksen.

### Sallitut paikalliset oletukset / ratkaistu DESIGN DEVIATION
Täsmällisesti tasavälinen 47,6 mm reikärivi ja kiinteä noin 13,9 asteen kulma eivät toteuta viisikielisen suoruutta normaalilla satulalla. Viimeisimmän kokeiluluvan ja käyttäjälle kerrotun ratkaisun perusteella suoruus sekä koneistojen mahtuvuus määräävät kulman, epätasaiset reikävälit ja tarvittavan pidennyksen. 47,6 mm on lähteen nimellinen/minimiväli, ei vaatimus kaikille väleille. Näytä johdetut arvot käyttäjälle; älä väitä tasavälisyyttä. Käytä erillistä Gotoh GB2:n 2D-suunnitteluprofiilia (pylväs Ø14, holkin runko Ø17,6, laippa Ø22, levyn ulkomitat 43×46 mm); konservatiivinen envelope voi kasvattaa lapaa. Piirustus: https://g-gotoh.com/images/pdf/GB2-Dim.pdf. Hipshotia ei varmenneta.
Nelikielinen lähtökohta: mensuuri 863,6 mm, 21 nauhaa, satula 44,5 mm, leveys 12. nauhalla 57,6 mm, tallakielijako 19 mm. Viisikielinen sovellettu lähtökohta: sama mensuuri/nauhamäärä, satula 47,6 mm, säätöalue 43–47,6 mm, tallakielijako 18 mm; fyysisen levenemisen viitemitta johdetaan ja dokumentoidaan Yamaha BB435:n 43/63,9 mm vertailusta. Alkuperäinen Attitude ei ole viisikielinen valmistajamalli. Kolmen millimetrin reunavara on suunnitteluoletus, ei valmistajan toleranssi. V1-bassopresetissä mensuuri, nauhamäärä, kielimäärä ja tallajako voidaan pitää lukittuina; sijoitus ja pääty/sovitusasetukset jäävät muokattaviksi.

### Käyttäytymispolut
Lapavalikko → bassomalli → selkeä vahvistus → koko ehdokasdokumentti yhtenä undo-askeleena. Peruuta ei muuta mitään. Bassosta kitaralapaan vahvistus palauttaa 6 kieltä / 647,7 mm / 22 nauhaa ja valitun kitaralavan oletusgeometrian sekä normaalit kaulan pääty-/sijoitusasetukset. Säilytä rungon oma muoto, keskimmäinen kiinteä node ja kolot; sovita taskuliittymä uudelleen. Muutokset mittakentissä tai ristiriitainen import eivät tee piilokonversiota. Avaa validoi ensin; undo/redo palauttaa täyden tilan; uusi projekti pysyy oletuskitarana. Bassolavan vapaita nodeja/kahvoja voi siirtää, lisätä ja poistaa nykyisin elein, suojattu satulaliittymä ja viritinreuna säilyvät.

### Muutettavat vastuualueet tai tiedostot
Headstock-profiilit/kanoninen solmuketju/solver/fit, neck-parametrien ja fyysisen profiilin erottelu, model/project ja projectFile, store/neck-transaktiot, HeadstockTools/NeckWorkspace, vientigeometrian ja mittatietojen kytkentä. Relevantit unit/integration/E2E-testit. Ei muita refaktoreita.

### Säilytettävät rajat
Millimetrit kanonisena yksikkönä, tarkat suljetut kontuurit, yksi suojattu body-keskinode, erilliset kaulan/otelaudan päätyvarat, viimeinen nauha fyysisen kantapään sisällä, nykyiset kitaralavat/eleet/viennit. Vain yksi kirjoittava agentti kerrallaan. Ei commit/push/deploy.

### Tietomalli- ja rajapintamuutokset
Versionoitu bassoprofiili ja instrumenttipolitiikka; fyysiset kaulareunat erilleen kielilinjoista, jotta 44,5/57,6/19 mm toteutuvat yhdessä. Uusi projekti v10 / headstock v3, ei hiljaista v9:n uudelleentulkintaa. Yhteinen validointi UI-, draft-, suora store-, import- ja parse-poluille. Persistoi kanoniset käyttäjämuokkaukset; laske johdettu geometria deterministisesti.

### Toteutusjärjestys
1) Puhdas bassogeometria ja suljettu lähdeketju + tangentti/mahtuvuuskokeet. 2) Fyysinen kaulaprofiili ja invariantit. 3) Atominen vaihtopolku ja UI. 4) Tallennus/avaus/undo ja vienti. 5) Kohdennettu sekä regressiovarmennus, riippumaton QA ja nykytiladokumentointi.

### Hyväksymiskriteerit
Molemmat vaihtoehdot toimivat oletusmitoilla ja satularajojen päissä. Kielen sivukulma satulalla enintään numeerinen toleranssi 0,00001 astetta (testaa vektorit ristitulolla, älä vain acos). Kieli sivuaa oikeaa Ø14 pylvästä eikä osu muihin pylväisiin; reiät/pohjalevyt mahtuvat ja koneistot eivät leikkaa. Solmiketju sulkeutuu täsmällisesti, ei nollasegmenttejä tai itseleikkausta. UI-vahvistus/cancel, yksi undo/redo, suojatut/vapaat nodet, molempien mallien säätörajat ja virheellinen import/avaus. Fyysinen kaulaleveys osuu ilmoitettuihin viitemittoihin ja tasku seuraa sitä. Vientien porausympyrät ovat bassoprofiilin mittaisia ja neck/headstock/fretboard-kontuurit jatkuvia. Kitararegressiot pysyvät voimassa.

### Testit ja muut varmennustasot
Peräkkäin repojuuressa: typecheck, relevantit Vitest-testit ja täysi test:run, format:check, build, relevantit Edge-E2E:t tuoreesta 4174-buildista; puhdas runtime/konsoli, desktop ja kapea Chromium-simulaatio. Oikeat SVG/DXF/PDF-artefaktit ja visuaalinen tarkistus. Riippumaton qa_verifier. Fyysinen valmistus/printtimittakaava/Hipshot/CAD-GUI eivät ole tästä todistettuja.

### Dokumentaatiovaikutukset
README/FEATURE_BRIEF/AGENTS kuvaavat vasta QA:n jälkeen toteutuneen v10:n, bassomallit, johdetun ei-tasavälisen reikärivin, rajoitukset ja validointinäytön. Säilytä aiempi näyttö historiallisena.

### Riskit / ratkaisematta jääneet asiat
Konservatiivinen GB2-envelope voi pidentää erityisesti kapeasatulaista viisikielistä lapaa. Kerro todellinen lopputulos, älä piilota sitä. Kitaran kolot voivat muuttua bassolle sopimattomiksi; älä poista automaattisesti tai lupaa niille bassovastaavuutta. Varsinaiset toleranssit ja fyysinen valmistus vaativat erillisen varmennuksen. Käyttäjän lisäpäätöstä ei tarvita tähän kokeiluun näillä ilmoitetuilla oletuksilla.

### VERIFICATION LEDGER
Lähtötila 13.9.2026: repo/package tarkistettu; kaikki tiedostot vielä Gitissä untracked. SHA256-lähtövertailu tmp/bass-headstocks/baseline.json. Gotoh GB2:n virallinen PDF ladattu ja renderöity tmp/bass-headstocks/gb2.png; pylväs-, holkki-, laippa- ja levymitat luettu kuvasta. Tämä lähtötilamerkintä edeltää alla olevaa toteutuksen varmennusta.


### Toteutunut käyttäytyminen ja vastuut

Lähdeketjun kuusi kuutiollista Bézier-segmenttiä sekä suora viritinreuna on yhdistetty suljetuksi kontuuriksi. Affiininen muunnos ja sen käänteinen muunnos säilyttävät lähdekäyrät ja kanoniset node-/kahvamuokkaukset. Suojatut lähtösolmut ovat 0/1/2/3/7; 4/5/6 ja vapaan kaaren liittymäkahvat ovat muokattavia. Uusia vapaita solmuja voi lisätä ja poistaa.

Nelikielisen preset on 863,6 mm / 21 nauhaa / satula 44,5 mm (rajat 42–44,5), leveys12. nauhalla 57,6 mm ja tallajako 19 mm. Viisikielisen preset on 863,6 mm / 21 nauhaa / satula 47,6 mm (rajat 43–47,6), leveys12. nauhalla 63,9 mm ja tallajako 18 mm. Nämä ovat sovelluksen lähtöarvoja; viisikielinen ei ole alkuperäisen valmistajan mallikopio. Nut width säätää kokonaisleveyttä. Reunavara 3 mm per puoli, anchorFret 7 ja curvedExponent 1 sekä kielimäärä/mensuuri/nauhamäärä/tallajako ovat lukittuja. Fyysinen profiili johdetaan satulasta ja 12. nauhan leveydestä; kielten laskentapisteet pysyvät erillään puureunoista. Tasku ja vientikontuurit käyttävät tätä yhteistä fyysistä geometriaa.

GB2-sovitus käyttää Ø14 pylvästä, Ø17,6 porausta, Ø22 laippaa sekä nimellistä levy-/akseli-/nappulaprofiilia. Suorat kielitangentin suunnat ovat pakollisia; rivi on kollineaarinen ja väli vähintään 47,60075 mm. Solver etsii suurimman sallitun kulman 3–20 asteen väliltä. Oletusten rivikulmat ovat noin 13,640° ja 9,118°, minimi–maksimivälit noin 47,601–53,553 mm ja 47,601–66,222 mm. Muoto pitenee tämän mukaisesti. Käyttöliittymä näyttää kulman/välit ja oikean GB2-nimikkeen; kaikki mahtuvuus-, törmäys- ja kielen etenemistarkistukset ovat käytössä.

Bassomallien vaihto ja kitara↔basso pyytävät vahvistuksen; peruutus ei muuta dokumenttia ja hyväksyntä on yksi undo-askel. Sama aktiivinen malli ei nollaa muokkauksia. Kitaraan paluu palauttaa valitun kitaralavan oletusgeometrian, 6/647,7/22-parametrit, sijoituksen 17/0, päätyvarat 10/16,35 mm, säteen 6 mm ja kokonaisvälyksen 0. Fyysinen bassoprofiili poistuu. Rungon oma muoto ja kolot säilyvät automaattista suuliittymän sovitusta lukuun ottamatta. UI estää basson FretFactory-tuonnin; store ja parser hylkäävät ristiriitaiset muutokset. Vain projektin v10 ja headstock v3 luetaan, ilman v9-migraatiota.

### VERIFICATION LEDGER — toteutus 13.9.2026

| Tarkistus | Komento tai menetelmä | Tulos ja todistettava asia | Lähtötila ja voimassaolo |
|---|---|---|---|
| Tyyppitarkistus ja build | `npm run typecheck`; `npm run test:e2e` sisältää `tsc -b` ja Vite-buildin | PASS; lopullinen index-DDP25D4i.js / pdf-OYGp8G2J.js | Lopullinen lähdekoodi; voimassa |
| Yksikkö-/integraatiotapaukset | `npm run test:run`, sitten `npm run test:run -- src/export/bassExport.test.ts` | 236/238 + 2/2 PASS: uudet vientiodotukset korjattiin huomioimaan sekä kokonaisen kaulan että erillisen lavan reiät. Yhdistetty 238 tapauksen näyttö, ei yksi vihreä täysajo | 13.9.; myöhemmät paikalliset guard/footer-korjaukset varmennettiin alla |
| Riippumaton QA | `qa_verifier`, lähdekatselmus ja viiden relevantin Vitest-tiedoston ajo | VERIFIED; 31/31 PASS, basson raja-arvot, tangentit, fyysiset leveydet, kanoninen editointi, preset-vaihto, parser ja vienti | Lopullinen lähdekoodi; medium (roolin kiinteä asetus) |
| Muotoilu | Riippumaton `npm run format:check` | PASS kaikissa projektin määrittämissä kohteissa | Lopullinen lähde/testit; dokumentit eivät kuulu Prettier-rajaukseen |
| Koko paikallinen E2E | `npm run test:e2e` | 128/132 PASS. Neljä basson UI-polkua epäonnistui vanhan 6/7/8-nodevalintarajan vuoksi; tämä ajo ei yksin ole vihreä | Vanha guard; neljä polkua korvattu alla |
| Korjattu UI ja kitararegressio | Tuore build + `tests/e2e/bass-headstocks.spec.ts tests/e2e/headstock-variants.spec.ts` | 10/14 PASS: valintaguard ja GB2-footer korjattu. Neljä jäljelle jäänyttä testiä vaati virheellisesti IEEE-tarkan 5 mm arvon yksikkökierroksen 5,00000000001 mm:n sijasta | Sama lopullinen build kuin viimeisessä ajossa |
| Lopulliset bassopolut | `playwright test tests/e2e/bass-headstocks.spec.ts --grep 'confirmation, edits'` | 4/4 PASS (33,7 s), numeerinen toleranssi 5e-10 mm. Molemmat bassot desktop/mobiili: vahvistus/peruutus, 4↔5, kitaraan paluu, nodejen suojaus/lisäys/poisto/undo/redo, satularajat, Fit ennen satulamuutosta, yksiköt, oikea v10-lataus ja uudelleenavaus | Lopullinen build; yhteensä 132 uniikkia E2E-polkua katettu yhdistetyillä ajoilla, ei yksittäinen vihreä täysajo |
| Todelliset vientiartifaktit | Riippumattomat XML-, ezdxf-, pypdf- ja pdfplumber-lukijat | 18/18 PASS: kuusi yhdistelmävientitiedostoa ja 12 selaimesta ladattua erillislapaa. SVG-mm/viewBox, DXF-mm ja 0 audit-korjausta, reikämäärät ja Ø17,6 mm, vektori-PDF:n todelliset ympyrämitat/sivukoko | Lopullinen vientigeometria; ei ulkoisen CAD-GUI:n tai paperin näyttöä |
| Visuaalinen tarkistus | Pääagentin desktop 5/mobile 4-kuvat ja Poppler-renderöidyt yhdistelmä- ja erillislapa-PDF:t | PASS: jatkuvat ääriviivat, luettava mittalista, 4/5 porausta ja kontekstityökalut. QA-agentin oma image-open estyi hostin ACL-apurissa; pääagentti avasi kuvat toimivalla reitillä | Paikallinen selain ja artefaktit |
| Käynnistys | Piilotettu Node/Vite-prosessi oikeassa repossa, HTTP-pyyntö 5174 | HTTP 200; ohjelma jätettiin paikallisesti käyntiin | 13.9.; palvelimen tila voi myöhemmin muuttua |

Tarkat paikalliset todisteet: `tmp/bass-headstocks/root-ledger.md`, `qa-ledger.md`, `artifact-audit.json`, `e2e.log`, `e2e-correction.log`, `e2e-final.log` ja `artifacts/`. Pääagentti tarkisti lopulliset dokumenttimuutokset. docs_sync-agentin hostityökalut estyivät; pääagentti viimeisteli synkronoinnin kirjoitusvastuun siirron jälkeen. Ei fyysisen laitteen, valmistuksen, tulostusmittakaavan, Hipshotin, natiivin Save As -dialogin, CAD-GUI:n tai julkaistun ympäristön näyttöä. Ei commitia, pushia tai deployta.

## FEATURE BRIEF — Viisikielisen bassolavan poisto (14.9.2026)

**Tila: TOTEUTETTU — riippumaton QA VERIFIED.**

### Tavoite
Poistaa `bass-5-inline` sovelluksen ajonaikaisista malleista, valikosta, viennistä ja testeistä. Tuettuina jäävät kolme kitaralapaa ja `bass-4-inline`.

### Ei-tavoitteet
Ei nelikielisen geometrian, vendorin, yleisen 1–12-kielisen kaulan, formaattiversion, riippuvuuksien tai refaktoroinnin muutoksia.

### Käyttäjän vahvistamat päätökset
Käyttäjän pyyntö “Poistetaan viisikielinen bassolapa kokonaan pois ja tuetaan vain nelikielisten bassojen rakentamista” valtuuttaa toteutuksen.

### Sallitut paikalliset oletukset
V10/headstock-v3 säilyy. Passiivinen vanha `bass-5-inline`-variantti voidaan lukea vain ylimääräisenä avaimena ja poistetaan palautetusta dokumentista; aktiivinen viisikielinen hylätään ilman muunnosta.

### Käyttäytymispolut
Valikko tarjoaa vain nelikielisen basson; kitara↔bass4-vahvistus, peruuta, undo ja kitaran oletuspaluu säilyvät. Vanha tuettu kitara- tai bass4-projekti avautuu ja tallentuu neljällä variantilla. Aktiivinen tai tuntematon ylimääräinen malli, puuttuva tai virheellinen nykyvariantti hylätään ennen store-korvausta.

### Muutettavat vastuualueet tai tiedostot
Bassopresetit ja variantit, projektiparseri, headstock-UI/status sekä kohdistetut yksikkö-, integraatio- ja E2E-testit.

### Säilytettävät rajat
Bass4:n 42–44,5 mm satula, 34 in/21 nauhaa, 57,6 mm 12. nauha, 19 mm tallajako, 3 mm reunavara, GB2-tangentit/editointi/vienti sekä kitararegressiot säilyvät.

### Tietomalli- ja rajapintamuutokset
Kirjoitettu v10 sisältää neljä tuettua varianttia. Lukija sallii vain passiivisen vanhan `bass-5-inline`-avaimen lisäavaimena; muita lisäavaimia ei sallita.

### Toteutusjärjestys
Brief → malli/UI/parseri → regressiot → typecheck, täysi unit, format ja kohdennettu E2E → worker-ledger.

### Hyväksymiskriteerit
Neljä mallia serialisoituu; bass4 ei konfiguroi viittä kieltä; vanha passiivinen avain puhdistuu; aktiivinen viisikielinen hylätään atomisesti; bass4:n geometria ja SVG/DXF/PDF-poraukset säilyvät Ø17,6 mm.

### Testit ja muut varmennustasot
Peräkkäin: `typecheck`, `test:run`, `format:check` ja kaksi kohdennettua Edge-E2E-tiedostoa tuoreesta buildista. Artefaktiauditointi ja QA ovat pääagentin vastuulla.

### Dokumentaatiovaikutukset
README- ja AGENTS-nykytilaväitteet on päivitetty nelikieliseen bassoon. Aiemmat päivätyt suunnitelmat ja varmennukset säilyvät historiallisina.

### Riskit
Parserin foreign-key-striktiys: sallittu vanha passiivinen avain ei saa hyväksyä aktiivista viisikielistä tai muita tuntemattomia avaimia.

### Ratkaisematta jääneet asiat
Ei avoimia tuotepäätöksiä. Fyysinen valmistus, CAD-GUI ja julkaistu ympäristö eivät kuulu varmennukseen.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
**VOIMASSA.** Peruste on yllä oleva käyttäjän suora poistopyyntö. Ei commit-, push-, PR- tai deploy-valtuutusta.


### VERIFICATION LEDGER — poisto 14.9.2026

| Tarkistus | Komento tai menetelmä | Tulos ja todistettava asia | Lähtötila ja voimassaolo |
|---|---|---|---|
| Tyyppitarkistus | `npm run typecheck` | PASS | Lopullinen lähde |
| Yksikkö-/integraatiotestit | `npm run test:run` | 235/235 PASS, 29 tiedostoa | Lopullinen lähde |
| Muotoilu | `npm run format:check`; `npm run format`; uusi check | Ensin 11 tiedoston muotoiluvirhe, korjauksen jälkeen PASS | Lopullinen lähde/testit |
| Tuore build ja selainpolut | `npm run test:e2e -- tests/e2e/bass-headstocks.spec.ts tests/e2e/headstock-variants.spec.ts` | 12/12 PASS; bass4, kitararegressiot, passiivisen vanhan avaimen poisto ja aktiivisen bass5:n atominen hylkäys; konsolivirheet tarkistettu | index-j1l3c9MK.js / pdf-DRIEZvr3.js; ei koko E2E-sarjan ajo |
| Riippumaton QA | Parseri-, basso-, variantti-, export- ja transaktiotestit sekä lähdekatselmus | 19/19 + 7/7 PASS, VERIFIED | Lopullinen lähde, `tmp/remove-bass5/qa-ledger.md` |
| Bass4-geometrian säilyminen | Ennen/jälkeen JSON-vertailu ja riippumaton SHA-256 | PASS, yhdistetty kaula/otelauta/lapa-vientipiirros tavutasolla sama | `tmp/remove-bass5/before/bass4-drawing.json` ja nykyinen `tmp/bass-headstocks/artifacts/bass4.json` |
| Todelliset vientitiedostot | XML-, ezdxf-, pypdf- ja pdfplumber-lukijat | 6/6 PASS: desktop/mobiili SVG/DXF/PDF, neljä Ø17,6 mm:n porausta, yksiköt ja vektorirakenne, DXF audit 0 korjausta | `tmp/remove-bass5/artifact-audit.json` |
| Visuaalinen tarkistus | Tuore desktop-kuva ja ladatun PDF:n Poppler-renderöinti | PASS: jatkuva kontuuri, neljä reikää, kontekstityökalut ja luettava mittalaatikko | Pääagentti; paikallinen selain/artefakti |
| Paikallinen käynnistys | Piilotettu Vite-prosessi oikeassa repossa, HTTP 5174 | HTTP 200 | 14.9.; palvelimen tila voi myöhemmin muuttua |

Pääagentti katselmoi lopullisen tuotantokoodin diffirajauksen ennen dokumentointia. docs_sync luki ledgerit, mutta sen kirjoituskomento pysähtyi PowerShell-syntaksivirheeseen ennen tiedostomuutoksia. Pääagentti siirsi kirjoitusvastuun itselleen ja viimeisteli README-, AGENTS- ja FEATURE_BRIEF-synkronoinnin. Tarkat todisteet ovat `tmp/remove-bass5/root-ledger.md`, `qa-ledger.md`, `artifact-audit.json` ja `artifacts/`. Näyttö koskee paikallisia automaattisia testejä, Edge-selainta ja ladattuja artefakteja. Fyysistä valmistusta/tulostusmittakaavaa, CAD-GUI-tuontia, natiivia Save As -dialogia, fyysistä mobiililaitetta tai julkaistua ympäristöä ei varmennettu. Ei commitia, pushia tai deployta.

## FEATURE BRIEF — Kätisyys (14.9.2026)

**Tila: TOTEUTETTU — riippumaton QA VERIFIED. Toteutusvaltuutus perustuu käyttäjän ominaisuus- ja jatkamispyyntöön.**

### Tavoite
Yksi Right-handed / Left-handed -painike muuttaa koko instrumentin kätisyyden. Kaikki kolme editorinäkymää, osien editointi, projektitallennus sekä PDF/SVG/DXF ja tulostus käyttävät samaa valintaa. Myös nelikielinen basso kuuluu tähän.

### Ei-tavoitteet
Ei hardware-, kieligeometria-, mitoitus-, 3D-, vendor- tai FretFactory-muutoksia. Ei erillistä vasenkätisten templatekokoelmaa eikä käsin peilattujen nodejen toistuvaa tallentamista.

### Käyttäjän vahvistamat päätökset
Kätisyys valitaan yhdestä painikkeesta; editori, esikatselut, tulostus ja tallennus reagoivat siihen.

### Sallitut paikalliset oletukset
Uusi projekti on oikeakätinen. Kanoninen millimetrigeometria pysyy oikeakätisessä koordinaatistossa; handedness on dokumentin ominaisuus. Kaula osoittaa editorissa edelleen oikealle. Vasen peilaa kanonisen X:n keskiviivan yli, tekstit ja asteikot säilyvät luettavina. V10-lähde luetaan oikeakätisenä, v11 vaatii validin handedness-arvon. V10:n ristiriitainen left-lisäkenttä hylätään; ei piilotettua vasemman tulkintaa oikeaksi. Vanhan passiivisen bass5-avaimen puhdistus säilyy vain aiemmin tuetussa lukupolussa.

### Käyttäytymispolut
Painike vaihtaa kätisyyden yhtenä undo-askeleena säilyttäen kanoniset muodot ja mitat. Undo/redo, uusi projekti, avaus, tallennus ja lapamallinvaihdot säilyttävät oikean arvon. Avoin kaulaluonnos estää kätisyyden vaihdon, kunnes käyttäjä hyväksyy tai peruu luonnoksen nykyisillä Apply/Cancel changes -toiminnoilla; myös aktiivinen veto estää vaihdon. Valmis kaula-/lapamuutos ei nollaa kätisyyttä. Referenssin kanoninen muoto näytetään nykyisen projektin kätisyyden mukaan ilman kaksinkertaista peilausta.

### Muutettavat vastuualueet tai tiedostot
model/project, file/projectFile ja referenceOverlay, store ja dokumenttitransaktiot, App/painike, editor/viewport/canvasGeometry/EditorCanvas/useCanvasInteractions ja numerokentät tarpeen mukaan, export geometry/math/model/layout sekä niiden testit. Worker tarkistaa omistavat polut ennen muokkausta.

### Säilytettävät rajat
Sama oikeakätinen geometria, mittakaava, tasku, keskilinjat, kaula/lapa/bass4, mikrofonit/potero, lukitut nodet ja collision-säännöt. Taka on etupuolen vastakkaiselta puolelta katsottu. Bass/treble-semantiikka ei vaihdu vaikka sijainti peilautuu.

### Tietomalli- ja rajapintamuutokset
Projektiv11, handedness: right|left pakollinen. Nykyinen v10 luetaan right-lähtökohtana ja tallennetaan v11:nä; v9 ja vanhemmat hylätään. Headstockv3 säilyy. Editorin effectiveMirror = back XOR left. Kaikki pointer/inverse/ruler-pisteet käyttävät samaa transformia. Tuotantovienti peilaa jokaisen RH PartDrawingin ennen layoutia: pisteet, Bézier-kontrollit, circlecenter ja arc center; circularArc sweep vaihtuu. Bounds lasketaan uudelleen. Tekstit, kalibrointiviiva ja mittalaatikko luodaan vasta tämän jälkeen. Kätisyys näkyy vientiasetuksissa ja mittalaatikossa luettavana tekstinä.

### Toteutusjärjestys
Dokumentti/parseri/history → viewport/eleet/painike → vientigeometria/mittatieto → kohdennetut sekä laajat regressiot → riippumaton QA/artefaktit → nykytiladokumentit.

### Hyväksymiskriteerit
1. Yksi painike näyttää/vaihtaa arvon, kätisyys päivittyy kaikkiin näkymiin ja undo/redo toimii ilman geometriamuutosta.
2. Vasemman muoto peilaa oikean jokaisessa näkymässä, tekstit pysyvät luettavina, myös monimittakaula, epäsymmetriset kitaralavat ja bass4.
3. Node/kahva/lapamuokkaus ja kolojen vedot sekä numeerinen editointi toimivat visuaalisesti johdonmukaisesti vasenkätisenä; lukot/collision säilyvät.
4. V11 roundtrip säilyttää valinnan; invalid/v10-left hylkäys on atominen; v10 right avautuu; bass5 ei palaudu.
5. Kaikki seitsemän vientiosaa sekä osayhdistelmät peilautuvat oikein, myös taskun kaaret ja takapotero. Sivukoko mukautuu edelleen, mitat/mm säilyvät, keskiviivavalinta toimii. Ladattujen SVG/DXF/PDF:n todellinen geometria vastaa handednessia; ei vain esikatselu.
6. Kaulaluonnoksen ratkaisu, mallinvaihto, uusi projekti ja reference overlay eivät nollaa tai tuplapeilaa kätisyyttä.

### Testit ja muut varmennustasot
Peräkkäiset typecheck, test:run, format:check, tuore build/E2E (Edge desktop ja mobile simulation). Erityiset transform-inversio/ruler/zoom, historia/parseri, epäsymmetrisen multiscale-geometrian pariteetti ja arc-sweep-testit. Riippumaton qa_verifier, oikeiden SVG/DXF/PDF-artefaktien rakenne/mm/geometriavertailu ja visuaalinen tarkistus. Ei fyysisen paperin tai valmistuksen näyttöä.

### Dokumentaatiovaikutukset
README/AGENTS nykyinen formaatti, kätisyyspainike, v10-lukupolku ja vientimittalaatikko; tämä brief omistaa ledgerin. Aiempien kierrosten luvut säilyvät historiallisina.

### Riskit
Takapuolen kaksinkertainen peilaus, arc sweep, inverse-eleet/numeeriset koordinaatit, vanha lukija ja v11, luonnoksen tilahävikki. QA tarkistaa nämä erikseen.

### Ratkaisematta jääneet asiat
Ei käyttäjäpäätöstä vaativaa. Tarkat sisäiset allekirjoitukset workerin vastuulla.

### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
VOIMASSA: käyttäjä pyysi yhden painikkeen vasen/oikeakätisen suunnittelun toiminnallisuutta esikatseluineen, tulostuksineen ja tallennuksineen. Ei commit/push/PR/deploy-valtuutusta.


### VERIFICATION LEDGER — workerin toteutuskierros 14.9.2026

| Tarkistus | Komento tai menetelmä | Tulos / todistettava asia | Voimassaolo |
|---|---|---|---|
| Tyyppitarkistus | `npm run typecheck` | PASS kätisyysmallin, parserin, editorin ja viennin muutoksen jälkeen | Nykyinen lähde |
| Yksikkö-/integraatiot | `npm run test:run` | 238/238 PASS, 29 tiedostoa; v11, v10-right, v10-left-hylkäys, undo ja viewport XOR -testit mukana | Nykyinen lähde |
| Muotoilu | `npm run format`; `npm run format:check` | PASS ennen myöhempää E2E-odotusten päivitystä | Nykyinen lähde/testit |
| Tuore build | `npm run build` ja `npm run test:e2e` aloitus | Build PASS, index-DwFcwWUI.js / pdf-BbfjHbXU.js; koko E2E keskeytyi hostin ajosession katkeamiseen ennen tulosta | Paikallinen build; E2E ei vahvistettu |

Tämän worker-vaiheen avoimet tarkistukset valmistuivat alla olevassa lopullisessa ledgerissä; yllä olevat tulokset säilyvät vaiheen historiallisena näyttönä. Fyysinen paperi, CAD-GUI ja julkaistu ympäristö eivät kuulu tähän varmennukseen.


### Varmennuksessa löytynyt parserikorjaus — 14.9.2026

Tuoreella buildilla toistettu Node→Edge-bassoprojektin avaus paljasti neck-snapshotin bittitarkan JSON-vertailun. Node 24:n ja Edgen laskentatulosten suurin mitattu ero oli 1,1368683772161603e-13 mm (`nut[0].y`). Kätisyys ei osallistu kaulalaskentaan. Korjaus rajataan snapshotin rekursiiviseen rakennevertailuun: rakenteet ja muut arvot täsmäävät tarkasti, äärellisille luvuille sallitaan absoluuttinen 1e-10:n laskentatoleranssi. Puuttuvat/ylimääräiset kentät, tyyppimuutokset ja tätä suuremmat erot hylätään; hyväksytty snapshot muodostetaan uudelleen sidotusta laskennasta. Tämä ei muuta laskentamallia tai geometriaa. Korjauksen varmennus kirjataan lopulliseen ledgeriin.


### VERIFICATION LEDGER — kätisyyden lopullinen varmennus 14.9.2026

| Tarkistus | Komento tai menetelmä | Tulos ja todistettava asia | Lähtötila ja voimassaolo |
|---|---|---|---|
| Tyyppitarkistus ja koko yksikkö-/integraatioajo | `npm run typecheck`; `npm run test:run` | PASS; 246/246, 30 tiedostoa. Mukana kaikkien vientiosien peilaus inline/3+3/bass4/multiscale, historia, parseri ja snapshotin rakenne-/toleranssirajat | Lopullinen lähde; `snapshot-typecheck.log`, `snapshot-unit.log` |
| Muotoilu ja build | `npm run format:check`; `npm run build` | PASS; index-BceFIlCa.js / pdf-Cef-pK9N.js | Lopullinen lähde/testit; snapshot-format-check/build.log |
| Ensimmäinen laaja selainajo | `npm run test:e2e` | 112/132 PASS, 20 FAIL. Pääosa vanhoja v10-odotuksia, lisäksi tukemattoman lavan teksti ja uuden testin valitsimet | Historiallinen välitulos, ei vihreä täysajo; e2e.log |
| Selainodotusten korjauskierrokset | `playwright test --last-failed`, sitten handedness/headstock-kohdennus | 16/20 PASS; seuraavaksi 4 aiempaa virhettä PASS ja 2 uutta vientikoetta FAIL. Viennin exact-label-odotus korjattiin; seuraava ajo paljasti Node→Edge-snapshot-virheen. Formaattikohtaiset vientiasetukset asetetaan testeissä valinnan jälkeen | e2e-correction/final/exports.log; välitulos, ei lopullinen vihreä ajo |
| Lopullinen kätisyyden selainajo | `npx playwright test tests/e2e/handedness.spec.ts` | 4/4 PASS, 1,2 min. Desktop ja mobiilikoko: kolme näkymää, nodeveto/näppäimet, lapa, takapotero, undo/redo, luonnoksen esto, v11-tallennus/avaus, virheellisen v10-leftin atominen hylkäys; lisäksi right/left kaikki osat ja Node-luotu left-bass oikeina SVG/DXF/PDF-latauksina. Ei pageerror-/console-error-merkintöjä | Lopullinen build; snapshot-e2e.log. Koko 134 tapauksen nykyistä E2E-sarjaa ei ajettu yhtenä vihreänä kokonaisuutena; 134 uniikin polun näyttö kertyy yhdistetyistä ajoista |
| Riippumaton QA | qa_verifier: baseline/lähdekatselmus ja erillinen Vitest-koe, korjatun parserin uusi lähdekatselmus | VERIFIED. Geometriakoe 4/4 PASS: oikean geometrian säilyminen, vasemman segmentit/reiät/kaarisuunnat, parseri/history ja viewport-inversio. Parserin toleranssi ja uudelleenlaskettu snapshot katselmoitu | Geometria ei muuttunut parserikorjauksessa; qa-ledger.md |
| Todelliset SVG/DXF/PDF-tiedostot | `audit-artifacts.py`, XML/ezdxf/pypdf/pdfplumber | 18/18 PASS: 6 SVG:n polut, kontrollit, kaaret, reiät ja yksiköt; 6 DXF:n viivat/Bézierit/kaaret ja reiät, mm ja audit 0 korjausta; 6 vektori-PDF:n mukautettu sivukoko, reikien sijainti/halkaisija ja kätisyysteksti. Kokonaispiirroksessa 426 DXF-segmenttiä, bassolavassa 20 | Selaimesta ladatut lopulliset tiedostot; artifact-audit.json, artifacts/desktop-edge ja mobile-edge |
| Peilikuvien riippumaton vertailu | `audit-mirror.py` oikea/vasen piirrosdata molemmille näyttökoille | 2/2 PASS: kummassakin 7 osaa ja 1548 pistettä, kontrollit/kaaret/ympyrät ja osien mitat | Lopullista vientigeometriaa vastaavat drawing.json-sidecarit |
| Visuaalinen tarkistus | Pääagentti: desktop/mobiili-editori ja Poppler-renderöidyt kokonainen kitara sekä erillinen vasen bassolapa | PASS: vastakkaiset etu/takanäkymät, kaula oikealle, neljä bassoreikää, luettavat asteikot/nimet/kätisyys/mittalaatikko. Poppler ilmoitti Symbol-fonttihuomautuksen; renderöinti valmistui ja luettavuus tarkistettiin | Paikalliset kuvakaappaukset ja ladatut PDF:t, ei fyysisen tulosteen näyttöä |

Aikaisempi workerin rinnakkaiseksi käynnistynyt kohdennettu E2E kohtasi varatun 4174-portin eikä ole varmennusnäyttöä. Diagnoosi ja lopullinen korjaus ajoivat tarkistukset peräkkäin omistajuuden siirroilla. Ensimmäinen muotoiluajo löysi testilohkon rivinvaihdon; korjattu ennen lopullisia tarkistuksia. Dokumenttien loppusynkronoinnin ja katselmoinnin teki pääagentti docs_sync-agentin alustavan README/AGENTS-päivityksen jälkeen.

Tarkat paikalliset lokit ovat `tmp/handedness/`-hakemistossa. Node/Edge-diagnoosin numeerinen vertailu on `diagnosis/browser-v-node-snapshot.json`. Snapshotin hyväksyntä käyttää absoluuttista 1e-10:n toleranssia ja palauttaa uudelleenlasketun geometrian; muutokset 1e-8 ja rakenteelliset virheet hylätään testeissä. Fyysistä paperimittakaavaa, valmistusta, CAD-GUI-tuontia, natiivia Save As -dialogia, fyysistä mobiililaitetta tai julkaistua ympäristöä ei varmennettu. Ei commitia, pushia tai deployta.

Paikallinen Vite käynnistettiin lopuksi piilotettuna oikeassa repositoriossa (PID 14948); `http://127.0.0.1:5174/` vastasi HTTP 200. Tämä on 14.9.2026 käynnistysnäyttö, ei julkaistun ympäristön varmennus.


## FEATURE BRIEF — Vasenkätisen soittimen kaula vasemmalle (14.9.2026)

**TOTEUTETTU — riippumaton QA VERIFIED. Toteutus valtuutettu käyttäjän suuntakorjauspyynnöllä.**

### Tavoite
Oikeakätisen kaula osoittaa oikealle, vasenkätisen vasemmalle editorissa ja SVG/DXF/PDF-vienneissä.
### Ei-tavoitteet
Ei projektiformaatin, kanonisen millimetrigeometrian, hardware-mittojen, kielisääntöjen, vendorin tai FretFactoryn muutoksia. Ei uutta asetusta.
### Käyttäjän vahvistamat päätökset
Vasenkätisen soittimen kaula vasemmalle. Vientien sama esityssuunta on pääagentin ilmoittama paikallinen toteutusoletus.
### Sallitut paikalliset oletukset
Handedness omistaa suunnan. Vasenkätisen nykyiseen esitykseen lisätään 180 asteen kierto; oikea säilyy ennallaan. Fyysinen back XOR left -peilaus pysyy erillään esityskierrosta.
### Käyttäytymispolut
Kätisyyspainike, undo/redo ja projektin avaus palauttavat oikean suunnan. Kolme näkymää, referenssit, osoitinvedot, valintalaatikko, zoom/panorointi/Sovita käyttävät samaa muunnosta ja inversiota. Kaikki nuolet liikuttavat bodya, lapaa, pickupia, poteroa ja poteron kahvoja näytön suuntaan. Viivottimet/mitat pysyvät kohdakkain ja luettavina. Viennin osageometria käännetään ennen layoutia; nimet/mittalaatikko/kalibrointi lisätään oikein päin.
### Muutettavat vastuualueet tai tiedostot
editor/viewport.ts, App.tsx, editor/useCanvasInteractions.ts, export/layout.ts ja geometry.ts; relevantit viewport/export-yksikkötestit ja handedness/foundation-E2E. Canvasin lisämuutos vain jos sen suuntariippuvuus vaatii. README/AGENTS/FEATURE_BRIEF lopuksi.
### Säilytettävät rajat
Kanoniset nodet, mittakaava, taskun leikkausraja, kieligeometria ja bass/treble säilyvät. Fyysinen vientipeilaus vaihtaa kaaren sweepin kerran; 180 asteen kierto ei vaihda sitä uudelleen. Tekstit eivät kierry.
### Tietomalli- ja rajapintamuutokset
V11 säilyy. Transform saa esityssuunnan, layoutDrawing vastaavan sisäisen parametrin. Yhteinen näyttö→maailma-delta korvaa erilliset nuolietumerkit.
### Toteutusjärjestys
Viewport/inversio → kaikki näppäinpolut → vientikierto → testit/build/selain/artefaktit → riippumaton QA → nykytiladokumentit.
### Hyväksymiskriteerit
1. RH oikealle/LH vasemmalle; todelliset body/satula/lapa-landmarkit todistavat suunnan.
2. Maailma↔pikseli palautuu molemmilla kätisyyksillä, kolmessa näkymässä ja zoomeilla; viivottimet ja mitat pysyvät kohdallaan.
3. Body/lapa/pickup/potero sekä kaikki neljä koonmuutoskahvaa seuraavat näytön nuolta ja osoitinta; lukot ja törmäyssäännöt säilyvät.
4. RH-vienti säilyy; LH:n jokainen lopullisen layoutin osa peilaa RH:n paperi-X:n (sama Y, mitat, säteet), myös bass4/multiscale/epäsymmetriset lavat.
5. Tallennus/avaus/undo/redo/New säilyvät. SVG/DXF/PDF:n todellinen geometria ja tekstit vastaavat suuntaa.
### Testit ja muut varmennustasot
Peräkkäin typecheck, koko unit, format:check, tuore build ja relevantit Edge desktop/mobiili-E2E. Riippumaton QA, baseline-RH-pariteetti, ladatut18SVG/DXF/PDF, peilausoraakkeli ja PDF/selainkuvat. Ei fyysistä tulostusmittakaavaa.
### Dokumentaatiovaikutukset
Nykytilan aina-oikealle-väitteet korvataan kätisyyden mukaisella suunnalla. Aiemmat päivätyt ledgerit säilyvät historiallisina.
### Riskit
Esityskierron ja fyysisen peilauksen sekoittuminen; pickupin ja poteron kahvojen kovakoodatut näppäinsuunnat. Yhteinen muunnos ja riippumattomat orakkelit rajaavat nämä.
### Ratkaisematta jääneet asiat
Ei käyttäjäpäätöstä edellyttävää.
### Toteutusvaltuutuksen tila ja sen perusteena oleva käyttäjän pyyntö
VOIMASSA: käyttäjä pyysi vasenkätisen kaulan osoittamaan vasemmalle. Ei Git- tai julkaisuvaltuutusta.


### VERIFICATION LEDGER — kaulan esityssuunta 14.9.2026

| Tarkistus | Komento tai menetelmä | Tulos / todistettava asia | Lähtötila ja voimassaolo |
|---|---|---|---|
| Tyyppitarkistus | `npm run typecheck` | PASS, v11 ja kanoninen geometria säilyvät | Lopullinen lähde; tmp/neck-direction/typecheck.log |
| Yksikkö-/integraatiot | `npm run test:run` | 246/246 PASS, 30 tiedostoa; päivitetyt viewport- ja neljän kaulatyypin seitsemän vientiosan X-peilausodotukset | Lopullinen lähde; unit.log |
| Muotoilu ja build | `npm run format:check`; `npm run build` | PASS; index-Dqgc9aCp.js / pdf-6futaWet.js | Lopullinen lähde/testit; format-check.log, build.log |
| Paikallinen selain | `npx playwright test tests/e2e/handedness.spec.ts tests/e2e/foundation.spec.ts tests/e2e/rear-cavity.spec.ts` | 38/38 PASS yhtenä ajona, 3,5 min. Edge desktop/mobiili: kaulan/satulan/lavan maamerkit, kolme näkymää, nodeveto, body/lapa/pickup/potero-vaakanuolet, neljä poteron koonmuutoskahvaa, viivottimet/zoom/pan/valinta, dirty/save/open/undo ja todelliset vientilataukset. Ei konsoli-/pageerror-virheitä | Tuore lopullinen build; e2e.log. Ei koko projektin E2E-sarjan ajo |
| Riippumaton QA-koe | `npx vitest run --config tmp/neck-direction/qa/vitest.config.ts` ja lähdekatselmus | 5/5 PASS, exit0: RH-baseline default/multiscale, LH inline/3+3/bass4/multiscale-segmentit/kaaret/reiät, historia/parseri, kolme näkymää ja zoomia sekä kaikki nuolideltat/viivottimien inversiot | Lopullinen lähde; qa-test.log, qa-ledger.md |
| Todelliset vientiartifaktit | audit-artifacts.py; riippumattomat XML/ezdxf/pypdf/pdfplumber-lukijat | 18/18 PASS: SVG-polut/kontrollit/kaaret/reiät/mm, DXF-analyyttiset segmentit/reiät/mm ja 0 audit-korjausta, PDF-mukautettu sivukoko/reikien sijainnit/halkaisijat/luettava kätisyysteksti | Selaimesta ladatut oikea/vasen kokonaispiirros ja vasen bassolapa molemmissa näyttökoissa; artifact-audit.json |
| Riippumaton peilaus ja RH-regressio | audit-mirror.py molemmille näyttökoille; aiemman ja uuden right-all.svg/dxf:n tavut | 2/2 peilausparia PASS, kummassakin 7 osaa / 1548 pistettä; lopullinen paikallinen paperi-X peilautuu ja Y säilyy. Oikeakätiset SVG/DXF 4/4 tavutasolla ennallaan | tmp/handedness/artifacts lähtötilana, tmp/neck-direction/artifacts lopputilana |
| Visuaalinen tarkistus | Pääagentti: desktop-LH-kitara, mobile-LH-basso sekä Poppler-renderöidyt left-all.pdf ja left-bass.pdf | PASS: kaula vasemmalla, oikein päin olevat tekstit ja asteikot, erillisosat/reiät/mittalaatikko kunnossa. Popplerin Symbol-fonttihuomautus ei estänyt renderöintiä; tekstit tarkistettiin kuvista | Tuore selain ja ladatut PDF:t; ei fyysistä mittakaavatodistetta |
| Dokumentointi ja paikallinen käyttö | docs_sync README/AGENTS, pääagentin diffikatselmus ja tämä ledger; HTTP-pyyntö | Nykytilan suunta päivitetty, v11/mitat säilyvät. Dev 127.0.0.1:5174 vastasi HTTP200 | 14.9.2026; ei julkaisu |

Workerin keskeytynyttä lisä-E2E:tä tai ilman säilytettyjä lokeja raportoituja testituloksia ei käytetty lopullisena näyttönä. Pääagentti otti kirjoitus-/testivastuun takaisin ja ajoi yllä luetellut tarkistukset peräkkäin lokitettuna; vain Prettier ajettiin lähteeseen ja se raportoi tiedostot muuttumattomiksi. Riippumaton QA ajoitettiin selainajon jälkeen, ja dokumenttien kirjoitusvastuu siirrettiin docs_sync-agentille ja takaisin. Nykyinen lähdemuutos on kahdeksassa source/test-tiedostossa; projektiformaatti, pakettilukko, portit ja vendor säilyivät.

Näyttö on paikallinen: ei fyysistä tulostusta/valmistusta, ulkoisen CAD-ohjelman tuontia, fyysistä mobiililaitetta tai julkaistua ympäristöä. Ei commitia, pushia tai deployta. Dokumenttien loppukatselmointi tehtiin ennen työn päättämistä.

## Yhteisjulkaisu 14.9.2026

Käyttäjä valtuutti uusimman paikallisen version nettiin julkaisun. FretFactoryn Pages-ajo34837173194 julkaisi commit8dfe215 onnistuneesti; https://www.fretfactory.fi/gtrfactory/ varmistettiin desktop/mobile-selaimella. Täysi tuore yksikköajo246/246PASS (tmp/release-20260914/unit.log), build/type/formatPASS. Julkinen manifesti+6artifactSHA, linkki/reload, kätisyys/Undo sekä SVG/DXF/PDF-latauksetPASS. Ei erillistä GTR-lähderepositoriota tai Git-historiaa julkaistu. Fyysinen valmistus, natiivi Save As ja aiemmat rajatut porttitestit eivät muutu tällä näytöllä varmennetuiksi. Yhteisjulkaisun tarkka ledger on FretFactoryn docs/shared-release.md.
# Mikrofonikolon kulma ja mitat — TOTEUTETTU, QA VERIFIED (20.9.2026)

## Tavoite

Valitun mikrofonikolon kontekstityökaluihin lisätään yksi absoluuttinen kulmaparametri sekä paikalliset leveys- ja pituusmitat. Muutettu kontuuri näkyy, törmäystarkistetaan ja viedään SVG-, DXF- ja PDF-piirustuksiin yhtenäisenä geometriana.

## Ei-tavoitteet

Ei Z-akselia, uutta vedettävää kiertokahvaa, vapaata X-siirtoa, uusia mikrofoniprofiileja tai valmistuskelpoisuuden lupausta.

## Käyttäjän vahvistamat päätökset

Käyttäjä pyysi 20.9.2026 kulmasäädön yhdellä parametrilla sekä kolon leveyden ja pituuden muokkaamisen ja valtuutti toteutuksen sekä julkaisun, jos varmennuksessa ei löydy estävää ongelmaa. Keskipiste säilyy keskilinjalla. Tekniset rajat ovat 1–1000 mm ja −180…180°.

## Sallitut paikalliset oletukset

Kulma on kanonisen oikeakätisen geometrian absoluuttinen kulma. Leveys ja pituus ovat kolon paikalliset ulkomitat ennen kiertoa. Kokonainen profiili, mukaan lukien korvat ja pyöristykset, skaalautuu affiinisesti. Muokattu profiili merkitään viennissä custom-muotoiseksi.

## Käyttäytymispolut

Valittu etunäkymän mikrofonikolo näyttää Angle-, Width- ja Length-kentät nykyisessä mm/in-yksikössä. Enter tai blur tekee yhden undo-askeleen, Escape palauttaa kentän ja pilkku hyväksytään desimaalierottimeksi. Virheellinen arvo tai kontuurin törmäys hylätään atomisesti. Profiilin vaihto palauttaa uuden profiilin oletuskulman ja -mitat, säilyttää keskipisteen ja hylkää virheellisen sijoituksen. Kaikki editori-, collision- ja vientipolut käyttävät samaa lopullista geometriaa; vasenkätisyys peilaa sen kerran viennissä.

## Muutettavat vastuualueet tai tiedostot

`model/project`, `file/projectFile`, `pickup/profiles`, `store`, `editor/ContextTools`, `editor/EditorCanvas`, `export/geometry` ja niitä koskevat testit.

## Säilytettävät rajat

Yhdeksän profiilia, 64 kolon raja, olemassa olevat body-, kaula-, tasku-, tallalinja- ja keskinäiset törmäyssäännöt, kätisyys, bass5-hylkäys ja neck snapshot -validointi säilyvät.

## Tietomalli- ja rajapintamuutokset

Projektiformaatti nostetaan v12:een. PickupCavity tallentaa pakollisina `angleDeg`, `widthMm` ja `lengthMm`. V10/V11 luetaan v12:ksi profiilin oletuksilla; vanhan version uudet kentät hylätään. V12 vaatii kaikki uudet kentät. V1–V9 säilyvät hylättyinä.

## Toteutusjärjestys

Yhteinen transformoitu pickup-geometria, store/parser, editori, viennit ja mittataulukko, testit ja varmennus.

## Hyväksymiskriteerit

Oletusprofiilit, myös Tele 17°, säilyttävät geometriansa; kulma ja mitat vaikuttavat samaan kontuuriin kaikissa kuluttajissa. Epätasainen skaalaus muuttaa ympyräkaaret rajoitetun virheen (<0,01 mm) kuutio-Béziereiksi, tasainen skaalaus säilyttää ympyräkaaret. V12 round-trip ja v10/v11 migraatio toimivat; virheellinen data ei korvaa nykyistä dokumenttia. Mittataulukossa näkyvät profiili/custom, mitat, kulma ja tallan etäisyys, kun etu/yleiskuva, mikrofonit ja mittataulukko ovat mukana.

## Testit ja muut varmennustasot

Yksikkö-, store-, parser-, export- ja Edge E2E-testit kattavat kulman, mitat, collisionin, undo/redo:n, migrationin, RH/LH-viennit ja ellipsin virherajan. Ajetaan typecheck, test:run, format:check, test:port-conflict, build ja relevantti E2E; julkaisu edellyttää lisäksi riippumatonta QA:ta, artefaktitarkistusta ja release checkiä. Fyysistä jyrsintää ei varmenneta.

## Dokumentaatiovaikutukset

README:n ja AGENTS.md:n nykytilaväitteet on synkronoitu tämän toteutuksen ja QA-ledgerin perusteella. Julkinen snapshot ja verkko-osoitteen varmennus valmistuivat alla olevan julkaisukuittauksen mukaisesti.

## Riskit ja ratkaisematta jääneet asiat

Käyttäjän poikkeava mittamuoto voi tehdä nimetystä profiilista epätyypillisen; ohjelma ei lupaa osasopivuutta. Julkaisu ja fyysinen valmistus ovat erillisiä varmennustasoja.

## Toteutusvaltuutuksen tila

Toteutus tehty käyttäjän 20.9.2026 pyynnön perusteella. Riippumaton QA on VERIFIED. Julkaisulupa käytettiin alla dokumentoituun yhteisjulkaisuun; GitHub Pages ja julkinen varmennus valmistuivat.

## VERIFICATION LEDGER

| Tarkistus tai kriteeri | Komento tai menetelmä | Tulos | Todistettava asia | Ajankohta ja voimassaolo |
|---|---|---|---|---|
| Full browser regression | `node tmp/pickup-shape/run-playwright.mjs qa-full-e2e test --workers=1 --reporter=line` | PASS, 136/136, exit 0 | Desktop- ja iPhone 13 -simulaation pickup-, tallennus-, avaus- ja historiapolut toimivat | 20.9.2026; voimassa muuttamattomalle lähteelle |
| Pickup UI ja virhetilat | Edge desktop/mobile, `qa-browser.mjs` | PASS | Angle, Width, Length, profiilin vaihto, poisto, bridge-etäisyys ja virhenäkymä säilyvät ilman overflow- tai selainvirheitä | 20.9.2026; voimassa muuttamattomalle lähteelle |
| Kohdennetut pickup-polut | `node tmp/pickup-shape/run-playwright.mjs qa-pickup-e2e test tests/e2e/pickups.spec.ts --workers=1 --reporter=line` | PASS, 16/16, exit 0 | Yksiköt, desimaalipilkku, Escape, undo/redo, profiilin reset, v12:n avaus sekä collision/neck-polut toimivat | 20.9.2026; voimassa muuttamattomalle lähteelle |
| Yksikkö- ja integraatiotestit | `npm run test:run` | PASS, 253/253; lisäksi kohdennettu korjausajo 45/45 | Store, parseri, geometria, editorisopimukset ja viennit kattavat v12-mallin | 20.9.2026; lopullinen lähde |
| Riippumaton geometriakoe | `npx vitest run --config tmp/pickup-shape/qa-artifact-vitest.config.ts` | PASS, 6/6 | Yhdeksän oletusprofiilia säilyy, 37° affine-muunnos, kuutioiksi muunnos, RH/LH-peilaus ja v10/v11→v12-säännöt täsmäävät | 20.9.2026; lopullinen lähde |
| Todelliset vientiartifaktit | Selaimesta ladatut SVG/DXF/PDF:t ja `audit-artifacts.py` | PASS, 6/6 | Mukautettu, käännetty geometria ja mittatiedot ovat samoissa fyysisissä koordinaateissa kaikissa vientimuodoissa | 20.9.2026; paikalliset artefaktit |
| Tyyppi, muotoilu, portit ja build | `npm run typecheck`, `npm run format:check`, `npm run test:port-conflict`, `npm run build` | PASS | Lähde ja tuotantobuildi ovat teknisesti kelvolliset | 20.9.2026; lopullinen build `index-D_11UJ9t.js`, PDF `pdf-DaPDyrUh.js` |

QA-ledgerin mukaan alkuperäinen full E2E oli 136/136 ennen viimeistä editorin custom-label-korjausta; korjauksen jälkeen kohdennettu pickup-ajo oli 16/16. Näitä ei yhdistetä yhdeksi väitteeksi samasta buildistä. Fyysinen valmistus, natiivi Save As, ulkoinen CAD-tuonti ja fyysinen mobiililaite ovat avoimia varmennustasoja. Julkisen deploymentin näyttö on alla. Katso `tmp/pickup-shape/qa-ledger.md` yksityiskohtaisista lokeista ja artefaktitiedoista.


## Mikrofonisäädöt ja etusivun otsikko — julkaisu 20.9.2026

Käyttäjä valtuutti mikrofonikolojen julkaisun ja saman julkaisun yhteydessä etusivun paikallisen tekstikorjauksen commitin, pushin ja Pages-varmennuksen. Otsikko on **Design your guitar**; **from fretboard to wiring.** on poistettu. FretFactoryn muut keskeneräiset output/PNG-tiedostot jätettiin koskematta.

| Tarkistus | Menetelmä ja lähtötila | Tulos ja voimassaolo |
|---|---|---|
| Julkaisukatselmus | Riippumaton release_check ennen commitia/pushia ja puhtaan snapshotin jälkeen | READY WITH WARNINGS; ainoastaan vanha juuren favicon.ico-404, ei toiminnallista estettä |
| GTR-lähde | Commit `8199cfd4b203feb850ba4079142b15e598d70c17`, main-push | PASS; puhdas lähde, v12-pickup-muutos |
| Puhtaan lähteen snapshot | Source SHA256 `1e96983f735ca07dbc17dc69baab2683818305e8edfc819a1c14ee4f9049c8dd`, kuuden tiedoston hash-pariteetti selainkokeen ehdokkaaseen | PASS; vain manifestin aika, commit ja sourceDirty muuttuivat. SourceDirty=false; tmp/pickup-shape/final-parity.json |
| Yhteissivuston tarkistukset | 63/63 test:run, 11/11 test:release ja build/postbuild; metadatarefreshin jälkeen 11/11 test:release | PASS; site-*-final.log ja site-contract-clean.log; riippuvuudet ennallaan, tuotantoaudit 0 haavoittuvuutta |
| Paikallinen tuotantopaketti | Edge desktop ja iPhone13-kokoinen Chromium-simulaatio, landinglinkki/reload, otsikko ja ladattu JS, 8 astetta / 80 x 30 mm LH-kolo, v12-projekti ja SVG/DXF/PDF | PASS; site-local-browser/results.json ja kuusi todellista vientiä; kuvat tarkistettu |
| Pages-julkaisu | FretFactory main `1ca3a56f39815417c5a97c2423f8a93560b9a905`; [ajo 35527525349](https://github.com/IlkkaE/fretfactory/actions/runs/35527525349) | SUCCESS, build ja deploy; pages-result.json, valmistui 20.9.2026 17:58:44 UTC |
| Julkiset tiedostot | HTTPS-manifesti ja kaikki kuusi hashia verrattu paikalliseen lopulliseen snapshotiin | PASS; live-http.json; GTR JS index-BC1xoxdp.js, PDF pdf-DHfM0kVn.js |
| Julkinen selain | https://www.fretfactory.fi/ -> /gtrfactory/, tuore Edge desktop/mobile; täsmällinen otsikko, vanha fraasi puuttuu linkitetyistä skripteistä, reload, säädöt, v12-save ja kuusi SVG/DXF/PDF-latausta | PASS, ei sovellusvirheitä; live-browser/results.json ja ladatut artefaktit. Vanhasta favicon.ico404:stä kirjattu erillinen varoitus. |

Paikallinen riippumaton geometria- ja artefaktiauditointi yllä sekä julkisen paketin tavutason vastaavuus säilyttävät geometriavarmennuksen. Julkiset lataukset tarkistettiin myös erikseen rakenteellisesti (v12-arvot, SVG-rooli/custom, DXF-rooli/SPLINE, luettava PDF). Tämä ei ole fyysisen paperimittakaavan, valmistuksen, ulkoisen CAD-tuonnin, natiivin Save As -dialogin tai fyysisen mobiililaitteen koe. Julkaisukuittauksen myöhempi dokumentaatiocommit ei muuta 8199cfd-lähteestä rakennettuja sovellustiedostoja.
