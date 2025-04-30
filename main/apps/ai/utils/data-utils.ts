import { promises as fs } from 'fs'
import path from 'path'
import { WalletFeatures } from '../features/FeatureExtractor.js'

export interface EnhancedWalletFeatures extends WalletFeatures {
    normalizedFeatures: number[]
}

/**
 * Save extracted wallet features to a JSON file
 */
export async function saveFeatures(features: EnhancedWalletFeatures): Promise<void> {
    const outputDir = path.join(__dirname, '../../data/features')
    const outputFile = path.join(outputDir, `${features.walletAddress}.json`)

    // Ensure directory exists
    await fs.mkdir(outputDir, { recursive: true })

    // Save features
    await fs.writeFile(outputFile, JSON.stringify(features, null, 2))
    console.log(`Features saved to ${outputFile}`)
}

/**
 * Load wallet features from a JSON file
 */
export async function loadFeatures(filePath: string): Promise<EnhancedWalletFeatures> {
    try {
        const data = await fs.readFile(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error(`Error loading features from ${filePath}:`, error)
        throw new Error(`Failed to load features: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Save a dataset to CSV format
 */
export async function saveToCSV(
    data: { address: string, features: number[], score: number }[],
    outputPath: string
): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Create CSV content
    const headers = ['address', ...Array.from({ length: data[0].features.length }, (_, i) => `feature_${i + 1}`), 'score']
    const rows = data.map(item => [
        item.address,
        ...item.features.map(f => f.toString()),
        item.score.toString()
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n')

    // Write to file
    await fs.writeFile(outputPath, csvContent)
    console.log(`Data saved to ${outputPath}`)
}

/**
 * Load a dataset from CSV format
 */
export async function loadFromCSV(
    filePath: string
): Promise<{ address: string, features: number[], score: number }[]> {
    try {
        const data = await fs.readFile(filePath, 'utf8')
        const lines = data.split('\n').filter(line => line.trim() !== '')
        const headers = lines[0].split(',')

        // Extract data rows
        return lines.slice(1).map(line => {
            const values = line.split(',')
            const address = values[0]
            const score = parseFloat(values[values.length - 1])
            const features = values.slice(1, values.length - 1).map(v => parseFloat(v))

            return { address, features, score }
        })
    } catch (error) {
        console.error(`Error loading data from ${filePath}:`, error)
        throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
} 