# CDR-taustamateriaalin tarkastus

Päiväys: 6.9.2026. Käyttäjä antoi luvan käyttää CDR-kansiota projektin taustamateriaalina.

Aineisto kuvaa käyttäjän mahdollisesti tavoittelemia runkomuotoja ja niiden yhdistelmiä. Sitä käytetään oman rungon suunnittelun, osien yhdistelyn ja editorin muokkausvapauden arviointiin. Käyttäjän 6.9.2026 tekemän tarkennuksen mukaan ohjelman tavoitteena ovat omat mallit ja hybridit; tehdaskitaroiden 1:1-jäljennökset eivät ole tavoite. Alla olevat tekniset mittahavainnot säilyvät aineiston tulkintanäyttönä.

## Tarkastettu aineisto

| Sisältö | Määrä | Varmennettu havainto |
| --- | ---: | --- |
| CDR | 142 | Kaikki ovat ZIP-rakenteisia CorelDRAW X6 -asiakirjoja. Kaikkien pakettien CRC-tarkastus onnistui. |
| SVG | 1 | RG HT HH AANJ; 1 320 path-elementtiä, 7 tekstielementtiä, ei image-elementtejä. |
| PDF | 1 | RGR FR HS; yksi sivu, 942 käyrää, 873 viivaa, 51 suorakulmiota, ei rasterikuvia. |
| Yhteensä | 144 | 44 120 972 tavua. Alkuperäisistä tallennettiin SHA-256-tiivisteet. |

Kaikkien CDR-tiedostojen metatiedot ilmoittavat yhden sivun, 1300 × 1300 mm piirustusarkin ja nolla Bitmap-objektia. Arkin koko ei ole kitaran koko. Objektimäärä vaihtelee 983–4 406 välillä.

Tiedostonimissä ei ole Fender- tai Stratocaster-nimistä mallia. Tämä ei ole aineistopuute tai toteutuksen este: ohjelman aloitusmuoto on geneerinen Strat-tyylinen vektori, jonka suunnittelumitat voidaan valita ohjelmaa varten. CDR-aineiston Ibanez- ja custom-muodot kuvaavat tavoiteltavaa muotojen kirjoa.

Täydellinen tiedostoluettelo, tiivisteet, CDR-metatiedot ja piirustuksiin sisältyvät tekstit ovat tiedostossa [source-inventory.json](source-inventory.json). Piirustusten luokittelu ei perustu pelkkään tiedostonimeen.

## Kuuden näytteen muunnos

Inkscape 1.4.3 muunsi seuraavat CDR-tiedostot erillisiksi SVG-työkopioiksi. Kaikki kuusi muunnosta palauttivat onnistumisen, ja SVG-rakenne tarkistettiin uudelleen. Muunnoksiin ei syntynyt rasterikuvia.

| CDR-näyte | SVG-polkuja | Hyöty projektille |
| --- | ---: | --- |
| Ibanez - RG HT HH AANJ | 1 320 | Kahden sarven runko, kaulan liittymä, etu- ja takapiirroksen erottaminen. |
| Ibanez - RGR FR HS | 1 875 | Runkomuodon ja laitekokoonpanon erottaminen; mukana myös saman niminen PDF. |
| Ibanez - Talman HT 22 HSH BoltOn 25.5 | 1 490 | Epäsymmetrinen vyötärö, pehmeät mutkat ja aluekahvojen käyttäytyminen. |
| Ibanez - Iceman ToM 22 SetIn 24.75 | 1 451 | Epäsymmetrinen, kulmikkaampi runko ja voimakkaasti muotoiltu alaosa. |
| Custom - V HT 22 HH SetIn 24.75 | 1 485 | V-muoto, suorat osuudet, kärjet ja syvä sisäkulma. |
| Ibanez - RGD 8 HT 24 HH BoltOn 27 | 3 792 | Leveämpi kaula ja monimutkainen piirustus: rungon valinnan pitää erottaa referenssit. |

Työkopiot ovat hakemistossa converted/. Komennot, paluukoodit, SVG-mitat ja tekstisisältö on tallennettu [conversion-evidence.json](conversion-evidence.json)-tiedostoon.

Kuuden SVG-muunnoksen renderöintejä verrattiin CDR-pakettien omiin esikatselukuviin. Keskeiset runkomuodot ja piirrosten sijoittelu ovat tunnistettavasti mukana. Tämä on yleiskuvan vertailu, ei jokaisen polun vastaavuustodistus.

