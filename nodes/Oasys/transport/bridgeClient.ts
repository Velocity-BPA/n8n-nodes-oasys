/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Bridge Client
 * 
 * Client for handling Hub <-> Verse bridging operations
 * Supports deposits (Hub to Verse) and withdrawals (Verse to Hub)
 */

import {
	JsonRpcProvider,
	Wallet,
	Contract,
	type TransactionResponse,
	type TransactionReceipt,
} from 'ethers';
import { HUB_CONTRACTS, VERSE_CONTRACTS, L1_BRIDGE_ABI, L2_BRIDGE_ABI } from '../constants/contracts';
import { VERSES, type VerseConfig } from '../constants/verses';
import { HUB_MAINNET, BRIDGE_CONFIG } from '../constants/networks';
import { HubClient } from './hubClient';
import { VerseClient } from './verseClient';

export interface BridgeClientConfig {
	hubRpcUrl: string;
	verseRpcUrl: string;
	verseKey: string;
	privateKey?: string;
}

export interface DepositResult {
	txHash: string;
	from: string;
	to: string;
	amount: bigint;
	timestamp: number;
	status: 'pending' | 'completed' | 'failed';
}

export interface WithdrawalResult {
	txHash: string;
	from: string;
	to: string;
	amount: bigint;
	timestamp: number;
	challengeEndTime: number;
	status: 'pending' | 'challenge' | 'ready' | 'completed' | 'failed';
}

export interface BridgeHistory {
	deposits: DepositResult[];
	withdrawals: WithdrawalResult[];
}

export class BridgeClient {
	private hubProvider: JsonRpcProvider;
	private verseProvider: JsonRpcProvider;
	private hubWallet: Wallet | null = null;
	private verseWallet: Wallet | null = null;
	private verseConfig: VerseConfig | null = null;
	private l1Bridge: Contract | null = null;
	private l2Bridge: Contract | null = null;

	constructor(config: BridgeClientConfig) {
		this.hubProvider = new JsonRpcProvider(config.hubRpcUrl);
		this.verseProvider = new JsonRpcProvider(config.verseRpcUrl);

		this.verseConfig = VERSES[config.verseKey] ?? null;

		if (config.privateKey) {
			this.hubWallet = new Wallet(config.privateKey, this.hubProvider);
			this.verseWallet = new Wallet(config.privateKey, this.verseProvider);
		}

		// Initialize bridge contracts
		const l1BridgeAddress = this.verseConfig?.bridgeAddress ?? HUB_CONTRACTS.l1StandardBridge;

		this.l1Bridge = new Contract(
			l1BridgeAddress,
			L1_BRIDGE_ABI,
			this.hubWallet ?? this.hubProvider
		);

		this.l2Bridge = new Contract(
			VERSE_CONTRACTS.l2StandardBridge,
			L2_BRIDGE_ABI,
			this.verseWallet ?? this.verseProvider
		);
	}

	/**
	 * Check if client has a signer
	 */
	hasSigner(): boolean {
		return this.hubWallet !== null && this.verseWallet !== null;
	}

	/**
	 * Get verse configuration
	 */
	getVerseConfig(): VerseConfig | null {
		return this.verseConfig;
	}

	/**
	 * Deposit OAS from Hub to Verse
	 */
	async depositOas(
		amount: bigint,
		toAddress?: string,
		options?: {
			minGasLimit?: number;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.hubWallet || !this.l1Bridge) {
			throw new Error('Wallet not configured - private key required');
		}

		// Validate amount
		if (amount < BigInt(BRIDGE_CONFIG.minDeposit)) {
			throw new Error(`Amount below minimum deposit: ${BRIDGE_CONFIG.minDeposit}`);
		}

		if (amount > BigInt(BRIDGE_CONFIG.maxDeposit)) {
			throw new Error(`Amount exceeds maximum deposit: ${BRIDGE_CONFIG.maxDeposit}`);
		}

		const minGasLimit = options?.minGasLimit ?? 200000;
		const extraData = '0x';

		let tx: TransactionResponse;

		if (toAddress && toAddress !== this.hubWallet.address) {
			// Deposit to a different address
			tx = await this.l1Bridge.depositETHTo(toAddress, minGasLimit, extraData, {
				value: amount,
				gasLimit: options?.gasLimit ?? 250000n,
				gasPrice: options?.gasPrice,
			});
		} else {
			// Deposit to self
			tx = await this.l1Bridge.depositETH(minGasLimit, extraData, {
				value: amount,
				gasLimit: options?.gasLimit ?? 250000n,
				gasPrice: options?.gasPrice,
			});
		}

		return tx;
	}

