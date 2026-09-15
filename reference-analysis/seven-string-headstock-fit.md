# Seitsemänkielisen lapamallin sovitus kaulaan

9.9.2026. Käyttäjä hyväksyi SVG:n pienet reikäpoikkeamat käytännössä merkityksettöminä, todennäköisesti muunnoksesta syntyneinä, ja valtuutti jatkamaan referenssin sovitusvertailua. Sovellus ja alkuperäinen SVG säilyvät ennallaan.

## Tulos

**Tasavälinen referenssirivi ei anna suoraa kielivetoa tällä kohdistuksella. Suora kieliveto saadaan samalla reunaetäisyydellä, kun pylväiden jako saa vaihdella.** Tämä on vaihtoehtojen tutkimus, ei päätös poistaa tuotteen tasajakoehtoa.

Oletusvertailu: 7 kieltä, mensuuri 647,7 mm, satulalla viereinen kielijako 7 mm ja tallalla 10,5 mm. Basso–diskantti-järjestys säilyy. Kuvan kosketuspuoli A vastaa labin `branch=+1`, `sigma=-1` -haaraa; vastaavuus tietyn oikea-/vasenkätisen M6-virittimen käyttöön on todentamatta.

| Suure | Tasavälinen vertailurivi | Suora kieliveto, sama reunaetäisyys |
| --- | --- | --- |
| Suurin sivuttaiskulma satulalla | 1,335314° | alle 1e-9°; numeerinen nolla |
| Kielikulmien RMS | 0,731476° | alle 1e-9° |
| Reikäjako | 23,659459 mm | 23,435141 → 19,739118 mm |
| Reikien keskusten etäisyys suorasta reunasta | 12,999420 mm | 12,999420 mm |
| Suurin siirto tasavälisestä rivistä | 0 mm | 12,664018 mm |
| Kieli-, reikä-, pylväs- ja aluslevygeometria | Osatarkistukset läpäisty | Osatarkistukset läpäisty |

Suoran vedon peräkkäiset jaot kaulan puolelta kärkeen: **23,435 / 22,617 / 21,841 / 21,105 / 20,405 / 19,739 mm**. Korjaussiirtymät tasavälisen rivin kohdista ovat **+0,150 / −0,074 / −1,116 / −2,934 / −5,489 / −8,744 / −12,664 mm** reunan tangenttisuunnassa. Miinus tarkoittaa kohti kaulaa.

Nämä siirtymät koskevat tässä laskettua kiinteää reunan suuntaa ja normalisoitua reunaetäisyyttä. Ne eivät ole kaikkien mahdollisten lavan asentojen, reunakulmien tai reunaetäisyyksien pienin siirtotarve. Kielten 0° jatko on laskennallinen keskiviivamalli ilman kielen paksuutta tai käämintäkerroksia.

## Kohdistus ja muunnospoikkeamien normalisointi

Lähde `CDR/headstock-research/seven-string-headstock.svg` on muuttumaton kopio hyväksytystä seitsemänkielisestä lapa-SVG:stä. SHA-256: `2aca94e3fea03df99d58457d534366c33bf7b101c4592e479a9823ed54565718`. Sivumitta ja viewBox vahvistavat suhteen 1 SVG-yksikkö = 1 mm.

SVG:n avoimen liittymän päät kohdistetaan **laudan reunoihin satulalla**, ei uloimpien kielten kontakteihin. Alkuperäinen 47,902957 mm liittymä sovitetaan 48,096 mm laudan leveyteen yhdellä uniform scale + rotation + translation -muunnoksella:

- tasainen skaalaus 1,004029880 eli noin +0,403 %;
- kierto −0,060634°;
- liittymän suurin päätepistevirhe 1,24e-14 mm;
- suoran reunan pituus kohdistettuna 174,974448 mm ja kulma 17,493859°.

Kaulan satula- ja tallakontakteja ei muuteta. Reikien paikat skaalataan lavan mukana, mutta tutkimuksen nimellisiä Ø6-pylväitä, Ø10-reikiä ja Ø14,5-aluslevyjä ei skaalata.

