# Image workshop

Velkommen til AlgPip's konkurrent til Photoshop!

I denne workshopen skal vi implementere forskjellige bildebehandlingsalgoritmer.


# Oppsett

```
npm install
npm run dev
```

Åpne http://localhost:9966/ i nettleseren. Når du gjør endringer i koden vil browseren
refreshe.

## Koden

I `src/effects/`-mappa ligger filene til de forskjellige effektene. En effekt får typisk inn bildet det skal jobbes på, og eventuelt noen parametre.
Så itererer man over pikslene i bildet og lager et nytt bilde som man returnerer.

APIet er ikke så stort, det består bare av funksjoner for å lese eller skrive verdier til et bilde.

```javascript
// Lage et nytt bilde:
var newImage = Image.empty(width, height); // Lager et blankt bilde med en viss størrelse
var newImage2 = Image.clone(image); // Kopi av et annet bilde

// Lese ut størrelser
var width = image.width;
var height = image.height;

// Lese ut verdier
// venstre topp er (0, 0). y=0 er altså øverste rad, y=1 neste rad osv.
var red = image.getR(x, y); // Få rødkomponenten av fargen på piksel x,y
var green = image.getG(x, y);
var blue = image.getB(x, y);

// Setter verdier/farger tilsvarende
// Fra og med 0 til og med 255
newImage.setR(x, y, 255);
newImage.setG(x, y, 0);
newImage.setB(x, y, 128);

// Kan evt sette alle i ett
newImage.setRGB(x, y, [255, 0, 128]);
```

En typisk effekt ser ut som noe ala det her:

```javascript
function effect(image) {
    // Lag et nytt bilde av samme størrelse
    const newImage = Image.empty(image.width, image.height);

    // Iterer over hver pixel, rad for rad (merk vi itererer over y ytterst)
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {

            // Les ut aktuelle verdier fra originalbildet
            var r = image.getR(x, y);
            // ...
            
            // Regn ut nye verdier
            var nyR = r + 25;
            // ...

            // Sett verdi i det nye bildet
            newImage.setR(x, y, [nyR, nyG, nyB]);
        }
    }
    return newImage;
}


```

# Oppgaver

Anbefaler at man starter med Greyscale for å få en følelse av hvordan ting fungerer,
deretter er det bare å plukke det man synes virker mest spennende! Merk at vanskelighetsgraden
varierer mellom de forskjellige.

