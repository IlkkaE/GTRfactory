# Lavan kolmen pakollisen ehdon koe

9.9.2026. Käyttäjän pyyntö: testaa 6-, 7- ja 8-kielisillä, löytyykö ratkaisu, kun suora kieliveto, suora yhteisen reunaetäisyyden viritinrivi ja tasaväliset pylväät ovat kaikki pakollisia.

## Tulos

**Yhdessäkään 39 testatusta kaulaskenaariosta ei ole täsmällistä ratkaisua.** Molemmat yhteiset käämintäpuolet tutkittiin: 78/78 tapaukselle saatiin tarkka lineaarisen epäyhteensopivuuden todistus. Tämä on vahvempi tulos kuin rajatun hakualgoritmin epäonnistuminen.

| Kieliä | Kaulaskenaarioita | Käämintäpuolet mukaan lukien | Täsmällisiä ratkaisuja |
| --- | --- | --- | --- |
| 6 | 3 | 6 | 0 |
| 7 | 18 | 36 | 0 |
| 8 | 18 | 36 | 0 |

Kolme erillistä rinnakkaiskielistä positiivista vertailumallia (6/7/8 kieltä) puolestaan läpäisi molemmilla käämintäpuolilla: 6/6 kelvollista osatason ratkaisua. Epätasaisella satulajaolla rakennettu negatiivinen rinnakkaiskielikontrolli hylättiin molemmilla puolilla, 2/2. Kontrollit eivät ole uusia kitarapresettejä.

Sovellusta, FretFactory-vendoria, aiempaa headstock-labia tai projektiformaattia ei muutettu. Koe on erillinen tutkimuslaskenta.

## Testatut lähtötiedot

Kontaktit tuotiin GTRfactoryn nykyisestä `calculateNeck`-adapterista, joka käyttää pinnattua FretFactory-laskentaa. Satularivin ensimmäinen ja viimeinen piste ovat laudan reunoja; vain niiden välissä olevat N kielipistettä otettiin mukaan. Tallan kontaktit kohdistettiin samoihin kieli-indekseihin. Satula tai talla ei liiku lavan ratkaisemisen takia.

- 6-kielinen nykyinen oletus: satulan kokonaisväli 35,814 mm, tallan 49,784 mm, tasamensuuri 647,7 mm.
- 6-kielinen vertailu: viereinen jako satulalla 7 mm ja tallalla 10,5 mm, sekä tasamensuurena että moniskaalana.
- 7- ja 8-kieliset: kaikki yhdeksän yhdistelmää satulajaosta 6,5 / 7 / 7,5 mm ja tallajaosta 10 / 10,5 / 11 mm. Jokainen sekä tasamensuurena että moniskaalana, yhteensä 18 skenaariota kielimäärää kohti.
- Tasamensuuri: 647,7 mm. Moniskaala: diskantti 647,7 mm, basso 673,1 mm, suora nauha 7 ja kaarevuuseksponentti 1,6.
- Pylvään säde 3 mm. Kielen paksuus ja käämintäkerrokset eivät kuulu tähän ideaaliseen 2D-keskilinjakoemalliin.
- Molemmat yhteiset käämintäpuolet `sigma = −1` ja `+1` testattiin erikseen. Käämintäpuolta ei vaihdettu yksittäiselle kielelle.

## Ehdot ja vapaat muuttujat

Kielen satulakontakti on S_i, tallakontakti B_i ja lavalle osoittava suuntavektori D_i = S_i − B_i. Täsmällinen kieliveto sivuaa pylvästä:

`cross(D_i, C_i − S_i) = sigma × r × |D_i|`.

Pylväät ovat suorassa tasavälisessä rivissä täsmälleen silloin, kun `C_i = C0 + i × v`. Neljä tuntematonta ovat C0:n kaksi koordinaattia ja v:n kaksi komponenttia. Ne ovat kaikki vapaita: 25 mm:n jako, vanha rivikulma, 12,7 mm:n reunaetäisyys tai templaten pituus eivät rajoita koetta.

Suoran rivin rinnalle voidaan johtaa suora reuna samalla kohtisuoralla etäisyydellä jokaisesta pylväästä. Siksi tämä yhteisen reunaetäisyyden vaatimus ei itsessään lisää tuntemattomiin kohdistuvaa yhtälöä, kun reuna saa muodostua vapaasti. Puuvaran ja koko koneiston tarkistus voisi rajata kelvollisten ratkaisujen joukkoa edelleen, mutta ei korjata jo mahdotonta kieli-/pylväsgeometriaa.

Kokeen kielten suoruus tarkoittaa jokaisen kielen oman suunnan jatkumista satulan yli. Se ei tarkoita, että tallalta satulalle kapenevan kaulan kaikki kielet olisivat keskenään yhdensuuntaisia.

## Miten mahdottomuus todistettiin

Jokaisesta kielestä muodostettiin yhtälöryhmän A x = b yksi rivi:

`A_i = [−D_iy, D_ix, −i × D_iy, i × D_ix]`

`b_i = cross(D_i, S_i) + sigma × r × sqrt(D_ix² + D_iy²)`.

Tallennetut koordinaatit tulkittiin niiden täsmällisinä IEEE-754 binary64 -arvoina. Pythonin Fraction-laskennalla johdettiin painovektori w, jolle **wᵀA = 0 täsmälleen**. Jos Ax=b olisi mahdollinen, myös wᵀb:n olisi oltava nolla.

