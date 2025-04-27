"use client"

import { Identity } from "@semaphore-protocol/core"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useState } from "react"
import Review from "../../../../contracts/artifacts/contracts/Review.sol/Review.json"
import Stepper from "@/components/Stepper"
import LogsContext from "@/context/LogsContext"
import SemaphoreContext from "@/context/SemaphoreContext"
import Image from "next/image"

export default function GroupPage() {
    const router = useRouter()
    const { setLogs } = useContext(LogsContext)
    const { _reviewers, addReviewer } = useContext(SemaphoreContext)
    const [_loading, setLoading] = useState(false)
    const [_identity, setIdentity] = useState<Identity>()
    const [_signature, setSignature] = useState<string>()

    useEffect(() => {
        if (_identity && reviewerHasJoined(_identity)) {
            router.push("/review")
            return
        }
    }, [router, _identity])

    useEffect(() => {
        const privateKey = localStorage.getItem("identity")
        const signature = localStorage.getItem("signature")

        if (!privateKey || !signature) {
            router.push("/prove")
            return
        }

        setIdentity(new Identity(privateKey))
        setSignature(signature)
    }, [router])

    useEffect(() => {
        if (_reviewers.length > 0) {
            setLogs(`${_reviewers.length} reviewer${_reviewers.length > 1 ? "s" : ""} retrieved from the group 🤙🏽`)
        }
    }, [_reviewers, setLogs])

    const joinGroup = useCallback(async () => {
        if (!_identity || !_signature) {
            return
        }

        setLoading(true)
        setLogs(`Joining the reviewer group...`)

        let response: any

        if (process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK) {
            response = await fetch(process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    abi: Review.abi,
                    address: process.env.REVIEW_CONTRACT_ADDRESS,
                    functionName: "joinReviewerGroup",
                    functionParameters: [_identity.commitment.toString()]
                })
            })
        } else {
            response = await fetch("api/join-reviewer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identityCommitment: _identity.commitment.toString(),
                    signature: _signature.toString()
                })
            })
        }

        if (response.status === 200) {
            addReviewer(_identity.commitment.toString())
            setLogs(`You have joined the reviewer group event 🎉 Share your review anonymously!`)
            router.push("/review")
        } else {
            setLogs("Some error occurred, please try again!")
        }

        setLoading(false)
    }, [_identity, _signature, addReviewer, setLogs])

    const reviewerHasJoined = useCallback(
        (identity: Identity) => {
            return _reviewers.includes(identity.commitment.toString())
        },
        [_reviewers]
    )

    return (
        <>
            <h2>Join as Reviewer</h2>

            <div className="summary">Congratulations! You have been verified to have booked the hotel before.</div>

            <div className="summary">
                You can now join the anonymous{" "}
                <a href="https://semaphore.pse.dev" target="_blank" rel="noreferrer noopener nofollow">
                    Semaphore
                </a>{" "}
                reviewer group to start posting anonymous reviews!
            </div>

            <div className="banner-container">
                <Image src="/social-media.png" alt="tlsn logo" width={500} height={200} priority={true} />
            </div>

            <div className="divider"></div>

            <div>
                <button
                    className="button"
                    onClick={joinGroup}
                    disabled={_loading || !_identity || reviewerHasJoined(_identity)}
                >
                    <span>Join Reviewer Group</span>
                    {_loading && <div className="loader"></div>}
                </button>
            </div>

            <div className="divider"></div>

            <Stepper step={3} onPrevClick={() => router.push("/prove")} />
        </>
    )
}
