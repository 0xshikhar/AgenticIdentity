import { FeatureExtractor } from './FeatureExtractor.js'
import { saveFeatures } from '../utils/data-utils.js'

async function extractAndSaveFeatures() {
    // Get wallet addresses from database or command line args
    const walletAddresses = process.argv.slice(2)

    if (walletAddresses.length === 0) {
        console.error('Please provide at least one wallet address')
        process.exit(1)
    }

    const extractor = new FeatureExtractor()

    for (const address of walletAddresses) {
        console.log(`Extracting features for wallet: ${address}`)

        try {
            const walletFeatures = await extractor.extractFeatures(address)
            const normalizedFeatures = await extractor.normalizeFeatures(walletFeatures.features)

            // Save features to file
            await saveFeatures({
                ...walletFeatures,
                normalizedFeatures
            })

            console.log(`Successfully extracted features for ${address}`)
        } catch (error) {
            console.error(`Error extracting features for ${address}:`, error)
        }
    }
}

// Run if executed directly
if (require.main === module) {
    extractAndSaveFeatures().catch(console.error)
} 