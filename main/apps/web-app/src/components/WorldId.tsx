// "use client";

// import {
//     IDKitWidget,
//     ISuccessResult,
//     VerificationLevel,
// } from "@worldcoin/idkit";
// import { Eip1193Provider, ethers } from "ethers";
// import { OasisVerificationStorageAbi } from "../abi/OasisVerificationStorage";
// import { useAccount } from "wagmi";
// import { useCallback, useState, useEffect } from "react";
// import { sapphireTestnet } from "wagmi/chains";

// interface WorldIDWidgetProps {
//     onSuccess: () => void;
//     onVerificationChange: (isVerified: boolean) => void;
// }

// interface Window {
//     ethereum?: Eip1193Provider;
// }

// const WorldIDWidget = ({
//     onSuccess,
//     onVerificationChange,
// }: WorldIDWidgetProps) => {
//     const { address } = useAccount();
//     const [status, setStatus] = useState<
//         "idle" | "verifying" | "storing" | "done" | "error"
//     >("idle");
//     const [message, setMessage] = useState("");
//     const { ethereum } = window as Window;

//     const checkVerification = useCallback(async () => {
//         if (!address) {
//             console.log("No address available, skipping verification check");
//             return false;
//         }

//         // Check local storage for the nullifier hash
//         const storedNullifierHash = localStorage.getItem(
//             `worldcoin_nullifier_${address}`
//         );
//         if (storedNullifierHash) {
//             console.log("User is verified locally");
//             return true;
//         }

//         const oasisStorageAddress =
//             process.env.NEXT_PUBLIC_OASIS_VERIFICATION_STORAGE_ADDRESS;
//         const oasisStorageABI = OasisVerificationStorageAbi.abi;
//         const rpcUrl = process.env.NEXT_PUBLIC_OASIS_RPC_URL;

//         if (!oasisStorageAddress || !rpcUrl) {
//             console.error("Missing environment variables");
//             return false;
//         }

//         try {
//             console.log("Connecting to RPC URL:", rpcUrl);
//             const provider = new ethers.JsonRpcProvider(rpcUrl);

//             const oasisStorageContract = new ethers.Contract(
//                 oasisStorageAddress,
//                 oasisStorageABI,
//                 provider
//             );

//             // Call getVerificationStatus(address)
//             const isVerified = await oasisStorageContract.getVerificationStatus(
//                 address
//             );
//             console.log("On-chain verification status:", isVerified);

//             if (isVerified) {
//                 // Optionally, get and store the nullifier hash
//                 const nullifierHash = await oasisStorageContract.getNullifierHash(
//                     address
//                 );
//                 localStorage.setItem(
//                     `worldcoin_nullifier_${address}`,
//                     nullifierHash.toString()
//                 );
//             }

//             return isVerified;
//         } catch (error) {
//             console.error("Error checking stored verification:", error);
//             return false;
//         }
//     }, [address]);

//     useEffect(() => {
//         const verifyStatus = async () => {
//             try {
//                 const isVerified = await checkVerification();
//                 if (isVerified) {
//                     setStatus("done");
//                     setMessage("Verification already stored on Oasis network.");
//                     onVerificationChange(true);
//                     onSuccess();
//                 } else {
//                     setStatus("idle");
//                     onVerificationChange(false);
//                 }
//             } catch (error) {
//                 console.error("Verification check failed:", error);
//                 setStatus("idle"); // Set to idle to allow retrying
//                 setMessage("Verification status unknown. Please try verifying.");
//                 onVerificationChange(false);
//             }
//         };

//         verifyStatus();
//     }, [address, checkVerification, onSuccess, onVerificationChange]);

//     const handleProof = useCallback(
//         async (result: ISuccessResult) => {
//             console.log("World ID proof received:", result);
//             setStatus("verifying");
//             const oasisStorageAddress =
//                 process.env.NEXT_PUBLIC_OASIS_VERIFICATION_STORAGE_ADDRESS;
//             const oasisStorageABI = OasisVerificationStorageAbi.abi;

//             if (!oasisStorageAddress) {
//                 console.error("Oasis storage address is not defined");
//                 setMessage("Oasis storage address is not defined");
//                 setStatus("error");
//                 return;
//             }

//             if (!ethereum) {
//                 console.error("Ethereum provider not found");
//                 setMessage("Ethereum provider not found");
//                 setStatus("error");
//                 return;
//             }

//             try {
//                 if (!ethereum) {
//                     throw new Error("Ethereum provider not found");
//                 }
//                 console.log("Creating BrowserProvider...");
//                 const provider = new ethers.BrowserProvider(ethereum);
//                 await provider.send("eth_requestAccounts", []);
//                 const signer = await provider.getSigner();
//                 console.log("Signer address:", await signer.getAddress());

//                 const network = await provider.getNetwork();
//                 if (network.chainId !== BigInt(sapphireTestnet.id)) {
//                     console.error("Wrong network. Expected Oasis Sapphire Testnet.");
//                     setMessage(
//                         "Please switch to the Oasis Sapphire Testnet in your wallet"
//                     );
//                     setStatus("error");
//                     return;
//                 }

//                 setStatus("storing");

//                 const oasisStorageContract = new ethers.Contract(
//                     oasisStorageAddress,
//                     oasisStorageABI,
//                     signer
//                 );

//                 const nullifierHashBigInt = BigInt(result.nullifier_hash);
//                 console.log("Nullifier hash (BigInt):", nullifierHashBigInt.toString());

//                 const tx = await oasisStorageContract.storeVerification(
//                     nullifierHashBigInt
//                 );
//                 console.log("Transaction sent:", tx.hash);
//                 const receipt = await tx.wait();
//                 console.log("Transaction confirmed:", receipt);

//                 localStorage.setItem(
//                     `worldcoin_nullifier_${address}`,
//                     result.nullifier_hash
//                 );

//                 setStatus("done");
//                 setMessage("Verification stored on Oasis network.");
//                 onVerificationChange(true);
//                 onSuccess();
//             } catch (error) {
//                 console.error("Error during verification or storage:", error);
//                 setMessage(
//                     error instanceof Error ? error.message : "An unknown error occurred."
//                 );
//                 setStatus("error");
//                 onVerificationChange(false);
//             }
//         },
//         [address, onSuccess, onVerificationChange]
//     );

//     if (status === "done") {
//         return null;
//     }

//     return (
//         <div className="world-id-widget">
//             {status === "idle" && (
//                 <IDKitWidget
//                     app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
//                     action={process.env.NEXT_PUBLIC_ACTION || ""}
//                     signal={address || ""}
//                     onSuccess={handleProof}
//                     handleVerify={() => Promise.resolve()}
//                     verification_level={VerificationLevel.Orb}
//                     autoClose
//                 >
//                     {({ open }) => (
//                         <button onClick={open} className="nouns-button text-2xl px-8 py-4">
//                             Verify with World ID
//                         </button>
//                     )}
//                 </IDKitWidget>
//             )}
//             {status === "verifying" && (
//                 <p className="text-xl">Verifying your World ID...</p>
//             )}
//             {status === "storing" && (
//                 <p className="text-xl">Storing verification on Oasis network...</p>
//             )}
//             {status === "error" && (
//                 <p className="text-xl text-nouns-accent">{message}</p>
//             )}
//         </div>
//     );
// };

// export default WorldIDWidget;
