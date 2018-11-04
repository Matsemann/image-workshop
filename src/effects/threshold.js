const Image = require('../Image');

/**
 * @param image {Image}
 * @returns {Image}
 */
function threshold(image, threshold) {
    console.log(threshold);
    const newImage = Image.empty(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = image.getR(x, y);
            const g = image.getG(x, y);
            const b = image.getB(x, y);

            let c = 0;
            if ((r + g + b) / 3 > threshold) {
                c = 255;
            }
            newImage.setRGB(x, y, [c, c, c]);
        }
    }
    return newImage;
}

module.exports = threshold;