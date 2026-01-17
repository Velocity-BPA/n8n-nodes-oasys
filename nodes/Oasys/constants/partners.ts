/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Partner Registry
 * 
 * Oasys partners are primarily gaming companies that operate
 * validators and/or run Verses (Layer 2 chains).
 */

export interface PartnerInfo {
	id: string;
	name: string;
	website: string;
	description: string;
	type: 'validator' | 'verseOperator' | 'both';
	verseId?: string;
	games?: GameInfo[];
	isActive: boolean;
}

export interface GameInfo {
	id: string;
	name: string;
	genre: string;
	website?: string;
	verseId?: string;
	contractAddress?: string;
	description?: string;
}

/**
 * Oasys Partner Registry
 */
export const PARTNERS: Record<string, PartnerInfo> = {
	sega: {
		id: 'sega',
		name: 'SEGA',
		website: 'https://www.sega.com',
		description: 'Global gaming company with iconic franchises',
		type: 'validator',
		isActive: true,
		games: [
			{
				id: 'sega-game-1',
				name: 'SEGA Web3 Project',
				genre: 'Various',
				description: 'SEGA blockchain gaming initiative',
			},
		],
	},
	bandaiNamco: {
		id: 'bandai-namco',
		name: 'Bandai Namco',
		website: 'https://www.bandainamco.com',
		description: 'Entertainment conglomerate with gaming division',
		type: 'validator',
		isActive: true,
		games: [],
	},
	ubisoft: {
		id: 'ubisoft',
		name: 'Ubisoft',
		website: 'https://www.ubisoft.com',
		description: 'Major gaming publisher and developer',
		type: 'validator',
		isActive: true,
		games: [],
	},
	doubleJumpTokyo: {
		id: 'doublejump-tokyo',
		name: 'double jump.tokyo',
		website: 'https://www.doublejump.tokyo',
		description: 'Blockchain gaming pioneer, creators of MCH',
		type: 'both',
		verseId: 'mch-verse',
		isActive: true,
		games: [
			{
				id: 'mch',
				name: 'My Crypto Heroes',
				genre: 'RPG',
				website: 'https://www.mycryptoheroes.net',
				verseId: 'mch-verse',
				description: 'Blockchain RPG with historical heroes',
			},
			{
				id: 'mch-plus',
				name: 'MCH+',
				genre: 'Gaming Platform',
				description: 'MCH gaming ecosystem',
			},
		],
	},
	netmarble: {
		id: 'netmarble',
		name: 'Netmarble',
		website: 'https://www.netmarble.com',
		description: 'Leading mobile game company',
		type: 'validator',
		isActive: true,
		games: [],
	},
	com2us: {
		id: 'com2us',
		name: 'Com2uS',
		website: 'https://www.com2us.com',
		description: 'Mobile gaming developer and publisher',
		type: 'validator',
		isActive: true,
		games: [],
	},
	ygg: {
		id: 'ygg',
		name: 'Yield Guild Games',
		website: 'https://yieldguild.io',
		description: 'Decentralized gaming guild',
		type: 'validator',
		isActive: true,
		games: [],
	},
	wemade: {
		id: 'wemade',
		name: 'Wemade',
		website: 'https://www.wemade.com',
		description: 'Korean gaming company, creators of WEMIX',
		type: 'validator',
		isActive: true,
		games: [],
	},
	cryptoGames: {
		id: 'cryptogames',
		name: 'CryptoGames',
		website: 'https://cryptogames.agency',
		description: 'Blockchain gaming studio',
		type: 'both',
		verseId: 'tcg-verse',
		isActive: true,
		games: [
			{
				id: 'tcg-game',
				name: 'TCG Games',
				genre: 'Trading Card Game',
				verseId: 'tcg-verse',
				description: 'Trading card game on Oasys',
			},
		],
	},
	oasysFoundation: {
		id: 'oasys-foundation',
		name: 'Oasys Foundation',
		website: 'https://oasys.games',
		description: 'Oasys protocol foundation',
		type: 'both',
		verseId: 'home-verse',
		isActive: true,
		games: [],
	},
};

/**
 * Game genres for filtering
 */
export const GAME_GENRES = [
	'Action',
	'Adventure',
	'RPG',
	'Strategy',
	'Puzzle',
	'Trading Card Game',
	'Sports',
	'Racing',
	'Simulation',
	'MMO',
	'Casual',
	'Platform',
	'Various',
];

/**
 * Get partner by ID
 */
export function getPartnerById(id: string): PartnerInfo | undefined {
	return Object.values(PARTNERS).find((p) => p.id === id);
}

/**
 * Get partners by type
 */
export function getPartnersByType(type: 'validator' | 'verseOperator' | 'both'): PartnerInfo[] {
	return Object.values(PARTNERS).filter(
		(p) => p.type === type || (type !== 'both' && p.type === 'both')
	);
}

/**
 * Get all games across all partners
 */
export function getAllGames(): GameInfo[] {
	return Object.values(PARTNERS).flatMap((p) => p.games ?? []);
}

/**
 * Get games by verse
 */
export function getGamesByVerse(verseId: string): GameInfo[] {
	return getAllGames().filter((g) => g.verseId === verseId);
}

/**
 * Partner options for n8n UI dropdowns
 */
export const PARTNER_OPTIONS = Object.entries(PARTNERS).map(([key, partner]) => ({
	name: partner.name,
	value: key,
	description: `${partner.type} - ${partner.description.substring(0, 50)}...`,
}));

/**
 * Game options for n8n UI dropdowns
 */
export const GAME_OPTIONS = getAllGames().map((game) => ({
	name: game.name,
	value: game.id,
	description: `${game.genre}${game.verseId ? ` - ${game.verseId}` : ''}`,
}));