Muunnoksen tekstiasettelu ei ole uskollinen alkuperäiselle: kappaleet voivat juosta yhtenä rivinä ja leikkautua sivun reunaan. Tekstit ovat luettavissa CDR-metadatasta ja muunnetun SVG:n tekstielementeistä. Kokonaisia muunnettuja piirustusarkkeja ei pidä esittää valmiina tuotantopiirustuksina.

## Todettu mittakaavaero ja sen merkitys omalle suunnittelulle

Muodon käyttämiseen ideana tai hybridin osana ei tarvita alkuperäisen kitaran tarkkoja mittoja. Käyttäjä saa skaalata ja muokata muotoa sekä määrittää omalle rungolleen uudet mitat. Seuraava havainto kertoo, miksi lähteen yksikkötulkinta ja käyttäjän valitsema sijoituskoko pitää tehdä näkyviksi. Se ei estä aineiston käyttöä taustamateriaalina. FretFactory-kaulan mitat ja oman valmiin rungon vientimittakaava varmennetaan erikseen.

Mukana tullut [RG-SVG](../CDR/Ibanez%20-%20RG%20HT%20HH%20AANJ.svg) ja saman mallin CDR-muunnos eivät ole samassa fyysisessä mittakaavassa.

Vertailu tehtiin vastaavien suljettujen rungon ääriviivojen rajauslaatikoista Inkscapen query-all-komennolla. Mukana on viivanleveys, joten alla olevat arvot ovat vertailumittoja, eivät viimeisteltyjä valmistusmittoja.

| Aineisto ja polku | Rungon pituussuuntainen rajaus | Poikittainen rajaus |
| --- | ---: | ---: |
| Käyttäjän SVG, path602, nykyinen 96 px/in -tulkinta | noin 414,52 mm | noin 284,42 mm |
| CDR:stä muunnettu SVG, path290, eksplisiittinen fyysinen yksikkö | noin 451,50 mm | noin 309,79 mm |

SVG/CDR-suhde on pituudessa 0,918088 ja leveydessä 0,918087: mukana tullut SVG on tällä tulkinnalla noin **8,19 % pienempi**.

Käyttäjän SVG ilmoittaa Inkscape-version 0.91. Sen width ja height ovat yksiköttömiä, ja viewBox käyttää samoja arvoja. Vertailu tehtiin eksplisiittisesti asetuksella --convert-dpi-method=none, joten automaattista vanhan dokumentin korjausta ei tehty.

