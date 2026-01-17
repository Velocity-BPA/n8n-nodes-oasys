/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys API Client
 * 
 * Client for REST API interactions with Oasys explorers and services
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export interface ApiClientConfig {
	explorerUrl: string;
	apiKey?: string;
	timeout?: number;
}

export interface ExplorerTransaction {
	hash: string;
	blockNumber: string;
	timeStamp: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasUsed: string;
	gasPrice: string;
	isError: string;
	txreceipt_status: string;
	input: string;
	contractAddress: string;
	confirmations: string;
}

export interface ExplorerToken {
	contractAddress: string;
	name: string;
	symbol: string;
	decimals: string;
	balance: string;
}

export interface ExplorerNft {
	contractAddress: string;
	tokenId: string;
	name: string;
	symbol: string;
}

export interface ExplorerBlock {
	blockNumber: string;
	timeStamp: string;
	blockMiner: string;
	blockReward: string;
	uncles: string[];
	uncleInclusionReward: string;
}

export interface ExplorerStats {
	ethPrice: string;
	ethPriceUsd: string;
	marketCap: string;
	totalSupply: string;
}

export class ApiClient {
	private client: AxiosInstance;
	private apiKey?: string;

	constructor(config: ApiClientConfig) {
		this.apiKey = config.apiKey;
		this.client = axios.create({
			baseURL: config.explorerUrl,
			timeout: config.timeout ?? 30000,
			headers: {
				'Content-Type': 'application/json',
				...(config.apiKey && { 'X-API-Key': config.apiKey }),
			},
		});
	}

