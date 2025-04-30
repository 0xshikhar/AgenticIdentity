export const fetchWalletScore = async (walletAddress: string) => {
    if (!walletAddress) {
        console.error("Wallet address is empty or null");
        throw new Error("Wallet address is required");
    }
    
    // Make sure the address is formatted properly
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        console.error(`Invalid wallet address format: ${walletAddress}`);
        throw new Error("Invalid wallet address format");
    }
    
    console.log(`Fetching score for wallet: ${walletAddress}`);
    
    // Make the API request
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const endpoint = `/api/score/enhanced/${walletAddress}`;
    const fullUrl = `${apiUrl}${endpoint}`;
    
    console.log(`Making request to: ${fullUrl}`);
    
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    return data;
}; 