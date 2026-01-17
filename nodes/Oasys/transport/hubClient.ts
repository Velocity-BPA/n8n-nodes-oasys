/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Hub Client
 * 
 * Client for interacting with Oasys Hub (Layer 1)
 * Handles all Hub-specific operations including staking, validators, and epochs
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
import { HUB_CONTRACTS, STAKE_MANAGER_ABI, ERC20_ABI, ERC721_ABI } from '../constants/contracts';
import { HUB_MAINNET, HUB_TESTNET, STAKING_CONFIG, EPOCH_CONFIG } from '../constants/networks';

export interface HubClientConfig {
	rpcUrl: string;
	privateKey?: string;
	chainId?: number;
}

export interface ValidatorInfo {
	address: string;
	operator: string;
	stakes: bigint;
	commissionRate: number;
	status: number;
}

export interface EpochInfo {
	epoch: number;
	startBlock: number;
	endBlock: number;
	rewards: bigint;
}

export interface StakingInfo {
	validator: string;
	delegator: string;
	amount: bigint;
	rewards: bigint;
}

export class HubClient {
	private provider: JsonRpcProvider;
	private wallet: Wallet | null = null;
	private chainId: number;
	private stakeManager: Contract | null = null;

	constructor(config: HubClientConfig) {
		this.provider = new JsonRpcProvider(config.rpcUrl);
		this.chainId = config.chainId ?? 248;

		if (config.privateKey) {
			this.wallet = new Wallet(config.privateKey, this.provider);
		}

		// Initialize stake manager contract
		this.stakeManager = new Contract(
			HUB_CONTRACTS.stakeManager,
			STAKE_MANAGER_ABI,
			this.wallet ?? this.provider
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
	 * Get chain ID
	 */
	getChainId(): number {
		return this.chainId;
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
	 * Get OAS balance
	 */
	async getBalance(address: string): Promise<bigint> {
		return await this.provider.getBalance(address);
	}

	/**
	 * Get gas price
	 */
	async getGasPrice(): Promise<bigint> {
		const feeData = await this.provider.getFeeData();
		return feeData.gasPrice ?? 0n;
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
	 * Send OAS transfer
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

		const tx = await this.wallet.sendTransaction({
			to,
			value: amount,
			gasLimit: options?.gasLimit,
			gasPrice: options?.gasPrice,
		});

		return tx;
	}

	/**
	 * Get all validators
	 */
	async getValidators(): Promise<string[]> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		return await this.stakeManager.getValidators();
	}

	/**
	 * Get validator info
	 */
	async getValidatorInfo(validator: string): Promise<ValidatorInfo> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		const info = await this.stakeManager.getValidatorInfo(validator);
		return {
			address: validator,
			operator: info.operator,
			stakes: info.stakes,
			commissionRate: Number(info.commissionRate),
			status: Number(info.status),
		};
	}

	/**
	 * Get total staked amount
	 */
	async getTotalStake(): Promise<bigint> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		return await this.stakeManager.getTotalStake();
	}

