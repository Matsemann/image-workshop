const Image = require('../Image');

/**
 * @param image {Image}
 * @param radius Number
 * @returns {Image}
 */
function boxblur(image, radius) {
    radius = Number(radius);
    const newImage = Image.empty(image.width, image.height);

    for (let x = radius; x < image.width-radius; x++) {
        for (let y = radius; y < image.height-radius; y++) {

        }
    }
    return newImage;
}

module.exports = boxblur;
