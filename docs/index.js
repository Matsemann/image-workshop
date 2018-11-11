(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
        const ImageData = require('./Image');

        const MAX_WIDTH = 1200;

        class Editor {


            constructor() {
            }

            loadImage(imageName) {
                const loader = new Image();
                loader.onload = () => {
                    const imageData = this.getImageData(loader);
                    this.setNewImage(imageData);
                };
                loader.src = imageName;
            }

            getImageData(loader) {
                const loaderCanvas = document.querySelector("#loaderCanvas");
                const loaderContext = loaderCanvas.getContext('2d');

                // Draw scaled image to invisible canvas and read back the pixel data
                const [width, height] = scaleSize(loader.width, loader.height);
                loaderCanvas.width = width;
                loaderCanvas.height = height;

                loaderContext.drawImage(loader, 0, 0, width, height);
                const data = loaderContext.getImageData(0, 0, width, height);

                return new ImageData.Image(data);
            }

            setNewImage(image) {
                this.original = image;
                this.current = ImageData.clone(image);
                this.olds = [this.current];
                this.render(this.original, "original");
                this.render(this.current, "edited");
            }

            render(image, canvasName) {
                const canvas = document.querySelector("#" + canvasName);
                const context = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;

                context.putImageData(image.imageData, 0, 0);
            }

            applyEffect(effect, ...args) {
                this.current = effect(ImageData.clone(this.current), ...args);
                this.olds.push(this.current);
                this.render(this.current, "edited");
            }

            setCurrent(image) {
                this.current = image;
                this.olds.push(this.current);
                this.render(this.current, "edited");
            }

            undoEffect() {
                if (this.olds.length > 1) {
                    this.olds.pop();
                    this.current = this.olds[this.olds.length - 1];
                    this.render(this.current, "edited");
                }
            }



        }

        function scaleSize(width, height) {
            if (width > MAX_WIDTH) {
                height = height / (width / MAX_WIDTH);
                width = MAX_WIDTH;
            }
            return [width, height];
        }

        module.exports = Editor;
    },{"./Image":2}],2:[function(require,module,exports){
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

    },{}],3:[function(require,module,exports){
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

    },{"../Image":2}],4:[function(require,module,exports){
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

            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {

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
    },{"../Image":2}],5:[function(require,module,exports){
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

    },{"../Image":2}],6:[function(require,module,exports){
        const Image = require('../Image');

        /**
         * Takes an image with RGB values, and inverts the value of each pixel, i.e 255 - pixel value.
         *
         * @param image {Image}
         * @returns {Image}
         */
        function invert(image) {
            const newImage = Image.empty(image.width, image.height);

            for (let x = 0; x < image.width; x++) {
                for (let y = 0; y < image.height; y++) {

                    const r = 255 - image.getR(x, y);
                    const g = 255 - image.getG(x, y);
                    const b = 255 - image.getB(x, y);

                    newImage.setRGB(x, y, [r, g, b]);
                }
            }
            return newImage;
        }

        module.exports = invert;

    },{"../Image":2}],7:[function(require,module,exports){
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

    },{"../Image":2}],8:[function(require,module,exports){
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
            const seamImage = Image.createEnergyImage(energyImage.width, energyImage.height);

            for (let y = 0; y < seamImage.height; y++) {
                for (let x = 0; x < seamImage.width; x++) {
                    const energyAtPx = energyImage.getValue(x, y);

                    if (y === 0) {
                        seamImage.setValue(x, y, energyAtPx);
                        continue;
                    }

                    const minParent = Math.min(x - 1 >= 0 ? seamImage.getValue(x - 1, y - 1) : 99999, seamImage.getValue(x, y - 1), x + 1 < seamImage.width ? seamImage.getValue(x + 1, y - 1) : 99999);
                    seamImage.setValue(x, y, energyAtPx + minParent);
                }
            }
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
    },{"../Image":2}],9:[function(require,module,exports){
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

    },{"../Image":2,"./boxblur":3}],10:[function(require,module,exports){
        const Image = require('../Image');

        /**
         * Takes an image with RGB values, and turns the pixels either white (255,255,255) or black (0,0,0)
         * depending on if the intensity is above or below the threshold
         *
         * @param image {Image}
         * @param threshold Number
         * @returns {Image}
         */
        function threshold(image, threshold) {
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
    },{"../Image":2}],11:[function(require,module,exports){
        const Image = require('../Image');

        /**
         * Adds some more red and removes some blue from the image's pixels
         * @param image {Image}
         * @returns {Image}
         */
        function warmfilter(image) {
            const newImage = Image.empty(image.width, image.height);

            for (let x = 0; x < image.width; x++) {
                for (let y = 0; y < image.height; y++) {

                    const r = image.getR(x, y);
                    const g = image.getG(x, y);
                    const b = image.getB(x, y);

                    newImage.setR(x, y, r + 25);
                    newImage.setG(x, y, g);
                    newImage.setB(x, y, b - 25);
                }
            }
            return newImage;
        }

        module.exports = warmfilter;

    },{"../Image":2}],12:[function(require,module,exports){
        const Editor = require('./Editor');
        const greyscale = require('./effects/greyscale');
        const colorfilter = require('./effects/warmfilter');
        const threshold = require('./effects/threshold');
        const boxblur = require('./effects/boxblur');
        const invert = require('./effects/invert');
        const histogramequalization = require('./effects/histogramequalization');
        const medianfilter = require('./effects/medianfilter');
        const sharpen = require('./effects/sharpen');
        const seam = require('./effects/seamcarving');


        const editor = new Editor();
        editor.loadImage('tower.jpg');

        document.querySelector("#images").addEventListener('change', () => {
            const selectedImage = document.querySelector("#images").value;
            editor.loadImage(selectedImage);
        });

        document.querySelector("#load").addEventListener('click', () => {
            const selectedImage = document.querySelector("#images").value;
            editor.loadImage(selectedImage);
        });

        document.querySelector("#undo").addEventListener('click', () => {
            editor.undoEffect();
        });

        document.querySelector("#threshold").addEventListener('click', () => {
            editor.applyEffect(threshold, document.querySelector("#thresholdvalue").value);
        });

        document.querySelector("#greyscale").addEventListener('click', () => {
            editor.applyEffect(greyscale);
        });

        document.querySelector("#warmfilter").addEventListener('click', () => {
            editor.applyEffect(colorfilter);
        });

        document.querySelector("#boxblur").addEventListener('click', () => {
            editor.applyEffect(boxblur, document.querySelector("#blurradius").value);
        });

        document.querySelector("#medianfilter").addEventListener('click', () => {
            editor.applyEffect(medianfilter, document.querySelector("#radius").value);
        });

        document.querySelector("#invert").addEventListener('click', () => {
            editor.applyEffect(invert);
        });

        document.querySelector("#sharpen").addEventListener('click', () => {
            editor.applyEffect(sharpen);
        });

        document.querySelector("#histogramequalization").addEventListener('click', () => {
            editor.applyEffect(histogramequalization);
        });

        document.querySelector("#energy").addEventListener('click', () => {
            editor.applyEffect((image) => {
                return seam.showEnergyImage(seam.imageEnergy(image));
            });
        });
        document.querySelector("#findSeam").addEventListener('click', () => {
            editor.applyEffect((image) => {
                const energy = seam.imageEnergy(image);
                const seams = seam.calculateSeams(energy);
                const minSeam = seam.findMinSeam(seams);
                const showSeam = seam.showSeam(image, minSeam);
                return showSeam;
            });
        });


        let isRunning = false;
        document.querySelector("#runSeamcarver").addEventListener('click', () => {
            isRunning = true;
            document.querySelector("#runSeamcarver").disabled = true;
            document.querySelector("#stopSeamcarver").disabled = false;

            let image = editor.current;

            function seamCarve() {

                const energy = seam.imageEnergy(image);
                const seams = seam.calculateSeams(energy);
                const minSeam = seam.findMinSeam(seams);
                const showSeam = seam.showSeam(image, minSeam);

                editor.render(showSeam, "edited");

                image = seam.removeSeam(image, minSeam);

                if (isRunning) {
                    setTimeout(seamCarve, 10);
                } else {
                    editor.setCurrent(image);
                }
            }

            seamCarve();
        });

        document.querySelector("#stopSeamcarver").addEventListener('click', () => {
            isRunning = false;
            document.querySelector("#runSeamcarver").disabled = false;
            document.querySelector("#stopSeamcarver").disabled = true;
        });



    },{"./Editor":1,"./effects/boxblur":3,"./effects/greyscale":4,"./effects/histogramequalization":5,"./effects/invert":6,"./effects/medianfilter":7,"./effects/seamcarving":8,"./effects/sharpen":9,"./effects/threshold":10,"./effects/warmfilter":11}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRWRpdG9yLmpzIiwic3JjL0ltYWdlLmpzIiwic3JjL2VmZmVjdHMvYm94Ymx1ci5qcyIsInNyYy9lZmZlY3RzL2dyZXlzY2FsZS5qcyIsInNyYy9lZmZlY3RzL2hpc3RvZ3JhbWVxdWFsaXphdGlvbi5qcyIsInNyYy9lZmZlY3RzL2ludmVydC5qcyIsInNyYy9lZmZlY3RzL21lZGlhbmZpbHRlci5qcyIsInNyYy9lZmZlY3RzL3NlYW1jYXJ2aW5nLmpzIiwic3JjL2VmZmVjdHMvc2hhcnBlbi5qcyIsInNyYy9lZmZlY3RzL3RocmVzaG9sZC5qcyIsInNyYy9lZmZlY3RzL3dhcm1maWx0ZXIuanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBJbWFnZURhdGEgPSByZXF1aXJlKCcuL0ltYWdlJyk7XHJcblxyXG5jb25zdCBNQVhfV0lEVEggPSAxMjAwO1xyXG5cclxuY2xhc3MgRWRpdG9yIHtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZEltYWdlKGltYWdlTmFtZSkge1xyXG4gICAgICAgIGNvbnN0IGxvYWRlciA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgIGxvYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IHRoaXMuZ2V0SW1hZ2VEYXRhKGxvYWRlcik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0TmV3SW1hZ2UoaW1hZ2VEYXRhKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGxvYWRlci5zcmMgPSBpbWFnZU5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SW1hZ2VEYXRhKGxvYWRlcikge1xyXG4gICAgICAgIGNvbnN0IGxvYWRlckNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGVyQ2FudmFzXCIpO1xyXG4gICAgICAgIGNvbnN0IGxvYWRlckNvbnRleHQgPSBsb2FkZXJDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgLy8gRHJhdyBzY2FsZWQgaW1hZ2UgdG8gaW52aXNpYmxlIGNhbnZhcyBhbmQgcmVhZCBiYWNrIHRoZSBwaXhlbCBkYXRhXHJcbiAgICAgICAgY29uc3QgW3dpZHRoLCBoZWlnaHRdID0gc2NhbGVTaXplKGxvYWRlci53aWR0aCwgbG9hZGVyLmhlaWdodCk7XHJcbiAgICAgICAgbG9hZGVyQ2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgbG9hZGVyQ2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgbG9hZGVyQ29udGV4dC5kcmF3SW1hZ2UobG9hZGVyLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICBjb25zdCBkYXRhID0gbG9hZGVyQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgSW1hZ2VEYXRhLkltYWdlKGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5ld0ltYWdlKGltYWdlKSB7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbCA9IGltYWdlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IEltYWdlRGF0YS5jbG9uZShpbWFnZSk7XHJcbiAgICAgICAgdGhpcy5vbGRzID0gW3RoaXMuY3VycmVudF07XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5vcmlnaW5hbCwgXCJvcmlnaW5hbFwiKTtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmN1cnJlbnQsIFwiZWRpdGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihpbWFnZSwgY2FudmFzTmFtZSkge1xyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBjYW52YXNOYW1lKTtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlLmltYWdlRGF0YSwgMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXBwbHlFZmZlY3QoZWZmZWN0LCAuLi5hcmdzKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gZWZmZWN0KEltYWdlRGF0YS5jbG9uZSh0aGlzLmN1cnJlbnQpLCAuLi5hcmdzKTtcclxuICAgICAgICB0aGlzLm9sZHMucHVzaCh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY3VycmVudCwgXCJlZGl0ZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVudChpbWFnZSkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IGltYWdlO1xyXG4gICAgICAgIHRoaXMub2xkcy5wdXNoKHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICB1bmRvRWZmZWN0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9sZHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLm9sZHMucG9wKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHRoaXMub2xkc1t0aGlzLm9sZHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY3VycmVudCwgXCJlZGl0ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBzY2FsZVNpemUod2lkdGgsIGhlaWdodCkge1xyXG4gICAgaWYgKHdpZHRoID4gTUFYX1dJRFRIKSB7XHJcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IC8gKHdpZHRoIC8gTUFYX1dJRFRIKTtcclxuICAgICAgICB3aWR0aCA9IE1BWF9XSURUSDtcclxuICAgIH1cclxuICAgIHJldHVybiBbd2lkdGgsIGhlaWdodF07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yOyIsImNsYXNzIEltYWdlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpbWFnZURhdGEpIHtcclxuICAgICAgICB0aGlzLmltYWdlRGF0YSA9IGltYWdlRGF0YTtcclxuICAgICAgICB0aGlzLmRhdGEgPSBpbWFnZURhdGEuZGF0YTtcclxuICAgICAgICB0aGlzLndpZHRoID0gaW1hZ2VEYXRhLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERhdGEgaXMgYSBzaW5nbGUtZGltZW5zaW9uYWwgYXJyYXksIHdpdGggNCB2YWx1ZXMgKHJnYmEpIHBlciBweFxyXG4gICAgICovXHJcbiAgICBnZXRJbmRleCh4LCB5KSB7XHJcbiAgICAgICAgaWYgKHggPCAwIHx8IHggPj0gdGhpcy53aWR0aCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ4IFwiICsgeCArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy53aWR0aCk7XHJcbiAgICAgICAgfWVsc2UgaWYgKHkgPCAwIHx8IHkgPj0gdGhpcy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwieSBcIiArIHkgKyBcIiBpcyBub3QgYmV0d2VlbiAwIGFuZCBcIiArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHkgKiAodGhpcy53aWR0aCAqIDQpICsgKHggKiA0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSKHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSldO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEcoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDFdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEIoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDJdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJHQih4LCB5KSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmdldEluZGV4KHgsIHkpO1xyXG4gICAgICAgIHJldHVybiBbdGhpcy5kYXRhW2luZGV4XSwgdGhpcy5kYXRhW2luZGV4ICsgMV0sIHRoaXMuZGF0YVtpbmRleCArIDJdXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRSKHgsIHksIHJWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpXSA9IHJWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHKHgsIHksIGdWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMV0gPSBnVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Qih4LCB5LCBiVmFsdWUpIHtcclxuICAgICAgICB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDJdID0gYlZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFJHQih4LCB5LCBbciwgZywgYl0pIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4XSA9IHI7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4ICsgMV0gPSBnO1xyXG4gICAgICAgIHRoaXMuZGF0YVtpbmRleCArIDJdID0gYjtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0gd2lkdGggbnVtYmVyXHJcbiAqIEBwYXJhbSBoZWlnaHQgbnVtYmVyXHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGVtcHR5KHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcih3aWR0aCAqIGhlaWdodCAqIDQpO1xyXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXIpO1xyXG4gICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShkYXRhLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAvLyBTZXQgYWxwaGEgdG8gMjU1XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8ICh3aWR0aCAqIGhlaWdodCAqIDQpOyBpICs9IDQpIHtcclxuICAgICAgICBkYXRhW2ldID0gMjU1O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgSW1hZ2UoaW1hZ2VEYXRhKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGNsb25lKGltYWdlKSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoaW1hZ2Uud2lkdGggKiBpbWFnZS5oZWlnaHQgKiA0KTtcclxuICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnVmZmVyKTtcclxuICAgIGNvbnN0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEoZGF0YSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgZGF0YVtpXSA9IGltYWdlLmRhdGFbaV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbWFnZShpbWFnZURhdGEpO1xyXG5cclxufVxyXG5cclxuXHJcbmNsYXNzIEVuZXJneUltYWdlIHtcclxuICAgIGNvbnN0cnVjdG9yKGRhdGEzMmJpdCwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgICAgIHRoaXMuZGF0YTMyYml0ID0gZGF0YTMyYml0O1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBzZXRWYWx1ZSh4LCB5LCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YTMyYml0W3RoaXMuZ2V0SW5kZXgoeCwgeSldID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VmFsdWUoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGEzMmJpdFt0aGlzLmdldEluZGV4KHgsIHkpXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRJbmRleCh4LCB5KSB7XHJcbiAgICAgICAgaWYgKHggPCAwIHx8IHggPj0gdGhpcy53aWR0aCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ4IFwiICsgeCArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy53aWR0aCk7XHJcbiAgICAgICAgfWVsc2UgaWYgKHkgPCAwIHx8IHkgPj0gdGhpcy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwieSBcIiArIHkgKyBcIiBpcyBub3QgYmV0d2VlbiAwIGFuZCBcIiArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHkgKiB0aGlzLndpZHRoICsgeDtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlRW5lcmd5SW1hZ2Uod2lkdGgsIGhlaWdodCkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdpZHRoICogaGVpZ2h0ICogNCk7XHJcbiAgICBjb25zdCBkYXRhMzJCaXQgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcclxuXHJcbiAgICByZXR1cm4gbmV3IEVuZXJneUltYWdlKGRhdGEzMkJpdCwgd2lkdGgsIGhlaWdodCk7XHJcbn1cclxuLypcclxuZnVuY3Rpb24gY2xvbmVFbmVyZ3lJbWFnZShlbmVyZ3lJbWFnZSkge1xyXG5cclxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihlbmVyZ3lJbWFnZS53aWR0aCAqIGVuZXJneUltYWdlLmhlaWdodCAqIDQpO1xyXG4gICAgY29uc3QgZGF0YTMyQml0ID0gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlcik7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhMzJCaXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBkYXRhMzJCaXRbaV0gPSBlbmVyZ3lJbWFnZS5kYXRhMzJiaXRbaV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBFbmVyZ3lJbWFnZShkYXRhMzJCaXQsIGVuZXJneUltYWdlLndpZHRoLCBlbmVyZ3lJbWFnZS5oZWlnaHQpO1xyXG59Ki9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgSW1hZ2UsXHJcbiAgICBlbXB0eSxcclxuICAgIGNsb25lLFxyXG4gICAgRW5lcmd5SW1hZ2UsXHJcbiAgICBjcmVhdGVFbmVyZ3lJbWFnZSxcclxuICAgIC8vIGNsb25lRW5lcmd5SW1hZ2VcclxufTtcclxuIiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEBwYXJhbSByYWRpdXMgTnVtYmVyXHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGJveGJsdXIoaW1hZ2UsIHJhZGl1cykge1xyXG4gICAgcmFkaXVzID0gTnVtYmVyKHJhZGl1cyk7XHJcbiAgICBjb25zdCBuZXdJbWFnZSA9IEltYWdlLmVtcHR5KGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHggPSByYWRpdXM7IHggPCBpbWFnZS53aWR0aC1yYWRpdXM7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSByYWRpdXM7IHkgPCBpbWFnZS5oZWlnaHQtcmFkaXVzOyB5KyspIHtcclxuICAgICAgICAgICAgbGV0IHN1bVIgPSAwO1xyXG4gICAgICAgICAgICBsZXQgc3VtRyA9IDA7XHJcbiAgICAgICAgICAgIGxldCBzdW1CID0gMDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSB4LXJhZGl1czsgaSA8PSB4K3JhZGl1czsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0geS1yYWRpdXM7IGogPD0geStyYWRpdXM7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN1bVIgPSBzdW1SICsgaW1hZ2UuZ2V0UihpLCBqKTtcclxuICAgICAgICAgICAgICAgICAgICBzdW1HID0gc3VtRyArIGltYWdlLmdldEcoaSwgaik7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VtQiA9IHN1bUIgKyBpbWFnZS5nZXRCKGksIGopO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIHN1bVIvTWF0aC5wb3cocmFkaXVzKjIrMSwyKSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgc3VtRy9NYXRoLnBvdyhyYWRpdXMqMisxLDIpKTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBzdW1CL01hdGgucG93KHJhZGl1cyoyKzEsMikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBib3hibHVyO1xyXG4iLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gaW1hZ2Ugd2l0aCBSR0IgdmFsdWVzLCBhbmQgY29udmVydHMgaXQgdG8gZ3JleXNjYWxlXHJcbiAqIGJ5IGNhbGN1bGF0aW5nIGludGVuc2l0eSBhdCBlYWNoIHBpeGVsXHJcbiAqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGdyZXlzY2FsZShpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gMC4zNCAqIHIgKyAwLjUgKiBnICsgMC4xNiAqIGI7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIGludGVuc2l0eSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgaW50ZW5zaXR5KTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBpbnRlbnNpdHkpO1xyXG5cclxuICAgICAgICAgICAgLyogZXZ0XHJcbiAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGltYWdlLmdldFJHQih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDAuMzQgKiByICsgMC41ICogZyArIDAuMTYgKiBiO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTsqL1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBncmV5c2NhbGU7IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGhpc3RvZ3JhbWVxdWFsaXphdGlvbihpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBjb25zdCBuciA9IEFycmF5KDI1NikuZmlsbCgwKTtcclxuICAgIGNvbnN0IG5nID0gQXJyYXkoMjU2KS5maWxsKDApO1xyXG4gICAgY29uc3QgbmIgPSBBcnJheSgyNTYpLmZpbGwoMCk7XHJcblxyXG4gICAgY29uc3Qgc3IgPSBBcnJheSgyNTYpLmZpbGwoMCk7XHJcbiAgICBjb25zdCBzZyA9IEFycmF5KDI1NikuZmlsbCgwKTtcclxuICAgIGNvbnN0IHNiID0gQXJyYXkoMjU2KS5maWxsKDApO1xyXG5cclxuICAgIC8vIENvdW50aW5nIG51bWJlciBvZiBwaXhlbHMgd2l0aCBpbnRlbnNpdHkgZnJvbSAwIHRvIDI1NVxyXG4gICAgLy8gbnJbMF0gaXMgdGhlIG51bWJlciBvZiBwaXhlbHMgd2l0aCBSLXZhbHVlIHRoYXQgaGFzIGFuIGludGVuc2l0eSBvZiAwLCBuclsxXSBpcyB0aGUgbnVtYmVyIG9mIHBpeGVscyB3aXRoIFItdmFsdWUgd2l0aCBpbnRlbnNpdHkgMSBldGMuXHJcbiAgICAvLyBTaW1pbGlhciBmb3IgbmcgYW5kIG5iXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgICAgIG5yW2ltYWdlLmdldFIoeCwgeSldKys7XHJcbiAgICAgICAgICAgIG5nW2ltYWdlLmdldEcoeCwgeSldKys7XHJcbiAgICAgICAgICAgIG5iW2ltYWdlLmdldEIoeCwgeSldKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNyW2tdIGlzIHRoZSBuZXcgaW50ZW5zaXR5IGZvciBhbGwgdGhlIHBpeGVscyB3aXRoIFItdmFsdWUgZXF1YWwgdG8gaW50ZW5zaXR5IGtcclxuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgMjU2OyBrKyspIHtcclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBrOyBqKyspIHtcclxuICAgICAgICAgICAgc3Jba10gPSBzcltrXSArIG5yW2pdO1xyXG4gICAgICAgICAgICBzZ1trXSA9IHNnW2tdICsgbmdbal07XHJcbiAgICAgICAgICAgIHNiW2tdID0gc2Jba10gKyBuYltqXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3Jba10gPSBNYXRoLnJvdW5kKHNyW2tdKjI1NS8oaW1hZ2UuaGVpZ2h0KmltYWdlLndpZHRoKSk7XHJcbiAgICAgICAgc2dba10gPSBNYXRoLnJvdW5kKHNnW2tdKjI1NS8oaW1hZ2UuaGVpZ2h0KmltYWdlLndpZHRoKSk7XHJcbiAgICAgICAgc2Jba10gPSBNYXRoLnJvdW5kKHNiW2tdKjI1NS8oaW1hZ2UuaGVpZ2h0KmltYWdlLndpZHRoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVHJhbmZvcm1pbmcgYWxsIHBpeGVscyBhbmQgdGhlaXIgUkdCLXZhbHVlcyB0byB0aGVpciBuZXcgaGlzdG9ncmFtZXF1YWxpemVkIHZhbHVlcy5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Uih4LCB5LCBzcltpbWFnZS5nZXRSKHgsIHkpXSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgc2dbaW1hZ2UuZ2V0Ryh4LCB5KV0pO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRCKHgsIHksIHNiW2ltYWdlLmdldEIoeCwgeSldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ld0ltYWdlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGhpc3RvZ3JhbWVxdWFsaXphdGlvbjtcclxuIiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIGltYWdlIHdpdGggUkdCIHZhbHVlcywgYW5kIGludmVydHMgdGhlIHZhbHVlIG9mIGVhY2ggcGl4ZWwsIGkuZSAyNTUgLSBwaXhlbCB2YWx1ZS5cclxuICpcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gaW52ZXJ0KGltYWdlKSB7XHJcbiAgICBjb25zdCBuZXdJbWFnZSA9IEltYWdlLmVtcHR5KGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHIgPSAyNTUgLSBpbWFnZS5nZXRSKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBnID0gMjU1IC0gaW1hZ2UuZ2V0Ryh4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYiA9IDI1NSAtIGltYWdlLmdldEIoeCwgeSk7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW3IsIGcsIGJdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gaW52ZXJ0O1xyXG4iLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHBhcmFtIHJhZGl1cyBOdW1iZXJcclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gbWVkaWFuZmlsdGVyKGltYWdlLCByYWRpdXMpIHtcclxuICAgIHJhZGl1cyA9IE51bWJlcihyYWRpdXMpO1xyXG4gICAgY29uc3QgbWVkaWFuID0gTWF0aC50cnVuYyhNYXRoLnBvdygyKnJhZGl1cysxLCAyKS8yKTtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgY29uc3QgbWVkaWFuciA9IEFycmF5KE1hdGgucG93KDIqcmFkaXVzKzEsIDIpKS5maWxsKDApO1xyXG4gICAgY29uc3QgbWVkaWFuZyA9IEFycmF5KE1hdGgucG93KDIqcmFkaXVzKzEsIDIpKS5maWxsKDApO1xyXG4gICAgY29uc3QgbWVkaWFuYiA9IEFycmF5KE1hdGgucG93KDIqcmFkaXVzKzEsIDIpKS5maWxsKDApO1xyXG5cclxuICAgIGZvciAobGV0IHggPSByYWRpdXM7IHggPCBpbWFnZS53aWR0aC1yYWRpdXM7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSByYWRpdXM7IHkgPCBpbWFnZS5oZWlnaHQtcmFkaXVzOyB5KyspIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSB4LXJhZGl1czsgaSA8PSB4K3JhZGl1czsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0geS1yYWRpdXM7IGogPD0geStyYWRpdXM7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhbnJbY291bnRdID0gaW1hZ2UuZ2V0UihpLCBqKTtcclxuICAgICAgICAgICAgICAgICAgICBtZWRpYW5nW2NvdW50XSA9IGltYWdlLmdldEcoaSwgaik7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVkaWFuYltjb3VudF0gPSBpbWFnZS5nZXRCKGksIGopO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1lZGlhbnIuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xyXG4gICAgICAgICAgICBtZWRpYW5nLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcclxuICAgICAgICAgICAgbWVkaWFuYi5zb3J0KChhLCBiKSA9PiBhIC0gYik7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIG1lZGlhbnJbbWVkaWFuXSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgbWVkaWFuZ1ttZWRpYW5dKTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBtZWRpYW5iW21lZGlhbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtZWRpYW5maWx0ZXI7XHJcbiIsImNvbnN0IEltYWdlID0gcmVxdWlyZSgnLi4vSW1hZ2UnKTtcclxuXHJcbi8qXHJcbiAqIElNUExFTUVOVCBpbWFnZUVuZXJneSguLikgYW5kIGNhbGN1bGF0ZVNlYW1zKC4uKSBmdW5jdGlvbnNcclxuICovXHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gUkdCIGltYWdlLCByZXR1cm5zIGEgbmV3IGltYWdlIHdpdGggZW5lcmd5bGV2ZWxzIHBlciBwaXhlbFxyXG4gKiBAcGFyYW0gaW1hZ2Uge0ltYWdlfVxyXG4gKiBAcmV0dXJucyB7RW5lcmd5SW1hZ2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBpbWFnZUVuZXJneShpbWFnZSkge1xyXG4gICAgY29uc3QgZW5lcmd5SW1hZ2UgPSBJbWFnZS5jcmVhdGVFbmVyZ3lJbWFnZShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlbmVyZ3k7XHJcbiAgICAgICAgICAgIGlmIChpc0JvcmRlclBpeGVsKHgsIHksIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbmVyZ3kgPSAzMDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbmVyZ3kgPSBNYXRoLnNxcnQoXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Uih4ICsgMSwgeSkgLSBpbWFnZS5nZXRSKHggLSAxLCB5KSwgMikgK1xyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldEcoeCArIDEsIHkpIC0gaW1hZ2UuZ2V0Ryh4IC0gMSwgeSksIDIpICtcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRCKHggKyAxLCB5KSAtIGltYWdlLmdldEIoeCAtIDEsIHkpLCAyKSArXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldFIoeCwgeSArIDEpIC0gaW1hZ2UuZ2V0Uih4LCB5IC0gMSksIDIpICtcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRHKHgsIHkgKyAxKSAtIGltYWdlLmdldEcoeCwgeSAtIDEpLCAyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Qih4LCB5ICsgMSkgLSBpbWFnZS5nZXRCKHgsIHkgLSAxKSwgMilcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbmVyZ3lJbWFnZS5zZXRWYWx1ZSh4LCB5LCBlbmVyZ3kpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBlbmVyZ3lJbWFnZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNCb3JkZXJQaXhlbCh4LCB5LCBpbWFnZVdpZHRoLCBpbWFnZUhlaWdodCkge1xyXG4gICAgcmV0dXJuIHggPT09IDAgfHwgeCA9PT0gaW1hZ2VXaWR0aCAtIDEgfHwgeSA9PT0gMCB8fCB5ID09PSBpbWFnZUhlaWdodCAtIDE7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gZW5lcmd5SW1hZ2Ugd2l0aCBlbmVyZ3lsZXZlbHMgcGVyIHBpeGVsLCBhbmQgdXNlcyBkeW5hbWljIHByb2dyYW1taW5nXHJcbiAqIHRvIGZpbmQgcGF0aHMgZnJvbSB0b3AgdG8gYm90dG9tIHdpdGggdGhlIGxlYXN0IGVuZXJneVxyXG4gKiBAcGFyYW0gZW5lcmd5SW1hZ2Uge0VuZXJneUltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlU2VhbXMoZW5lcmd5SW1hZ2UpIHtcclxuICAgIGNvbnN0IHNlYW1JbWFnZSA9IEltYWdlLmNyZWF0ZUVuZXJneUltYWdlKGVuZXJneUltYWdlLndpZHRoLCBlbmVyZ3lJbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgc2VhbUltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzZWFtSW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgICBjb25zdCBlbmVyZ3lBdFB4ID0gZW5lcmd5SW1hZ2UuZ2V0VmFsdWUoeCwgeSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoeSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgc2VhbUltYWdlLnNldFZhbHVlKHgsIHksIGVuZXJneUF0UHgpO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1pblBhcmVudCA9IE1hdGgubWluKHggLSAxID49IDAgPyBzZWFtSW1hZ2UuZ2V0VmFsdWUoeCAtIDEsIHkgLSAxKSA6IDk5OTk5LCBzZWFtSW1hZ2UuZ2V0VmFsdWUoeCwgeSAtIDEpLCB4ICsgMSA8IHNlYW1JbWFnZS53aWR0aCA/IHNlYW1JbWFnZS5nZXRWYWx1ZSh4ICsgMSwgeSAtIDEpIDogOTk5OTkpO1xyXG4gICAgICAgICAgICBzZWFtSW1hZ2Uuc2V0VmFsdWUoeCwgeSwgZW5lcmd5QXRQeCArIG1pblBhcmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNlYW1JbWFnZTtcclxufVxyXG5cclxuXHJcbi8qXHJcbiAqXHJcbiAqIFNUVUZGIGJlbG93IGFscmVhZHkgaW1wbGVtZW50ZWQgZm9yIHlvdSA6KVxyXG4gKlxyXG4gKi9cclxuXHJcblxyXG4vKipcclxuICogQWZ0ZXIgYWxsIHRoZSBwYXRocyBhcmUgY2FsY3VsYXRlZCwgZmluZCB0aGUgbG93ZXN0IG9uZSBvbiB0aGUgbGFzdCByb3dcclxuICogYW5kIG1vdmUgYmFjayB1cCwga2VlcGluZyB0cmFjayBvZiB0aGUgcGF0aFxyXG4gKi9cclxuZnVuY3Rpb24gZmluZE1pblNlYW0oc2VhbXMpIHtcclxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xyXG5cclxuICAgIC8vIGZpbmQgbG93ZXN0IHBvc1xyXG4gICAgbGV0IGxvd2VzdCA9IDk5OTk5LCBsb3dlc3RJbmRleCA9IDA7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHNlYW1zLndpZHRoOyB4KyspIHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHNlYW1zLmdldFZhbHVlKHgsIHNlYW1zLmhlaWdodCAtIDEpO1xyXG4gICAgICAgIGlmICh2YWx1ZSA8IGxvd2VzdCkge1xyXG4gICAgICAgICAgICBsb3dlc3QgPSB2YWx1ZTtcclxuICAgICAgICAgICAgbG93ZXN0SW5kZXggPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHBvc2l0aW9uc1tzZWFtcy5oZWlnaHQgLSAxXSA9IGxvd2VzdEluZGV4O1xyXG5cclxuICAgIC8vIGl0ZXJhdGUgdXB3YXJkc1xyXG4gICAgZm9yIChsZXQgeSA9IHNlYW1zLmhlaWdodCAtIDI7IHkgPj0gMDsgeS0tKSB7XHJcbiAgICAgICAgbGV0IGxvd2VzdFBhcmVudCA9IDk5OTk5OSwgbG93ZXN0UGFyZW50SW5kZXggPSAwO1xyXG4gICAgICAgIGlmIChsb3dlc3RJbmRleCAtIDEgPj0gMCkge1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnQgPSBzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCAtIDEsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4IC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXgsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxvd2VzdEluZGV4ICsgMSA8IHNlYW1zLndpZHRoICYmIHNlYW1zLmdldFZhbHVlKGxvd2VzdEluZGV4ICsgMSwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXggKyAxLCB5KTtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50SW5kZXggPSBsb3dlc3RJbmRleCArIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwb3NpdGlvbnNbeV0gPSBsb3dlc3RQYXJlbnRJbmRleDtcclxuICAgICAgICBsb3dlc3RJbmRleCA9IGxvd2VzdFBhcmVudEluZGV4O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwb3NpdGlvbnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBpbWFnZSwgb25lIHBpeGVsIHNtYWxsZXIsIHRoYXQgY29udGFpbnMgZXZlcnl0aGluZ1xyXG4gKiBmcm9tIHRoZSBvcmlnaW5hbCBpbWFnZSwgZXhjZXB0IHRoZSBwaXhlbCBvbiBlYWNoIGxpbmUgZm91bmQgZnJvbSBzZWFtIGNhcnZpbmcgdG8gcmVtb3ZlXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEBwYXJhbSBzZWFtUG9zIHtOdW1iZXJbXX0geCB2YWx1ZSBmb3IgcGl4ZWwgdG8gcmVtb3ZlIG9uIGVhY2ggcm93XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVNlYW0oaW1hZ2UsIHNlYW1Qb3MpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGggLSAxLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG5ld0ltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgY29uc3QgeFRvUmVtb3ZlID0gc2VhbVBvc1t5XTtcclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG5ld0ltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgaWYgKHggPCB4VG9SZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgIG5ld0ltYWdlLnNldFJHQih4LCB5LCBpbWFnZS5nZXRSR0IoeCwgeSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHgsIHksIGltYWdlLmdldFJHQih4ICsgMSwgeSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1hcmtzIHRoZSBmb3VuZCBzZWFtIGFzIGEgcmVkIHBhdGggb24gdGhlIGltYWdlXHJcbiAqIE5vdCBwYXJ0IG9mIHRoZSBhbGdvcml0aG0sIGp1c3QgdXNlZCB0byBzaG93IGluIHRoZSBVSSAvIGRlYnVnZ2luZ1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1NlYW0oaW1hZ2UsIHNlYW1Qb3MpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuY2xvbmUoaW1hZ2UpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICBuZXdJbWFnZS5zZXRSR0Ioc2VhbVBvc1t5XSwgeSwgWzI1NSwgMCwgMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNob3dpbmcgdGhlIGVuZXJneSBhcyBncmV5c2NhbGUgaW1hZ2UgZm9yIGRlYnVnZ2luZ1xyXG4gKiBOb3QgcGFydCBvZiB0aGUgYWxnb3JpdGhtLCBqdXN0IHRvIHNob3cgaW4gdGhlIFVJIC8gZGVidWdnaW5nXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93RW5lcmd5SW1hZ2UoZW5lcmd5KSB7XHJcbiAgICBjb25zdCBpbWFnZSA9IEltYWdlLmVtcHR5KGVuZXJneS53aWR0aCwgZW5lcmd5LmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjID0gTWF0aC5jZWlsKChlbmVyZ3kuZ2V0VmFsdWUoeCwgeSkgLyAzMDApICogMjU1KTtcclxuXHJcbiAgICAgICAgICAgIGltYWdlLnNldFJHQih4LCB5LCBbYywgYywgY10pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaW1hZ2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW1hZ2VFbmVyZ3ksXHJcbiAgICBzaG93RW5lcmd5SW1hZ2UsXHJcbiAgICBjYWxjdWxhdGVTZWFtcyxcclxuICAgIGZpbmRNaW5TZWFtLFxyXG4gICAgc2hvd1NlYW0sXHJcbiAgICByZW1vdmVTZWFtXHJcbn07IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5jb25zdCBib3hibHVyID0gcmVxdWlyZSgnLi9ib3hibHVyJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2hhcnBlbihpbWFnZSkge1xyXG5cclxuICAgIGNvbnN0IGJsdXJyZWRJbWFnZSA9IGJveGJsdXIoaW1hZ2UsIDMpO1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KSArIDMqKGltYWdlLmdldFIoeCx5KSAtIGJsdXJyZWRJbWFnZS5nZXRSKHgsIHkpKTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSkgKyAzKihpbWFnZS5nZXRHKHgseSkgLSBibHVycmVkSW1hZ2UuZ2V0Ryh4LCB5KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpICsgMyooaW1hZ2UuZ2V0Qih4LHkpIC0gYmx1cnJlZEltYWdlLmdldEIoeCwgeSkpO1xyXG5cclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHgsIHksIFtyLCBnLCBiXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaGFycGVuO1xyXG4iLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gaW1hZ2Ugd2l0aCBSR0IgdmFsdWVzLCBhbmQgdHVybnMgdGhlIHBpeGVscyBlaXRoZXIgd2hpdGUgKDI1NSwyNTUsMjU1KSBvciBibGFjayAoMCwwLDApXHJcbiAqIGRlcGVuZGluZyBvbiBpZiB0aGUgaW50ZW5zaXR5IGlzIGFib3ZlIG9yIGJlbG93IHRoZSB0aHJlc2hvbGRcclxuICpcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHBhcmFtIHRocmVzaG9sZCBOdW1iZXJcclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gdGhyZXNob2xkKGltYWdlLCB0aHJlc2hvbGQpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgciA9IGltYWdlLmdldFIoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGcgPSBpbWFnZS5nZXRHKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBiID0gaW1hZ2UuZ2V0Qih4LCB5KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjID0gMDtcclxuICAgICAgICAgICAgaWYgKChyICsgZyArIGIpIC8gMyA+IHRocmVzaG9sZCkge1xyXG4gICAgICAgICAgICAgICAgYyA9IDI1NTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdGhyZXNob2xkOyIsImNvbnN0IEltYWdlID0gcmVxdWlyZSgnLi4vSW1hZ2UnKTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIHNvbWUgbW9yZSByZWQgYW5kIHJlbW92ZXMgc29tZSBibHVlIGZyb20gdGhlIGltYWdlJ3MgcGl4ZWxzXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIHdhcm1maWx0ZXIoaW1hZ2UpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgciA9IGltYWdlLmdldFIoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGcgPSBpbWFnZS5nZXRHKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBiID0gaW1hZ2UuZ2V0Qih4LCB5KTtcclxuXHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldFIoeCwgeSwgciArIDI1KTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Ryh4LCB5LCBnKTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBiIC0gMjUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB3YXJtZmlsdGVyO1xyXG4iLCJjb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuL0VkaXRvcicpO1xyXG5jb25zdCBncmV5c2NhbGUgPSByZXF1aXJlKCcuL2VmZmVjdHMvZ3JleXNjYWxlJyk7XHJcbmNvbnN0IGNvbG9yZmlsdGVyID0gcmVxdWlyZSgnLi9lZmZlY3RzL3dhcm1maWx0ZXInKTtcclxuY29uc3QgdGhyZXNob2xkID0gcmVxdWlyZSgnLi9lZmZlY3RzL3RocmVzaG9sZCcpO1xyXG5jb25zdCBib3hibHVyID0gcmVxdWlyZSgnLi9lZmZlY3RzL2JveGJsdXInKTtcclxuY29uc3QgaW52ZXJ0ID0gcmVxdWlyZSgnLi9lZmZlY3RzL2ludmVydCcpO1xyXG5jb25zdCBoaXN0b2dyYW1lcXVhbGl6YXRpb24gPSByZXF1aXJlKCcuL2VmZmVjdHMvaGlzdG9ncmFtZXF1YWxpemF0aW9uJyk7XHJcbmNvbnN0IG1lZGlhbmZpbHRlciA9IHJlcXVpcmUoJy4vZWZmZWN0cy9tZWRpYW5maWx0ZXInKTtcclxuY29uc3Qgc2hhcnBlbiA9IHJlcXVpcmUoJy4vZWZmZWN0cy9zaGFycGVuJyk7XHJcbmNvbnN0IHNlYW0gPSByZXF1aXJlKCcuL2VmZmVjdHMvc2VhbWNhcnZpbmcnKTtcclxuXHJcblxyXG5jb25zdCBlZGl0b3IgPSBuZXcgRWRpdG9yKCk7XHJcbmVkaXRvci5sb2FkSW1hZ2UoJ3Rvd2VyLmpwZycpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbWFnZXNcIikuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRJbWFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjaW1hZ2VzXCIpLnZhbHVlO1xyXG4gICAgZWRpdG9yLmxvYWRJbWFnZShzZWxlY3RlZEltYWdlKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3RlZEltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbWFnZXNcIikudmFsdWU7XHJcbiAgICBlZGl0b3IubG9hZEltYWdlKHNlbGVjdGVkSW1hZ2UpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdW5kb1wiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci51bmRvRWZmZWN0KCk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aHJlc2hvbGRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QodGhyZXNob2xkLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RocmVzaG9sZHZhbHVlXCIpLnZhbHVlKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2dyZXlzY2FsZVwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdChncmV5c2NhbGUpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2FybWZpbHRlclwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdChjb2xvcmZpbHRlcik7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNib3hibHVyXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KGJveGJsdXIsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjYmx1cnJhZGl1c1wiKS52YWx1ZSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZWRpYW5maWx0ZXJcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QobWVkaWFuZmlsdGVyLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3JhZGl1c1wiKS52YWx1ZSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbnZlcnRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoaW52ZXJ0KTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NoYXJwZW5cIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3Qoc2hhcnBlbik7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNoaXN0b2dyYW1lcXVhbGl6YXRpb25cIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoaGlzdG9ncmFtZXF1YWxpemF0aW9uKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2VuZXJneVwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdCgoaW1hZ2UpID0+IHtcclxuICAgICAgICByZXR1cm4gc2VhbS5zaG93RW5lcmd5SW1hZ2Uoc2VhbS5pbWFnZUVuZXJneShpbWFnZSkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ZpbmRTZWFtXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KChpbWFnZSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVuZXJneSA9IHNlYW0uaW1hZ2VFbmVyZ3koaW1hZ2UpO1xyXG4gICAgICAgIGNvbnN0IHNlYW1zID0gc2VhbS5jYWxjdWxhdGVTZWFtcyhlbmVyZ3kpO1xyXG4gICAgICAgIGNvbnN0IG1pblNlYW0gPSBzZWFtLmZpbmRNaW5TZWFtKHNlYW1zKTtcclxuICAgICAgICBjb25zdCBzaG93U2VhbSA9IHNlYW0uc2hvd1NlYW0oaW1hZ2UsIG1pblNlYW0pO1xyXG4gICAgICAgIHJldHVybiBzaG93U2VhbTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG5sZXQgaXNSdW5uaW5nID0gZmFsc2U7XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcnVuU2VhbWNhcnZlclwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGlzUnVubmluZyA9IHRydWU7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3J1blNlYW1jYXJ2ZXJcIikuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdG9wU2VhbWNhcnZlclwiKS5kaXNhYmxlZCA9IGZhbHNlO1xyXG5cclxuICAgIGxldCBpbWFnZSA9IGVkaXRvci5jdXJyZW50O1xyXG5cclxuICAgIGZ1bmN0aW9uIHNlYW1DYXJ2ZSgpIHtcclxuXHJcbiAgICAgICAgY29uc3QgZW5lcmd5ID0gc2VhbS5pbWFnZUVuZXJneShpbWFnZSk7XHJcbiAgICAgICAgY29uc3Qgc2VhbXMgPSBzZWFtLmNhbGN1bGF0ZVNlYW1zKGVuZXJneSk7XHJcbiAgICAgICAgY29uc3QgbWluU2VhbSA9IHNlYW0uZmluZE1pblNlYW0oc2VhbXMpO1xyXG4gICAgICAgIGNvbnN0IHNob3dTZWFtID0gc2VhbS5zaG93U2VhbShpbWFnZSwgbWluU2VhbSk7XHJcblxyXG4gICAgICAgIGVkaXRvci5yZW5kZXIoc2hvd1NlYW0sIFwiZWRpdGVkXCIpO1xyXG5cclxuICAgICAgICBpbWFnZSA9IHNlYW0ucmVtb3ZlU2VhbShpbWFnZSwgbWluU2VhbSk7XHJcblxyXG4gICAgICAgIGlmIChpc1J1bm5pbmcpIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChzZWFtQ2FydmUsIDEwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0Q3VycmVudChpbWFnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNlYW1DYXJ2ZSgpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc3RvcFNlYW1jYXJ2ZXJcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBpc1J1bm5pbmcgPSBmYWxzZTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcnVuU2VhbWNhcnZlclwiKS5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdG9wU2VhbWNhcnZlclwiKS5kaXNhYmxlZCA9IHRydWU7XHJcbn0pO1xyXG5cclxuXHJcbiJdfQ==