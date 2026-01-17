/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	calculateStakingAPY,
	calculateRewards,
	STAKING_CONSTANTS,
	getValidatorStatus,
} from '../../nodes/Oasys/utils/validatorUtils';

describe('Validator Utils', () => {
	describe('STAKING_CONSTANTS', () => {
		it('should have correct minimum validator stake', () => {
			expect(STAKING_CONSTANTS.MIN_VALIDATOR_STAKE).toBe('10000000');
		});

		it('should have correct minimum delegation', () => {
			expect(STAKING_CONSTANTS.MIN_DELEGATION).toBe('1');
		});

		it('should have correct epoch duration', () => {
			expect(STAKING_CONSTANTS.EPOCH_BLOCKS).toBe(5760);
		});

		it('should have correct unbonding period', () => {
			expect(STAKING_CONSTANTS.UNBONDING_EPOCHS).toBe(10);
		});

		it('should have correct default commission', () => {
			expect(STAKING_CONSTANTS.DEFAULT_COMMISSION).toBe(10);
		});
	});

	describe('calculateStakingAPY', () => {
		it('should calculate APY correctly', () => {
			// APY should be a positive percentage
			const apy = calculateStakingAPY('1000000', '100000000');
			expect(parseFloat(apy)).toBeGreaterThan(0);
			expect(parseFloat(apy)).toBeLessThan(100);
		});

		it('should handle zero total stake', () => {
			const apy = calculateStakingAPY('1000000', '0');
			expect(apy).toBe('0');
		});
	});

	describe('calculateRewards', () => {
		it('should calculate rewards correctly', () => {
			const rewards = calculateRewards('1000', 10, 10);
			expect(parseFloat(rewards)).toBeGreaterThan(0);
		});

		it('should return zero for zero stake', () => {
			const rewards = calculateRewards('0', 10, 10);
			expect(rewards).toBe('0');
		});

		it('should return zero for zero epochs', () => {
			const rewards = calculateRewards('1000', 10, 0);
			expect(rewards).toBe('0');
		});
	});

	describe('getValidatorStatus', () => {
		it('should return active for validators with sufficient stake', () => {
			const status = getValidatorStatus('15000000', true);
			expect(status).toBe('active');
		});

		it('should return inactive for validators below minimum stake', () => {
			const status = getValidatorStatus('5000000', true);
			expect(status).toBe('inactive');
		});

		it('should return jailed for jailed validators', () => {
			const status = getValidatorStatus('15000000', false);
			expect(status).toBe('jailed');
		});
	});
});
