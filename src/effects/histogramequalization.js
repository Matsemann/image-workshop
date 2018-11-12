const Image = require('../Image');

/**
 * @param image {Image}
 * @returns {Image}
 */
function histogramequalization(image) {
    const newImage = Image.empty(image.width, image.height);

    // Step 1. Count the number of pixels with intensity from 0 to 255 per color.

    // Step 2. Calculate the new intensity for all the pixels with intensity equal to k.

    // Step 3. Tranform all pixels and their RGB-values to their new histogramequalized values.

    return newImage;
}

module.exports = histogramequalization;
