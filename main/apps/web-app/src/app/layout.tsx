import PageContainer from "@/components/PageContainer"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navigation/navbar"
import "@rainbow-me/rainbowkit/styles.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "NebulaID",
    description: " A InterPlantery Decentralized Identity Protocol  ",
    icons: { icon: "/nebula.png", apple: "/nebula.png" },
    metadataBase: new URL("https://demo.semaphore.pse.dev")
    // openGraph: {
    //     type: "website",
    //     url: "https://demo.semaphore.pse.dev",
    //     title: "NebulaID",
    //     description: "A InterPlantery Decentralized Identity Protocol",
    //     siteName: "NebulaID",
    //     images: [
    //         {
    //             url: "https://demo.semaphore.pse.dev/social-media.png"
    //         }
    //     ]
    // },
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning className={inter.className}>
                <Providers>
                    <PageContainer>
                        <div className="min-h-screen bg-gradient-to-r from-blue-300 via-green-200 to-yellow-300 bg-opacity-50 ">
                            <Navbar />
                            {children}
                        </div>
                    </PageContainer>
                </Providers>
            </body>
        </html>
    )
}
