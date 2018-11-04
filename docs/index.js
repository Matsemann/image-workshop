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
                this.current = effect(this.current, args[0]);
                this.render(this.current, "edited");
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

        module.exports = {
            Image,
            empty,
            clone
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
         * @param image {Image}
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
    },{"../Image":2}],6:[function(require,module,exports){
        const Editor = require('./Editor');
        const greyscale = require('./effects/greyscale');
        const colorfilter = require('./effects/colorfilter');
        const threshold = require('./effects/threshold');


        const editor = new Editor();
        editor.loadImage('tower.jpg');

        document.querySelector("#load").addEventListener('click', () => {
            const selectedImage = document.querySelector("#images").value;
            editor.loadImage(selectedImage);
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


    },{"./Editor":1,"./effects/colorfilter":3,"./effects/greyscale":4,"./effects/threshold":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRWRpdG9yLmpzIiwic3JjL0ltYWdlLmpzIiwic3JjL2VmZmVjdHMvY29sb3JmaWx0ZXIuanMiLCJzcmMvZWZmZWN0cy9ncmV5c2NhbGUuanMiLCJzcmMvZWZmZWN0cy90aHJlc2hvbGQuanMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBJbWFnZURhdGEgPSByZXF1aXJlKCcuL0ltYWdlJyk7XHJcblxyXG5jb25zdCBNQVhfV0lEVEggPSAxMjAwO1xyXG5cclxuY2xhc3MgRWRpdG9yIHtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZEltYWdlKGltYWdlTmFtZSkge1xyXG4gICAgICAgIGNvbnN0IGxvYWRlciA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgIGxvYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGltYWdlRGF0YSA9IHRoaXMuZ2V0SW1hZ2VEYXRhKGxvYWRlcik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0TmV3SW1hZ2UoaW1hZ2VEYXRhKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGxvYWRlci5zcmMgPSBpbWFnZU5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SW1hZ2VEYXRhKGxvYWRlcikge1xyXG4gICAgICAgIGNvbnN0IGxvYWRlckNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZGVyQ2FudmFzXCIpO1xyXG4gICAgICAgIGNvbnN0IGxvYWRlckNvbnRleHQgPSBsb2FkZXJDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgLy8gRHJhdyBzY2FsZWQgaW1hZ2UgdG8gaW52aXNpYmxlIGNhbnZhcyBhbmQgcmVhZCBiYWNrIHRoZSBwaXhlbCBkYXRhXHJcbiAgICAgICAgY29uc3QgW3dpZHRoLCBoZWlnaHRdID0gc2NhbGVTaXplKGxvYWRlci53aWR0aCwgbG9hZGVyLmhlaWdodCk7XHJcbiAgICAgICAgbG9hZGVyQ2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgbG9hZGVyQ2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgbG9hZGVyQ29udGV4dC5kcmF3SW1hZ2UobG9hZGVyLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICBjb25zdCBkYXRhID0gbG9hZGVyQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgSW1hZ2VEYXRhLkltYWdlKGRhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE5ld0ltYWdlKGltYWdlKSB7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbCA9IGltYWdlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IEltYWdlRGF0YS5jbG9uZShpbWFnZSk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5vcmlnaW5hbCwgXCJvcmlnaW5hbFwiKTtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmN1cnJlbnQsIFwiZWRpdGVkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihpbWFnZSwgY2FudmFzTmFtZSkge1xyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBjYW52YXNOYW1lKTtcclxuICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlLmltYWdlRGF0YSwgMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXBwbHlFZmZlY3QoZWZmZWN0LCAuLi5hcmdzKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gZWZmZWN0KHRoaXMuY3VycmVudCwgYXJnc1swXSk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXIodGhpcy5jdXJyZW50LCBcImVkaXRlZFwiKTtcclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBzY2FsZVNpemUod2lkdGgsIGhlaWdodCkge1xyXG4gICAgaWYgKHdpZHRoID4gTUFYX1dJRFRIKSB7XHJcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0IC8gKHdpZHRoIC8gTUFYX1dJRFRIKTtcclxuICAgICAgICB3aWR0aCA9IE1BWF9XSURUSDtcclxuICAgIH1cclxuICAgIHJldHVybiBbd2lkdGgsIGhlaWdodF07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yOyIsImNsYXNzIEltYWdlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpbWFnZURhdGEpIHtcclxuICAgICAgICB0aGlzLmltYWdlRGF0YSA9IGltYWdlRGF0YTtcclxuICAgICAgICB0aGlzLmRhdGEgPSBpbWFnZURhdGEuZGF0YTtcclxuICAgICAgICB0aGlzLndpZHRoID0gaW1hZ2VEYXRhLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERhdGEgaXMgYSBzaW5nbGUtZGltZW5zaW9uYWwgYXJyYXksIHdpdGggNCB2YWx1ZXMgKHJnYmEpIHBlciBweFxyXG4gICAgICovXHJcbiAgICBnZXRJbmRleCh4LCB5KSB7XHJcbiAgICAgICAgaWYgKHggPCAwIHx8IHggPj0gdGhpcy53aWR0aCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ4IFwiICsgeCArIFwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kIFwiICsgdGhpcy53aWR0aCk7XHJcbiAgICAgICAgfWVsc2UgaWYgKHkgPCAwIHx8IHkgPj0gdGhpcy5oZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwieSBcIiArIHkgKyBcIiBpcyBub3QgYmV0d2VlbiAwIGFuZCBcIiArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHkgKiAodGhpcy53aWR0aCAqIDQpICsgKHggKiA0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSKHgsIHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhW3RoaXMuZ2V0SW5kZXgoeCwgeSldO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEcoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDFdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEIoeCwgeSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDJdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFJHQih4LCB5KSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmdldEluZGV4KHgsIHkpO1xyXG4gICAgICAgIHJldHVybiBbdGhpcy5kYXRhW2luZGV4XSwgdGhpcy5kYXRhW2luZGV4ICsgMV0sIHRoaXMuZGF0YVtpbmRleCArIDJdXTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRSKHgsIHksIHJWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpXSA9IHJWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHKHgsIHksIGdWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZGF0YVt0aGlzLmdldEluZGV4KHgsIHkpICsgMV0gPSBnVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Qih4LCB5LCBiVmFsdWUpIHtcclxuICAgICAgICB0aGlzLmRhdGFbdGhpcy5nZXRJbmRleCh4LCB5KSArIDJdID0gYlZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFJHQih4LCB5LCBbciwgZywgYl0pIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0SW5kZXgoeCwgeSk7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4XSA9IHI7XHJcbiAgICAgICAgdGhpcy5kYXRhW2luZGV4ICsgMV0gPSBnO1xyXG4gICAgICAgIHRoaXMuZGF0YVtpbmRleCArIDJdID0gYjtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0gd2lkdGggbnVtYmVyXHJcbiAqIEBwYXJhbSBoZWlnaHQgbnVtYmVyXHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGVtcHR5KHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcih3aWR0aCAqIGhlaWdodCAqIDQpO1xyXG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXIpO1xyXG4gICAgY29uc3QgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YShkYXRhLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAvLyBTZXQgYWxwaGEgdG8gMjU1XHJcbiAgICBmb3IgKGxldCBpID0gMzsgaSA8ICh3aWR0aCAqIGhlaWdodCAqIDQpOyBpICs9IDQpIHtcclxuICAgICAgICBkYXRhW2ldID0gMjU1O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgSW1hZ2UoaW1hZ2VEYXRhKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGNsb25lKGltYWdlKSB7XHJcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoaW1hZ2Uud2lkdGggKiBpbWFnZS5oZWlnaHQgKiA0KTtcclxuICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnVmZmVyKTtcclxuICAgIGNvbnN0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEoZGF0YSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgZGF0YVtpXSA9IGltYWdlLmRhdGFbaV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBJbWFnZShpbWFnZURhdGEpO1xyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBJbWFnZSxcclxuICAgIGVtcHR5LFxyXG4gICAgY2xvbmVcclxufTsiLCJjb25zdCBJbWFnZSA9IHJlcXVpcmUoJy4uL0ltYWdlJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIGltYWdlIHtJbWFnZX1cclxuICogQHJldHVybnMge0ltYWdlfVxyXG4gKi9cclxuZnVuY3Rpb24gY29sb3JmaWx0ZXIoaW1hZ2UpIHtcclxuICAgIGNvbnN0IG5ld0ltYWdlID0gSW1hZ2UuZW1wdHkoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbWFnZS53aWR0aDsgeCsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkrKykge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgciA9IGltYWdlLmdldFIoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGcgPSBpbWFnZS5nZXRHKHgsIHkpO1xyXG4gICAgICAgICAgICBjb25zdCBiID0gaW1hZ2UuZ2V0Qih4LCB5KTtcclxuXHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldFIoeCwgeSwgciAtIDUwKTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Ryh4LCB5LCBnKTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SW1hZ2U7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gY29sb3JmaWx0ZXI7IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIGdyZXlzY2FsZShpbWFnZSkge1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW50ZW5zaXR5ID0gMC4zNCAqIHIgKyAwLjUgKiBnICsgMC4xNiAqIGI7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSKHgsIHksIGludGVuc2l0eSk7XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldEcoeCwgeSwgaW50ZW5zaXR5KTtcclxuICAgICAgICAgICAgbmV3SW1hZ2Uuc2V0Qih4LCB5LCBpbnRlbnNpdHkpO1xyXG5cclxuICAgICAgICAgICAgLyogZXZ0XHJcbiAgICAgICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGltYWdlLmdldFJHQih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgYyA9IDAuMzQgKiByICsgMC41ICogZyArIDAuMTYgKiBiO1xyXG4gICAgICAgICAgICBuZXdJbWFnZS5zZXRSR0IoeCwgeSwgW2MsIGMsIGNdKTsqL1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBncmV5c2NhbGU7IiwiY29uc3QgSW1hZ2UgPSByZXF1aXJlKCcuLi9JbWFnZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSBpbWFnZSB7SW1hZ2V9XHJcbiAqIEByZXR1cm5zIHtJbWFnZX1cclxuICovXHJcbmZ1bmN0aW9uIHRocmVzaG9sZChpbWFnZSwgdGhyZXNob2xkKSB7XHJcbiAgICBjb25zb2xlLmxvZyh0aHJlc2hvbGQpO1xyXG4gICAgY29uc3QgbmV3SW1hZ2UgPSBJbWFnZS5lbXB0eShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4KyspIHtcclxuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGltYWdlLmhlaWdodDsgeSsrKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByID0gaW1hZ2UuZ2V0Uih4LCB5KTtcclxuICAgICAgICAgICAgY29uc3QgZyA9IGltYWdlLmdldEcoeCwgeSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbWFnZS5nZXRCKHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGMgPSAwO1xyXG4gICAgICAgICAgICBpZiAoKHIgKyBnICsgYikgLyAzID4gdGhyZXNob2xkKSB7XHJcbiAgICAgICAgICAgICAgICBjID0gMjU1O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5ld0ltYWdlLnNldFJHQih4LCB5LCBbYywgYywgY10pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXdJbWFnZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0aHJlc2hvbGQ7IiwiY29uc3QgRWRpdG9yID0gcmVxdWlyZSgnLi9FZGl0b3InKTtcclxuY29uc3QgZ3JleXNjYWxlID0gcmVxdWlyZSgnLi9lZmZlY3RzL2dyZXlzY2FsZScpO1xyXG5jb25zdCBjb2xvcmZpbHRlciA9IHJlcXVpcmUoJy4vZWZmZWN0cy9jb2xvcmZpbHRlcicpO1xyXG5jb25zdCB0aHJlc2hvbGQgPSByZXF1aXJlKCcuL2VmZmVjdHMvdGhyZXNob2xkJyk7XHJcblxyXG5cclxuY29uc3QgZWRpdG9yID0gbmV3IEVkaXRvcigpO1xyXG5lZGl0b3IubG9hZEltYWdlKCd0b3dlci5qcGcnKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbG9hZFwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2ltYWdlc1wiKS52YWx1ZTtcclxuICAgIGVkaXRvci5sb2FkSW1hZ2Uoc2VsZWN0ZWRJbWFnZSk7XHJcbn0pO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0aHJlc2hvbGRcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QodGhyZXNob2xkLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RocmVzaG9sZHZhbHVlXCIpLnZhbHVlKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2dyZXlzY2FsZVwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGVkaXRvci5hcHBseUVmZmVjdChncmV5c2NhbGUpO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY29sb3JmaWx0ZXJcIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBlZGl0b3IuYXBwbHlFZmZlY3QoY29sb3JmaWx0ZXIpO1xyXG59KTtcclxuXHJcbiJdfQ==
