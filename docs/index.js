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

        function showSeam(image, seamPos) {
            const newImage = Image.clone(image);

            for (let y = 0; y < image.height; y++) {
                newImage.setRGB(seamPos[y], y, [255, 0, 0]);
            }

            return newImage;
        }

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

        /*
            Util stuff
         */

        function isBorderPixel(x, y, imageWidth, imageHeight) {
            return x === 0 || x === imageWidth - 1 || y === 0 || y === imageHeight - 1;
        }


        function energyImageToGreyscale(energy) {
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
            energyImageToGreyscale,
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
        document.querySelector("#runSeamcarver").addEventListener('click', () => {
            editor.applyEffect((image) => {
                const energy = seam.imageEnergy(image);
                const seams = seam.calculateSeams(energy);
                const minSeam = seam.findMinSeam(seams);
                const newImage = seam.removeSeam(image, minSeam);
                // const showSeam = seam.showSeam(image, minSeam);
                return newImage;
            });
        });


    },{"./Editor":1,"./effects/colorfilter":3,"./effects/greyscale":4,"./effects/seamcarving":5,"./effects/threshold":6}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRWRpdG9yLmpzIiwic3JjL0ltYWdlLmpzIiwic3JjL2VmZmVjdHMvY29sb3JmaWx0ZXIuanMiLCJzcmMvZWZmZWN0cy9ncmV5c2NhbGUuanMiLCJzcmMvZWZmZWN0cy9zZWFtY2FydmluZy5qcyIsInNyYy9lZmZlY3RzL3RocmVzaG9sZC5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgSW1hZ2VEYXRhID0gcmVxdWlyZSgnLi9JbWFnZScpO1xyXG5cclxuY29uc3QgTUFYX1dJRFRIID0gMTIwMDtcclxuXHJcbmNsYXNzIEVkaXRvciB7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWRJbWFnZShpbWFnZU5hbWUpIHtcclxuICAgICAgICBjb25zdCBsb2FkZXIgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICBsb2FkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZURhdGEgPSB0aGlzLmdldEltYWdlRGF0YShsb2FkZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnNldE5ld0ltYWdlKGltYWdlRGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBsb2FkZXIuc3JjID0gaW1hZ2VOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEltYWdlRGF0YShsb2FkZXIpIHtcclxuICAgICAgICBjb25zdCBsb2FkZXJDYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRlckNhbnZhc1wiKTtcclxuICAgICAgICBjb25zdCBsb2FkZXJDb250ZXh0ID0gbG9hZGVyQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIC8vIERyYXcgc2NhbGVkIGltYWdlIHRvIGludmlzaWJsZSBjYW52YXMgYW5kIHJlYWQgYmFjayB0aGUgcGl4ZWwgZGF0YVxyXG4gICAgICAgIGNvbnN0IFt3aWR0aCwgaGVpZ2h0XSA9IHNjYWxlU2l6ZShsb2FkZXIud2lkdGgsIGxvYWRlci5oZWlnaHQpO1xyXG4gICAgICAgIGxvYWRlckNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIGxvYWRlckNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICAgIGxvYWRlckNvbnRleHQuZHJhd0ltYWdlKGxvYWRlciwgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IGxvYWRlckNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IEltYWdlRGF0YS5JbWFnZShkYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXROZXdJbWFnZShpbWFnZSkge1xyXG4gICAgICAgIHRoaXMub3JpZ2luYWwgPSBpbWFnZTtcclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBJbWFnZURhdGEuY2xvbmUoaW1hZ2UpO1xyXG4gICAgICAgIHRoaXMub2xkcyA9IFt0aGlzLmN1cnJlbnRdO1xyXG4gICAgICAgIHRoaXMucmVuZGVyKHRoaXMub3JpZ2luYWwsIFwib3JpZ2luYWxcIik7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoaW1hZ2UsIGNhbnZhc05hbWUpIHtcclxuICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI1wiICsgY2FudmFzTmFtZSk7XHJcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZS5pbWFnZURhdGEsIDAsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIGFwcGx5RWZmZWN0KGVmZmVjdCwgLi4uYXJncykge1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IGVmZmVjdChJbWFnZURhdGEuY2xvbmUodGhpcy5jdXJyZW50KSwgLi4uYXJncyk7XHJcbiAgICAgICAgdGhpcy5vbGRzLnB1c2godGhpcy5jdXJyZW50KTtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmN1cnJlbnQsIFwiZWRpdGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHVuZG9FZmZlY3QoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2xkcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2xkcy5wb3AoKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdGhpcy5vbGRzW3RoaXMub2xkcy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNjYWxlU2l6ZSh3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBpZiAod2lkdGggPiBNQVhfV0lEVEgpIHtcclxuICAgICAgICBoZWlnaHQgPSBoZWlnaHQgLyAod2lkdGggLyBNQVhfV0lEVEgpO1xyXG4gICAgICAgIHdpZHRoID0gTUFYX1dJRFRIO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFt3aWR0aCwgaGVpZ2h0XTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7IiwiY2xhc3MgSW1hZ2Uge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGltYWdlRGF0YSkge1xyXG4gICAgICAgIHRoaXMuaW1hZ2VEYXRhID0gaW1hZ2VEYXRhO1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBpbWFnZURhdGEud2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBpbWFnZURhdGEuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGF0YSBpcyBhIHNpbmdsZS1kaW1lbnNpb25hbCBhcnJheSwgd2l0aCA0IHZhbHVlcyAocmdiYSkgcGVyIHB4XHJcbiAgICAgKi9cclxuICAgIGdldEluZGV4KHgsIHkpIHtcclxuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLndpZHRoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInggXCIgKyB4ICsgXCIgaXMgbm90IGJldHdlZW4gMCBhbmQgXCIgKyB0aGlzLndpZHRoKTtcclxuICAgICAgICB9ZWxzZSBpZiAoeSA8IDAgfHwgeSA+PSB0aGlzLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ5IFwiICsgeSArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geSAqICh0aGlzLndpZHRoICogNCkgKyAoeCAqIDQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFIoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KV07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Ryh4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMV07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qih4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMl07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UkdCKHgsIHkpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoeCwgeSk7XHJcbiAgICAgICAgcmV0dXJuIFt0aGlzLmRhdGFbaW5kZXhdLCB0aGlzLmRhdGFbaW5kZXggKyAxXSwgdGhpcy5kYXRhW2luZGV4ICsgMl1dO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFIoeCwgeSwgclZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSldID0gclZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEcoeCwgeSwgZ1ZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSkgKyAxXSA9IGdWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRCKHgsIHksIGJWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMl0gPSBiVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0UkdCKHgsIHksIFtyLCBnLCBiXSkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5nZXRJbmRleCh4LCB5KTtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXhdID0gcjtcclxuICAgICAgICB0aGlzLmRhdGFbaW5kZXggKyAxXSA9IGc7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4ICsgMl0gPSBiO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSB3aWR0aCBudW1iZXJcclxuICogQHBhcmFtIGhlaWdodCBudW1iZXJcclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gZW1wdHkod2lkdGgsIGhlaWdodCkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHdpZHRoICogaGVpZ2h0ICogNCk7XHJcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlcik7XHJcbiAgICBjb25zdCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGRhdGEsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgIC8vIFNldCBhbHBoYSB0byAyNTVcclxuICAgIGZvciAobGV0IGkgPSAzOyBpIDwgKHdpZHRoICogaGVpZ2h0ICogNCk7IGkgKz0gNCkge1xyXG4gICAgICAgIGRhdGFbaV0gPSAyNTU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbWFnZShpbWFnZURhdGEpO1xyXG59XHJcblxyXG4vKipcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gY2xvbmUoaW1hZ2UpIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihpbWFnZS53aWR0aCAqIGltYWdlLmhlaWdodCAqIDQpO1xyXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXIpO1xyXG4gICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShkYXRhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBkYXRhW2ldID0gaW1hZ2UuZGF0YVtpXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IEltYWdlKGltYWdlRGF0YSk7XHJcblxyXG59XHJcblxyXG5cclxuY2xhc3MgRW5lcmd5SW1hZ2Uge1xyXG4gICAgY29uc3RydWN0b3IoZGF0YTMyYml0LCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgICAgdGhpcy5kYXRhMzJiaXQgPSBkYXRhMzJiaXQ7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFZhbHVlKHgsIHksIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhMzJiaXRbdGhpcy5nZXRJbmRleCh4LCB5KV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRWYWx1ZSh4LCB5KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YTMyYml0W3RoaXMuZ2V0SW5kZXgoeCwgeSldO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEluZGV4KHgsIHkpIHtcclxuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLndpZHRoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInggXCIgKyB4ICsgXCIgaXMgbm90IGJldHdlZW4gMCBhbmQgXCIgKyB0aGlzLndpZHRoKTtcclxuICAgICAgICB9ZWxzZSBpZiAoeSA8IDAgfHwgeSA+PSB0aGlzLmhlaWdodCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ5IFwiICsgeSArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geSAqIHRoaXMud2lkdGggKyB4O1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVFbmVyZ3lJbWFnZSh3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIod2lkdGggKiBoZWlnaHQgKiA0KTtcclxuICAgIGNvbnN0IGRhdGEzMkJpdCA9IG5ldyBVaW50MzJBcnJheShidWZmZXIpO1xyXG5cclxuICAgIHJldHVybiBuZXcgRW5lcmd5SW1hZ2UoZGF0YTMyQml0LCB3aWR0aCwgaGVpZ2h0KTtcclxufVxyXG4vKlxyXG5mdW5jdGlvbiBjbG9uZUVuZXJneUltYWdlKGVuZXJneUltYWdlKSB7XHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGVuZXJneUltYWdlLndpZHRoICogZW5lcmd5SW1hZ2UuaGVpZ2h0ICogNCk7XHJcbiAgICBjb25zdCBkYXRhMzJCaXQgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEzMkJpdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGRhdGEzMkJpdFtpXSA9IGVuZXJneUltYWdlLmRhdGEzMmJpdFtpXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IEVuZXJneUltYWdlKGRhdGEzMkJpdCwgZW5lcmd5SW1hZ2Uud2lkdGgsIGVuZXJneUltYWdlLmhlaWdodCk7XHJcbn0qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBJbWFnZSxcclxuICAgIGVtcHR5LFxyXG4gICAgY2xvbmUsXHJcbiAgICBFbmVyZ3lJbWFnZSxcclxuICAgIGNyZWF0ZUVuZXJneUltYWdlLFxyXG4gICAgLy8gY2xvbmVFbmVyZ3lJbWFnZVxyXG59OyIsImNvbnN0IEltYWdlID0gcmVxdWlyZSgnLi4vSW1hZ2UnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gaW1hZ2Uge0ltYWdlfVxyXG4gKiBAcmV0dXJucyB7SW1hZ2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBjb2xvcmZpbHRlcihpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Uih4LCB5LCByIC0gNTApO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRHKHgsIHksIGcpO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRCKHgsIHksIGIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjb2xvcmZpbHRlcjsiLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gaW1hZ2Ugd2l0aCBSR0IgdmFsdWVzLCBhbmQgY29udmVydHMgaXQgdG8gZ3JleXNjYWxlXHJcbiAqIGJ5IGNhbGN1bGF0aW5nIGludGVuc2l0eSBhdCBlYWNoIHBpeGVsXHJcbiAqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGdyZXlzY2FsZShpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gMC4zNCAqIHIgKyAwLjUgKiBnICsgMC4xNiAqIGI7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIGludGVuc2l0eSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgaW50ZW5zaXR5KTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBpbnRlbnNpdHkpO1xyXG5cclxuICAgICAgICAgICAgLyogZXZ0XHJcbiAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGltYWdlLmdldFJHQih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDAuMzQgKiByICsgMC41ICogZyArIDAuMTYgKiBiO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTsqL1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBncmV5c2NhbGU7IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGFuIFJHQiBpbWFnZSwgcmV0dXJucyBhIG5ldyBpbWFnZSB3aXRoIGVuZXJneWxldmVscyBwZXIgcGl4ZWxcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0VuZXJneUltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gaW1hZ2VFbmVyZ3koaW1hZ2UpIHtcclxuICAgIGNvbnN0IGVuZXJneUltYWdlID0gSW1hZ2UuY3JlYXRlRW5lcmd5SW1hZ2UoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgICAgICBsZXQgZW5lcmd5O1xyXG4gICAgICAgICAgICBpZiAoaXNCb3JkZXJQaXhlbCh4LCB5LCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KSkge1xyXG4gICAgICAgICAgICAgICAgZW5lcmd5ID0gMzAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW5lcmd5ID0gTWF0aC5zcXJ0KFxyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldFIoeCArIDEsIHkpIC0gaW1hZ2UuZ2V0Uih4IC0gMSwgeSksIDIpICtcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRHKHggKyAxLCB5KSAtIGltYWdlLmdldEcoeCAtIDEsIHkpLCAyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Qih4ICsgMSwgeSkgLSBpbWFnZS5nZXRCKHggLSAxLCB5KSwgMikgK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhpbWFnZS5nZXRSKHgsIHkgKyAxKSAtIGltYWdlLmdldFIoeCwgeSAtIDEpLCAyKSArXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coaW1hZ2UuZ2V0Ryh4LCB5ICsgMSkgLSBpbWFnZS5nZXRHKHgsIHkgLSAxKSwgMikgK1xyXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGltYWdlLmdldEIoeCwgeSArIDEpIC0gaW1hZ2UuZ2V0Qih4LCB5IC0gMSksIDIpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZW5lcmd5SW1hZ2Uuc2V0VmFsdWUoeCwgeSwgZW5lcmd5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZW5lcmd5SW1hZ2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUYWtlcyBhbiBlbmVyZ3lJbWFnZSB3aXRoIGVuZXJneWxldmVscyBwZXIgcGl4ZWwsIGFuZCB1c2VzIGR5bmFtaWMgcHJvZ3JhbW1pbmdcclxuICogdG8gZmluZCBwYXRocyBmcm9tIHRvcCB0byBib3R0b20gd2l0aCB0aGUgbGVhc3QgZW5lcmd5XHJcbiAqIEBwYXJhbSBlbmVyZ3lJbWFnZSB7RW5lcmd5SW1hZ2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVTZWFtcyhlbmVyZ3lJbWFnZSkge1xyXG4gICAgY29uc3Qgc2VhbSA9IEltYWdlLmNyZWF0ZUVuZXJneUltYWdlKGVuZXJneUltYWdlLndpZHRoLCBlbmVyZ3lJbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgc2VhbS5oZWlnaHQ7IHkrKykge1xyXG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgc2VhbS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVuZXJneUF0UHggPSBlbmVyZ3lJbWFnZS5nZXRWYWx1ZSh4LCB5KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh5ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWFtLnNldFZhbHVlKHgsIHksIGVuZXJneUF0UHgpO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG1pblBhcmVudCA9IE1hdGgubWluKHggLSAxID49IDAgPyBzZWFtLmdldFZhbHVlKHggLSAxLCB5IC0gMSkgOiA5OTk5OSwgc2VhbS5nZXRWYWx1ZSh4LCB5IC0gMSksIHggKyAxIDwgc2VhbS53aWR0aCA/IHNlYW0uZ2V0VmFsdWUoeCArIDEsIHkgLSAxKSA6IDk5OTk5KTtcclxuICAgICAgICAgICAgc2VhbS5zZXRWYWx1ZSh4LCB5LCBlbmVyZ3lBdFB4ICsgbWluUGFyZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2VhbTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZE1pblNlYW0oc2VhbXMpIHtcclxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdO1xyXG5cclxuICAgIC8vIGZpbmQgbG93ZXN0IHBvc1xyXG4gICAgbGV0IGxvd2VzdCA9IDk5OTk5LCBsb3dlc3RJbmRleCA9IDA7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHNlYW1zLndpZHRoOyB4KyspIHtcclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHNlYW1zLmdldFZhbHVlKHgsIHNlYW1zLmhlaWdodCAtIDEpO1xyXG4gICAgICAgIGlmICh2YWx1ZSA8IGxvd2VzdCkge1xyXG4gICAgICAgICAgICBsb3dlc3QgPSB2YWx1ZTtcclxuICAgICAgICAgICAgbG93ZXN0SW5kZXggPSB4O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHBvc2l0aW9uc1tzZWFtcy5oZWlnaHQgLSAxXSA9IGxvd2VzdEluZGV4O1xyXG5cclxuICAgIC8vIGl0ZXJhdGUgdXB3YXJkc1xyXG4gICAgZm9yIChsZXQgeSA9IHNlYW1zLmhlaWdodCAtIDI7IHkgPj0gMDsgeS0tKSB7XHJcbiAgICAgICAgbGV0IGxvd2VzdFBhcmVudCA9IDk5OTk5OSwgbG93ZXN0UGFyZW50SW5kZXggPSAwO1xyXG4gICAgICAgIGlmIChsb3dlc3RJbmRleCAtIDEgPj0gMCkge1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnQgPSBzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCAtIDEsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4IC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWFtcy5nZXRWYWx1ZShsb3dlc3RJbmRleCwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXgsIHkpO1xyXG4gICAgICAgICAgICBsb3dlc3RQYXJlbnRJbmRleCA9IGxvd2VzdEluZGV4O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxvd2VzdEluZGV4ICsgMSA8IHNlYW1zLndpZHRoICYmIHNlYW1zLmdldFZhbHVlKGxvd2VzdEluZGV4ICsgMSwgeSkgPCBsb3dlc3RQYXJlbnQpIHtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50ID0gc2VhbXMuZ2V0VmFsdWUobG93ZXN0SW5kZXggKyAxLCB5KTtcclxuICAgICAgICAgICAgbG93ZXN0UGFyZW50SW5kZXggPSBsb3dlc3RJbmRleCArIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwb3NpdGlvbnNbeV0gPSBsb3dlc3RQYXJlbnRJbmRleDtcclxuICAgICAgICBsb3dlc3RJbmRleCA9IGxvd2VzdFBhcmVudEluZGV4O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBwb3NpdGlvbnM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dTZWFtKGltYWdlLCBzZWFtUG9zKSB7XHJcbiAgICBjb25zdCBuZXdJbWFnZSA9IEltYWdlLmNsb25lKGltYWdlKTtcclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHNlYW1Qb3NbeV0sIHksIFsyNTUsIDAsIDBdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZVNlYW0oaW1hZ2UsIHNlYW1Qb3MpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGggLSAxLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuXHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG5ld0ltYWdlLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgY29uc3QgeFRvUmVtb3ZlID0gc2VhbVBvc1t5XTtcclxuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG5ld0ltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgaWYgKHggPCB4VG9SZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgIG5ld0ltYWdlLnNldFJHQih4LCB5LCBpbWFnZS5nZXRSR0IoeCwgeSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHgsIHksIGltYWdlLmdldFJHQih4KzEsIHkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbi8qXHJcbiAgICBVdGlsIHN0dWZmXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gaXNCb3JkZXJQaXhlbCh4LCB5LCBpbWFnZVdpZHRoLCBpbWFnZUhlaWdodCkge1xyXG4gICAgcmV0dXJuIHggPT09IDAgfHwgeCA9PT0gaW1hZ2VXaWR0aCAtIDEgfHwgeSA9PT0gMCB8fCB5ID09PSBpbWFnZUhlaWdodCAtIDE7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBlbmVyZ3lJbWFnZVRvR3JleXNjYWxlKGVuZXJneSkge1xyXG4gICAgY29uc3QgaW1hZ2UgPSBJbWFnZS5lbXB0eShlbmVyZ3kud2lkdGgsIGVuZXJneS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgY29uc3QgYyA9IE1hdGguY2VpbCgoZW5lcmd5LmdldFZhbHVlKHgsIHkpIC8gMzAwKSAqIDI1NSk7XHJcblxyXG4gICAgICAgICAgICBpbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGltYWdlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGltYWdlRW5lcmd5LFxyXG4gICAgZW5lcmd5SW1hZ2VUb0dyZXlzY2FsZSxcclxuICAgIGNhbGN1bGF0ZVNlYW1zLFxyXG4gICAgZmluZE1pblNlYW0sXHJcbiAgICBzaG93U2VhbSxcclxuICAgIHJlbW92ZVNlYW1cclxufTsiLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogVGFrZXMgYW4gaW1hZ2Ugd2l0aCBSR0IgdmFsdWVzLCBhbmQgdHVybnMgYWxsIHBpeGVscyBlaXRoZXIgd2hpdGUgKDI1NSwyNTUsMjU1KSBvciBibGFjayAoMCwwLDApXHJcbiAqIGRlcGVuZGluZyBvbiBpZiB0aGUgaW50ZW5zaXR5IGlzIGFib3ZlIHRoZSB0aHJlc2hvbGRcclxuICpcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHBhcmFtIHRocmVzaG9sZCBOdW1iZXJcclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gdGhyZXNob2xkKGltYWdlLCB0aHJlc2hvbGQpIHtcclxuICAgIGNvbnNvbGUubG9nKHRocmVzaG9sZCk7XHJcbiAgICBjb25zdCBuZXdJbWFnZSA9IEltYWdlLmVtcHR5KGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW1hZ2Uud2lkdGg7IHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaW1hZ2UuaGVpZ2h0OyB5KyspIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHIgPSBpbWFnZS5nZXRSKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBnID0gaW1hZ2UuZ2V0Ryh4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYiA9IGltYWdlLmdldEIoeCwgeSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgYyA9IDA7XHJcbiAgICAgICAgICAgIGlmICgociArIGcgKyBiKSAvIDMgPiB0aHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgICAgIGMgPSAyNTU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0UkdCKHgsIHksIFtjLCBjLCBjXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld0ltYWdlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRocmVzaG9sZDsiLCJjb25zdCBFZGl0b3IgPSByZXF1aXJlKCcuL0VkaXRvcicpO1xyXG5jb25zdCBncmV5c2NhbGUgPSByZXF1aXJlKCcuL2VmZmVjdHMvZ3JleXNjYWxlJyk7XHJcbmNvbnN0IGNvbG9yZmlsdGVyID0gcmVxdWlyZSgnLi9lZmZlY3RzL2NvbG9yZmlsdGVyJyk7XHJcbmNvbnN0IHRocmVzaG9sZCA9IHJlcXVpcmUoJy4vZWZmZWN0cy90aHJlc2hvbGQnKTtcclxuY29uc3Qgc2VhbSA9IHJlcXVpcmUoJy4vZWZmZWN0cy9zZWFtY2FydmluZycpO1xyXG5cclxuXHJcbmNvbnN0IGVkaXRvciA9IG5ldyBFZGl0b3IoKTtcclxuZWRpdG9yLmxvYWRJbWFnZSgndG93ZXIuanBnJyk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2xvYWRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBjb25zdCBzZWxlY3RlZEltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNpbWFnZXNcIikudmFsdWU7XHJcbiAgICBlZGl0b3IubG9hZEltYWdlKHNlbGVjdGVkSW1hZ2UpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdW5kb1wiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci51bmRvRWZmZWN0KCk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aHJlc2hvbGRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QodGhyZXNob2xkLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RocmVzaG9sZHZhbHVlXCIpLnZhbHVlKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2dyZXlzY2FsZVwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdChncmV5c2NhbGUpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29sb3JmaWx0ZXJcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoY29sb3JmaWx0ZXIpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZW5lcmd5XCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KChpbWFnZSkgPT4ge1xyXG4gICAgICAgIHJldHVybiBzZWFtLmVuZXJneUltYWdlVG9HcmV5c2NhbGUoc2VhbS5pbWFnZUVuZXJneShpbWFnZSkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ZpbmRTZWFtXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KChpbWFnZSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVuZXJneSA9IHNlYW0uaW1hZ2VFbmVyZ3koaW1hZ2UpO1xyXG4gICAgICAgIGNvbnN0IHNlYW1zID0gc2VhbS5jYWxjdWxhdGVTZWFtcyhlbmVyZ3kpO1xyXG4gICAgICAgIGNvbnN0IG1pblNlYW0gPSBzZWFtLmZpbmRNaW5TZWFtKHNlYW1zKTtcclxuICAgICAgICBjb25zdCBzaG93U2VhbSA9IHNlYW0uc2hvd1NlYW0oaW1hZ2UsIG1pblNlYW0pO1xyXG4gICAgICAgIHJldHVybiBzaG93U2VhbTtcclxuICAgIH0pO1xyXG59KTtcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNydW5TZWFtY2FydmVyXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgZWRpdG9yLmFwcGx5RWZmZWN0KChpbWFnZSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGVuZXJneSA9IHNlYW0uaW1hZ2VFbmVyZ3koaW1hZ2UpO1xyXG4gICAgICAgIGNvbnN0IHNlYW1zID0gc2VhbS5jYWxjdWxhdGVTZWFtcyhlbmVyZ3kpO1xyXG4gICAgICAgIGNvbnN0IG1pblNlYW0gPSBzZWFtLmZpbmRNaW5TZWFtKHNlYW1zKTtcclxuICAgICAgICBjb25zdCBuZXdJbWFnZSA9IHNlYW0ucmVtb3ZlU2VhbShpbWFnZSwgbWluU2VhbSk7XHJcbiAgICAgICAgLy8gY29uc3Qgc2hvd1NlYW0gPSBzZWFtLnNob3dTZWFtKGltYWdlLCBtaW5TZWFtKTtcclxuICAgICAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4iXX0=