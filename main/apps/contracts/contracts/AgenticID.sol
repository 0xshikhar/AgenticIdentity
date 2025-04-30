// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgenticIDNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    // Base URI for all token metadata
    string private _baseTokenURI;
    
    // Default NFT image URI (same for all tokens)
    string public defaultImageURI;
    
    struct AgenticIdentity {
        bool ensVerified;
        bool faceVerified;
        bool twitterVerified;
        bool worldcoinVerified;
        string nationality;
        uint256 walletScore;
        uint256 farcasterScore;
        uint256 lastUpdated;
    }
    
    mapping(uint256 => AgenticIdentity) public identities;
    mapping(address => uint256) public userToTokenId;
    
    event IdentityUpdated(uint256 indexed tokenId, address indexed user);
    event BaseURIUpdated(string newBaseURI);
    event DefaultImageUpdated(string newImageURI);
    
    constructor(string memory baseTokenURI, string memory initialImageURI) 
        ERC721("AgenticID", "AID") 
        Ownable(msg.sender) 
    {
        _tokenIdCounter = 1;
        _baseTokenURI = baseTokenURI;
        defaultImageURI = initialImageURI;
    }
    
    /**
     * @dev Mints a new AgenticID NFT with the provided identity attributes
     */
    function mintAgenticID(
        bool _ensVerified,
        bool _faceVerified,
        bool _twitterVerified,
        bool _worldcoinVerified,
        string memory _nationality,
        uint256 _walletScore,
        uint256 _farcasterScore
    ) external {
        require(userToTokenId[msg.sender] == 0, "AgenticID: User already has an NFT");
        require(bytes(_nationality).length > 0, "AgenticID: Nationality cannot be empty");
        
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(msg.sender, newTokenId);
        userToTokenId[msg.sender] = newTokenId;
        
        identities[newTokenId] = AgenticIdentity({
            ensVerified: _ensVerified,
            faceVerified: _faceVerified,
            twitterVerified: _twitterVerified,
            worldcoinVerified: _worldcoinVerified,
            nationality: _nationality,
            walletScore: _walletScore,
            farcasterScore: _farcasterScore,
            lastUpdated: block.timestamp
        });
        
        _tokenIdCounter++;
        
        emit IdentityUpdated(newTokenId, msg.sender);
    }
    
    /**
     * @dev Updates an existing AgenticID
     * @notice Can only be called by the contract owner
     */
    function updateIdentity(
        address user,
        bool _ensVerified,
        bool _faceVerified,
        bool _twitterVerified,
        bool _worldcoinVerified,
        string memory _nationality,
        uint256 _walletScore,
        uint256 _farcasterScore
    ) external onlyOwner {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "AgenticID: User does not have an NFT");
        require(bytes(_nationality).length > 0, "AgenticID: Nationality cannot be empty");
        
        identities[tokenId] = AgenticIdentity({
            ensVerified: _ensVerified,
            faceVerified: _faceVerified,
            twitterVerified: _twitterVerified,
            worldcoinVerified: _worldcoinVerified,
            nationality: _nationality,
            walletScore: _walletScore,
            farcasterScore: _farcasterScore,
            lastUpdated: block.timestamp
        });
        
        emit IdentityUpdated(tokenId, user);
    }
    
    /**
     * @dev Allows users to update specific verification fields of their own identity
     */
    function updateVerificationStatus(
        bool _ensVerified,
        bool _faceVerified,
        bool _twitterVerified,
        bool _worldcoinVerified
    ) external {
        uint256 tokenId = userToTokenId[msg.sender];
        require(tokenId != 0, "AgenticID: User does not have an NFT");
        
        AgenticIdentity storage identity = identities[tokenId];
        identity.ensVerified = _ensVerified;
        identity.faceVerified = _faceVerified;
        identity.twitterVerified = _twitterVerified;
        identity.worldcoinVerified = _worldcoinVerified;
        identity.lastUpdated = block.timestamp;
        
        emit IdentityUpdated(tokenId, msg.sender);
    }
    
    /**
     * @dev Updates the wallet and Farcaster scores
     * @notice Can only be called by the contract owner
     */
    function updateScores(
        address user,
        uint256 _walletScore,
        uint256 _farcasterScore
    ) external onlyOwner {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "AgenticID: User does not have an NFT");
        
        AgenticIdentity storage identity = identities[tokenId];
        identity.walletScore = _walletScore;
        identity.farcasterScore = _farcasterScore;
        identity.lastUpdated = block.timestamp;
        
        emit IdentityUpdated(tokenId, user);
    }
    
    /**
     * @dev Gets identity information for a token ID
     */
    function getIdentity(uint256 tokenId) external view returns (AgenticIdentity memory) {
        require(_exists(tokenId), "AgenticID: Identity does not exist");
        return identities[tokenId];
    }
    
    /**
     * @dev Gets a user's token ID
     */
    function getUserTokenId(address user) external view returns (uint256) {
        return userToTokenId[user];
    }
    
    /**
     * @dev Checks if a user can participate in governance
     * @notice Requires at least human verification (Worldcoin) and one other verification
     */
    function canParticipateInGovernance(address user) external view returns (bool) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return false;
        
        AgenticIdentity memory identity = identities[tokenId];
        
        // User must be worldcoin verified AND have at least one other verification
        return identity.worldcoinVerified && 
               (identity.ensVerified || identity.faceVerified || identity.twitterVerified);
    }
    
    /**
     * @dev Updates the base token URI
     * @notice Can only be called by the contract owner
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    /**
     * @dev Updates the default image URI
     * @notice Can only be called by the contract owner
     */
    function setDefaultImageURI(string memory newImageURI) external onlyOwner {
        defaultImageURI = newImageURI;
        emit DefaultImageUpdated(newImageURI);
    }
    
    /**
     * @dev Gets the token URI with dynamic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "AgenticID: URI query for nonexistent token");
        
        // This would typically point to a server that dynamically generates metadata
        // based on the token ID and identity data
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }
    
    /**
     * @dev Checks if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
} 