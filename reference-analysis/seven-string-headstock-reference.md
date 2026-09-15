# Käyttäjän seitsemänkielinen lapamalli

Analyysi 9.9.2026. Lähde: hyväksytty seitsemänkielinen lapa-SVG. Alkuperäistä tiedostoa ja sovellusta ei muutettu.

SVG:n sivu on 304 × 122 mm ja viewBox 0 0 304 122: yksi koordinaattiyksikkö on yksi millimetri. Tiedostossa on yksi avoin ulkoreunapolku ja seitsemän suljettua, ellipsikaarista muodostuvaa reikää. Mittaus käyttää polkujen keskilinjoja, ei viivan paksuutta. Reikien keskukset ratkaistiin SVG-kaarista; kummankin kaaren keskukset täsmäsivät alle 3e-14 mm:n laskentapoikkeamalla. Piirustus renderöitiin ja tarkastettiin Edgessä.

| Suure | Mitta |
| --- | --- |
| Avoimen kaulaliitoksen päätepisteiden etäisyys | 47,903 mm |
| Virittimien puoleinen suora reuna | 174,272 mm |
| Reunan kulma SVG:n vaaka-akseliin | 17,554° |
| Ensimmäisen ja viimeisen reiän keskusten etäisyys | 141,499 mm |
| Peräkkäiset keskipistevälit kaulasta kärkeen | 23,577; 23,596; 23,329; 23,648; 23,596; 23,755 mm |
| Keskipisteiden kohtisuora etäisyys suorasta reunasta | 12,678–13,182 mm |
| Reikäriviin sovitetun suoran suurin sivupoikkeama | 0,0975 mm |
| Ellipsien pääakselien halkaisijat | 9,955 × 10,139 mm |

Aiemman `lapamalli.svg`-referenssin tallennetut vastaavat luvut ovat: liittymä 42,680 mm, suora reuna 154,286 mm, kulma 17,569°. Uusi malli on siten leveämpi ja sen suora reuna pidempi, mutta reunan kulma on käytännössä sama. Tämä vertailu kuvaa annettuja piirustuksia, ei johda yleistä 6/7/8-kielisten skaalaussääntöä.

## Käyttöarvo ja rajat

Malli antaa konkreettisen seitsemänkielisen muodon, kaulaliittymän leveyden sekä reikärivin paikan ja mittasuhteet. Reikien tasajako ja vakioetäisyys reunaan eivät toteudu täsmällisesti tässä SVG:ssä. Poikkeamien alkuperää ei voi päätellä tiedostosta; ne voivat kuulua piirustukseen tai syntyä muunnoksessa. Reikien lievä elliptisyys on huomioitava ennen porausgeometriaksi käyttämistä.

Tiedosto ei sisällä satulan kielikontakteja, tallan kontakteja tai kielilinjoja. Sillä ei yksin voi todistaa nollakulmaa satulalla. Tätä varten lapa kohdistetaan kaulan todelliseen satulalinjaan, jatketaan jokaisen kielen omaa tallalta satulalle kulkevaa suoraa ja tarkistetaan sen tangentti viritinpylvääseen. Porausreikä ei ole kielipylvään ulkopinta. Tässä tarkastelussa ei laskettu oletettua kielijakoa puuttuvien kontaktien tilalle.

Tämä on referenssin mittaus, ei uusi valmistusmalli, toteutusvaltuutuksen laajennus tai muutos aiemman tiukan geometriakokeen tuloksiin. Ei sovellustestejä: sovellus ei muuttunut.

Mittaus- ja renderöintiapu: `tmp/inspect-seven-headstock.mjs`; raakamittaukset: `tmp/seven-headstock-measurements.json`; tarkastettu kuva: `tmp/seven-headstock-reference.png`. Väliaikaiset tiedostot eivät ole sovellusriippuvuuksia.
