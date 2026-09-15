# Humbucker-kolon mittatutkimus ja sijoitusluonnos

Päiväys: 9.9.2026. Tila: tutkimusluonnos piirretty ja selaimessa tarkistettu. GTRfactoryn sovelluslähteitä tai projektiformaattia ei muutettu. Käyttäjän pyyntö kattoi verkkotutkimuksen, yhden kuusikielisen humbucker-kolon piirroksen ja keskiviivalla siirtämisen peruslogiikan.

## Tutkittu mikrofoni

Rajattu lähtömalli on Seymour Duncan SH-12 Screamin' Demon, kuusikielinen avoin humbucker. [Valmistajan mittapiirros](https://www.seymourduncan.com/wp-content/uploads/2019/08/HB-6-String-Screamin-Demon.pdf) tarkistettiin sekä tekstinä että kuvana. Tuumamuunnos on täsmälleen 25,4 mm/in.

| Valmistajan mitta | Tuumaa | Millimetriä |
| --- | ---: | ---: |
| Pääosan leveys poikittain kieliin | 2.700 | 68,58 |
| Pääosan pituus kielten suunnassa | 1.435 | 36,449 |
| Kokonaisleveys korvakkeineen | 3.320 | 84,328 |
| Korvakkeen pituus kielten suunnassa | .500 | 12,7 |
| Kiinnitysruuvien keskiöväli | 3.050 | 77,47 |

77,47 mm on reikien keskiöväli, ei kolon kokonaisleveys. Piirustuksen sivukuvassa ilmoitettu korkeus ei yksin määritä jyrsintäsyvyyttä.

## Piirretty oma koloprofiili

[SVG-piirros](humbucker-sh12-cavity-study.svg): päätila 72 × 40 mm, korvakkeiden kokonaisleveys 86 mm ja korvaketilan pituus 18 mm. Kaikkien pyöristysten säde on 3 mm. Nämä ovat tämän luonnoksen omia mittoja, eivät valmistajan määräämä jyrsintä tai yleinen humbucker-standardi. Profiili sisältää yhden suljetun reunapolun ja erillisellä reference-only-tasolla keskiviivan. SVG:n 110 × 70 mm:n piirtoalalla yksi viewBox-yksikkö on yksi millimetri.

Ulkomittojen nimelliset lisävarat: pääosan sivuilla 1,71 mm, kielten suunnassa 1,7755 mm, korvakkeiden uloimmissa päissä 0,836 mm ja korvaketilan sivuilla 2,65 mm. Pyöristysten kohdalla mahtuminen tarkistettiin erikseen; väljyys ei ole tasainen geometrinen offset. R3 vastaa enintään 6 mm:n terän sisäkulmaa. Olemassa olevan 1:1-laakeriteräperiaatteen mukaan polku esittää haluttua kolon reunaa, ei työkalukeskilinjan rataa.

