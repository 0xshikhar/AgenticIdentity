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
import { NEBULAID_ADDRESS } from "@/lib/contract"
import NebulaIDNFT from "../../contract-artifacts/NebulaIDNFT.json"
import { useAccount, useEnsName } from 'wagmi';
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
    // const { data: ensName } = useEnsName({ address })
    // const { data: ensAvatar } = useEnsAvatar({ name: ensName! })
    // const { disconnect } = useDisconnect()
    const { data: ensName, isError, isLoading } = useEnsName({ address, chainId: 1 });
    const [displayName, setDisplayName] = useState<string | null>(null);

    const [ensVerified, setEnsVerified] = useState(null)

    const [provider, setProvider] = useState(null)
    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;
    const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK
    const alchemlyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS

    const { _reviews, _reviewers } = useContext(SemaphoreContext)
    const [_identity, _setIdentity] = useState<Identity>()
    const [worldcoinScore, setWorldcoinScore] = useState(0)
    const [worldcoinVerified, setWorldcoinVerified] = useState(false)
    const app_id = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`
    const action = process.env.NEXT_PUBLIC_WLD_ACTION
    const { setOpen } = useIDKit()

    const [anonAadhaar] = useAnonAadhaar()
    const [, latestProof] = useProver()

    const [contract, setContract] = useState(NEBULAID_ADDRESS)
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

    useEffect(() => {
        const ensName = async () => {
            const ensName = await publicClient.getEnsName({
                address: address,
            })
            if (ensName) {
                setDisplayName(ensName);
            } else if (address) {
                setDisplayName(address); // If no ENS name, display address
            }
        }
        ensName()
    }, [ensName, address]);

    useEffect(() => {
        const init = async () => {
            if (typeof window.ethereum !== "undefined") {
                try {
                    // @ts-ignore
                    if (typeof window !== "undefined" && window.ethereum) {
                        const provider = ethereumNetwork === "localhost"
                            ? new JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/Kd1XQbFAa3ZboKORKFNQ9mmtcrM5PbZv")
                            : new AlchemyProvider(ethereumNetwork, alchemlyApiKey);
                        if (!provider) throw new Error("No Web3 Provider")
                        // @ts-ignore
                        setProvider(provider)
                    }

                    // @ts-ignore
                    const signer = new Wallet(ethereumPrivateKey, provider)
                    const contract = new ethers.Contract(
                        NEBULAID_ADDRESS,
                        NebulaIDNFT.abi,
                        signer
                    )
                    setContract(contract as any)

                    const userTokenId = await contract.getUserTokenId(address)
                    setTokenId(userTokenId.toString())

                    // const ensRest = useEnsName({ address })
                    // console.log("ENS Name: ", ensRest)

                    // setEnsNameVar(await publicClient.getEnsName({ address: address }))
                    // console.log("ENS Name: ", ensNameVar, "Address: ", address, await publicClient.getEnsName({ address: address }))

                    setLoading(false)
                } catch (error) {
                    console.error("An error occurred:", error)
                    setLoading(false)
                }
            } else {
                console.log("Please install MetaMask")
                setLoading(false)
            }
        }
        init()
    }, [])

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

    const signENSMessage = async () => {
        if (!displayName) {
            toast.error('Do you have an ENS name?');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = `I am signing my ENS name: ${displayName} for my Nebula ID verification`;
            console.log('message:', message);

            const signedMessage = await signer.signMessage(message);
            console.log('Signed message:', signedMessage);
            setEnsVerified(signedMessage)

            // setSignedMessage(signature);
        } catch (err) {
            console.log('Failed to sign message.', err);
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
            // Define verification status
            const ensVerfStatus = ensVerified !== null;
            const faceVerfStatus = faceVerificationData?.success || false;
            const twitterVerfStatus = true; // Update based on your Twitter verification logic
            
            // Calculate wallet score or use the one fetched from API
            const finalWalletScore = walletScore || 0;
            
            // For now, we're setting a default Farcaster score
            const farcasterScore = 0;
            
            // @ts-ignore
            const tx = await contract.mintAgenticID(
                ensVerfStatus, // ENS verified
                faceVerfStatus, // Face verified
                twitterVerfStatus, // Twitter verified
                worldcoinVerified, // Worldcoin verified (human verification)
                anonAadhaar.status === "logged-in" ? "Indian" : "Unspecified", // Nationality as string
                finalWalletScore, // Wallet score
                farcasterScore // Farcaster score
            );
            
            await tx.wait();
            toast.success("AgenticID minted successfully");
            
            const userTokenId = await contract.getUserTokenId(address);
            setTokenId(userTokenId.toString());
        } catch (error) {
            console.error("Error minting AgenticID:", error);
            toast.error("Failed to mint AgenticID");
        }
    };

    const getIdentity = async () => {
        if (!contract || !tokenId) return;
        try {
            const identityData = await contract.getIdentity(tokenId);
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
        } catch (error) {
            console.error("Error getting identity:", error);
            toast.error("Failed to fetch identity data");
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
                        {/* ENS Verification Card */}

                        <div className="flex flex-col items-center bg-white p-10 rounded-xl shadow-md h-full">
                            <h2 className="text-xl md:text-2xl font-semibold mb-3">ENS Verification</h2>
                            <div className="mb-4 flex-grow">
                                {isLoading ? (
                                    <p>Loading ENS name...</p>
                                ) : isError ? (
                                    <p>Seems like you don&apos;t have an ENS name :( </p>
                                ) : displayName ? (
                                    <p>Connected as: {displayName}</p>
                                ) : (
                                    <p>Please connect your wallet</p>
                                )}
                            </div>
                            <button
                                className="bg-black py-2 px-6 text-white rounded hover:bg-gray-800 transition-colors"
                                onClick={signENSMessage}
                            >
                                Verify your ENS
                            </button>
                        </div>

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
                                                className={`w-3 h-3 rounded-full ${
                                                    apiConnectionStatus === 'connected' ? 'bg-green-500' : 
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
                                            <div className="text-sm">Click the button to calculate your score</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AgenticID Section */}
                    <div className="w-full mt-8 flex flex-col items-center">
                        <p className="mb-4 text-lg">Your Token ID: {tokenId || "You don't have a AgenticID yet"}</p>

                        {!tokenId ? (
                            <button
                                onClick={mintAgenticID}
                                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Mint Your AgenticID
                            </button>
                        ) : (
                            <button
                                onClick={getIdentity}
                                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Get Identity
                            </button>
                        )}

                        {identity && (
                            <div className="mt-6 p-5 bg-white rounded-xl shadow-md w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-3">Your AgenticID Identity:</h2>
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
