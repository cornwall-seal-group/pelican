const Boom = require('@hapi/boom');
const Bcrypt = require('bcrypt');
const config = require('config');
const fs = require('fs');
const TrainingApi = require('@azure/cognitiveservices-customvision-training');

const { projectId } = config;
const { trainingKey } = config;
const { endPoint } = config;

const trainer = new TrainingApi.TrainingAPIClient(trainingKey, endPoint);

const getTags = request => {
    const { headers } = request;

    const requestApiKey = headers['x-api-key'] || '';

    const { apiKey } = config;

    if (!apiKey) {
        return Boom.internal(
            'Sorry, this project has not been setup with the correct security. Failing to process your request.'
        );
    }

    return new Promise((resolve, reject) => {
        Bcrypt.compare(requestApiKey, apiKey).then(match => {
            if (match) {
                trainer
                    .getTags(projectId)
                    .then(tags => {
                        resolve(tags);
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
    getTags
};
