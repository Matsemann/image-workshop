const Editor = require('./Editor');
const greyscale = require('./effects/greyscale');
const colorfilter = require('./effects/colorfilter');
const threshold = require('./effects/threshold');
const boxblur = require('./effects/boxblur');
const invert = require('./effects/invert');
const histogramequalization = require('./effects/histogramequalization');
const medianfilter = require('./effects/medianfilter');
const seam = require('./effects/seamcarving');


const editor = new Editor();
editor.loadImage('tower.jpg');

document.querySelector("#load").addEventListener('click', () => {
    const selectedImage = document.querySelector("#images").value;
    editor.loadImage(selectedImage);
});

document.querySelector("#undo").addEventListener('click', () => {
    editor.undoEffect();
});

document.querySelector("#threshold").addEventListener('click', () => {
    editor.applyEffect(threshold, document.querySelector("#thresholdvalue").value);
});

document.querySelector("#greyscale").addEventListener('click', () => {
    editor.applyEffect(greyscale);
});

document.querySelector("#colorfilter").addEventListener('click', () => {
    editor.applyEffect(colorfilter);
});

document.querySelector("#boxblur").addEventListener('click', () => {
    editor.applyEffect(boxblur, document.querySelector("#blurradius").value);
});

document.querySelector("#medianfilter").addEventListener('click', () => {
    editor.applyEffect(medianfilter, document.querySelector("#radius").value);
});

document.querySelector("#invert").addEventListener('click', () => {
    editor.applyEffect(invert);
});

document.querySelector("#histogramequalization").addEventListener('click', () => {
    editor.applyEffect(histogramequalization);
});

document.querySelector("#energy").addEventListener('click', () => {
    editor.applyEffect((image) => {
        return seam.energyImageToGreyscale(seam.imageEnergy(image));
    });
});
document.querySelector("#findSeam").addEventListener('click', () => {
    editor.applyEffect((image) => {
        const energy = seam.imageEnergy(image);
        const seams = seam.calculateSeams(energy);
        const minSeam = seam.findMinSeam(seams);
        const showSeam = seam.showSeam(image, minSeam);
        return showSeam;
    });
});


let isRunning = false;
document.querySelector("#runSeamcarver").addEventListener('click', () => {
    isRunning = true;
    document.querySelector("#runSeamcarver").disabled = true;
    document.querySelector("#stopSeamcarver").disabled = false;

    let image = editor.current;

    function seamCarve() {

        const energy = seam.imageEnergy(image);
        const seams = seam.calculateSeams(energy);
        const minSeam = seam.findMinSeam(seams);
        const showSeam = seam.showSeam(image, minSeam);

        editor.render(showSeam, "edited");

        image = seam.removeSeam(image, minSeam);

        if (isRunning) {
            setTimeout(seamCarve, 10);
        } else {
            editor.setCurrent(image);
        }
    }

    seamCarve();
});

document.querySelector("#stopSeamcarver").addEventListener('click', () => {
    isRunning = false;
    document.querySelector("#runSeamcarver").disabled = false;
    document.querySelector("#stopSeamcarver").disabled = true;
});


