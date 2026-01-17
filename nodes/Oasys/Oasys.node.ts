/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Node
 *
 * Main n8n node for Oasys blockchain operations
 * Supports Hub (Layer 1) and Verse (Layer 2) architecture
 *
 * @author Velocity BPA
 * @website https://velobpa.com
 * @github https://github.com/Velocity-BPA
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { createHubClient } from './transport/hubClient';
import { createVerseClient } from './transport/verseClient';
import { createBridgeClient } from './transport/bridgeClient';
import { ExplorerApiClient, GamingApiClient } from './transport/apiClient';
import { OASYS_NETWORKS, OASYS_HUB_MAINNET, OASYS_HUB_TESTNET } from './constants/networks';
import { VERSES, getVerseConfig } from './constants/verses';
import { KNOWN_VALIDATORS } from './constants/validators';
import { PARTNERS } from './constants/partners';
import { weiToOas, oasToWei, formatOas, formatGwei } from './utils/unitConverter';
import { isHubLayer, getNetworkConfig, getExplorerUrl } from './utils/layerUtils';
import { getBridgeEstimate, validateBridgeAmount } from './utils/bridgeUtils';
import { calculateStakingApy, calculateDelegatorRewards } from './utils/validatorUtils';

export class Oasys implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Oasys',
		name: 'oasys',
		icon: 'file:oasys.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Oasys blockchain - Hub (L1) and Verse (L2) operations',
		defaults: {
			name: 'Oasys',
		},
		inputs: ['main'] as const,
		outputs: ['main'] as const,
		credentials: [
			{
				name: 'oasysNetwork',
				required: true,
			},
			{
				name: 'oasysApi',
				required: false,
			},
		],
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Wallet', value: 'wallet', description: 'Wallet operations (balances, transfers, NFTs)' },
					{ name: 'Hub', value: 'hub', description: 'Hub Layer 1 operations' },
					{ name: 'Verse', value: 'verse', description: 'Verse Layer 2 operations' },
					{ name: 'Bridge', value: 'bridge', description: 'Hub ↔ Verse bridging operations' },
					{ name: 'NFT', value: 'nft', description: 'NFT operations (ERC721/ERC1155)' },
					{ name: 'Collection', value: 'collection', description: 'NFT collection operations' },
					{ name: 'Staking', value: 'staking', description: 'Staking and delegation operations' },
					{ name: 'Validator', value: 'validator', description: 'Validator information and stats' },
					{ name: 'Contract', value: 'contract', description: 'Smart contract interactions' },
					{ name: 'Gaming', value: 'gaming', description: 'Gaming integrations' },
					{ name: 'Partner', value: 'partner', description: 'Partner/Game studio information' },
					{ name: 'Block', value: 'block', description: 'Block queries' },
					{ name: 'Transaction', value: 'transaction', description: 'Transaction operations' },
					{ name: 'Token', value: 'token', description: 'Token (ERC20) operations' },
					{ name: 'Events', value: 'events', description: 'Event queries and subscriptions' },
					{ name: 'Utility', value: 'utility', description: 'Utility functions' },
				],
				default: 'wallet',
			},

			// ==================== WALLET OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['wallet'] } },
				options: [
					{ name: 'Get OAS Balance', value: 'getBalance', description: 'Get native OAS balance' },
					{ name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get ERC20 token balance' },
					{ name: 'Get Wallet NFTs', value: 'getWalletNfts', description: 'Get NFTs owned by wallet' },
					{ name: 'Transfer OAS', value: 'transfer', description: 'Transfer OAS to another address' },
					{ name: 'Transfer Token', value: 'transferToken', description: 'Transfer ERC20 token' },
					{ name: 'Get Transaction History', value: 'getHistory', description: 'Get transaction history' },
					{ name: 'Validate Address', value: 'validateAddress', description: 'Validate an address' },
					{ name: 'Get Cross-Layer Balances', value: 'getCrossLayerBalances', description: 'Get balances across Hub and Verses' },
				],
				default: 'getBalance',
			},

			// ==================== HUB OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['hub'] } },
				options: [
					{ name: 'Get Hub Info', value: 'getInfo', description: 'Get Hub network information' },
					{ name: 'Get Hub Block', value: 'getBlock', description: 'Get block by number or hash' },
					{ name: 'Get Hub Transaction', value: 'getTransaction', description: 'Get transaction by hash' },
					{ name: 'Get Validators', value: 'getValidators', description: 'Get list of Hub validators' },
					{ name: 'Get Staking Info', value: 'getStakingInfo', description: 'Get staking information' },
					{ name: 'Get Epoch Info', value: 'getEpochInfo', description: 'Get current epoch information' },
					{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get current gas price' },
					{ name: 'Get Hub Statistics', value: 'getStatistics', description: 'Get Hub statistics' },
				],
				default: 'getInfo',
			},

			// ==================== VERSE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['verse'] } },
				options: [
					{ name: 'Get Verse Info', value: 'getInfo', description: 'Get Verse information' },
					{ name: 'Get Verse List', value: 'getList', description: 'Get list of available Verses' },
					{ name: 'Get Verse Status', value: 'getStatus', description: 'Get Verse connection status' },
					{ name: 'Get Verse Block', value: 'getBlock', description: 'Get Verse block' },
					{ name: 'Get Verse Transaction', value: 'getTransaction', description: 'Get Verse transaction' },
					{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get Verse gas price (0 if gasless)' },
					{ name: 'Get Bridge Status', value: 'getBridgeStatus', description: 'Get bridge status for Verse' },
				],
				default: 'getInfo',
			},

			// ==================== BRIDGE OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['bridge'] } },
				options: [
					{ name: 'Deposit to Verse', value: 'deposit', description: 'Deposit OAS from Hub to Verse' },
					{ name: 'Withdraw from Verse', value: 'withdraw', description: 'Withdraw OAS from Verse to Hub' },
					{ name: 'Get Bridge Status', value: 'getStatus', description: 'Get bridge transaction status' },
					{ name: 'Get Pending Bridges', value: 'getPending', description: 'Get pending bridge operations' },
					{ name: 'Get Bridge History', value: 'getHistory', description: 'Get bridge history for address' },
					{ name: 'Get Bridge Limits', value: 'getLimits', description: 'Get bridge limits' },
					{ name: 'Estimate Bridge Time', value: 'estimateTime', description: 'Estimate bridge completion time' },
					{ name: 'Get Supported Assets', value: 'getSupportedAssets', description: 'Get supported bridge assets' },
				],
				default: 'getStatus',
			},

			// ==================== NFT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['nft'] } },
				options: [
					{ name: 'Get NFT Info', value: 'getInfo', description: 'Get NFT information' },
					{ name: 'Get NFT Metadata', value: 'getMetadata', description: 'Get NFT metadata (attributes, image, etc.)' },
					{ name: 'Get NFTs by Owner', value: 'getByOwner', description: 'Get all NFTs owned by address' },
					{ name: 'Get NFTs by Collection', value: 'getByCollection', description: 'Get NFTs in a collection' },
					{ name: 'Transfer NFT', value: 'transfer', description: 'Transfer an NFT (ERC721)' },
					{ name: 'Transfer ERC1155', value: 'transferErc1155', description: 'Transfer ERC1155 token' },
					{ name: 'Get NFT Owner', value: 'getOwner', description: 'Get owner of an NFT' },
					{ name: 'Get NFT Balance', value: 'getBalance', description: 'Get NFT balance (ERC1155)' },
				],
				default: 'getInfo',
			},

			// ==================== COLLECTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['collection'] } },
				options: [
					{ name: 'Get Collection Info', value: 'getInfo', description: 'Get collection information' },
					{ name: 'Get Collection Stats', value: 'getStats', description: 'Get collection statistics' },
					{ name: 'Get Collection NFTs', value: 'getNfts', description: 'Get NFTs in collection' },
					{ name: 'Get Collections List', value: 'getList', description: 'Get list of collections' },
					{ name: 'Get Floor Price', value: 'getFloorPrice', description: 'Get collection floor price' },
					{ name: 'Get Holders', value: 'getHolders', description: 'Get collection holders' },
				],
				default: 'getInfo',
			},

			// ==================== STAKING OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['staking'] } },
				options: [
					{ name: 'Get Staking Info', value: 'getInfo', description: 'Get staking information for address' },
					{ name: 'Stake OAS', value: 'stake', description: 'Stake OAS with a validator' },
					{ name: 'Unstake OAS', value: 'unstake', description: 'Unstake OAS from a validator' },
					{ name: 'Get Validators', value: 'getValidators', description: 'Get list of validators' },
					{ name: 'Get Validator Info', value: 'getValidatorInfo', description: 'Get validator details' },
					{ name: 'Get Delegation Info', value: 'getDelegation', description: 'Get delegation information' },
					{ name: 'Get Staking Rewards', value: 'getRewards', description: 'Get pending staking rewards' },
					{ name: 'Claim Rewards', value: 'claimRewards', description: 'Claim staking rewards' },
					{ name: 'Get Staking APY', value: 'getApy', description: 'Get current staking APY' },
				],
				default: 'getInfo',
			},

			// ==================== VALIDATOR OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['validator'] } },
				options: [
					{ name: 'Get Validators List', value: 'getList', description: 'Get list of all validators' },
					{ name: 'Get Validator Info', value: 'getInfo', description: 'Get validator information' },
					{ name: 'Get Validator Delegators', value: 'getDelegators', description: 'Get validator delegators' },
					{ name: 'Get Validator Rewards', value: 'getRewards', description: 'Get validator rewards' },
					{ name: 'Get Commission Rate', value: 'getCommission', description: 'Get validator commission rate' },
					{ name: 'Get Known Validators', value: 'getKnown', description: 'Get known validator info (SEGA, Bandai Namco, etc.)' },
				],
				default: 'getList',
			},

			// ==================== CONTRACT OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contract'] } },
				options: [
					{ name: 'Read Contract', value: 'read', description: 'Call a read-only contract method' },
					{ name: 'Write Contract', value: 'write', description: 'Execute a contract method' },
					{ name: 'Get Contract ABI', value: 'getAbi', description: 'Get contract ABI from explorer' },
					{ name: 'Encode Function', value: 'encode', description: 'Encode function call data' },
					{ name: 'Decode Result', value: 'decode', description: 'Decode function result' },
					{ name: 'Get Contract Events', value: 'getEvents', description: 'Get contract events' },
					{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for transaction' },
				],
				default: 'read',
			},

			// ==================== GAMING OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['gaming'] } },
				options: [
					{ name: 'Get Game Info', value: 'getGameInfo', description: 'Get game information' },
					{ name: 'Get Available Games', value: 'getGames', description: 'Get list of available games' },
					{ name: 'Get Player Stats', value: 'getPlayerStats', description: 'Get player statistics' },
					{ name: 'Get Leaderboard', value: 'getLeaderboard', description: 'Get game leaderboard' },
					{ name: 'Get Match History', value: 'getMatchHistory', description: 'Get match history' },
					{ name: 'Get Tournament Info', value: 'getTournament', description: 'Get tournament information' },
				],
				default: 'getGames',
			},

			// ==================== PARTNER OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['partner'] } },
				options: [
					{ name: 'Get Partner Info', value: 'getInfo', description: 'Get partner information' },
					{ name: 'Get Partner Games', value: 'getGames', description: 'Get partner games' },
					{ name: 'Get Partner Verses', value: 'getVerses', description: 'Get partner Verses' },
					{ name: 'Get All Partners', value: 'getAll', description: 'Get all partners' },
				],
				default: 'getAll',
			},

			// ==================== BLOCK OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['block'] } },
				options: [
					{ name: 'Get Block', value: 'get', description: 'Get block by number or hash' },
					{ name: 'Get Latest Block', value: 'getLatest', description: 'Get latest block' },
					{ name: 'Get Block Transactions', value: 'getTransactions', description: 'Get block transactions' },
					{ name: 'Get Block Time', value: 'getTime', description: 'Get block timestamp' },
				],
				default: 'getLatest',
			},

			// ==================== TRANSACTION OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['transaction'] } },
				options: [
					{ name: 'Send Transaction', value: 'send', description: 'Send a transaction' },
					{ name: 'Get Transaction', value: 'get', description: 'Get transaction by hash' },
					{ name: 'Get Transaction Receipt', value: 'getReceipt', description: 'Get transaction receipt' },
					{ name: 'Get Transaction Status', value: 'getStatus', description: 'Get transaction status' },
					{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for transaction' },
					{ name: 'Get Gas Price', value: 'getGasPrice', description: 'Get current gas price' },
				],
				default: 'get',
			},

			// ==================== TOKEN OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['token'] } },
				options: [
					{ name: 'Get Token Info', value: 'getInfo', description: 'Get ERC20 token information' },
					{ name: 'Get Token Balance', value: 'getBalance', description: 'Get token balance' },
					{ name: 'Transfer Token', value: 'transfer', description: 'Transfer tokens' },
					{ name: 'Approve Spending', value: 'approve', description: 'Approve token spending' },
					{ name: 'Get Allowance', value: 'getAllowance', description: 'Get spending allowance' },
				],
				default: 'getInfo',
			},

			// ==================== EVENTS OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['events'] } },
				options: [
					{ name: 'Get Events', value: 'get', description: 'Get contract events' },
					{ name: 'Get Transfer Events', value: 'getTransfers', description: 'Get token transfer events' },
					{ name: 'Decode Event', value: 'decode', description: 'Decode event log' },
				],
				default: 'get',
			},

			// ==================== UTILITY OPERATIONS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['utility'] } },
				options: [
					{ name: 'Convert Units', value: 'convertUnits', description: 'Convert between wei, gwei, and OAS' },
					{ name: 'Encode ABI', value: 'encodeAbi', description: 'ABI encode function call' },
					{ name: 'Decode ABI', value: 'decodeAbi', description: 'ABI decode data' },
					{ name: 'Sign Message', value: 'signMessage', description: 'Sign a message' },
					{ name: 'Verify Signature', value: 'verifySignature', description: 'Verify message signature' },
					{ name: 'Get Chain ID', value: 'getChainId', description: 'Get chain ID' },
					{ name: 'Get Network Status', value: 'getNetworkStatus', description: 'Get network connection status' },
					{ name: 'Validate Address', value: 'validateAddress', description: 'Validate an Ethereum address' },
				],
				default: 'convertUnits',
			},

			// ==================== COMMON PARAMETERS ====================

			// Address parameter
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Wallet or contract address',
				displayOptions: {
					show: {
						resource: ['wallet', 'staking', 'nft', 'collection', 'token'],
						operation: ['getBalance', 'getTokenBalance', 'getWalletNfts', 'getHistory', 'validateAddress', 'getCrossLayerBalances', 'getInfo', 'getByOwner', 'getHolders', 'getDelegation', 'getRewards'],
					},
				},
			},

			// To Address parameter
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Recipient address',
				displayOptions: {
					show: {
						resource: ['wallet', 'nft', 'token', 'transaction'],
						operation: ['transfer', 'transferToken', 'transferErc1155', 'send'],
					},
				},
			},

			// Amount parameter
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				placeholder: '1.0',
				description: 'Amount (in OAS or token units)',
				displayOptions: {
					show: {
						resource: ['wallet', 'bridge', 'staking', 'token', 'transaction'],
						operation: ['transfer', 'transferToken', 'deposit', 'withdraw', 'stake', 'unstake', 'approve', 'send'],
					},
				},
			},

			// Token Address parameter
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'ERC20 token contract address',
				displayOptions: {
					show: {
						resource: ['wallet', 'token'],
						operation: ['getTokenBalance', 'transferToken', 'getInfo', 'transfer', 'approve', 'getAllowance'],
					},
				},
			},

			// Contract Address parameter
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Smart contract address',
				displayOptions: {
					show: {
						resource: ['nft', 'collection', 'contract', 'events'],
						operation: ['getInfo', 'getMetadata', 'getByCollection', 'transfer', 'transferErc1155', 'getOwner', 'getBalance', 'getStats', 'getNfts', 'getFloorPrice', 'read', 'write', 'getAbi', 'getEvents', 'estimateGas', 'get', 'getTransfers'],
					},
				},
			},

			// Token ID parameter
			{
				displayName: 'Token ID',
				name: 'tokenId',
				type: 'string',
				default: '',
				placeholder: '1',
				description: 'NFT token ID',
				displayOptions: {
					show: {
						resource: ['nft'],
						operation: ['getInfo', 'getMetadata', 'transfer', 'transferErc1155', 'getOwner', 'getBalance'],
					},
				},
			},

			// Block Number/Hash parameter
			{
				displayName: 'Block Number or Hash',
				name: 'blockId',
				type: 'string',
				default: '',
				placeholder: '12345 or 0x...',
				description: 'Block number or hash',
				displayOptions: {
					show: {
						resource: ['hub', 'verse', 'block'],
						operation: ['getBlock', 'get', 'getTransactions', 'getTime'],
					},
				},
			},

			// Transaction Hash parameter
			{
				displayName: 'Transaction Hash',
				name: 'txHash',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Transaction hash',
				displayOptions: {
					show: {
						resource: ['hub', 'verse', 'bridge', 'transaction'],
						operation: ['getTransaction', 'getStatus', 'get', 'getReceipt'],
					},
				},
			},

			// Validator Address parameter
			{
				displayName: 'Validator Address',
				name: 'validatorAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Validator address',
				displayOptions: {
					show: {
						resource: ['staking', 'validator'],
						operation: ['stake', 'unstake', 'getValidatorInfo', 'getInfo', 'getDelegators', 'getRewards', 'getCommission'],
					},
				},
			},

			// Verse Selection parameter
			{
				displayName: 'Verse',
				name: 'verse',
				type: 'options',
				options: [
					{ name: 'HOME Verse', value: 'homeVerse' },
					{ name: 'MCH Verse', value: 'mchVerse' },
					{ name: 'TCG Verse', value: 'tcgVerse' },
					{ name: 'Saakuru Verse', value: 'saakuruVerse' },
					{ name: 'Chain Verse', value: 'chainVerse' },
					{ name: 'DeFi Verse', value: 'defiVerse' },
					{ name: 'Yooldo Verse', value: 'yooldoVerse' },
					{ name: 'GEEK Verse', value: 'geekVerse' },
				],
				default: 'homeVerse',
				description: 'Select the Verse to interact with',
				displayOptions: {
					show: {
						resource: ['verse', 'bridge'],
						operation: ['getInfo', 'getStatus', 'getBlock', 'getTransaction', 'getGasPrice', 'getBridgeStatus', 'deposit', 'withdraw', 'estimateTime'],
					},
				},
			},

			// Bridge Direction (for status check)
			{
				displayName: 'Bridge Direction',
				name: 'bridgeDirection',
				type: 'options',
				options: [
					{ name: 'Deposit (Hub → Verse)', value: 'deposit' },
					{ name: 'Withdraw (Verse → Hub)', value: 'withdraw' },
				],
				default: 'deposit',
				description: 'Direction of the bridge transaction',
				displayOptions: {
					show: {
						resource: ['bridge'],
						operation: ['getStatus'],
					},
				},
			},

			// Layer Selection (Hub or Verse)
			{
				displayName: 'Layer',
				name: 'layer',
				type: 'options',
				options: [
					{ name: 'Hub (Layer 1)', value: 'hub' },
					{ name: 'Verse (Layer 2)', value: 'verse' },
				],
				default: 'hub',
				description: 'Select the layer to use',
				displayOptions: {
					show: {
						resource: ['contract', 'block', 'transaction', 'events'],
					},
				},
			},

			// Contract Method parameter
			{
				displayName: 'Method Name',
				name: 'methodName',
				type: 'string',
				default: '',
				placeholder: 'balanceOf',
				description: 'Contract method name to call',
				displayOptions: {
					show: {
						resource: ['contract'],
						operation: ['read', 'write', 'encode'],
					},
				},
			},

			// Contract ABI parameter
			{
				displayName: 'ABI',
				name: 'abi',
				type: 'json',
				default: '[]',
				description: 'Contract ABI (JSON array)',
				displayOptions: {
					show: {
						resource: ['contract', 'events'],
						operation: ['read', 'write', 'encode', 'decode', 'get'],
					},
				},
			},

			// Method Arguments parameter
			{
				displayName: 'Arguments',
				name: 'args',
				type: 'json',
				default: '[]',
				description: 'Method arguments as JSON array',
				displayOptions: {
					show: {
						resource: ['contract'],
						operation: ['read', 'write', 'encode'],
					},
				},
			},

			// Partner ID parameter
			{
				displayName: 'Partner ID',
				name: 'partnerId',
				type: 'string',
				default: '',
				placeholder: 'sega',
				description: 'Partner identifier',
				displayOptions: {
					show: {
						resource: ['partner'],
						operation: ['getInfo', 'getGames', 'getVerses'],
					},
				},
			},

			// Game ID parameter
			{
				displayName: 'Game ID',
				name: 'gameId',
				type: 'string',
				default: '',
				placeholder: 'game-id',
				description: 'Game identifier',
				displayOptions: {
					show: {
						resource: ['gaming'],
						operation: ['getGameInfo', 'getPlayerStats', 'getLeaderboard', 'getMatchHistory', 'getTournament'],
					},
				},
			},

			// Player Address parameter
			{
				displayName: 'Player Address',
				name: 'playerAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Player wallet address',
				displayOptions: {
					show: {
						resource: ['gaming'],
						operation: ['getPlayerStats', 'getMatchHistory'],
					},
				},
			},

			// Unit Conversion parameters
			{
				displayName: 'From Unit',
				name: 'fromUnit',
				type: 'options',
				options: [
					{ name: 'Wei', value: 'wei' },
					{ name: 'Gwei', value: 'gwei' },
					{ name: 'OAS', value: 'oas' },
				],
				default: 'wei',
				description: 'Unit to convert from',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'To Unit',
				name: 'toUnit',
				type: 'options',
				options: [
					{ name: 'Wei', value: 'wei' },
					{ name: 'Gwei', value: 'gwei' },
					{ name: 'OAS', value: 'oas' },
				],
				default: 'oas',
				description: 'Unit to convert to',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				placeholder: '1000000000000000000',
				description: 'Value to convert',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['convertUnits'],
					},
				},
			},

			// Message to Sign
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				placeholder: 'Message to sign',
				description: 'Message to sign or verify',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['signMessage', 'verifySignature'],
					},
				},
			},

			// Signature
			{
				displayName: 'Signature',
				name: 'signature',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Signature to verify',
				displayOptions: {
					show: {
						resource: ['utility'],
						operation: ['verifySignature'],
					},
				},
			},

			// From Block parameter
			{
				displayName: 'From Block',
				name: 'fromBlock',
				type: 'number',
				default: 0,
				description: 'Starting block number',
				displayOptions: {
					show: {
						resource: ['contract', 'events'],
						operation: ['getEvents', 'get', 'getTransfers'],
					},
				},
			},

			// To Block parameter
			{
				displayName: 'To Block',
				name: 'toBlock',
				type: 'string',
				default: 'latest',
				description: 'Ending block number or "latest"',
				displayOptions: {
					show: {
						resource: ['contract', 'events'],
						operation: ['getEvents', 'get', 'getTransfers'],
					},
				},
			},

			// Event Name parameter
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				default: '',
				placeholder: 'Transfer',
				description: 'Event name to filter',
				displayOptions: {
					show: {
						resource: ['contract', 'events'],
						operation: ['getEvents', 'get'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('oasysNetwork');
		let apiCredentials: { explorerApiKey?: string; gamingApiEndpoint?: string } | undefined;
		try {
			apiCredentials = await this.getCredentials('oasysApi') as { explorerApiKey?: string; gamingApiEndpoint?: string };
		} catch {
			// API credentials are optional
		}

		// Create clients based on network layer
		const networkLayer = credentials.layer as string;
		const isHub = networkLayer === 'hubMainnet' || networkLayer === 'hubTestnet';

		let hubClient: ReturnType<typeof createHubClient> | null = null;
		let verseClient: ReturnType<typeof createVerseClient> | null = null;

		if (isHub || ['hub', 'staking', 'validator', 'bridge'].includes(resource)) {
			hubClient = createHubClient({
				network: networkLayer as 'mainnet' | 'testnet',
				privateKey: credentials.privateKey as string,
			});
		}

		if (!isHub || ['verse', 'bridge'].includes(resource)) {
			const verseKey = credentials.verse as string || 'homeVerse';
			verseClient = createVerseClient({
				verse: verseKey,
				privateKey: credentials.privateKey as string,
			});
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let result: unknown;

				// ==================== WALLET RESOURCE ====================
				if (resource === 'wallet') {
					if (operation === 'getBalance') {
						const address = this.getNodeParameter('address', i) as string;
						if (hubClient) {
							const balance = await hubClient.getBalance(address);
							result = {
								address,
								balance: balance.toString(),
								balanceFormatted: formatOas(balance),
								layer: 'Hub',
							};
						}
					} else if (operation === 'getTokenBalance') {
						const address = this.getNodeParameter('address', i) as string;
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						const client = isHub ? hubClient : verseClient;
						if (client) {
							const balance = await client.getTokenBalance(tokenAddress, address);
							const tokenInfo = await client.getTokenInfo(tokenAddress);
							result = {
								address,
								tokenAddress,
								balance: balance.toString(),
								symbol: tokenInfo.symbol,
								decimals: tokenInfo.decimals,
							};
						}
					} else if (operation === 'transfer') {
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const client = isHub ? hubClient : verseClient;
						if (client) {
							const tx = await client.transfer(toAddress, oasToWei(amount));
							result = {
								txHash: tx.hash,
								from: tx.from,
								to: toAddress,
								amount,
								layer: isHub ? 'Hub' : 'Verse',
							};
						}
					} else if (operation === 'transferToken') {
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const client = isHub ? hubClient : verseClient;
						if (client) {
							const tokenInfo = await client.getTokenInfo(tokenAddress);
							const amountInWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenInfo.decimals)));
							const tx = await client.transferToken(tokenAddress, toAddress, amountInWei);
							result = {
								txHash: tx.hash,
								tokenAddress,
								to: toAddress,
								amount,
								symbol: tokenInfo.symbol,
							};
						}
					} else if (operation === 'validateAddress') {
						const address = this.getNodeParameter('address', i) as string;
						const client = hubClient || verseClient;
						if (client) {
							const validation = client.validateAddress(address);
							result = {
								address,
								isValid: validation.isValid,
								checksumAddress: validation.checksumed,
							};
						}
					} else if (operation === 'getCrossLayerBalances') {
						const address = this.getNodeParameter('address', i) as string;
						const balances: { layer: string; balance: string; balanceFormatted: string }[] = [];

						if (hubClient) {
							const hubBalance = await hubClient.getBalance(address);
							balances.push({
								layer: 'Hub',
								balance: hubBalance.toString(),
								balanceFormatted: formatOas(hubBalance),
							});
						}

						// Get balances from all known verses
						for (const [key, verse] of Object.entries(VERSES)) {
							try {
								const client = createVerseClient({ verse: key });
								const balance = await client.getBalance(address);
								balances.push({
									layer: verse.name,
									balance: balance.toString(),
									balanceFormatted: formatOas(balance),
								});
							} catch {
								// Skip verses that fail
							}
						}

						result = { address, balances };
					}
				}

				// ==================== HUB RESOURCE ====================
				else if (resource === 'hub') {
					if (!hubClient) {
						throw new Error('Hub client not configured. Select Hub network in credentials.');
					}

					if (operation === 'getInfo') {
						const [blockNumber, gasPrice, network] = await Promise.all([
							hubClient.getBlockNumber(),
							hubClient.getGasPrice(),
							hubClient.getProvider().getNetwork(),
						]);
						result = {
							chainId: Number(network.chainId),
							blockNumber,
							gasPrice: gasPrice.toString(),
							gasPriceGwei: formatGwei(gasPrice),
							network: networkLayer === 'hubMainnet' ? 'mainnet' : 'testnet',
						};
					} else if (operation === 'getBlock') {
						const blockId = this.getNodeParameter('blockId', i) as string;
						const block = await hubClient.getBlock(blockId.startsWith('0x') ? blockId : parseInt(blockId));
						result = block;
					} else if (operation === 'getTransaction') {
						const txHash = this.getNodeParameter('txHash', i) as string;
						const tx = await hubClient.getTransaction(txHash);
						result = tx;
					} else if (operation === 'getValidators') {
						const validators = await hubClient.getValidators();
						result = { validators };
					} else if (operation === 'getStakingInfo') {
						const address = this.getNodeParameter('address', i) as string;
						const stakingInfo = await hubClient.getStakingInfo(address);
						result = stakingInfo;
					} else if (operation === 'getEpochInfo') {
						const epochInfo = await hubClient.getCurrentEpochInfo();
						result = epochInfo;
					} else if (operation === 'getGasPrice') {
						const gasPrice = await hubClient.getGasPrice();
						result = {
							gasPrice: gasPrice.toString(),
							gasPriceGwei: formatGwei(gasPrice),
						};
					}
				}

				// ==================== VERSE RESOURCE ====================
				else if (resource === 'verse') {
					if (operation === 'getList') {
						result = {
							verses: Object.entries(VERSES).map(([key, verse]) => ({
								id: key,
								name: verse.name,
								chainId: verse.chainId,
								rpcUrl: verse.rpcUrl,
								isGasless: verse.isGasless,
								operator: verse.operator,
							})),
						};
					} else if (operation === 'getInfo') {
						const verseKey = this.getNodeParameter('verse', i) as string;
						const verseConfig = getVerseConfig(verseKey);
						if (!verseConfig) {
							throw new Error(`Verse not found: ${verseKey}`);
						}
						result = {
							id: verseKey,
							name: verseConfig.name,
							chainId: verseConfig.chainId,
							rpcUrl: verseConfig.rpcUrl,
							isGasless: verseConfig.isGasless,
							operator: verseConfig.operator,
							bridgeAddress: verseConfig.bridgeAddress,
						};
					} else if (operation === 'getStatus') {
						const verseKey = this.getNodeParameter('verse', i) as string;
						const client = createVerseClient({ verse: verseKey });
						result = await client.getStatus();
					} else if (operation === 'getBlock') {
						const verseKey = this.getNodeParameter('verse', i) as string;
						const blockId = this.getNodeParameter('blockId', i) as string;
						const client = createVerseClient({ verse: verseKey });
						const block = await client.getBlock(blockId.startsWith('0x') ? blockId : parseInt(blockId));
						result = block;
					} else if (operation === 'getTransaction') {
						const verseKey = this.getNodeParameter('verse', i) as string;
						const txHash = this.getNodeParameter('txHash', i) as string;
						const client = createVerseClient({ verse: verseKey });
						result = await client.getTransaction(txHash);
					} else if (operation === 'getGasPrice') {
						const verseKey = this.getNodeParameter('verse', i) as string;
						const client = createVerseClient({ verse: verseKey });
						const gasPrice = await client.getGasPrice();
						const verseConfig = getVerseConfig(verseKey);
						result = {
							gasPrice: gasPrice.toString(),
							gasPriceGwei: formatGwei(gasPrice),
							isGasless: verseConfig?.isGasless ?? false,
						};
					}
				}

				// ==================== BRIDGE RESOURCE ====================
				else if (resource === 'bridge') {
					const verseKey = this.getNodeParameter('verse', i) as string;
					const bridgeClient = createBridgeClient(
						{
							layer: networkLayer,
							privateKey: credentials.privateKey as string,
						},
						verseKey
					);

					if (operation === 'deposit') {
						const amount = this.getNodeParameter('amount', i) as string;
						const amountWei = oasToWei(amount);
						const validation = validateBridgeAmount(amountWei, 'deposit');
						if (!validation.isValid) {
							throw new Error(validation.error);
						}
						const tx = await bridgeClient.depositOas(amountWei);
						result = {
							txHash: tx.hash,
							amount,
							direction: 'Hub → Verse',
							verse: verseKey,
							estimatedTime: '~15 minutes',
						};
					} else if (operation === 'withdraw') {
						const amount = this.getNodeParameter('amount', i) as string;
						const amountWei = oasToWei(amount);
						const validation = validateBridgeAmount(amountWei, 'withdraw');
						if (!validation.isValid) {
							throw new Error(validation.error);
						}
						const tx = await bridgeClient.withdrawOas(amountWei);
						result = {
							txHash: tx.hash,
							amount,
							direction: 'Verse → Hub',
							verse: verseKey,
							estimatedTime: '~7 days (challenge period)',
						};
					} else if (operation === 'getStatus') {
						const txHash = this.getNodeParameter('txHash', i) as string;
						const direction = this.getNodeParameter('bridgeDirection', i, 'deposit') as 'deposit' | 'withdraw';
						result = await bridgeClient.getBridgeStatus(txHash, direction);
					} else if (operation === 'estimateTime') {
						const estimate = getBridgeEstimate('deposit');
						result = {
							deposit: getBridgeEstimate('deposit'),
							withdrawal: getBridgeEstimate('withdraw'),
						};
					} else if (operation === 'getLimits') {
						result = {
							deposit: {
								minAmount: '0.01 OAS',
								maxAmount: '10,000 OAS per transaction',
							},
							withdrawal: {
								minAmount: '0.01 OAS',
								maxAmount: '10,000 OAS per transaction',
								challengePeriod: '7 days',
							},
						};
					} else if (operation === 'getSupportedAssets') {
						result = {
							assets: [
								{ symbol: 'OAS', name: 'Oasys', type: 'native' },
								{ symbol: 'Bridged ERC20', name: 'Various ERC20 tokens', type: 'erc20' },
							],
						};
					}
				}

				// ==================== NFT RESOURCE ====================
				else if (resource === 'nft') {
					const client = isHub ? hubClient : verseClient;
					if (!client) throw new Error('Client not configured');

					if (operation === 'getInfo' || operation === 'getMetadata') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const tokenId = this.getNodeParameter('tokenId', i) as string;
						const tokenUri = await client.getTokenUri(contractAddress, tokenId);
						const owner = await client.getNftOwner(contractAddress, tokenId);
						result = {
							contractAddress,
							tokenId,
							tokenUri,
							owner,
						};
					} else if (operation === 'getOwner') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const tokenId = this.getNodeParameter('tokenId', i) as string;
						const owner = await client.getNftOwner(contractAddress, tokenId);
						result = { contractAddress, tokenId, owner };
					} else if (operation === 'getBalance') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const address = this.getNodeParameter('address', i) as string;
						const tokenId = this.getNodeParameter('tokenId', i) as string;
						if (verseClient) {
							const balance = await verseClient.getErc1155Balance(contractAddress, address, tokenId);
							result = { contractAddress, address, tokenId, balance: balance.toString() };
						}
					} else if (operation === 'transfer') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const tokenId = this.getNodeParameter('tokenId', i) as string;
						const fromAddress = client.getWallet()?.address;
						if (!fromAddress) throw new Error('Wallet not configured');
						const tx = await client.transferNft(contractAddress, fromAddress, toAddress, tokenId);
						result = { txHash: tx.hash, contractAddress, tokenId, to: toAddress };
					} else if (operation === 'transferErc1155') {
						if (!verseClient) throw new Error('Verse client required for ERC1155');
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const tokenId = this.getNodeParameter('tokenId', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const fromAddress = verseClient.getWallet()?.address;
						if (!fromAddress) throw new Error('Wallet not configured');
						const tx = await verseClient.transferErc1155(contractAddress, fromAddress, toAddress, tokenId, BigInt(amount));
						result = { txHash: tx.hash, contractAddress, tokenId, amount, to: toAddress };
					}
				}

				// ==================== STAKING RESOURCE ====================
				else if (resource === 'staking') {
					if (!hubClient) {
						throw new Error('Hub client required for staking operations');
					}

					if (operation === 'getInfo') {
						const address = this.getNodeParameter('address', i) as string;
						result = await hubClient.getStakingInfo(address);
					} else if (operation === 'stake') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tx = await hubClient.stake(validatorAddress, oasToWei(amount));
						result = { txHash: tx.hash, validator: validatorAddress, amount };
					} else if (operation === 'unstake') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tx = await hubClient.unstake(validatorAddress, oasToWei(amount));
						result = { txHash: tx.hash, validator: validatorAddress, amount };
					} else if (operation === 'getValidators') {
						const validators = await hubClient.getValidators();
						result = { validators };
					} else if (operation === 'getValidatorInfo') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						result = await hubClient.getValidatorInfo(validatorAddress);
					} else if (operation === 'claimRewards') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						const tx = await hubClient.claimRewards(validatorAddress);
						result = { txHash: tx.hash, validator: validatorAddress };
					} else if (operation === 'getApy') {
						const apy = calculateStakingApy(1_000_000n * 10n ** 18n, 10n ** 18n);
						result = { estimatedApy: `${apy.toFixed(2)}%` };
					}
				}

				// ==================== VALIDATOR RESOURCE ====================
				else if (resource === 'validator') {
					if (!hubClient) {
						throw new Error('Hub client required for validator operations');
					}

					if (operation === 'getList') {
						const validators = await hubClient.getValidators();
						result = { validators };
					} else if (operation === 'getInfo') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						result = await hubClient.getValidatorInfo(validatorAddress);
					} else if (operation === 'getKnown') {
						result = { validators: KNOWN_VALIDATORS };
					} else if (operation === 'getCommission') {
						const validatorAddress = this.getNodeParameter('validatorAddress', i) as string;
						const info = await hubClient.getValidatorInfo(validatorAddress);
						result = {
							validator: validatorAddress,
							commission: '10%', // Standard Oasys commission
						};
					}
				}

				// ==================== CONTRACT RESOURCE ====================
				else if (resource === 'contract') {
					const layer = this.getNodeParameter('layer', i) as string;
					const client = layer === 'hub' ? hubClient : verseClient;
					if (!client) throw new Error(`${layer} client not configured`);

					if (operation === 'read') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const abi = JSON.parse(this.getNodeParameter('abi', i) as string);
						const methodName = this.getNodeParameter('methodName', i) as string;
						const args = JSON.parse(this.getNodeParameter('args', i) as string || '[]');
						const response = await client.readContract(contractAddress, abi, methodName, args);
						result = { contractAddress, method: methodName, result: response };
					} else if (operation === 'write') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const abi = JSON.parse(this.getNodeParameter('abi', i) as string);
						const methodName = this.getNodeParameter('methodName', i) as string;
						const args = JSON.parse(this.getNodeParameter('args', i) as string || '[]');
						const tx = await client.writeContract(contractAddress, abi, methodName, args);
						result = { txHash: tx.hash, contractAddress, method: methodName };
					} else if (operation === 'estimateGas') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const gas = await client.estimateGas({ to: contractAddress });
						result = { estimatedGas: gas.toString() };
					}
				}

				// ==================== GAMING RESOURCE ====================
				else if (resource === 'gaming') {
					if (operation === 'getGames') {
						// Return games from partners registry
						const games: { id: string; name: string; studio: string; verseId?: string }[] = [];
						for (const [, partner] of Object.entries(PARTNERS)) {
							for (const game of partner.games ?? []) {
								games.push({
									id: game.id,
									name: game.name,
									studio: partner.name,
									verseId: partner.verseId,
								});
							}
						}
						result = { games };
					} else if (operation === 'getGameInfo') {
						const gameId = this.getNodeParameter('gameId', i) as string;
						let foundGame = null;
						for (const [, partner] of Object.entries(PARTNERS)) {
							const game = (partner.games ?? []).find(g => g.id === gameId);
							if (game) {
								foundGame = { ...game, studio: partner.name, verseId: partner.verseId };
								break;
							}
						}
						result = foundGame || { error: 'Game not found' };
					}
				}

				// ==================== PARTNER RESOURCE ====================
				else if (resource === 'partner') {
					if (operation === 'getAll') {
						result = { partners: Object.entries(PARTNERS).map(([key, p]) => ({ key, ...p })) };
					} else if (operation === 'getInfo') {
						const partnerId = this.getNodeParameter('partnerId', i) as string;
						const partner = PARTNERS[partnerId as keyof typeof PARTNERS];
						result = partner || { error: 'Partner not found' };
					} else if (operation === 'getGames') {
						const partnerId = this.getNodeParameter('partnerId', i) as string;
						const partner = PARTNERS[partnerId as keyof typeof PARTNERS];
						result = partner ? { games: partner.games ?? [] } : { error: 'Partner not found' };
					} else if (operation === 'getVerses') {
						const partnerId = this.getNodeParameter('partnerId', i) as string;
						const partner = PARTNERS[partnerId as keyof typeof PARTNERS];
						result = partner ? { verseId: partner.verseId } : { error: 'Partner not found' };
					}
				}

				// ==================== BLOCK RESOURCE ====================
				else if (resource === 'block') {
					const layer = this.getNodeParameter('layer', i) as string;
					const client = layer === 'hub' ? hubClient : verseClient;
					if (!client) throw new Error(`${layer} client not configured`);

					if (operation === 'get') {
						const blockId = this.getNodeParameter('blockId', i) as string;
						result = await client.getBlock(blockId.startsWith('0x') ? blockId : parseInt(blockId));
					} else if (operation === 'getLatest') {
						result = await client.getLatestBlock();
					} else if (operation === 'getTime') {
						const blockId = this.getNodeParameter('blockId', i) as string;
						const block = await client.getBlock(blockId.startsWith('0x') ? blockId : parseInt(blockId));
						result = block ? { timestamp: block.timestamp, date: new Date(block.timestamp * 1000).toISOString() } : null;
					}
				}

				// ==================== TRANSACTION RESOURCE ====================
				else if (resource === 'transaction') {
					const layer = this.getNodeParameter('layer', i) as string;
					const client = layer === 'hub' ? hubClient : verseClient;
					if (!client) throw new Error(`${layer} client not configured`);

					if (operation === 'get') {
						const txHash = this.getNodeParameter('txHash', i) as string;
						result = await client.getTransaction(txHash);
					} else if (operation === 'getReceipt') {
						const txHash = this.getNodeParameter('txHash', i) as string;
						result = await client.getTransactionReceipt(txHash);
					} else if (operation === 'getStatus') {
						const txHash = this.getNodeParameter('txHash', i) as string;
						const receipt = await client.getTransactionReceipt(txHash);
						result = {
							txHash,
							status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
							blockNumber: receipt?.blockNumber,
							gasUsed: receipt?.gasUsed?.toString(),
						};
					} else if (operation === 'send') {
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tx = await client.transfer(toAddress, oasToWei(amount));
						result = { txHash: tx.hash, to: toAddress, amount };
					} else if (operation === 'getGasPrice') {
						const gasPrice = await client.getGasPrice();
						result = { gasPrice: gasPrice.toString(), gasPriceGwei: formatGwei(gasPrice) };
					} else if (operation === 'estimateGas') {
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const gas = await client.estimateGas({ to: toAddress });
						result = { estimatedGas: gas.toString() };
					}
				}

				// ==================== TOKEN RESOURCE ====================
				else if (resource === 'token') {
					const client = isHub ? hubClient : verseClient;
					if (!client) throw new Error('Client not configured');

					if (operation === 'getInfo') {
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						result = await client.getTokenInfo(tokenAddress);
					} else if (operation === 'getBalance') {
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						const address = this.getNodeParameter('address', i) as string;
						const balance = await client.getTokenBalance(tokenAddress, address);
						const tokenInfo = await client.getTokenInfo(tokenAddress);
						result = {
							tokenAddress,
							address,
							balance: balance.toString(),
							symbol: tokenInfo.symbol,
							decimals: tokenInfo.decimals,
						};
					} else if (operation === 'transfer') {
						const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
						const toAddress = this.getNodeParameter('toAddress', i) as string;
						const amount = this.getNodeParameter('amount', i) as string;
						const tokenInfo = await client.getTokenInfo(tokenAddress);
						const amountInWei = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, tokenInfo.decimals)));
						const tx = await client.transferToken(tokenAddress, toAddress, amountInWei);
						result = { txHash: tx.hash, tokenAddress, to: toAddress, amount };
					}
				}

				// ==================== EVENTS RESOURCE ====================
				else if (resource === 'events') {
					const layer = this.getNodeParameter('layer', i) as string;
					const client = layer === 'hub' ? hubClient : verseClient;
					if (!client) throw new Error(`${layer} client not configured`);

					if (operation === 'get') {
						const contractAddress = this.getNodeParameter('contractAddress', i) as string;
						const abi = JSON.parse(this.getNodeParameter('abi', i) as string);
						const eventName = this.getNodeParameter('eventName', i) as string;
						const fromBlock = this.getNodeParameter('fromBlock', i) as number;
						const toBlock = this.getNodeParameter('toBlock', i) as string;
						const events = await client.getContractEvents(
							contractAddress,
							abi,
							eventName,
							fromBlock,
							toBlock === 'latest' ? 'latest' : parseInt(toBlock)
						);
						result = { events };
					}
				}

				// ==================== UTILITY RESOURCE ====================
				else if (resource === 'utility') {
					if (operation === 'convertUnits') {
						const value = this.getNodeParameter('value', i) as string;
						const fromUnit = this.getNodeParameter('fromUnit', i) as string;
						const toUnit = this.getNodeParameter('toUnit', i) as string;

						let valueInWei: bigint;
						if (fromUnit === 'wei') {
							valueInWei = BigInt(value);
						} else if (fromUnit === 'gwei') {
							valueInWei = BigInt(Math.floor(parseFloat(value) * 1e9));
						} else {
							valueInWei = oasToWei(value);
						}

						let converted: string;
						if (toUnit === 'wei') {
							converted = valueInWei.toString();
						} else if (toUnit === 'gwei') {
							converted = formatGwei(valueInWei);
						} else {
							converted = formatOas(valueInWei);
						}

						result = { original: value, fromUnit, toUnit, converted };
					} else if (operation === 'validateAddress') {
						const address = this.getNodeParameter('address', i) as string;
						const client = hubClient || verseClient;
						if (client) {
							const validation = client.validateAddress(address);
							result = { address, isValid: validation.isValid, checksumAddress: validation.checksumed };
						}
					} else if (operation === 'getChainId') {
						const client = hubClient || verseClient;
						if (client) {
							result = { chainId: client.getChainId() };
						}
					} else if (operation === 'getNetworkStatus') {
						const status: { hub?: unknown; verse?: unknown } = {};
						if (hubClient) {
							try {
								const blockNumber = await hubClient.getBlockNumber();
								status.hub = { connected: true, blockNumber };
							} catch {
								status.hub = { connected: false };
							}
						}
						if (verseClient) {
							status.verse = await verseClient.getStatus();
						}
						result = status;
					} else if (operation === 'signMessage') {
						const message = this.getNodeParameter('message', i) as string;
						const client = hubClient || verseClient;
						const wallet = client?.getWallet();
						if (!wallet) throw new Error('Wallet not configured');
						const signature = await wallet.signMessage(message);
						result = { message, signature };
					} else if (operation === 'verifySignature') {
						const message = this.getNodeParameter('message', i) as string;
						const signature = this.getNodeParameter('signature', i) as string;
						const { verifyMessage } = await import('ethers');
						const recoveredAddress = verifyMessage(message, signature);
						result = { message, signature, recoveredAddress };
					}
				}

				returnData.push({ json: result as INodeExecutionData['json'] });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
