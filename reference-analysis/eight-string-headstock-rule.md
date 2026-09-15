# Tasavälisen kahdeksankielisen lavan muodostussääntö

9.9.2026. Käyttäjä piti seitsemänkielisen tasavälistä vertailua toimivan näköisenä ja kysyi, voidaanko siitä johtaa kahdeksankielinen lapa. Tämä on laskettu suunnitteluehdotus; sovellus ei muuttunut eikä uusi kulmatoleranssi tullut tuotteen vaatimukseksi.

## Sääntö samalla viereisellä kielijaolla

Lähtökohtana [seitsemänkielisen sovituksen](seven-string-headstock-fit.md) tasavälinen, suoran reunan suuntainen viritinrivi. Säilytetään seuraavat fyysiset mitat:

- viereisten viritinpylväiden jako `p = 23,659459422 mm`;
- pylväskeskusten kohtisuora reunaetäisyys `h = 12,999420166 mm`;
- ensimmäisen pylvään keskuksen päätyvara `m0 = 15,356555724 mm`;
- viimeisen pylvään keskuksen päätyvara `m1 = 17,661135847 mm`;
- kohdistetun suoran reunan kulma `α = 17,493859240°`.

Reunan pituus muodostetaan virittimien määrästä:

`L_N = m0 + (N−1) × p + m1`.

Näin `L7 = 174,974448 mm`, `L8 = 198,633908 mm`: uusi kieli kasvattaa suoraa reunaa **yhden 23,659459 mm:n reikävälin**, ei mielivaltaista prosenttia.

Lavan vapaa ääriviiva kasvaa kokonaisuutena kertoimella `k = L8/L7 = 1,135216654`, noin **13,52 %**. Viritinreiät, pylväät, aluslevyt, p, h ja päätyvarat säilyvät millimetrimitoissaan. Reiät rakennetaan uudelleen, niitä ei suurenneta kuvan mukana.

## Sijoitus ja kaulaliittymä

Pelkkä suurennus kaulan keskipisteestä siirtää ensimmäisen pylvään väärään suhteeseen satulaan. Säilytetään sen sijaan ensimmäisen, **bassopuolen**, pylvään paikka suhteessa saman puolen uloimpaan satulakontaktiin:

`C0_8 = S0_8 + (C0_7 − S0_7)`.

Muut keskukset seuraavat tasajaolla: `Ci_8 = C0_8 + i × p × e`, missä `e` on reunan yksikkösuunta ja `i = 0…7`. Reunan alku johdetaan keskuksista: `A8 = C0_8 − m0 × e − h × n`, missä `n` on sisäänpäin osoittava yksikkönormaali. Tämä säilyttää reunaetäisyyden täsmälleen.

Vapaa muoto voidaan muodostaa yhtenäisesti: `q8 = A8 + k × (q7 − A7)`. Sen jälkeen kaulaliittymän kaksi päätä asetetaan kaulalaskennan todellisiin lautareunoihin satulalla ja niiden viereiset Bézier-kahvat kohdistetaan kaulan sivujen jatkosuuntiin. Muut vapaat pisteet säilyvät saman skaalausmuunnoksen alla. Liitospisteiden korjausta ei tehdä muuttamalla kaulan satula- tai tallakontakteja.

Kaulaliittymän leveys on `W_N = (N−1) × s + 2 × a`, missä `s` on viereinen kielijako satulalla ja `a` on kielen keskeltä laudan reunaan jäävä vara kummallakin sivulla. Kun `s = 7 mm` ja `a = 3,048 mm`, saadaan `W7 = 48,096 mm` ja `W8 = 55,096 mm`. Pelkkä lavan k-skaalaus antaisi 54,599380 mm, noin 0,497 mm liian vähän. Siksi liittymä johdetaan kaulasta erikseen.

## Reunan kulma

