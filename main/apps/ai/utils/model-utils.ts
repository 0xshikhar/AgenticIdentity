import * as tf from '@tensorflow/tfjs-node'
import { promises as fs } from 'fs'
import path from 'path'

export interface ModelConfigWithStats {
    inputFeatures: number
    hiddenLayers: number[]
    dropoutRate: number
    learningRate: number
    trainingDate?: string
    testMSE?: number
    [key: string]: any
}

/**
 * Save a TensorFlow.js model to disk
 */
export async function saveModel(model: tf.Sequential, outputPath: string): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Save model
    await model.save(`file://${outputPath}`)
    console.log(`Model saved to ${outputPath}`)
}

/**
 * Load a TensorFlow.js model from disk
 */
export async function loadModel(modelPath: string): Promise<tf.Sequential> {
    try {
        const model = await tf.loadLayersModel(`file://${modelPath}/model.json`)
        return model as tf.Sequential
    } catch (error) {
        console.error(`Error loading model from ${modelPath}:`, error)
        throw new Error(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Save model configuration to a JSON file
 */
export async function saveModelConfig(configPath: string, config: ModelConfigWithStats): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true })

    // Save config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
    console.log(`Model config saved to ${configPath}`)
}

/**
 * Load model configuration from a JSON file
 */
export async function loadModelConfig(configPath: string): Promise<ModelConfigWithStats> {
    try {
        const configData = await fs.readFile(configPath, 'utf8')
        return JSON.parse(configData)
    } catch (error) {
        console.error(`Error loading model config from ${configPath}:`, error)
        throw new Error(`Failed to load model config: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
} 