	/**
	 * Make API request
	 */
	private async request<T>(
		module: string,
		action: string,
		params: Record<string, string | number | undefined> = {}
	): Promise<T> {
		const queryParams: Record<string, string> = {
			module,
			action,
		};

		if (this.apiKey) {
			queryParams.apikey = this.apiKey;
		}

		// Add additional params
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				queryParams[key] = String(value);
			}
		}

		const response: AxiosResponse<{
			status: string;
			message: string;
			result: T;
		}> = await this.client.get('', { params: queryParams });

		if (response.data.status === '0' && response.data.message !== 'No transactions found') {
			throw new Error(response.data.message || 'API request failed');
		}

		return response.data.result;
	}

	/**
	 * Get account balance
	 */
	async getBalance(address: string): Promise<string> {
		return await this.request<string>('account', 'balance', { address });
	}

	/**
	 * Get multiple account balances
	 */
	async getBalanceMulti(addresses: string[]): Promise<Array<{ account: string; balance: string }>> {
		return await this.request('account', 'balancemulti', {
			address: addresses.join(','),
		});
	}

	/**
	 * Get transaction list
	 */
	async getTransactionList(
		address: string,
		options?: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		}
	): Promise<ExplorerTransaction[]> {
		return await this.request<ExplorerTransaction[]>('account', 'txlist', {
			address,
			startblock: options?.startBlock,
			endblock: options?.endBlock,
			page: options?.page,
			offset: options?.offset,
			sort: options?.sort,
		});
	}

	/**
	 * Get internal transaction list
	 */
	async getInternalTransactionList(
		address: string,
		options?: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		}
	): Promise<ExplorerTransaction[]> {
		return await this.request<ExplorerTransaction[]>('account', 'txlistinternal', {
			address,
			startblock: options?.startBlock,
			endblock: options?.endBlock,
			page: options?.page,
			offset: options?.offset,
			sort: options?.sort,
		});
	}

	/**
	 * Get ERC20 token transfers
	 */
	async getTokenTransfers(
		address: string,
		options?: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		}
	): Promise<ExplorerTransaction[]> {
		return await this.request<ExplorerTransaction[]>('account', 'tokentx', {
			address,
			contractaddress: options?.contractAddress,
			startblock: options?.startBlock,
			endblock: options?.endBlock,
			page: options?.page,
			offset: options?.offset,
			sort: options?.sort,
		});
	}

	/**
	 * Get ERC721 (NFT) token transfers
	 */
	async getNftTransfers(
		address: string,
		options?: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		}
	): Promise<ExplorerTransaction[]> {
		return await this.request<ExplorerTransaction[]>('account', 'tokennfttx', {
			address,
			contractaddress: options?.contractAddress,
			startblock: options?.startBlock,
			endblock: options?.endBlock,
			page: options?.page,
			offset: options?.offset,
			sort: options?.sort,
		});
	}

	/**
	 * Get ERC1155 token transfers
	 */
	async getErc1155Transfers(
		address: string,
		options?: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		}
	): Promise<ExplorerTransaction[]> {
		return await this.request<ExplorerTransaction[]>('account', 'token1155tx', {
			address,
			contractaddress: options?.contractAddress,
			startblock: options?.startBlock,
			endblock: options?.endBlock,
			page: options?.page,
			offset: options?.offset,
			sort: options?.sort,
		});
	}

	/**
	 * Get blocks validated by address
	 */
	async getMinedBlocks(
		address: string,
		options?: {
			blockType?: 'blocks' | 'uncles';
			page?: number;
			offset?: number;
		}
	): Promise<ExplorerBlock[]> {
		return await this.request<ExplorerBlock[]>('account', 'getminedblocks', {
			address,
			blocktype: options?.blockType ?? 'blocks',
			page: options?.page,
			offset: options?.offset,
		});
	}

	/**
	 * Get contract ABI
	 */
	async getContractAbi(address: string): Promise<string> {
		return await this.request<string>('contract', 'getabi', { address });
	}

	/**
	 * Get contract source code
	 */
	async getContractSourceCode(
		address: string
	): Promise<
		Array<{
			SourceCode: string;
			ABI: string;
			ContractName: string;
			CompilerVersion: string;
			OptimizationUsed: string;
			Runs: string;
			ConstructorArguments: string;
			EVMVersion: string;
			Library: string;
			LicenseType: string;
			Proxy: string;
			Implementation: string;
			SwarmSource: string;
		}>
	> {
		return await this.request('contract', 'getsourcecode', { address });
	}

	/**
	 * Get transaction status
	 */
	async getTransactionStatus(txHash: string): Promise<{
		isError: string;
		errDescription: string;
	}> {
		return await this.request('transaction', 'getstatus', { txhash: txHash });
	}

	/**
	 * Get transaction receipt status
	 */
	async getTransactionReceiptStatus(txHash: string): Promise<{
		status: string;
	}> {
		return await this.request('transaction', 'gettxreceiptstatus', { txhash: txHash });
	}

	/**
	 * Get block by number
	 */
	async getBlockByNumber(
		blockNumber: number
	): Promise<{
		blockNumber: string;
		timeStamp: string;
		blockMiner: string;
		blockReward: string;
	}> {
		return await this.request('block', 'getblockreward', {
			blockno: blockNumber,
		});
	}

	/**
	 * Get block countdown
	 */
	async getBlockCountdown(blockNumber: number): Promise<{
		CurrentBlock: string;
		CountdownBlock: string;
		RemainingBlock: string;
		EstimateTimeInSec: string;
	}> {
		return await this.request('block', 'getblockcountdown', {
			blockno: blockNumber,
		});
	}

	/**
	 * Get token supply
	 */
	async getTokenSupply(contractAddress: string): Promise<string> {
		return await this.request<string>('stats', 'tokensupply', {
			contractaddress: contractAddress,
		});
	}

	/**
	 * Get OAS total supply
	 */
	async getOasTotalSupply(): Promise<string> {
		return await this.request<string>('stats', 'ethsupply', {});
	}

	/**
	 * Get OAS price
	 */
	async getOasPrice(): Promise<{
		ethbtc: string;
		ethbtc_timestamp: string;
		ethusd: string;
		ethusd_timestamp: string;
	}> {
		return await this.request('stats', 'ethprice', {});
	}

	/**
	 * Get gas oracle
	 */
	async getGasOracle(): Promise<{
		LastBlock: string;
		SafeGasPrice: string;
		ProposeGasPrice: string;
		FastGasPrice: string;
		suggestBaseFee: string;
		gasUsedRatio: string;
	}> {
		return await this.request('gastracker', 'gasoracle', {});
	}

	/**
	 * Get event logs
	 */
	async getEventLogs(
		address: string,
		fromBlock: number,
		toBlock: number | 'latest',
		options?: {
			topic0?: string;
			topic1?: string;
			topic2?: string;
			topic3?: string;
			topic0_1_opr?: 'and' | 'or';
			topic0_2_opr?: 'and' | 'or';
			topic0_3_opr?: 'and' | 'or';
			topic1_2_opr?: 'and' | 'or';
			topic1_3_opr?: 'and' | 'or';
			topic2_3_opr?: 'and' | 'or';
			page?: number;
			offset?: number;
		}
	): Promise<
		Array<{
			address: string;
			topics: string[];
			data: string;
			blockNumber: string;
			timeStamp: string;
			gasPrice: string;
			gasUsed: string;
			logIndex: string;
			transactionHash: string;
			transactionIndex: string;
		}>
	> {
		return await this.request('logs', 'getLogs', {
			address,
			fromBlock,
			toBlock: toBlock === 'latest' ? 'latest' : toBlock,
			...options,
		});
	}
}

