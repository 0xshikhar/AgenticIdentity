import React from "react"

export type SemaphoreContextType = {
    _reviewers: string[]
    _reviews: string[]
    refreshReviewer: () => Promise<void>
    addReviewer: (reviewer: string) => void
    refreshReview: () => Promise<void>
    addReview: (feedback: string) => void
}

export default React.createContext<SemaphoreContextType>({
    _reviewers: [],
    _reviews: [],
    refreshReviewer: () => Promise.resolve(),
    addReviewer: () => {},
    refreshReview: () => Promise.resolve(),
    addReview: () => {}
})
