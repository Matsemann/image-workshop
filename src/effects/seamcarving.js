const Image = require('../Image');

/*
 * IMPLEMENT imageEnergy(..) and calculateSeams(..) functions
 */

/**
 * Takes an RGB image, returns a new image with energylevels per pixel
 * @param image {Image}
 * @returns {EnergyImage}
 */
function imageEnergy(image) {
    const energyImage = Image.createEnergyImage(image.width, image.height);

    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            let energy;

            // Calculate energy for the pixel

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
    const seamImage = Image.createEnergyImage(energyImage.width, energyImage.height);

    // iterate over all rows and columns and calculate the cheapest way to get to the current pixel

    return seamImage;
}


/*
 *
 * STUFF below already implemented for you :)
 *
 */


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
                newImage.setRGB(x, y, image.getRGB(x + 1, y));
            }

        }
    }
    return newImage;
}

/**
 * Marks the found seam as a red path on the image
 * Not part of the algorithm, just used to show in the UI / debugging
 */
function showSeam(image, seamPos) {
    const newImage = Image.clone(image);

    for (let y = 0; y < image.height; y++) {
        newImage.setRGB(seamPos[y], y, [255, 0, 0]);
    }

    return newImage;
}

/**
 * Showing the energy as greyscale image for debugging
 * Not part of the algorithm, just to show in the UI / debugging
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