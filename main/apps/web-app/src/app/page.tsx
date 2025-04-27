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

    return (
        <div className="p-[4rem] md:p-[8rem] lg:p-[10rem] ">
            <div className="hero-content text-black text-center">
                <div className="flex flex-col w-max">
                    <div className="mb-5 text-5xl font-serif font-bold"> Get Your Universal Profile ID</div>
                    <div className="mb-5 text-xl">
                        Verify your onchain & offchain data for identity, credit score and healtcare data using
                        TLSNotary & Worldcoin.
                    </div>
                    <div className="pt-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">ENS Verification</h2>
                                        <div>
                                            {/* {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
                                            {address && <div>{ensName}</div>}
                                            <button onClick={() => disconnect()}>Disconnect</button> */}
                                            {isLoading ? (
                                                <p>Loading ENS name...</p>
                                            ) : isError ? (
                                                <p>Error fetching ENS name</p>
                                            ) : displayName ? (
                                                <p>Connected as: {displayName}</p>
                                            ) : (
                                                <p>Please connect your wallet</p>
                                            )}
                                        </div>
                                        <button
                                            className="button-link bg-black m-2 px-4 py-2 text-white rounded"
                                            onClick={signENSMessage}
                                        >
                                            Verify your ENS
                                        </button>
                                    </div>
                                </Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">Twitter Verification</h2>
                                        <p>Using TLSNotary</p>
                                        <button
                                            className="button-link bg-black m-2 px-4 py-2 text-white rounded"
                                            onClick={createReview}
                                        >
                                            Verify your Profile
                                        </button>
                                    </div>
                                </Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">Humanity Verification </h2>
                                        <IDKitWidget
                                            action={action!}
                                            app_id={app_id}
                                            onSuccess={onSuccess}
                                            handleVerify={handleProof}
                                            verification_level={VerificationLevel.Orb} // Change this to VerificationLevel.Device to accept Orb- and Device-verified users
                                        />
                                        <button
                                            className="bg-gray-800 text-white py-2 px-4 rounded-md text-sm hover:bg-gray-900 transition-colors"
                                            onClick={() => setOpen(true)}
                                        >
                                            {worldcoinVerified ? (
                                                <div>
                                                    Verified! <MdVerified className="text-green-400" />
                                                </div>
                                            ) : (
                                                "Verify with World ID"
                                            )}
                                        </button>
                                    </div>
                                </Link>
                            </div>

                        </div>
                    </div>
                    <div className="py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl">
                                        <h2 className="text-2xl font-semibold mb-4">Nationality Verification</h2>
                                        <p>Only Indian ID using AnonAdhaar </p>

                                        <div className="pt-4 align-center ">
                                            <LogInWithAnonAadhaar nullifierSeed={1234} />
                                            {anonAadhaar.status === "logged-in" && (
                                                <>
                                                    <p>✅ Proof is valid</p>
                                                    <p>Got your Aadhaar Identity Proof</p>
                                                    <>Welcome anon!</>
                                                    {latestProof && (
                                                        <AnonAadhaarProof code={JSON.stringify(latestProof, null, 2)} />
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Render the proof if generated and valid */}
                                    </div>
                                </Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">Credit Score Verification</h2>
                                        <p>Using TLSNotary (pending)</p>
                                    </div>
                                </Link>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">Wallet Score</h2>
                                        <div className="flex text-3xl justify-center">
                                            {isConnected ? (
                                                <div>
                                                    {WalletScore?.stat}
                                                    {/* <CreditCardScore /> */}
                                                    <MdVerified className="text-green-400" />

                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-sm">Connect your wallet</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-xl ">
                                <Link href="/">
                                    <div className="bg-white p-6 rounded-xl ">
                                        <h2 className="text-2xl font-semibold mb-4">Health Data</h2>
                                        <div className="flex text-xl justify-center">
                                            Coming Soon
                                            <MdOutlinePendingActions className="text-green-400 text-3xl" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            <div className="text-top">
                {_reviews.length > 0 && (
                    <button className="button-link" onClick={createReview}>
                        Add Review
                    </button>
                )}
            </div>

            {
                _reviews.length > 0 ? (
                    <div>
                        {_reviews.map((f, i) => (
                            <div key={i}>
                                <p className="box box-text">{f}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <button className="button" onClick={createReview}>
                            Create Verify
                        </button>
                    </div>
                )
            }
            <p>Your Token ID: {tokenId || "You don't have a NebulaID yet"}</p>

            {
                !tokenId && (
                    <button onClick={mintNebulaID} className="bg-black text-white px-6 py-4 rounded-xl">
                        Mint Your NebulaID
                    </button>
                )
            }

            {
                tokenId && (
                    <>
                        <button onClick={getIdentity}>Get Identity</button>
                    </>
                )
            }

            {
                identity && (
                    <div>
                        <h2>Your NebulaID Identity:</h2>
                        <p>Twitter Verified: {identity.twitterVerified.toString()}</p>
                        <p>Human Verified: {identity.humanVerified.toString()}</p>
                        <p>Nationality: {identity.nationality}</p>
                        <p>Health Status: {identity.healthStatus}</p>
                        <p>Credit Score: {identity.creditScore}</p>
                        <p>Wallet Score: {identity.walletScore}</p>
                    </div>
                )
            }
        </div >
    )
}
