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

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {

            const r = image.getR(x, y);
            const g = image.getG(x, y);
            const b = image.getB(x, y);

            const intensity = 0.34 * r + 0.5 * g + 0.16 * b;

            newImage.setR(x, y, intensity);
            newImage.setG(x, y, intensity);
            newImage.setB(x, y, intensity);

            /* evt
            const [r, g, b] = image.getRGB(x, y);
            const c = 0.34 * r + 0.5 * g + 0.16 * b;
            newImage.setRGB(x, y, [c, c, c]);*/
        }
    }
    return newImage;
}

module.exports = greyscale;