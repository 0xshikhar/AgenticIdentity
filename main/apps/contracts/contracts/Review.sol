//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
// import "p256-verifier/P256.sol";

contract Review {
    ISemaphore public semaphore;

    uint256 public reviewerGroupId;

    uint256[] posts;

    constructor(address semaphoreAddress) {
        semaphore = ISemaphore(semaphoreAddress);

        reviewerGroupId = semaphore.createGroup();
    }

    function joinReviewerGroup(uint256 identityCommitment, uint256 r, uint256 s, uint256 x, uint256 y) external {
        // Commented out as it's currently not working
        // if (P256.verifySignature(bytes32(identityCommitment), r, s, x, y)) {
        //     semaphore.addMember(reviewerGroupId, identityCommitment);
        // }
        semaphore.addMember(reviewerGroupId, identityCommitment);
    }

    function getPosts() public view returns (uint256[] memory) {
        return posts;
    }

    function sendPost(
        uint256 merkleTreeDepth,
        uint256 merkleTreeRoot,
        uint256 nullifier,
        uint256 review,
        uint256 reviewerId,
        uint256[8] calldata points
    ) external {
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof(
            merkleTreeDepth,
            merkleTreeRoot,
            nullifier,
            review,
            reviewerId,
            points
        );

        semaphore.validateProof(reviewerGroupId, proof);
        posts.push(review);
    }
}