Reikäkeskukset projektoidaan suoran reunan tangentille `e` ja normaalille `n`. Normalisoidun rivin yhteinen normaalietäisyys on keskiarvo; tangenttisuuntainen aloitus ja tasajako sovitetaan pienimmän neliösumman menetelmällä indeksiin 0…6. Tämä oikaisee sekä rivin reunan suuntaiseksi että jaon tasaiseksi. Suurin normalisointisiirto on **0,306115 mm**, RMS **0,206179 mm**. Nämä luvut eroavat pelkästä vapaasti sovitetun suoran 0,0975 mm sivupoikkeamasta, koska nyt myös reunan suunta ja tasavälisyys ovat pakollisia.

## Laskentamenetelmä

`S_i` on kielen satulakontakti, `B_i` tallakontakti ja `u_i` vektorin `S_i−B_i` yksikkösuunta. `C_i` on pylvään keskipiste. Kieli sivuaa pylvästä, eikä kulje porausreiän keskipisteeseen. Samalla reunaetäisyydellä keskipiste on `C_i = A + h*n + t_i*e`.

Suoran vedon ehto on `cross(u_i,C_i−S_i) = sigma*r`, missä `r=3 mm` ja `sigma=-branch` on yhteinen kaikille seitsemälle kielelle. Kiinteällä `h`:lla jokaiselle kielelle ratkaistaan:

`t_i = (sigma*r − cross(u_i,A+h*n−S_i)) / cross(u_i,e)`.

Tangentti, forward-suunta, järjestys, muiden pylväiden väistö, kielten keskinäinen risteäminen sekä reikien ja aluslevyjen pysyminen lavassa tarkistetaan erikseen. Lähes nollainen nimittäjä on ratkaisematon rinnakkaisuus, ei clampattava arvo. Alkuperäistä ulkomuotoa ei muokata kohdistuksen lisäksi; saumaton tangenttijatkuvuus liittymässä ei ole tämän kokeen hyväksymisväite.

## Kielijaon herkkyyskoe ja kosketuspuolet

Testattiin 9 yhdistelmää: satulajako 6,5 / 7 / 7,5 mm × tallajako 10 / 10,5 / 11 mm. Jokaiselle molemmat yhteiset kosketuspuolet ja molemmat sijoittelut: **36 layoutia**.

- Puoli A: kaikki 9 tasavälistä ja 9 suoran vedon sijoittelua läpäisevät osatarkistukset. Normalisoidun rivin suurimmat kulmat ovat tapauksesta riippuen 0,9515–1,7349°.
- Puoli B: kaikki 9 tasavälistä sijoittelua ja 6 suoran vedon sijoittelua läpäisevät. Kolme suoran vedon tapausta satulajaolla 6,5 mm hylätään, koska kieli osuu toiseen pylvääseen.
- Yhteensä **33/36 geometrisesti kelvollista osatason sijoittelua**. Kolme hylkäystä ovat laskennan odotettuja tuloksia, eivät peitettyjä testivirheitä.

**Jokainen kaulaleveys sovittaa ja skaalaa lavan uudelleen.** Koe koskee kaulaan sovitettavaa lavaperhettä, ei yhtä muuttumatonta fyysistä lapaa kaikilla kieliväleillä. Kolme hylkäystä koskevat tämän menetelmän kiinteää reunaetäisyyttä; ne eivät sulje pois toista reunaetäisyyttä.

Oletusvertailun puolella B tasavälisen rivin suurin kulma on 9,519336°. Suoran vedon sijoittelussa yhden kielen pienin etäisyys toisen pylvään pintaan on vain 0,139011 mm. Se ylittää kokeen numeerisen 0,005 mm:n rajan, mutta siitä ei johdeta käytännön sopivuusväitettä. Täysi M6-koneisto, ruuvi, nuppi, käyttötila ja puun lujuus ovat todentamatta kaikissa tapauksissa.

## FEATURE BRIEF — tutkimusvertailu

