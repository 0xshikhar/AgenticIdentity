import { SimpleLinearRegression } from 'ml-regression'

export class LinearReputationModel {
    private model: SimpleLinearRegression

    constructor() {
        this.model = null
    }

    train(x: number[][], y: number[]): void {
        // Convert 2D array to 1D for simple linear regression
        const xValues = x.map(row => row[0])
        this.model = new SimpleLinearRegression(xValues, y)
    }

    predict(x: number[][]): number[] {
        return x.map(features => {
            const prediction = this.model.predict(features[0])
            // Ensure prediction is between 0-100
            return Math.min(100, Math.max(0, prediction))
        })
    }

    getCoefficients(): { slope: number, intercept: number } {
        return {
            slope: this.model.slope,
            intercept: this.model.intercept
        }
    }
} 