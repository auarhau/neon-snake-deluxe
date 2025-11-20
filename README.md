# Neon Snake Deluxe

Et moderne Snake-spill med neon-grafikk, partikkel-effekter og strategisk mat-system.

## Funksjoner

- 🎮 Klassisk Snake-gameplay med moderne twist
- ✨ Neon-grafikk med glød-effekter
- 🎯 Flere mat-typer med ulike verdier
- ⏱️ Mat med begrenset tid - ta raske valg!
- 🏆 Topp 10 highscore-liste med navn
- 💥 Partikkel-effekter når mat spises
- 🎨 Gradient bakgrunn og smooth animasjoner

## Spillinstruksjoner

- **Piltaster**: Styr slangen
- **C**: Spill igjen etter game over
- **Q**: Avslutt spillet

## Mat-typer

- 🔴 **Normal** (Rød): 10 poeng
- 🟡 **Gull**: 50 poeng
- 🔵 **Speed** (Cyan): 20 poeng, øker hastighet
- 🟣 **Slow** (Lilla): 10 poeng, reduserer hastighet

Hver mat har en timer - spis den før den forsvinner!

## Publisering på nett

Dette spillet kan publiseres på nett med pygbag. For å publisere:

### Automatisk bygging:
```bash
python build_web.py
```

### Manuell bygging:
```bash
pip install pygbag
python -m pygbag main.py
```

### Publiseringsalternativer:

1. **GitHub Pages** (gratis):
   - Bygg spillet med `build_web.py`
   - Last opp `build/web/` innholdet til en `docs/` mappe i repoet
   - Aktiver GitHub Pages i repo-innstillingene

2. **Netlify** (gratis):
   - Dra og slipp `build/web/` mappen på netlify.com
   - Eller koble til GitHub repo for automatisk deploy

3. **Vercel** (gratis):
   - Last opp `build/web/` mappen
   - Eller koble til GitHub repo

4. **Egen web-server**:
   - Last opp hele `build/web/` mappen til din server

## Utvikling

For å kjøre lokalt:
```bash
pip install -r requirements.txt
python main.py
```

