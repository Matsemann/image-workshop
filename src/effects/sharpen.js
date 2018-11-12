const Image = require('../Image');
const boxblur = require('./boxblur');

/**
 * @param image {Image}
 * @returns {Image}
 */
function sharpen(image) {

    const newImage = Image.empty(image.width, image.height);

    //1. Blur original image

    //2. Find difference between orignal image and blurred version

    //3. Add difference to original image

    return newImage;
}

module.exports = sharpen;
