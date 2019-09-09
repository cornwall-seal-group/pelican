const Boom = require('@hapi/boom');
const Bcrypt = require('bcrypt');
const config = require('config');
const fs = require('fs');
const Axios = require('axios');
const { execSync } = require('child_process');

const { imageHost, projectId, iterationName, predictionKey, endPoint } = config;

const ignoreFolders = ['albums', 'zipfiles'];

const submitPoses = async function S(request) {
    const { headers } = request;

    const requestApiKey = headers['x-api-key'] || '';

    const { apiKey } = config;

    if (!apiKey) {
        return Boom.internal(
            'Sorry, this project has not been setup with the correct security. Failing to process your request.'
        );
    }

    const match = Bcrypt.compare(requestApiKey, apiKey);

    if (match) {
        // loop through all seal folders
        const folders = fs.readdirSync(config.imagesDirectory);

        for (let f = 0; f < folders.length; f++) {
            const folder = folders[f];
            if (!ignoreFolders.includes(folder)) {
                // go through all images in the originals folder
                const sealOriginalsFolder = `${config.imagesDirectory}${folder}/originals`;
                const images = fs.readdirSync(sealOriginalsFolder);
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    const originalImagePath = `${sealOriginalsFolder}/${image}`;

                    const modelUrl = `${endPoint}/customvision/v3.0/Prediction/${projectId}/classify/iterations/${iterationName}/url`;

                    const data = { Url: `${imageHost}${folder}/originals/${image}` };
                    const axiosConfig = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Prediction-Key': predictionKey
                        }
                    };

                    const response = await Axios.post(modelUrl, data, axiosConfig);
                    const { data: results } = response;

                    const orderedPredictions = results.predictions.sort((a, b) => {
                        const probabilityA = a.probability;
                        const probabilityB = b.probability;
                        if (probabilityA > probabilityB) {
                            return -1;
                        }
                        if (probabilityA < probabilityB) {
                            return 1;
                        }
                        return 0;
                    });
                    const topResult = orderedPredictions[0];

                    // If greater than 50% we'll accept it
                    if (topResult.probability > 0.5) {
                        console.log('SUCCESS', topResult.probability, topResult.tagName, originalImagePath);
                        const categorisedFolder = `${config.imagesDirectory}${folder}/${topResult.tagName}`;
                        if (!fs.existsSync(categorisedFolder)) {
                            fs.mkdirSync(categorisedFolder);
                        }
                        const newImagePath = `${categorisedFolder}/${image}`;
                        fs.renameSync(originalImagePath, newImagePath);
                    } else {
                        console.log('NO GOOD MATCH', topResult.probability, topResult.tagName, originalImagePath);
                        // Otherwise put the image in an un-categorised folder
                        const unCategorisedFolder = `${config.imagesDirectory}${folder}/uncategorised`;
                        if (!fs.existsSync(unCategorisedFolder)) {
                            fs.mkdirSync(unCategorisedFolder);
                        }
                        const newImagePath = `${unCategorisedFolder}/${image}`;
                        fs.renameSync(originalImagePath, newImagePath);
                    }
                }
            }
        }

        return 'We are processing your request';
    }
    return Boom.unauthorized('Incorrect API Key');
};

const resetPoses = async function r(request) {
    const { headers } = request;

    const requestApiKey = headers['x-api-key'] || '';

    const { apiKey } = config;

    if (!apiKey) {
        return Boom.internal(
            'Sorry, this project has not been setup with the correct security. Failing to process your request.'
        );
    }

    const match = Bcrypt.compare(requestApiKey, apiKey);
    if (match) {
        const folders = fs.readdirSync(config.imagesDirectory);

        for (let f = 0; f < folders.length; f++) {
            const folder = folders[f];
            if (!ignoreFolders.includes(folder)) {
                const subfolders = fs.readdirSync(`${config.imagesDirectory}/${folder}`);
                subfolders.forEach(subfolder => {
                    if (subfolder !== 'originals') {
                        console.log('MOVING IMAGES FROM', subfolder, 'for', folder);
                        const files = fs.readdirSync(`${config.imagesDirectory}/${folder}/${subfolder}`);
                        if (files.length > 0) {
                            execSync(
                                `mv ${config.imagesDirectory}${folder}/${subfolder}/* ${
                                    config.imagesDirectory
                                }${folder}/originals/`
                            );
                        }
                    }
                });
            }
        }
        return 'Reset';
    }

    return Boom.unauthorized('Incorrect API Key');
};
module.exports = {
    submitPoses,
    resetPoses
};
