const Image = require('../Image');

/**
 * @param image {Image}
 * @param radius Number
 * @returns {Image}
 */
function medianfilter(image, radius) {
    radius = Number(radius);
    const median = Math.trunc(Math.pow(2*radius+1, 2)/2);
    const newImage = Image.empty(image.width, image.height);

    const medianr = Array(Math.pow(2*radius+1, 2)).fill(0);
    const mediang = Array(Math.pow(2*radius+1, 2)).fill(0);
    const medianb = Array(Math.pow(2*radius+1, 2)).fill(0);

    for (let x = radius; x < image.width-radius; x++) {
        for (let y = radius; y < image.height-radius; y++) {

            let count = 0;
            for (let i = x-radius; i <= x+radius; i++) {
                for (let j = y-radius; j <= y+radius; j++) {
                    medianr[count] = image.getR(i, j);
                    mediang[count] = image.getG(i, j);
                    medianb[count] = image.getB(i, j);
                    count++;
                }
            }

            medianr.sort((a, b) => a - b);
            mediang.sort((a, b) => a - b);
            medianb.sort((a, b) => a - b);

            newImage.setR(x, y, medianr[median]);
            newImage.setG(x, y, mediang[median]);
            newImage.setB(x, y, medianb[median]);
        }
    }
    return newImage;
}

module.exports = medianfilter;
