const Image = require('../Image');

/**
 * Takes an image with RGB values, and inverts the value of each pixel, i.e 255 - pixel value.
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
