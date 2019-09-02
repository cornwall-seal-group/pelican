const ImageController = require('../controllers/image-controller');
const TagsController = require('../controllers/tags-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/od/images',
        config: {
            description: 'Accepts list of images to send to Object Detection model',
            tags: ['api', 'v1', 'images', 'AI', 'object detection']
        },
        handler: ImageController.submitImages
    },
    {
        method: 'GET',
        path: '/api/v1/pose/tags',
        config: {
            description: 'Fetches the tags associated with the body pose model',
            tags: ['api', 'v1', 'AI', 'tags']
        },
        handler: TagsController.getTags
    }
];
