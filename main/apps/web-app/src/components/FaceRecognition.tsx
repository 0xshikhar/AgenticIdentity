"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
import { toast } from 'sonner'


// Types for our component
type FaceRecognitionStatus = "idle" | "detecting" | "success" | "error" | "loading";
type LivenessScore = number; // 0-100
type FacePosition = {
    x: number;
    y: number;
    timestamp: number;
};

// Add props interface with optional onVerificationComplete callback
interface FaceRecognitionProps {
    onVerificationComplete?: (data: {
        success: boolean;
        livenessScore: number;
        ageGender?: { age: number; gender: string } | null;
    }) => void;
}

const FaceRecognitionComponent: React.FC<FaceRecognitionProps> = ({ onVerificationComplete }) => {
    // State for the component
    const [status, setStatus] = useState<FaceRecognitionStatus>("idle");
    const [message, setMessage] = useState<string>("");
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
    const [livenessScore, setLivenessScore] = useState<LivenessScore>(0);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [faceDetected, setFaceDetected] = useState<boolean>(false);
    const [facePositions, setFacePositions] = useState<FacePosition[]>([]);
    const [ageGenderInfo, setAgeGenderInfo] = useState<{ age: number; gender: string } | null>(null);

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

                // Fix the path to models - remove the /public prefix
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
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

    // Handle verification completion and notify parent component
    const handleVerificationComplete = useCallback((success: boolean) => {
        if (onVerificationComplete) {
            onVerificationComplete({
                success,
                livenessScore,
                ageGender: ageGenderInfo
            });
        }
    }, [livenessScore, ageGenderInfo, onVerificationComplete]);

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
            console.log("Requesting camera access...");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });

            console.log("Camera access granted:", stream);

            // Just store the stream and set showCamera to true
            streamRef.current = stream;
            setShowCamera(true);
            setStatus("detecting");
            setMessage("Detecting face and liveness...");

        } catch (error) {
            console.error("Error accessing camera:", error);
            setStatus("error");
            setMessage("Camera access denied. Please allow camera access and try again.");
        }
    };

    // Then add this effect to handle video setup after the component re-renders with showCamera=true
    useEffect(() => {
        if (showCamera && streamRef.current && videoRef.current) {
            console.log("Setting up video element with stream");

            // Set the stream as the video source
            videoRef.current.srcObject = streamRef.current;

            // Set up metadata and play handlers
            videoRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded, starting playback");
                videoRef.current?.play().catch(e => {
                    console.error("Error playing video:", e);
                    setStatus("error");
                    setMessage("Error starting video playback. Please try again.");
                });
            };
        }
    }, [showCamera]);

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
        setAgeGenderInfo(null);
    };

    // Handle video playing for face detection
    const handleVideoPlay = () => {
        console.log("Video started playing, initializing face detection");
        if (!videoRef.current || !canvasRef.current) {
            console.error("Video or canvas reference is null in handleVideoPlay");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log("Canvas dimensions set to:", canvas.width, "x", canvas.height);

        // Start face detection
        detectFace();
    };

    // Detect face in video stream
    const detectFace = async () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) {
            console.error("Missing references in detectFace");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            console.error("Could not get canvas context");
            return;
        }

        // Only process if video is playing
        if (video.paused || video.ended || !streamRef.current) {
            console.log("Video not playing in detectFace");
            return;
        }

        try {
            console.log("Running face detection on current frame");
            // Detect faces in the current video frame
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
                .withFaceLandmarks()
                .withFaceExpressions()
                .withAgeAndGender();

            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // If a face is detected
            if (detections.length > 0) {
                console.log("Face detected:", detections.length);
                // Draw face detection results on canvas
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);

                // Update face detected state
                setFaceDetected(true);

                // Get age and gender information
                const detection = detections[0];
                if (detection.age && detection.gender) {
                    setAgeGenderInfo({
                        age: Math.round(detection.age),
                        gender: detection.gender
                    });
                }

                // Store face position for liveness detection
                const faceBox = detection.detection.box;
                const landmarks = detection.landmarks;
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
                console.log("No face detected");
                setFaceDetected(false);
            }

            // Continue detection if still in detecting status
            if (status === "detecting") {
                requestAnimationFrame(detectFace);
            } else {
                console.log("Stopping detection loop, status is:", status);
            }
        } catch (error) {
            console.error("Error during face detection:", error);
            setStatus("error");
            setMessage("Error during face detection. Please try again.");
        }
    };

    // Calculate liveness score based on face movement
    const calculateLivenessScore = (positions: FacePosition[]) => {
        if (positions.length < 5) return; // Need minimum data points

        // Calculate movement variance
        let totalMovement = 0;
        let maxMovement = 0;

        for (let i = 1; i < positions.length; i++) {
            const dx = positions[i].x - positions[i - 1].x;
            const dy = positions[i].y - positions[i - 1].y;
            const movement = Math.sqrt(dx * dx + dy * dy);
            totalMovement += movement;
            maxMovement = Math.max(maxMovement, movement);
        }

        // Base score on total movement - use a lower divisor to increase score faster
        let movementScore = Math.min(100, Math.max(0, totalMovement / 15)); // Changed from 20 to 15

        // Increase score when face is detected
        if (faceDetected) movementScore += 5;

        // Cap at 100
        movementScore = Math.min(100, movementScore);

        setLivenessScore(movementScore);

        console.log(`Liveness score: ${movementScore.toFixed(0)}%`);
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

    useEffect(() => {
        if (livenessScore >= 30 && status === "detecting") {
            setStatus("success");
            setMessage("Face verification successful!");

            // Show success toast
            toast.success("Face verification complete!", {
                description: `Identity human liveliness verified.`,
                duration: 4000
            });

            // Notify parent component
            handleVerificationComplete(true);

            // Stop detection loop and camera after a short delay
            setTimeout(() => {
                stopCamera();
            }, 1500); // Keep the delay to show the final state briefly
        }
    }, [livenessScore, status, handleVerificationComplete]);

    // Get color based on liveness score
    const getLivenessColor = () => {
        if (livenessScore > 70) return "bg-green-500";
        if (livenessScore > 40) return "bg-yellow-500";
        if (livenessScore > 30) return "bg-blue-500";
        return "bg-red-500";
    };

    return (
        <div className="w-full">
            {/* Main container with horizontal layout */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-blue-600">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <h2 className="text-lg font-semibold text-gray-900">Face Verification</h2>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${status === "success" ? "bg-green-500" :
                            status === "error" ? "bg-red-500" :
                                status === "detecting" ? "bg-yellow-500" :
                                    status === "loading" ? "bg-blue-500 animate-pulse" : "bg-gray-300"
                            }`}></span>
                        <span className="text-sm font-medium text-gray-600">
                            {status === "error" ? "Error" :
                                status === "success" ? "Verified" :
                                    status === "loading" ? "Loading" :
                                        status === "detecting" ? "Detecting" : "Ready"}
                        </span>
                    </div>
                </div>
                <div className="p-4">
                    <p className="mt-1 text-sm text-gray-500">
                        Complete a quick face scan to verify your identity.
                        No data is stored during this process.
                    </p>
                </div>

                {/* Content - horizontal layout */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Left side - video feed or instructions */}
                    <div className="md:col-span-3 p-4">
                        {showCamera ? (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-video w-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    onPlay={handleVideoPlay}
                                    onError={() => {
                                        setStatus("error");
                                        setMessage("Error with video playback. Please try again.");
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[260px] bg-gray-50 rounded-lg border border-gray-200 p-6">
                                <div className="mb-4 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Face Verification</h3>
                                <p className="text-gray-500 text-center mb-4">Verify your identity with a quick face scan</p>

                                {status === "loading" && (
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Loading models...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side - controls and status */}
                    <div className="md:col-span-2 p-4 bg-gray-50 flex flex-col">
                        {/* Status Message */}
                        <div className="rounded-md p-3 border bg-white shadow-sm mb-4">
                            <p className="text-sm text-gray-700">{message}</p>
                        </div>

                        {/* Liveness indicator - show when camera is on and detecting */}
                        {status === "detecting" && (
                            <div className="rounded-md border border-gray-200 bg-white p-3 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium">Liveness Score</h4>
                                    <span className="text-sm font-semibold">{livenessScore.toFixed(0)}%</span>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-2">
                                    <div
                                        className={`h-full transition-all duration-300 ${getLivenessColor()}`}
                                        style={{ width: `${livenessScore}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Threshold: 30%</span>
                                    <span>{livenessScore >= 30 ? "Verification threshold reached!" : `Need ${Math.max(0, 30 - livenessScore).toFixed(0)}% more`}</span>
                                </div>
                            </div>
                        )}

                        {/* Age & Gender display when detected */}
                        {ageGenderInfo && status === "detecting" && (
                            <div className="rounded-md border border-gray-200 bg-white p-3 mb-4">
                                <h4 className="text-sm font-medium mb-2">Detected Information</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded p-2 text-center">
                                        <div className="text-xs text-gray-500">Estimated Age</div>
                                        <div className="text-lg font-semibold">{ageGenderInfo.age}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2 text-center">
                                        <div className="text-xs text-gray-500">Gender</div>
                                        <div className="text-lg font-semibold">{ageGenderInfo.gender}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success state */}
                        {status === "success" && (
                            <div className="rounded-md border border-green-200 bg-green-50 p-3 mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-green-100 rounded-full p-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-medium text-green-800">Verification Successful</h4>
                                </div>
                                <p className="text-sm text-green-700">Your identity has been verified successfully.</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-auto">
                            {!showCamera && status !== "loading" ? (
                                <button
                                    onClick={startCamera}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!isModelLoaded}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Start Verification
                                </button>
                            ) : (
                                <button
                                    onClick={stopCamera}
                                    className="w-full py-2.5 px-4 bg-white text-gray-700 border border-gray-300 font-medium rounded-md shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
            </div>
        </div>
    );
};

export default FaceRecognitionComponent;
