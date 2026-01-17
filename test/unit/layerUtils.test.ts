/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	isHubNetwork,
	isVerseNetwork,
	getLayerType,
	validateAddress,
	isHubLayer,
	getExplorerUrl,
} from '../../nodes/Oasys/utils/layerUtils';

describe('Layer Utils', () => {
	describe('isHubNetwork', () => {
		it('should return true for Hub mainnet chain ID', () => {
			expect(isHubNetwork(248)).toBe(true);
		});

		it('should return true for Hub testnet chain ID', () => {
			expect(isHubNetwork(9372)).toBe(true);
		});

		it('should return false for Verse chain IDs', () => {
			expect(isHubNetwork(19011)).toBe(false);
			expect(isHubNetwork(29548)).toBe(false);
		});
	});

	describe('isVerseNetwork', () => {
		it('should return true for HOME Verse chain ID', () => {
			expect(isVerseNetwork(19011)).toBe(true);
		});

		it('should return true for MCH Verse chain ID', () => {
			expect(isVerseNetwork(29548)).toBe(true);
		});

		it('should return false for Hub chain IDs', () => {
			expect(isVerseNetwork(248)).toBe(false);
			expect(isVerseNetwork(9372)).toBe(false);
		});
	});

	describe('getLayerType', () => {
		it('should return "hub" for Hub networks', () => {
			expect(getLayerType(248)).toBe('hub');
			expect(getLayerType(9372)).toBe('hub');
		});

		it('should return "verse" for Verse networks', () => {
			expect(getLayerType(19011)).toBe('verse');
			expect(getLayerType(29548)).toBe('verse');
		});

		it('should return "unknown" for unrecognized chain IDs', () => {
			expect(getLayerType(1)).toBe('unknown');
			expect(getLayerType(999999)).toBe('unknown');
		});
	});

	describe('validateAddress', () => {
		it('should validate correct Ethereum addresses', () => {
			expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f1e9a2')).toBe(true);
			expect(validateAddress('0x0000000000000000000000000000000000000000')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(validateAddress('invalid')).toBe(false);
			expect(validateAddress('0x123')).toBe(false);
			expect(validateAddress('')).toBe(false);
		});
	});

	describe('isHubLayer', () => {
		it('should return true for hub layer strings', () => {
			expect(isHubLayer('hubMainnet')).toBe(true);
			expect(isHubLayer('hubTestnet')).toBe(true);
		});

		it('should return false for verse layer strings', () => {
			expect(isHubLayer('homeVerse')).toBe(false);
			expect(isHubLayer('mchVerse')).toBe(false);
		});
	});

	describe('getExplorerUrl', () => {
		it('should return mainnet explorer URL for mainnet chain', () => {
			const url = getExplorerUrl(248, '0x123');
			expect(url).toContain('explorer.oasys.games');
		});

		it('should return testnet explorer URL for testnet chain', () => {
			const url = getExplorerUrl(9372, '0x123');
			expect(url).toContain('testnet');
		});
	});
});
