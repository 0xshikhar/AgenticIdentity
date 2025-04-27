import { Contract, InfuraProvider, JsonRpcProvider, Wallet } from "ethers"
import { NextRequest } from "next/server"
import Review from "../../../../../contracts/artifacts/contracts/Review.sol/Review.json"

export async function POST(req: NextRequest) {
    if (typeof process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS !== "string") {
        throw new Error("Please, define NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS in your .env file")
    }

    if (typeof process.env.NEXT_PUBLIC_DEFAULT_NETWORK !== "string") {
        throw new Error("Please, define NEXT_PUBLIC_DEFAULT_NETWORK in your .env file")
    }

    if (typeof process.env.INFURA_API_KEY !== "string" && process.env.NEXT_PUBLIC_DEFAULT_NETWORK !== "localhost") {
        throw new Error("Please, define INFURA_API_KEY in your .env file")
    }

    if (typeof process.env.ETHEREUM_PRIVATE_KEY !== "string") {
        throw new Error("Please, define ETHEREUM_PRIVATE_KEY in your .env file")
    }

    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
    const ethereumNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK
    const infuraApiKey = process.env.INFURA_API_KEY
    const contractAddress = process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS

    const provider =
        ethereumNetwork === "localhost"
            ? new JsonRpcProvider("http://127.0.0.1:8545")
            : new InfuraProvider(ethereumNetwork, infuraApiKey)

    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(contractAddress, Review.abi, signer)

    const { identityCommitment, signature } = await req.json()
    // Split the signature into `r` and `s` components
    const r = signature.slice(0, 64) // First 32 bytes (64 hex characters)
    const s = signature.slice(64) // Second 32 bytes

    // Convert `r` and `s` from hexadecimal to BigInt
    const rBigInt = BigInt("0x" + r) // Convert to BigInt for Solidity's uint256
    const sBigInt = BigInt("0x" + s) // Convert to BigInt for Solidity's uint256

    // Verifier public keys
    const x = "978d2c644ed2bc35fe0cc1e1951505475d48b97ab8732d9323ba16957659d46e"
    const y = "9ebe95099e3b74a572581252f995cea6b08372df034b2d627b6d7f62452164c0"

    // Convert to BigInt for use with Solidity
    const xBigInt = BigInt("0x" + x)
    const yBigInt = BigInt("0x" + y)

    try {
        const transaction = await contract.joinReviewerGroup(
            identityCommitment,
            rBigInt.toString(),
            sBigInt.toString(),
            xBigInt.toString(),
            yBigInt.toString()
        )

        await transaction.wait()

        return new Response("Success", { status: 200 })
    } catch (error: any) {
        console.error(error)

        return new Response(`Server error: ${error}`, {
            status: 500
        })
    }
}
