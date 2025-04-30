// Type definitions for @anon-aadhaar modules
declare module '@anon-aadhaar/core' {
    // Define Buffer with the missing ArrayIterator methods
    interface ArrayIterator<T> extends IterableIterator<T> {
        map: <U>(callbackfn: (value: T, index: number, array: T[]) => U) => ArrayIterator<U>;
        filter: (predicate: (value: T, index: number, array: T[]) => boolean) => ArrayIterator<T>;
        take: (count: number) => ArrayIterator<T>;
        drop: (count: number) => ArrayIterator<T>;
        // Add other methods mentioned in the error
        concat: <U>(...iterables: Array<U | ArrayIterator<U>>) => ArrayIterator<T | U>;
        flatten: () => ArrayIterator<any>;
        flatMap: <U>(callback: (value: T) => U | ArrayIterator<U>) => ArrayIterator<U>;
        reduce: <U>(callback: (acc: U, value: T) => U, initialValue: U) => U;
        toArray: () => T[];
        forEach: (callback: (value: T) => void) => void;
        some: (predicate: (value: T) => boolean) => boolean;
        every: (predicate: (value: T) => boolean) => boolean;
        find: (predicate: (value: T) => boolean) => T | undefined;
    }

    // Define the Buffer type with all necessary methods
    interface Buffer extends Uint8Array {
        slice(...args: any[]): Buffer;
        entries(): ArrayIterator<[number, number]>;
        // Add other Buffer methods as needed
        keys(): ArrayIterator<number>;
        values(): ArrayIterator<number>;
    }

    // Define the ZKArtifact type to accept both
    type ZKArtifact = Uint8Array | Buffer;

    // Additional exports to fix type resolution
    export function fetchArtifact(url: string): Promise<ZKArtifact>;
    export class Groth16Prover {
        prove(inputs: any): Promise<any>;
    }
}

// Add specific type declarations for the react package too
declare module '@anon-aadhaar/react' {
    import { ReactNode } from 'react';
    export function AnonAadhaarProvider(props: { children: ReactNode }): JSX.Element;
    export function useAnonAadhaar(): [number, any];
    export function LogInWithAnonAadhaar(): JSX.Element;
} 