**Tavoite:** näyttää, miten annetun seitsemänkielisen lavan reikärivi kohtaa nykyisen kaulalaskennan kielilinjat. Tila DESIGN READY; arkkitehti tarkisti menetelmän ennen lopputuloksen hyväksymistä.

**Ei-tavoitteet:** ei tuotantosovelluksen integraatiota, formaattimuutoksia, valmistusvientiä, täyttä M6-sovitusta tai 6/8-kielisten uutta testiä tässä kierroksessa.

**Käyttäjän vahvistamat päätökset:** pienet SVG-poikkeamat voidaan oikaista referenssitutkimuksessa; alkuperäisen mallin yleinen muoto toimii vertailuna. Tasajakoehtoa ei ole poistettu tuotteen vaatimuksista.

**Sallitut paikalliset oletukset:** yllä yksilöidyt seitsemänkielisen kaulan mitat ja aiemmin valitun M6-profiilin osamitat. Kaksi yhteistä kosketushaaraa ovat tutkimustapauksia.

**Käyttäytymispolut:** näytä lavan kaulakohdistus ja talla–satula–pylväs-kielilinjat; vaihda tasavälisen ja suoran vedon vertailun välillä; tarkastele kumpaakin kosketuspuolta ja kaikkia seitsemää kieltä. Matemaattinen herkkyyskoe on erillinen näkyvän oletusvertailun tausta.

**Muutettavat vastuualueet tai tiedostot:** vain `scripts/headstock-reference/`, tämän vertailun analyysit, muuttumaton paikallinen referenssikopio ja keskustelun erillinen visualisointi.

**Säilytettävät rajat:** kaulan B/S-kontaktit, kieli-identiteetit, sovelluslähde ja FretFactory-vendor säilyvät. Kaikki kielet käyttävät saman layoutin kosketuspuolta. Kyse on 2D-geometriasta.

**Tietomalli- ja rajapintamuutokset:** vain tutkimus-JSON; ei tuotannon muutoksia.

**Toteutusjärjestys:** SVG-mittaus → similarity-kohdistus → constrained LS -reikärivi → tangentit ja suoran vedon vaihtoehto → herkkyysmatriisi → riippumaton laskenta → näkyvä vertailu ja dokumentointi.

**Hyväksymiskriteerit:** liittymäankkurit täsmäävät, B/S säilyvät, normalisoidun rivin jako ja reunaetäisyys ovat vakioita, suoran vedon tangenttiresiduaalit ovat numeerisesti nollassa, rikotut geometriaehdot raportoidaan, molemmat yhteiset haarat testataan. Tasajaon vapautuminen on näkyvästi nimetty vertailuvaihtoehdossa.

**Testit ja muut varmennustasot:** rajatut toistettavat laskentatestit, riippumaton arkkitehdin matematiikka-auditointi sekä erillisen kuvan paikallinen Edge-tarkistus. Ei sovelluksen QA- tai valmistushyväksyntää.

**Dokumentaatiovaikutukset:** tämä raportti ja raakatulos. README ei muutu, koska sovelluksen toiminta ei muutu.

**Riskit:** exact-matematiikan ja käytännön riittävän pienen kulman ero; kiinteän reunaetäisyyden tuloksen tulkitseminen kaikkien vaihtoehtojen minimiksi; osasovituksen tulkitseminen täydeksi koneistosovitukseksi.

**Ratkaisematta jääneet asiat:** pidetäänkö tasajako pakollisena vai tavoitearvona; sallitaanko pieni määritelty kielikulma; täysi M6-kätisyys ja sovitus. Käyttäjän hyväksyntää näihin tuotevaatimuksen muutoksiin ei oleteta.

**Toteutusvaltuutuksen tila ja peruste:** käyttäjän “jatketaan” valtuutti juuri ehdotetun erillisen tutkimusvertailun. Ei sovellusintegraatio-, Git- tai julkaisulupaa. Työnkulkunäytteiden keruu ei ole käytössä.

## VERIFICATION LEDGER

