// @ts-nocheck
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useCallback, useContext, useEffect, useState } from "react"
import LogsContext from "../context/LogsContext"
import SemaphoreContext from "@/context/SemaphoreContext"
import { Identity } from "@semaphore-protocol/core"
import { VerificationLevel, IDKitWidget, useIDKit } from "@worldcoin/idkit"
import type { ISuccessResult } from "@worldcoin/idkit"
import { verify } from "./actions/verify"
import { WalletScore } from "@/context/WalletScore"
// import { CreditCardScore } from "@/context/CreditScore"
import { MdOutlinePendingActions } from "react-icons/md"
import { MdVerified } from "react-icons/md"
import { AnonAadhaarProof, LogInWithAnonAadhaar, useAnonAadhaar, useProver } from "@anon-aadhaar/react"
import { IDENTITY_ADDRESS } from "@/lib/contract"
import AgenticIDNFT from "../../../contracts/artifacts/contracts/AgenticID.sol/AgenticIDNFT.json"
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi';
import { signMessage } from '@wagmi/core'
import config from '@/app/providers'
import { ethers, Contract, JsonRpcProvider, Wallet, AlchemyProvider } from "ethers"
// import { publicClient } from '@/lib/contract'
import FaceButton from "@/components/FaceButton"
import { FaceVerificationData } from '@/components/FaceButton'
import { toast } from 'sonner'
import axios from "axios"


type HomeProps = {
    setUseTestAadhaar: (state: boolean) => void
    useTestAadhaar: boolean
}

