const ImageController = require('../controllers/image-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/od/images',
        config: {
            description: 'Accepts list of images to send to Object Detection model',
            tags: ['api', 'v1', 'images', 'AI', 'object detection']
        },
        handler: ImageController.submitImages
    }
];
