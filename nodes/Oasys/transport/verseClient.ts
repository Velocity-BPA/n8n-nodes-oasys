/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Verse Client
 * 
 * Client for interacting with Oasys Verses (Layer 2 chains)
 * Handles gaming-optimized L2 operations with gasless transaction support
 */

import {
	JsonRpcProvider,
	Wallet,
	Contract,
	formatUnits,
	parseUnits,
	isAddress,
	getAddress,
	type TransactionReceipt,
	type Block,
	type TransactionResponse,
} from 'ethers';
import { VERSE_CONTRACTS, ERC20_ABI, ERC721_ABI, ERC1155_ABI, GAS_PRICE_ORACLE_ABI } from '../constants/contracts';
import { VERSES, type VerseConfig, getVerseConfig } from '../constants/verses';

export interface VerseClientConfig {
	rpcUrl: string;
	chainId: number;
	privateKey?: string;
	isGasless?: boolean;
	verseName?: string;
}

export interface VerseStatus {
	chainId: number;
	blockNumber: number;
	gasPrice: bigint;
	isGasless: boolean;
	isConnected: boolean;
	verseName: string;
}

export interface NftMetadata {
	name?: string;
	description?: string;
	image?: string;
	attributes?: Array<{
		trait_type: string;
		value: string | number;
	}>;
	[key: string]: unknown;
}

export class VerseClient {
	private provider: JsonRpcProvider;
	private wallet: Wallet | null = null;
	private chainId: number;
	private isGasless: boolean;
	private verseName: string;
	private gasPriceOracle: Contract | null = null;

	constructor(config: VerseClientConfig) {
		this.provider = new JsonRpcProvider(config.rpcUrl);
		this.chainId = config.chainId;
		this.isGasless = config.isGasless ?? true;
		this.verseName = config.verseName ?? 'Unknown Verse';

		if (config.privateKey) {
			this.wallet = new Wallet(config.privateKey, this.provider);
		}

		// Initialize gas price oracle
		this.gasPriceOracle = new Contract(
			VERSE_CONTRACTS.gasPriceOracle,
			GAS_PRICE_ORACLE_ABI,
			this.provider
		);
	}

	/**
	 * Get provider instance
	 */
	getProvider(): JsonRpcProvider {
		return this.provider;
	}

	/**
	 * Get wallet instance
	 */
	getWallet(): Wallet | null {
		return this.wallet;
	}

	/**
	 * Check if client has a signer
	 */
	hasSigner(): boolean {
		return this.wallet !== null;
	}

	/**
	 * Check if verse is gasless
	 */
	getIsGasless(): boolean {
		return this.isGasless;
	}

	/**
	 * Get chain ID
	 */
	getChainId(): number {
		return this.chainId;
	}

	/**
	 * Get verse name
	 */
	getVerseName(): string {
		return this.verseName;
	}

	/**
	 * Get current block number
	 */
	async getBlockNumber(): Promise<number> {
		return await this.provider.getBlockNumber();
	}

	/**
	 * Get block by number or hash
	 */
	async getBlock(blockHashOrNumber: string | number): Promise<Block | null> {
		return await this.provider.getBlock(blockHashOrNumber);
	}

	/**
	 * Get latest block
	 */
	async getLatestBlock(): Promise<Block | null> {
		return await this.provider.getBlock('latest');
	}

	/**
	 * Get OAS balance on Verse
	 */
	async getBalance(address: string): Promise<bigint> {
		return await this.provider.getBalance(address);
	}

	/**
	 * Get gas price (may be 0 for gasless verses)
	 */
	async getGasPrice(): Promise<bigint> {
		if (this.isGasless) {
			return 0n;
		}
		const feeData = await this.provider.getFeeData();
		return feeData.gasPrice ?? 0n;
	}

	/**
	 * Get L1 data fee for a transaction
	 */
	async getL1Fee(data: string): Promise<bigint> {
		if (!this.gasPriceOracle) {
			return 0n;
		}
		try {
			return await this.gasPriceOracle.getL1Fee(data);
		} catch {
			return 0n;
		}
	}

	/**
	 * Get transaction by hash
	 */
	async getTransaction(txHash: string): Promise<TransactionResponse | null> {
		return await this.provider.getTransaction(txHash);
	}

