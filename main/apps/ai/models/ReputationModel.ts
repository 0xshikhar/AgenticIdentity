import * as tf from '@tensorflow/tfjs-node'
import { saveModel, loadModel } from '../utils/model-utils.js'

export interface ModelConfig {
    inputFeatures: number
    hiddenLayers: number[]
    dropoutRate: number
    learningRate: number
}

export class ReputationModel {
    private model: tf.Sequential
    private config: ModelConfig

    constructor(config: ModelConfig) {
        this.config = config
        this.model = this.buildModel()
    }

    private buildModel(): tf.Sequential {
        const model = tf.sequential()

        // Input layer
        model.add(tf.layers.dense({
            units: this.config.hiddenLayers[0],
            activation: 'relu',
            inputShape: [this.config.inputFeatures]
        }))

        model.add(tf.layers.dropout({ rate: this.config.dropoutRate }))

        // Hidden layers
        for (let i = 1; i < this.config.hiddenLayers.length; i++) {
            model.add(tf.layers.dense({
                units: this.config.hiddenLayers[i],
                activation: 'relu'
            }))
            model.add(tf.layers.dropout({ rate: this.config.dropoutRate }))
        }

        // Output layer (score between 0-100)
        model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }))

        // Compile model
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),     
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae']
        })

        return model
    }

    async train(
        xTrain: tf.ITensor,
        yTrain: tf.ITensor,
        epochs: number = 50,
        batchSize: number = 32,
        validationSplit: number = 0.2
    ): Promise<tf.History> {
        // Train model
        const history = await this.model.fit(xTrain, yTrain, {
            epochs,
            batchSize,
            validationSplit,
            callbacks: {
                onEpochEnd: (epoch: number, logs: any) => {
                    console.log(`Epoch ${epoch + 1} - loss: ${logs?.loss.toFixed(4)}, val_loss: ${logs?.val_loss.toFixed(4)}`)
                }
            }
        })

        return history
    }

    predict(features: tf.ITensor): tf.ITensor { 
        return this.model.predict(features) as tf.ITensor
    }

    async save(path: string): Promise<void> {
        await saveModel(this.model, path)
    }

    async load(path: string): Promise<void> {
        this.model = await loadModel(path)
    }
} 