const Image = require('../Image');

/**
 * Adds some more red and removes some blue from the image's pixels
 * @param image {Image}
 * @returns {Image}
 */
function warmfilter(image) {
    const newImage = Image.empty(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = image.getR(x, y);
            const g = image.getG(x, y);
            const b = image.getB(x, y);

            newImage.setR(x, y, r + 25);
            newImage.setG(x, y, g);
            newImage.setB(x, y, b - 25);
        }
    }
    return newImage;
}

module.exports = warmfilter;
