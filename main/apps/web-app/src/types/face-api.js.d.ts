// Type definitions for face-api.js
declare module 'face-api.js' {
  const nets: {
    tinyFaceDetector: {
      loadFromUri(url: string): Promise<void>;
    };
    faceLandmark68Net: {
      loadFromUri(url: string): Promise<void>;
    };
    faceExpressionNet: {
      loadFromUri(url: string): Promise<void>;
    };
    ageGenderNet: {
      loadFromUri(url: string): Promise<void>;
    };
  };

  // Face detector options
  class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  // Detection results and method chaining
  interface FaceDetection {
    withFaceLandmarks(): WithFaceLandmarks<FaceDetection>;
  }

  interface WithFaceLandmarks<T> {
    withFaceExpressions(): WithFaceExpressions<WithFaceLandmarks<T>>;
  }

  interface WithFaceExpressions<T> {
    withAgeAndGender(): WithAgeAndGender<WithFaceExpressions<T>>;
  }

  interface WithAgeAndGender<T> {
    detection: any;
    landmarks: any;
    expressions: any;
    age: number;
    gender: string;
    genderProbability: number;
  }

  // Drawing utilities
  namespace draw {
    function drawDetections(canvas: HTMLCanvasElement, detections: any): void;
    function drawFaceLandmarks(canvas: HTMLCanvasElement, detections: any): void;
  }

  // Main functions - updated to return array
  function detectAllFaces(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    options?: any
  ): FaceDetectionArray;

  // Array type with chaining methods
  interface FaceDetectionArray extends Array<FaceDetection> {
    withFaceLandmarks(): WithFaceLandmarksArray;
  }

  interface WithFaceLandmarksArray extends Array<WithFaceLandmarks<FaceDetection>> {
    withFaceExpressions(): WithFaceExpressionsArray;
  }

  interface WithFaceExpressionsArray extends Array<WithFaceExpressions<WithFaceLandmarks<FaceDetection>>> {
    withAgeAndGender(): WithAgeAndGenderArray;
  }

  interface WithAgeAndGenderArray extends Array<WithAgeAndGender<WithFaceExpressions<WithFaceLandmarks<FaceDetection>>>> {
    // Array properties and methods already included
  }

  export { nets, TinyFaceDetectorOptions, detectAllFaces, draw };
} 