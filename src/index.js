const Editor = require('./Editor');
const greyscale = require('./effects/greyscale');
const colorfilter = require('./effects/colorfilter');
const threshold = require('./effects/threshold');


const editor = new Editor();
editor.loadImage('tower.jpg');

document.querySelector("#load").addEventListener('click', () => {
    const selectedImage = document.querySelector("#images").value;
    editor.loadImage(selectedImage);
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

