const Image = require('../Image');

/**
 * Takes an image with RGB values, and converts it to greyscale
 * by calculating intensity at each pixel
 *
 * @param image {Image}
 * @returns {Image}
 */
function greyscale(image) {
    const newImage = Image.empty(image.width, image.height);

    // Iterate over all pixels and calculate the intensity

    return newImage;
}

module.exports = greyscale;