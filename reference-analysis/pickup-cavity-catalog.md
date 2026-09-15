# Mikrofonikolojen valikko: fyysiset profiilit ja sijoitus

Päiväys: 9.9.2026. Tila: lähdetutkimus ja toteutuneen pickup-integraation taustadokumentti. Sovelluksen toteutunut käyttö kuvataan README.md:ssä ja FEATURE_BRIEF.md:n nykytilassa.

## Lähtökohta

Käyttäjä hyväksyi yhden humbuckerin havainnollistuksessa toimivan keskiviivasiirron. Uuden kitaran oletuksena on yksi humbucker-kolo. Kolon valinta avaa sen työkalut; käyttäjä voi lisätä muita koloja valikosta. Käyttäjä vahvisti erikseen, että kaulan asetusten muuttuessa kolo pysyy rungossa paikallaan ja sen etäisyys tallaan päivittyy.

Valikon ensisijainen luokitus on fyysinen tilavaraus ja kiinnitystapa. Sähköinen toimintaperiaate ei määrää koloa: [Seymour Duncan Hot Rails Strat](https://www.seymourduncan.com/single-product/hot-rails-strat) on Strat-kokoinen humbucker, ja [Phat Cat](https://www.seymourduncan.com/single-product/phat-cat) on humbucker-kokoinen P-90. Aktiivinen/passiivinen ei sekään yksin määritä ulkomuotoa. Pariston tila ja johdotus ovat erillisiä jatkoaiheita.

## Tutkitut perheet

Alla olevat muodot kuvaavat profiiliperheitä. Ne eivät ole keskenään vaihdettavia valmistusstandardeja. Tarkka toteutus sidotaan nimettyyn mikrofoniin, kiinnitysvaihtoehtoon ja tarkistettuun piirustukseen.

| Valikon perhe | Runkoon tarvittava tilavaraus | Olennainen variantti tai raja | Ensisijainen lähde |
| --- | --- | --- | --- |
| Humbucker | Pyöristetty päätila ja sivuille kiinnitysjalkojen/ruuvien tilat | Rengas-/pleksikiinnitys ja puukiinnitys voivat tarvita eri syvyystasot. Nykyinen SH-12-luonnos ei kata kaikkia humbuckereita tai Trembuckereita. | [SH-12-mittapiirros](https://www.seymourduncan.com/wp-content/uploads/2019/08/HB-6-String-Screamin-Demon.pdf), [Warmothin jyrsinnät](https://warmoth.com/guitar-pickup-routs) |
| Strat single-coil | Pitkä, kapea päätila ja valitun pohjalevyn/kiinnityksen vaatimat lisätilat | Myös Strat-kokoinen humbucker kuuluu tähän fyysiseen perheeseen. | [Seymour Duncan SSL-1 -piirros](https://www.seymourduncan.com/images/dimensions/SSL1.pdf), [Hot Rails Strat](https://www.seymourduncan.com/single-product/hot-rails-strat) |
| Tele neck | Oma kapea, päistään pyöristetty profiili kiinnitysvaroineen | Pleksin näkyvä aukko on eri asia kuin rungon jyrsintä. | [StewMac: erilliset Tele neck body-, bridge body- ja neck pickguard -sapluunat](https://www.stewmac.com/luthier-tools-and-supplies/types-of-tools/routing-templates/pickup-routing-templates-for-tele-guitar/) |
| Tele bridge | Leveämmän, epäsymmetrisen pohjalevyn ja kiinnityksen vaatima muoto; tavallisesti vino asennus | Keskipiste voi olla keskiviivalla. Muodon kulma ja sovitus on sidottava tiettyyn asennukseen. Pelkkä tallan kontaktiviiva ei todista sopivuutta Tele-tallalevyyn. | [StewMac Tele -sapluunat](https://www.stewmac.com/luthier-tools-and-supplies/types-of-tools/routing-templates/pickup-routing-templates-for-tele-guitar/), [Warmothin Tele-vaihtoehdot](https://warmoth.com/guitar-pickup-routs) |
| P-90 soapbar / dogear | Pitkänomainen pyöristetty pääkolo | StewMacin sama runkosapluuna soveltuu molempiin kiinnityksiin. Dogear-kuoren ulkokorvakkeita ei siis automaattisesti kopioida puukolon ääriviivaan. Valitun mallin ruuvit ja pintatila tarkistetaan erikseen. | [StewMac P-90 -sapluuna](https://www.stewmac.com/luthier-tools-and-supplies/types-of-tools/routing-templates/pickup-routing-template-for-p-90/), [Lollar P-90 Soapbar](https://www.lollarguitars.com/lollar-p-90-pickups/p-90-soapbar) |
| Mini humbucker / Firebird | Humbuckeria pienempi päätila ja mallin vaatimat kiinnitystilat | Näitä ei oleteta samaksi mikrofoniksi tai yleisesti samaksi koloksi. Lollar Firebird voidaan asentaa valmistajan sovitusrenkaalla P-90 soapbar -koloon. | [Lollar Firebird ja kiinnitysvaihtoehdot](https://www.lollarguitars.com/lollar-humbucker-pickups/firebird) |
| Filter'Tron / TV Jones | Kompakti suorakaiteinen päätila; korvakkeet tai korvakkeeton muoto kiinnityksen mukaan | Universal-, No Ears-, Humbucker- ja Soapbar-tyyppiset asennukset vaativat variantin tunnistamisen. Yksi Filter'Tron-nimi ei riitä. | [TV Jones korvaavuus ja asennukset](https://tvjones.com/pickup-replacements), [valmistajan mittatiedot](https://tvjones.com/tv-jones-product-dimensions/) |
| Jazzmaster | Leveän ja matalan rakenteen päätila sekä valitun pohjan/kiinnityksen lisätilat | Kuorellisesta mittapiirroksesta erotetaan varsinainen puuhun uppoava osa. Jazzmaster-kokoinen P-90 käyttää eri fyysistä perhettä kuin tavallinen P-90 soapbar. | [Lollar Jazzmaster ja mittapiirros](https://www.lollarguitars.com/lollar-jazzmaster-pickups/jazzmaster), [P-90 Jazzmaster](https://www.lollarguitars.com/lollar-p-90-pickups/p-90-jazzmaster) |
| Wide Range | Tavallista humbuckeria suurempi päätila ja erilainen kiinnitysjako | Lollar Regalille ilmoitettu rout-mittapari on 3.125 × 1.75 tuumaa eli 79.375 × 44.45 mm. Kaksi ulkomittaa eivät määritä koko polkua, säteitä tai syvyyttä. | [Lollar Regal: rout dimensions ja yhteensopivuusraja](https://www.lollarguitars.com/lollar-humbucker-pickups/regal-humbucker) |

## Toteutuneet v1-suunnitteluprofiilit

Sovelluksessa on viisi alkuperäistä ja neljä uutta version 1 profiilia. Ne ovat suljettuja 2D-suunnittelutilavarauksia, eivät yleisiä jyrsintästandardeja tai fyysisesti varmennettuja CNC-routteja.

| Profiili | Sovelluksen mitat | Väljyys ja lähde |
| --- | --- | --- |
| SH-12 Humbucker | 86 × 40 mm, R3; päätila 72 × 40 mm | [SH-12-tutkimus](humbucker-cavity-study.md) ja lähdepiirros; rekisterin oma suunnitteluprofiili |
| SSL-1 Strat single-coil | 89,82 × 29,9776 mm | Lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm suunnitteluväljyys; [SSL-1-piirros](https://www.seymourduncan.com/images/dimensions/SSL1.pdf) |
| STR-1 Tele neck | 85,248 × 26,9296 mm | Lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm suunnitteluväljyys; [STR-1-piirros](https://www.seymourduncan.com/wp-content/uploads/2019/08/Tele-Rhythm-STR-1.pdf) |
| STL-1b Tele bridge (17°) | noin 76,6 × 49,5 mm käännettynä; lähdepiirroksen kupera äärimuoto + pyöristetty 3 mm suunnitteluväljyys | 17° on Gotoh-piirroksen suunnista johdettu nimetty variantti; [STL-1b](https://www.seymourduncan.com/wp-content/uploads/2019/08/Tele-Lead-Flat-STL-1b.pdf) ja [Gotoh](https://g-gotoh.com/images/pdf/Ti-TC1S-Dim.pdf) |
| SP90 SGZ P-90 soapbar | 87,5 × 36,5 mm, R7,35 | Kuoren mitat + oma 1 mm reuna; [SP90 SGZ -piirros](https://espguitars.co.jp/seymourduncan/wp-content/uploads/sites/13/2025/02/sp90_sgz_dimention.pdf) |

Sijoitus lasketaan koko suljetulle polulle. Rungon, automaattisen kaulataskun, tallan kaarevan kontaktiviivan ja muiden kolojen todellinen leikkaus estää hyväksynnän. Kolo tallentaa centerYmm-arvon rungon koordinaatistossa; etäisyys tallaan johdetaan kontaktikäyrän keskiviivaleikkauksesta maailman X=0-kohdassa. Kaulan muutos pitää sijoituksen paikallaan ja päivittää johdetun etäisyyden. Tallan ääriarvojen ulkopuolella käytetty vaakasuora jatko on editorin leveiden korvakkeiden sijoituskonventio, ei tallalaitteiston mitta.

## Toteutetut 7/8-kieliset profiilit

Sovelluksessa on nyt yhdeksän version 1 -profiilia. Neljä uutta profiilia ovat nimettyjä, lähdekohtaisia 2D-suunnittelutilavarauksia.

| Profiili | Lähde ja mitat | Sovelluksen 2D-varaus |
| --- | --- | --- |
| [SD HB7 uncovered passive mount](https://www.seymourduncan.com/wp-content/uploads/2019/08/HB-7-String-Uncovered-Passive-Mount.pdf) | Body 78,0034 × 35,5092 mm; korvat 93,98 × 13,0048 mm | 99,98 × 41,5092 mm, R2,5; body- ja korvatilaan 3 mm/sivu suorakulmaisissa tilavarauksissa; tämä ei ole tasainen reunavälys kaikkien pyöristysten kohdalla |
| [SD HB8 uncovered passive mount](https://www.seymourduncan.com/wp-content/uploads/2019/08/HB-8-String-Uncovered-Passive-Mount.jpg) | Body 90,8304 × 35,814 mm; korvat 101,092 × 13,97 mm | 107,092 × 41,814 mm, R2,5; body- ja korvatilaan 3 mm/sivu suorakulmaisissa tilavarauksissa; tämä ei ole tasainen reunavälys kaikkien pyöristysten kohdalla |
| [EMG707 soapbar](https://www.emgpickups.com/pub/media/Mageants/7/0/707_0230-0284rb.pdf) | 88,9 × 38,1 mm, R3,175 | 90,9 × 40,1 mm, R4,175; 1 mm/sivu |
| [EMG808 soapbar](https://www.emgpickups.com/pub/media/Mageants/8/0/808_0230-0134rb.pdf) | 101,6 × 38,1 mm, R3,175 | 103,6 × 40,1 mm, R4,175; 1 mm/sivu |

SD7:n PDF ja SD8:n valmistajan JPEG on tarkistettu myös kuvina. EMG707:n ja EMG808:n mitat on tarkistettu valmistajan virallisesta PDF-tekstistä; EMG-kuvatarkistusta ei ole tehty Cloudflare-/työkaluesteen vuoksi. Valmistajien lähdepiirustukset on linkitetty suoraan yllä olevassa taulukossa. Kielimäärä on profiilin metadataa; kaulan todellinen satula- ja tallan kielijänne tulee käyttäjän kaulasta.

## Mitat: mitä nyt tiedetään ja mitä ei

Nykyinen [SH-12-tutkimus](humbucker-cavity-study.md) sisältää piirretyn oman profiilin: päätila 72 × 40 mm, kokonaisleveys korvakkeineen 86 mm, korvaketilan pituus 18 mm ja R3. Nämä ovat luonnoksen mittoja ja väljyysvalintoja, eivät yleinen humbucker-standardi. Sen selain- ja SVG-tarkistukset koskevat havainnollistusta; fyysistä sovitusta ei ole tehty.

Muille yllä oleville, yhdeksän toteutetun profiilin ulkopuolisille perheille ei tässä vaiheessa ole toteutettu nimettyä sovellusprofiilia. Yhdeksän toteutettua profiilia ovat numeerisesti lähdeaineistoon sidottuja suunnittelupolkuja; niiden mitta- ja reuna-arvot eivät silti ole fyysisen valmistuksen varmennus. Uusien profiilien toteutuksessa tarvitaan pohjan ja jalkojen mitat, ruuvien liikevara, asennustapa, jyrsintäsäteet sekä erikseen perusteltu väljyys. Tuotesivulla ilmoitettu akryylisapluunan ulkokoko ei ole kolon koko. Pleksin aukko, mikrofonin kansi ja rungon jyrsintä erotetaan aina.

Warmothin jyrsintäesimerkki toimii tutkimuksen taustaviitteenä, mutta sen syvyys- ja ruuvitilaa ei käytetä tämän sovelluksen mallina. Ensimmäinen valikko käsittelee vain 2D-koloprofiileja; syvyys ei ole sovelluksen tietomallissa.

## Toteutunut käyttöliittymä

- **+ Mikrofonikolo** avaa valikon ilman kohdevalintaa. Valikko näyttää kaikkien yhdeksän toteutetun version 1 -profiilin nimen, SVG-esikatselun ja mitat. Lisääminen valitsee uuden kolon ja vaihtaa Etu-näkymään.
- Etu-näkymän kolon klikkaus avaa kontekstityökalut. Valittu kolo liikkuu vain keskiviivalla. Tarkka etäisyys mitataan kolon keskeltä tallan kontaktikäyrän keskiviivaleikkaukseen; mm- ja tuumasyöte hyväksytään Enterillä tai poistuttaessa kentästä.
- Kaulan muutos pitää kolon rungossa paikallaan ja päivittää tallan etäisyyden. Koko profiilin sijoitus tarkistetaan rungon, taskun, muiden kolojen ja tallan kontaktikäyrän suhteen; virheellinen muutos hylätään atomisesti. Yksi hyväksytty toiminto muodostaa yhden undo-askeleen.
- Profiilien 2D-geometria palvelee suunnittelua. Z-akseli, syvyydet ja 3D on rajattu pysyvästi pois. Fyysistä sovitusta tai valmistusartefaktia ei ole varmennettu; 2D-valmistusviennit ovat erillinen myöhempi vaihe.
## Varmennus ja rajat

Tutkimus perustuu valmistajien, runkovalmistajan ja sapluunavalmistajan yllä linkitettyihin tietoihin. Arkkitehti arvioi sijoitus-, tiedosto- ja muokkauspolut vain luku -tilassa. Vaihekohtaiset hyväksymiskriteerit ja toteutuksen näyttö ovat [FEATURE_BRIEFissä](../FEATURE_BRIEF.md).

Sovelluksen pickup-integraatio on toteutettu projektiformaattiin v5 ja sen käyttö on varmennettu README.md:n ja FEATURE_BRIEF.md:n ledgerissä. Tämä katalogi säilyttää lähde- ja profiiliperheiden tutkimuksen. Syvyyttä, ruuvien ja laitteiston täydellistä sovitusta, rakennelujuutta, valmistusvientiä tai fyysistä jyrsintää ei ole varmennettu; nimetty profiili on suunnittelun apuväline.

