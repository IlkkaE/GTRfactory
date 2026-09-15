# Schaller M6 Mini: seitsemän- ja kahdeksankielisen lavan mahtuvuus

9.9.2026. Käyttäjän pyyntö: “Varmista m6 koneiston mahtuvuus”. Tarkistus koskee nykyistä tasavälistä seitsemänkielistä mallia ja siitä johdettua kahdeksankielistä mallia, joissa pylväiden jako on 23,659459 mm ja kohtisuora etäisyys viritinreunasta 12,999420 mm. Sovellusta, lapojen muotoa tai reikien paikkoja ei muutettu.

## Tulos

**Schaller M6 Mini PK1004 pienen metallinupin kanssa mahtuu molempiin malleihin valmistajan piirustuksiin perustuvassa konservatiivisessa 2D-tarkistuksessa.** Koneistojen välillä ei ole päällekkäisyyttä, rungot ja kiinnityskorvakkeet pysyvät lavan sisällä ja nupin koko pyörimisliikkeen projektio jää puun ulkopuolelle. Tiukin väli on viereisten koneistorunkojen välillä.

| Tarkistus | 7 kieltä | 8 kieltä |
| --- | --- | --- |
| Viereisten runkojen nimellinen väli, 22,7 mm kokonaisleveys | 0,959 mm | 0,959 mm |
| Viereisten runkojen väli konservatiivisella 22,8 mm tilavarauksella | **0,859 mm** | **0,859 mm** |
| Pyörivien nuppien tilavarausten väli | **3,808 mm** | **3,808 mm** |
| Nupin ja kauluksen tilavarauksen etäisyys puusta | 3,301 mm | 3,301 mm |
| Aluslevyn etäisyys lähimmästä puureunasta | 5,749 mm | 5,749 mm |
| Ø10 porausreiän etäisyys puureunasta | 7,999 mm | 7,999 mm |
| Koneistorungon tilavarauksen etäisyys lähimmästä puureunasta | 5,624 mm | 5,463 mm |
| Kiinnityskorvakkeen tilavarauksen etäisyys puureunasta | 9,862 mm | 8,990 mm |

Taulukko koskee ylärivin LH-suuntausta alla määritellyssä etunäkymässä. Myös peilattu koneisto tarkistettiin geometrisesti: molemmat lapamallit läpäisivät, mutta peilitarkistus ei ole suositus käyttää vääränkätistä koneistoa samalla reunalla.

**Mahtuvuus on tässä nimellistä 2D-mahtuvuutta.** Valmistaja ei anna näissä piirustuksissa ulkoreunojen valmistustoleransseja tai sormitilan minimivaatimusta. Positiivinen 0,859 mm:n väli ei siis ole toleranssitakuu tai väite väljästä asennuksesta. Fyysistä koekappaletta, ruuvinkannan/ruuvitaltan toimintatilaa tai sormikäytettävyyttä ei ole testattu. Projektin pysyvä 2D-raja säilyy.

## Valmistajan lähteet ja variantti