	/**
	 * Get transaction receipt
	 */
	async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
		return await this.provider.getTransactionReceipt(txHash);
	}

	/**
	 * Send OAS transfer on Verse
	 */
	async transfer(
		to: string,
		amount: bigint,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet) {
			throw new Error('Wallet not configured - private key required');
		}

		const txOptions: {
			to: string;
			value: bigint;
			gasLimit?: bigint;
			gasPrice?: bigint;
		} = {
			to,
			value: amount,
		};

		// For gasless verses, gas is paid by the operator
		if (!this.isGasless) {
			txOptions.gasLimit = options?.gasLimit;
			txOptions.gasPrice = options?.gasPrice;
		}

		const tx = await this.wallet.sendTransaction(txOptions);
		return tx;
	}

	/**
	 * Get ERC20 token balance
	 */
	async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<bigint> {
		const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
		return await contract.balanceOf(walletAddress);
	}

	/**
	 * Get ERC20 token info
	 */
	async getTokenInfo(tokenAddress: string): Promise<{
		name: string;
		symbol: string;
		decimals: number;
		totalSupply: bigint;
	}> {
		const contract = new Contract(tokenAddress, ERC20_ABI, this.provider);
		const [name, symbol, decimals, totalSupply] = await Promise.all([
			contract.name(),
			contract.symbol(),
			contract.decimals(),
			contract.totalSupply(),
		]);

		return {
			name,
			symbol,
			decimals: Number(decimals),
			totalSupply,
		};
	}

	/**
	 * Transfer ERC20 token
	 */
	async transferToken(
		tokenAddress: string,
		to: string,
		amount: bigint,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet) {
			throw new Error('Wallet not configured - private key required');
		}

		const contract = new Contract(tokenAddress, ERC20_ABI, this.wallet);

		const txOptions: { gasLimit?: bigint; gasPrice?: bigint } = {};
		if (!this.isGasless) {
			txOptions.gasLimit = options?.gasLimit ?? 65000n;
			txOptions.gasPrice = options?.gasPrice;
		}

		const tx = await contract.transfer(to, amount, txOptions);
		return tx;
	}

	/**
	 * Get ERC721 NFT owner
	 */
	async getNftOwner(contractAddress: string, tokenId: string): Promise<string> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.ownerOf(tokenId);
	}

	/**
	 * Get ERC721 NFT balance
	 */
	async getNftBalance(contractAddress: string, walletAddress: string): Promise<bigint> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.balanceOf(walletAddress);
	}

	/**
	 * Get ERC721 token URI
	 */
	async getTokenUri(contractAddress: string, tokenId: string): Promise<string> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.tokenURI(tokenId);
	}

	/**
	 * Transfer ERC721 NFT
	 */
	async transferNft(
		contractAddress: string,
		from: string,
		to: string,
		tokenId: string,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet) {
			throw new Error('Wallet not configured - private key required');
		}

		const contract = new Contract(contractAddress, ERC721_ABI, this.wallet);

		const txOptions: { gasLimit?: bigint; gasPrice?: bigint } = {};
		if (!this.isGasless) {
			txOptions.gasLimit = options?.gasLimit ?? 100000n;
			txOptions.gasPrice = options?.gasPrice;
		}

		const tx = await contract.transferFrom(from, to, tokenId, txOptions);
		return tx;
	}

	/**
	 * Get ERC1155 balance
	 */
	async getErc1155Balance(
		contractAddress: string,
		walletAddress: string,
		tokenId: string
	): Promise<bigint> {
		const contract = new Contract(contractAddress, ERC1155_ABI, this.provider);
		return await contract.balanceOf(walletAddress, tokenId);
	}

	/**
	 * Get ERC1155 batch balances
	 */
	async getErc1155BatchBalance(
		contractAddress: string,
		walletAddresses: string[],
		tokenIds: string[]
	): Promise<bigint[]> {
		const contract = new Contract(contractAddress, ERC1155_ABI, this.provider);
		return await contract.balanceOfBatch(walletAddresses, tokenIds);
	}

	/**
	 * Transfer ERC1155 token
	 */
	async transferErc1155(
		contractAddress: string,
		from: string,
		to: string,
		tokenId: string,
		amount: bigint,
		data: string = '0x',
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet) {
			throw new Error('Wallet not configured - private key required');
		}

		const contract = new Contract(contractAddress, ERC1155_ABI, this.wallet);

		const txOptions: { gasLimit?: bigint; gasPrice?: bigint } = {};
		if (!this.isGasless) {
			txOptions.gasLimit = options?.gasLimit ?? 100000n;
			txOptions.gasPrice = options?.gasPrice;
		}

		const tx = await contract.safeTransferFrom(from, to, tokenId, amount, data, txOptions);
		return tx;
	}

	/**
	 * Call contract read method
	 */
	async readContract(
		contractAddress: string,
		abi: string[],
		method: string,
		args: unknown[]
	): Promise<unknown> {
		const contract = new Contract(contractAddress, abi, this.provider);
		return await contract[method](...args);
	}

	/**
	 * Call contract write method
	 */
	async writeContract(
		contractAddress: string,
		abi: string[],
		method: string,
		args: unknown[],
		options?: {
			value?: bigint;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet) {
			throw new Error('Wallet not configured - private key required');
		}

		const contract = new Contract(contractAddress, abi, this.wallet);

		const txOptions: { value?: bigint; gasLimit?: bigint; gasPrice?: bigint } = {
			value: options?.value,
		};

		if (!this.isGasless) {
			txOptions.gasLimit = options?.gasLimit;
			txOptions.gasPrice = options?.gasPrice;
		}

		const tx = await contract[method](...args, txOptions);
		return tx;
	}

	/**
	 * Estimate gas for a transaction
	 */
	async estimateGas(transaction: {
		to: string;
		value?: bigint;
		data?: string;
	}): Promise<bigint> {
		if (this.isGasless) {
			return 0n;
		}
		return await this.provider.estimateGas(transaction);
	}

	/**
	 * Get verse status
	 */
	async getStatus(): Promise<VerseStatus> {
		try {
			const [network, blockNumber, gasPrice] = await Promise.all([
				this.provider.getNetwork(),
				this.provider.getBlockNumber(),
				this.getGasPrice(),
			]);

			return {
				chainId: Number(network.chainId),
				blockNumber,
				gasPrice,
				isGasless: this.isGasless,
				isConnected: true,
				verseName: this.verseName,
			};
		} catch {
			return {
				chainId: this.chainId,
				blockNumber: 0,
				gasPrice: 0n,
				isGasless: this.isGasless,
				isConnected: false,
				verseName: this.verseName,
			};
		}
	}

	/**
	 * Validate address
	 */
	validateAddress(address: string): { isValid: boolean; checksumed?: string } {
		try {
			if (!isAddress(address)) {
				return { isValid: false };
			}
			return { isValid: true, checksumed: getAddress(address) };
		} catch {
			return { isValid: false };
		}
	}

	/**
	 * Get contract events
	 */
	async getContractEvents(
		contractAddress: string,
		abi: string[],
		eventName: string,
		fromBlock: number,
		toBlock: number | 'latest'
	): Promise<unknown[]> {
		const contract = new Contract(contractAddress, abi, this.provider);
		const filter = contract.filters[eventName]();
		return await contract.queryFilter(filter, fromBlock, toBlock);
	}
}

