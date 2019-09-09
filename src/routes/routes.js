const ImageController = require('../controllers/image-controller');
const TagsController = require('../controllers/tags-controller');
const PosesController = require('../controllers/get-poses-controller');

module.exports = [
    {
        method: 'POST',
        path: '/api/v1/pose/images',
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
        handler: TagsController.getTagData
    },
    {
        method: 'GET',
        path: '/api/v1/submit/poses',
        config: {
            description: 'Sends all stored images for pose classification',
            tags: ['api', 'v1', 'AI', 'pose', 'classification']
        },
        handler: PosesController.submitPoses
    },
    {
        method: 'GET',
        path: '/api/v1/submit/poses/reset',
        config: {
            description: 'Reset images back to originals folder ready for re-submission',
            tags: ['api', 'v1', 'AI', 'pose', 'classification', 'reset']
        },
        handler: PosesController.resetPoses
    }
];