| Tarkistus | Menetelmä | Tulos ja todistettava asia | Lähtötila / voimassaolo |
| --- | --- | --- | --- |
| Projektin tunnistus | Git-juuri, package.json ja AGENTS.md | Oikea GTRfactory-työtila; Node 24.15.0 / npm 12 -projekti | 9.9.2026 ennen tutkimustiedostoja |
| Laskenta | `node scripts/headstock-reference/analyze.mjs` | 9 kaulaa, 36 layoutia; 33 kelvollista ja 3 yksilöityä törmäyshylkäystä | Tallennettu JSON ja lähdehashit |
| Rajatut testit | `node --test scripts/headstock-reference/analyze.test.mjs` | Ensimmäinen ajo 7/7 PASS; 36 tangenttitarkistusta, 9 kaulan kontaktit, LS-normalisointi, lähdehashit ja 56 sovellustiedoston muuttumattomuus | 9.9.2026, 432,561 ms; ei sovellusmuutoksia |
| Riippumaton matematiikka | feature_architect: oma vektori-, tangentti-, polygon- ja clearance-laskenta | PASS; kaikki 36 luokitusta ja raportoidut luvut täsmäsivät | 9.9.2026; kertaluonteinen tmp-skripti poistettiin, tulos agentin tool-/viestihistoriassa; ei qa_verifier-rooli |
| Kuvan ensimmäiset selaintarkistukset | `node scripts/headstock-reference/browser-check.mjs tmp/seven-string-fit-preview.html` | FAILED: 25 ms odotus havaitsi vanhan valinnan; 5 s ehdollinen odotuskin jäi kerran vanhaan tilaan. Rajattu runtime-diagnoosi käynnistettiin ennen visualisoinnin korjausta. | Historia säilytetään; ei hyväksyttyä UI-näyttöä näistä ajoista |
| Testivalinnan riippumaton diagnoosi | runtime_diagnostician; input/change-arvot, select-arvo, iframe- ja rAF-loki | REPRODUCED: selectOption(String(i)) valitsi myös labelin perusteella väärän optionin. Korjattiin vain testi muotoon selectOption({value:String(i)}) ja odottamaan tulosta. Fragmentti säilyi muuttumattomana. | 9.9.2026; tmp/headstock-rAF-diagnose.mjs. Erillinen nopeiden valintojen rAF-viivehavainto ei selitä 5 s virhettä. |
| Kuvan lopullinen selaintarkistus | node scripts/headstock-reference/browser-check.mjs tmp/seven-string-fit-preview.html | PASS: 112/112 valintatilaa; 736 ja 320 px, vaalea ja tumma teema. Ei konsoli- tai ResizeObserver-virheitä, ei kontrollien/tekstien/sivun ylivuotoa; SVG-tekstit 12 px. | 9.9.2026; tmp/seven-string-fit-browser-results.json. Paikallinen headless Edge, ei fyysinen mobiili tai tuotantosovellus. |
| Kuvan silmämääräinen tarkistus | Pääagentti tarkasti 736 px vaalean ja 320 px tumman tallennetut kuvat | PASS: satula/talla-yhteys, pylväät, kielilinjat ja vertailumittarit näkyvät molemmissa | 9.9.2026; tmp/seven-string-fit-736-light.png ja tmp/seven-string-fit-320-dark.png |

## Toistaminen ja aineisto

```powershell
node scripts/headstock-reference/analyze.mjs
node --test scripts/headstock-reference/analyze.test.mjs
node scripts/headstock-reference/build-visualization.mjs 'ABSOLUUTTINEN-SALLITTU-VISUALISOINTIPOLKU.html'
```

Raakatulos: [seven-string-headstock-fit.json](seven-string-headstock-fit.json). Alkuperäisen referenssin mittaus: [seven-string-headstock-reference.md](seven-string-headstock-reference.md). Aiempien kolmen pakollisen ehdon tarkka koe: [headstock-strict-feasibility.md](headstock-strict-feasibility.md). Aiempi koe ei anna tässä raportoitua kulmaa tai korjausmatkaa eikä sulje pois nyt tutkittua tasajaosta vapautettua vaihtoehtoa.
