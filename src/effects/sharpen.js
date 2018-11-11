const Image = require('../Image');
const boxblur = require('./boxblur');

/**
 * @param image {Image}
 * @returns {Image}
 */
function sharpen(image) {

    const blurredImage = boxblur(image, 3);
    const newImage = Image.empty(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = image.getR(x, y) + 3*(image.getR(x,y) - blurredImage.getR(x, y));
            const g = image.getG(x, y) + 3*(image.getG(x,y) - blurredImage.getG(x, y));
            const b = image.getB(x, y) + 3*(image.getB(x,y) - blurredImage.getB(x, y));

            newImage.setRGB(x, y, [r, g, b]);
        }
    }

    return newImage;
}

module.exports = sharpen;
