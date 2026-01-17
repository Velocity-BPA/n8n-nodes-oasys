# n8n-nodes-oasys

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node package for the **Oasys blockchain** - a gaming-focused Layer 1/Layer 2 blockchain with Hub and Verse architecture, featuring partnerships with major game studios including SEGA, Bandai Namco, and Ubisoft.

[![npm version](https://badge.fury.io/js/n8n-nodes-oasys.svg)](https://www.npmjs.com/package/n8n-nodes-oasys)
[![License: BSL 1.1](https://img.shields.io/badge/license-BSL--1.1-blue)](https://mariadb.com/bsl11/)

## Features

### Action Node: Oasys
Complete blockchain interactions with 16 resources and 100+ operations:

| Resource | Operations |
|----------|------------|
| **Wallet** | Get balance, transfer OAS/tokens, NFT queries, cross-layer balances |
| **Hub** | Network info, blocks, transactions, validators, staking, epochs |
| **Verse** | Verse info, status, blocks, transactions, gas prices |
| **Bridge** | Deposit/withdraw between Hub and Verse, status tracking |
| **NFT** | Get info, metadata, transfers (ERC721/ERC1155) |
| **Collection** | Collection info, stats, floor prices |
| **Staking** | Stake/unstake OAS, validator delegation, rewards |
| **Validator** | Validator info, performance, delegators |
| **Contract** | Read/write contracts, events, gas estimation |
| **Gaming** | Game info, player stats, partner integrations |
| **Partner** | Game studio information and partnerships |
| **Block** | Block queries for Hub and Verse |
| **Transaction** | Send transactions, status, receipts |
| **Token** | ERC20 token operations |
| **Events** | Contract event queries |
| **Utility** | Unit conversion, address validation, signing |

### Trigger Node: Oasys Trigger
Real-time event monitoring for:
- Wallet events (balance changes, transfers)
- Hub events (new blocks, epoch changes)
- Verse events (blocks, status changes)
- Bridge events (deposits, withdrawals)
- NFT events (transfers, mints, burns)
- Staking events (stake changes, rewards)
- Contract events (custom event monitoring)

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-oasys`
5. Click **Install**

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-oasys.git
cd n8n-nodes-oasys

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
npm link

# In your n8n installation directory
npm link n8n-nodes-oasys
```

### Development Installation

```bash
# 1. Extract the zip file
unzip n8n-nodes-oasys.zip
cd n8n-nodes-oasys

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Create symlink to n8n custom nodes directory
# For Linux/macOS:
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-oasys

# For Windows (run as Administrator):
# mklink /D %USERPROFILE%\.n8n\custom\n8n-nodes-oasys %CD%

# 5. Restart n8n
n8n start
```

## Credentials Setup

### Oasys Network Credentials

| Field | Description |
|-------|-------------|
| **Layer** | Hub Mainnet, Hub Testnet, Verse, or Custom |
| **Verse** | Select from available Verses (if Layer 2) |
| **Private Key** | Your wallet private key (securely stored) |
| **WebSocket URL** | Optional, for real-time subscriptions |

### Oasys API Credentials (Optional)

| Field | Description |
|-------|-------------|
| **Explorer API Key** | For enhanced explorer queries |
| **Gaming API Endpoint** | For game integrations |

## Resources & Operations

### Wallet Resource
- `getBalance` - Get OAS balance for an address
- `getTokenBalance` - Get ERC20 token balance
- `transfer` - Transfer OAS to another address
- `transferToken` - Transfer ERC20 tokens
- `getNfts` - Get NFTs owned by an address
- `getCrossLayerBalances` - Get balances across Hub and Verses

### Hub Resource
- `getInfo` - Get Hub network information
- `getBlock` - Get block by number or hash
- `getTransaction` - Get transaction details
- `getValidators` - Get list of validators
- `getStakingInfo` - Get staking information
- `getEpochInfo` - Get current epoch information
- `getGasPrice` - Get current gas price

### Verse Resource
- `getInfo` - Get Verse information
- `getList` - Get list of all Verses
- `getStatus` - Get Verse status
- `getBlock` - Get Verse block
- `getTransaction` - Get Verse transaction
- `getGasPrice` - Get Verse gas price (often 0 for gasless)

### Bridge Resource
- `deposit` - Deposit OAS from Hub to Verse
- `withdraw` - Withdraw OAS from Verse to Hub
- `getStatus` - Get bridge transaction status
- `getPending` - Get pending bridge transactions
- `getHistory` - Get bridge transaction history

### Staking Resource
- `stake` - Stake OAS to a validator
- `unstake` - Unstake OAS from a validator
- `delegate` - Delegate to a validator
- `getRewards` - Get staking rewards
- `claimRewards` - Claim pending rewards
- `getAPY` - Get current staking APY

### Contract Resource
- `read` - Read contract state
- `write` - Write to contract
- `getEvents` - Get contract events
- `estimateGas` - Estimate gas for transaction

## Trigger Node

The Oasys Trigger node monitors blockchain events in real-time:

| Category | Events |
|----------|--------|
| **Wallet** | Balance changes, incoming/outgoing transfers |
| **Hub** | New blocks, epoch changes, validator updates |
| **Verse** | New blocks, status changes |
| **Bridge** | Deposit/withdrawal initiated, completed |
| **NFT** | Transfers, mints, burns |
| **Staking** | Stake changes, reward distributions |
| **Contract** | Custom contract events |

## Usage Examples

### Get Wallet Balance

```javascript
// Node Configuration
{
  "resource": "wallet",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f1e9a2"
}
```

### Stake OAS to Validator

```javascript
// Node Configuration
{
  "resource": "staking",
  "operation": "stake",
  "validator": "0x...",
  "amount": "1000"  // In OAS
}
```

### Bridge OAS from Hub to Verse

```javascript
// Node Configuration
{
  "resource": "bridge",
  "operation": "deposit",
  "verse": "homeVerse",
  "amount": "100"  // In OAS
}
```

### Monitor New Blocks

```javascript
// Trigger Configuration
{
  "category": "hub",
  "event": "newBlock",
  "pollInterval": 15
}
```

## Oasys Blockchain Concepts

### Two-Layer Architecture

Oasys uses a unique two-layer architecture optimized for gaming:

- **Hub (Layer 1)**: The main Proof-of-Stake chain for security, staking, and validator operations. Chain ID: 248 (mainnet), 9372 (testnet).

- **Verse (Layer 2)**: Gaming-optimized rollups offering fast, gasless transactions. Each Verse is operated by a game studio or partner.

### Key Partners

Major gaming companies operating as validators and Verse operators:
- **SEGA** - Global gaming company
- **Bandai Namco** - Entertainment conglomerate
- **Ubisoft** - Major gaming publisher
- **double jump.tokyo** - Blockchain gaming pioneers
- **Netmarble**, **Com2uS**, **Wemade** - Leading game developers

### Staking

- **Minimum Validator Stake**: 10,000,000 OAS
- **Minimum Delegation**: 1 OAS
- **Epoch Duration**: ~24 hours (5,760 blocks)
- **Unbonding Period**: 10 epochs
- **Default Commission**: 10%

### Bridging

- **Deposit Time**: ~15 minutes (64 Hub confirmations)
- **Withdrawal Time**: 7 days (challenge period)
- **Minimum Amount**: 0.001 OAS
- **Maximum Amount**: 100,000 OAS per transaction

## Networks

### Hub (Layer 1)

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 248 | https://rpc.mainnet.oasys.games |
| Testnet | 9372 | https://rpc.testnet.oasys.games |

### Available Verses (Layer 2)

| Verse | Chain ID | Features |
|-------|----------|----------|
| HOME Verse | 19011 | Official Oasys Verse, Gasless |
| MCH Verse | 29548 | My Crypto Heroes, Gasless |
| TCG Verse | 2400 | Trading Card Games, Gasless |
| Saakuru Verse | 7225878 | Saakuru Games |
| Chain Verse | 5555 | Chain Games |
| DeFi Verse | 16116 | DeFi Applications |
| Yooldo Verse | 50006 | Yooldo Games |
| GEEK Verse | 75512 | GEEK Games |

## Error Handling

The node provides detailed error messages for common issues:

| Error | Cause | Solution |
|-------|-------|----------|
| `INSUFFICIENT_FUNDS` | Not enough OAS for transaction | Add more OAS to your wallet |
| `INVALID_ADDRESS` | Malformed Ethereum address | Check address format (0x...) |
| `BRIDGE_LIMIT_EXCEEDED` | Amount exceeds bridge limits | Reduce amount or split transaction |
| `VALIDATOR_NOT_FOUND` | Invalid validator address | Verify validator is active |
| `NETWORK_ERROR` | RPC connection failed | Check network and RPC URL |

## Security Best Practices

1. **Never share private keys** - Store securely in n8n credentials
2. **Use test wallets** - Test operations with small amounts first
3. **Verify addresses** - Double-check all addresses before transactions
4. **Monitor bridge operations** - Track deposits and withdrawals
5. **Use gasless Verses** - Leverage Verse L2 for free transactions

## Development

### Build Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development mode (watch)
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Format code
npm run format
```

### Project Structure

```
n8n-nodes-oasys/
├── credentials/
│   ├── OasysNetwork.credentials.ts
│   ├── OasysApi.credentials.ts
│   └── VerseCredentials.credentials.ts
├── nodes/
│   └── Oasys/
│       ├── Oasys.node.ts
│       ├── OasysTrigger.node.ts
│       ├── oasys.svg
│       ├── constants/
│       │   ├── networks.ts
│       │   ├── verses.ts
│       │   ├── contracts.ts
│       │   ├── validators.ts
│       │   └── partners.ts
│       ├── transport/
│       │   ├── hubClient.ts
│       │   ├── verseClient.ts
│       │   ├── bridgeClient.ts
│       │   └── apiClient.ts
│       └── utils/
│           ├── unitConverter.ts
│           ├── layerUtils.ts
│           ├── bridgeUtils.ts
│           └── validatorUtils.ts
├── test/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── test.sh
│   ├── build.sh
│   └── install-local.sh
├── package.json
├── tsconfig.json
├── LICENSE
├── COMMERCIAL_LICENSE.md
├── LICENSING_FAQ.md
└── README.md
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-oasys/issues)
- **Documentation**: [Oasys Docs](https://docs.oasys.games)
- **Licensing**: [licensing@velobpa.com](mailto:licensing@velobpa.com)

## Acknowledgments

- [Oasys](https://oasys.games) - For building the gaming-focused blockchain
- [n8n](https://n8n.io) - For the workflow automation platform
- SEGA, Bandai Namco, Ubisoft - For pioneering blockchain gaming adoption
