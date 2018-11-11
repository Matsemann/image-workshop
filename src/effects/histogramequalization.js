const Image = require('../Image');

/**
 * @param image {Image}
 * @returns {Image}
 */
function histogramequalization(image) {
    const newImage = Image.empty(image.width, image.height);

    const nr = Array(256).fill(0);
    const ng = Array(256).fill(0);
    const nb = Array(256).fill(0);

    const sr = Array(256).fill(0);
    const sg = Array(256).fill(0);
    const sb = Array(256).fill(0);

    // Counting number of pixels with intensity from 0 to 255
    // nr[0] is the number of pixels with R-value that has an intensity of 0, nr[1] is the number of pixels with R-value with intensity 1 etc.
    // Similiar for ng and nb
    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            nr[image.getR(x, y)]++;
            ng[image.getG(x, y)]++;
            nb[image.getB(x, y)]++;
        }
    }

    // sr[k] is the new intensity for all the pixels with R-value equal to intensity k
    for (let k = 0; k < 256; k++) {
        for (let j = 0; j <= k; j++) {
            sr[k] = sr[k] + nr[j];
            sg[k] = sg[k] + ng[j];
            sb[k] = sb[k] + nb[j];
        }
        sr[k] = Math.round(sr[k]*255/(image.height*image.width));
        sg[k] = Math.round(sg[k]*255/(image.height*image.width));
        sb[k] = Math.round(sb[k]*255/(image.height*image.width));
    }

    // Tranforming all pixels and their RGB-values to their new histogramequalized values.
    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            newImage.setR(x, y, sr[image.getR(x, y)]);
            newImage.setG(x, y, sg[image.getG(x, y)]);
            newImage.setB(x, y, sb[image.getB(x, y)]);
        }
    }

    return newImage;
}

module.exports = histogramequalization;
