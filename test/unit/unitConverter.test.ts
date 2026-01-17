/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	weiToOas,
	oasToWei,
	weiToGwei,
	gweiToWei,
	formatOas,
	formatGwei,
} from '../../nodes/Oasys/utils/unitConverter';

describe('Unit Converter', () => {
	describe('weiToOas', () => {
		it('should convert wei to OAS correctly', () => {
			expect(weiToOas('1000000000000000000')).toBe('1');
			expect(weiToOas('500000000000000000')).toBe('0.5');
			expect(weiToOas('1234567890000000000')).toBe('1.23456789');
		});

		it('should handle zero', () => {
			expect(weiToOas('0')).toBe('0');
		});

		it('should handle large numbers', () => {
			expect(weiToOas('1000000000000000000000000')).toBe('1000000');
		});
	});

	describe('oasToWei', () => {
		it('should convert OAS to wei correctly', () => {
			expect(oasToWei('1')).toBe('1000000000000000000');
			expect(oasToWei('0.5')).toBe('500000000000000000');
		});

		it('should handle zero', () => {
			expect(oasToWei('0')).toBe('0');
		});
	});

	describe('weiToGwei', () => {
		it('should convert wei to gwei correctly', () => {
			expect(weiToGwei('1000000000')).toBe('1');
			expect(weiToGwei('5000000000')).toBe('5');
		});
	});

	describe('gweiToWei', () => {
		it('should convert gwei to wei correctly', () => {
			expect(gweiToWei('1')).toBe('1000000000');
			expect(gweiToWei('5')).toBe('5000000000');
		});
	});

	describe('formatOas', () => {
		it('should format OAS with default decimals', () => {
			const result = formatOas('1234567890000000000');
			expect(result).toContain('1.23456789');
		});
	});

	describe('formatGwei', () => {
		it('should format gwei correctly', () => {
			const result = formatGwei('5000000000');
			expect(result).toContain('5');
		});
	});
});
