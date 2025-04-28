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

    useEffect(() => {
        if (ensName) {
            setDisplayName(ensName);
        } else if (address) {
            setDisplayName(address); // If no ENS name, display address
        }
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
            alert('Do you have an ENS name?');
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

    const mintNebulaID = async () => {
        try {
            // @ts-ignore
            const tx = await contract.mintNebulaID(
                true, // twitterVerified
                worldcoinVerified, // humanVerified (initially false)
                nationality, // nationality (1 for Indian)
                1, // healthStatus (1 for Fit)
                750, // creditScore (1 for Good)
                92 // walletScore
            )
            await tx.wait()
            console.log("NebulaID minted successfully")
            const userTokenId = await contract.getUserTokenId(address)
            setTokenId(userTokenId.toString())
        } catch (error) {
            console.error("Error minting NebulaID:", error)
        }
    }

    const getIdentity = async () => {
        if (!contract || !tokenId) return
        try {
            const identityData = await contract.getIdentity(tokenId)
            setIdentity({
                twitterVerified: identityData.twitterVerified,
                humanVerified: identityData.humanVerified,
                nationality: ["Unspecified", "Indian", "US"][identityData.nationality],
                healthStatus: ["Unspecified", "Fit", "Unfit"][identityData.healthStatus],
                creditScore: ["Unspecified", "Good", "Bad"][identityData.creditScore],
                walletScore: identityData.walletScore.toString()
            })
        } catch (error) {
            console.error("Error getting identity:", error)
        }
    }

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
                            <div className="flex-grow flex items-center justify-center text-3xl">
                                {isConnected ? (
                                    <div className="flex items-center gap-2">
                                        {WalletScore?.stat}
                                        <MdVerified className="text-green-400" />
                                    </div>
                                ) : (
                                    <div className="text-sm">Connect your wallet</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NebulaID Section */}
                    <div className="w-full mt-8 flex flex-col items-center">
                        <p className="mb-4 text-lg">Your Token ID: {tokenId || "You don't have a NebulaID yet"}</p>

                        {!tokenId ? (
                            <button
                                onClick={mintNebulaID}
                                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                Mint Your NebulaID
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
                                <h2 className="text-xl font-semibold mb-3">Your NebulaID Identity:</h2>
                                <div className="space-y-2">
                                    <p>Twitter Verified: {identity.twitterVerified.toString()}</p>
                                    <p>Human Verified: {identity.humanVerified.toString()}</p>
                                    <p>Nationality: {identity.nationality}</p>
                                    <p>Health Status: {identity.healthStatus}</p>
                                    <p>Credit Score: {identity.creditScore}</p>
                                    <p>Wallet Score: {identity.walletScore}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
