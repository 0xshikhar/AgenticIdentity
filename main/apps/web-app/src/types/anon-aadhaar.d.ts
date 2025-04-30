// Type definitions for @anon-aadhaar modules
declare module '@anon-aadhaar/core' {
    // Define Buffer with the missing ArrayIterator methods
    interface ArrayIterator<T> extends IterableIterator<T> {
        map: <U>(callbackfn: (value: T, index: number, array: T[]) => U) => ArrayIterator<U>;
        filter: (predicate: (value: T, index: number, array: T[]) => boolean) => ArrayIterator<T>;
        take: (count: number) => ArrayIterator<T>;
        drop: (count: number) => ArrayIterator<T>;
        // Add other methods mentioned in the error
    }

    // Define the Buffer type with all necessary methods
    interface Buffer extends Uint8Array {
        slice(...args: any[]): Buffer;
        entries(): ArrayIterator<[number, number]>;
        // Add other Buffer methods as needed
    }

    // Define the ZKArtifact type to accept both
    type ZKArtifact = Uint8Array | Buffer;

    // Additional specific export to fix the prover.ts error
    export function fetchArtifact(url: string): Promise<ZKArtifact>;
}

// If there are other modules from anon-aadhaar that need type definitions
declare module '@anon-aadhaar/react' {
    // Add type definitions if needed
} 