/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Network Configuration Constants
 * 
 * Oasys Architecture:
 * - Hub (Layer 1): Main PoS chain with validators and staking
 * - Verse (Layer 2): Gaming-optimized rollups for fast, gasless transactions
 */

export interface NetworkConfig {
	name: string;
	chainId: number;
	rpcUrl: string;
	wsUrl: string;
	explorerUrl: string;
	explorerApiUrl: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	isTestnet: boolean;
	layer: 'hub' | 'verse';
}

/**
 * Oasys Hub (Layer 1) - Mainnet
 * The main Proof-of-Stake chain for security and staking
 */
export const HUB_MAINNET: NetworkConfig = {
	name: 'Oasys Hub Mainnet',
	chainId: 248,
	rpcUrl: 'https://rpc.mainnet.oasys.games',
	wsUrl: 'wss://ws.mainnet.oasys.games',
	explorerUrl: 'https://explorer.oasys.games',
	explorerApiUrl: 'https://explorer.oasys.games/api',
	nativeCurrency: {
		name: 'OAS',
		symbol: 'OAS',
		decimals: 18,
	},
	isTestnet: false,
	layer: 'hub',
};

/**
 * Oasys Hub (Layer 1) - Testnet
 */
export const HUB_TESTNET: NetworkConfig = {
	name: 'Oasys Hub Testnet',
	chainId: 9372,
	rpcUrl: 'https://rpc.testnet.oasys.games',
	wsUrl: 'wss://ws.testnet.oasys.games',
	explorerUrl: 'https://explorer.testnet.oasys.games',
	explorerApiUrl: 'https://explorer.testnet.oasys.games/api',
	nativeCurrency: {
		name: 'OAS',
		symbol: 'OAS',
		decimals: 18,
	},
	isTestnet: true,
	layer: 'hub',
};

/**
 * Network configuration map
 */
export const NETWORKS: Record<string, NetworkConfig> = {
	hub: HUB_MAINNET,
	hubTestnet: HUB_TESTNET,
};

/**
 * Default gas limits for different operation types
 */
export const GAS_LIMITS = {
	transfer: 21000n,
	tokenTransfer: 65000n,
	nftTransfer: 100000n,
	contractCall: 200000n,
	contractDeploy: 3000000n,
	bridgeDeposit: 250000n,
	bridgeWithdraw: 350000n,
	stake: 150000n,
	unstake: 150000n,
	claimRewards: 100000n,
};

/**
 * Block time in seconds per layer
 */
export const BLOCK_TIMES = {
	hub: 15, // Hub has 15 second blocks
	verse: 2, // Verses have faster blocks
};

/**
 * Epoch configuration for Hub
 */
export const EPOCH_CONFIG = {
	blocksPerEpoch: 5760, // Approximately 24 hours
	epochDuration: 86400, // 24 hours in seconds
};

/**
 * Minimum stake amount in OAS
 */
export const STAKING_CONFIG = {
	minimumStake: '10000000000000000000000000', // 10,000,000 OAS for validators
	minimumDelegation: '1000000000000000000', // 1 OAS for delegators
	unbondingPeriod: 10, // epochs
};

/**
 * Bridge configuration
 */
export const BRIDGE_CONFIG = {
	minDeposit: '1000000000000000', // 0.001 OAS
	maxDeposit: '100000000000000000000000', // 100,000 OAS
	depositConfirmations: 64,
	withdrawalDelay: 604800, // 7 days in seconds
};

// Aliases for backward compatibility with main node
export const OASYS_HUB_MAINNET = HUB_MAINNET;
export const OASYS_HUB_TESTNET = HUB_TESTNET;
export const OASYS_NETWORKS = NETWORKS;
