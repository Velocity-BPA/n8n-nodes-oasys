/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Bridge Utilities for Oasys
 * 
 * Helpers for Hub <-> Verse bridging operations
 */

import { BRIDGE_CONFIG } from '../constants/networks';
import { VERSES, type VerseConfig } from '../constants/verses';
import { HUB_CONTRACTS, VERSE_CONTRACTS } from '../constants/contracts';

export type BridgeDirection = 'deposit' | 'withdraw';

export interface BridgeStatus {
	status: 'pending' | 'completed' | 'failed' | 'challenge';
	direction: BridgeDirection;
	amount: string;
	fromChain: number;
	toChain: number;
	txHash: string;
	timestamp: number;
	confirmations?: number;
	requiredConfirmations?: number;
	estimatedCompletionTime?: number;
}

export interface BridgeLimits {
	minDeposit: bigint;
	maxDeposit: bigint;
	minWithdraw: bigint;
	maxWithdraw: bigint;
	dailyLimit?: bigint;
	remainingDailyLimit?: bigint;
}

/**
 * Get bridge contract addresses for a verse
 */
export function getBridgeContracts(verseKey: string): {
	l1Bridge: string;
	l2Bridge: string;
	l1Messenger: string;
	l2Messenger: string;
} {
	const verse = VERSES[verseKey];
	
	return {
		l1Bridge: verse?.bridgeAddress ?? HUB_CONTRACTS.l1StandardBridge,
		l2Bridge: VERSE_CONTRACTS.l2StandardBridge,
		l1Messenger: HUB_CONTRACTS.l1CrossDomainMessenger,
		l2Messenger: VERSE_CONTRACTS.l2CrossDomainMessenger,
	};
}

/**
 * Get default bridge limits
 */
export function getDefaultBridgeLimits(): BridgeLimits {
	return {
		minDeposit: BigInt(BRIDGE_CONFIG.minDeposit),
		maxDeposit: BigInt(BRIDGE_CONFIG.maxDeposit),
		minWithdraw: BigInt(BRIDGE_CONFIG.minDeposit),
		maxWithdraw: BigInt(BRIDGE_CONFIG.maxDeposit),
	};
}

/**
 * Validate bridge amount
 */
export function validateBridgeAmount(
	amount: bigint,
	direction: BridgeDirection,
	limits: BridgeLimits = getDefaultBridgeLimits()
): { isValid: boolean; error?: string } {
	const min = direction === 'deposit' ? limits.minDeposit : limits.minWithdraw;
	const max = direction === 'deposit' ? limits.maxDeposit : limits.maxWithdraw;

	if (amount < min) {
		return {
			isValid: false,
			error: `Amount below minimum: ${min.toString()}`,
		};
	}

	if (amount > max) {
		return {
			isValid: false,
			error: `Amount exceeds maximum: ${max.toString()}`,
		};
	}

	if (limits.remainingDailyLimit && amount > limits.remainingDailyLimit) {
		return {
			isValid: false,
			error: `Amount exceeds remaining daily limit: ${limits.remainingDailyLimit.toString()}`,
		};
	}

	return { isValid: true };
}

/**
 * Estimate bridge completion time
 */
export function estimateBridgeTime(direction: BridgeDirection): {
	minTime: number;
	maxTime: number;
	averageTime: number;
	unit: string;
} {
	if (direction === 'deposit') {
		// Deposits are faster - just need L1 confirmations
		return {
			minTime: 10,
			maxTime: 30,
			averageTime: 15,
			unit: 'minutes',
		};
	}

	// Withdrawals have a challenge period
	return {
		minTime: 7,
		maxTime: 7,
		averageTime: 7,
		unit: 'days',
	};
}

/**
 * Calculate required confirmations
 */
export function getRequiredConfirmations(direction: BridgeDirection): number {
	if (direction === 'deposit') {
		return BRIDGE_CONFIG.depositConfirmations;
	}
	// Withdrawals don't need confirmations in the traditional sense
	// They have a challenge period instead
	return 0;
}

/**
 * Format bridge status for display
 */
export function formatBridgeStatus(status: BridgeStatus): string {
	const direction = status.direction === 'deposit' ? 'Hub → Verse' : 'Verse → Hub';
	
	switch (status.status) {
		case 'pending':
			if (status.confirmations !== undefined && status.requiredConfirmations) {
				return `Pending (${status.confirmations}/${status.requiredConfirmations} confirmations) - ${direction}`;
			}
			return `Pending - ${direction}`;
		case 'completed':
			return `Completed - ${direction}`;
		case 'failed':
			return `Failed - ${direction}`;
		case 'challenge':
			return `Challenge Period - ${direction}`;
		default:
			return `Unknown - ${direction}`;
	}
}

/**
 * Check if bridge transaction is finalized
 */
export function isBridgeFinalized(status: BridgeStatus): boolean {
	return status.status === 'completed' || status.status === 'failed';
}

/**
 * Calculate bridge fee
 */
export function calculateBridgeFee(
	amount: bigint,
	direction: BridgeDirection
): {
	fee: bigint;
	feePercentage: number;
	netAmount: bigint;
} {
	// Oasys bridges are generally free, but may have L1 gas costs
	// This is a placeholder for any future fee structure
	const feePercentage = 0;
	const fee = (amount * BigInt(feePercentage * 100)) / 10000n;
	const netAmount = amount - fee;

	return {
		fee,
		feePercentage,
		netAmount,
	};
}

/**
 * Get supported bridge tokens for a verse
 */
export function getSupportedBridgeTokens(verseKey: string): string[] {
	// Currently only OAS is supported natively
	// Other tokens depend on verse configuration
	return ['OAS'];
}

/**
 * Validate verse for bridging
 */
export function validateVerseForBridge(verseKey: string): {
	isValid: boolean;
	error?: string;
	verse?: VerseConfig;
} {
	const verse = VERSES[verseKey];
	
	if (!verse) {
		return {
			isValid: false,
			error: `Verse not found: ${verseKey}`,
		};
	}

	if (!verse.bridgeAddress) {
		return {
			isValid: false,
			error: `Bridge not configured for ${verse.name}`,
		};
	}

	return {
		isValid: true,
		verse,
	};
}

/**
 * Get withdrawal challenge period info
 */
export function getWithdrawalChallengeInfo(): {
	period: number;
	periodUnit: string;
	description: string;
} {
	return {
		period: 7,
		periodUnit: 'days',
		description: 'Withdrawals from Verse to Hub have a 7-day challenge period for security',
	};
}

/**
 * Get bridge time estimate (alias for estimateBridgeTime)
 */
export function getBridgeEstimate(direction: BridgeDirection): {
	minTime: number;
	maxTime: number;
	averageTime: number;
	unit: string;
	confirmations?: number;
	challengePeriod?: string;
} {
	const timeEstimate = estimateBridgeTime(direction);
	const confirmations = getRequiredConfirmations(direction);
	
	return {
		...timeEstimate,
		confirmations: direction === 'deposit' ? confirmations : undefined,
		challengePeriod: direction === 'withdraw' ? '7 days' : undefined,
	};
}
