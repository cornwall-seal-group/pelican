const config = require('config');
const TrainingApi = require('@azure/cognitiveservices-customvision-training');

const { projectId } = config;
const { trainingKey } = config;
const { endPoint } = config;

const trainer = new TrainingApi.TrainingAPIClient(trainingKey, endPoint);

const getTags = () => {
    return trainer.getTags(projectId);
};

module.exports = {
    getTags
};
