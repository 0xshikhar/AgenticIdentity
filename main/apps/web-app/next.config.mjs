/** @type {import('next').NextConfig} */
    
import withPWA from "next-pwa"
import { config } from "dotenv"

// Only use fs in Node.js environment (not during client-side)
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    import('fs').then(fs => {
        if (!fs.existsSync("./.env")) {
            config({ path: "../../.env" })
        }
    }).catch(() => {
        // Handle case where fs is not available
        config({ path: "../../.env" })
    })
} else {
    config({ path: "../../.env" })
}

const nextConfig = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development"
})({
    env: {
        INFURA_API_KEY: process.env.INFURA_API_KEY,
        ETHEREUM_PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY
    },
    images: {
        domains: ["pix8.agoda.net"] // Add your external image domain here
    },
    // Add webpack config to handle Node.js modules properly
    webpack: (config, { isServer }) => {
        // For face-api.js and other packages using fs
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                stream: false,
                http: false,
                https: false,
                zlib: false,
                path: false,
                os: false,
                // buffer: require.resolve('buffer/'),
                encoding: false
            }
        }
        
        return config
    }
})

export default nextConfig
