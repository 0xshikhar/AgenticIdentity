import * as tf from '@tensorflow/tfjs-node'
import path from 'path'
import { ReputationModel } from '../models/ReputationModel.js'
import { DatasetManager } from './DatasetManager.js'
import { loadModelConfig } from '../utils/model-utils.js'

async function evaluateModel() {
    // Configuration
    const featuresDir = path.join(__dirname, '../../data/features')
    const labelFile = path.join(__dirname, '../../data/labels.json')
    const modelDir = path.join(__dirname, '../../data/models')

    console.log('Loading dataset...')
    const datasetManager = new DatasetManager()
    const dataset = await datasetManager.loadDataset(featuresDir, labelFile)

    console.log('Loading model...')
    const modelConfig = await loadModelConfig(path.join(modelDir, 'model_config.json'))
    const model = new ReputationModel(modelConfig)
    await model.load(path.join(modelDir, 'reputation_model'))

    console.log('Evaluating model...')

    // Make predictions
    const predictions = model.predict(dataset.xTest)

    // Calculate evaluation metrics
    const mse = predictions.sub(dataset.yTest).square().mean()
    const mae = predictions.sub(dataset.yTest).abs().mean()

    // Get R-squared
    const yMean = dataset.yTest.mean()
    const totalSS = dataset.yTest.sub(yMean).square().sum()
    const residualSS = predictions.sub(dataset.yTest).square().sum()
    const rSquared = tf.scalar(1).sub(residualSS.div(totalSS))

    // Output results
    console.log(`Mean Squared Error: ${mse.dataSync()[0].toFixed(4)}`)
    console.log(`Mean Absolute Error: ${mae.dataSync()[0].toFixed(4)}`)
    console.log(`R-squared: ${rSquared.dataSync()[0].toFixed(4)}`)

    // Calculate how many predictions are within 10% of actual value
    const within10Percent = tf.tidy(() => {
        const absDiff = predictions.sub(dataset.yTest).abs()
        const threshold = dataset.yTest.mul(tf.scalar(0.1))
        return absDiff.less(threshold).sum().div(dataset.yTest.shape[0])
    })

    console.log(`Predictions within 10% of actual: ${(within10Percent.dataSync()[0] * 100).toFixed(2)}%`)

    // Dispose tensors
    mse.dispose()
    mae.dispose()
    yMean.dispose()
    totalSS.dispose()
    residualSS.dispose()
    rSquared.dispose()
    within10Percent.dispose()
}

// Run if executed directly
if (require.main === module) {
    evaluateModel().catch(console.error)
} 