/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Validator Utilities for Oasys
 * 
 * Helpers for working with Oasys Hub validators and staking
 */

import { STAKING_CONFIG, EPOCH_CONFIG } from '../constants/networks';
import { VALIDATOR_CONFIG, ValidatorStatus, KNOWN_VALIDATORS } from '../constants/validators';

export interface ValidatorMetrics {
	uptime: number;
	blocksProduced: number;
	blocksExpected: number;
	missedBlocks: number;
	slashCount: number;
	delegatorCount: number;
	totalDelegated: string;
	selfStake: string;
	commissionRate: number;
	apy: number;
}

export interface DelegationInfo {
	delegator: string;
	validator: string;
	amount: string;
	rewards: string;
	since: number;
	epoch: number;
}

export interface EpochReward {
	epoch: number;
	totalRewards: string;
	validatorRewards: string;
	delegatorRewards: string;
	timestamp: number;
}

/**
 * Calculate expected APY for staking
 */
export function calculateStakingApy(
	totalStaked: bigint,
	annualRewards: bigint
): number {
	if (totalStaked === 0n) return 0;
	
	const apy = (Number(annualRewards) / Number(totalStaked)) * 100;
	return Math.round(apy * 100) / 100;
}

/**
 * Calculate delegator rewards
 */
export function calculateDelegatorRewards(
	delegatedAmount: bigint,
	totalValidatorStake: bigint,
	validatorRewards: bigint,
	commissionRate: number
): bigint {
	if (totalValidatorStake === 0n) return 0n;
	
	// Calculate share of rewards
	const sharePercentage = (delegatedAmount * 10000n) / totalValidatorStake;
	const grossRewards = (validatorRewards * sharePercentage) / 10000n;
	
	// Deduct commission
	const commission = (grossRewards * BigInt(commissionRate * 100)) / 10000n;
	return grossRewards - commission;
}

/**
 * Calculate validator uptime percentage
 */
export function calculateValidatorUptime(
	blocksProduced: number,
	blocksExpected: number
): number {
	if (blocksExpected === 0) return 100;
	return Math.round((blocksProduced / blocksExpected) * 10000) / 100;
}

/**
 * Check if amount meets minimum delegation
 */
export function meetsMinimumDelegation(amount: bigint): boolean {
	return amount >= BigInt(STAKING_CONFIG.minimumDelegation);
}

/**
 * Check if amount meets minimum stake for validators
 */
export function meetsMinimumValidatorStake(amount: bigint): boolean {
	return amount >= BigInt(STAKING_CONFIG.minimumStake);
}

/**
 * Get unbonding completion epoch
 */
export function getUnbondingCompletionEpoch(currentEpoch: number): number {
	return currentEpoch + STAKING_CONFIG.unbondingPeriod;
}

/**
 * Format validator status
 */
export function formatValidatorStatus(status: ValidatorStatus): string {
	switch (status) {
		case ValidatorStatus.Active:
			return 'Active';
		case ValidatorStatus.Inactive:
			return 'Inactive';
		case ValidatorStatus.Jailed:
			return 'Jailed';
		case ValidatorStatus.Exiting:
			return 'Exiting';
		default:
			return 'Unknown';
	}
}

/**
 * Check if validator is jailed
 */
export function isValidatorJailed(status: ValidatorStatus): boolean {
	return status === ValidatorStatus.Jailed;
}

/**
 * Check if validator is active and accepting delegations
 */
export function canDelegateToValidator(status: ValidatorStatus): boolean {
	return status === ValidatorStatus.Active;
}

/**
 * Calculate epochs until unbonding complete
 */
export function epochsUntilUnbonding(
	unbondingEpoch: number,
	currentEpoch: number
): number {
	const remaining = unbondingEpoch - currentEpoch;
	return remaining > 0 ? remaining : 0;
}

/**
 * Estimate time until unbonding complete
 */
export function estimateUnbondingTime(
	unbondingEpoch: number,
	currentEpoch: number
): {
	epochs: number;
	hours: number;
	days: number;
} {
	const epochs = epochsUntilUnbonding(unbondingEpoch, currentEpoch);
	const hours = epochs * (EPOCH_CONFIG.epochDuration / 3600);
	const days = hours / 24;
	
	return {
		epochs,
		hours: Math.round(hours),
		days: Math.round(days * 10) / 10,
	};
}

/**
 * Get validator recommendations based on criteria
 */
export function getValidatorRecommendations(
	criteria: {
		preferLowCommission?: boolean;
		preferHighUptime?: boolean;
		preferKnownValidator?: boolean;
	},
	validators: Array<{
		address: string;
		commissionRate: number;
		uptime: number;
	}>
): string[] {
	let sorted = [...validators];
	
	if (criteria.preferLowCommission) {
		sorted.sort((a, b) => a.commissionRate - b.commissionRate);
	}
	
	if (criteria.preferHighUptime) {
		sorted.sort((a, b) => b.uptime - a.uptime);
	}
	
	if (criteria.preferKnownValidator) {
		const knownAddresses = KNOWN_VALIDATORS.map((v) => v.address.toLowerCase());
		sorted = sorted.filter((v) =>
			knownAddresses.includes(v.address.toLowerCase())
		);
	}
	
	return sorted.slice(0, 5).map((v) => v.address);
}

/**
 * Calculate compound rewards over epochs
 */
export function calculateCompoundRewards(
	principal: bigint,
	apy: number,
	epochs: number
): bigint {
	// APY to epoch rate
	const epochsPerYear = 365;
	const epochRate = apy / 100 / epochsPerYear;
	
	// Compound formula
	const multiplier = Math.pow(1 + epochRate, epochs);
	const finalAmount = Number(principal) * multiplier;
	
	return BigInt(Math.floor(finalAmount));
}

/**
 * Get current epoch from block number
 */
export function getEpochFromBlock(blockNumber: number): number {
	return Math.floor(blockNumber / EPOCH_CONFIG.blocksPerEpoch);
}

/**
 * Get block range for an epoch
 */
export function getEpochBlockRange(epoch: number): {
	startBlock: number;
	endBlock: number;
} {
	const startBlock = epoch * EPOCH_CONFIG.blocksPerEpoch;
	const endBlock = startBlock + EPOCH_CONFIG.blocksPerEpoch - 1;
	
	return { startBlock, endBlock };
}

/**
 * Validate commission rate
 */
export function validateCommissionRate(rate: number): {
	isValid: boolean;
	error?: string;
} {
	if (rate < 0) {
		return {
			isValid: false,
			error: 'Commission rate cannot be negative',
		};
	}
	
	if (rate > VALIDATOR_CONFIG.maxCommissionRate) {
		return {
			isValid: false,
			error: `Commission rate cannot exceed ${VALIDATOR_CONFIG.maxCommissionRate}%`,
		};
	}
	
	return { isValid: true };
}
