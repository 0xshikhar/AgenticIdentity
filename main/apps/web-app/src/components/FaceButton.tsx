"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { CiCamera } from "react-icons/ci";


// Dynamically import the FaceRecognition component to prevent SSR issues
const FaceRecognitionComponent = dynamic(
    () => import("./FaceRecognition"),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-500">Loading face recognition...</p>
            </div>
        ),
    }
);

interface FaceButtonProps {
    buttonText?: string;
    className?: string;
}

const FaceButton: React.FC<FaceButtonProps> = ({
    buttonText = "Verify Liveliness",
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close modal when pressing Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 py-2 px-4 bg-black hover:bg-gray-700 text-white font-medium rounded-md shadow-sm transition-colors ${className}`}
            >
                <CiCamera className="text-2xl font-bold" />
                {buttonText}
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    {/* Modal Content */}
                    <div
                        ref={modalRef}
                        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto animate-fade-in"
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Face Verification</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Complete a quick face scan to verify your identity.
                                No data is stored during this process.
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4">
                            <FaceRecognitionComponent />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md shadow-sm transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Add fade-in animation
const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

export default FaceButton;
