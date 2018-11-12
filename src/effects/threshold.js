const Image = require('../Image');

/**
 * Takes an image with RGB values, and turns the pixels either white (255,255,255) or black (0,0,0)
 * depending on if the intensity is above or below the threshold
 *
 * @param image {Image}
 * @param threshold Number
 * @returns {Image}
 */
function threshold(image, threshold) {
    const newImage = Image.empty(image.width, image.height);

    // Iterate over all pixels and set the pixel to black or white depending on if the intensity is
    // above or below the threshold

    return newImage;
}

module.exports = threshold;