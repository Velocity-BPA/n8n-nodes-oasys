/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	validateBridgeAmount,
	getBridgeDirection,
	estimateBridgeTime,
	BRIDGE_CONSTANTS,
	getBridgeEstimate,
} from '../../nodes/Oasys/utils/bridgeUtils';

describe('Bridge Utils', () => {
	describe('BRIDGE_CONSTANTS', () => {
		it('should have correct deposit confirmations', () => {
			expect(BRIDGE_CONSTANTS.DEPOSIT_CONFIRMATIONS).toBe(64);
		});

		it('should have correct withdrawal challenge period', () => {
			expect(BRIDGE_CONSTANTS.WITHDRAWAL_CHALLENGE_PERIOD).toBe(7 * 24 * 60 * 60);
		});

		it('should have correct minimum amount', () => {
			expect(BRIDGE_CONSTANTS.MIN_AMOUNT).toBe('0.001');
		});

		it('should have correct maximum amount', () => {
			expect(BRIDGE_CONSTANTS.MAX_AMOUNT).toBe('100000');
		});
	});

	describe('validateBridgeAmount', () => {
		it('should validate amounts within range', () => {
			const result = validateBridgeAmount('100');
			expect(result.isValid).toBe(true);
		});

		it('should reject amounts below minimum', () => {
			const result = validateBridgeAmount('0.0001');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('minimum');
		});

		it('should reject amounts above maximum', () => {
			const result = validateBridgeAmount('200000');
			expect(result.isValid).toBe(false);
			expect(result.error).toContain('maximum');
		});

		it('should reject negative amounts', () => {
			const result = validateBridgeAmount('-10');
			expect(result.isValid).toBe(false);
		});

		it('should reject zero amounts', () => {
			const result = validateBridgeAmount('0');
			expect(result.isValid).toBe(false);
		});
	});

	describe('getBridgeDirection', () => {
		it('should return deposit for hub to verse', () => {
			expect(getBridgeDirection(248, 19011)).toBe('deposit');
		});

		it('should return withdraw for verse to hub', () => {
			expect(getBridgeDirection(19011, 248)).toBe('withdraw');
		});

		it('should return null for same layer transfers', () => {
			expect(getBridgeDirection(248, 248)).toBeNull();
		});

		it('should return null for verse to verse transfers', () => {
			expect(getBridgeDirection(19011, 29548)).toBeNull();
		});
	});

	describe('estimateBridgeTime', () => {
		it('should return ~15 minutes for deposits', () => {
			const time = estimateBridgeTime('deposit');
			expect(time).toBe(15 * 60); // 15 minutes in seconds
		});

		it('should return ~7 days for withdrawals', () => {
			const time = estimateBridgeTime('withdraw');
			expect(time).toBe(7 * 24 * 60 * 60); // 7 days in seconds
		});
	});

	describe('getBridgeEstimate', () => {
		it('should return estimate object for deposit', () => {
			const estimate = getBridgeEstimate('deposit', '100');
			expect(estimate).toHaveProperty('direction', 'deposit');
			expect(estimate).toHaveProperty('amount', '100');
			expect(estimate).toHaveProperty('estimatedTime');
		});

		it('should return estimate object for withdrawal', () => {
			const estimate = getBridgeEstimate('withdraw', '50');
			expect(estimate).toHaveProperty('direction', 'withdraw');
			expect(estimate).toHaveProperty('amount', '50');
		});
	});
});
