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
         * @returns {Image}
         */
        function colorfilter(image) {
            const newImage = Image.empty(image.width, image.height);

            for (let x = 0; x < image.width; x++) {
                for (let y = 0; y < image.height; y++) {

                    const r = image.getR(x, y);
                    const g = image.getG(x, y);
                    const b = image.getB(x, y);

                    newImage.setR(x, y, r - 50);
                    newImage.setG(x, y, g);
                    newImage.setB(x, y, b);
                }
            }
            return newImage;
        }

        module.exports = colorfilter;
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
    },{"../Image":2}],5:[function(require,module,exports){
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
    },{"../Image":2}],6:[function(require,module,exports){
        const Image = require('../Image');

        /**
         * Takes an image with RGB values, and turns all pixels either white (255,255,255) or black (0,0,0)
         * depending on if the intensity is above the threshold
         *
         * @param image {Image}
         * @param threshold Number
         * @returns {Image}
         */
        function threshold(image, threshold) {
            console.log(threshold);
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
    },{"../Image":2}],7:[function(require,module,exports){
        const Editor = require('./Editor');
        const greyscale = require('./effects/greyscale');
        const colorfilter = require('./effects/colorfilter');
        const threshold = require('./effects/threshold');
        const seam = require('./effects/seamcarving');


        const editor = new Editor();
        editor.loadImage('tower.jpg');

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

        document.querySelector("#colorfilter").addEventListener('click', () => {
            editor.applyEffect(colorfilter);
        });

        document.querySelector("#energy").addEventListener('click', () => {
            editor.applyEffect((image) => {
                return seam.energyImageToGreyscale(seam.imageEnergy(image));
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



    },{"./Editor":1,"./effects/colorfilter":3,"./effects/greyscale":4,"./effects/seamcarving":5,"./effects/threshold":6}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRWRpdG9yLmpzIiwic3JjL0ltYWdlLmpzIiwic3JjL2VmZmVjdHMvY29sb3JmaWx0ZXIuanMiLCJzcmMvZWZmZWN0cy9ncmV5c2NhbGUuanMiLCJzcmMvZWZmZWN0cy9zZWFtY2FydmluZy5qcyIsInNyYy9lZmZlY3RzL3RocmVzaG9sZC5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IEltYWdlRGF0YSA9IHJlcXVpcmUoJy4vSW1hZ2UnKTtcclxuXHJcbmNvbnN0IE1BWF9XSURUSCA9IDEyMDA7XHJcblxyXG5jbGFzcyBFZGl0b3Ige1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkSW1hZ2UoaW1hZ2VOYW1lKSB7XHJcbiAgICAgICAgY29uc3QgbG9hZGVyID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgbG9hZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaW1hZ2VEYXRhID0gdGhpcy5nZXRJbWFnZURhdGEobG9hZGVyKTtcclxuICAgICAgICAgICAgdGhpcy5zZXROZXdJbWFnZShpbWFnZURhdGEpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgbG9hZGVyLnNyYyA9IGltYWdlTmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRJbWFnZURhdGEobG9hZGVyKSB7XHJcbiAgICAgICAgY29uc3QgbG9hZGVyQ2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsb2FkZXJDYW52YXNcIik7XHJcbiAgICAgICAgY29uc3QgbG9hZGVyQ29udGV4dCA9IGxvYWRlckNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgICAvLyBEcmF3IHNjYWxlZCBpbWFnZSB0byBpbnZpc2libGUgY2FudmFzIGFuZCByZWFkIGJhY2sgdGhlIHBpeGVsIGRhdGFcclxuICAgICAgICBjb25zdCBbd2lkdGgsIGhlaWdodF0gPSBzY2FsZVNpemUobG9hZGVyLndpZHRoLCBsb2FkZXIuaGVpZ2h0KTtcclxuICAgICAgICBsb2FkZXJDYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICBsb2FkZXJDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgICBsb2FkZXJDb250ZXh0LmRyYXdJbWFnZShsb2FkZXIsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBsb2FkZXJDb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBJbWFnZURhdGEuSW1hZ2UoZGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TmV3SW1hZ2UoaW1hZ2UpIHtcclxuICAgICAgICB0aGlzLm9yaWdpbmFsID0gaW1hZ2U7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gSW1hZ2VEYXRhLmNsb25lKGltYWdlKTtcclxuICAgICAgICB0aGlzLm9sZHMgPSBbdGhpcy5jdXJyZW50XTtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLm9yaWdpbmFsLCBcIm9yaWdpbmFsXCIpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY3VycmVudCwgXCJlZGl0ZWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGltYWdlLCBjYW52YXNOYW1lKSB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNcIiArIGNhbnZhc05hbWUpO1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2UuaW1hZ2VEYXRhLCAwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBhcHBseUVmZmVjdChlZmZlY3QsIC4uLmFyZ3MpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBlZmZlY3QoSW1hZ2VEYXRhLmNsb25lKHRoaXMuY3VycmVudCksIC4uLmFyZ3MpO1xyXG4gICAgICAgIHRoaXMub2xkcy5wdXNoKHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDdXJyZW50KGltYWdlKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gaW1hZ2U7XHJcbiAgICAgICAgdGhpcy5vbGRzLnB1c2godGhpcy5jdXJyZW50KTtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmN1cnJlbnQsIFwiZWRpdGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHVuZG9FZmZlY3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2xkcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2xkcy5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdGhpcy5vbGRzW3RoaXMub2xkcy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjYWxlU2l6ZSh3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBpZiAod2lkdGggPiBNQVhfV0lEVEgpIHtcclxuICAgICAgICBoZWlnaHQgPSBoZWlnaHQgLyAod2lkdGggLyBNQVhfV0lEVEgpO1xyXG4gICAgICAgIHdpZHRoID0gTUFYX1dJRFRIO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFt3aWR0aCwgaGVpZ2h0XTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7IiwiY2xhc3MgSW1hZ2Uge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGltYWdlRGF0YSkge1xyXG4gICAgICAgIHRoaXMuaW1hZ2VEYXRhID0gaW1hZ2VEYXRhO1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBpbWFnZURhdGEud2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBpbWFnZURhdGEuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGF0YSBpcyBhIHNpbmdsZS1kaW1lbnNpb25hbCBhcnJheSwgd2l0aCA0IHZhbHVlcyAocmdiYSkgcGVyIHB4XHJcbiAgICAgKi9cclxuICAgIGdldEluZGV4KHgsIHkpIHtcclxuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLndpZHRoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInggXCIgKyB4ICsgXCIgaXMgbm90IGJldHdlZW4gMCBhbmQgXCIgKyB0aGlzLndpZHRoKTtcclxuICAgICAgICB9ZWxzZSBpZiAoeSA8IDAgfHwgeSA+PSB0aGlzLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ5IFwiICsgeSArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geSAqICh0aGlzLndpZHRoICogNCkgKyAoeCAqIDQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFIoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KV07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Ryh4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMV07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qih4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMl07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UkdCKHgsIHkpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoeCwgeSk7XHJcbiAgICAgICAgcmV0dXJuIFt0aGlzLmRhdGFbaW5kZXhdLCB0aGlzLmRhdGFbaW5kZXggKyAxXSwgdGhpcy5kYXRhW2luZGV4ICsgMl1dO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFIoeCwgeSwgclZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSldID0gclZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEcoeCwgeSwgZ1ZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSkgKyAxXSA9IGdWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRCKHgsIHksIGJWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMl0gPSBiVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0UkdCKHgsIHksIFtyLCBnLCBiXSkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nZXRJbmRleCh4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdID0gcjtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXggKyAxXSA9IGc7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4ICsgMl0gPSBiO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSB3aWR0aCBudW1iZXJcclxuICogQHBhcmFtIGhlaWdodCBudW1iZXJcclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gZW1wdHkod2lkdGgsIGhlaWdodCkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdpZHRoICogaGVpZ2h0ICogNCk7XHJcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcik7XHJcbiAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGRhdGEsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIC8vIFNldCBhbHBoYSB0byAyNTVcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgKHdpZHRoICogaGVpZ2h0ICogNCk7IGkgKz0gNCkge1xyXG4gICAgICAgIGRhdGFbaV0gPSAyNTU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbWFnZShpbWFnZURhdGEpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gY2xvbmUoaW1hZ2UpIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihpbWFnZS53aWR0aCAqIGltYWdlLmhlaWdodCAqIDQpO1xyXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXIpO1xyXG4gICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShkYXRhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBkYXRhW2ldID0gaW1hZ2UuZGF0YVtpXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IEltYWdlKGltYWdlRGF0YSk7XHJcblxyXG59XHJcblxyXG5cclxuY2xhc3MgRW5lcmd5SW1hZ2Uge1xyXG4gICAgY29uc3RydWN0b3IoZGF0YTMyYml0LCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgICAgdGhpcy5kYXRhMzJiaXQgPSBkYXRhMzJiaXQ7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFZhbHVlKHgsIHksIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhMzJiaXRbdGhpcy5nZXRJbmRleCh4LCB5KV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWYWx1ZSh4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTMyYml0W3RoaXMuZ2V0SW5kZXgoeCwgeSldO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEluZGV4KHgsIHkpIHtcclxuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLndpZHRoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInggXCIgKyB4ICsgXCIgaXMgbm90IGJldHdlZW4gMCBhbmQgXCIgKyB0aGlzLndpZHRoKTtcclxuICAgICAgICB9ZWxzZSBpZiAoeSA8IDAgfHwgeSA+PSB0aGlzLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ5IFwiICsgeSArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geSAqIHRoaXMud2lkdGggKyB4O1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVFbmVyZ3lJbWFnZSh3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIod2lkdGggKiBoZWlnaHQgKiA0KTtcclxuICAgIGNvbnN0IGRhdGEzMkJpdCA9IG5ldyBVaW50MzJBcnJheShidWZmZXIpO1xyXG5cclxuICAgIHJldHVybiBuZXcgRW5lcmd5SW1hZ2UoZGF0YTMyQml0LCB3aWR0aCwgaGVpZ2h0KTtcclxufVxyXG4vKlxyXG5mdW5jdGlvbiBjbG9uZUVuZXJneUltYWdlKGVuZXJneUltYWdlKSB7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGVuZXJneUltYWdlLndpZHRoICogZW5lcmd5SW1hZ2UuaGVpZ2h0ICogNCk7XHJcbiAgICBjb25zdCBkYXRhMzJCaXQgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEzMkJpdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGRhdGEzMkJpdFtpXSA9IGVuZXJneUltYWdlLmRhdGEzMmJpdFtpXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IEVuZXJneUltYWdlKGRhdGEzMkJpdCwgZW5lcmd5SW1hZ2Uud2lkdGgsIGVuZXJneUltYWdlLmhlaWdodCk7XHJcbn0qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBJbWFnZSxcclxuICAgIGVtcHR5LFxyXG4gICAgY2xvbmUsXHJcbiAgICBFbmVyZ3lJbWFnZSxcclxuICAgIGNyZWF0ZUVuZXJneUltYWdlLFxyXG4gICAgLy8gY2xvbmVFbmVyZ3lJbWFnZVxyXG59OyIsImNvbnN0IEltYWdlID0gcmVxdWlyZSgnLi4vSW1hZ2UnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gaW1hZ2Uge0ltYWdlfVxyXG4gKiBAcmV0dXJucyB7SW1hZ2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBjb2xvcmZpbHRlcihpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Uih4LCB5LCByIC0gNTApO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRHKHgsIHksIGcpO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRCKHgsIHksIGIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb2xvcmZpbHRlcjsiLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gaW1hZ2Ugd2l0aCBSR0IgdmFsdWVzLCBhbmQgY29udmVydHMgaXQgdG8gZ3JleXNjYWxlXHJcbiAqIGJ5IGNhbGN1bGF0aW5nIGludGVuc2l0eSBhdCBlYWNoIHBpeGVsXHJcbiAqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGdyZXlzY2FsZShpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gMC4zNCAqIHIgKyAwLjUgKiBnICsgMC4xNiAqIGI7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIGludGVuc2l0eSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgaW50ZW5zaXR5KTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBpbnRlbnNpdHkpO1xyXG5cclxuICAgICAgICAgICAgLyogZXZ0XHJcbiAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGltYWdlLmdldFJHQih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDAuMzQgKiByICsgMC41ICogZyArIDAuMTYgKiBiO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTsqL1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBncmV5c2NhbGU7IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIFJHQiBpbWFnZSwgcmV0dXJucyBhIG5ldyBpbWFnZSB3aXRoIGVuZXJneWxldmVscyBwZXIgcGl4ZWxcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0VuZXJneUltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gaW1hZ2VFbmVyZ3koaW1hZ2UpIHtcclxuICAgIGNvbnN0IGVuZXJneUltYWdlID0gSW1hZ2UuY3JlYXRlRW5lcmd5SW1hZ2UoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgICAgICBsZXQgZW5lcmd5O1xyXG4gICAgICAgICAgICBpZiAoaXNCb3JkZXJQaXhlbCh4LCB5LCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KSkge1xyXG4gICAgICAgICAgICAgICAgZW5lcmd5ID0gMzAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW5lcmd5ID0gTWF0aC5zcXJ0KFxyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldFIoeCArIDEsIHkpIC0gaW1hZ2UuZ2V0Uih4IC0gMSwgeSksIDIpICtcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRHKHggKyAxLCB5KSAtIGltYWdlLmdldEcoeCAtIDEsIHkpLCAyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Qih4ICsgMSwgeSkgLSBpbWFnZS5nZXRCKHggLSAxLCB5KSwgMikgK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRSKHgsIHkgKyAxKSAtIGltYWdlLmdldFIoeCwgeSAtIDEpLCAyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Ryh4LCB5ICsgMSkgLSBpbWFnZS5nZXRHKHgsIHkgLSAxKSwgMikgK1xyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldEIoeCwgeSArIDEpIC0gaW1hZ2UuZ2V0Qih4LCB5IC0gMSksIDIpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZW5lcmd5SW1hZ2Uuc2V0VmFsdWUoeCwgeSwgZW5lcmd5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZW5lcmd5SW1hZ2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzQm9yZGVyUGl4ZWwoeCwgeSwgaW1hZ2VXaWR0aCwgaW1hZ2VIZWlnaHQpIHtcclxuICAgIHJldHVybiB4ID09PSAwIHx8IHggPT09IGltYWdlV2lkdGggLSAxIHx8IHkgPT09IDAgfHwgeSA9PT0gaW1hZ2VIZWlnaHQgLSAxO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIGVuZXJneUltYWdlIHdpdGggZW5lcmd5bGV2ZWxzIHBlciBwaXhlbCwgYW5kIHVzZXMgZHluYW1pYyBwcm9ncmFtbWluZ1xyXG4gKiB0byBmaW5kIHBhdGhzIGZyb20gdG9wIHRvIGJvdHRvbSB3aXRoIHRoZSBsZWFzdCBlbmVyZ3lcclxuICogQHBhcmFtIGVuZXJneUltYWdlIHtFbmVyZ3lJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZVNlYW1zKGVuZXJneUltYWdlKSB7XHJcbiAgICBjb25zdCBzZWFtID0gSW1hZ2UuY3JlYXRlRW5lcmd5SW1hZ2UoZW5lcmd5SW1hZ2Uud2lkdGgsIGVuZXJneUltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBzZWFtLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzZWFtLndpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgY29uc3QgZW5lcmd5QXRQeCA9IGVuZXJneUltYWdlLmdldFZhbHVlKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHNlYW0uc2V0VmFsdWUoeCwgeSwgZW5lcmd5QXRQeCk7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbWluUGFyZW50ID0gTWF0aC5taW4oeCAtIDEgPj0gMCA/IHNlYW0uZ2V0VmFsdWUoeCAtIDEsIHkgLSAxKSA6IDk5OTk5LCBzZWFtLmdldFZhbHVlKHgsIHkgLSAxKSwgeCArIDEgPCBzZWFtLndpZHRoID8gc2VhbS5nZXRWYWx1ZSh4ICsgMSwgeSAtIDEpIDogOTk5OTkpO1xyXG4gICAgICAgICAgICBzZWFtLnNldFZhbHVlKHgsIHksIGVuZXJneUF0UHggKyBtaW5QYXJlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzZWFtO1xyXG59XHJcblxyXG4vKipcclxuICogQWZ0ZXIgYWxsIHRoZSBwYXRocyBhcmUgY2FsY3VsYXRlZCwgZmluZCB0aGUgbG93ZXN0IG9uZSBvbiB0aGUgbGFzdCByb3dcclxuICogYW5kIG1vdmUgYmFjayB1cCwga2VlcGluZyB0cmFjayBvZiB0aGUgcGF0aFxyXG4gKi9cclxuZnVuY3Rpb24gZmluZE1pblNlYW0oc2VhbXMpIHtcclxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xyXG5cclxuICAgIC8vIGZpbmQgbG93ZXN0IHBvc1xyXG4gICAgbGV0IGxvd2VzdCA9IDk5OTk5LCBsb3dlc3RJbmRleCA9IDA7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHNlYW1zLndpZHRoOyB4KyspIHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHNlYW1zLmdldFZhbHVlKHgsIHNlYW1zLmhlaWdodCAtIDEpO1xyXG4gICAgICAgIGlmICh2YWx1ZSA8IGxvd2VzdCkge1xyXG4gICAgICAgICAgICBsb3dlc3QgPSB2YWx1ZTtcclxuICAgICAgICAgICAgbG93ZXN0SW5kZXggPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHBvc2l0aW9uc1tzZWFtcy5oZWlnaHQgLSAxXSA9IGxvd2VzdEluZGV4O1xyXG5cclxuICAgIC8vIGl0ZXJhdGUgdXB3YXJkc1xyXG4gICAgZm9yIChsZXQgeSA9IHNlYW1zLmhlaWdodCAtIDI7IHkgPj0gMDsgeS0tKSB7XHJcbiAgICAgICAgbGV0IGxvd2VzdFBhcmVudCA9IDk5OTk5OSwgbG93ZXN0UGFyZW50SW5kZXggPSAwO1xyXG4gICAgICAgIGlmIChsb3dlc3RJbmRleCAtIDEgPj0gMCkge1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnQgPSBzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCAtIDEsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4IC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXgsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxvd2VzdEluZGV4ICsgMSA8IHNlYW1zLndpZHRoICYmIHNlYW1zLmdldFZhbHVlKGxvd2VzdEluZGV4ICsgMSwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXggKyAxLCB5KTtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50SW5kZXggPSBsb3dlc3RJbmRleCArIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwb3NpdGlvbnNbeV0gPSBsb3dlc3RQYXJlbnRJbmRleDtcclxuICAgICAgICBsb3dlc3RJbmRleCA9IGxvd2VzdFBhcmVudEluZGV4O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwb3NpdGlvbnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBpbWFnZSwgb25lIHBpeGVsIHNtYWxsZXIsIHRoYXQgY29udGFpbnMgZXZlcnl0aGluZ1xyXG4gKiBmcm9tIHRoZSBvcmlnaW5hbCBpbWFnZSwgZXhjZXB0IHRoZSBwaXhlbCBvbiBlYWNoIGxpbmUgZm91bmQgZnJvbSBzZWFtIGNhcnZpbmcgdG8gcmVtb3ZlXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEBwYXJhbSBzZWFtUG9zIHtOdW1iZXJbXX0geCB2YWx1ZSBmb3IgcGl4ZWwgdG8gcmVtb3ZlIG9uIGVhY2ggcm93XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVNlYW0oaW1hZ2UsIHNlYW1Qb3MpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGggLSAxLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG5ld0ltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgY29uc3QgeFRvUmVtb3ZlID0gc2VhbVBvc1t5XTtcclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG5ld0ltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgaWYgKHggPCB4VG9SZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgIG5ld0ltYWdlLnNldFJHQih4LCB5LCBpbWFnZS5nZXRSR0IoeCwgeSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHgsIHksIGltYWdlLmdldFJHQih4KzEsIHkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXJrcyB0aGUgZm91bmQgc2VhbSBhcyBhIHJlZCBwYXRoIG9uIHRoZSBpbWFnZVxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1NlYW0oaW1hZ2UsIHNlYW1Qb3MpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuY2xvbmUoaW1hZ2UpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICBuZXdJbWFnZS5zZXRSR0Ioc2VhbVBvc1t5XSwgeSwgWzI1NSwgMCwgMF0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFV0aWwgZm9yIHNob3dpbmcgdGhlIGVuZXJneSBhcyBncmV5c2NhbGUgaW1hZ2UgZm9yIGRlYnVnZ2luZ1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd0VuZXJneUltYWdlKGVuZXJneSkge1xyXG4gICAgY29uc3QgaW1hZ2UgPSBJbWFnZS5lbXB0eShlbmVyZ3kud2lkdGgsIGVuZXJneS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgY29uc3QgYyA9IE1hdGguY2VpbCgoZW5lcmd5LmdldFZhbHVlKHgsIHkpIC8gMzAwKSAqIDI1NSk7XHJcblxyXG4gICAgICAgICAgICBpbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGltYWdlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGltYWdlRW5lcmd5LFxyXG4gICAgc2hvd0VuZXJneUltYWdlLFxyXG4gICAgY2FsY3VsYXRlU2VhbXMsXHJcbiAgICBmaW5kTWluU2VhbSxcclxuICAgIHNob3dTZWFtLFxyXG4gICAgcmVtb3ZlU2VhbVxyXG59OyIsImNvbnN0IEltYWdlID0gcmVxdWlyZSgnLi4vSW1hZ2UnKTtcclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhbiBpbWFnZSB3aXRoIFJHQiB2YWx1ZXMsIGFuZCB0dXJucyBhbGwgcGl4ZWxzIGVpdGhlciB3aGl0ZSAoMjU1LDI1NSwyNTUpIG9yIGJsYWNrICgwLDAsMClcclxuICogZGVwZW5kaW5nIG9uIGlmIHRoZSBpbnRlbnNpdHkgaXMgYWJvdmUgdGhlIHRocmVzaG9sZFxyXG4gKlxyXG4gKiBAcGFyYW0gaW1hZ2Uge0ltYWdlfVxyXG4gKiBAcGFyYW0gdGhyZXNob2xkIE51bWJlclxyXG4gKiBAcmV0dXJucyB7SW1hZ2V9XHJcbiAqL1xyXG5mdW5jdGlvbiB0aHJlc2hvbGQoaW1hZ2UsIHRocmVzaG9sZCkge1xyXG4gICAgY29uc29sZS5sb2codGhyZXNob2xkKTtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgciA9IGltYWdlLmdldFIoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGcgPSBpbWFnZS5nZXRHKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBiID0gaW1hZ2UuZ2V0Qih4LCB5KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjID0gMDtcclxuICAgICAgICAgICAgaWYgKChyICsgZyArIGIpIC8gMyA+IHRocmVzaG9sZCkge1xyXG4gICAgICAgICAgICAgICAgYyA9IDI1NTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdGhyZXNob2xkOyIsImNvbnN0IEVkaXRvciA9IHJlcXVpcmUoJy4vRWRpdG9yJyk7XHJcbmNvbnN0IGdyZXlzY2FsZSA9IHJlcXVpcmUoJy4vZWZmZWN0cy9ncmV5c2NhbGUnKTtcclxuY29uc3QgY29sb3JmaWx0ZXIgPSByZXF1aXJlKCcuL2VmZmVjdHMvY29sb3JmaWx0ZXInKTtcclxuY29uc3QgdGhyZXNob2xkID0gcmVxdWlyZSgnLi9lZmZlY3RzL3RocmVzaG9sZCcpO1xyXG5jb25zdCBzZWFtID0gcmVxdWlyZSgnLi9lZmZlY3RzL3NlYW1jYXJ2aW5nJyk7XHJcblxyXG5cclxuY29uc3QgZWRpdG9yID0gbmV3IEVkaXRvcigpO1xyXG5lZGl0b3IubG9hZEltYWdlKCd0b3dlci5qcGcnKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZFwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ltYWdlc1wiKS52YWx1ZTtcclxuICAgIGVkaXRvci5sb2FkSW1hZ2Uoc2VsZWN0ZWRJbWFnZSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN1bmRvXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLnVuZG9FZmZlY3QoKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RocmVzaG9sZFwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdCh0aHJlc2hvbGQsIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdGhyZXNob2xkdmFsdWVcIikudmFsdWUpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZ3JleXNjYWxlXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KGdyZXlzY2FsZSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjb2xvcmZpbHRlclwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdChjb2xvcmZpbHRlcik7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNlbmVyZ3lcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoKGltYWdlKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHNlYW0uZW5lcmd5SW1hZ2VUb0dyZXlzY2FsZShzZWFtLmltYWdlRW5lcmd5KGltYWdlKSk7XHJcbiAgICB9KTtcclxufSk7XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZmluZFNlYW1cIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoKGltYWdlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZW5lcmd5ID0gc2VhbS5pbWFnZUVuZXJneShpbWFnZSk7XHJcbiAgICAgICAgY29uc3Qgc2VhbXMgPSBzZWFtLmNhbGN1bGF0ZVNlYW1zKGVuZXJneSk7XHJcbiAgICAgICAgY29uc3QgbWluU2VhbSA9IHNlYW0uZmluZE1pblNlYW0oc2VhbXMpO1xyXG4gICAgICAgIGNvbnN0IHNob3dTZWFtID0gc2VhbS5zaG93U2VhbShpbWFnZSwgbWluU2VhbSk7XHJcbiAgICAgICAgcmV0dXJuIHNob3dTZWFtO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuXHJcbmxldCBpc1J1bm5pbmcgPSBmYWxzZTtcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNydW5TZWFtY2FydmVyXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgaXNSdW5uaW5nID0gdHJ1ZTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcnVuU2VhbWNhcnZlclwiKS5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0b3BTZWFtY2FydmVyXCIpLmRpc2FibGVkID0gZmFsc2U7XHJcblxyXG4gICAgbGV0IGltYWdlID0gZWRpdG9yLmN1cnJlbnQ7XHJcblxyXG4gICAgZnVuY3Rpb24gc2VhbUNhcnZlKCkge1xyXG5cclxuICAgICAgICBjb25zdCBlbmVyZ3kgPSBzZWFtLmltYWdlRW5lcmd5KGltYWdlKTtcclxuICAgICAgICBjb25zdCBzZWFtcyA9IHNlYW0uY2FsY3VsYXRlU2VhbXMoZW5lcmd5KTtcclxuICAgICAgICBjb25zdCBtaW5TZWFtID0gc2VhbS5maW5kTWluU2VhbShzZWFtcyk7XHJcbiAgICAgICAgY29uc3Qgc2hvd1NlYW0gPSBzZWFtLnNob3dTZWFtKGltYWdlLCBtaW5TZWFtKTtcclxuXHJcbiAgICAgICAgZWRpdG9yLnJlbmRlcihzaG93U2VhbSwgXCJlZGl0ZWRcIik7XHJcblxyXG4gICAgICAgIGltYWdlID0gc2VhbS5yZW1vdmVTZWFtKGltYWdlLCBtaW5TZWFtKTtcclxuXHJcbiAgICAgICAgaWYgKGlzUnVubmluZykge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHNlYW1DYXJ2ZSwgMTApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXRDdXJyZW50KGltYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2VhbUNhcnZlKCk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzdG9wU2VhbWNhcnZlclwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGlzUnVubmluZyA9IGZhbHNlO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNydW5TZWFtY2FydmVyXCIpLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0b3BTZWFtY2FydmVyXCIpLmRpc2FibGVkID0gdHJ1ZTtcclxufSk7XHJcblxyXG5cclxuIl19