"use client"
import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ethers, InfuraProvider, JsonRpcProvider, Wallet } from "ethers"
import { GOVERNANCE_ADDRESS } from "@/lib/contract"
import GovernanceABI from "../../../../contracts/artifacts/contracts/Governance.sol/Governance.json"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

interface Proposal {
    id: number
    name: string
    description: string
    forVotes: string
    againstVotes: string
    executed: boolean
    endTime: Date
    proposer: string
}

const Governance: React.FC = () => {
    const account = useAccount()
    const address = account.address
    const router = useRouter()

    const [proposals, setProposals] = useState<Proposal[]>([])
    const [newProposalName, setNewProposalName] = useState("")
    const [newProposalDescription, setNewProposalDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
    const infuraApiKey = process.env.INFURA_API_KEY
    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
    const [isMember, setIsMember] = useState(false)
    const [isEligible, setIsEligible] = useState(false)
    const [membershipLoading, setMembershipLoading] = useState(false)

    useEffect(() => {
        if (address && account.isConnected) {
            const fetchData = async () => {
                try {
                    await checkMembershipStatus()
                    await fetchProposals()
                } catch (error) {
                    console.error("Error fetching data:", error)
                }
            }
            fetchData()
        }
    }, [address, account.chainId, account.isConnected])

    const getGovernanceContract = () => {
        const provider = ethereumNetwork === "localhost"
            ? new JsonRpcProvider("http://127.0.0.1:8545")
            : new InfuraProvider(ethereumNetwork === "rootstockTestnet"
                ? "https://public-node.testnet.rsk.co"
                : ethereumNetwork,
                infuraApiKey);

        if (!provider) throw new Error("No Web3 Provider")

        // @ts-expect-error
        const signer = new Wallet(ethereumPrivateKey, provider)

        return new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI.abi, signer)
    }

    const checkMembershipStatus = async () => {
        try {
            const contract = getGovernanceContract()

            // Check if user is a member
            const memberStatus = await contract.isMember(address)
            setIsMember(memberStatus)

            // If not a member, check if they're eligible to join
            if (!memberStatus) {
                try {
                    // This will throw an error if the user is not eligible
                    await contract.canParticipateInGovernance.staticCall(address)
                    setIsEligible(true)
                } catch (error) {
                    setIsEligible(false)
                }
            }
        } catch (error) {
            console.error("Error checking membership status:", error)
            toast.error("Failed to check governance membership status")
        }
    }

    const fetchProposals = async () => {
        try {
            const contract = getGovernanceContract()
            const count = await contract.getProposalCount()
            const fetchedProposals: Proposal[] = []

            for (let i = 0; i < count.toNumber(); i++) {
                const proposal = await contract.getProposal(i)
                fetchedProposals.push({
                    id: i,
                    name: proposal.name,
                    description: proposal.description,
                    forVotes: ethers.formatEther(proposal.forVotes),
                    againstVotes: ethers.formatEther(proposal.againstVotes),
                    executed: proposal.executed,
                    endTime: new Date(proposal.endTime.toNumber() * 1000),
                    proposer: proposal.proposer
                })
            }
            setProposals(fetchedProposals)
        } catch (error) {
            console.error("Error fetching proposals:", error)
            toast.error("Failed to fetch proposals")
        }
    }

    const joinCommunity = async () => {
        setMembershipLoading(true)
        try {
            const contract = getGovernanceContract()

            // Show loading toast
            toast.loading("Joining governance community...", {
                id: "join-governance"
            })

            // Call the joinCommunity function
            const tx = await contract.joinCommunity()
            console.log("Transaction sent:", tx.hash)

            // Update toast to show pending transaction
            toast.loading(`Transaction pending... ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, {
                id: "join-governance"
            })

            // Wait for transaction to be mined
            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)

            // Update membership status
            setIsMember(true)

            // Show success toast
            toast.success("Successfully joined governance community!", {
                id: "join-governance",
                description: `Transaction: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`
            })

        } catch (error) {
            console.error("Error joining governance:", error)

            // Show error toast with reason if available
            toast.error("Failed to join governance community", {
                id: "join-governance",
                description: (error as any)?.reason || "Check console for details"
            })
        } finally {
            setMembershipLoading(false)
        }
    }

    const createProposal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProposalName.trim() || !newProposalDescription.trim()) return

        setLoading(true)
        try {
            console.log("Creating proposal:", newProposalName, newProposalDescription)
            const contract = getGovernanceContract()

            // Show loading toast
            toast.loading("Creating proposal...", {
                id: "create-proposal"
            })

            // For this example, we're not including execution data
            const executionData = "0x"
            const tx = await contract.createProposal(newProposalName, newProposalDescription, executionData)
            console.log("Transaction sent:", tx.hash)

            // Update toast to show pending transaction
            toast.loading(`Proposal creation pending... ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, {
                id: "create-proposal"
            })

            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)

            // Show success toast
            toast.success("Proposal Created Successfully!", {
                id: "create-proposal",
                description: `Transaction: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`
            })

            setNewProposalName("")
            setNewProposalDescription("")
            await fetchProposals()
        } catch (error) {
            console.error("Error creating proposal:", error)

            // Show error toast with reason if available
            toast.error("Failed to create proposal", {
                id: "create-proposal",
                description: (error as any)?.reason || "Check console for details"
            })
        } finally {
            setLoading(false)
        }
    }

    const vote = async (proposalId: number, support: boolean) => {
        setLoading(true)
        const toastId = `vote-${proposalId}-${support ? 'for' : 'against'}`

        try {
            const contract = getGovernanceContract()
            console.log("Voting on proposal:", proposalId, support)

            // Show loading toast
            toast.loading(`Submitting vote (${support ? 'For' : 'Against'})...`, {
                id: toastId
            })

            const tx = await contract.vote(proposalId, support)
            console.log("Transaction sent:", tx.hash)

            // Update toast to show pending transaction
            toast.loading(`Vote pending... ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, {
                id: toastId
            })

            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)

            // Show success toast
            toast.success(`Voted ${support ? 'For' : 'Against'} Successfully!`, {
                id: toastId,
                description: `Transaction: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`
            })

            await fetchProposals()
        } catch (error) {
            console.error("Error voting:", error)

            // Show error toast with reason if available
            toast.error("Failed to vote", {
                id: toastId,
                description: (error as any)?.reason || "Check console for details"
            })
        } finally {
            setLoading(false)
        }
    }

    const executeProposal = async (proposalId: number) => {
        setLoading(true)
        const toastId = `execute-${proposalId}`

        try {
            const contract = getGovernanceContract()
            console.log("Executing proposal:", proposalId)

            // Show loading toast
            toast.loading("Executing proposal...", {
                id: toastId
            })

            const tx = await contract.executeProposal(proposalId)
            console.log("Transaction sent:", tx.hash)

            // Update toast to show pending transaction
            toast.loading(`Execution pending... ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, {
                id: toastId
            })

            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)

            // Show success toast
            toast.success("Proposal Executed Successfully!", {
                id: toastId,
                description: `Transaction: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`
            })

            await fetchProposals()
        } catch (error) {
            console.error("Error executing proposal:", error)

            // Show error toast with reason if available
            toast.error("Failed to execute proposal", {
                id: toastId,
                description: (error as any)?.reason || "Check console for details"
            })
        } finally {
            setLoading(false)
        }
    }

    // New function to navigate to the AgenticID verification page
    const navigateToVerification = () => {
        router.push('/verify-identity')
    }

    if (!account.isConnected) {
        return (
            <div className="flex items-center align-middle min-h-screen text-center justify-center text-4xl font-bold">
                <div>Please connect your wallet.</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-32 py-16">
            <h1 className="text-3xl font-bold mb-6">Governance</h1>

            <div className="flex flex-col py-5">
                <h2 className="text-2xl font-semibold mb-3">Governance Community</h2>
                {!isMember ? (
                    <div className="bg-white p-5 rounded-lg shadow-sm border">
                        {isEligible ? (
                            <div>
                                <p className="mb-3">You&apos;re eligible to join governance!</p>
                                <button
                                    onClick={joinCommunity}
                                    disabled={membershipLoading}
                                    className="bg-black text-white font-bold px-4 py-2 rounded-3xl hover:bg-gray-800 transition-colors"
                                >
                                    {membershipLoading ? "Joining..." : "Join Governance"}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="text-red-600 font-semibold mb-4">
                                    You&apos;re not eligible to join governance yet.
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-medium mb-2">Requirements for governance:</h3>
                                    <ul className="list-disc list-inside space-y-1 pl-2">
                                        <li>Verify your identity with Worldcoin</li>
                                        <li>At least one other verification (ENS, Face, or Twitter)</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={navigateToVerification}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Verify Your AgenticID
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium">
                        ✓ You are a governance member
                    </div>
                )}
            </div>

            {isMember && (
                <form onSubmit={createProposal} className="mb-8 bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Create New Proposal</h3>
                    <input
                        type="text"
                        value={newProposalName}
                        onChange={(e) => setNewProposalName(e.target.value)}
                        placeholder="Enter proposal name"
                        className="w-full p-2 border rounded bg-white mb-2"
                    />
                    <textarea
                        value={newProposalDescription}
                        onChange={(e) => setNewProposalDescription(e.target.value)}
                        placeholder="Enter proposal description"
                        className="w-full p-2 border rounded bg-white mb-2"
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        {loading ? "Creating..." : "Create Proposal"}
                    </button>
                </form>
            )}

            <div>
                <h2 className="text-2xl font-semibold mb-4">Active Proposals</h2>
                {proposals.length === 0 ? (
                    <div className="text-gray-500 text-center py-10">
                        No proposals yet. Be the first to create one!
                    </div>
                ) : (
                    proposals.map((proposal) => (
                        <div key={proposal.id} className="border p-4 mb-4 rounded-lg shadow-sm bg-white">
                            <h3 className="text-xl font-semibold">{proposal.name}</h3>
                            <p className="text-gray-600 mb-2">{proposal.description}</p>
                            <div className="grid grid-cols-2 gap-4 my-3">
                                <div className="bg-green-50 p-2 rounded">
                                    <span className="font-medium">For:</span> {proposal.forVotes}
                                </div>
                                <div className="bg-red-50 p-2 rounded">
                                    <span className="font-medium">Against:</span> {proposal.againstVotes}
                                </div>
                            </div>
                            <p><span className="font-medium">Ends:</span> {proposal.endTime.toLocaleString()}</p>
                            <p><span className="font-medium">Proposer:</span> {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(proposal.proposer.length - 4)}</p>
                            {!proposal.executed && new Date() < proposal.endTime && isMember && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => vote(proposal.id, true)}
                                        disabled={loading}
                                        className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 transition-colors"
                                    >
                                        Vote For
                                    </button>
                                    <button
                                        onClick={() => vote(proposal.id, false)}
                                        disabled={loading}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                    >
                                        Vote Against
                                    </button>
                                </div>
                            )}
                            {!proposal.executed && new Date() >= proposal.endTime && (
                                <button
                                    onClick={() => executeProposal(proposal.id)}
                                    disabled={loading}
                                    className="mt-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                                >
                                    Execute Proposal
                                </button>
                            )}
                            {proposal.executed && (
                                <div className="mt-2 text-green-700 font-medium">
                                    ✓ This proposal has been executed
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Governance
