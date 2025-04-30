import { ScoreGenerator } from './ScoreGenerator.js'

async function generateScores() {
    // Get wallet addresses from command line args
    const walletAddresses = process.argv.slice(2)

    if (walletAddresses.length === 0) {
        console.error('Please provide at least one wallet address')
        process.exit(1)
    }

    const generator = new ScoreGenerator()
    await generator.initialize()

    for (const address of walletAddresses) {
        console.log(`Generating reputation score for wallet: ${address}`)

        try {
            const score = await generator.generateScore(address)

            console.log(`Score: ${score.score}/100 (Confidence: ${score.confidence * 100}%)`)
            console.log('Top contributing factors:')

            score.factors.slice(0, 5).forEach(factor => {
                console.log(`- ${factor.name}: ${factor.contribution}% (Value: ${factor.value.toFixed(2)})`)
            })

            console.log('Score saved to database')
        } catch (error) {
            console.error(`Error generating score for ${address}:`, error)
        }
    }
}

// Run if executed directly
if (require.main === module) {
    generateScores().catch(console.error)
} 