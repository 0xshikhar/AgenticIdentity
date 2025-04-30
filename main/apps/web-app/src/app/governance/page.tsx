"use client"
import React, { useState, useEffect, useCallback } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
// Remove ethers imports if no longer needed elsewhere, keep JsonRpcProvider if needed for other things
// import { ethers, InfuraProvider, JsonRpcProvider, Wallet } from "ethers"
import { GOVERNANCE_ADDRESS, IDENTITY_ADDRESS } from "@/lib/contract" 
import GovernanceABI from "../../../../contracts/artifacts/contracts/Governance.sol/Governance.json"
import AgenticIDNFT from "../../../../contracts/artifacts/contracts/AgenticID.sol/AgenticIDNFT.json" // Import AgenticID ABI
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { formatEther } from "viem" // Import formatEther from viem

interface Proposal {
    id: bigint // Use bigint for IDs from contract
    name: string
    description: string
    forVotes: string // Keep as string after formatting
    againstVotes: string // Keep as string after formatting
    executed: boolean
    endTime: Date
    proposer: string
}

const Governance: React.FC = () => {
    const account = useAccount()
    const address = account.address
    const router = useRouter()
    const publicClient = usePublicClient() // Get public client using the hook

    const [proposals, setProposals] = useState<Proposal[]>([])
    const [newProposalName, setNewProposalName] = useState("")
    const [newProposalDescription, setNewProposalDescription] = useState("")
    // const [loading, setLoading] = useState(false) // Will be handled by wagmi hooks mostly
    // Remove unused env vars if not needed elsewhere
    // const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
    // const infuraApiKey = process.env.INFURA_API_KEY
    // const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY // REMOVE THIS - SECURITY RISK

    // --- State for wagmi write hooks ---
    const [joinTxHash, setJoinTxHash] = useState<`0x${string}` | undefined>()
    const [createProposalTxHash, setCreateProposalTxHash] = useState<`0x${string}` | undefined>()
    const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | undefined>()
    const [executeTxHash, setExecuteTxHash] = useState<`0x${string}` | undefined>()

    // --- Wagmi Hooks for Contract Interaction ---

    // Hook to check membership status
    const { data: isMember, refetch: refetchIsMember, isLoading: isLoadingMemberStatus } = useReadContract({
        address: GOVERNANCE_ADDRESS,
        abi: GovernanceABI.abi,
        functionName: 'isMember',
        args: [address],
        query: {
            enabled: !!address, // Only run query if address is available
        },
    })

    // Hook to check eligibility
    const { data: isEligible, refetch: refetchIsEligible, isLoading: isLoadingEligibility } = useReadContract({
        address: GOVERNANCE_ADDRESS,
        abi: GovernanceABI.abi,
        functionName: 'canParticipateInGovernance',
        args: [address],
        query: {
            enabled: !!address && !isMember, // Only run if address exists and user is not already a member
        },
    })

    // Hook to fetch proposal count
    const { data: proposalCountData, refetch: refetchProposalCount } = useReadContract({
        address: GOVERNANCE_ADDRESS,
        abi: GovernanceABI.abi,
        functionName: 'getProposalCount',
        query: {
            enabled: !!address,
        },
    })
    const proposalCount = proposalCountData ? BigInt(proposalCountData.toString()) : BigInt(0);

    // --- Wagmi Write Hooks ---
    const { writeContractAsync: joinCommunityWrite, isPending: isJoining } = useWriteContract()
    const { writeContractAsync: createProposalWrite, isPending: isCreatingProposal } = useWriteContract()
    const { writeContractAsync: voteWrite, isPending: isVoting } = useWriteContract()
    const { writeContractAsync: executeProposalWrite, isPending: isExecuting } = useWriteContract()

    // --- Wagmi Hooks for Transaction Receipts ---
    const { isLoading: isConfirmingJoin, isSuccess: isJoinSuccess } = useWaitForTransactionReceipt({ hash: joinTxHash })
    const { isLoading: isConfirmingCreate, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createProposalTxHash })
    const { isLoading: isConfirmingVote, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({ hash: voteTxHash })
    const { isLoading: isConfirmingExecute, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({ hash: executeTxHash })

    // Add a new state for NFT ownership
    const [hasAgenticID, setHasAgenticID] = useState<boolean>(false)
    const [tokenId, setTokenId] = useState<string | null>(null)
    const [checkingEligibility, setCheckingEligibility] = useState(false)

    // Hook to check if user has an AgenticID NFT
    const { data: balanceData } = useReadContract({
        address: IDENTITY_ADDRESS as `0x${string}`,
        abi: AgenticIDNFT.abi,
        functionName: 'balanceOf',
        args: [address],
        query: {
            enabled: !!address,
        },
    })

    // Hook to get user's token ID directly
    const { data: userTokenIdData } = useReadContract({
        address: IDENTITY_ADDRESS as `0x${string}`,
        abi: AgenticIDNFT.abi,
        functionName: 'getUserTokenId',
        args: [address],
        query: {
            enabled: !!address && !!balanceData && BigInt(balanceData.toString()) > BigInt(0),
        },
    })

    // Direct check for governance eligibility from AgenticID contract
    const { data: directEligibilityData } = useReadContract({
        address: IDENTITY_ADDRESS as `0x${string}`,
        abi: AgenticIDNFT.abi,
        functionName: 'canParticipateInGovernance',
        args: [address],
        query: {
            enabled: !!address && hasAgenticID,
        },
    })

    // Add a console log effect to track eligibility status for debugging
    useEffect(() => {
        if (address) {
            console.log("Eligibility debugging:", {
                hasAgenticID,
                tokenId,
                balanceData: balanceData ? balanceData.toString() : null,
                userTokenIdData: userTokenIdData ? userTokenIdData.toString() : null,
                directEligibilityData,
                isEligible,
                isMember
            });
        }
    }, [address, hasAgenticID, tokenId, balanceData, userTokenIdData, directEligibilityData, isEligible, isMember]);

    // Check if user has an AgenticID NFT whenever balance changes
    useEffect(() => {
        if (balanceData) {
            const hasNFT = BigInt(balanceData.toString()) > BigInt(0);
            setHasAgenticID(hasNFT);

            if (hasNFT && userTokenIdData) {
                setTokenId(userTokenIdData.toString());
            }
        }
    }, [balanceData, userTokenIdData]);

    // Use direct eligibility check to override isEligible if available
    useEffect(() => {
        if (directEligibilityData !== undefined) {
            // Update the UI immediately with direct check
            // This will override the governance contract check if available
            // Note that we can't directly modify isEligible since it's from useReadContract
            setCheckingEligibility(false);
        }
    }, [directEligibilityData]);

    // --- fetchProposals Definition (wrapped in useCallback) ---
    // Define fetchProposals *before* useEffect hooks that use it
    const fetchProposals = useCallback(async () => {
        // Use BigInt constructor
        if (!publicClient || !proposalCount || proposalCount === BigInt(0)) {
            setProposals([])
            return;
        }
        console.log("count", proposalCount, "fetching proposals")

        try {
            const fetchedProposals: Proposal[] = [];
            // Use BigInt constructor for loop initialization
            for (let i = BigInt(0); i < proposalCount; i++) {
                const proposalData = await publicClient.readContract({
                    address: GOVERNANCE_ADDRESS,
                    abi: GovernanceABI.abi,
                    functionName: 'getProposal',
                    args: [i],
                });

                const [name, description, forVotes, againstVotes, executed, endTime, proposer] = proposalData as [string, string, bigint, bigint, boolean, bigint, `0x${string}`]; // Add type assertion

                fetchedProposals.push({
                    id: i,
                    name: name,
                    description: description,
                    // Use formatEther from viem
                    forVotes: formatEther(forVotes),
                    againstVotes: formatEther(againstVotes),
                    executed: executed,
                    endTime: new Date(Number(endTime) * 1000),
                    proposer: proposer
                });
            }
            setProposals(fetchedProposals.reverse()); // Show newest first
        } catch (error) {
            console.error("Error fetching proposals:", error);
            toast.error("Failed to fetch proposals. Please try again.");
            setProposals([]);
        }
        // Dependencies for useCallback
    }, [publicClient, proposalCount]);


    // --- Effects ---

    // Fetch initial data and refetch on account change
    useEffect(() => {
        if (address && account.isConnected) {
            refetchIsMember()
            refetchIsEligible()
            fetchProposals() // Call the memoized function
        } else {
            setProposals([])
        }
        // Add fetchProposals to dependency array
    }, [address, account.chainId, account.isConnected, refetchIsMember, refetchIsEligible, fetchProposals])

    // Refetch membership/eligibility and proposals after successful actions
    useEffect(() => {
        if (isJoinSuccess) {
            toast.success("Successfully joined governance community!", { id: "join-governance", description: `Tx: ${joinTxHash?.substring(0, 6)}...` })
            refetchIsMember()
            refetchIsEligible() // Refetch eligibility (though should now be member)
            setJoinTxHash(undefined)
        }
    }, [isJoinSuccess, refetchIsMember, refetchIsEligible, joinTxHash])

    useEffect(() => {
        if (isCreateSuccess) {
            toast.success("Proposal Created Successfully!", { id: "create-proposal", description: `Tx: ${createProposalTxHash?.substring(0, 6)}...` })
            setNewProposalName("")
            setNewProposalDescription("")
            fetchProposals() // Call the memoized function
            setCreateProposalTxHash(undefined)
        }
        // Add fetchProposals to dependency array
    }, [isCreateSuccess, createProposalTxHash, fetchProposals])

    useEffect(() => {
        if (isVoteSuccess) {
            toast.success(`Vote Submitted Successfully!`, { id: `vote-${voteTxHash}`, description: `Tx: ${voteTxHash?.substring(0, 6)}...` })
            fetchProposals() // Call the memoized function
            setVoteTxHash(undefined)
        }
        // Add fetchProposals and correct typo in dependency array
    }, [isVoteSuccess, voteTxHash, fetchProposals])

    useEffect(() => {
        if (isExecuteSuccess) {
            toast.success("Proposal Executed Successfully!", { id: `execute-${executeTxHash}`, description: `Tx: ${executeTxHash?.substring(0, 6)}...` })
            fetchProposals() // Call the memoized function
            setExecuteTxHash(undefined)
        }
        // Add fetchProposals to dependency array
    }, [isExecuteSuccess, fetchProposals, executeTxHash])


    // REMOVE this function - replaced by wagmi hooks
    // const getGovernanceContract = () => { ... }

    // REMOVE this function - replaced by wagmi hooks
    // const checkMembershipStatus = async () => { ... }

    // REMOVE fetchProposals definition from here - moved earlier and wrapped in useCallback
    // const fetchProposals = async () => { ... };


    // --- Updated Action Handlers ---

    const joinCommunity = async () => {
        const toastId = "join-governance";
        toast.loading("Preparing transaction...", { id: toastId });

        try {
            // First check if user is eligible directly before attempting to join
            if (!hasAgenticID) {
                throw new Error("You need an AgenticID NFT to join governance");
            }

            // If we have direct eligibility data, make sure user is eligible
            if (directEligibilityData !== undefined && !directEligibilityData) {
                throw new Error("Your AgenticID doesn't meet the governance requirements");
            }

            const txHash = await joinCommunityWrite({
                address: GOVERNANCE_ADDRESS,
                abi: GovernanceABI.abi,
                functionName: 'joinCommunity',
                args: [],
            });

            setJoinTxHash(txHash);
            toast.loading(`Joining governance... Tx: ${txHash.substring(0, 6)}...`, { id: toastId });
        } catch (error: any) {
            console.error("Error joining governance:", error);
            toast.error("Failed to join governance", {
                id: toastId,
                description: error?.shortMessage || error?.message || "Check console for details"
            });
        }
    }

    const createProposal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProposalName.trim() || !newProposalDescription.trim()) return

        const toastId = "create-proposal";
        toast.loading("Preparing transaction...", { id: toastId });

        try {
            // For this example, we're not including execution data
            const executionData = "0x" as `0x${string}`; // Ensure correct type
            const txHash = await createProposalWrite({
                address: GOVERNANCE_ADDRESS,
                abi: GovernanceABI.abi,
                functionName: 'createProposal',
                args: [newProposalName, newProposalDescription, executionData],
            });
            setCreateProposalTxHash(txHash);
            toast.loading(`Creating proposal... Tx: ${txHash.substring(0, 6)}...`, { id: toastId });
        } catch (error: any) {
            console.error("Error creating proposal:", error);
            toast.error("Failed to create proposal", {
                id: toastId,
                description: error?.shortMessage || error?.message || "Check console for details"
            });
        }
    }

    const vote = async (proposalId: bigint, support: boolean) => {
        const toastId = `vote-${proposalId}-${support ? 'for' : 'against'}`;
        toast.loading(`Preparing vote (${support ? 'For' : 'Against'})...`, { id: toastId });

        try {
            const txHash = await voteWrite({
                address: GOVERNANCE_ADDRESS,
                abi: GovernanceABI.abi,
                functionName: 'vote',
                args: [proposalId, support],
            });
            setVoteTxHash(txHash);
            toast.loading(`Submitting vote... Tx: ${txHash.substring(0, 6)}...`, { id: toastId });
        } catch (error: any) {
            console.error("Error voting:", error);
            toast.error("Failed to vote", {
                id: toastId,
                description: error?.shortMessage || error?.message || "Check console for details"
            });
        }
    }

    const executeProposal = async (proposalId: bigint) => {
        const toastId = `execute-${proposalId}`;
        toast.loading("Preparing execution...", { id: toastId });

        try {
            const txHash = await executeProposalWrite({
                address: GOVERNANCE_ADDRESS,
                abi: GovernanceABI.abi,
                functionName: 'executeProposal',
                args: [proposalId],
            });
            setExecuteTxHash(txHash);
            toast.loading(`Executing proposal... Tx: ${txHash.substring(0, 6)}...`, { id: toastId });
        } catch (error: any) {
            console.error("Error executing proposal:", error);
            toast.error("Failed to execute proposal", {
                id: toastId,
                description: error?.shortMessage || error?.message || "Check console for details"
            });
        }
    }

    // New function to navigate to the AgenticID verification page
    const navigateToVerification = () => {
        router.push('/')
    }

    if (!account.isConnected) {
        return (
            <div className="flex items-center align-middle min-h-screen text-center justify-center text-4xl font-bold">
                <div>Please connect your wallet.</div>
            </div>
        )
    }

    // Display loading states
    if (isLoadingMemberStatus || checkingEligibility) {
        return (
            <div className="flex items-center align-middle min-h-screen text-center justify-center text-xl font-semibold">
                <div>Loading governance status...</div>
            </div>
        )
    }

    // Determine eligibility based on both contract calls
    const userIsEligible = isEligible || (directEligibilityData === true);

    return (
        <div className="container mx-auto px-4 md:px-16 lg:px-32 py-16">
            <h1 className="text-3xl font-bold mb-6">Governance</h1>

            {Boolean(!hasAgenticID) && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">AgenticID Required</h3>
                    <p className="text-yellow-700">You need to mint an AgenticID NFT before you can participate in governance.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full transition-colors"
                    >
                        Mint AgenticID
                    </button>
                </div>
            )}

            <div className="flex flex-col py-5 mb-8">
                <h2 className="text-2xl font-semibold mb-3">Governance Community</h2>
                {isMember ? (
                    <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium shadow-sm">
                        ✓ You are a governance member
                    </div>
                ) : (
                    <div className="bg-white p-5 rounded-lg shadow-sm border">
                        {userIsEligible ? (
                            <div>
                                <p className="mb-3 text-lg">You&apos;re eligible to join governance!</p>
                                <button
                                    onClick={joinCommunity}
                                    disabled={isJoining || isConfirmingJoin}
                                    className="bg-black text-white font-bold px-5 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isJoining ? "Requesting..." : isConfirmingJoin ? "Joining..." : "Join Governance"}
                                </button>
                                {joinTxHash && <p className="text-sm text-gray-500 mt-2">Tx: {joinTxHash.substring(0, 10)}...</p>}
                            </div>
                        ) : (
                            <div>
                                <div className="text-red-600 font-semibold mb-4">
                                    {/* {hasAgenticID 
                                        ? "Your AgenticID needs additional verifications to join governance."
                                        : "You are not currently eligible to join governance."} */}
                                </div>
                                <div className="mb-4 gap-4">
                                    <h3 className="font-medium mb-2">Requirements:</h3>
                                    <ul className="list-disc list-inside space-y-1 pl-2 text-gray-700">
                                        <li className={hasAgenticID ? "text-green-600" : ""}>
                                            {hasAgenticID ? "✓ Own an AgenticID NFT" : "Own an AgenticID NFT"}
                                        </li>
                                        <li>Verify with Worldcoin (Humanity Check)</li>
                                        <li>At least one other verification (ENS, Face, or Twitter)</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={navigateToVerification}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    {hasAgenticID ? "Complete Your Verifications" : "Verify Your AgenticID"}
                                </button>
                                {/* join community button */}
                                <button
                                    onClick={joinCommunity}
                                    disabled={isJoining || isConfirmingJoin}
                                    className="bg-black text-white font-bold px-5 py-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isJoining ? "Requesting..." : isConfirmingJoin ? "Joining..." : "Join Governance"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {hasAgenticID && Boolean(isMember) && (
                <form onSubmit={createProposal} className="mb-8 bg-gray-50 p-6 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-semibold mb-4">Create New Proposal</h3>
                    <input
                        type="text"
                        value={newProposalName}
                        onChange={(e) => setNewProposalName(e.target.value)}
                        placeholder="Proposal Title (e.g., 'Increase Voting Period')"
                        className="w-full p-3 border rounded bg-white mb-3 focus:ring-2 focus:ring-blue-300 outline-none"
                        required
                    />
                    <textarea
                        value={newProposalDescription}
                        onChange={(e) => setNewProposalDescription(e.target.value)}
                        placeholder="Detailed description of the proposal and its purpose..."
                        className="w-full p-3 border rounded bg-white mb-3 focus:ring-2 focus:ring-blue-300 outline-none"
                        rows={4}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isCreatingProposal || isConfirmingCreate} // Use wagmi pending/loading states
                        className="mt-2 bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreatingProposal ? "Requesting..." : isConfirmingCreate ? "Creating..." : "Create Proposal"}
                    </button>
                    {createProposalTxHash && <p className="text-sm text-gray-500 mt-2">Tx: {createProposalTxHash.substring(0, 10)}...</p>}
                </form>
            )}

            {/* Proposals List Section */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">Proposals</h2>
                {proposals.length === 0 ? (
                    <div className="text-gray-500 text-center py-10 border rounded-lg bg-gray-50">
                        {isMember ? "No proposals yet. Be the first to create one!" : "No active proposals."}
                    </div>
                ) : (
                    <div className="space-y-4"> {/* Add spacing between proposals */}
                        {proposals.map((proposal) => (
                            <div key={proposal.id.toString()} className="border p-4 rounded-lg shadow-sm bg-white">
                                <h3 className="text-xl font-semibold">{proposal.name}</h3>
                                <p className="text-gray-600 my-2">{proposal.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                                    <div className="bg-green-50 p-2 rounded">
                                        <span className="font-medium">For:</span> {proposal.forVotes}
                                    </div>
                                    <div className="bg-red-50 p-2 rounded">
                                        <span className="font-medium">Against:</span> {proposal.againstVotes}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500"><span className="font-medium">Ends:</span> {proposal.endTime.toLocaleString()}</p>
                                <p className="text-sm text-gray-500"><span className="font-medium">Proposer:</span> {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(proposal.proposer.length - 4)}</p>

                                {!proposal.executed && new Date() < proposal.endTime && Boolean(isMember) && (
                                    <div className="mt-3 pt-3 border-t">
                                        <React.Fragment key={proposal.id.toString()}>
                                            <button
                                                onClick={() => vote(proposal.id, true)}
                                                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                                            >
                                                Vote For
                                            </button>
                                            <button
                                                onClick={() => vote(proposal.id, false)}
                                                className="bg-red-500 text-white px-4 py-2 rounded"
                                            >
                                                Vote Against
                                            </button>
                                        </React.Fragment>
                                    </div>
                                )}

                                {/* Execute Button (If ended, not executed, and passed - logic for passed needs check) */}
                                {/* Note: The contract checks passing status, FE can just allow execution attempt */}
                                {!proposal.executed && new Date() >= proposal.endTime && (
                                    <div className="mt-3 pt-3 border-t">
                                        <button
                                            onClick={() => executeProposal(proposal.id)}
                                            disabled={isExecuting || isConfirmingExecute} // Use wagmi pending/loading states
                                            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isExecuting || isConfirmingExecute ? "Executing..." : "Execute Proposal"}
                                        </button>
                                        {/* Optionally show execute Tx hash */}
                                        {executeTxHash && <p className="text-sm text-gray-500 mt-2">Execute Tx Pending: {executeTxHash.substring(0, 10)}...</p>}
                                    </div>
                                )}

                                {/* Executed Status */}
                                {proposal.executed && (
                                    <div className="mt-3 pt-3 border-t text-green-700 font-medium">
                                        ✓ Proposal Executed
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    )
}

export default Governance