	/**
	 * Get current epoch
	 */
	async getCurrentEpoch(): Promise<number> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		const epoch = await this.stakeManager.getCurrentEpoch();
		return Number(epoch);
	}

	/**
	 * Get epoch info
	 */
	async getEpochInfo(epoch: number): Promise<EpochInfo> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		const info = await this.stakeManager.getEpochInfo(epoch);
		return {
			epoch,
			startBlock: Number(info.startBlock),
			endBlock: Number(info.endBlock),
			rewards: info.rewards,
		};
	}

	/**
	 * Get delegation info
	 */
	async getDelegation(delegator: string, validator: string): Promise<bigint> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		return await this.stakeManager.getDelegation(delegator, validator);
	}

	/**
	 * Get pending rewards
	 */
	async getRewards(delegator: string, validator: string): Promise<bigint> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		return await this.stakeManager.getRewards(delegator, validator);
	}

	/**
	 * Stake OAS to a validator
	 */
	async stake(
		validator: string,
		amount: bigint,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet || !this.stakeManager) {
			throw new Error('Wallet not configured - private key required');
		}

		const tx = await this.stakeManager.stake(validator, {
			value: amount,
			gasLimit: options?.gasLimit ?? 150000n,
			gasPrice: options?.gasPrice,
		});

		return tx;
	}

	/**
	 * Unstake OAS from a validator
	 */
	async unstake(
		validator: string,
		amount: bigint,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet || !this.stakeManager) {
			throw new Error('Wallet not configured - private key required');
		}

		const tx = await this.stakeManager.unstake(validator, amount, {
			gasLimit: options?.gasLimit ?? 150000n,
			gasPrice: options?.gasPrice,
		});

		return tx;
	}

	/**
	 * Claim staking rewards
	 */
	async claimRewards(
		validator: string,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.wallet || !this.stakeManager) {
			throw new Error('Wallet not configured - private key required');
		}

		const tx = await this.stakeManager.claimRewards(validator, {
			gasLimit: options?.gasLimit ?? 100000n,
			gasPrice: options?.gasPrice,
		});

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
		const tx = await contract.transfer(to, amount, {
			gasLimit: options?.gasLimit ?? 65000n,
			gasPrice: options?.gasPrice,
		});

		return tx;
	}

	/**
	 * Get NFT owner
	 */
	async getNftOwner(contractAddress: string, tokenId: string): Promise<string> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.ownerOf(tokenId);
	}

	/**
	 * Get NFT balance
	 */
	async getNftBalance(contractAddress: string, walletAddress: string): Promise<bigint> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.balanceOf(walletAddress);
	}

	/**
	 * Transfer NFT
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
		const tx = await contract.transferFrom(from, to, tokenId, {
			gasLimit: options?.gasLimit ?? 100000n,
			gasPrice: options?.gasPrice,
		});

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
		const tx = await contract[method](...args, {
			value: options?.value,
			gasLimit: options?.gasLimit,
			gasPrice: options?.gasPrice,
		});

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
		return await this.provider.estimateGas(transaction);
	}

	/**
	 * Get network status
	 */
	async getNetworkStatus(): Promise<{
		chainId: number;
		blockNumber: number;
		gasPrice: bigint;
		isConnected: boolean;
	}> {
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
				isConnected: true,
			};
		} catch {
			return {
				chainId: this.chainId,
				blockNumber: 0,
				gasPrice: 0n,
				isConnected: false,
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
	 * Get staking info for an address
	 */
	async getStakingInfo(address: string): Promise<{
		totalStaked: bigint;
		validators: string[];
		delegations: { validator: string; amount: bigint; rewards: bigint }[];
		totalRewards: bigint;
	}> {
		if (!this.stakeManager) {
			throw new Error('Stake manager not initialized');
		}

		const validators = await this.getValidators();
		const delegations: { validator: string; amount: bigint; rewards: bigint }[] = [];
		let totalStaked = 0n;
		let totalRewards = 0n;

		for (const validator of validators) {
			try {
				const delegation = await this.getDelegation(address, validator);
				if (delegation > 0n) {
					const rewards = await this.getRewards(address, validator);
					delegations.push({ validator, amount: delegation, rewards });
					totalStaked += delegation;
					totalRewards += rewards;
				}
			} catch {
				// Skip validators where delegation check fails
			}
		}

		return {
			totalStaked,
			validators: delegations.map(d => d.validator),
			delegations,
			totalRewards,
		};
	}

	/**
	 * Get current epoch info (without parameter)
	 */
	async getCurrentEpochInfo(): Promise<{
		currentEpoch: number;
		startBlock: number;
		endBlock: number;
		blocksRemaining: number;
		rewards?: bigint;
	}> {
		const currentEpoch = await this.getCurrentEpoch();
		const currentBlock = await this.getBlockNumber();
		const epochInfo = await this.getEpochInfo(currentEpoch);
		
		return {
			currentEpoch,
			startBlock: epochInfo.startBlock,
			endBlock: epochInfo.endBlock,
			blocksRemaining: Math.max(0, epochInfo.endBlock - currentBlock),
			rewards: epochInfo.rewards,
		};
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
		
		const filter = contract.filters[eventName]?.();
		if (!filter) {
			throw new Error(`Event ${eventName} not found in ABI`);
		}

		const events = await contract.queryFilter(filter, fromBlock, toBlock);
		return events.map(event => ({
			blockNumber: event.blockNumber,
			transactionHash: event.transactionHash,
			args: 'args' in event ? event.args : undefined,
			eventName: 'eventName' in event ? event.eventName : eventName,
		}));
	}

	/**
	 * Get NFT token URI
	 */
	async getTokenUri(contractAddress: string, tokenId: string): Promise<string> {
		const contract = new Contract(contractAddress, ERC721_ABI, this.provider);
		return await contract.tokenURI(tokenId);
	}
}

/**
 * Create Hub client from credentials
 */
export function createHubClient(credentials: {
	layer?: string;
	network?: 'mainnet' | 'testnet' | string;
	privateKey?: string;
	customRpcUrl?: string;
	customChainId?: number;
}): HubClient {
	let rpcUrl: string;
	let chainId: number;

	// Support both 'layer' and 'network' parameters for flexibility
	const layerOrNetwork = credentials.layer ?? credentials.network ?? 'mainnet';

	switch (layerOrNetwork) {
		case 'hub':
		case 'hubMainnet':
		case 'mainnet':
			rpcUrl = HUB_MAINNET.rpcUrl;
			chainId = HUB_MAINNET.chainId;
			break;
		case 'hubTestnet':
		case 'testnet':
			rpcUrl = HUB_TESTNET.rpcUrl;
			chainId = HUB_TESTNET.chainId;
			break;
		case 'custom':
			rpcUrl = credentials.customRpcUrl ?? HUB_MAINNET.rpcUrl;
			chainId = credentials.customChainId ?? HUB_MAINNET.chainId;
			break;
		default:
			rpcUrl = HUB_MAINNET.rpcUrl;
			chainId = HUB_MAINNET.chainId;
	}

	return new HubClient({
		rpcUrl,
		chainId,
		privateKey: credentials.privateKey,
	});
}
