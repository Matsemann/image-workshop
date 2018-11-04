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