Kan se fasit (/få hjelp) ved å sjekke ut branchen `solution`, evt klikke [her](https://github.com/Matsemann/image-workshop/tree/solution/src/effects)

[Greyscale](#Greyscale) (enkel)  
[Threshold](#Threshold) (enkel)  
[Seam carving](#Seam-carving) (avansert)


## Greyscale

![threshold](docs/examples/greyscale.png)

Ofte kalt svart/hvitt, men vi har jo mange "shades of grey". For hver piksel, regner man ut "intensiteten"
den har, basert på R,G,B verdiene. Det letteste er bare å ta snittet av RGB-verdiene på en piksel i originalbildet og sette
pikselen i det nye bildet til den verdien. Men for å et greyscale som bedre tilsvarer det et menneskeøye opplever intensiteten er,
kan man heller bruke formelen `intensity = 0.34 * r + 0.5 * g + 0.16 * b`.

Endre på fila `src/effects/greyscale.js`. Gjør tilsvarende som i eksempelet over:
Iterer over alle pikslene i bildet. Les ut verdiene fra originalbildet og beregn intensitetsverdien/gråverdien
pikselen skal ha og sett den i det nye bildet. For å sette verdien som grå, setter man RGB til samme verdi. F. eks. om man
regnet ut at intensiteten skal være 203, setter man både R, G og B til 203.


## Threshold

![threshold](docs/examples/threshold.png)

Den egentlige "svart/hvitt". Ligner veldig på greyscale, men i stedet for å sette RGB til intensiteten,
setter man enten fargen til svart (0,0,0) eller hvitt (255,255,255) basert på om intensiteten er over en viss grense/threshold.

Endre på fila `src/effects/threshold.js`. I tillegg til bildet effekten skal legges på, får du inn grenseverdien for om hver piksel skal bli hvit eller svart.

## Invert

![threshold](docs/examples/invert.png)

Rett og slett invertering av fargene, 255 - c, der c er intensiteten per pixel per farge. Brukes hyppig i flashes i skrekkfilmer.

Endre på fila `src/effects/invert.js`.


## Boxblur

![threshold](docs/examples/boxblur.png)

Rett og slett invertering av fargene, 255 - c, der c er intensiteten per pixel per farge. Brukes hyppig i flashes i skrekkfilmer.

Endre på fila `src/effects/invert.js`.

## Seam carving

![threshold](docs/examples/seamcarving.png)

Når man skalerer bilder ned i én akse, får man et problem med at ting blir skvist/strukket ut av sine egentlige proposjoner.
Seam carving løser dette ved at i stedet for å skalere ned hele bildet jevnt, finner man heller de 
uviktige delene av bildet og forkaster dette.

Algoritmen består av 3 deler:
1. Finn energien til hver piksel, altså hvor viktig den er i bildet
2. Beregn forskjellige stier fra topp til bunn og regn ut deres totale energi
3. Fjern pikslene i den stien som var minst viktig (hadde lavest energi)

Dette gjøres om og om igjen til bildet har den bredden man ønsker.

I `src/effects/seamcarving.js` skal du implementere del 1 og 2. Del 3 er ikke så spennende og mest knot, så det får du av oss.

**imageEnergy(..)**  
Bildet vi skal returnere skal ikke ha RGB, men bare én verdi per piksel, så i stedet for å lage et nytt bilde kan vi heller lage et
energyimage i riktig størrelse, ala `var energyImage = Image.createEnergyImage(image.width, image.height);`.
Et energyimage er det samme som et vanlig image, men kan bare ha én verdi per piksel. Den kan vi sette ved å gjøre `energyImage.setValue(x, y, 1000);`.

Vi må beregne energinivået til hver piksel. For å beregne det for en piksel, ser vi på pikslene rundt.
For piksel `(x, y)`, er det pikselen over `(x, y-1)`, under `(x, y+1)`, venstre `(x-1, y)` og til høyre `(x+1, y)` vi må se på.
Vi regner ut differansen i rød, grønn og blå mellom pikselen til høyre og den til venstre, aka 
```
diffRx = (rHøyre - rVenstre)^2
diffGx = (gHøyre - gVenstre)^2
diffBx = (bHøyre - bVenstre)^2
```
I kode ville det tilsvart `diffRx = Math.pow(image.getR(x+1, y) - image.getR(x-1, y), 2)`. Deretter gjør man det samme, men for pikselen under minus den over.
Når man har gjort det summerer man sammen alle 6 verdiene og tar roten av dem, ala `Math.sqrt(diffRx + diffGx + diffBx + diffRy + diffGy + diffBy)`.

**Eksempel**  
Om det var litt forvirrende, har vi heldigvis et eksempel her. Vi skal beregne energien til pikselen i midten.

| | | |
|---|---|---|
|(0,0,0)|(180,190,50)|(0,0,0)|
|(100,101,75)|(55,55,55)|(255,125,50)|
|(0,0,0)|(199,200,10)|(0,0,0)|

```
diffRx = (255 - 100)^2 = 24025
diffGx = (125 - 101)^2 = 576
diffBx = (50 - 75)^2 = 625
diffRy = (199 - 180)^2 = 361
diffGy = (200 - 190)^2 = 100
diffBy = (10 - 50)^2 = 1600
energi = sqrt(24025 + 576 + 625 + 361 + 100 + 1600) = 165.18
```

Piksler som ligger på kanten vil ikke dette fungere på, så du kan bruke `isBorderPixel(..)` funksjonen for å sjekke dette, og da heller sette
energien for den pikselen til en fast verdi. `300` f. eks.

**calculateSeams(..)**

Her bruker vi dynamisk programmering for å finne den veien fra topp til bunn av bildet som har minst energi.
Vi får inn energibildet vi akkurat regnet ut, og skal nå summere verdiene nedover for å beregne totalenergien for de forskjellige veiene man kan velge.

En path/vei er sammenhengende, og kan enten komme fra pikselen rett over, den skrått oppover til venstre, eller den skrått oppover til høyre.

**Eksempel**:  
![bilde fra wikipedia](https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/DynamicProgrammingLeastEnergyPathA.svg/399px-DynamicProgrammingLeastEnergyPathA.svg.png)

De røde verdiene er energiverdiene vi allerede har beregnet, mens vi skal fylle ut nye verdier.
Første rad er grei, de får bare samme verdi som energibildet hadde. For rad to, starter vi helt til venstre og finner billigste path ned til pikselen så langt, og legger til energien til den pikselen. 
Siden første er på kanten har den to muligheter. Enten komme fra rett over (1), eller den til høyre for det (4). 1 < 4, så vi velger 1, og legger til energien den pikselen hadde fra
energibildet (3). Altså får den verdien 4. For neste piksel, kan den velge mellom (1), (4) og (3). Vi velger 1, plusser på verdien 2, og får 3. Slik fortsetter vi.
For første piksel på rad 3, kan man velge mellom (4) og (3). Vi velger 3 og plusser på 5 og får da 8.

Algoritmen er litt forenklet (man må ta hensyn til om man er på kanten)
```javascript
seamValue = Math.min(
    energyImage.getValue(x-1, y-1),
    energyImage.getValue(x, y-1),
    energyImage.getValue(x+1, y-1)
)
seamImage.setValue(x, y, seamValue);
```


