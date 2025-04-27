"use client"

import { Group, Identity, generateProof } from "@semaphore-protocol/core"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import Review from "../../../../contracts/artifacts/contracts/Review.sol/Review.json"
import Stepper from "../../components/Stepper"
import LogsContext from "../../context/LogsContext"
import SemaphoreContext from "../../context/SemaphoreContext"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"

export default function ReviewPage() {
    const router = useRouter()
    const { setLogs } = useContext(LogsContext)
    const { _reviewers, _reviews, refreshReview, addReview } = useContext(SemaphoreContext)
    const [_loading, setLoading] = useState(false)
    const [_identity, setIdentity] = useState<Identity>()

    useEffect(() => {
        const privateKey = localStorage.getItem("identity")

        if (!privateKey) {
            router.push("/prove")
            return
        }

        setIdentity(new Identity(privateKey))
    }, [router])

    const sendReview = useCallback(async () => {
        if (!_identity) {
            return
        }

        if (typeof process.env.NEXT_PUBLIC_REVIEWER_GROUP_ID !== "string") {
            throw new Error("Please, define NEXT_PUBLIC_REVIEWER_GROUP_ID in your .env file")
        }

        const review = prompt("Please enter your review:")

        if (review && _reviewers) {
            setLoading(true)

            setLogs(`Posting your anonymous review...`)

            try {
                const group = new Group(_reviewers)
                const reviewId = uuidv4().slice(0, 10)

                const { points, merkleTreeDepth, merkleTreeRoot, nullifier, scope, message } = await generateProof(
                    _identity,
                    group,
                    review,
                    reviewId
                )

                let response: any

                if (process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK) {
                    response = await fetch(process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            abi: Review.abi,
                            address: process.env.REVIEW_CONTRACT_ADDRESS,
                            functionName: "sendPost",
                            functionParameters: [merkleTreeDepth, merkleTreeRoot, nullifier, message, points]
                        })
                    })
                } else {
                    response = await fetch("api/review", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            review: message,
                            reviewerId: scope,
                            merkleTreeDepth,
                            merkleTreeRoot,
                            nullifier,
                            points
                        })
                    })
                }

                if (response.status === 200) {
                    addReview(review)

                    setLogs(`Your review has been posted 🎉`)
                } else {
                    setLogs("Some error occurred, please try again!")
                }
            } catch (error) {
                console.error(error)

                setLogs("Some error occurred, please try again!")
            } finally {
                setLoading(false)
            }
        }
    }, [_identity, _reviewers, addReview, setLogs])

    return (
        <>
            <h2>
                <a
                    href="https://www.agoda.com/v-hotel-bencoolen/hotel/singapore-sg.html"
                    target="_blank"
                    rel="noreferrer noopener nofollow"
                >
                    V Hotel Bencoolen, Singapore
                </a>
            </h2>

            <div className="image-container">
                <Image
                    src="https://pix8.agoda.net/hotelImages/433173/-1/830fe0338a493daade4983f2e0011966.jpg?ca=7&ce=1&s=450x302"
                    alt="hotel picture"
                    width={405}
                    height={302}
                    priority={true}
                />
            </div>

            <div className="divider"></div>

            <div className="text-top">
                <h3>Reviews ({_reviews.length})</h3>
                <button className="button-link" onClick={refreshReview}>
                    Refresh
                </button>
            </div>

            <div>
                <button className="button" onClick={sendReview} disabled={_loading}>
                    <span>Add Review</span>
                    {_loading && <div className="loader"></div>}
                </button>
            </div>

            {_reviews.length > 0 && (
                <div>
                    {_reviews.map((f, i) => (
                        <div key={i}>
                            <p className="box box-text">{f}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="divider"></div>

            <Stepper step={4} onPrevClick={() => router.push("/")} />
        </>
    )
}
