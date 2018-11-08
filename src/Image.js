class Image {

    constructor(imageData) {
        this.imageData = imageData;
        this.data = imageData.data;
        this.width = imageData.width;
        this.height = imageData.height;
    }

    /**
     * Data is a single-dimensional array, with 4 values (rgba) per px
     */
    getIndex(x, y) {
        if (x < 0 || x >= this.width) {
            throw new Error("x " + x + " is not between 0 and " + this.width);
        }else if (y < 0 || y >= this.height) {
            throw new Error("y " + y + " is not between 0 and " + this.height);
        }
        return y * (this.width * 4) + (x * 4);
    }

    getR(x, y) {
        return this.data[this.getIndex(x, y)];
    }

    getG(x, y) {
        return this.data[this.getIndex(x, y) + 1];
    }

    getB(x, y) {
        return this.data[this.getIndex(x, y) + 2];
    }

    getRGB(x, y) {
        const index = this.getIndex(x, y);
        return [this.data[index], this.data[index + 1], this.data[index + 2]];
    }

    setR(x, y, rValue) {
        this.data[this.getIndex(x, y)] = rValue;
    }

    setG(x, y, gValue) {
        this.data[this.getIndex(x, y) + 1] = gValue;
    }

    setB(x, y, bValue) {
        this.data[this.getIndex(x, y) + 2] = bValue;
    }

    setRGB(x, y, [r, g, b]) {
        const index = this.getIndex(x, y);
        this.data[index] = r;
        this.data[index + 1] = g;
        this.data[index + 2] = b;
    }

}

/**
 *
 * @param width number
 * @param height number
 * @returns {Image}
 */
function empty(width, height) {
    const buffer = new ArrayBuffer(width * height * 4);
    const data = new Uint8ClampedArray(buffer);
    const imageData = new ImageData(data, width, height);

    // Set alpha to 255
    for (let i = 3; i < (width * height * 4); i += 4) {
        data[i] = 255;
    }

    return new Image(imageData);
}

/**
 * @param image {Image}
 * @returns {Image}
 */
function clone(image) {
    const buffer = new ArrayBuffer(image.width * image.height * 4);
    const data = new Uint8ClampedArray(buffer);
    const imageData = new ImageData(data, image.width, image.height);

    for (let i = 0; i < data.length; i++) {
        data[i] = image.data[i];
    }

    return new Image(imageData);

}


class EnergyImage {
    constructor(data32bit, width, height) {
        this.data32bit = data32bit;
        this.width = width;
        this.height = height;
    }

    setValue(x, y, value) {
        this.data32bit[this.getIndex(x, y)] = value;
    }

    getValue(x, y) {
        return this.data32bit[this.getIndex(x, y)];
    }

    getIndex(x, y) {
        if (x < 0 || x >= this.width) {
            throw new Error("x " + x + " is not between 0 and " + this.width);
        }else if (y < 0 || y >= this.height) {
            throw new Error("y " + y + " is not between 0 and " + this.height);
        }
        return y * this.width + x;
    }
}

function createEnergyImage(width, height) {
    const buffer = new ArrayBuffer(width * height * 4);
    const data32Bit = new Uint32Array(buffer);

    return new EnergyImage(data32Bit, width, height);
}
/*
function cloneEnergyImage(energyImage) {

    const buffer = new ArrayBuffer(energyImage.width * energyImage.height * 4);
    const data32Bit = new Uint32Array(buffer);

    for (let i = 0; i < data32Bit.length; i++) {
        data32Bit[i] = energyImage.data32bit[i];
    }

    return new EnergyImage(data32Bit, energyImage.width, energyImage.height);
}*/

module.exports = {
    Image,
    empty,
    clone,
    EnergyImage,
    createEnergyImage,
    // cloneEnergyImage
};