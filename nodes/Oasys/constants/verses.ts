/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Verse (Layer 2) Configuration Constants
 * 
 * Verses are gaming-optimized Layer 2 chains built on Oasys Hub.
 * Features:
 * - Fast finality (2 second blocks)
 * - Gasless transactions for users
 * - Custom configurations per game
 */

export interface VerseConfig {
	id: string;
	name: string;
	chainId: number;
	rpcUrl: string;
	wsUrl: string;
	explorerUrl: string;
	explorerApiUrl: string;
	bridgeAddress: string;
	operator: string;
	isGasless: boolean;
	games?: string[];
	partner?: string;
}

/**
 * HOME Verse - Official Oasys Verse
 */
export const HOME_VERSE: VerseConfig = {
	id: 'home-verse',
	name: 'HOME Verse',
	chainId: 19011,
	rpcUrl: 'https://rpc.mainnet.oasys.homeverse.games',
	wsUrl: 'wss://ws.mainnet.oasys.homeverse.games',
	explorerUrl: 'https://explorer.oasys.homeverse.games',
	explorerApiUrl: 'https://explorer.oasys.homeverse.games/api',
	bridgeAddress: '0x28cF1c5a2E682E1c80C11b7e9aAb3Ef6A31D3C6d',
	operator: 'Oasys',
	isGasless: true,
	games: ['Oasys NFTs'],
	partner: 'Oasys',
};

/**
 * MCH Verse - My Crypto Heroes
 */
export const MCH_VERSE: VerseConfig = {
	id: 'mch-verse',
	name: 'MCH Verse',
	chainId: 29548,
	rpcUrl: 'https://rpc.oasys.mycryptoheroes.net',
	wsUrl: 'wss://ws.oasys.mycryptoheroes.net',
	explorerUrl: 'https://explorer.oasys.mycryptoheroes.net',
	explorerApiUrl: 'https://explorer.oasys.mycryptoheroes.net/api',
	bridgeAddress: '0x9d8B4F5E99fF123456789a1b2C3d4e5F67890abc',
	operator: 'double jump.tokyo',
	isGasless: true,
	games: ['My Crypto Heroes', 'MCH+'],
	partner: 'double jump.tokyo',
};

/**
 * TCG Verse - Trading Card Games
 */
export const TCG_VERSE: VerseConfig = {
	id: 'tcg-verse',
	name: 'TCG Verse',
	chainId: 2400,
	rpcUrl: 'https://rpc.tcgverse.xyz',
	wsUrl: 'wss://ws.tcgverse.xyz',
	explorerUrl: 'https://explorer.tcgverse.xyz',
	explorerApiUrl: 'https://explorer.tcgverse.xyz/api',
	bridgeAddress: '0xTCGBridge123456789abcdef0123456789abcdef',
	operator: 'TCG Verse',
	isGasless: true,
	games: ['Various TCG Games'],
	partner: 'CryptoGames',
};

/**
 * Saakuru Verse
 */
export const SAAKURU_VERSE: VerseConfig = {
	id: 'saakuru-verse',
	name: 'Saakuru Verse',
	chainId: 7225878,
	rpcUrl: 'https://rpc.saakuru.network',
	wsUrl: 'wss://ws.saakuru.network',
	explorerUrl: 'https://explorer.saakuru.network',
	explorerApiUrl: 'https://explorer.saakuru.network/api',
	bridgeAddress: '0xSaakuruBridge123456789abcdef0123456789ab',
	operator: 'Saakuru Labs',
	isGasless: true,
	games: [],
	partner: 'Saakuru Labs',
};

/**
 * Chain Verse
 */
export const CHAIN_VERSE: VerseConfig = {
	id: 'chain-verse',
	name: 'Chain Verse',
	chainId: 5555,
	rpcUrl: 'https://rpc.chainverse.info',
	wsUrl: 'wss://ws.chainverse.info',
	explorerUrl: 'https://explorer.chainverse.info',
	explorerApiUrl: 'https://explorer.chainverse.info/api',
	bridgeAddress: '0xChainVerseBridge123456789abcdef0123456789',
	operator: 'Chain Verse',
	isGasless: true,
	games: [],
	partner: 'Chain Verse',
};

/**
 * DEFI Verse
 */
export const DEFI_VERSE: VerseConfig = {
	id: 'defi-verse',
	name: 'DeFi Verse',
	chainId: 16116,
	rpcUrl: 'https://rpc.defi-verse.org',
	wsUrl: 'wss://ws.defi-verse.org',
	explorerUrl: 'https://scan.defi-verse.org',
	explorerApiUrl: 'https://scan.defi-verse.org/api',
	bridgeAddress: '0xDeFiVerseBridge123456789abcdef0123456789ab',
	operator: 'DeFi Verse',
	isGasless: false, // DeFi typically needs gas
	games: [],
	partner: 'DeFi Verse',
};

/**
 * Yooldo Verse
 */
export const YOOLDO_VERSE: VerseConfig = {
	id: 'yooldo-verse',
	name: 'Yooldo Verse',
	chainId: 50006,
	rpcUrl: 'https://rpc.yooldo-verse.xyz',
	wsUrl: 'wss://ws.yooldo-verse.xyz',
	explorerUrl: 'https://explorer.yooldo-verse.xyz',
	explorerApiUrl: 'https://explorer.yooldo-verse.xyz/api',
	bridgeAddress: '0xYooldoVerseBridge123456789abcdef01234567',
	operator: 'Yooldo',
	isGasless: true,
	games: ['Yooldo Games'],
	partner: 'Yooldo',
};

/**
 * GEEK Verse
 */
export const GEEK_VERSE: VerseConfig = {
	id: 'geek-verse',
	name: 'GEEK Verse',
	chainId: 75512,
	rpcUrl: 'https://rpc.geekverse.io',
	wsUrl: 'wss://ws.geekverse.io',
	explorerUrl: 'https://explorer.geekverse.io',
	explorerApiUrl: 'https://explorer.geekverse.io/api',
	bridgeAddress: '0xGeekVerseBridge123456789abcdef012345678ab',
	operator: 'GEEK',
	isGasless: true,
	games: [],
	partner: 'GEEK',
};

/**
 * All available Verses
 */
export const VERSES: Record<string, VerseConfig> = {
	homeVerse: HOME_VERSE,
	mchVerse: MCH_VERSE,
	tcgVerse: TCG_VERSE,
	saakuruVerse: SAAKURU_VERSE,
	chainVerse: CHAIN_VERSE,
	defiVerse: DEFI_VERSE,
	yooldoVerse: YOOLDO_VERSE,
	geekVerse: GEEK_VERSE,
};

/**
 * Verse options for n8n UI dropdowns
 */
export const VERSE_OPTIONS = Object.entries(VERSES).map(([key, verse]) => ({
	name: verse.name,
	value: key,
	description: `Chain ID: ${verse.chainId} - Operator: ${verse.operator}`,
}));

/**
 * Get Verse configuration by key or chain ID
 */
export function getVerseConfig(keyOrChainId: string | number): VerseConfig | undefined {
	if (typeof keyOrChainId === 'string') {
		return VERSES[keyOrChainId];
	}
	return Object.values(VERSES).find((v) => v.chainId === keyOrChainId);
}

/**
 * Get RPC URL for a Verse
 */
export function getVerseRpcUrl(verseKey: string): string {
	const verse = VERSES[verseKey];
	return verse?.rpcUrl ?? '';
}

/**
 * Get chain ID for a Verse
 */
export function getVerseChainId(verseKey: string): number {
	const verse = VERSES[verseKey];
	return verse?.chainId ?? 0;
}
