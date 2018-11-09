const Image = require('../Image');

/**
 * Takes an RGB image, returns a new image with energylevels per pixel
 * @param image {Image}
 * @returns {EnergyImage}
 */
function imageEnergy(image) {
    const energyImage = Image.createEnergyImage(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            let energy;
            if (isBorderPixel(x, y, image.width, image.height)) {
                energy = 300;
            } else {
                energy = Math.sqrt(
                    Math.pow(image.getR(x + 1, y) - image.getR(x - 1, y), 2) +
                    Math.pow(image.getG(x + 1, y) - image.getG(x - 1, y), 2) +
                    Math.pow(image.getB(x + 1, y) - image.getB(x - 1, y), 2) +

                    Math.pow(image.getR(x, y + 1) - image.getR(x, y - 1), 2) +
                    Math.pow(image.getG(x, y + 1) - image.getG(x, y - 1), 2) +
                    Math.pow(image.getB(x, y + 1) - image.getB(x, y - 1), 2)
                );

            }

            energyImage.setValue(x, y, energy);
        }
    }
    return energyImage;
}

function isBorderPixel(x, y, imageWidth, imageHeight) {
    return x === 0 || x === imageWidth - 1 || y === 0 || y === imageHeight - 1;
}


/**
 * Takes an energyImage with energylevels per pixel, and uses dynamic programming
 * to find paths from top to bottom with the least energy
 * @param energyImage {EnergyImage}
 */
function calculateSeams(energyImage) {
    const seam = Image.createEnergyImage(energyImage.width, energyImage.height);

    for (let y = 0; y < seam.height; y++) {
        for (let x = 0; x < seam.width; x++) {
            const energyAtPx = energyImage.getValue(x, y);

            if (y === 0) {
                seam.setValue(x, y, energyAtPx);
                continue;
            }

            const minParent = Math.min(x - 1 >= 0 ? seam.getValue(x - 1, y - 1) : 99999, seam.getValue(x, y - 1), x + 1 < seam.width ? seam.getValue(x + 1, y - 1) : 99999);
            seam.setValue(x, y, energyAtPx + minParent);
        }
    }
    return seam;
}

/**
 * After all the paths are calculated, find the lowest one on the last row
 * and move back up, keeping track of the path
 */
function findMinSeam(seams) {
    const positions = [];

    // find lowest pos
    let lowest = 99999, lowestIndex = 0;
    for (let x = 0; x < seams.width; x++) {
        const value = seams.getValue(x, seams.height - 1);
        if (value < lowest) {
            lowest = value;
            lowestIndex = x;
        }
    }
    positions[seams.height - 1] = lowestIndex;

    // iterate upwards
    for (let y = seams.height - 2; y >= 0; y--) {
        let lowestParent = 999999, lowestParentIndex = 0;
        if (lowestIndex - 1 >= 0) {
            lowestParent = seams.getValue(lowestIndex - 1, y);
            lowestParentIndex = lowestIndex - 1;
        }

        if (seams.getValue(lowestIndex, y) < lowestParent) {
            lowestParent = seams.getValue(lowestIndex, y);
            lowestParentIndex = lowestIndex;
        }

        if (lowestIndex + 1 < seams.width && seams.getValue(lowestIndex + 1, y) < lowestParent) {
            lowestParent = seams.getValue(lowestIndex + 1, y);
            lowestParentIndex = lowestIndex + 1;
        }

        positions[y] = lowestParentIndex;
        lowestIndex = lowestParentIndex;
    }

    return positions;
}


/**
 * Creates a new image, one pixel smaller, that contains everything
 * from the original image, except the pixel on each line found from seam carving to remove
 * @param image {Image}
 * @param seamPos {Number[]} x value for pixel to remove on each row
 * @returns {Image}
 */
function removeSeam(image, seamPos) {
    const newImage = Image.empty(image.width - 1, image.height);


    for (let y = 0; y < newImage.height; y++) {
        const xToRemove = seamPos[y];
        for (let x = 0; x < newImage.width; x++) {
            if (x < xToRemove) {
                newImage.setRGB(x, y, image.getRGB(x, y));
            } else {
                newImage.setRGB(x, y, image.getRGB(x+1, y));
            }

        }
    }
    return newImage;
}

/**
 * Marks the found seam as a red path on the image
 */
function showSeam(image, seamPos) {
    const newImage = Image.clone(image);

    for (let y = 0; y < image.height; y++) {
        newImage.setRGB(seamPos[y], y, [255, 0, 0]);
    }

    return newImage;
}

/**
 * Util for showing the energy as greyscale image for debugging
 */
function showEnergyImage(energy) {
    const image = Image.empty(energy.width, energy.height);

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            const c = Math.ceil((energy.getValue(x, y) / 300) * 255);

            image.setRGB(x, y, [c, c, c]);
        }
    }

    return image;
}

module.exports = {
    imageEnergy,
    showEnergyImage,
    calculateSeams,
    findMinSeam,
    showSeam,
    removeSeam
};