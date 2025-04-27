"use client";

import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

// Types for our component
type FaceRecognitionStatus = "idle" | "loading" | "detecting" | "success" | "error";
type LivenessScore = number; // 0-100
type FacePosition = {
    x: number;
    y: number;
    timestamp: number;
};

const FaceRecognitionComponent: React.FC = () => {
    // State for the component
    const [status, setStatus] = useState<FaceRecognitionStatus>("idle");
    const [message, setMessage] = useState<string>("");
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [livenessScore, setLivenessScore] = useState<LivenessScore>(0);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [faceDetected, setFaceDetected] = useState<boolean>(false);
    const [facePositions, setFacePositions] = useState<FacePosition[]>([]);

    // References to DOM elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Load face-api models when component mounts
    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatus("loading");
                setMessage("Loading face recognition models...");

                // Change this path to where you store your models
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);

                setIsModelLoaded(true);
                setStatus("idle");
                setMessage("Face recognition ready. Click the button to start.");
            } catch (error) {
                console.error("Error loading models:", error);
                setStatus("error");
                setMessage("Failed to load face recognition models. Please refresh the page.");
            }
        };

        loadModels();

        // Cleanup function
        return () => {
            stopCamera();
        };
    }, []);

    // Start camera when user clicks the button
    const startCamera = async () => {
        if (!isModelLoaded) {
            setStatus("error");
            setMessage("Face recognition models are not loaded yet.");
            return;
        }

        try {
            setStatus("loading");
            setMessage("Requesting camera access...");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setShowCamera(true);
                setStatus("detecting");
                setMessage("Position your face in the frame...");
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            setStatus("error");
            setMessage("Camera access denied. Please allow camera access and try again.");
        }
    };

    // Stop camera and reset state
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setShowCamera(false);
        setFaceDetected(false);
        setLivenessScore(0);
        setFacePositions([]);
        setStatus("idle");
        setMessage("Face recognition ready. Click the button to start.");
    };

    // Handle video playing for face detection
    const handleVideoPlay = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Start face detection
        detectFace();
    };

    // Detect face in video stream
    const detectFace = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Only process if video is playing
        if (video.paused || video.ended || !streamRef.current) return;

        try {
            // Detect faces in the current video frame
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
                .withFaceLandmarks()
                .withFaceExpressions();

            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // If a face is detected
            if (detections.length > 0) {
                // Draw face detection results on canvas
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);

                // Update face detected state
                setFaceDetected(true);

                // Store face position for liveness detection
                const faceBox = detections[0].detection.box;
                const newPosition: FacePosition = {
                    x: faceBox.x,
                    y: faceBox.y,
                    timestamp: Date.now()
                };

                setFacePositions(prev => {
                    // Keep last 30 positions for analysis
                    const updatedPositions = [...prev, newPosition].slice(-30);

                    // Calculate liveness score based on face movements
                    calculateLivenessScore(updatedPositions);

                    return updatedPositions;
                });
            } else {
                setFaceDetected(false);
            }

            // Continue detection if still in detecting status
            if (status === "detecting") {
                requestAnimationFrame(detectFace);
            }
        } catch (error) {
            console.error("Error during face detection:", error);
        }
    };

    // Calculate liveness score based on face movement
    const calculateLivenessScore = (positions: FacePosition[]) => {
        if (positions.length < 5) return; // Need minimum data points

        // Calculate movement variance
        let totalMovement = 0;

        for (let i = 1; i < positions.length; i++) {
            const dx = positions[i].x - positions[i - 1].x;
            const dy = positions[i].y - positions[i - 1].y;
            const movement = Math.sqrt(dx * dx + dy * dy);
            totalMovement += movement;
        }

        // Calculate time elapsed
        const timeElapsed = positions[positions.length - 1].timestamp - positions[0].timestamp;

        // Calculate score (0-100)
        // Higher movement variance = higher score
        // This is a simple approach - real liveness detection would be more complex
        const movementScore = Math.min(100, Math.max(0, totalMovement / 20));

        setLivenessScore(movementScore);

        // If we have a good score and enough time has passed, mark as success
        if (movementScore > 70 && timeElapsed > 2000 && status === "detecting") {
            setStatus("success");
            setMessage("Face verification successful!");
            // Stop detection loop
            setTimeout(() => {
                stopCamera();
            }, 2000);
        }
    };

    // Helper function for status icon
    const getStatusIcon = () => {
        switch (status) {
            case "error":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                );
            case "success":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                );
            case "loading":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 animate-spin">
                        <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="30 150" />
                    </svg>
                );
            case "detecting":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                        <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <circle cx="15.5" cy="8.5" r="1.5" />
                        <path d="M12 16s-1.5-2-4-2-4 2-4 2" />
                        <path d="M12 16s1.5-2 4-2 4 2 4 2" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                    </svg>
                );
        }
    };

    // Get status color class
    const getStatusColorClass = () => {
        switch (status) {
            case "error":
                return "bg-red-50 text-red-900 border-red-200";
            case "success":
                return "bg-green-50 text-green-900 border-green-200";
            case "loading":
                return "bg-blue-50 text-blue-900 border-blue-200";
            case "detecting":
                return "bg-yellow-50 text-yellow-900 border-yellow-200";
            default:
                return "bg-gray-50 text-gray-900 border-gray-200";
        }
    };

    return (
        <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-blue-600">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-900">Face Recognition</h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Verify your identity with face recognition
                    </p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Status Message */}
                    <div className={`rounded-md p-3 border ${getStatusColorClass()} flex items-start gap-3`}>
                        <div className="shrink-0 mt-0.5">
                            {getStatusIcon()}
                        </div>
                        <div>
                            <h3 className="text-sm font-medium">
                                {status === "error" ? "Error" :
                                    status === "success" ? "Success" :
                                        status === "loading" ? "Loading" :
                                            status === "detecting" ? "Detecting" : "Ready"}
                            </h3>
                            <p className="mt-1 text-sm opacity-90">{message}</p>
                        </div>
                    </div>

                    {/* Video feed and canvas overlay */}
                    {showCamera && (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square w-full">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                onPlay={handleVideoPlay}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Liveness indicator */}
                            {status === "detecting" && (
                                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-md p-2 shadow-sm">
                                    <div className="text-xs mb-1 flex justify-between">
                                        <span>Liveness Detection</span>
                                        <span>{livenessScore.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full ${livenessScore > 70 ? "bg-green-500" :
                                                    livenessScore > 40 ? "bg-yellow-500" :
                                                        "bg-red-500"
                                                }`}
                                            style={{ width: `${livenessScore}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {!showCamera && status !== "loading" ? (
                        <button
                            onClick={startCamera}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isModelLoaded || status === "loading"}
                        >
                            {status === "loading" ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 animate-spin">
                                        <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="30 150" />
                                    </svg>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Start Face Recognition
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={stopCamera}
                            className="w-full py-2 px-4 bg-white text-gray-700 border border-gray-300 font-medium rounded-md shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={status === "loading"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {status === "success" && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                        Your identity has been verified successfully.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FaceRecognitionComponent;