	/**
	 * Deposit ERC20 token from Hub to Verse
	 */
	async depositErc20(
		l1TokenAddress: string,
		l2TokenAddress: string,
		amount: bigint,
		toAddress?: string,
		options?: {
			minGasLimit?: number;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.hubWallet || !this.l1Bridge) {
			throw new Error('Wallet not configured - private key required');
		}

		const minGasLimit = options?.minGasLimit ?? 200000;
		const extraData = '0x';

		let tx: TransactionResponse;

		if (toAddress && toAddress !== this.hubWallet.address) {
			tx = await this.l1Bridge.depositERC20To(
				l1TokenAddress,
				l2TokenAddress,
				toAddress,
				amount,
				minGasLimit,
				extraData,
				{
					gasLimit: options?.gasLimit ?? 300000n,
					gasPrice: options?.gasPrice,
				}
			);
		} else {
			tx = await this.l1Bridge.depositERC20(
				l1TokenAddress,
				l2TokenAddress,
				amount,
				minGasLimit,
				extraData,
				{
					gasLimit: options?.gasLimit ?? 300000n,
					gasPrice: options?.gasPrice,
				}
			);
		}

		return tx;
	}

	/**
	 * Withdraw OAS from Verse to Hub
	 */
	async withdrawOas(
		amount: bigint,
		toAddress?: string,
		options?: {
			minGasLimit?: number;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.verseWallet || !this.l2Bridge) {
			throw new Error('Wallet not configured - private key required');
		}

		const minGasLimit = options?.minGasLimit ?? 200000;
		const extraData = '0x';

		// L2 standard bridge uses address(0) for ETH/OAS
		const l2TokenAddress = '0x0000000000000000000000000000000000000000';

		let tx: TransactionResponse;

		if (toAddress && toAddress !== this.verseWallet.address) {
			tx = await this.l2Bridge.withdrawTo(
				l2TokenAddress,
				toAddress,
				amount,
				minGasLimit,
				extraData,
				{
					value: amount,
					gasLimit: options?.gasLimit,
					gasPrice: options?.gasPrice,
				}
			);
		} else {
			tx = await this.l2Bridge.withdraw(l2TokenAddress, amount, minGasLimit, extraData, {
				value: amount,
				gasLimit: options?.gasLimit,
				gasPrice: options?.gasPrice,
			});
		}

		return tx;
	}

