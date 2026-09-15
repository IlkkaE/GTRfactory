# 7- ja 8-kielisten sähkökitaroiden kielijaon rajat

Päiväys: 9.9.2026. Tila: numeerinen suunnittelupäätös käyttäjän pyynnöstä, ei toteutettu sovellusvalidointi. Tutkimus koskee tavallisia yksittäiskielisiä sähkökitaroita; bassot, kieliparit ja lap steel -soittimet eivät kuulu otokseen.

## Päätös

GTRfactoryn seuraavassa tasajaollisen kaulan suunnitteluvaiheessa käytetään seuraavia suljettuja alueita. Molemmat päätepisteet ovat sallittuja.

| Kielimäärä | Viereinen jako satulalla | Viereinen jako tallalla | Uloimpien kielten väli satulalla | Uloimpien kielten väli tallalla |
| --- | --- | --- | --- | --- |
| 7 | 6,5–7,5 mm | 10,0–11,0 mm | 39,0–45,0 mm | 60,0–66,0 mm |
| 8 | 6,5–7,5 mm | 10,0–11,0 mm | 45,5–52,5 mm | 70,0–77,0 mm |

Nämä ovat ensimmäisen toteutuksen tuettu suunnittelualue. Ne eivät ole valmistusstandardi, kaikkien markkinoilla olevien kitaroiden ääriarvot tai fyysisen soitettavuuden rajat. Alueen ulkopuolinen kitara ei tämän tutkimuksen perusteella ole mahdoton. Sovellukseen toteutettaessa ylitys tarkoittaa tämän version tukeman suunnittelualueen ylitystä.

## Mitta ja muunnos

- `s` on viereisten kielten keskilinjojen poikittainen etäisyys, erikseen satulalla ja tallalla. Se ei ole kielten pintojen väli.
- Tasajaollisessa mallissa uloimpien kielten kokonaisväli on `W = (N − 1) × s`. Nykyiset `stringSpanNut` ja `stringSpanBridge` tarkoittavat tätä kokonaisväliä.
- Jos lähde kertoo vain kokonaisvälin, lasku `W / (N − 1)` antaa vastaavan tasajaon eli keskimääräisen keskivälin. Se ei todista, että valmiin satulan jokainen väli olisi sama.
- Kaulan/satulan kokonaisleveys sisältää erilliset sivureunavarat. Symmetrisessä mallissa leveys on `W + 2 × overhang`. Ibanezin 48 tai 55 mm:n satulaleveyksiä ei siksi käytetä kielten kokonaisväleinä.
- Moniskaalassa poikittainen projektio, vinon kontaktiviivan pituus ja satulakaaren pituus ovat eri mittoja. GTRfactoryn rajat koskevat poikittaista parametria. Valmistajan nimellistä spread-arvoa käytetään vertailutietona, ei valmiin moniskaalakaulan CAD-kopiona.

## Valmistajien ilmoittamat vertailumitat

Kaikki lähteet tarkistettiin 9.9.2026. Tuotenimien numerot eivät itsessään määritä kielimäärää: esimerkiksi Floyd Rosen R7/R8-satulat eivät tarkoita 7/8-kielisiä satuloita.

