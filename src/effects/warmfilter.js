const Image = require('../Image');

/**
 * Adds some more red and removes some blue from the image's pixels
 * @param image {Image}
 * @returns {Image}
 */
function warmfilter(image) {
    const newImage = Image.empty(image.width, image.height);

    // Iterate over all pixels and tweak the color values

    return newImage;
}

module.exports = warmfilter;
