# Kaulan kantapää ja otelaudan pää: taustatutkimus 2026-09-09

## Ensisijaiset lähteet

- [Warmoth: Number of Frets](https://warmoth.com/guitar-neck-fret-numbers): valmistajan 22 nauhan mallissa otelauta ulottuu kantapään yli 1/4 tuumaa (6,35 mm); 21 nauhan vaihtoehdossa päät ovat tasan. 24 nauhan jatke ulottuu 1,062 tuumaa (26,9748 mm), jolloin kaulamikrofonin paikkaa täytyy siirtää. Tiedot saatiin verkkohakutyökalun sivutekstistä; suora sivuavaus palautti 403.
- [Warmoth: Will it fit my Guitar Body?](https://warmoth.com/guitar-neck-fit): valmistaja luettelee myös 22 nauhan kauloja ilman ylitystä. Nauhamäärä ei siis yksin määrää rakennetta, eikä yhtä yleistä ylitysmittaa pidä lukita.
- [Allparts: Select Tribute 1984](https://www.allparts.com/collections/guitar-necks/products/allparts-select-tribute-series-1984-replacement-strat-neck): tuotteen suorakulmainen otelaudan pää ja pyöristetty kantapää havainnollistavat, että nämä ovat erillisiä ääriviivoja.

## Johtopäätökset tähän 2D-ohjelmaan

Otelaudan pään ja kaulan fyysisen kantapään pituussijainnit on erotettava. Kaulataskun umpinaisen pään sijainti johdetaan vain kantapäästä. Otelaudan ulottuminen rungon päälle muuttaa etunäkymää ja mikrofonille jäävää tilaa, mutta ei taskua.

Kaksi mittaa voidaan ilmaista samasta viimeisen nauhan takimmaisesta pisteestä keskiviivan suuntaisesti. Tällöin niiden erotus on otelaudan ylitys kantapäästä. Käyttäjän tarkennus 9.9.2026: viimeinen nauha ei saa sijaita kantapään ylittävällä otelaudalla. Siksi kantapään päätyvara ei voi olla negatiivinen, ja koko viimeisen nauhan kaaren täytyy mahtua fyysisen kantapään sisään myös pyöristettyjen kulmien kohdalla. Otelaudan ylitys on tämän ohjelman mallissa nauhatonta aluetta. Tämä rajaus ei tarkoita, että kaikki valmistajat käyttäisivät samaa rakennetta. Kaulan nauhakohdistus ja mensuuri määrittävät edelleen satulan ja tallan paikan.

Lähteet eivät määritä yleistä viimeisen nauhan ja kummankaan päädyn välistä millimetrimittaa. Ohjelman oletukset ovat kaulan päätyvaralle 10 mm ja otelaudan päätyvaralle 16,35 mm, joten aloitusylitys on 6,35 mm. Nämä ovat muokattavia suunnittelun aloitusarvoja. Ne eivät takaa valmistuskelpoisuutta. Käsittely on kokonaan 2D: lähteiden pystymittoja ei tuoda ohjelmaan.

Käyttäjän myöhempi tarkennus edellyttää otelaudan päätyvaran olevan aidosti kaulan päätyvaraa suurempi. Yhtä suuret arvot hylätään; nauhaton ylitys on aina positiivinen. Tämä on GTRfactoryn mallinnusraja, eikä sitä johdeta kaikkien valmistajien rakenteista. Vanhojen projektien yhteensopivuus vapautettiin kehitysvaiheessa: toteutus lukee vain v6-tiedostoja ilman migraatiota.

Toteutuksen ratkaisut ja varmennusnäyttö on kirjattu FEATURE_BRIEF.md-tiedoston erillisten päätyjen osioon.

