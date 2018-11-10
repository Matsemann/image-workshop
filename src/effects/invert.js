const Image = require('../Image');

/**
 * Takes an image with RGB values, and turns all pixels either white (255,255,255) or black (0,0,0)
 * depending on if the intensity is above the threshold
 *
 * @param image {Image}
 * @returns {Image}
 */
function invert(image) {
    const newImage = Image.empty(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = 255 - image.getR(x, y);
            const g = 255 - image.getG(x, y);
            const b = 255 - image.getB(x, y);

            newImage.setRGB(x, y, [r, g, b]);
        }
    }
    return newImage;
}

module.exports = invert;
