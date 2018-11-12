const Image = require('../Image');

/**
 * Takes an image with RGB values, and inverts the value of each pixel, i.e 255 - pixel value.
 *
 * @param image {Image}
 * @returns {Image}
 */
function invert(image) {
    const newImage = Image.empty(image.width, image.height);

    // Invert the value of each pixel

    return newImage;
}

module.exports = invert;
