const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgenticIDNFT Contract", function () {
    let AgenticIDNFT;
    let agenticID;
    let owner;
    let user1;
    let user2;
    let baseURI = "https://api.agenticid.com/metadata/";
    let defaultImageURI = "ipfs://QmDefaultImageHash";

    beforeEach(async function () {
        // Get signers for testing
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy the contract
        AgenticIDNFT = await ethers.getContractFactory("AgenticIDNFT");
        agenticID = await AgenticIDNFT.deploy(baseURI, defaultImageURI);
        await agenticID.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await agenticID.owner()).to.equal(owner.address);
        });

        it("Should set the correct default image URI", async function () {
            expect(await agenticID.defaultImageURI()).to.equal(defaultImageURI);
        });
    });

    describe("Minting", function () {
        it("Should mint an AgenticID NFT", async function () {
            // Mint a new AgenticID
            await agenticID.connect(user1).mintAgenticID(
                true, // ENS verified
                true, // Face verified
                false, // Twitter verified
                true, // Worldcoin verified
                "American", // Nationality
                80, // Wallet score
                60 // Farcaster score
            );

            // Check that the NFT was minted to the correct user
            const tokenId = await agenticID.getUserTokenId(user1.address);
            expect(tokenId).to.equal(1);
            expect(await agenticID.ownerOf(tokenId)).to.equal(user1.address);

            // Check identity details
            const identity = await agenticID.getIdentity(tokenId);
            expect(identity.ensVerified).to.equal(true);
            expect(identity.faceVerified).to.equal(true);
            expect(identity.twitterVerified).to.equal(false);
            expect(identity.worldcoinVerified).to.equal(true);
            expect(identity.nationality).to.equal("American");
            expect(identity.walletScore).to.equal(80);
            expect(identity.farcasterScore).to.equal(60);
        });

        it("Should prevent a user from minting multiple AgenticIDs", async function () {
            // Mint first NFT
            await agenticID.connect(user1).mintAgenticID(
                true, false, false, true, "Canadian", 70, 50
            );

            // Attempt to mint a second NFT for the same user
            await expect(
                agenticID.connect(user1).mintAgenticID(
                    true, false, false, true, "Canadian", 70, 50
                )
            ).to.be.revertedWith("AgenticID: User already has an NFT");
        });

        it("Should require a non-empty nationality", async function () {
            await expect(
                agenticID.connect(user1).mintAgenticID(
                    true, false, false, true, "", 70, 50
                )
            ).to.be.revertedWith("AgenticID: Nationality cannot be empty");
        });
    });

    describe("Identity Updates", function () {
        beforeEach(async function () {
            // Mint NFTs for testing
            await agenticID.connect(user1).mintAgenticID(
                true, false, false, true, "Canadian", 70, 50
            );
        });

        it("Should allow owner to update a user's identity", async function () {
            await agenticID.connect(owner).updateIdentity(
                user1.address,
                false, // ENS verified
                true,  // Face verified
                true,  // Twitter verified
                true,  // Worldcoin verified
                "Brazilian", // New nationality
                85, // New wallet score
                75  // New Farcaster score
            );

            const tokenId = await agenticID.getUserTokenId(user1.address);
            const identity = await agenticID.getIdentity(tokenId);

            expect(identity.ensVerified).to.equal(false);
            expect(identity.faceVerified).to.equal(true);
            expect(identity.twitterVerified).to.equal(true);
            expect(identity.nationality).to.equal("Brazilian");
            expect(identity.walletScore).to.equal(85);
            expect(identity.farcasterScore).to.equal(75);
        });

        it("Should prevent non-owners from updating a user's identity", async function () {
            await expect(
                agenticID.connect(user2).updateIdentity(
                    user1.address, false, true, true, true, "Mexican", 90, 80
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow users to update their own verification status", async function () {
            await agenticID.connect(user1).updateVerificationStatus(
                false, // New ENS verified status
                true,  // New Face verified status
                true,  // New Twitter verified status
                false  // New Worldcoin verified status
            );

            const tokenId = await agenticID.getUserTokenId(user1.address);
            const identity = await agenticID.getIdentity(tokenId);

            expect(identity.ensVerified).to.equal(false);
            expect(identity.faceVerified).to.equal(true);
            expect(identity.twitterVerified).to.equal(true);
            expect(identity.worldcoinVerified).to.equal(false);

            // Other fields should remain unchanged
            expect(identity.nationality).to.equal("Canadian");
            expect(identity.walletScore).to.equal(70);
            expect(identity.farcasterScore).to.equal(50);
        });

        it("Should allow the owner to update a user's scores", async function () {
            await agenticID.connect(owner).updateScores(
                user1.address,
                95, // New wallet score
                85  // New Farcaster score
            );

            const tokenId = await agenticID.getUserTokenId(user1.address);
            const identity = await agenticID.getIdentity(tokenId);

            expect(identity.walletScore).to.equal(95);
            expect(identity.farcasterScore).to.equal(85);

            // Other fields should remain unchanged
            expect(identity.ensVerified).to.equal(true);
            expect(identity.faceVerified).to.equal(false);
            expect(identity.nationality).to.equal("Canadian");
        });
    });

    describe("Governance Participation", function () {
        it("Should determine governance participation eligibility correctly", async function () {
            // Scenario 1: User with Worldcoin verification and ENS verification
            await agenticID.connect(user1).mintAgenticID(
                true,  // ENS verified
                false, // Face verified
                false, // Twitter verified
                true,  // Worldcoin verified
                "British", 70, 60
            );

            // Should be eligible for governance
            expect(await agenticID.canParticipateInGovernance(user1.address)).to.equal(true);

            // Scenario 2: User with Worldcoin verification but no other verification
            await agenticID.connect(user2).mintAgenticID(
                false, // ENS verified
                false, // Face verified
                false, // Twitter verified
                true,  // Worldcoin verified
                "Australian", 65, 55
            );

            // Should not be eligible for governance
            expect(await agenticID.canParticipateInGovernance(user2.address)).to.equal(false);

            // Update user2 to have Twitter verification
            await agenticID.connect(user2).updateVerificationStatus(false, false, true, true);

            // Now should be eligible
            expect(await agenticID.canParticipateInGovernance(user2.address)).to.equal(true);
        });

        it("Should return false for addresses without an AgenticID", async function () {
            expect(await agenticID.canParticipateInGovernance(user1.address)).to.equal(false);
        });
    });

    describe("URI Functions", function () {
        it("Should allow owner to update base URI", async function () {
            const newBaseURI = "https://new.agenticid.com/metadata/";
            await agenticID.connect(owner).setBaseURI(newBaseURI);

            // Mint an NFT and check its tokenURI
            await agenticID.connect(user1).mintAgenticID(
                true, false, false, true, "Dutch", 75, 65
            );

            const tokenId = await agenticID.getUserTokenId(user1.address);
            expect(await agenticID.tokenURI(tokenId)).to.equal(`${newBaseURI}${tokenId}`);
        });

        it("Should allow owner to update default image URI", async function () {
            const newImageURI = "ipfs://QmNewDefaultImageHash";
            await agenticID.connect(owner).setDefaultImageURI(newImageURI);
            expect(await agenticID.defaultImageURI()).to.equal(newImageURI);
        });

        it("Should revert when querying tokenURI for non-existent tokens", async function () {
            await expect(agenticID.tokenURI(999)).to.be.revertedWith(
                "AgenticID: URI query for nonexistent token"
            );
        });
    });

    describe("Error Handling", function () {
        it("Should revert when trying to update identity for a user without an NFT", async function () {
            await expect(
                agenticID.connect(owner).updateIdentity(
                    user1.address, true, true, true, true, "German", 80, 70
                )
            ).to.be.revertedWith("AgenticID: User does not have an NFT");
        });

        it("Should revert when trying to update verification status without an NFT", async function () {
            await expect(
                agenticID.connect(user1).updateVerificationStatus(true, true, true, true)
            ).to.be.revertedWith("AgenticID: User does not have an NFT");
        });

        it("Should revert when trying to update scores for a user without an NFT", async function () {
            await expect(
                agenticID.connect(owner).updateScores(user1.address, 90, 80)
            ).to.be.revertedWith("AgenticID: User does not have an NFT");
        });

        it("Should revert when querying non-existent identity", async function () {
            await expect(agenticID.getIdentity(999)).to.be.revertedWith(
                "AgenticID: Identity does not exist"
            );
        });
    });
}); 