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
    '92bbe322-bb7e-465f-b120-2da93350eed2': 'wet-body-right',
    '93c56914-198b-49cc-ac76-3ff183c69740': 'bottling-left',
    '75dae3af-1c41-4952-a612-43dc4f7a42b0': 'dry-head-straight',
    '36ad0cbd-0030-4cf8-8805-4f35be44f435': 'wet-head-right',
    '77a3c4f5-5ae6-494f-97ba-5ef38622c3a2': 'dry-body-left',
    '9ed9eaad-43c8-4ac2-aa59-6c3f53b32f9f': 'wet-head-straight',
    '2dc4a497-e5d7-46c8-843c-6ff4387978e0': 'wet-body-left',
    '55799bda-27d8-4c58-9f2c-811528845c58': 'dry-head-right',
    '826a4746-1595-4829-9d2c-8524b5b2e623': 'dry-head-left',
    'b221998c-0d8b-46de-b6f9-8561b13690c5': 'wet-head-left',
    '9f8e9065-7eff-4df0-93f6-ad3e98fbccc6': 'bottling-straight',
    '7b62b8e3-21e2-42c6-8c2c-b1d88b4c4a07': 'bottling-right',
    '99d2e491-aa7b-4f40-a398-b40186e53636': 'dry-body-right'
};

const tagMatch = {
    'wet-body-right': '92bbe322-bb7e-465f-b120-2da93350eed2',
    'bottling-left': '93c56914-198b-49cc-ac76-3ff183c69740',
    'dry-head-straight': '75dae3af-1c41-4952-a612-43dc4f7a42b0',
    'wet-head-right': '36ad0cbd-0030-4cf8-8805-4f35be44f435',
    'dry-body-left': '77a3c4f5-5ae6-494f-97ba-5ef38622c3a2',
    'wet-head-straight': '9ed9eaad-43c8-4ac2-aa59-6c3f53b32f9f',
    'wet-body-left': '2dc4a497-e5d7-46c8-843c-6ff4387978e0',
    'dry-head-right': '55799bda-27d8-4c58-9f2c-811528845c58',
    'dry-head-left': '826a4746-1595-4829-9d2c-8524b5b2e623',
    'wet-head-left': 'b221998c-0d8b-46de-b6f9-8561b13690c5',
    'bottling-straight': '9f8e9065-7eff-4df0-93f6-ad3e98fbccc6',
    'bottling-right': '7b62b8e3-21e2-42c6-8c2c-b1d88b4c4a07',
    'dry-body-right': '99d2e491-aa7b-4f40-a398-b40186e53636'
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
