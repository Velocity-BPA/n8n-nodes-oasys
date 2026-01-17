/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Validator Registry and Constants
 * 
 * Oasys Hub uses Proof-of-Stake consensus with validators
 * who are typically gaming companies and enterprises.
 */

export interface ValidatorInfo {
	address: string;
	name: string;
	website?: string;
	description?: string;
	commissionRate: number; // Percentage
	isActive: boolean;
}

/**
 * Known Oasys Validators (Gaming Companies & Enterprises)
 * Note: These are example validators - actual addresses should be verified
 */
export const KNOWN_VALIDATORS: ValidatorInfo[] = [
	{
		address: '0x1234567890123456789012345678901234567890',
		name: 'SEGA',
		website: 'https://www.sega.com',
		description: 'SEGA Corporation - Global gaming company',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x2345678901234567890123456789012345678901',
		name: 'Bandai Namco',
		website: 'https://www.bandainamco.com',
		description: 'Bandai Namco Entertainment - Gaming & entertainment',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x3456789012345678901234567890123456789012',
		name: 'Ubisoft',
		website: 'https://www.ubisoft.com',
		description: 'Ubisoft Entertainment - Gaming publisher',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x4567890123456789012345678901234567890123',
		name: 'double jump.tokyo',
		website: 'https://www.doublejump.tokyo',
		description: 'double jump.tokyo - Blockchain game developer',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x5678901234567890123456789012345678901234',
		name: 'Netmarble',
		website: 'https://www.netmarble.com',
		description: 'Netmarble Corporation - Mobile gaming company',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x6789012345678901234567890123456789012345',
		name: 'Com2uS',
		website: 'https://www.com2us.com',
		description: 'Com2uS - Mobile gaming developer',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x7890123456789012345678901234567890123456',
		name: 'Yield Guild Games',
		website: 'https://yieldguild.io',
		description: 'YGG - Gaming guild and DAO',
		commissionRate: 10,
		isActive: true,
	},
	{
		address: '0x8901234567890123456789012345678901234567',
		name: 'Oasys Foundation',
		website: 'https://oasys.games',
		description: 'Oasys Foundation - Protocol foundation',
		commissionRate: 5,
		isActive: true,
	},
];

/**
 * Validator status enum
 */
export enum ValidatorStatus {
	Active = 0,
	Inactive = 1,
	Jailed = 2,
	Exiting = 3,
}

/**
 * Validator configuration constants
 */
export const VALIDATOR_CONFIG = {
	// Minimum stake required to be a validator (10M OAS)
	minimumStake: '10000000000000000000000000',
	
	// Maximum commission rate (100%)
	maxCommissionRate: 100,
	
	// Commission rate change limits per epoch
	maxCommissionChange: 5,
	
	// Jailing threshold (missed blocks)
	jailThreshold: 500,
	
	// Jail duration in epochs
	jailDuration: 3,
	
	// Slashing percentage for double signing
	doubleSignSlashing: 5,
	
	// Slashing percentage for downtime
	downtimeSlashing: 1,
};

/**
 * Get validator by address
 */
export function getValidatorByAddress(address: string): ValidatorInfo | undefined {
	return KNOWN_VALIDATORS.find(
		(v) => v.address.toLowerCase() === address.toLowerCase()
	);
}

/**
 * Get validator by name
 */
export function getValidatorByName(name: string): ValidatorInfo | undefined {
	return KNOWN_VALIDATORS.find(
		(v) => v.name.toLowerCase() === name.toLowerCase()
	);
}

/**
 * Get all active validators
 */
export function getActiveValidators(): ValidatorInfo[] {
	return KNOWN_VALIDATORS.filter((v) => v.isActive);
}

/**
 * Validator options for n8n UI dropdowns
 */
export const VALIDATOR_OPTIONS = KNOWN_VALIDATORS.map((v) => ({
	name: v.name,
	value: v.address,
	description: `Commission: ${v.commissionRate}% - ${v.isActive ? 'Active' : 'Inactive'}`,
}));