Luonnos rajataan tämän mikrofonin ylhäältä nähtävään tilavaraukseen. Siinä ei ole kiinnitysreikiä, johtokanavaa, asennusrengasta tai syvyystasoja. Muiden mallien, metallikannen tai Trembuckerin sopivuutta ei väitetä. [Warmoth erottaa humbucker- ja Trembucker-aukot](https://warmoth.com/pickguard-pickups).

## Sijoituslogiikan ehdotus

Käyttäjä vahvisti yhden kolon ja siirtämisen keskiviivalla kaulan fyysisen päädyn ja tallan kontaktiviivan välillä. Suora veto, valinnan yhteydessä näkyvä tarkka etäisyyskenttä ja yksi undo-askel vetoa kohti ovat jatkototeutuksen ehdotuksia. Kololla on yksi sijaintiparametri; muotoa ei tarvitse editoida body-nodeilla.

Luonnoksen etäisyyskenttä mittaa kolon keskeltä tallan kontaktiviivalle. Molemmat reunavälit näytetään erikseen. Havainnollistuksen kaula on 647,7 mm / 22 nauhaa, ja fyysinen pääty on 10 mm viimeisen nauhan jälkeen. Esimerkin kaulan päädyn ja suoran tallalinjan väli on noin 171,8 mm. Tämä esimerkkikaula ei lue käyttäjän nykyistä avointa projektia.

Havainnollistavat varat ovat 5 mm kaulan päätyyn ja 10 mm kontaktiviivaan. Ne ovat omia esimerkkivalintoja, eivät valmistus- tai lujuussuosituksia. Kun D on kaulan päädyn ja suoran tallalinjan väli, d kolon keskeltä tallaan ja kolon pituus 40 mm:

- d ≥ 20 + 10 mm.
- d ≤ D − 20 − 5 mm.
- Koko kolo mahtuu pituussuunnassa vain, kun D ≥ 55 mm.
- Kaulanpuoleinen reunaväli = D − d − 20 mm.
- Tallanpuoleinen reunaväli = d − 20 mm.

Sovellusintegraatiossa lisäksi koko koloprofiilin tulee pysyä rungon sisällä ja erossa kaulataskusta. Pelkkä keskipisteen tarkistus ei riitä. Taka- ja kaulataskusapluunoiden sisältörajat eivät muutu tässä tutkimuksessa.

Nykyisen editorin physicalHeel ja automaattinen tasku tarjoavat todellisen kaulanpuoleisen rajageometrian. Kaulan sivureunan overhang-parametri ei tarkoita otelaudan pituussuuntaista ylitystä. Jos erillinen otelaudan ylitys myöhemmin lisätään, se huomioidaan myös sijoitusrajassa.

Tallan kontaktikäyrän keskiviivaleikkaus tulee johtaa neck.snapshot.bridge-pisteistä samalla PCHIP-laskennalla ja koordinaattimuunnoksella kuin esikatselu, ei SVG-merkkijonosta tai bounding boxista. Monimensuurissa myös koko kolon suhde vinoon/kaarevaan kontaktikäyrään pitää validoida; suoran tallalinjan 1D-esimerkki ei yksin riitä siihen.

Tallan kontaktiviiva ei kuvaa tallan levyä, ruuveja tai tolppia. Siksi todellisen tallan törmäyksettömyyttä ei voida todeta pelkän nykyisen tallalinjan avulla.

## Syvyys ja asennustapa

[Warmothin oman humbucker-jyrsinnän](https://warmoth.com/guitar-pickup-routs) pääsyvyys on 3/4 tuumaa eli 19,05 mm. Rengas- tai pleksikiinnityksessä ruuvien sivutaskut ovat syvempiä; puuhun kiinnitettävästä vaihtoehdosta annetaan erilliset tiedot. Tämä on vertailuesimerkki, ei tämän luonnoksen valmistussyvyys. Lopullinen syvyys riippuu mikrofonin jaloista, säätöruuveista, halutusta korkeudesta, asennustavasta ja rungosta. Syvyyttä ei lukittu.

## Varmennus

- Valmistajan PDF:n mittaviivojen päätteet tarkistettu kuvasta: kokonaisleveys ja reikien keskiöväli erotettu.
- Paikallinen Edge, 736 ja 360 px, vaalea ja tumma: neljä tarkistettua asettelua. Numerosyöte, veto, molemmat siirtorajat, SVG-mitat, konsoli ja ylivuodot PASS.
- SVG-polun bounding box on täsmälleen 86 × 40 mm. Pääosan ja korvakkeiden konservatiivisten suorakaidevaippojen reunoilta otetut 1 608 pistettä ovat polun sisällä.
- Tarkistus: tmp/verify-humbucker-study.mjs; tulokset tmp/humbucker-study-validation.json; kuvat tmp/humbucker-study-{light,dark}-{736,360}.png.
- Ensimmäisessä luonnoskokeessa keskiviivan apuviiva sieppasi hiiriosuman. Apuviiva muutettiin osumattomaksi ja samat tarkistukset läpäisivät.
- Ei fyysistä sovitusta, jyrsintää, tulostimen mittakaavakoetta tai GTRfactory-integraation testiä. Piirros on mitoitusluonnos, ei hyväksytty valmistussapluuna.

## Jatkokehityksen rajaus

Ensimmäiseen sovellusvaiheeseen ehdotetaan yhtä nimettyä koloprofiilia, Etu-näkymän valintaa ja keskiviivalle lukittua vetoa, tarkkaa etäisyyssyötettä, yhden muutoksen historiaa sekä tallennusta/avausta. Tätä integraatiota ei ole vielä toteutettu tai kuvattu READMEssä valmiina. Ennen toteutusta ratkaistaan erikseen projektiformaatin muutos ja se, miten kaulan tai bodyn muutos käsitellään, jos aiempi kolon sijainti lakkaa mahtumasta.
