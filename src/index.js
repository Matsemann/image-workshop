const Editor = require('./Editor');
const greyscale = require('./effects/greyscale');
const colorfilter = require('./effects/colorfilter');
const threshold = require('./effects/threshold');
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
document.querySelector("#runSeamcarver").addEventListener('click', () => {
    editor.applyEffect((image) => {
        const energy = seam.imageEnergy(image);
        const seams = seam.calculateSeams(energy);
        const minSeam = seam.findMinSeam(seams);
        const newImage = seam.removeSeam(image, minSeam);
        // const showSeam = seam.showSeam(image, minSeam);
        return newImage;
    });
});

