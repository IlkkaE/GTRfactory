# 3+3-lapojen lähdeanalyysi — 10.9.2026

Käyttäjän lapa2temp.svg ja lap3temp.svg ovat kuusikielisten 3+3-lapojen viitteet. Molemmissa viewBox vastaa millimetrejä (297 × 210 mm). Jälkimmäisen reikien ryhmämuunnokset on purettu ennen mittausta. Alkuperäiset kopiot ovat CDR/headstock-research-kansiossa, ja koordinaatit sekä SHA256-hashit ovat headstock-variants-sources.json-tiedostossa. Molemmat piirrokset renderöitiin ja katsottiin.

Kummassakin on kahdeksan kuutiokäyräsegmenttiä ja yhdeksän reunapistettä. Polku on järjestetty satulan yläreunasta kärjen kautta alareunaan. Kaulaliitoksen leveydet ovat 42,795784 mm ja 42,841504 mm. Pisteiden 2 ja 6 väli muodostaa muokattavan päädyn; sen sisäpisteet ovat 3, 4 ja 5. Liitos, sivut ja muokattavan alueen rajapisteet pysyvät suojattuina.

Reikäkeskipisteet on johdettu SVG:n ellipseistä, joiden akselihalkaisijat ovat noin 9,9554 / 10,1388 mm. Sovellus käyttää näitä keskuksia ja valitun M6 Mini -profiilin nimellistä Ø10 mm:n porausta. Siluettia tai reikäkeskuksia ei skaalata satulaleveyden mukana; liittymän päätepisteet ja tangentit sovitetaan todelliseen satulaan.

M6:n paikallinen suunta on lähimmän suojatun sivukäyrän tangentti satulasta lavan kärkeen päin. Sisäänpäin osoittava normaali määrittää koneiston peilauksen toiselle sivulle. Yläpuolen tangenttihaara on +1 ja alapuolen −1; kielten indeksit kulkevat yläpuolen läheltä kauas ja alapuolen kaukaa lähelle. Tämä on versionoitava mallipolitiikka, ei globaali optimointi.

Oletuskaulalla tehty erillinen prototyyppitarkistus (tmp/headstock-variants-probe.mjs):

| Mitta | Lapa 2 | Lapa 3 |
| --- | ---: | ---: |
| Suurin satulakulma | 5,228918° | 6,945417° |
| Koneistojen keskinäinen vähimmäisväli | 5,037857 mm | 13,849020 mm |
| Kielen etäisyys toiseen pylvääseen, pylvään säde vähennetty | 6,188595 mm | 2,551410 mm |
| Nupin pyörimisalueen vähimmäisväli puuhun | 0,439770 mm | 1,912410 mm |
| Kielet risteävät / siluetti leikkaa itseään | Ei / ei | Ei / ei |

Näyttö koskee vasta erillistä lähde- ja sovitusprototyyppiä. Sovelluksen integraatio, transaktiot, tallennus ja selainpolut varmennetaan erikseen FEATURE_BRIEFin ledgerissä. Tulokset eivät ole fyysisen valmistuksen todisteita eikä 3+3-muodoille luvata nollakulmaa.
