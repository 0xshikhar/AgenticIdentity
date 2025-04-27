"use client"

import LogsContext from "@/context/LogsContext"
import SemaphoreContext from "@/context/SemaphoreContext"
import useSemaphore from "@/hooks/useSemaphore"
import { SupportedNetwork } from "@semaphore-protocol/utils"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function PageContainer({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    const pathname = usePathname()
    const semaphore = useSemaphore()
    const [_logs, setLogs] = useState<string>("")

    useEffect(() => {
        semaphore.refreshReviewer()
        semaphore.refreshReview()
    }, [])

    function getExplorerLink(network: SupportedNetwork, address: string) {
        switch (network) {
            case "sepolia":
                return `https://sepolia.etherscan.io/address/${address}`
            case "arbitrum-sepolia":
                return `https://sepolia.arbiscan.io/address/${address}`
            default:
                return ""
        }
    }

    return (
        <div>
            <div>
                <SemaphoreContext.Provider value={semaphore}>
                    <LogsContext.Provider
                        value={{
                            _logs,
                            setLogs
                        }}
                    >
                        {children}
                    </LogsContext.Provider>
                </SemaphoreContext.Provider>
            </div>

            <div className="divider-footer"></div>

            <div className="footer">
                {_logs.endsWith("...")}
                <p>{_logs || `Current step: ${pathname}`}</p>
            </div>
        </div>
    )
}
