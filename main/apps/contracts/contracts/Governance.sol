// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgenticID.sol";

contract Governance is Ownable {
    // Reference to the AgenticID contract
    AgenticIDNFT public agenticID;

    // Structure for storing proposal information
    struct Proposal {
        string name;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        uint256 endTime;
        address proposer;
        bytes executionData;
    }

    // Minimum voting period in seconds (3 days)
    uint256 public constant VOTING_PERIOD = 3 days;

    // Array to store all proposals
    Proposal[] public proposals;

    // Mapping to track if an address has voted on a specific proposal
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Membership tracking
    mapping(address => bool) public isMember;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string name
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event MemberJoined(address indexed member);

    // Constructor takes the address of the AgenticID contract
    constructor(address _agenticIDAddress) Ownable(msg.sender) {
        agenticID = AgenticIDNFT(_agenticIDAddress);
    }

    /**
     * @dev Join the governance community
     * @notice User must have an AgenticID NFT and meet governance participation requirements
     */
    function joinCommunity() external {
        require(
            agenticID.canParticipateInGovernance(msg.sender),
            "Governance: Not eligible to participate"
        );
        require(!isMember[msg.sender], "Governance: Already a member");

        isMember[msg.sender] = true;
        emit MemberJoined(msg.sender);
    }

    /**
     * @dev Create a new proposal
     * @param name Short name/title of the proposal
     * @param description Detailed description of the proposal
     * @param executionData Data to be executed if the proposal passes
     */
    function createProposal(
        string memory name,
        string memory description,
        bytes memory executionData
    ) external {
        require(
            isMember[msg.sender],
            "Governance: Only members can create proposals"
        );
        require(bytes(name).length > 0, "Governance: Name cannot be empty");
        require(
            bytes(description).length > 0,
            "Governance: Description cannot be empty"
        );

        // Create new proposal and add it to the array
        proposals.push(
            Proposal({
                name: name,
                description: description,
                forVotes: 0,
                againstVotes: 0,
                executed: false,
                endTime: block.timestamp + VOTING_PERIOD,
                proposer: msg.sender,
                executionData: executionData
            })
        );

        emit ProposalCreated(proposals.length - 1, msg.sender, name);
    }

    /**
     * @dev Vote on a proposal
     * @param proposalId ID of the proposal to vote on
     * @param support True for voting in favor, false for voting against
     */
    function vote(uint256 proposalId, bool support) external {
        require(
            proposalId < proposals.length,
            "Governance: Invalid proposal ID"
        );
        require(isMember[msg.sender], "Governance: Only members can vote");
        require(
            !hasVoted[proposalId][msg.sender],
            "Governance: Already voted on this proposal"
        );
        require(
            block.timestamp < proposals[proposalId].endTime,
            "Governance: Voting period has ended"
        );
        require(
            !proposals[proposalId].executed,
            "Governance: Proposal already executed"
        );

        Proposal storage proposal = proposals[proposalId];

        // Calculate voting weight based on user's AgenticID data
        uint256 weight = calculateVotingWeight(msg.sender);

        // Update vote counts
        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        // Mark that this address has voted
        hasVoted[proposalId][msg.sender] = true;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @dev Execute a proposal after the voting period has ended
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        require(
            proposalId < proposals.length,
            "Governance: Invalid proposal ID"
        );
        require(
            !proposals[proposalId].executed,
            "Governance: Proposal already executed"
        );
        require(
            block.timestamp >= proposals[proposalId].endTime,
            "Governance: Voting period not ended"
        );

        Proposal storage proposal = proposals[proposalId];

        // Check if the proposal has passed (more for votes than against)
        require(
            proposal.forVotes > proposal.againstVotes,
            "Governance: Proposal did not pass"
        );

        // Mark proposal as executed
        proposal.executed = true;

        // Here you would typically execute the proposal's actions
        // If complex execution is needed, you can call other contracts or functions

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Get the total number of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @dev Get details of a specific proposal
     * @param proposalId ID of the proposal to query
     */
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            bool executed,
            uint256 endTime,
            address proposer
        )
    {
        require(
            proposalId < proposals.length,
            "Governance: Invalid proposal ID"
        );

        Proposal storage proposal = proposals[proposalId];

        return (
            proposal.name,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.endTime,
            proposal.proposer
        );
    }

    /**
     * @dev Calculate the voting weight of a user
     * @param voter Address of the voter
     * @return The voting weight (in wei)
     */
    function calculateVotingWeight(
        address voter
    ) internal view returns (uint256) {
        uint256 tokenId = agenticID.getUserTokenId(voter);
        require(tokenId > 0, "Governance: User does not have an AgenticID");

        // Get the identity data
        (
            bool ensVerified,
            bool faceVerified,
            bool twitterVerified,
            bool worldcoinVerified,
            string memory nationality,
            uint256 walletScore,
            uint256 farcasterScore,
            uint256 lastUpdated
        ) = extractIdentityData(agenticID.getIdentity(tokenId));

        // Base weight is 1 ether
        uint256 weight = 1 ether;

        // Add weight for verifications
        if (ensVerified) weight += 0.2 ether;
        if (faceVerified) weight += 0.2 ether;
        if (twitterVerified) weight += 0.2 ether;
        if (worldcoinVerified) weight += 0.4 ether;

        // Add weight for scores (normalized)
        weight += (walletScore * 1 ether) / 100;
        weight += (farcasterScore * 1 ether) / 100;

        return weight;
    }

    /**
     * @dev Helper function to extract identity data from the AgenticID struct
     * Note: This is needed because Solidity doesn't directly support returning struct from external calls
     */
    function extractIdentityData(
        AgenticIDNFT.AgenticIdentity memory identity
    )
        internal
        pure
        returns (
            bool ensVerified,
            bool faceVerified,
            bool twitterVerified,
            bool worldcoinVerified,
            string memory nationality,
            uint256 walletScore,
            uint256 farcasterScore,
            uint256 lastUpdated
        )
    {
        return (
            identity.ensVerified,
            identity.faceVerified,
            identity.twitterVerified,
            identity.worldcoinVerified,
            identity.nationality,
            identity.walletScore,
            identity.farcasterScore,
            identity.lastUpdated
        );
    }

    /**
     * @dev Update the AgenticID contract address
     * @param _newAgenticIDAddress Address of the new AgenticID contract
     */
    function setAgenticIDAddress(
        address _newAgenticIDAddress
    ) external onlyOwner {
        agenticID = AgenticIDNFT(_newAgenticIDAddress);
    }
}