Kun viereinen satulajako ja viritinväli säilyvät, kielimäärän kasvu **ei itsessään vaadi pienempää reunakulmaa**. Riviin lisätään yksi väli ja lapa kasvaa. Rinnakkaiskielten alustuksessa `p × sin(α) ≈ s`, mutta todelliset kielet viuhkautuvat tallalta satulalle. Tässä säilytetään käyttäjän arvioiman seitsenkielisen muodon kalibroitu kulma ja mitataan tulos aidoista B/S-kontakteista.

Sääntö on perusteltu alustus **7→8 samalla viereisellä kielijaolla**. Jos kielijakoa, mensuuria tai tallajakoa muutetaan, kulmat tarkistetaan uudestaan. Tämä tutkimus ei optimoi kulmaa jokaiselle kaulalle eikä takaa 0° sivuttaiskulmaa.

## Laskettu vertailu

Kaulojen mensuuri 647,7 mm, satulajako 7 mm, tallajako 10,5 mm, valittu yhteinen tangenttihaara `branch=+1` eli aikaisemman kuvan puoli A.

| Vaihtoehto | Suurin sivuttaiskulma satulalla |
| --- | --- |
| 7-kielinen tasavälinen vertailu | 1,335314° |
| 8-kielinen pelkkä suurennus ja liittymäkorjaus | 3,133649° |
| 8-kielinen bassopuolen pylvääseen ankkuroitu sääntö | 1,475915° |

Ankkuroitu vaihtoehto säilyttää siis lähes alkuperäisen vertailun kulmat. Nämä ovat laskettuja lukuja, eivät valittu hyväksyntäraja tai väite vaikutuksesta viritysvakauteen.

Taustalla tarkistettiin myös satulajaot 6,5 / 7 / 7,5 mm ja tallajaot 10 / 10,5 / 11 mm kummallakin yhteisellä tangenttihaaralla ja kummallakin muodon sijoitustavalla: **36/36 läpäisi nykyiset reikä-, aluslevy-, pylväs-, kieli- ja järjestystarkistukset**. Ankkuroitu sääntö puolella A antaa tällä kiinteällä reunakulmalla suurimmiksi kulmiksi 0,4935–2,8175° eri tapauksissa. Tämä osoittaa myös, ettei yhden kielijaon hyvä tulos sellaisenaan ole kaikkien jakojen kulmaraja.

Täydellistä Schaller M6 Mini -koneiston runkojen, ruuvien, nuppien, käyttötilan ja puuvaran sopivuutta ei ole todistettu. Tutkimus käyttää aiempaa Ø6-pylväs-, Ø10-reikä- ja Ø14,5-aluslevymallia.

## Varmennus

- Menetelmän suunnittelun tarkisti sama feature_architect; pääagentti laski kaksi vaihtoehtoa erillisellä skriptillä. Arkkitehdin riippumaton B/S/T-pisteiden kulmalasku vahvisti oletustapauksen 1,475914638° ja 3,133649359° sekä ankkuroinnin, reunan pituuden, skaalauskertoimen ja liitosleveyden. Tämä oli rajattu matematiikka-auditointi, ei valmistushyväksyntä.
- `node scripts/headstock-reference/eight-string-rule.mjs`: PASS, 9 kaulaa × 2 sijoitussääntöä × 2 yhteistä haaraa = 36 sijoittelua.
- Skriptin invarianttitarkistukset: kahdeksan kontaktia, vakio reikäjako ja reunaetäisyys, päätyvara, molemmat liittymäpisteet, muuttumattomat B/S-kontaktit ja 56 sovellustiedoston hashit PASS.
- Erillistä sovellus- tai selainmuutosta ei tehty; uutta selain- tai valmistuskoetta ei väitetä.

Raakadata: [eight-string-headstock-rule.json](eight-string-headstock-rule.json). Toistaminen: `node scripts/headstock-reference/eight-string-rule.mjs` projektin juuressa. Tämä raportti ei ole valmistuspiirustus.
