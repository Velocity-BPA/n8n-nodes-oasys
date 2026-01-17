/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Unit Conversion Utilities for Oasys
 * 
 * OAS uses 18 decimal places like ETH
 */

import { formatUnits, parseUnits } from 'ethers';

/**
 * Convert wei to OAS
 */
export function weiToOas(wei: string | bigint): string {
	return formatUnits(wei.toString(), 18);
}

/**
 * Convert OAS to wei
 */
export function oasToWei(oas: string | number): bigint {
	return parseUnits(oas.toString(), 18);
}

/**
 * Convert wei to Gwei
 */
export function weiToGwei(wei: string | bigint): string {
	return formatUnits(wei.toString(), 9);
}

/**
 * Convert Gwei to wei
 */
export function gweiToWei(gwei: string | number): bigint {
	return parseUnits(gwei.toString(), 9);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: string | bigint, decimals: number): string {
	return formatUnits(amount.toString(), decimals);
}

/**
 * Parse token amount to smallest unit
 */
export function parseTokenAmount(amount: string | number, decimals: number): bigint {
	return parseUnits(amount.toString(), decimals);
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num: number | string): string {
	const n = typeof num === 'string' ? parseFloat(num) : num;
	
	if (n >= 1e12) {
		return `${(n / 1e12).toFixed(2)}T`;
	}
	if (n >= 1e9) {
		return `${(n / 1e9).toFixed(2)}B`;
	}
	if (n >= 1e6) {
		return `${(n / 1e6).toFixed(2)}M`;
	}
	if (n >= 1e3) {
		return `${(n / 1e3).toFixed(2)}K`;
	}
	return n.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
	return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(
	oldValue: number,
	newValue: number
): number {
	if (oldValue === 0) return 0;
	return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format OAS balance for display
 */
export function formatOasBalance(wei: string | bigint, decimals: number = 4): string {
	const oas = weiToOas(wei);
	const num = parseFloat(oas);
	return num.toFixed(decimals);
}

/**
 * Format gas price for display
 */
export function formatGasPrice(wei: string | bigint): string {
	const gwei = weiToGwei(wei);
	return `${parseFloat(gwei).toFixed(2)} Gwei`;
}

/**
 * Estimate transaction cost
 */
export function estimateTransactionCost(
	gasLimit: bigint,
	gasPrice: bigint
): {
	wei: bigint;
	oas: string;
	gwei: string;
} {
	const costWei = gasLimit * gasPrice;
	return {
		wei: costWei,
		oas: weiToOas(costWei),
		gwei: weiToGwei(costWei),
	};
}

/**
 * Convert epoch to timestamp
 */
export function epochToTimestamp(
	epoch: number,
	epochDuration: number = 86400,
	genesisTimestamp: number = 0
): number {
	return genesisTimestamp + epoch * epochDuration;
}

/**
 * Convert timestamp to epoch
 */
export function timestampToEpoch(
	timestamp: number,
	epochDuration: number = 86400,
	genesisTimestamp: number = 0
): number {
	return Math.floor((timestamp - genesisTimestamp) / epochDuration);
}

/**
 * Format OAS (alias for formatOasBalance with default 4 decimals)
 */
export function formatOas(wei: string | bigint, decimals: number = 4): string {
	return formatOasBalance(wei, decimals);
}

/**
 * Format Gwei (alias for weiToGwei)
 */
export function formatGwei(wei: string | bigint): string {
	return weiToGwei(wei);
}