export default function HomePage() {
    const router = useRouter()
    const { setLogs } = useContext(LogsContext)
    const { address, isConnected } = useAccount()
    const { data: ensName, isError: ensError, isLoading: ensLoading } = useEnsName({
        address,
        chainId: 1
    });
    const { data: ensAvatar } = useEnsAvatar({
        name: ensName || undefined,
        chainId: 1
    });
    const [displayName, setDisplayName] = useState<string | null>(null);

    const [fetchingEns, setFetchingEns] = useState(false);
    const [ensData, setEnsData] = useState({
        name: null,
        avatar: null,
        error: null,
        status: 'idle' // idle, loading, success, error
    });
    const [ensVerified, setEnsVerified] = useState(null);

    const [provider, setProvider] = useState(null)
    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;
    const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK
    const alchemlyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS
    const ethereumMainnetAlchemyApiKey = process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_ALCHEMY_API_KEY

    const { _reviews, _reviewers } = useContext(SemaphoreContext)
    const [_identity, _setIdentity] = useState<Identity>()
    const [worldcoinScore, setWorldcoinScore] = useState(0)
    const [worldcoinVerified, setWorldcoinVerified] = useState(false)
    const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`
    const action = process.env.NEXT_PUBLIC_WLD_ACTION
    const { setOpen } = useIDKit()

    const [anonAadhaar] = useAnonAadhaar()
    const [, latestProof] = useProver()

    const [contract, setContract] = useState(IDENTITY_ADDRESS)
    const [loading, setLoading] = useState(true)
    const [tokenId, setTokenId] = useState(null)
    const [identity, setIdentity] = useState(null)
    const [nationality, setNationality] = useState(0)
    const [identityStatus, setIdentityStatus] = useState(false)

    // Add new state for face verification data
    const [faceVerificationData, setFaceVerificationData] = useState<FaceVerificationData | null>(null);

    const [walletScore, setWalletScore] = useState<number | null>(null);
    const [walletScoreLoading, setWalletScoreLoading] = useState(false);
    const [walletScoreError, setWalletScoreError] = useState<string | null>(null);
    const [scoreFactors, setScoreFactors] = useState<any[]>([]);

    // Add these new state variables near your other state declarations
    const [apiConnectionStatus, setApiConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);

    // useEffect(() => {
    //     if (address && ensName) {
    //         setDisplayName(ensName);
    //         console.log("ENS data:", ensName, ensAvatar);
    //     } else if (address) {
    //         // If there's no ENS name, use the truncated address
    //         setDisplayName(address.slice(0, 6) + '...' + address.slice(-4));
    //     } else {
    //         setDisplayName(null);
    //     }
    // }, [ensName, ensAvatar, address]);

    useEffect(() => {
        const init = async () => {
            try {
                // Create a more reliable provider
                let provider;
                if (ethereumNetwork === "localhost") {
                    provider = new JsonRpcProvider("http://localhost:8545");
                } else {
                    // Default to RSK testnet or whatever your default is
                    provider = new JsonRpcProvider("https://public-node.testnet.rsk.co");
                }
                
                // Ensure provider is connected
                await provider.getBlockNumber();
                console.log("Provider connected successfully");
                
                // Only proceed if we're connected to a wallet
                if (isConnected && address) {
                    // For server-side contract interactions
                    if (ethereumPrivateKey) {
                        const signer = new Wallet(ethereumPrivateKey, provider);
                        const contract = new Contract(
                            IDENTITY_ADDRESS,
                            AgenticIDNFT.abi,
                            signer
                        );
                        setContract(contract);
                        
                        try {
                            // Try to get token ID to verify connection works
                            const userTokenId = await contract.getUserTokenId(address);
                            setTokenId(userTokenId.toString());
                            console.log("Connected to contract successfully, token ID:", userTokenId.toString());
                        } catch (error) {
                            console.warn("No token found for this address or contract error:", error);
                            // This is normal for users who haven't minted yet
                        }
                    } else {
                        console.warn("No private key available for server-side contract interaction");
                    }
                } else {
                    console.log("Wallet not connected yet, deferring contract initialization");
                }
                
                setProvider(provider);
                setLoading(false);
            } catch (error) {
                console.error("Failed to initialize web3 connection:", error);
                toast.error("Failed to connect to blockchain", {
                    description: "Please check your network connection and try again."
                });
                setLoading(false);
            }
        };
        
        init();
    }, [isConnected, address]); // Re-run when wallet connection changes

    useEffect(() => {
        if (anonAadhaar.status === "logged-in") {
            setNationality(1)
            console.log(anonAadhaar.status)
        }
    }, [anonAadhaar])

    useEffect(() => {
        const privateKey = localStorage.getItem("identity")

        if (privateKey) {
            const identity = new Identity(privateKey)

            setLogs("Your Semaphore identity has been retrieved from the browser cache 👌🏽")

            _setIdentity(identity)
            setIdentityStatus(true)
        }
    }, [setLogs])

    const createReview = useCallback(async () => {
        if (_identity && reviewerHasJoined(_identity)) {
            router.push("/review")
        } else {
            router.push("/prove")
        }
    }, [router, _reviewers, _identity])

    const reviewerHasJoined = useCallback(
        (identity: Identity) => {
            return _reviewers.includes(identity.commitment.toString())
        },
        [_reviewers]
    )

    // Function to explicitly fetch ENS data
    const fetchEnsData = async () => {
        if (!isConnected || !address) {
            toast.error('Please connect your wallet first');
            return;
        }

        try {
            setEnsData(prev => ({ ...prev, status: 'loading' }));
            setFetchingEns(true);

            // Use wagmi's getEnsName function directly for more control
            const provider = new ethers.JsonRpcProvider(ethereumMainnetAlchemyApiKey);
            const name = await provider.lookupAddress(address);

            let avatar = null;
            if (name) {
                // If we have a name, try to get the avatar
                const avatar = await provider.getAvatar(`${name}`)
                console.log(avatar);
            }

            setEnsData({
                name: name,
                avatar: avatar,
                error: null,
                status: name ? 'success' : 'error'
            });

            if (!name) {
                toast.warning('No ENS name found for this address');
            } else {
                console.log("Found ENS:", name, "Avatar:", avatar);
                toast.success(`Found ENS name: ${name}`);
            }
        } catch (error) {
            console.error('Error fetching ENS data:', error);
            setEnsData({
                name: null,
                avatar: null,
                error: error.message,
                status: 'error'
            });
            toast.error('Failed to fetch ENS data');
        } finally {
            setFetchingEns(false);
        }
    };

    // Updated verification function
    const signENSMessage = async () => {
        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!ensData.name) {
            toast.warning('Please fetch your ENS name first');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = `I am signing my ENS name: ${ensData.name} for my Agentic ID verification`;
            console.log('message:', message);

            const signedMessage = await signer.signMessage(message);
            console.log('Signed message:', signedMessage);
            setEnsVerified(signedMessage);

            toast.success('ENS name successfully verified!');
        } catch (err) {
            console.error('Failed to sign message.', err);
            toast.error('Failed to verify ENS name');
        }
    };

    const onSuccess = (result: ISuccessResult) => {
        // This is where you should perform frontend actions once a user has been verified, such as redirecting to a new page
        window.alert("Successfully verified with World ID! Your nullifier hash is: " + result.nullifier_hash)
    }

    // const ensName = await publicClient.getEnsName({
    //     address: address,
    // })

    const handleProof = async (result: ISuccessResult) => {
        console.log("Proof received from IDKit, sending to backend:\n", JSON.stringify(result)) // Log the proof from IDKit to the console for visibility
        const data = await verify(result)
        if (data.success) {
            setWorldcoinScore(1)
            setWorldcoinVerified(true)
            console.log("Successful response from backend:\n", JSON.stringify(data)) // Log the response from our backend for visibility
        } else {
            throw new Error(`Verification failed: ${data.detail}`)
        }
    }

    const mintAgenticID = async () => {
        try {
            // Check if we have a valid contract instance
            if (!contract) {
                toast.error("Contract not initialized", {
                    description: "Please make sure your wallet is connected and try again."
                });
                return;
            }
            
            // Check verification statuses
            const ensVerfStatus = ensVerified !== null;
            const faceVerfStatus = faceVerificationData?.success || false;
            const twitterVerfStatus = false; // Assuming Twitter verification is not implemented yet
            const worldcoinVerfStatus = worldcoinVerified;
            const aadhaarVerfStatus = anonAadhaar.status === "logged-in";
            
            // Check if at least one verification is complete
            const hasAnyVerification = ensVerfStatus || faceVerfStatus || twitterVerfStatus || 
                                      worldcoinVerfStatus || aadhaarVerfStatus;
            
            if (!hasAnyVerification) {
                toast.error("Please complete at least one verification", {
                    description: "You need to verify at least one feature (ENS, Face, Worldcoin, or Nationality) before minting your AgenticID.",
                    duration: 5000
                });
                return;
            }
            
            // Start minting process
            toast.loading("Preparing transaction...");
            
            // Try to get a browser provider if available for user transactions
            let mintingContract = contract;
            
            if (window.ethereum) {
                try {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await browserProvider.getSigner();
                    mintingContract = new Contract(
                        IDENTITY_ADDRESS, 
                        AgenticIDNFT.abi,
                        signer
                    );
                    console.log("Using browser wallet for transaction");
                } catch (error) {
                    console.warn("Could not connect browser wallet, falling back to server wallet:", error);
                    // Continue with server wallet
                }
            }
            
            // Determine nationality string
            const nationalityString = aadhaarVerfStatus 
                ? "Indian" 
                : "Unspecified";
            
            // Calculate wallet score or use the one fetched from API
            const finalWalletScore = walletScore || 0;
            
            // For now, we're setting a default Farcaster score
            const farcasterScore = 0;

            toast.loading("Waiting for wallet confirmation...");
            
            const tx = await mintingContract.mintAgenticID(
                ensVerfStatus,           // ENS verified
                faceVerfStatus,          // Face verified
                twitterVerfStatus,       // Twitter verified (default false for now)
                worldcoinVerfStatus,     // Worldcoin verified
                nationalityString,       // Nationality as string
                finalWalletScore,        // Wallet score
                farcasterScore           // Farcaster score
            );

            toast.loading("Transaction submitted, waiting for confirmation...");
            console.log("Minting transaction submitted:", tx.hash);
            
            await tx.wait();
            toast.dismiss();
            toast.success("AgenticID minted successfully", {
                description: "Your verifiable identity has been created on the blockchain!"
            });

            // Update token ID in state
            const userTokenId = await mintingContract.getUserTokenId(address);
            setTokenId(userTokenId.toString());
            console.log("New token ID:", userTokenId.toString());
            
            // Automatically fetch the newly minted identity
            getIdentity();
        } catch (error) {
            toast.dismiss();
            console.error("Error minting AgenticID:", error);
            
            // Create a more user-friendly error message
            let errorMessage = "Failed to mint AgenticID";
            
            if (error.message && error.message.includes("User already has an NFT")) {
                errorMessage = "You already have an AgenticID minted";
                
                // If the user already has an NFT, try to get their token ID
                try {
                    const userTokenId = await contract.getUserTokenId(address);
                    if (userTokenId && userTokenId.toString() !== "0") {
                        setTokenId(userTokenId.toString());
                        toast.info("Retrieved your existing AgenticID", {
                            description: "Loading your identity data now..."
                        });
                        // Get the identity data for the existing token
                        getIdentity();
                        return;
                    }
                } catch (fetchError) {
                    console.error("Error fetching existing token:", fetchError);
                }
            } else if (error.code === 'ACTION_REJECTED') {
                errorMessage = "Transaction rejected in your wallet";
            } else if (error.message && error.message.includes("missing provider")) {
                errorMessage = "Connection to blockchain failed";
            }
            
            toast.error(errorMessage, {
                description: error.reason || error.message || "Please try again or check console for details"
            });
        }
    };

    const getIdentity = async () => {
        if (!contract) {
            toast.error("Contract not initialized", { 
                description: "Please make sure your wallet is connected." 
            });
            return;
        }
        
        try {
            // If there's no tokenId, we'll try to get it from the contract first
            if (!tokenId) {
                try {
                    const userTokenId = await contract.getUserTokenId(address);
                    // If the token ID is valid (not 0), we set it and continue
                    if (userTokenId && userTokenId.toString() !== "0") {
                        setTokenId(userTokenId.toString());
                        console.log("Found existing token ID:", userTokenId.toString());
                    } else {
                        // No token found, let's mint one
                        console.log("No token found, initiating minting process");
                        toast.info("You don't have an AgenticID yet", {
                            description: "Starting the minting process now..."
                        });
                        await mintAgenticID();
                        return; // mintAgenticID will call getIdentity again when done
                    }
                } catch (error) {
                    console.log("Error checking token existence:", error);
                    toast.info("You don't have an AgenticID yet", {
                        description: "Starting the minting process now..."
                    });
                    await mintAgenticID();
                    return; // mintAgenticID will call getIdentity again when done
                }
            }
            
            // If we have a tokenId, we fetch the identity data
            toast.loading("Fetching your identity data...");
            const identityData = await contract.getIdentity(tokenId);
            toast.dismiss();
            
            setIdentity({
                ensVerified: identityData.ensVerified,
                faceVerified: identityData.faceVerified,
                twitterVerified: identityData.twitterVerified,
                worldcoinVerified: identityData.worldcoinVerified,
                nationality: identityData.nationality,
                walletScore: identityData.walletScore.toString(),
                farcasterScore: identityData.farcasterScore.toString(),
                lastUpdated: new Date(Number(identityData.lastUpdated) * 1000).toLocaleString()
            });
            
            toast.success("Identity data loaded successfully");
        } catch (error) {
            console.error("Error getting identity:", error);
            
            // Check if the error is because the token doesn't exist
            if (error.message && (
                error.message.includes("Identity does not exist") || 
                error.message.includes("nonexistent token") ||
                error.message.includes("invalid token ID")
            )) {
                toast.info("Your AgenticID needs to be created", {
                    description: "Starting the minting process now..."
                });
                // Clear the invalid tokenId
                setTokenId(null);
                // Start the minting process
                await mintAgenticID();
            } else {
                // For other types of errors, show the error message
                toast.error("Failed to fetch identity data", {
                    description: error.reason || error.message || "Please try again later"
                });
            }
        }
    };

    // Add handler for face verification completion
    const handleFaceVerificationComplete = (data: FaceVerificationData) => {
        console.log("Face verification completed:", data);
        setFaceVerificationData(data);

        // If verification was successful, you could update other state as needed
        if (data.success) {
            // For example, you might want to track that human verification is complete
            // or update some other state related to identity verification
        }
    };

    // Add this new function to test the API connection
    const testApiConnection = async () => {
        try {
            setApiConnectionStatus('unknown');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            setDebugData({
                apiUrl,
                testingTime: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                walletConnected: isConnected,
                walletAddress: address
            });

            // Try to make a simple request to check if the API is available
            const response = await axios.get(`${apiUrl}/health`, { timeout: 5000 });
            console.log("API health check response:", response.data);

            setApiConnectionStatus('connected');
            setDebugData(prev => ({
                ...prev,
                connectionStatus: 'connected',
                healthResponse: response.data
            }));

            return true;
        } catch (error) {
            console.error("API connection test failed:", error);
            setApiConnectionStatus('disconnected');
            setDebugData(prev => ({
                ...prev,
                connectionStatus: 'disconnected',
                error: {
                    message: error.message,
                    name: error.name,
                    code: error.code
                }
            }));

            return false;
        }
    };

    // Enhance the existing fetchWalletScore function
    const fetchWalletScore = async (walletAddress: string) => {
        setWalletScoreLoading(true);
        setWalletScoreError(null);

        try {
            // First check if API is accessible
            const isApiConnected = await testApiConnection();
            if (!isApiConnected) {
                throw new Error("Cannot connect to the wallet score API. Please check if the server is running.");
            }

            console.log(`Fetching wallet score for: ${walletAddress}`);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            console.log(`Using API URL: ${apiUrl}/api/score/${walletAddress}`);

            const response = await axios.get(`${apiUrl}/api/score/${walletAddress}`, {
                timeout: 10000 // Add a reasonable timeout
            });
            console.log("API response:", response.data);

            if (response.data.success) {
                setWalletScore(response.data.data.score);
                setScoreFactors(response.data.data.factors || []);

                toast.success('Wallet score successfully retrieved', {
                    description: `Score: ${response.data.data.score}/100`,
                    duration: 5000,
                });
            } else {
                console.error("API returned success: false", response.data);
                throw new Error(response.data.error || "Failed to get wallet score");
            }
        } catch (error) {
            let errorMessage = "Unknown error";

            if (error.code === 'ERR_NETWORK') {
                errorMessage = "Network error: Unable to connect to the API server. Please check if the server is running.";
            } else if (error.response) {
                // Server responded with an error status code
                errorMessage = `Server error (${error.response.status}): ${error.response?.data?.error || error.message}`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = "No response from server. The request was made but no response was received.";
            } else {
                // Something else happened while setting up the request
                errorMessage = error.message || "Failed to fetch wallet score";
            }

            console.error("Error fetching wallet score:", error);
            console.error("Error details:", errorMessage);
            setWalletScoreError(errorMessage);

            toast.error('Failed to fetch wallet score', {
                description: errorMessage,
                duration: 5000,
            });
        } finally {
            setWalletScoreLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-8 lg:p-10">
            <div className="text-black text-center max-w-6xl w-full">
                <div className="flex flex-col items-center pt-10">
                    <div className="flex flex-col items-center py-10">
                        <h1 className="mb-5 text-4xl md:text-5xl font-serif font-bold">Get Your Agentic Verifiable Identity</h1>
                        <p className="mb-8 text-lg md:text-xl">
                            Verify your onchain & offchain data for identity and credit score using ZK proofs & AI models.
                        </p>
                    </div>
                    {/* First row of cards */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">

                        {/* Face Verification Card */}
                        <div className="bg-white p-10 rounded-xl shadow-md h-full flex flex-col">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Face Verification</h2>
                            <div className="flex-grow">
                                <p className="mb-4">Complete a quick face scan to verify your liveliness as a human.</p>

                                {/* Show verification data if available */}
                                {faceVerificationData && (
                                    <div className="mt-2 mb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">Status:</span>
                                            <span className={faceVerificationData.success ? "text-green-600" : "text-red-600"}>
                                                {faceVerificationData.success ? "Verified" : "Not Verified"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">Liveness Score:</span>
                                            <span>{faceVerificationData.livenessScore.toFixed(0)}%</span>
                                        </div>

                                        {faceVerificationData.ageGender && (
                                            <>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">Age Estimate:</span>
                                                    <span>{faceVerificationData.ageGender.age}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Gender:</span>
                                                    <span>{faceVerificationData.ageGender.gender}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center mt-auto">
                                <FaceButton
                                    className="px-6"
                                    buttonText="Verify Liveness"
                                    onVerificationComplete={handleFaceVerificationComplete}
                                />
                            </div>
                        </div>


                        {/* ENS Verification Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">ENS Verification</h2>
                            <div className="mb-4 flex-grow w-full">
                                {!isConnected ? (
                                    <p className="text-center">Please connect your wallet first</p>
                                ) : ensData.status === 'loading' ? (
                                    <div className="flex justify-center items-center h-24">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                    </div>
                                ) : ensData.status === 'success' && ensData.name ? (
                                    <div className="flex flex-col items-center">
                                        <p className="font-semibold text-lg">{ensData.name}</p>
                                        {ensData.avatar && (
                                            <img
                                                src={ensData.avatar}
                                                alt={`${ensData.name} avatar`}
                                                className="w-12 h-12 rounded-full mt-2"
                                            />
                                        )}
                                        {ensVerified && (
                                            <div className="flex items-center mt-2 text-green-500">
                                                <MdVerified className="mr-1" />
                                                <span>Verified</span>
                                            </div>
                                        )}
                                    </div>
                                ) : ensData.status === 'error' ? (
                                    <p className="text-center text-red-500">
                                        {ensData.error || "No ENS name found for this address"}
                                    </p>
                                ) : (
                                    <p className="text-center">Click &quot;Fetch ENS&quot; to check your ENS name</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {/* Fetch ENS Button */}
                                <button
                                    className="bg-gray-800 py-2 px-4 text-white rounded hover:bg-gray-700 transition-colors flex-1"
                                    onClick={fetchEnsData}
                                    disabled={!isConnected || fetchingEns}
                                >
                                    {fetchingEns ? (
                                        <span className="flex items-center justify-center">
                                            <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>
                                            Fetching...
                                        </span>
                                    ) : "Fetch ENS"}
                                </button>

                                {/* Verify ENS Button */}
                                <button
                                    className={`py-2 px-4 rounded transition-colors flex-1 ${ensVerified
                                            ? "bg-green-500 hover:bg-green-600 text-white"
                                            : "bg-black hover:bg-gray-800 text-white"
                                        }`}
                                    onClick={signENSMessage}
                                    disabled={!isConnected || !ensData.name || fetchingEns}
                                >
                                    {ensVerified ? "ENS Verified ✓" : "Verify ENS"}
                                </button>
                            </div>
                        </div>

                        {/* Wallet Score Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Wallet Score</h2>
                            <div className="flex-grow flex flex-col items-center justify-center w-full">
                                {!isConnected ? (
                                    <div className="text-sm">Connect your wallet</div>
                                ) : (
                                    <>
                                        {/* API Status Indicator */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${apiConnectionStatus === 'connected' ? 'bg-green-500' :
                                                    apiConnectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`}
                                            ></div>
                                            <span className="text-xs">
                                                {apiConnectionStatus === 'connected' ? 'API Connected' :
                                                    apiConnectionStatus === 'disconnected' ? 'API Disconnected' : 'API Status Unknown'}
                                            </span>
                                            <button
                                                onClick={testApiConnection}
                                                className="text-xs text-blue-500 underline"
                                            >
                                                Test
                                            </button>
                                        </div>

                                        {/* Manual fetch button */}
                                        <button
                                            onClick={() => fetchWalletScore(address)}
                                            className="bg-black text-white py-2 px-6 mb-4 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                                            disabled={walletScoreLoading}
                                        >
                                            {walletScoreLoading ? 'Loading...' : 'Get Wallet Score'}
                                        </button>

                                        {/* Debug button */}
                                        <button
                                            onClick={() => setShowDebugInfo(!showDebugInfo)}
                                            className="text-xs text-gray-500 mb-3 underline"
                                        >
                                            {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
                                        </button>

                                        {/* Debug info */}
                                        {showDebugInfo && debugData && (
                                            <div className="mb-4 p-3 bg-gray-100 rounded text-xs w-full overflow-auto max-h-40">
                                                <pre>{JSON.stringify(debugData, null, 2)}</pre>
                                            </div>
                                        )}

                                        {walletScoreLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                            </div>
                                        ) : walletScoreError ? (
                                            <div className="text-red-500 text-sm">Error: {walletScoreError}</div>
                                        ) : walletScore !== null ? (
                                            <>
                                                <div className="text-4xl font-bold mb-2 flex items-center gap-2">
                                                    {walletScore}
                                                    <MdVerified className="text-green-400" />
                                                </div>
                                                {scoreFactors.length > 0 && (
                                                    <div className="mt-3 w-full">
                                                        <h3 className="text-sm font-medium mb-2">Top factors:</h3>
                                                        <div className="space-y-2">
                                                            {scoreFactors.slice(0, 3).map((factor, index) => (
                                                                <div key={index} className="text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span>{factor.name}</span>
                                                                        <span>{factor.contribution.toFixed(1)}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-green-600 h-1.5 rounded-full"
                                                                            style={{ width: `${factor.score}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-sm"> calculate your onchain reputation score</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>


                        {/* Twitter Verification Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Twitter Verification</h2>
                            <p className="mb-4 flex-grow">Using TLSNotary</p>
                            <button
                                className="bg-black py-2 px-6 text-white rounded hover:bg-gray-800 transition-colors"
                                onClick={createReview}
                            >
                                Verify your Profile
                            </button>
                        </div>

                        {/* Humanity Verification Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Humanity Verification</h2>
                            <div className="hidden">
                                <IDKitWidget
                                    action={action!}
                                    app_id={app_id}
                                    onSuccess={onSuccess}
                                    handleVerify={handleProof}
                                    verification_level={VerificationLevel.Orb}
                                />
                            </div>
                            <div className="flex-grow mb-4"></div>
                            <button
                                className="bg-black py-2 px-6 text-white rounded hover:bg-gray-800 transition-colors"
                                onClick={() => setOpen(true)}
                            >
                                {worldcoinVerified ? (
                                    <div className="flex items-center justify-center gap-2">
                                        Verified! <MdVerified className="text-green-400" />
                                    </div>
                                ) : (
                                    "Verify with World ID"
                                )}
                            </button>
                        </div>

                        {/* Nationality Verification Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Nationality Verification</h2>
                            <p className="mb-2">Only Indian ID using AnonAdhaar</p>
                            <div className="flex-grow flex flex-col justify-center items-center">
                                <LogInWithAnonAadhaar nullifierSeed={1234} />
                                {anonAadhaar.status === "logged-in" && (
                                    <div className="mt-2 text-center text-green-400">
                                        <p>✅ Proof is valid</p>
                                        <p>Got your Aadhaar Identity Proof</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Credit Score Verification Card */}
                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">Credit Score Verification</h2>
                            <p className="flex-grow">Using TLSNotary (pending)</p>
                        </div>

                    </div>

                    {/* AgenticID Section */}
                    <div className="w-full mt-8 flex flex-col items-center">
                        <p className="mb-4 text-lg">Your Token ID: {tokenId || "You don't have a AgenticID yet"}</p>

                        {!tokenId ? (
                            <button
                                onClick={mintAgenticID}
                                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                        Processing...
                                    </span>
                                ) : (
                                    "Mint Your AgenticID"
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={getIdentity}
                                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                        Loading...
                                    </span>
                                ) : (
                                    "Get Identity"
                                )}
                            </button>
                        )}

                        {identity && (
                            <div className="mt-6 p-5 bg-white rounded-xl shadow-md w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-3">Your AgenticID Identity:</h2>
                                {/* nft image */}
                                <img src={i} alt="AgenticID" className="w-full h-40 object-cover rounded-lg mb-4" />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">ENS Verified:</span>
                                        <span className={identity.ensVerified ? "text-green-600" : "text-red-600"}>
                                            {identity.ensVerified ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Face Verified:</span>
                                        <span className={identity.faceVerified ? "text-green-600" : "text-red-600"}>
                                            {identity.faceVerified ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Twitter Verified:</span>
                                        <span className={identity.twitterVerified ? "text-green-600" : "text-red-600"}>
                                            {identity.twitterVerified ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Worldcoin Verified:</span>
                                        <span className={identity.worldcoinVerified ? "text-green-600" : "text-red-600"}>
                                            {identity.worldcoinVerified ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <p><span className="font-medium">Nationality:</span> {identity.nationality}</p>
                                    <p><span className="font-medium">Wallet Score:</span> {identity.walletScore}/100</p>
                                    <p><span className="font-medium">Farcaster Score:</span> {identity.farcasterScore}/100</p>
                                    <p><span className="font-medium">Last Updated:</span> {identity.lastUpdated}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
