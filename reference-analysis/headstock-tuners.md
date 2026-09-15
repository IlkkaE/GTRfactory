# Lavan virittimet ja kieliveto — taustatutkimus 9.9.2026

Tila: suunnittelun lähdeaineisto. Sovellusta ei ole muutettu tämän tutkimuksen perusteella. Käyttäjä valitsi Schaller M6 Minin lähtökohdaksi, muodon ensisijaiseksi ja automaattisesti sovitettavat reiät. Virittimien kohdalla myös lavan reunan muokkausta saa rajoittaa.

## Lähteet ja mittojen merkitys

| Lähde | Tarkistettu tieto | Käyttö suunnittelussa |
| --- | --- | --- |
| [Schaller M6 Mini, mittapiirustus 12/2021](https://schaller.info/media/e4/3a/3f/1707204753/1004CpstZyLvYgstM.pdf) | Kielipylväs Ø 6 mm; puuhun tuleva runko-osa Ø 9,8 mm; aluslevyn keskitysporras Ø 10 mm ja ulkohalkaisija Ø 14,5 mm. Rungon tasokuvan kokonaisleveys 22,7 mm, runko-osan korkeus tasokuvassa 13,5 mm. Kiinnitysruuvin keskipisteen siirtymät pylväästä 8,1 ja 4,1 mm piirustuksen suunnissa. | Poraus, pylvään kielikosketus ja koneiston vaatima alue erotetaan. Reikää ei mitoiteta pylvään Ø 6 mm:n mukaan. |
| [Schaller M6 Small Button, mittapiirustus 06/2018](https://schaller.info/media/79/20/fe/1707204753/TZ_1101.pdf) | Pieni nuppi 18,4 × 14,4 mm etuprojektiossa. M6 Mini -yleispiirroksen esimerkkinuppi on 18,5 mm leveä. | Ensiprofiilin paikallinen oletus on pieni metallinuppi; tilavaraus käyttää konservatiivisesti suurempaa 18,5 mm:n leveyttä. Nuppivaihtoehtoja ei pidetä geometrialtaan samoina. |
| [Schaller M6 Mini, valmistajan tuotesivu](https://schaller.info/de/m6-mini/10040170.02.53) | Ø 10 mm:n keskitysporras keskittää akselin. Valmistaja erottaa vasemman ja oikean virittimen sekä eri nupit ja pylväät. | Nimellinen 10 mm:n porausprofiili; yksittäisen virittimen 9,8 mm:n osamitta ei ole porausmitan korvike. Profiili yksilöidään variantin ja lähderevision mukaan. |
| [StewMac: Guitar Tuner Drill Jig Instructions](https://www.stewmac.com/video-and-ideas/online-resources/guitar-tuning-machine-installation-and-repair-information/guitar-tuner-drill-jig-instructions-/) | Kuuden virittimen rivin keskilinja on ohjeen mukaan usein 1/2 tuumaa eli 12,7 mm lavan reunasta. Asennuslevyjen pitää mahtua puulle. | 12,7 mm on mahdollinen lähtötavoite, ei yleinen minimi tai kaikille virittimille sopiva vakio. |
| [Gotoh SD91 MG-T, mittapiirustus](https://g-gotoh.com/images/pdf/SD91-MGT-Dim.pdf) | Viereisten pylväiden jako 23,8 mm määrätyssä kuuden virittimen asennuksessa. | Vertailu osoittaa mallikohtaisen jaon. Tätä arvoa ei siirretä M6 Mini -profiiliin. |
| [Hipshot Grip-Lock Open, mittapiirustus](https://docs.hipshotproducts.com/6GL0_GRIP-LOCK_OPEN_DIMENSIONS.pdf) | Koneiston ulkomitat ja kiinnitysruuvin sijoitus annetaan erikseen reiän koosta. Piirros ilmoittaa 10 mm / 13/32 tuuman yhteensopivuutta. | Toinen esimerkki mallikohtaisista tilavarauksista. Yksiköitä ei käsitellä samoina tarkkoina lukuina: 13/32 tuumaa = 10,31875 mm. |
| [Fender: California Standard Redondo CE](https://eu.fender.com/products/california-standard-redondo-ce?variant=50917298766111) | Valmistaja kuvaa yhden sivun viritinrivin tuottamaa suoraa vetoa satulalta. | Tavoitteen valmistajalähde; ei väitettä, että pelkkä 2D-sijoittelu todistaisi viritysvakauden. |

Kaikki neljä PDF-piirustusta luettiin kokonaisina sivuina sekä tekstinä että paikallisesti renderöidyistä kuvista. Alkuperäiset lähdekopiot ovat Gitistä ja sovellusbundlesta poissuljetussa `CDR/headstock-research/`-kansiossa. Mittoja ei päätelty verkkokuvan pikselikoosta. Nupin 18,4/18,5 mm ero ja muut varianttierot on säilytetty näkyvinä.

## Reuna ja virittimien keskinäinen etäisyys

Reiän keskipisteen etäisyys reunasta on eri asia kuin reiän reunaan jäävän puun leveys. Nimellisellä 10 mm:n reiällä ja 12,7 mm:n keskipiste-etäisyydellä puuta jää siinä suunnassa 7,7 mm. Aluslevy tarvitsee 7,25 mm säteensä verran pintaa keskipisteestä; lisäksi tarvitaan valittu reunavara. Nämä ovat geometrisia suhteita, eivät puun lujuuslaskelma.

V1:n koviksi ehdoiksi suunnitellaan reiän ja aluslevyn mahtuminen, kiinnityslevyn ja ruuvialueen mahtuminen, koneistojen ja nuppien välinen tilavara sekä nupin saavutettavuus lavan ulkopuolelta. Pelkkä reikien välisen etäisyyden tarkistus ei riitä. Reunavara, osien välinen lisäväli ja sormien käyttötila ovat sovelluksen erikseen nimettäviä suunnittelurajoja; lähteet eivät anna niille yhtä yleispätevää millimetrilukua.

25 mm:n keskiväliä voi käyttää ensimmäisen suoraviivaisen sijoittelun tavoitearvona: se jättää 22,7 mm:n saman suuntaisten runkojen kokonaisleveyksien väliin 2,3 mm ja 18,5 mm:n nupin leveyksien väliin 6,5 mm. Se ei korvaa käännettyjen tai kaarevaa reunaa seuraavien osien todellista 2D-törmäystarkistusta eikä ole Schallerin ilmoittama minimijako.

## Kielimäärä, satulan kielijako ja rivikulma

Yksinkertaistettu malli: kielten suorat ovat rinnakkaiset, satulan kielijako tasainen, pylväät saman kokoiset ja virittimet suorassa rivissä samalla puolella. Olkoon N kielimäärä, W uloimpien kielten keskipisteiden väli satulalla, s viereisten kielten väli, D viereisten pylväiden keskiväli ja alpha rivin kulma kielten suuntaan nähden. W ei tarkoita satulan koko leveyttä sivureunavaroineen.

- s = W / (N - 1)
- D × sin(alpha) = s, joten D = W / ((N - 1) × sin(alpha))
- Ensimmäisen ja viimeisen pylvään välinen rivipituus L = (N - 1) × D = W / sin(alpha)
- Pituussuuntainen ulottuma = W / tan(alpha)
- Jos D ei saa alittaa geometrisesti sallittua minimiä D_min, alpha ei saa ylittää asin(s / D_min), kun s <= D_min.

Kaavat koskevat vähintään kahta kieltä. Yhdelle kielelle ei lasketa kielijakoa tai rivikulmaa tällä kaavalla. L ei ole koko lavan pituus: ensimmäisen virittimen satulasta alkava varaus, viimeisen jälkeinen päätyvara ja koristeellinen muoto lisätään erikseen.

| N | Esimerkin W | s | Esimerkin D | alpha | L |
| --- | --- | --- | --- | --- | --- |
| 6 | 35 mm | 7 mm | 25 mm | 16,26° | 125 mm |
| 7 | 35 mm | 5,833 mm | 25 mm | 13,49° | 150 mm |
| 8 | 35 mm | 5 mm | 25 mm | 11,54° | 175 mm |

Sama W ja sama kulma tuottavat saman L:n kielimäärästä riippumatta, mutta suurempi kielimäärä pienentää D:tä. Vasta virittimen fyysinen minimiväli pakottaa loiventamaan ja pidentämään riviä, jos täysin suora veto halutaan säilyttää. Jos W kasvaa niin, että s säilyy, D ja kulma voivat säilyä ja rivi pitenee lisättyjen virittimien verran.

## Todelliseen GTRfactory-kaulaan soveltaminen

Satulan ja tallan kielikohtaiset kontaktipisteet tunnetaan nykyisestä geometriasta. Kunkin kielen suunta jatketaan tallalta satulan kautta lavalle. Pylvään keskipisteen täytyy olla tästä ideaalilinjasta pylvään säteen verran sivussa: kieli sivuaa pylvästä, eikä kulje sen akselin läpi. M6-profiilin ideaalilankamallissa säde on 3 mm.

Merkitään satulapistettä S_i, tallapistettä B_i, lavalle osoittavaa yksikkösuuntaa u_i = normalize(S_i - B_i), pylvään keskusta C_i ja käämintäpuolen merkkiä sigma. Täsmälleen suoran vedon ehto on cross(u_i, C_i - S_i) = sigma × r. Lisäksi kosketus on satulan lavanpuolella ja valitaan fyysisesti oikea tangentti. Moniskaalaisessa tai kaarevan satulan mallissa jokaisella kielellä on oma suunta; rinnakkaisten kielten kaava on silloin vain sijoittelun alustus ja havainnollistus.

Todellinen vapaa jänne piirretään satulalta oman pylvään tangenttipisteeseen. Etsintä minimoi ensin suurimman sivuttaiskäännöksen ja sitten kaikkien kielten käännökset sallituissa paikoissa. Kielten järjestys ei vaihdu, kielet eivät risteä eikä jänne osu muihin pylväisiin. Pelkkä nollalevyisten viivojen erillisyys ei tarkoita fyysistä kielivälystä; ensimmäinen versio ei mallinna kielten paksuuksia tai käämintäkerroksia. Z-akselia, lapakulmaa tai pystysuuntaista painetta ei lisätä.

Käyttäjän muoto on ensisijainen. Reiät mukautuvat rajoitettuun viritinalueeseen; mahdotonta ratkaisua ei tallenneta. Kulman ja tarvittavan pituuden sidoksen voi näyttää nodea liikutettaessa sallitun alueen avulla. Tämä ei itsessään valtuuta muuttamaan muuta lavan muotoa automaattisesti.

## Kätisyys ja kielen kiertopuoli

[Schaller: Definition of left/right machine heads](https://schaller.info/media/pdf/03/d8/8e/Definition_li_re_Mechanik_englisch.pdf) erottaa virittimen kätisyyden soittajan kätisyydestä. Valittu asennuspuoli, virittimen suunta ja kielen kiertopuoli täytyy sovittaa yhteen. Valmistajan mukaan kielivedon tulee painaa hammaspyörää kierukkaa kohti. Pelkkä ruudun ylä- tai alapuoli ei yksilöi sopivaa viritintä. Profiilin etu- ja takaprojektiot ankkuroidaan samaan pylvään keskukseen ennen käyttöä.

Täysin suora kieliveto on optimoinnin tavoite. Hyväksyttävässä sijoittelussa vapaa kielijänne sivuaa omaa pylvästään, mutta sen suunta saa poiketa satulaan tulevan kielen suunnasta. Näitä kahta ehtoa ei pidä sekoittaa: tangenttikosketus on geometrinen ehto, nollan asteen sivuttaiskäännös ei ole kaikkien käyttäjän muotojen hyväksynnän vaatimus.

## Käyttäjän lapamalli ja RG-asettelu (9.9.2026)

Käyttäjä antoi tiedoston lapamalli.svg templatessa käytettäväksi ja osoitti Ibanez RG -mallit asettelun ja kaulaliittymän vertailukohdaksi. Alkuperäinen työpöytätiedosto säilyy muuttamattomana. Lähdekopio: CDR/headstock-research/lapamalli.svg. Mitattu geometria: reference-analysis/lapamalli-template.json. Tämä on suunnitteluaineistoa, ei toteutettu sovellustemplate.

SVG:n sivu on 210 × 110 mm ja viewBox 0 0 210 110: yksi koordinaattiyksikkö vastaa yhtä millimetriä. Se sisältää yhden avoimen polun, yhdeksän päätepistettä ja kahdeksan segmenttiä. Vasemman pään liittymäpisteiden väli on 42,6803 mm. Niiden x-koordinaateissa on 0,0507 mm:n ero, joka poistuu johdettaessa liittymä sovelluksen satulapisteistä. Pitkä viisto reuna on oikea suora L-segmentti, pituudeltaan 154,2855 mm ja kulmaltaan 17,5686 astetta SVG:n vaakasuuntaan. Ääriviivan rajaus on noin 186,4468 × 79,1158 mm. Nämä mitat luettiin vektoreista ja selaimen SVG-geometriasta, ei kuvan pikseleistä. Tämä ei vielä ole virittimien mahtumisen tai suljetun alueen numeerinen validointi.

[Ibanez RG421:n valmistajasivun](https://www.ibanez.com/usa/products/detail/rg421_1p_06.html) virallista etukuvaa verrattiin käyttäjän SVG:n renderöintiin. Havaittu asettelu vastaa samaa periaatetta: kaula liittyy lavan vasempaan päähän, vasemmalla on kaksi levenevää olkaa ja kuusi viritintä seuraa yläpuolen viistoa reunaa. Reikien keskukset ovat reunan sisäpuolella. Koko lavan kärkeä ei tarvitse kohdistaa kaulan keskilinjalle. RG421:n ilmoitettu kaulan leveys satulalla on 43 mm, joten käyttäjän noin 42,68 mm:n liittymä on saman kokoluokan kuusikielisen kaulan lähtökohta. Myös [RG550:n valmistajasivu](https://www.ibanez.com/jp/products/detail/rg550_00_04.html) ilmoittaa 43 mm satulaleveyden. Valokuvasta ei johdeta tarkkaa RG-lavan mittakaavaa, reikäjakoa tai kulmaa.

Suunnittelun täsmennys: tämän oletuslavan viritinreuna aloitetaan suorana ja merkitään semanttiseksi viritinalueeksi. Pylväiden suoran rivin alustus kulkee sen suuntaisesti lavan sisäpuolella. Varsinaiset reikien etäisyydet, suunta ja kielitangentit lasketaan valitun Schaller M6 Mini -profiilin ja sovelluksen kaulan mukaan. RG-vertailu ei vaihda valittua viritinmallia tai kaulan parametreja. Malli ei sisällä valmiita viritinreikiä.

Liittymä ankkuroidaan avoimen polun kahdesta päästä sovelluksen satulan päihin; paikallisen koordinaatiston pituussuunta johdetaan kaulasta. Liittymän viereiset kahvat sovitetaan jatkuvaan kaulan sivulinjaan. Vapaan lavan suhteet säilyvät kielimäärän mukaisessa suurennuksessa ja kielijaon mukaisessa tasokierrossa. Satulaliitos sovitetaan erikseen kaulan todelliseen leveyteen. Sisäistä containment-laskentaa varten avoin polku suljetaan johdetulla satularajalla; näkyvässä kuvassa käytetään yhteistä satulalinjaa. Lähde-SVG:tä käyttäjän ei tarvitse sulkea tai piirtää uudelleen.

Varmennus: SVG-tekstin tarkistus, puhdas paikallinen renderöinti asennetulla Edgellä ja sen kuvakatselmus, analyyttinen suoran segmentin pituus/kulma sekä SVG getBBox. RG421:n virallinen kuva katsottiin selaimessa. Sovelluslähteitä tai sovelluksen toimintaa ei muutettu; testiajoja tai fyysistä sovituskoetta ei tehty.


## Kielimäärän kasvu ja kulman sovitus (9.9.2026)

Käyttäjä tarkensi, että 6→7/8-kielisessä mallissa viritinreunan lisäksi koko lavan mittasuhteiden pitää kasvaa. Samalla satulan kielijako määrää viritinrivin tavoitekulmaa. Tämä korvaa aiemman kiinteän fyysisen siluetin oletuksen kielimäärän vaihtuessa. Sopimus on FEATURE_BRIEFin lavan osiossa.

L6=154,285547 mm sisältää myös viritinrivin päihin jäävää reunaosuutta, joten (N−1)/5 ei ole koko lavan pakollinen kerroin. Paikallinen pituusalustus lisää kuuden yli 25 mm viritintä kohti: Lseed=L6+max(0,N−6)×25; k=Lseed/L6. N7: 179,2855 mm ja 1,16204; N8: 204,2855 mm ja 1,32407. Vapaa siluetti kasvaa molemmissa suunnissa samalla kertoimella, ja kaikki hardware säilyy todellisen kokoisena. 25 mm on pehmeä alustus, ei Schallerin minimijako.

N≥6: alphaIdeal=asin(W/((N−1)×25)), rotationDelta=alphaIdeal−17,568636 astetta. W on uloimpien kielten väli, ei satulan kokonaisleveys. Oletuksen W=35,814 mm tuottaa 6/7/8-kielisen ideaalirivin kulmiksi noin 16,65 / 13,81 / 11,81 astetta. Tästä syystä jo kuusikielinen alustus voi muuttaa SVG:n kulmaa hieman. Kun W kasvatetaan suhteessa N−1:een, viereisten kielten väli ja kulma säilyvät. N1–5 ei saa automaattista kulman tai koon muutosta.

Pisteet johdetaan yhdestä kuusikielisestä baseOutlinesta tasaisella suurennuksella ja tasokierrolla satulan keskireferenssistä. Satulan reunapisteet ja liittymäkahvojen suunnat johdetaan erikseen kaulasta. Muotoeditit viedään takaisin perusmuotoon muunnoksen inverssillä; kielimäärän vaihtaminen ei kirjoita perusmuotoa. Tämän ansiosta 6→8→6 ei kumuloi skaalausta tai kiertoa.

Nykyinen Kielet-kenttä ei muuta stringSpanNut-, stringSpanBridge- tai overhang-kenttiä. Oletuksen W=35,814 mm ja overhang=3,048 mm/puoli tuottavat 41,91 mm:n satulaleveyden. Havainnollistuksen vaihtoehto säilyttää viereisten kielten väli on kahta geometriaa vertaileva esimerkki, ei nykyisen sovelluksen automaattinen leveydenmuutos.

Kulmakaava on rinnakkaiskielinen alustus. Oikeat S_i/B_i-suunnat, tangentit, reunan etäisyydet ja hardware-fit tarkistetaan erikseen; esimerkki ei näytä valmiita reikiä tai takaa valmistuskelpoisuutta. Sovellusta ei muutettu.

## Kielivedon mittarin vertailulaskut (9.9.2026)

Suoruus mitataan satulaan tulevan kielen jatkosuunnan ja satulalta oman pylvään pintaan kulkevan tangenttijänteen välisenä kulmana. Pelkkä reunan kulma tai reiän keskipisteiden linjaus ei todista sitä. Aiempi headstock-string-count-muotohavainnollistus ei laskenut reikiä tai tätä mittaria; uusi erillinen headstock-lab-fragmentti laskee ne testiaineistolle.

Analyyttinen koejärjestely: satula (0,0), tuleva kielisuunta (1,0), pylvään säde 3 mm. Keskus (100,3) antaa nollapoikkeaman; keskus (100,0) antaa 1,719131 astetta, vaikka keskipisteeseen piirretty viiva olisi suora; keskus (100,5) antaa 1,145419 astetta. Kolmen tapauksen säde-, tangentti-, suunta- ja vertailukulmatarkistus läpäisi. Laskenta: tmp/headstock-straightness-check.mjs; tulos: reference-analysis/headstock-straightness-checks.json. Nämä eivät ole lapamalli.svg:hen sijoitettujen virittimien tuloksia.

Nykyisen oletuskaulan uloimpien kielten suunnat poikkeavat keskiviivan suunnasta noin 0,617872 astetta, kun ne johdetaan oikeista satula- ja tallaväleistä (35,814 ja 49,784 mm) sekä 647,7 mm:n pituussuuntaisesta mittaparametrista. Rinnakkaiskielinen kaava on siksi jo oletuskaulalle likiarvo. Varsinainen tarkistus käyttää kunkin kielen S_i/B_i-kontakteja, myös moniskaalassa.

Testattava tavoite on ensin kelvollinen hardware-sijoittelu, sitten pienin löydetty pahimman kielen poikkeama ja sen jälkeen kulmien summa. Rakennettu nollakulman vertailumalli tarjoaa tunnetun alarajan; yleinen käyttäjän muoto ei. Koko testipolku ja näyttötasot on täsmennetty FEATURE_BRIEFissä. Sovellusta ei muutettu.

## Suoran kielivedon headstock-lab-testiesikatselu (9.9.2026)

Uusi koe on erillinen geometriatyökalu, ei GTRfactoryn v6-sovellusintegraatio. Se käsittelee 12 skenaariota ja molemmat nimetyt tangenttihaarat, yhteensä 24 sijoittelua. Jokaisessa osatason valid=true; 18 tapauksessa maxangle < 1e−8°. Fixed-total 7 branch− -tulokset equal/multiscale-järjestyksessä ovat 1,233396 ja 1,285978 astetta. Fixed-total 8 branch+ -tulokset equal/multiscale-järjestyksessä ovat 1,282594 ja 1,322700 astetta; branch− 6,733191 ja 7,108323 astetta. Fixed-gap saavuttaa kaikki 6/7/8-haarat laskentatarkkuuden nollassa. Mahdoton pieni lapa hylätään.

Tangenttihaarat on merkitty labin omilla merkeillä: cross(w, C−S)=−branch*r ja sigma=−branch. DenseReference on riippumaton hakupolku vain tasajaollisen rivin alijoukossa; tulos on solverin rajatun haun parasta löydettyä ratkaisua, ei jatkuvan ongelman globaali optimum. Pseed=25 mm on paikallinen alustus, ei valmistajan minimijako. Geometrialuvut Ø6-postille, Ø10-reiälle ja Ø14,5-aluslevylle eivät varmista täyttä M6-housingin, ruuvin, nupin, gripin, kätisyyden tai puuvaran sopivuutta. Täysi M6-fit jää unverified, ja geometrisesti läpäissyt osatason sijoittelu voi vielä hylkääntyä täydessä koneistotarkistuksessa.

node --test scripts/headstock-lab/lab.test.mjs tuotti 10/10 PASS (22,066 s); toiminnallinen selaincheck node scripts/headstock-lab/browser-check.mjs tmp/headstock-lab-preview.html tuotti 4/4 matriisia ja 96 skenaariovalintaa. Layout-only-check ajettiin erikseen Edge-koossa 736 ja 390 light/dark-tiloissa: console errors 0 ja overflow 0; pääagentin kuvakatselussa ei havaittu layout-ongelmia. Kapea koe oli 390 px:n selainviewport, ei touch-, Safari- tai fyysinen puhelinkoe. Fragmentti on visualization-kansion skillin iframe-kääreessä.

Lopullinen näyttö on reference-analysis/headstock-lab-results.json ja tmp/headstock-lab-tests-final.txt. Source/config-baseline sisältää 56 SHA256-hashia ja pysyi muuttumattomana. Ensimmäinen 8/9-lab-ajo, arkkitehdin 7/9-väliajo, Generate2:n fitprojection-yritys ja browserin selectOption('5')-virhe ovat historiallista korjausnäyttöä; lopullinen selainajo käyttää value='5'. Fyysistä valmistuskoetta, artefaktia, julkaistua ympäristöä tai sovellus-UI-varmennusta ei tehty.




## Kielijaon jatkorajat

Tasajaollisen 7/8-kielisen kaulan paikalliset suunnittelurajat ovat [string-spacing-limits.md](string-spacing-limits.md)-raportissa: satulalla 6,5–7,5 mm, tallalla 10,0–11,0 mm ja niistä johdetut outer span -alueet. Raportti ei ole yleisstandardi eikä sovellusvalidointi. Tiukka 0°-tavoite ja tasarivi ovat uusia jatkovaatimuksia; aiempi lab-näyttö ei varmista niitä.

## Tiukka kolmen ehdon strict-koe

Täsmällinen strict-koe on dokumentoitu raportissa [headstock-strict-feasibility.md](headstock-strict-feasibility.md). Se osoittaa ilmoitetuille 39 tallennetulle kaulaskenaariolle ja kahdelle yhteiselle sigma-haaralle exact linear infeasibility -sertifikaatin; raportti erottaa tämän aiemmasta rajatusta labista, positiivisista kontrolleista ja fyysisesti todentamattomasta M6-fitistä. Sovellusta ei muutettu.
