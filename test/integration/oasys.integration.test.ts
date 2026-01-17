/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for n8n-nodes-oasys
 *
 * These tests verify the node's integration with the Oasys blockchain.
 * They require network access to Oasys testnet.
 *
 * To run these tests:
 * 1. Ensure you have network access to Oasys testnet
 * 2. Set TEST_PRIVATE_KEY environment variable (optional, for write operations)
 * 3. Run: npm run test:integration
 */

import { OASYS_NETWORKS } from '../../nodes/Oasys/constants/networks';
import { VERSES } from '../../nodes/Oasys/constants/verses';
import { VALIDATORS } from '../../nodes/Oasys/constants/validators';

describe('Oasys Node Integration Tests', () => {
	describe('Network Configuration', () => {
		it('should have valid Hub mainnet configuration', () => {
			const hubMainnet = OASYS_NETWORKS.hubMainnet;
			expect(hubMainnet).toBeDefined();
			expect(hubMainnet.chainId).toBe(248);
			expect(hubMainnet.rpcUrl).toContain('oasys.games');
		});

		it('should have valid Hub testnet configuration', () => {
			const hubTestnet = OASYS_NETWORKS.hubTestnet;
			expect(hubTestnet).toBeDefined();
			expect(hubTestnet.chainId).toBe(9372);
			expect(hubTestnet.rpcUrl).toContain('testnet');
		});
	});

	describe('Verse Configuration', () => {
		it('should have HOME Verse configured', () => {
			const homeVerse = VERSES.homeVerse;
			expect(homeVerse).toBeDefined();
			expect(homeVerse.chainId).toBe(19011);
			expect(homeVerse.name).toContain('HOME');
		});

		it('should have MCH Verse configured', () => {
			const mchVerse = VERSES.mchVerse;
			expect(mchVerse).toBeDefined();
			expect(mchVerse.chainId).toBe(29548);
		});

		it('should have all expected verses', () => {
			const expectedVerses = [
				'homeVerse',
				'mchVerse',
				'tcgVerse',
				'saakuruVerse',
				'chainVerse',
				'defiVerse',
				'yooldoVerse',
				'geekVerse',
			];
			expectedVerses.forEach((verse) => {
				expect(VERSES[verse]).toBeDefined();
			});
		});
	});

	describe('Validator Configuration', () => {
		it('should have SEGA validator configured', () => {
			const sega = VALIDATORS.find((v) => v.name.includes('SEGA'));
			expect(sega).toBeDefined();
			expect(sega?.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
		});

		it('should have Bandai Namco validator configured', () => {
			const bandai = VALIDATORS.find((v) => v.name.includes('Bandai'));
			expect(bandai).toBeDefined();
		});

		it('should have Ubisoft validator configured', () => {
			const ubisoft = VALIDATORS.find((v) => v.name.includes('Ubisoft'));
			expect(ubisoft).toBeDefined();
		});
	});

	describe('RPC Connectivity (requires network)', () => {
		// Skip these tests in CI environments without network access
		const SKIP_NETWORK_TESTS = process.env.SKIP_NETWORK_TESTS === 'true';

		it.skipIf(SKIP_NETWORK_TESTS)('should connect to Hub mainnet RPC', async () => {
			const response = await fetch(OASYS_NETWORKS.hubMainnet.rpcUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'eth_chainId',
					params: [],
					id: 1,
				}),
			});
			const data = await response.json();
			expect(parseInt(data.result, 16)).toBe(248);
		});

		it.skipIf(SKIP_NETWORK_TESTS)('should connect to Hub testnet RPC', async () => {
			const response = await fetch(OASYS_NETWORKS.hubTestnet.rpcUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'eth_chainId',
					params: [],
					id: 1,
				}),
			});
			const data = await response.json();
			expect(parseInt(data.result, 16)).toBe(9372);
		});
	});
});

// Helper for conditional test skipping
declare global {
	namespace jest {
		interface It {
			skipIf: (condition: boolean) => It;
		}
	}
}

// Extend Jest's it with skipIf
const originalIt = it;
(it as any).skipIf = (condition: boolean) => (condition ? it.skip : originalIt);
