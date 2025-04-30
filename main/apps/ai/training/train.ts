import * as tf from '@tensorflow/tfjs-node'
import path from 'path'
import { ReputationModel } from '../models/ReputationModel.js'
import { DatasetManager } from './DatasetManager.js'
import { saveModelConfig } from '../utils/model-utils.js'  

async function trainModel() {
    // Configuration
    const featuresDir = path.join(__dirname, '../../data/features')
    const labelFile = path.join(__dirname, '../../data/labels.json')
    const modelOutputDir = path.join(__dirname, '../../data/models')

    // Model configuration
    const modelConfig = {
        inputFeatures: 11, // Number of features extracted
        hiddenLayers: [64, 32, 16],
        dropoutRate: 0.2,
        learningRate: 0.001
    }

    console.log('Loading dataset...')
    const datasetManager = new DatasetManager()
    const dataset = await datasetManager.loadDataset(featuresDir, labelFile)

    console.log('Building model...')
    const model = new ReputationModel(modelConfig)

    console.log('Training model...')
    const history = await model.train(
        dataset.xTrain,
        dataset.yTrain,
        100, // epochs
        32,  // batch size
        0.2  // validation split
    )

    console.log('Evaluating model...')
    const loss = model.predict(dataset.xTest)
        .sub(dataset.yTest)
        .square()
        .mean()
        .dataSync()[0]

    console.log(`Test MSE: ${loss.toFixed(4)}`)

    // Save model
    console.log('Saving model...')
    await model.save(path.join(modelOutputDir, 'reputation_model'))
    await saveModelConfig(path.join(modelOutputDir, 'model_config.json'), {
        ...modelConfig,
        trainingDate: new Date().toISOString(),
        testMSE: loss
    })

    console.log('Model training completed!')
}

// Run if executed directly
if (require.main === module) {
    trainModel().catch(console.error)
} 