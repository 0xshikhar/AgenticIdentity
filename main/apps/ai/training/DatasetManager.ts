import * as tf from '@tensorflow/tfjs-node'
import { promises as fs } from 'fs'
import path from 'path'
import { loadFeatures } from '../utils/data-utils.js'

export interface Dataset {
    xTrain: tf.ITensor
    yTrain: tf.ITensor
    xTest: tf.ITensor
    yTest: tf.ITensor
}

export class DatasetManager {
    async loadDataset(featuresDir: string, labelFile: string, testSplit: number = 0.2): Promise<Dataset> {
        // Load feature files
        const featureFiles = await fs.readdir(featuresDir)
        const allFeatures = []
        const allAddresses = []

        for (const file of featureFiles) {
            if (file.endsWith('.json')) {
                const walletFeatures = await loadFeatures(path.join(featuresDir, file))
                allFeatures.push(walletFeatures.normalizedFeatures)
                allAddresses.push(walletFeatures.walletAddress) 
            }
        }

        // Load labels
        const labelsData = await fs.readFile(labelFile, 'utf8')
        const labels = JSON.parse(labelsData)

        // Match features with labels
        const matchedFeatures = []
        const matchedLabels = []

        for (let i = 0; i < allAddresses.length; i++) {
            const address = allAddresses[i]
            if (labels[address] !== undefined) {
                matchedFeatures.push(allFeatures[i])
                matchedLabels.push([labels[address] / 100]) // Normalize to 0-1
            }
        }

        if (matchedFeatures.length === 0) {
            throw new Error('No matching features and labels found')
        }

        // Convert to tensors
        const xData = tf.tensor(matchedFeatures)
        const yData = tf.tensor(matchedLabels)

        // Split into train and test sets
        const numSamples = matchedFeatures.length
        const numTest = Math.round(numSamples * testSplit)
        const numTrain = numSamples - numTest

        const xTrain = xData.slice([0, 0], [numTrain, -1])
        const yTrain = yData.slice([0, 0], [numTrain, -1])
        const xTest = xData.slice([numTrain, 0], [numTest, -1])
        const yTest = yData.slice([numTrain, 0], [numTest, -1])

        return { xTrain, yTrain, xTest, yTest }
    }

    async saveTrainTestSplit(dataset: Dataset, outputDir: string): Promise<void> {
        await fs.mkdir(outputDir, { recursive: true })

        // Save tensors
        await dataset.xTrain.array().then(async (data: number[][]) => {
            await fs.writeFile(path.join(outputDir, 'x_train.json'), JSON.stringify(data))
        })

        await dataset.yTrain.array().then(async (data: number[][]) => {
            await fs.writeFile(path.join(outputDir, 'y_train.json'), JSON.stringify(data))
        })

        await dataset.xTest.array().then(async (data: number[][]) => {
            await fs.writeFile(path.join(outputDir, 'x_test.json'), JSON.stringify(data))
        })

        await dataset.yTest.array().then(async (data: number[][]) => {
            await fs.writeFile(path.join(outputDir, 'y_test.json'), JSON.stringify(data))
        })
    }
} 