const Boom = require('@hapi/boom');
const Bcrypt = require('bcrypt');
const config = require('config');
const fs = require('fs');
const Axios = require('axios');
const FormData = require('form-data');

const { projectId } = config;
const { trainingKey } = config;
const { endPoint } = config;

const submitImages = request => {
    const { headers } = request;

    const requestApiKey = headers['x-api-key'] || '';

    const { payload } = request;
    const { seal = '', images = [] } = payload;
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
                    const modelUrl = `${endPoint}${projectId}/images`;
                    const imageUrl = `${imagesDirectory}${seal}/${image}`;

                    const form = new FormData();
                    form.append('files[0]', fs.createReadStream(imageUrl));
                    const formHeaders = form.getHeaders();
                    const axiosConfig = {
                        headers: {
                            ...formHeaders,
                            'Training-Key': trainingKey
                        }
                    };
                    fileUploadPromises.push(Axios.post(modelUrl, form, axiosConfig));
                });

                Promise.all(fileUploadPromises)
                    .then(() => {
                        resolve(`Uploaded ${fileUploadPromises.length} images successfully`);
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
