"use client"
import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ethers, InfuraProvider, JsonRpcProvider, Wallet } from "ethers"
import { GOVERNANCE_ADDRESS } from "@/lib/contract"
import GovernanceABI from "../../../contract-artifacts/Governance.json"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

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
    // const { InfuraProvider } = providers


    const [proposals, setProposals] = useState<Proposal[]>([])
    const [newProposalName, setNewProposalName] = useState("")
    const [newProposalDescription, setNewProposalDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
    const infuraApiKey = process.env.INFURA_API_KEY
    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY

    useEffect(() => {
        if (address && account.isConnected) {
            const fetchData = async () => {
                try {
                    await fetchProposals()
                } catch (error) {
                    console.error("Error fetching proposals:", error)
                }
            }
            fetchData()
        }
    }, [address, account.chainId, account.isConnected])

    const getGovernanceContract = () => {
        const provider = ethereumNetwork === "localhost"
            ? new JsonRpcProvider("http://127.0.0.1:8545")
            : new InfuraProvider(ethereumNetwork, infuraApiKey);
        if (!provider) throw new Error("No Web3 Provider")

        // @ts-expect-error
        const signer = new Wallet(ethereumPrivateKey, provider)

        return new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI.abi, signer)
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
        setLoading(true)
    }

    const createProposal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newProposalName.trim() || !newProposalDescription.trim()) return

        setLoading(true)
        try {
            console.log("Creating proposal:", newProposalName, newProposalDescription)
            const contract = getGovernanceContract()
            // For this example, we're not including execution data
            const executionData = "0x"
            const tx = await contract.createProposal(newProposalName, newProposalDescription, executionData)
            console.log("Transaction sent:", tx.hash)
            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)
            toast.success("Proposal Created Successfully!")

            toast(<div></div>)

            setNewProposalName("")
            setNewProposalDescription("")
            await fetchProposals()
        } catch (error) {
            console.error("Error creating proposal:", error)
            toast.error("Failed to create proposal!")

            toast(<div>{(error as any)?.reason || "Unknown error occurred"}</div>)
        } finally {
            setLoading(false)
        }
    }

    const vote = async (proposalId: number, support: boolean) => {
        setLoading(true)
        try {
            const contract = getGovernanceContract()
            console.log("Voting on proposal:", proposalId, support)
            const tx = await contract.vote(proposalId, support)
            console.log("Transaction sent:", tx.hash)
            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)
            toast.success("Voted Successfully!")

            toast(<div>Link - {`https://opencampus-codex.blockscout.com/tx/${tx.hash}`}</div>)

            await fetchProposals()
        } catch (error) {
            console.error("Error voting:", error)
            toast.error("Failed to vote!")

            toast(<div>{(error as any)?.reason || "Unknown error occurred"}</div>)
        } finally {
            setLoading(false)
        }
    }

    const executeProposal = async (proposalId: number) => {
        setLoading(true)
        try {
            const contract = getGovernanceContract()
            console.log("Executing proposal:", proposalId)
            const tx = await contract.executeProposal(proposalId)
            console.log("Transaction sent:", tx.hash)
            const receipt = await tx.wait()
            console.log("Transaction confirmed:", receipt)
            toast.success("Proposal Executed Successfully!")

            toast(<div>Link - {`https://opencampus-codex.blockscout.com/tx/${tx.hash}`}</div>)

            await fetchProposals()
        } catch (error) {
            console.error("Error executing proposal:", error)
            toast.error("Failed to execute proposal!")

            toast(<div>{(error as any)?.reason || "Unknown error occurred"}</div>)
        } finally {
            setLoading(false)
        }
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

            <div className="flex py-5">
                <h2 className="text-2xl font-semibold pr-5">Join Goverance Community</h2>
                <button onClick={joinCommunity} className="bg-black text-white text font-bold px-4 py-2 rounded-3xl ">
                    Join
                </button>
            </div>

            <form onSubmit={createProposal} className="mb-8 ">
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
                <button type="submit" disabled={loading} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                    {loading ? "Creating..." : "Create Proposal"}
                </button>
            </form>

            <div>
                <h2 className="text-2xl font-semibold mb-4">Active Proposals</h2>
                {proposals.map((proposal) => (
                    <div key={proposal.id} className="border p-4 mb-4 rounded">
                        <h3 className="text-xl font-semibold">{proposal.name}</h3>
                        <p className="text-gray-600 mb-2">{proposal.description}</p>
                        <p>
                            For: {proposal.forVotes} | Against: {proposal.againstVotes}
                        </p>
                        <p>Ends: {proposal.endTime.toLocaleString()}</p>
                        <p>Proposer: {proposal.proposer}</p>
                        {!proposal.executed && new Date() < proposal.endTime && (
                            <div className="mt-2">
                                <button
                                    onClick={() => vote(proposal.id, true)}
                                    disabled={loading}
                                    className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                                >
                                    Vote For
                                </button>
                                <button
                                    onClick={() => vote(proposal.id, false)}
                                    disabled={loading}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                >
                                    Vote Against
                                </button>
                            </div>
                        )}
                        {!proposal.executed && new Date() >= proposal.endTime && (
                            <button
                                onClick={() => executeProposal(proposal.id)}
                                disabled={loading}
                                className="mt-2 bg-purple-500 text-white px-4 py-2 rounded"
                            >
                                Execute Proposal
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    )
}

export default Governance
