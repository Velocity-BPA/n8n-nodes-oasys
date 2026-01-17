/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Layer Utilities for Oasys
 * 
 * Helpers for working with Oasys's two-layer architecture:
 * - Hub (Layer 1): Main PoS chain
 * - Verse (Layer 2): Gaming-optimized rollups
 */

import { isAddress, getAddress } from 'ethers';
import { NETWORKS, type NetworkConfig } from '../constants/networks';
import { VERSES, type VerseConfig, getVerseConfig } from '../constants/verses';

export type LayerType = 'hub' | 'verse';

/**
 * Determine layer type from chain ID
 */
export function getLayerFromChainId(chainId: number): LayerType {
	// Hub mainnet is 248, testnet is 9372
	if (chainId === 248 || chainId === 9372) {
		return 'hub';
	}
	return 'verse';
}

/**
 * Get network config from layer and optional verse
 */
export function getNetworkConfig(
	layer: string,
	verse?: string,
	customRpcUrl?: string,
	customChainId?: number
): NetworkConfig | VerseConfig | null {
	if (layer === 'custom') {
		return {
			name: 'Custom Network',
			chainId: customChainId ?? 248,
			rpcUrl: customRpcUrl ?? '',
			wsUrl: '',
			explorerUrl: '',
			explorerApiUrl: '',
			nativeCurrency: {
				name: 'OAS',
				symbol: 'OAS',
				decimals: 18,
			},
			isTestnet: false,
			layer: 'hub',
		};
	}

	if (layer === 'verse' && verse) {
		return getVerseConfig(verse) ?? null;
	}

	return NETWORKS[layer] ?? null;
}

/**
 * Get RPC URL for a given layer/verse combination
 */
export function getRpcUrl(
	layer: string,
	verse?: string,
	customRpcUrl?: string
): string {
	if (layer === 'custom') {
		return customRpcUrl ?? '';
	}

	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		if (verseConfig) {
			return verse === 'customVerse' ? customRpcUrl ?? '' : verseConfig.rpcUrl;
		}
	}

	const network = NETWORKS[layer];
	return network?.rpcUrl ?? '';
}

/**
 * Get chain ID for a given layer/verse combination
 */
export function getChainId(
	layer: string,
	verse?: string,
	customChainId?: number
): number {
	if (layer === 'custom') {
		return customChainId ?? 248;
	}

	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		return verseConfig?.chainId ?? 0;
	}

	const network = NETWORKS[layer];
	return network?.chainId ?? 248;
}

/**
 * Validate address format
 */
export function validateAddress(address: string): {
	isValid: boolean;
	checksumed?: string;
	error?: string;
} {
	try {
		if (!isAddress(address)) {
			return {
				isValid: false,
				error: 'Invalid address format',
			};
		}

		const checksumed = getAddress(address);
		return {
			isValid: true,
			checksumed,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : 'Invalid address',
		};
	}
}

/**
 * Check if address is a contract
 */
export async function isContract(
	address: string,
	provider: { getCode: (address: string) => Promise<string> }
): Promise<boolean> {
	try {
		const code = await provider.getCode(address);
		return code !== '0x';
	} catch {
		return false;
	}
}

/**
 * Get explorer URL for an address
 */
export function getExplorerAddressUrl(
	address: string,
	layer: string,
	verse?: string
): string {
	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		if (verseConfig) {
			return `${verseConfig.explorerUrl}/address/${address}`;
		}
	}

	const network = NETWORKS[layer];
	if (network) {
		return `${network.explorerUrl}/address/${address}`;
	}

	return '';
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerTxUrl(
	txHash: string,
	layer: string,
	verse?: string
): string {
	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		if (verseConfig) {
			return `${verseConfig.explorerUrl}/tx/${txHash}`;
		}
	}

	const network = NETWORKS[layer];
	if (network) {
		return `${network.explorerUrl}/tx/${txHash}`;
	}

	return '';
}

/**
 * Get explorer URL for a block
 */
export function getExplorerBlockUrl(
	blockNumber: number,
	layer: string,
	verse?: string
): string {
	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		if (verseConfig) {
			return `${verseConfig.explorerUrl}/block/${blockNumber}`;
		}
	}

	const network = NETWORKS[layer];
	if (network) {
		return `${network.explorerUrl}/block/${blockNumber}`;
	}

	return '';
}

/**
 * Format layer info for display
 */
export function formatLayerInfo(layer: string, verse?: string): string {
	if (layer === 'hub') {
		return 'Oasys Hub (L1)';
	}
	if (layer === 'hubTestnet') {
		return 'Oasys Hub Testnet (L1)';
	}
	if (layer === 'verse' && verse) {
		const verseConfig = VERSES[verse];
		return verseConfig ? `${verseConfig.name} (L2)` : 'Unknown Verse (L2)';
	}
	return 'Custom Network';
}

/**
 * Check if layer supports gasless transactions
 */
export function isGaslessSupported(layer: string, verse?: string): boolean {
	// Hub never supports gasless
	if (layer !== 'verse') {
		return false;
	}

	if (verse) {
		const verseConfig = VERSES[verse];
		return verseConfig?.isGasless ?? false;
	}

	return false;
}

/**
 * Get appropriate gas configuration for layer
 */
export function getGasConfig(
	layer: string,
	verse?: string
): {
	useGas: boolean;
	defaultGasLimit: bigint;
	defaultGasPrice?: bigint;
} {
	const isGasless = isGaslessSupported(layer, verse);

	if (isGasless) {
		return {
			useGas: false,
			defaultGasLimit: 0n,
		};
	}

	// Hub default config
	if (layer === 'hub' || layer === 'hubTestnet') {
		return {
			useGas: true,
			defaultGasLimit: 21000n,
			defaultGasPrice: 1000000000n, // 1 Gwei
		};
	}

	// Verse with gas
	return {
		useGas: true,
		defaultGasLimit: 21000n,
		defaultGasPrice: 1000000n, // 0.001 Gwei (L2 is cheaper)
	};
}

/**
 * Check if layer is Hub (Layer 1)
 */
export function isHubLayer(layer: string): boolean {
	return layer === 'hub' || layer === 'hubMainnet' || layer === 'hubTestnet';
}

/**
 * Get explorer URL (generic - defaults to address lookup)
 */
export function getExplorerUrl(
	identifier: string,
	layer: string,
	verse?: string,
	type: 'address' | 'tx' | 'block' = 'address'
): string {
	switch (type) {
		case 'tx':
			return getExplorerTxUrl(identifier, layer, verse);
		case 'block':
			return getExplorerBlockUrl(parseInt(identifier, 10), layer, verse);
		default:
			return getExplorerAddressUrl(identifier, layer, verse);
	}
}
