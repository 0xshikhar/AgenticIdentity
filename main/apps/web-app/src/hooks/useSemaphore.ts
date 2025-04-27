import { SemaphoreEthers } from "@semaphore-protocol/data"
import { Contract, JsonRpcProvider, decodeBytes32String, toBeHex } from "ethers"
import { useCallback, useState } from "react"
import { SemaphoreContextType } from "../context/SemaphoreContext"
import Feedback from "../../contract-artifacts/Review.json"
import { BigNumberish } from "ethers"

const ethereumNetwork =
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "localhost"
        ? "http://127.0.0.1:8545"
        : process.env.NEXT_PUBLIC_DEFAULT_NETWORK

export default function useSemaphore(): SemaphoreContextType {
    const [_reviewers, setReviewers] = useState<string[]>([])
    const [_reviews, setReview] = useState<string[]>([])

    const refreshReviewer = useCallback(async (): Promise<void> => {
        const semaphore = new SemaphoreEthers(ethereumNetwork, {
            address: process.env.NEXT_PUBLIC_SEMAPHORE_CONTRACT_ADDRESS
        })

        const members = await semaphore.getGroupMembers(process.env.NEXT_PUBLIC_REVIEWER_GROUP_ID as string)
        members.forEach((value, i) => (members[i] = value.toString()))
        setReviewers(members)
    }, [])

    const addReviewer = useCallback(
        (reviewer: any) => {
            setReviewers([..._reviewers, reviewer])
        },
        [_reviewers]
    )

    const refreshReview = useCallback(async (): Promise<void> => {
        const provider = new JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/Kd1XQbFAa3ZboKORKFNQ9mmtcrM5PbZv")
        const contract = new Contract(process.env.NEXT_PUBLIC_REVIEW_CONTRACT_ADDRESS as string, Feedback.abi, provider)

        const reviews: BigNumberish[] = await contract.getPosts()

        setReview(reviews.map((review) => decodeBytes32String(toBeHex(review, 32))))
    }, [])

    const addReview = useCallback(
        (feedback: string) => {
            setReview([..._reviews, feedback])
        },
        [_reviews]
    )

    return {
        _reviewers,
        _reviews,
        refreshReviewer,
        addReviewer,
        refreshReview,
        addReview
    }
}
