import { ethers, InfuraProvider } from "ethers"
import GOVERNANCE from "../../contract-artifacts/Governance.json"
import NEBULAID from "../../contract-artifacts/NebulaIDNFT.json"

export const GOVERNANCE_ADDRESS = "0x0b3a2D73D07eA2D5D0D0FB4Db09004f74D92767a"
export const NEBULAID_ADDRESS = "0x419cFe85e77a0A26B9989059057318F59764F7C5"

import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// export const publicClient = createPublicClient({
//     chain: mainnet,
//     transport: http()
// })

// OwnerWallet = 0xBB79D409D53E7E0bE4E412465dEBee16A7E208f2;

// export function getGoveranceContract(provider: ethers.BrowserProvider) {
//     return new ethers.Contract(GOVERNANCE_ADDRESS, GOVERNANCE.abi, provider.getSigner())
// }

// export function getNebulaId(provider: ethers.BrowserProvider) {
//     return new ethers.Contract(NEBULAID_ADDRESS, NEBULAID.abi, provider.getSigner())
// }