Inkscape on vaihtanut vanhasta 90 px/in -tulkinnasta 96 px/in -tulkintaan. Tämä on tunnettu lisäsyy tarkistaa vanhojen SVG-tiedostojen fyysinen koko, mutta se ei yksin selitä tässä havaittua koko 8,19 prosentin eroa. Pelkkää DPI-oletusta ei saa käyttää korjauksen perusteena. [Inkscapen yksikködokumentaatio](https://wiki.inkscape.org/wiki/index.php/Units_In_Inkscape)

Mittaloki on [scale-comparison.json](scale-comparison.json). Molempien polkujen query-all-tulokset ovat supplied-rg-bounds.csv ja converted-rg-bounds.csv.

CDR:n metadatassa on mm. nimelliset mensuuri- ja satulanleveysmerkinnät. Ne ovat lähteen kuvauksia, eivät GTRfactoryssa käytettävän oman kaulan tai rungon vaatimuksia. Tämän vertailun perusteella ei valita oikeaa tehdas-RG-mittaa. Muodon viitteellinen koko voidaan korvata käyttäjän määrittämällä suunnittelukoolla.

## Muut aineistorajat

- Nimi ja sisältö voivat olla ristiriidassa. Esimerkiksi Custom - V HT 22 HH SetIn 24.75.cdr sisältää otsikkotekstin RRV HT 22 HH BoltOn 24.75. SetIn/BoltOn-liitostyyppiä ei siksi päätellä tiedostonimestä.
- Piirustusarkit sisältävät runkojen lisäksi kauloja, kieliä, laitekolotuksia, kansia, mitoituksia ja sivupiirroksia. Koko arkkia ei voi syöttää yhtenä leikkauspolkuna.
- Kaulataskun geometrian omistaja säilyy GTRfactoryn käyttäjän vahvistamassa kaulamallissa. Taustapiirroksen taskua ei kopioida automaattisesti FretFactory-tuonnin tilalle.
- PDF on aidosti vektoriaineistoa, mutta sen sivu on noin 1047,78 × 944,01 mm. Sivukoko ei todista rungon mittakaavaa.
- Kaikille 142 CDR-tiedostolle tehtiin rakenne- ja metatietotarkastus. Vain kuudelle tehtiin SVG-muunnos ja visuaalinen vertailu. Muiden tiedostojen muuntuvuutta ei väitetä varmennetuksi.

## Käyttötapa GTRfactoryssa

1. Säilytä CDR-kansion alkuperäiset tiedostot lähdeaineistona.
2. Valitse tarvittava runko CDR-piirroksesta ja erottele sen ääriviiva työkopioon.
3. Kirjaa lähdetiedoston SHA-256, valitun polun tunniste, yksikkötulkinta ja käyttäjän valitsema koko tai sijoitusmuunnos. Taustamuodon skaalauksen tarkoitus on sovittaa se omaan suunnitelmaan; alkuperäisen kitaran jäljentäminen ei ole hyväksymisehto.
4. Tarkista sulkeutuminen, itseleikkaukset ja käyrien muoto. Ääriviivan yksinkertaistaminen editorin aluekahvoja varten ei saa muuttaa muotoa huomaamatta.
5. Käytä RG-, Talman-, Iceman-, V- ja RGD-näytteitä myös hybridien arviointiin: esimerkiksi pehmeä yläosa, offset-vyötärö ja kulmikas alaosa voivat kuulua samaan omaan runkoon. Yhden mallin jäljentäminen ei riitä muokkausvapauden todisteeksi.
6. V1 sisältää geneerisen Strat-aloituksen, vapaan muotoilun ja käyttäjän ohjaaman ääriviivan osien yhdistelyn, FretFactory-tuonnin sekä kolme sapluunaa. Kaikkien CDR-tiedostojen suora avaaminen tai 142 nimettyä tehdasmallia sisältävä valmisvalikko ei ole tähän kirjattu vaatimus.
7. Varmenna valmis vienti käyttäjän oman projektin millimetrimittoja vasten. Paperin 1:1-mittakaava koskee tätä projektia.

## VERIFICATION LEDGER

| Tarkistus | Menetelmä | Tulos | Todistettava asia ja raja |
| --- | --- | --- | --- |
| Lähdeaineiston yksilöinti | source-inventory.json, SHA-256 | 144 tiedostoa | Yksilöi tarkastetun aineiston. |
| CDR-pakettien rakenne | Python zipfile.testzip ja metadata-XML | 142/142 läpäisi | Paketit ovat luettavia, metatiedoissa vektoriobjektit; ei kaikkien geometrian laadun tarkistusta. |
| Edustavat muunnokset | Inkscape 1.4.3, kuusi erillistä SVG-vientiä | 6/6 paluukoodi 0, SVG-parsinta onnistui | Muunnospolku toimii näytteille. |
| Näytteiden visuaalinen vertailu | SVG-renderöinnit ja pakettien esikatselut | Kuusi runkomuotoa tunnistettu; tekstiasettelussa puutteita | Yleiskuva, ei polkukohtainen identtisyys. |
| Alkuperäinen SVG | XML-parsinta ja renderöinti | 1 320 polkua, 0 kuvaa | Muokattavaa vektoria, epäselvä fyysinen yksikkö. |
| Alkuperäinen PDF | pdfinfo, pypdf, pdfplumber ja pdftoppm-renderöinti | Yksi vektorisivu, 0 kuvaa | Vektoriaineisto, ei varmennettu valmistusmittakaava. |
| RG:n fyysisten tulkintojen vertailu | query-all vastaaville ääriviivoille | Noin 8,19 % ero | Nykyisen SVG-tulkinnan ja CDR-muunnoksen ero; oikeaa fyysistä kitaraa ei mitattu. |
| Lähteiden säilyminen | Kaikkien alkuperäistiedostojen SHA-256 ennen ja jälkeen | 0 muuttunutta | Alkuperäiset tiedostot säilyivät. |
| Fyysinen valmistus | Ei tulostus-, leikkaus- tai jyrsinkoetta | Ei näyttöä | Käyttäjän oman lopullisen suunnitelman valmistuskelpoisuus jää varmennettavaksi. |
| Aineiston käyttötarkoitus | Käyttäjän tarkennus keskustelussa 6.9.2026 | Mahdolliset omat runkomuodot ja hybridit, geneerinen Strat-aloitus | Korvaa aiemman oletuksen tarpeesta hankkia tarkka tehdas-Strat-pohja. |

Näyttö kerättiin 6.9.2026. Se koskee luettelon tiedostotiivisteitä ja kirjattua Inkscape-versiota. Apuskriptit ovat tmp/reference-analysis/-hakemistossa; katselukuvat reference-analysis/previews/-hakemistossa.

