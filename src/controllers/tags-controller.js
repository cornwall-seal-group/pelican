const Boom = require('@hapi/boom');
const Bcrypt = require('bcrypt');
const config = require('config');
const { getTags } = require('../utils/tags');

const getTagData = request => {
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
                getTags()
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
    getTagData
};
