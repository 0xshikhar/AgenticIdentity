declare module 'ml-regression' {
    export class SimpleLinearRegression {
        constructor(x: number[], y: number[]);
        predict(x: number): number;
        slope: number;
        intercept: number;
        toString(): string;
        toLaTeX(): string;
    }
} 