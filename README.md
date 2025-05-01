# 🥳 Introduction AgenticID 

AgenticID is a decentralized identity aggregation and verification protocol built on Rootstock blockchain that empowers users with comprehensive identity verification through multiple proof vectors. By leveraging zero-knowledge proofs and tensor AI models, AgenticID creates a privacy-preserving, trustless verification identity that bridges on-chain and off-chain identity elements while keeping user data secure and sovereign.

Our solution addresses the critical need for reliable, privacy-preserving identity in Web3 by combining multiple verification methods: ENS verification, liveness detection, humanity proof via Worldchain, social media verification through TLSNotary, nationality verification using AnonAadhaar, and reputation scoring through advanced AI models—all unified on Rootstock's secure and Bitcoin-backed infrastructure.

## Contracts

AgenticID Contract: [0x419cFe85e77a0A26B9989059057318F59764F7C5](https://explorer.testnet.rootstock.io/address/0x419cFe85e77a0A26B9989059057318F59764F7C5)

Governance Contract: [0x0b3a2D73D07eA2D5D0D0FB4Db09004f74D92767a](https://explorer.testnet.rootstock.io/address/0x0b3a2D73D07eA2D5D0D0FB4Db09004f74D92767a)

## The Problem: Identity Fragmentation in Web3

The blockchain ecosystem suffers from severe identity fragmentation and verification challenges:

- **Trust Gap**: DeFi protocols and DAOs lack reliable mechanisms to verify real human users without compromising privacy
- **Sybil Attacks**: Projects remain vulnerable to manipulation through multiple fake identities
- **Siloed Verification**: Users must repeatedly verify identity across different platforms with no unified solution
- **Privacy vs. Verification Tradeoff**: Current solutions force users to choose between privacy and verifiability
- **Limited Cross-Chain Identity**: Identity systems lack interoperability across blockchain ecosystems
- **Reputation Isolation**: On-chain reputation and credit history remain disconnected and underutilized

This fragmentation creates friction for users, increases costs, and prevents mainstream adoption of Web3 applications.

## Technical Implementation on Rootstock

### Graph
```mermaid
graph TD
    subgraph "Frontend Layer"
        WebApp[Web App - Next.js 14]
        style WebApp fill:#D4F1F9,stroke:#333
    end

    subgraph "Backend Services"
        Server[REST API Server]
        AI[AI Service - TensorFlow]
        style Server fill:#FFE6CC,stroke:#333
        style AI fill:#E1D5E7,stroke:#333
    end

    subgraph "Blockchain Layer"
        Contracts[Smart Contracts]
        RootstockBC[Rootstock Blockchain]
        style Contracts fill:#D5E8D4,stroke:#333
        style RootstockBC fill:#DAE8FC,stroke:#333
    end

    subgraph "External Services"
        WorldCoin[World ID]
        Twitter[Twitter Verification]
        ENS[ENS Service]
        AnonAadhaar[Anon Aadhaar]
        FaceVerification[Face Verification]
        style WorldCoin fill:#FFF2CC,stroke:#333
        style Twitter fill:#FFF2CC,stroke:#333
        style ENS fill:#FFF2CC,stroke:#333
        style AnonAadhaar fill:#FFF2CC,stroke:#333
        style FaceVerification fill:#FFF2CC,stroke:#333
    end

    WebApp --> Server
    WebApp --> Contracts
    Server --> AI
    Contracts --> RootstockBC

    WebApp --> WorldCoin
    WebApp --> Twitter
    WebApp --> ENS
    WebApp --> AnonAadhaar
    WebApp --> FaceVerification
```

````mermaid
sequenceDiagram
    actor User
    participant WebApp as Web App
    participant Server as API Server
    participant AI as AI Service
    participant ExternalServices as External Verification Services
    participant Blockchain as Rootstock Blockchain

    User->>WebApp: Visit Agentic Identity platform

    Note over User,WebApp: Verification Phase

    User->>WebApp: Connect wallet
    WebApp->>ExternalServices: ENS verification check
    ExternalServices-->>WebApp: ENS verification status

    User->>WebApp: Request face verification
    WebApp->>ExternalServices: Process face verification
    ExternalServices-->>WebApp: Face verification result

    User->>WebApp: Connect with Worldcoin
    WebApp->>ExternalServices: Verify with World ID
    ExternalServices-->>WebApp: Human verification proof

    User->>WebApp: Connect with Anon Aadhaar
    WebApp->>ExternalServices: Verify nationality
    ExternalServices-->>WebApp: Nationality verification proof

    Note over User,AI: Reputation Scoring Phase

    User->>WebApp: Request wallet reputation score
    WebApp->>Server: GET /api/score/enhanced/:walletAddress
    Server->>AI: Request enhanced reputation score
    AI->>AI: Run AI model inference
    AI-->>Server: Return score, confidence & factors
    Server-->>WebApp: Return reputation data
    WebApp-->>User: Display reputation score

    Note over User,Blockchain: NFT Minting Phase

    User->>WebApp: Mint AgenticID NFT
    WebApp->>Blockchain: Call mintAgenticID(...)
    Note right of WebApp: Pass verification flags, nationality, wallet score
    Blockchain-->>WebApp: Return transaction result
    WebApp-->>User: Display NFT minting confirmation

    User->>WebApp: Request identity details
    WebApp->>Blockchain: Call getIdentity(tokenId)
    Blockchain-->>WebApp: Return identity details
    WebApp-->>User: Display identity details
    ```

## Data Flow

```mermaid
flowchart TD
    subgraph Client
        WebApp[Web App]
    end

    subgraph Server
        APIController[Score Controller]
        ScoreService[Score Service]
    end

    subgraph AIService
        AIEndpoint[AI API Endpoint]
        ScoreGenerator[Score Generator]
        FeatureExtractor[Feature Extractor]
        Model[TensorFlow Model]
        MockGen[Mock Generator]
    end

    WebApp-->|GET /api/score/enhanced/:address|APIController
    APIController-->|getEnhancedReputationScore|ScoreService
    ScoreService-->|HTTP Request|AIEndpoint
    AIEndpoint-->|generateScore|ScoreGenerator

    ScoreGenerator-->|Extract Features|FeatureExtractor
    FeatureExtractor-->|Features|ScoreGenerator
    ScoreGenerator-->|Prediction Request|Model
    Model-->|Score Prediction|ScoreGenerator

    %% Fallback path
    ScoreGenerator-.->|Fallback on Error|MockGen

    ScoreGenerator-->|Score Response|AIEndpoint
    AIEndpoint-->|JSON Response|ScoreService
    ScoreService-->|Score Data|APIController
    APIController-->|JSON Response|WebApp

    WebApp-->|Display Score|User((User))
    User-->|Mint NFT with Score|Blockchain[Rootstock Blockchain]
```