1. [M6 Mini PK1004, mittapiirustus 12/2021](https://schaller.info/media/e4/3a/3f/1707204753/1004CpstZyLvYgstM.pdf): pylväs Ø6; läpivientiosa Ø9,8; kiinnitysosan kokonaisleveys korvakkeineen 22,7; perusrungon mitta 13,5; kiinnitysruuvin keskipisteen siirtymät 8,1 ja 4,1; yleispiirroksen nuppi 18,5; aluslevy Ø14,5 ja keskitysporras Ø10. Pyöreän koneistokannen ulottuma on piirustusvektoreissa ±7,25 mm pylväästä.
2. [M6 Small Button, mittapiirustus 06/2018](https://schaller.info/media/79/20/fe/1707204753/TZ_1101.pdf): pieni nuppi 18,4 × 14,4 mm ja paksuus 7,2 mm. Metalliversion tunnus 1101XX00. Pyörimistilaan käytetään varovaisesti pääpiirroksen suurempaa 18,5 mm leveyttä.
3. [Schaller: Definition of left/right machine heads](https://schaller.info/media/pdf/03/d8/8e/Definition_li_re_Mechanik_englisch.pdf): kätisyyden katselusuunta ja oikea asennus, erityisesti picture 4.

Lähteet avattiin verkosta ja relevantit kokonaiset PDF-sivut tarkastettiin visuaalisesti. Paikalliset alkuperäiskopiot ja niiden SHA-256-hashit ovat tutkimus-JSONissa. Tarkistus käyttää aiemmin valittua pientä metallinuppia; tulosta ei yleistetä kaikkiin M6-nuppi- tai koneistovariantteihin. Nimellinen Ø10 poraus on aiemman suunnitteluprofiilin oletus, ei tästä yleispiirroksesta saatu porauksen toleranssiohje.

## Koneiston 2D-tilavaraukset

Paikallisen koordinaatiston origo on pylvään keskellä, `e` kulkee viritinriviä kohti lavan kärkeä ja `n` reunan sisäpuolelle puuhun. Koneiston nuppi ja akseli ulottuvat ulos lavasta suuntaan `−n`. Akselilinjan **sijainti** on noin `+6,75 mm` e-suunnassa; tämä ei tarkoita akselin olevan e-suuntainen.

- Runko, kiinnityskorvake ja pyöreän kannen projektio rajataan laatikolla `e=[−10,8;12,0]`, `n=[−7,3;7,3] mm`.
- Ulostuloakselin/kauluksen laatikko on `e=[2,4;11,1]`, `n=[−16,4;−6,7] mm`. Se saa tarkoituksellisesti ylittää puureunan projektiossa; sen ei edellytetä jäävän kokonaan puun sisälle.
- Ruuvin keskipiste on `−8,1e + 4,1n`. Korvakkeen varovainen ympyräraja on säteeltään 2,7 mm. Tämä on piirustusvektoreista ulospäin pyöristetty korvakkeen tilavaraus, ei väite ruuvin reiän tai kannan halkaisijasta.
- Nupin ja kauluksen yhteisen ulospäin pyöristetyn alueen normaalirajat ovat `n=[−32,1;−16,3] mm`. Sisäraja −16,3 on vektoripiirroksesta johdettu konservatiivinen raja, ei valmistajan erikseen ilmoittama nimellismitta.
- Nupin koko pyörimisliikkeen e-suuntainen leveys rajataan suorakulmaisen poikkileikkauksen diagonaalilla: `sqrt(18,5² + 7,2²) = 19,851700 mm`. Alue keskitetään nupin akselilinjalle e=6,75 mm. Tämä käsittelee pyörimisen suurimman 2D-projektion; kolmatta suunnitteluakselia ei lisätä sovellukseen.

Siten `23,659459−22,8=0,859459 mm` on konservatiivinen runkoväli ja `23,659459−19,851700=3,807759 mm` on nuppien välinen raja kaikille tämän suorakulmaisen pyörimisvaipan kattamille asennoille. Jälkimmäinen on osien välinen tila, ei sormien käyttötilalle asetettu hyväksyntäraja.

## Kätisyys

Kun kitaraa katsotaan kielten puolelta, kaula on vasemmalla, lapa osoittaa oikealle ja virittimet ovat kuvan yläreunalla, valmistajan picture 4 vastaa **Schallerin LH/left-koneistoa**. Yleispiirroksen keskimmäinen projektio kohdistetaan tällöin yllä olevaan koordinaatistoon. Tämä ei tarkoita “vasenkätisen soittajan viritintä”. Vastakkaisella lavan reunalla tarvitaan peilattu profiili. Peilauksessa e-siirtymät vaihtavat merkkiä, sisäänpäin osoittava n säilyy.

## Varmennusmenetelmä ja näyttö

Kaikki yksittäiset koneistot tarkistettiin, myös rivin ensimmäinen ja viimeinen. Koko lavan Bézier-ääriviivasta käytettiin aiemman laskennan 0,005 mm:n tarkkuudella tasoitettua polygonia. Sisäpuolisten osien kaikkien kulmien on oltava puussa eikä niiden reuna saa leikata puureunaa. Nuppialue ei saa leikata puupolygonia tai sisältää sitä. Eri koneistojen rungot, ulostuloakselit ja nuppialueet tarkistettiin keskenään kaikissa osaparien yhdistelmissä.

| Tarkistus | Menetelmä / komento | Tulos | Voimassaolo |
| --- | --- | --- | --- |
| Lähdemittojen ja katselusuuntien lukeminen | Kokonaiset valmistajan PDF-sivut; Poppler-renderit; feature_architectin riippumaton tulkinta | PASS; perusrungon 13,5 mm ei yksin kata ±7,25 mm kansiprojektiota, joka sisällytettiin lopulliseen vaippaan | 9.9.2026, yllä mainitut PDF-revisiot |
| Nimellinen 2D-sovitus | `node scripts/headstock-reference/m6-fit.mjs` | PASS: 7/8 kieltä × 2 peilausta = 4 sijoittelua; kaikki yllä olevat välit positiivisia | Raakatulos m6-mini-fit.json, lähde- ja kaulageometrian hashit tallennettu |
| Negatiiviset geometriakontrollit | Samassa skriptissä leikkaavat laatikot, puureunan ylitys ja puuhun jäävä nuppialue | PASS: virheelliset sijoittelut tunnistetaan | Sama laskentalähde |
| Vaippojen vastaavuus PDF-vektoreihin | `python -B scripts/headstock-reference/m6-source-check.py` pdfplumber-ympäristössä | PASS: 284 kansi-/takaprojektion, 282 kiinnityspinnan ja 175 nuppi-/kaulusprojektion vektoripistettä vaippojen sisällä. Ø6-ankkuri mitattuna 6,000044 mm. | m6-mini-source-check.json; nimellinen piirustusgeometria, ei toleranssi |
| Riippumaton katselmus | Sama feature_architect tarkisti profiilin, kaavat, kätisyyden ja tulosminimien johdonmukaisuuden | PASS rajattuna nimelliseen 2D-mahtuvuuteen; ei estäviä matemaattisia löydöksiä | Ei QA-roolin sovellushyväksyntä tai fyysinen koe |

Raakadata: [m6-mini-fit.json](m6-mini-fit.json), [m6-mini-source-check.json](m6-mini-source-check.json). Seitsemänkielisen lähtökohta: [seven-string-headstock-fit.md](seven-string-headstock-fit.md). Kahdeksankielisen muodostussääntö: [eight-string-headstock-rule.md](eight-string-headstock-rule.md).

Tämän tarkistuksen jälkeen aiempien kokeiden “fullM6FitStatus: unverified” voidaan täsmentää: **nimellinen 2D-koneistovaippa on nyt varmennettu näille kahdelle tasaväliselle lähtömallille; valmistustoleranssit ja fyysinen käyttösovitus pysyvät todentamattomina.** Historiallisia tulossnapshotteja ei kirjoitettu uudelleen.
