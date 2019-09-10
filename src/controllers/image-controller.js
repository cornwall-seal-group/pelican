const Boom = require('@hapi/boom');
const Bcrypt = require('bcrypt');
const config = require('config');
const fs = require('fs');
const Jimp = require('jimp');
const TrainingApi = require('@azure/cognitiveservices-customvision-training');
const { getTags } = require('../utils/tags');

const { projectId } = config;
const { trainingKey } = config;
const { endPoint } = config;

const trainer = new TrainingApi.TrainingAPIClient(trainingKey, endPoint);

const knownTags = {
    '2dc4a497-e5d7-46c8-843c-6ff4387978e0': 'wet-body-left',
    '7b62b8e3-21e2-42c6-8c2c-b1d88b4c4a07': 'bottling-right',
    '9ed9eaad-43c8-4ac2-aa59-6c3f53b32f9f': 'wet-head-straight',
    '9f8e9065-7eff-4df0-93f6-ad3e98fbccc6': 'bottling-straight',
    '36ad0cbd-0030-4cf8-8805-4f35be44f435': 'wet-head-right',
    '41a01f55-48d1-4653-b65c-4474d59a9802': 'torso-left',
    '77a3c4f5-5ae6-494f-97ba-5ef38622c3a2': 'dry-body-left',
    '92bbe322-bb7e-465f-b120-2da93350eed2': 'wet-body-right',
    '93c56914-198b-49cc-ac76-3ff183c69740': 'bottling-left',
    '99d2e491-aa7b-4f40-a398-b40186e53636': 'dry-body-right',
    '178b06e9-2f6a-4ff2-92d4-6ad1e4f2cf38': 'dry-body-back-right',
    '377ab392-42fd-4edb-9972-f320e7462868': 'flat-body-left',
    '6947594b-0984-470e-823a-396ea21a985c': 'torso-right',
    '65618903-5dbf-4b12-b8a4-10a4e2dd5072': 'dry-body-back-left',
    'b221998c-0d8b-46de-b6f9-8561b13690c5': 'wet-head-left',
    'be4f4bf8-1ca2-4ffc-a276-3798e10c5b35': 'dry-belly-left',
    'd19b038c-51ce-4dc4-be18-8f4dcb67cf19': 'flat-body-right',
    'eaa4a8e2-a8ed-422e-ab9b-76bafee6c569': 'dry-belly-right'
};

const tagMatch = {
    'bottling-left': '93c56914-198b-49cc-ac76-3ff183c69740',
    'bottling-right': '7b62b8e3-21e2-42c6-8c2c-b1d88b4c4a07',
    'bottling-straight': '9f8e9065-7eff-4df0-93f6-ad3e98fbccc6',
    'dry-belly-left': 'be4f4bf8-1ca2-4ffc-a276-3798e10c5b35',
    'dry-belly-right': 'eaa4a8e2-a8ed-422e-ab9b-76bafee6c569',
    'dry-body-back-left': '65618903-5dbf-4b12-b8a4-10a4e2dd5072',
    'dry-body-back-right': '178b06e9-2f6a-4ff2-92d4-6ad1e4f2cf38',
    'dry-body-left': '77a3c4f5-5ae6-494f-97ba-5ef38622c3a2',
    'dry-body-right': '99d2e491-aa7b-4f40-a398-b40186e53636',
    'flat-body-left': '377ab392-42fd-4edb-9972-f320e7462868',
    'flat-body-right': 'd19b038c-51ce-4dc4-be18-8f4dcb67cf19',
    'torso-left': '41a01f55-48d1-4653-b65c-4474d59a9802',
    'torso-right': '6947594b-0984-470e-823a-396ea21a985c',
    'wet-body-left': '2dc4a497-e5d7-46c8-843c-6ff4387978e0',
    'wet-body-right': '92bbe322-bb7e-465f-b120-2da93350eed2',
    'wet-head-left': 'b221998c-0d8b-46de-b6f9-8561b13690c5',
    'wet-head-right': '36ad0cbd-0030-4cf8-8805-4f35be44f435',
    'wet-head-straight': '9ed9eaad-43c8-4ac2-aa59-6c3f53b32f9f'
};
const submitImages = request => {
    const { headers } = request;

    const requestApiKey = headers['x-api-key'] || '';

    const { payload } = request;
    const { seal = '', images = [], tag = '' } = payload;
    const { apiKey } = config;

    if (!apiKey) {
        return Boom.internal(
            'Sorry, this project has not been setup with the correct security. Failing to process your request.'
        );
    }

    if (seal === '') {
        return Boom.badRequest('Please supply a seal name with your submission');
    }
    if (images.length === 0) {
        return Boom.badRequest('Please supply images for submission');
    }

    return new Promise((resolve, reject) => {
        Bcrypt.compare(requestApiKey, apiKey).then(match => {
            if (match) {
                const fileUploadPromises = [];
                images.forEach(image => {
                    const { imagesDirectory } = config;
                    const imageUrl = `${imagesDirectory}${seal}/${image}`;
                    const imgStream = fs.readFileSync(imageUrl);

                    fileUploadPromises.push(
                        trainer.createImagesFromData(projectId, imgStream, {
                            tagIds: [tag]
                        })
                    );

                    const matchedTag = knownTags[tag];
                    let equivalentTag = '';
                    if (matchedTag.indexOf('right') > 0) {
                        equivalentTag = matchedTag.replace('right', 'left');
                    }
                    if (matchedTag.indexOf('left') > 0) {
                        equivalentTag = matchedTag.replace('left', 'right');
                    }
                    if (equivalentTag.length > 0) {
                        const copiedImage = new Promise((resolved, rejectd) => {
                            Jimp.read(imageUrl).then(jimpImage => {
                                const flipped = jimpImage.clone();
                                flipped.flip(true, false);
                                flipped.getBufferAsync(flipped.getMIME()).then(buffer => {
                                    trainer
                                        .createImagesFromData(projectId, buffer, {
                                            tagIds: [tagMatch[equivalentTag]]
                                        })
                                        .then(() => resolved())
                                        .catch(() => rejectd());
                                });
                            });
                        });
                        fileUploadPromises.push(copiedImage);
                    }
                });

                Promise.all(fileUploadPromises)
                    .then(() => {
                        getTags()
                            .then(tags => {
                                resolve(tags);
                            })
                            .catch(e => {
                                console.log(e);
                                reject(e);
                            });
                    })
                    .catch(e => {
                        console.log(e);
                        reject(e);
                    });
            } else {
                resolve(Boom.unauthorized('Incorrect API Key'));
            }
        });
    });
};

module.exports = {
    submitImages
};