Pituuksien neliöjuurille laskettiin kokonaisluvun neliöjuurella rationaaliset ala- ja ylärajat. Välin leveys on enintään 10⁻⁸⁰ mm, ja rajojen neliöt tarkistetaan täsmällisillä murtoluvuilla. Jokaisessa varsinaisessa tapauksessa näistä johdettu **wᵀb:n koko tulosväli jää nollan toiselle puolelle**. Näin mitään C0:n paikkaa tai v:n kulmaa/pituutta ei voi valita siten, että kaikki yhtälöt toteutuisivat.

Todistus ei ole riippuvainen SVD-rankin valinnasta. Sarakeskaalattu NumPy-SVD tallennetaan vain rinnakkaiseksi numeeriseksi diagnostiikaksi. Erityisesti pienintä neliösummaa antavaa yksittäistä ratkaisua ei tulkita koko rank-vajaisen ratkaisuperheen fyysiseksi testiksi.

## Mitä tulos ei tarkoita

Tulos koskee näitä tallennettuja 39 kaulageometriaa ja tarkkoja yhtäsuuruuksia. Se ei ole kaikkien mensuurien, kielijakojen ja moniskaalaparametrien jatkuvan alueen kattava todistus.

Poikkeamien matemaattiset alarajat ovat erittäin pieniä: tässä otoksessa noin 5,2 × 10⁻¹⁰ … 1,93 × 10⁻⁷ mm. Ne todistavat täsmällisen nollan puuttumisen, **eivät merkittävää valmistusvirhettä, näkyvää kulmaa tai soitettavuusongelmaa**. Laskennan tarkkuus ei lisää osien valmistustarkkuutta. Lukuja ei muunneta suoraan käytännölliseksi kulmaminimiksi.

Varsinaisissa kaulaskenaarioissa fyysiseen sovitukseen ei edetty, koska jo välttämätön yhtälöryhmä oli mahdoton. Positiivisissa kontrolleissa tarkistettiin erillinen toimiva ratkaisuperheen jäsen: eteenpäin kulkeva tangenttijänne, tasajako, suora reuna, yhteinen 10 mm:n reunaetäisyys, aluslevyjen erillisyys ja kielen väistö muista pylväistä. Kontrollin 10 mm on todistusesimerkin luku, ei M6-profiilin hyväksytty reunaetäisyys.

Koko M6 Minin koneistoa, nuppien käyttötilaa, kätisyyden vastaavuutta sigma-merkkiin, puun lujuutta tai valmistusta ei varmennettu. Mikään vaatimus ei muuttunut tässä kokeessa. Jos käyttäjä haluaa jatkaa samalla kaulageometrialla, seuraava suunnittelupäätös koskee sallittavaa poikkeamaa tai jonkin geometriaehdon vapauttamista.

## Toistaminen ja aineisto

Projektin juuressa, Node 24.15.0 ja npm 12.0.1; Python 3.12 ja NumPy 2.3.5. Käytä ympäristön `python`-komentoa tai aseta `strictPython` oman Python 3 + NumPy -asennuksesi polkuun:

```powershell
$strictPython='python'
node scripts/headstock-strict/export-inputs.mjs
& $strictPython -B scripts/headstock-strict/analyze.py
& $strictPython -B scripts/headstock-strict/test_strict.py
```

- [Syötteet ja kaulalähteiden SHA256-tunnisteet](headstock-strict-inputs.json)
- [Tulokset, jokaisen tapauksen todistus ja numeerinen diagnostiikka](headstock-strict-results.json)
- Laskenta: `scripts/headstock-strict/`.
- Lopullinen varmennusloki: `tmp/headstock-strict-tests-final.txt`. Sovellusbaseline on mukana tiedostossa `headstock-strict-app-baseline.json`; toisto ei tarvitse vanhan labin tmp-baselinea.

Ensimmäinen varsinainen testikokonaisuus: 7/7 PASS (0,250 s). Mukana 80 mahdottomuustodistuksen tarkistus, kuusi positiivista osatason ratkaisua, tarkat neliöjuurirajat, 90 asteen kierron luokittelu, uusi deterministinen koko laskenta sekä 56 sovellus-/konfiguraatiotiedoston muuttumattomuus. Ennen testiajoa generoinnissa korjattiin NumPy-diagnostiikan kokonaislukutaulukon jakamisen tyyppivirhe; se ei ollut geometriatuloksen hylkäys.



Riippumaton arkkitehdin matematiikka-auditointi: PASS. Kaikki 80 todistajaa ja kuusi positiivista kontrollia tarkistettiin erillisellä 180 numeron Decimal-laskennalla ja rationaalisella matriisilla. Lisäksi S=(0,7i), B=(−650,10.5i) -ideaaliviuhkat tuottivat hylkäystodistuksen 6/7/8 kielellä molemmilla käämintäpuolilla; pisteet ovat tarkkoja kokonais- tai puolimillimetrejä. Tämä tukee sitä, ettei ilmiö synny vain vendorin liukulukupyöristyksistä. Nämä kuusi lisäkontrollia eivät sisälly 39 kaulaskenaarion määrään. Kyseessä ei ollut erillinen qa_verifier-roolin ajo.

Riippumattoman testiajokerran tulos oli 7/7 PASS (0,243 s). Varmennustestin baseline-tiedosto siirrettiin tämän jälkeen pysyvään analyysiaineistoon; viimeinen testi läpäisi 7/7 (0,252 s). Varsinainen analyysi, kaulasyötteet ja tulos-JSON eivät muuttuneet auditoinnin jälkeen.