/**
 * Create API client for Hub
 */
export function createHubApiClient(
	explorerApiUrl: string,
	apiKey?: string
): ApiClient {
	return new ApiClient({
		explorerUrl: explorerApiUrl,
		apiKey,
	});
}

/**
 * Create API client for Verse
 */
export function createVerseApiClient(
	explorerApiUrl: string,
	apiKey?: string
): ApiClient {
	return new ApiClient({
		explorerUrl: explorerApiUrl,
		apiKey,
	});
}

/**
 * Gaming API Client for game-specific operations
 */
export class GamingApiClient {
	private client: AxiosInstance;

	constructor(config: { apiUrl: string; apiKey?: string }) {
		this.client = axios.create({
			baseURL: config.apiUrl,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
				...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
			},
		});
	}

	/**
	 * Get game info
	 */
	async getGameInfo(gameId: string): Promise<{
		id: string;
		name: string;
		description: string;
		verseId: string;
		website: string;
		status: string;
	}> {
		const response = await this.client.get(`/games/${gameId}`);
		return response.data;
	}

	/**
	 * Get player stats
	 */
	async getPlayerStats(
		gameId: string,
		playerAddress: string
	): Promise<{
		address: string;
		gameId: string;
		level: number;
		score: number;
		achievements: string[];
		lastPlayed: string;
	}> {
		const response = await this.client.get(`/games/${gameId}/players/${playerAddress}`);
		return response.data;
	}

	/**
	 * Get leaderboard
	 */
	async getLeaderboard(
		gameId: string,
		options?: {
			period?: 'daily' | 'weekly' | 'monthly' | 'allTime';
			limit?: number;
			offset?: number;
		}
	): Promise<
		Array<{
			rank: number;
			address: string;
			score: number;
			name?: string;
		}>
	> {
		const response = await this.client.get(`/games/${gameId}/leaderboard`, {
			params: options,
		});
		return response.data;
	}

	/**
	 * Get match history
	 */
	async getMatchHistory(
		gameId: string,
		playerAddress: string,
		options?: {
			limit?: number;
			offset?: number;
		}
	): Promise<
		Array<{
			matchId: string;
			timestamp: string;
			result: string;
			score: number;
			opponent?: string;
		}>
	> {
		const response = await this.client.get(
			`/games/${gameId}/players/${playerAddress}/matches`,
			{ params: options }
		);
		return response.data;
	}

	/**
	 * Get tournaments
	 */
	async getTournaments(
		gameId: string,
		options?: {
			status?: 'upcoming' | 'active' | 'completed';
			limit?: number;
		}
	): Promise<
		Array<{
			tournamentId: string;
			name: string;
			startTime: string;
			endTime: string;
			prizePool: string;
			participants: number;
			status: string;
		}>
	> {
		const response = await this.client.get(`/games/${gameId}/tournaments`, {
			params: options,
		});
		return response.data;
	}
}

/**
 * Create Gaming API client
 */
export function createGamingApiClient(
	apiUrl: string,
	apiKey?: string
): GamingApiClient {
	return new GamingApiClient({ apiUrl, apiKey });
}

// Alias for backward compatibility
export { ApiClient as ExplorerApiClient };