	/**
	 * Withdraw ERC20 token from Verse to Hub
	 */
	async withdrawErc20(
		l2TokenAddress: string,
		amount: bigint,
		toAddress?: string,
		options?: {
			minGasLimit?: number;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<TransactionResponse> {
		if (!this.verseWallet || !this.l2Bridge) {
			throw new Error('Wallet not configured - private key required');
		}

		const minGasLimit = options?.minGasLimit ?? 200000;
		const extraData = '0x';

		let tx: TransactionResponse;

		if (toAddress && toAddress !== this.verseWallet.address) {
			tx = await this.l2Bridge.withdrawTo(
				l2TokenAddress,
				toAddress,
				amount,
				minGasLimit,
				extraData,
				{
					gasLimit: options?.gasLimit,
					gasPrice: options?.gasPrice,
				}
			);
		} else {
			tx = await this.l2Bridge.withdraw(l2TokenAddress, amount, minGasLimit, extraData, {
				gasLimit: options?.gasLimit,
				gasPrice: options?.gasPrice,
			});
		}

		return tx;
	}

	/**
	 * Get deposit events from Hub
	 */
	async getDepositEvents(
		fromBlock: number,
		toBlock: number | 'latest',
		address?: string
	): Promise<unknown[]> {
		if (!this.l1Bridge) {
			throw new Error('L1 Bridge not initialized');
		}

		const filter = this.l1Bridge.filters.ETHDepositInitiated(address);
		return await this.l1Bridge.queryFilter(filter, fromBlock, toBlock);
	}

	/**
	 * Get withdrawal events from Verse
	 */
	async getWithdrawalEvents(
		fromBlock: number,
		toBlock: number | 'latest',
		address?: string
	): Promise<unknown[]> {
		if (!this.l2Bridge) {
			throw new Error('L2 Bridge not initialized');
		}

		const filter = this.l2Bridge.filters.WithdrawalInitiated(undefined, undefined, address);
		return await this.l2Bridge.queryFilter(filter, fromBlock, toBlock);
	}

	/**
	 * Get bridge status for a transaction
	 */
	async getBridgeStatus(
		txHash: string,
		direction: 'deposit' | 'withdraw'
	): Promise<{
		status: 'pending' | 'completed' | 'failed' | 'challenge';
		confirmations: number;
		requiredConfirmations: number;
	}> {
		const provider = direction === 'deposit' ? this.hubProvider : this.verseProvider;
		const receipt = await provider.getTransactionReceipt(txHash);

		if (!receipt) {
			return {
				status: 'pending',
				confirmations: 0,
				requiredConfirmations: BRIDGE_CONFIG.depositConfirmations,
			};
		}

		const currentBlock = await provider.getBlockNumber();
		const confirmations = currentBlock - receipt.blockNumber;

		if (receipt.status === 0) {
			return {
				status: 'failed',
				confirmations,
				requiredConfirmations: BRIDGE_CONFIG.depositConfirmations,
			};
		}

		if (direction === 'deposit') {
			if (confirmations >= BRIDGE_CONFIG.depositConfirmations) {
				return {
					status: 'completed',
					confirmations,
					requiredConfirmations: BRIDGE_CONFIG.depositConfirmations,
				};
			}
		} else {
			// Withdrawals have a challenge period
			return {
				status: 'challenge',
				confirmations,
				requiredConfirmations: 0,
			};
		}

		return {
			status: 'pending',
			confirmations,
			requiredConfirmations: BRIDGE_CONFIG.depositConfirmations,
		};
	}

	/**
	 * Get Hub balance
	 */
	async getHubBalance(address: string): Promise<bigint> {
		return await this.hubProvider.getBalance(address);
	}

	/**
	 * Get Verse balance
	 */
	async getVerseBalance(address: string): Promise<bigint> {
		return await this.verseProvider.getBalance(address);
	}

	/**
	 * Get cross-layer balances
	 */
	async getCrossLayerBalances(address: string): Promise<{
		hub: bigint;
		verse: bigint;
		total: bigint;
	}> {
		const [hub, verse] = await Promise.all([
			this.getHubBalance(address),
			this.getVerseBalance(address),
		]);

		return {
			hub,
			verse,
			total: hub + verse,
		};
	}

	/**
	 * Estimate deposit gas
	 */
	async estimateDepositGas(amount: bigint): Promise<bigint> {
		if (!this.hubWallet || !this.l1Bridge) {
			throw new Error('Wallet not configured');
		}

		try {
			const gas = await this.l1Bridge.depositETH.estimateGas(200000, '0x', {
				value: amount,
			});
			return gas;
		} catch {
			return 250000n; // Default estimate
		}
	}

	/**
	 * Estimate withdrawal gas
	 */
	async estimateWithdrawalGas(amount: bigint): Promise<bigint> {
		if (!this.verseWallet || !this.l2Bridge) {
			throw new Error('Wallet not configured');
		}

		// For gasless verses, return 0
		if (this.verseConfig?.isGasless) {
			return 0n;
		}

		try {
			const l2TokenAddress = '0x0000000000000000000000000000000000000000';
			const gas = await this.l2Bridge.withdraw.estimateGas(
				l2TokenAddress,
				amount,
				200000,
				'0x',
				{ value: amount }
			);
			return gas;
		} catch {
			return 350000n; // Default estimate
		}
	}

	/**
	 * Get bridge limits
	 */
	getBridgeLimits(): {
		minDeposit: bigint;
		maxDeposit: bigint;
		minWithdraw: bigint;
		maxWithdraw: bigint;
	} {
		return {
			minDeposit: BigInt(BRIDGE_CONFIG.minDeposit),
			maxDeposit: BigInt(BRIDGE_CONFIG.maxDeposit),
			minWithdraw: BigInt(BRIDGE_CONFIG.minDeposit),
			maxWithdraw: BigInt(BRIDGE_CONFIG.maxDeposit),
		};
	}

	/**
	 * Get withdrawal challenge period info
	 */
	getChallengePeriod(): {
		seconds: number;
		days: number;
		description: string;
	} {
		return {
			seconds: BRIDGE_CONFIG.withdrawalDelay,
			days: 7,
			description:
				'Withdrawals from Verse to Hub have a 7-day challenge period for security',
		};
	}
}

/**
 * Create Bridge client from credentials
 */
export function createBridgeClient(
	hubCredentials: {
		layer: string;
		privateKey?: string;
		customRpcUrl?: string;
	},
	verseKey: string
): BridgeClient {
	const verseConfig = VERSES[verseKey];
	if (!verseConfig) {
		throw new Error(`Verse not found: ${verseKey}`);
	}

	let hubRpcUrl: string;
	switch (hubCredentials.layer) {
		case 'hub':
			hubRpcUrl = HUB_MAINNET.rpcUrl;
			break;
		case 'custom':
			hubRpcUrl = hubCredentials.customRpcUrl ?? HUB_MAINNET.rpcUrl;
			break;
		default:
			hubRpcUrl = HUB_MAINNET.rpcUrl;
	}

	return new BridgeClient({
		hubRpcUrl,
		verseRpcUrl: verseConfig.rpcUrl,
		verseKey,
		privateKey: hubCredentials.privateKey,
	});
}