/**
 * Create Verse client from credentials
 */
export function createVerseClient(credentials: {
	verse: string;
	privateKey?: string;
	customVerseRpcUrl?: string;
	customVerseChainId?: number;
}): VerseClient {
	let config: VerseClientConfig;

	if (credentials.verse === 'customVerse') {
		config = {
			rpcUrl: credentials.customVerseRpcUrl ?? '',
			chainId: credentials.customVerseChainId ?? 0,
			privateKey: credentials.privateKey,
			isGasless: true, // Assume custom verses are gasless by default
			verseName: 'Custom Verse',
		};
	} else {
		const verseConfig = getVerseConfig(credentials.verse);
		if (!verseConfig) {
			throw new Error(`Verse not found: ${credentials.verse}`);
		}

		config = {
			rpcUrl: verseConfig.rpcUrl,
			chainId: verseConfig.chainId,
			privateKey: credentials.privateKey,
			isGasless: verseConfig.isGasless,
			verseName: verseConfig.name,
		};
	}

	return new VerseClient(config);
}

/**
 * Get all available verses as options
 */
export function getVerseOptions(): Array<{
	name: string;
	value: string;
	chainId: number;
	isGasless: boolean;
}> {
	return Object.entries(VERSES).map(([key, verse]) => ({
		name: verse.name,
		value: key,
		chainId: verse.chainId,
		isGasless: verse.isGasless,
	}));
}
