const Image = require('../Image');

/**
 * @param image {Image}
 * @param radius Number
 * @returns {Image}
 */
function medianfilter(image, radius) {
    radius = Number(radius);
    const newImage = Image.empty(image.width, image.height);

    for (let x = radius; x < image.width-radius; x++) {
        for (let y = radius; y < image.height-radius; y++) {

            // Create a localized spatial filter, choosing the median value for each pixel

        }
    }
    return newImage;
}

module.exports = medianfilter;
