"use client"

import * as React from "react"
import "@rainbow-me/rainbowkit/styles.css"

import {
    getDefaultConfig,
    RainbowKitProvider,
    connectorsForWallets,
    getDefaultWallets,
    Chain
} from "@rainbow-me/rainbowkit"

import { WagmiProvider } from "wagmi"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import "dotenv/config"
import { rootstock, rootstockTestnet, mainnet} from "viem/chains"

const projectId = "9811958bd307518b364ff7178034c435"

export const config = getDefaultConfig({
    appName: "AgenticID",
    projectId: projectId,
    chains: [rootstockTestnet, rootstock],
    ssr: true // If your dApp uses server side rendering (SSR)
})

const { wallets } = getDefaultWallets({
    appName: "Agentic Identity",
    projectId
})

const demoAppInfo = {
    appName: "Agentic Identity"
}

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider appInfo={demoAppInfo}>{mounted && children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
