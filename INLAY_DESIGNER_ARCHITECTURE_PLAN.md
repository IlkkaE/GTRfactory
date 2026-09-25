* N\u00e4pp\u00e4inkuuntelijan suojaportti `if (state.workspace !== 'guitar') return`.
* Ty\u00f6kalupalkin suojaus.
* Paikallinen luonnostila solmumuokkaukselle (`localShape`, 60–120 fps sulava raahaus, 1 transaktio / Undo-askel per ele).
* SVG pointer-capture `setPointerCapture` juuri-SVG-elementill\u00e4.
* Reilut n\u00e4kym\u00e4tt\u00f6m\u00e4t osuma-alueet (`r={14}` ja `r={12}`) solmuille ja tangenttikahvoille.
* N\u00e4pp\u00e4imist\u00f6tuki (Delete/Backspace poistaa solmun, nuolin\u00e4pp\u00e4imet hienos\u00e4\u00e4t\u00e4v\u00e4t valittua solmua, Escape poistaa valinnan).
* Presetit: ympyr\u00e4, timantti, block, t\u00e4hti, puolisuunnikas. Solmujen lis\u00e4ys (+ Add point) ja poisto (Delete point).

### Vaihe 6: SVG-tuonti (My\u00f6hempi laajennus)
* Rajauksen p\u00e4ivitys `FEATURE_BRIEF.md`:hen ja sen ledgeriin.
* Turvallinen SVG-parseri (DOMParser-suojaus, transform-attribuuttien litistys, 0...1 -normalisointi).

---

## 9. Yhteenveto

N\u00e4m\u00e4 kriittiset korjaukset takaavat:
1. **Nauham\u00e4\u00e4r\u00e4n dynaaminen muuttaminen ei koskaan kaada sovellusta.**
2. **Kitaran runko-, mikrofoni- ja kaulatoiminnot ovat 100 % suojattuja Inlay Designerissa.**
3. **Kaulaluonnos ja otelautamerkit eiv\u00e4t sotkeudu toisiinsa.**
4. **Kaikki nykyiset viennit s\u00e4ilyv\u00e4t t\u00e4ysin identtisin\u00e4 tavutasolle asti.**
5. **Vektorinodet ja tangenttikahvat liikkuvat viiveett\u00f6m\u00e4sti ja luotettavasti ilman virheit\u00e4.**

### Vaihe 8: Inlay Designer -tilan ja luonnostilan korjaus (Presetit ja solmujen raahauksen pysyvyys)
- **Syy**: Inlay Designer luki suoraan s.document, vaikka kaulan luonnostila (s.neckDraft) oli aktiivinen. Koska s.document.fretboardInlays oli vielä ull, jokainen renderöinti loi uuden ympyräobjektin, mikä nollasi localShape-tilan heti hiiren vapautuksessa tai presetin klikkauksessa takaisin ympyrään.
- **Korjaus**: doc = s.neckDraft?.document ?? s.preview ?? s.document, referenssistabiili oletusdokumentti komponentin ulkopuolella, synkronoitu localShapeRef osoitin-eleille ja paikallinen Undo/Redo -historia Inlay Designerissa.
