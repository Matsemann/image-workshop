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
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;

            for (let i = x-radius; i <= x+radius; i++) {
                for (let j = y-radius; j <= y+radius; j++) {
                    sumR = sumR + image.getR(i, j);
                    sumG = sumG + image.getG(i, j);
                    sumB = sumB + image.getB(i, j);
                }
            }

            newImage.setR(x, y, sumR/Math.pow(radius*2+1,2));
            newImage.setG(x, y, sumG/Math.pow(radius*2+1,2));
            newImage.setB(x, y, sumB/Math.pow(radius*2+1,2));
        }
    }
    return newImage;
}

module.exports = boxblur;