| Valmistaja ja malli | Kieliä | Paikka | Lähteen mitta | Tasajaon vertailuarvo |
| --- | --- | --- | --- | --- |
| [Graph Tech 6748-L0, Schecter Style Left](https://graphtech.com/products/black-tusq-7-str-48-x-6-schecter-lefty) | 7 | Satula | String spread 40,08 mm | 40,08 / 6 = 6,680 mm |
| [Graph Tech 5700-00, Fender Style](https://graphtech.com/products/tusq-nut-slotted-strat-style-7-string) | 7 | Satula | String spread 41,8 mm | 41,8 / 6 = 6,967 mm |
| [Schaller 2050, 7-string locking nut](https://schaller.info/en/1-tremolo-locking-nut-for-7-strings-complete/2050) | 7 | Satula | B–E 41,50 mm | 41,50 / 6 = 6,917 mm |
| [Strandberg Boden Metal, Measurements-taulukko](https://strandbergguitars.com/eu/product/boden-metal-7-white-pearl/) | 7 / 8 | Satula | Nut spread 42 / 49 mm | 7,000 / 7,000 mm |
| [Floyd Rose FR18NRC, 8-string locking nut](https://www.floydrose.com/products/8-string-locking-nut) | 8 | Satula | Piirroksen keskivälien summa 45,87 mm | 45,87 / 7 = 6,553 mm |
| [Graph Tech PT-6849-00, Multiscale](https://graphtech.com/products/black-tusq-xl-8-string-multi-scale-nut-flat-bottom-pt-6849-00) | 8 | Satula | Str.Sp 50,25 mm; projektion suunta avoin | Nimellismitasta 50,25 / 7 = 7,179 mm |
| [Ibanez RG7421, F107](https://www.ibanez.com/usa/products/detail/rg7421_1p_08.html) | 7 | Talla | String space 10,5 mm | 10,500 mm |
| [Gotoh GE1996T-7](https://g-gotoh.com/product/ge1996t-7/?lang=en) | 7 | Talla | String spacing 10,8 mm | 10,800 mm |
| [Ibanez RG8, F108](https://www.ibanez.com/usa/products/detail/rg8_1p_08.html) | 8 | Talla | String space 10,5 mm | 10,500 mm |
| [Hipshot 4MS08180, 8-string multiscale 18°](https://docs.hipshotproducts.com/4MS08180_-_8_STG_MULTISCALE_GUITAR_BRIDGE_18_DEG_.125.pdf) | 8 | Talla | Poikittainen jako 0,416 tuumaa; piirroksessa pyöristetty 10,6 mm | 0,416 × 25,4 = 10,5664 mm |

Graph Techin [mittausohje](https://help-center.graphtech.com/en-US/finding-the-right-nut-%282%29-698990) erottaa kokonaispituuden kieliurien keskusten välisestä spread-mitasta. Taulukon 6748-L0 on nimenomaan vasenkätinen tuote; sen mittaa ei esitetä kaikkien saman sarjan versioiden mitaksi.

Strandbergin linkin nimi koskee 7-kielistä, mutta valmistajan Measurements-taulukko ilmoittaa erikseen 6-, 7- ja 8-kieliset. Headless-rakenne kelpaa kielijaon vertailuksi, vaikka GTRfactoryn lapa käyttää erillisiä virittimiä. Taulukko ei varmista Schaller M6 Mini -asennusta.

Floyd Rosen [virallisen FR18NRC-mittapiirroksen](https://cdn.shopify.com/s/files/1/1711/6239/files/FR_8-String_Locking_Nut_Specs.pdf?v=1644849153) poikittainen keskiväliketju on 7,28 + 7,00 + 6,79 + 6,49 + 6,25 + 6,11 + 5,95 = 45,87 mm. Piirros tarkistettiin kuvana erillisessä arkkitehdin lähdeluennassa. Mittaketju on pyöristetyistä nimellismitoista laskettu; osan 53,80 mm:n kokonaisleveyttä ei käytetty spanina. Todelliset raot ovat epätasaiset. Niiden syytä ei päätellä, eikä tätä osaa väitetä tasajaolliseksi.

Graph Tech PT-6849-00 on multiscale-osa: [valmistajan mittausohje](https://help-center.graphtech.com/en-US/how-to-measure-a-guitar-nut-and-saddle-719485) vahvistaa urien keskeltä keskelle -merkityksen, mutta ei tämän tuotteen 50,25 mm:n mittaprojektiota. Se on nimellinen markkinavertailu, ei tarkasti varmennettu poikittainen 50,25 mm:n malliparametri.

Hipshotin yhden sivun mittapiirros tarkistettiin kuvana. 0,416 tuuman mitta kulkee kohtisuoraan kitaran pituussuuntaiseen CL-linjaan nähden. Se ei kulje 18 astetta vinon tallarivin suuntaisesti. Tuumamitta on nimellismitta; muunnoksen lisädesimaalit eivät lisää valmistustarkkuutta. Muita piirroksen mittoja, korkeuksia tai jyrsintäsyvyyksiä ei siirretä projektiin.

## Rajojen peruste

7-kielisten satuloiden tässä otoksessa vastaava tasajako on 6,68–7,00 mm. 6,5 mm jättää kompaktin 6,68 mm:n esimerkin alle 0,18 mm:n suunnitteluvaran; 7,5 mm sallii tavallista 7 mm:n vertailua väljemmän jaon. Ylärajan 0,5 mm:n lisä on ohjelman oma suunnitteluvalinta, ei lähteestä löydetty soitettavuuden kynnys.

8-kielisen Floyd Rose -ketjun vastaava tasajako on noin 6,553 mm. Sen alle jää 6,5 mm:n alarajalla noin 0,053 mm:n suunnitteluvara. Strandbergin ilmoitettu 49 mm:n levitys vastaa 7 mm:n tasajakoa. Graph Techin multiscale-osan nimellisestä spread-mitasta saadaan noin 7,179 mm:n vertailuarvo, mutta sen mittaprojektio jää avoimeksi. Näin 8-kielisenkin aineisto tukee samaa käytännöllistä aluetta; lähteiden epävarmuutta ei muuteta tarkaksi ergonomiseksi rajaksi.

Sama 6,5–7,5 mm:n alue on tarkoituksellinen molemmille kielimäärille. Kieliä lisäämällä ei tarvitse kaventaa viereistä jakoa. Sen sijaan kokonaisväli kasvaa: esimerkiksi 7 mm:n jaolla se on seitsemänkielisessä 42 mm ja kahdeksankielisessä 49 mm. Vanha kuusikielisen oletuskokonaisväli 35,814 mm tuottaisi vastaavasti vain 5,969 ja 5,116 mm:n jaot ja jäisi uusien rajojen ulkopuolelle.

Tallojen suoraan varmennetut vertailuarvot ovat 7-kielisissä 10,5–10,8 mm ja 8-kielisissä 10,5–10,5664 mm. Yhteinen 10,0–11,0 mm:n suunnittelualue kattaa ne ja jättää maltillisen varan kapeammille ja leveämmille käyttäjän malleille. Näitä päätepisteitä ei esitetä valmistajien ilmoittamina minimi- ja maksimimittoina. Rajan sisällä oleminen ei lupaa, että jokaiseen vapaasti valittuun jakoon on valmis ostotalla.

## Toteutussopimus ja rajat

Lähdetutkimus määrittää tässä vain 7/8-kielisten tasajaollisen kaulan rajat. Kuusikielisen oletuksia, projektiformaattia, nykyistä sovellusta tai testiesikatselun laskentaa ei muuteta.

Tuleva validointi muuntaa kokonaisvälin viereiseksi jaoksi kielimäärän avulla ja tarkistaa satulan ja tallan erikseen. Käyttäjän satula- tai tallakontakteja ei muuteta lavan sovittajan sisällä. Kielimäärän vaihdon ei pidä huomaamatta puristaa lisää kieliä vanhaan kokonaisväliin; mahdollinen jaon säilyttävä muutos näytetään kaulaluonnoksessa käyttäjälle ennen hyväksyntää.

Nämä rajat eivät yksin ratkaise nollan asteen kielivedon, suoran reunan, saman reunaetäisyyden ja tasavälisen viritinrivin yhteensopivuutta. Reikien paikat ja lavan tarvittava pituus ratkaistaan vasta sallituille satula- ja tallakontakteille. Myös kielten paksuuden huomioiva epätasainen satulajako olisi eri ominaisuus kuin tämä tasajaollinen malli.

## Varmennus

Lähteiden lukeminen ja Hipshotin PDF:n kuvantarkistus ovat mitoitustutkimusta. Laskennallinen tarkistus kattaa keskiarvot, tuumamuunnoksen ja rajojen kokonaisvälit. Ne eivät ole uuden sovellusvalidoinnin, lavan geometrisen ratkaisun, fyysisen soitettavuuden tai valmistuksen testinäyttöä. Varsinaiset alaraja/yläraja/rajan ulkopuoli -sovellustestit kuuluvat toteutusvaiheeseen.
