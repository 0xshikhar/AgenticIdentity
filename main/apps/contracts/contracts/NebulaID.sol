// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NebulaIDNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    enum Nationality {
        Unspecified,
        Indian,
        US
    }
    enum HealthStatus {
        Unspecified,
        Fit,
        Unfit
    }
    enum CreditScore {
        Unspecified,
        Good,
        Bad
    }

    struct NebulaIdentity {
        bool twitterVerified;
        bool humanVerified;
        Nationality nationality;
        HealthStatus healthStatus;
        CreditScore creditScore;
        uint256 walletScore;
    }

    mapping(uint256 => NebulaIdentity) public identities;
    mapping(address => uint256) public userToTokenId;

    event IdentityUpdated(uint256 indexed tokenId, address indexed user);

    constructor() ERC721("NebulaID", "NID") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    function mintNebulaID(
        bool _twitterVerified,
        bool _humanVerified,
        Nationality _nationality,
        HealthStatus _healthStatus,
        CreditScore _creditScore,
        uint256 _walletScore
    ) external {
        require(userToTokenId[msg.sender] == 0, "NebulaID: User already has an NFT");

        uint256 newTokenId = _tokenIdCounter;
        _safeMint(msg.sender, newTokenId);
        userToTokenId[msg.sender] = newTokenId;

        identities[newTokenId] = NebulaIdentity({
            twitterVerified: _twitterVerified,
            humanVerified: _humanVerified,
            nationality: _nationality,
            healthStatus: _healthStatus,
            creditScore: _creditScore,
            walletScore: _walletScore
        });

        _tokenIdCounter++;

        emit IdentityUpdated(newTokenId, msg.sender);
    }

    function updateIdentity(
        address user,
        bool _twitterVerified,
        bool _humanVerified,
        Nationality _nationality,
        HealthStatus _healthStatus,
        CreditScore _creditScore,
        uint256 _walletScore
    ) external onlyOwner {
        uint256 tokenId = userToTokenId[user];
        require(tokenId != 0, "NebulaID: User does not have an NFT");

        identities[tokenId] = NebulaIdentity({
            twitterVerified: _twitterVerified,
            humanVerified: _humanVerified,
            nationality: _nationality,
            healthStatus: _healthStatus,
            creditScore: _creditScore,
            walletScore: _walletScore
        });

        emit IdentityUpdated(tokenId, user);
    }

    function getIdentity(uint256 tokenId) external view returns (NebulaIdentity memory) {
        require(_exists(tokenId), "NebulaID: Identity does not exist");
        return identities[tokenId];
    }

    function getUserTokenId(address user) external view returns (uint256) {
        return userToTokenId[user];
    }

    function canParticipateInGovernance(address user) external view returns (bool) {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return false;

        NebulaIdentity memory identity = identities[tokenId];
        return identity.humanVerified && identity.twitterVerified;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
