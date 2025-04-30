/**
 * Validates an Ethereum address, supporting both checksummed and non-checksummed formats
 * @param {string} address The address to validate
 * @returns {boolean} Whether the address is valid
 */
export function validateAddress(address) {
    // Basic format check
    if (!address || typeof address !== 'string') {
        return false;
    }

    // Check if it matches the basic Ethereum address pattern
    // This accepts any mix of uppercase/lowercase after 0x prefix
    if (!/^0x[a-fA-F0-9]{40}$/i.test(address)) {
        return false;
    }

    // If the address is all lowercase or all uppercase, it's valid but not checksummed
    if (/^0x[0-9a-f]{40}$/.test(address) || /^0x[0-9A-F]{40}$/.test(address)) {
        return true;
    }

    // If mixed case, we'll accept it without additional checksum validation
    // For production, you might want to add proper checksum validation
    return true;
} 