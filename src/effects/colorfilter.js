const Image = require('../Image');

/**
 * @param image {Image}
 * @returns {Image}
 */
function colorfilter(image) {
    const newImage = Image.empty(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = image.getR(x, y);
            const g = image.getG(x, y);
            const b = image.getB(x, y);

            newImage.setR(x, y, r - 50);
            newImage.setG(x, y, g);
            newImage.setB(x, y, b);
        }
    }
    return newImage;
}

module.exports = colorfilter;