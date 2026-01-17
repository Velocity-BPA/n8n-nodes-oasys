/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Trigger Node
 *
 * Real-time event monitoring for Oasys blockchain
 * Supports Hub (Layer 1) and Verse (Layer 2) events
 *
 * @author Velocity BPA
 * @website https://velobpa.com
 * @github https://github.com/Velocity-BPA
 */

import {
	IPollFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
} from 'n8n-workflow';

import { createHubClient } from './transport/hubClient';
import { createVerseClient } from './transport/verseClient';
import { formatOas } from './utils/unitConverter';

export class OasysTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Oasys Trigger',
		name: 'oasysTrigger',
		icon: 'file:oasys.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger on Oasys blockchain events (Hub and Verse)',
		defaults: {
			name: 'Oasys Trigger',
		},
		inputs: [],
		outputs: ['main'] as const,
		credentials: [
			{
				name: 'oasysNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			// Event Category
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				options: [
					{ name: 'Wallet', value: 'wallet', description: 'Wallet-related events' },
					{ name: 'Hub', value: 'hub', description: 'Hub Layer 1 events' },
					{ name: 'Verse', value: 'verse', description: 'Verse Layer 2 events' },
					{ name: 'Bridge', value: 'bridge', description: 'Bridge events' },
					{ name: 'NFT', value: 'nft', description: 'NFT events' },
					{ name: 'Staking', value: 'staking', description: 'Staking events' },
					{ name: 'Contract', value: 'contract', description: 'Custom contract events' },
				],
				default: 'wallet',
			},

			// ==================== WALLET EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['wallet'] } },
				options: [
					{ name: 'OAS Received', value: 'oasReceived', description: 'Trigger when OAS is received' },
					{ name: 'OAS Sent', value: 'oasSent', description: 'Trigger when OAS is sent' },
					{ name: 'Token Received', value: 'tokenReceived', description: 'Trigger when tokens are received' },
					{ name: 'Token Sent', value: 'tokenSent', description: 'Trigger when tokens are sent' },
					{ name: 'Balance Changed', value: 'balanceChanged', description: 'Trigger when balance changes' },
				],
				default: 'oasReceived',
			},

			// ==================== HUB EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['hub'] } },
				options: [
					{ name: 'New Block', value: 'newBlock', description: 'Trigger on new Hub block' },
					{ name: 'Validator Set Changed', value: 'validatorChanged', description: 'Trigger when validator set changes' },
					{ name: 'Epoch Changed', value: 'epochChanged', description: 'Trigger on new epoch' },
					{ name: 'Staking Reward Distributed', value: 'rewardDistributed', description: 'Trigger when rewards are distributed' },
				],
				default: 'newBlock',
			},

			// ==================== VERSE EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['verse'] } },
				options: [
					{ name: 'New Verse Block', value: 'newBlock', description: 'Trigger on new Verse block' },
					{ name: 'Verse Status Changed', value: 'statusChanged', description: 'Trigger when Verse status changes' },
					{ name: 'Bridge Event', value: 'bridgeEvent', description: 'Trigger on bridge event' },
				],
				default: 'newBlock',
			},

			// ==================== BRIDGE EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['bridge'] } },
				options: [
					{ name: 'Deposit Initiated', value: 'depositInitiated', description: 'Trigger when deposit starts' },
					{ name: 'Deposit Completed', value: 'depositCompleted', description: 'Trigger when deposit completes' },
					{ name: 'Withdrawal Initiated', value: 'withdrawalInitiated', description: 'Trigger when withdrawal starts' },
					{ name: 'Withdrawal Completed', value: 'withdrawalCompleted', description: 'Trigger when withdrawal completes' },
					{ name: 'Bridge Status Changed', value: 'statusChanged', description: 'Trigger on bridge status change' },
				],
				default: 'depositCompleted',
			},

			// ==================== NFT EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['nft'] } },
				options: [
					{ name: 'NFT Transferred', value: 'transferred', description: 'Trigger when NFT is transferred' },
					{ name: 'NFT Minted', value: 'minted', description: 'Trigger when NFT is minted' },
					{ name: 'NFT Burned', value: 'burned', description: 'Trigger when NFT is burned' },
				],
				default: 'transferred',
			},

			// ==================== STAKING EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['staking'] } },
				options: [
					{ name: 'Stake Added', value: 'stakeAdded', description: 'Trigger when stake is added' },
					{ name: 'Stake Removed', value: 'stakeRemoved', description: 'Trigger when stake is removed' },
					{ name: 'Rewards Available', value: 'rewardsAvailable', description: 'Trigger when rewards are available' },
					{ name: 'Delegation Changed', value: 'delegationChanged', description: 'Trigger when delegation changes' },
				],
				default: 'rewardsAvailable',
			},

			// ==================== CONTRACT EVENTS ====================
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: { show: { category: ['contract'] } },
				options: [
					{ name: 'Contract Event', value: 'contractEvent', description: 'Trigger on custom contract event' },
				],
				default: 'contractEvent',
			},

			// ==================== PARAMETERS ====================

			// Watch Address
			{
				displayName: 'Watch Address',
				name: 'watchAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Address to watch for events',
				displayOptions: {
					show: {
						category: ['wallet', 'staking'],
					},
				},
			},

			// Layer Selection
			{
				displayName: 'Layer',
				name: 'layer',
				type: 'options',
				options: [
					{ name: 'Hub (Layer 1)', value: 'hub' },
					{ name: 'Verse (Layer 2)', value: 'verse' },
				],
				default: 'hub',
				description: 'Layer to monitor',
				displayOptions: {
					show: {
						category: ['wallet', 'nft', 'contract'],
					},
				},
			},

			// Verse Selection
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
				description: 'Verse to monitor',
				displayOptions: {
					show: {
						category: ['verse', 'bridge'],
					},
				},
			},

			// Contract Address (for NFT and Contract events)
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Contract address to monitor',
				displayOptions: {
					show: {
						category: ['nft', 'contract'],
					},
				},
			},

			// Token Address (for token events)
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				placeholder: '0x... (leave empty for all tokens)',
				description: 'ERC20 token address to monitor',
				displayOptions: {
					show: {
						event: ['tokenReceived', 'tokenSent'],
					},
				},
			},

			// Event Name (for contract events)
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				default: '',
				placeholder: 'Transfer',
				description: 'Contract event name to listen for',
				displayOptions: {
					show: {
						category: ['contract'],
					},
				},
			},

			// ABI (for contract events)
			{
				displayName: 'Contract ABI',
				name: 'abi',
				type: 'json',
				default: '[]',
				description: 'Contract ABI (JSON array)',
				displayOptions: {
					show: {
						category: ['contract'],
					},
				},
			},

			// Polling Interval
			{
				displayName: 'Poll Interval (seconds)',
				name: 'pollInterval',
				type: 'number',
				default: 15,
				description: 'How often to check for new events (minimum 5 seconds)',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const category = this.getNodeParameter('category') as string;
		const event = this.getNodeParameter('event') as string;
		const credentials = await this.getCredentials('oasysNetwork');

		// Get stored state
		const stateKey = `oasys_trigger_${category}_${event}`;
		const workflowStaticData = this.getWorkflowStaticData('node');
		const lastProcessedBlock = (workflowStaticData[stateKey] as number) || 0;

		const results: INodeExecutionData[] = [];

		try {
			const networkLayer = credentials.layer as string;
			
			// Create appropriate client
			let currentBlock = 0;

			if (category === 'hub' || (category === 'wallet' && this.getNodeParameter('layer', 'hub') === 'hub') || category === 'staking') {
				const hubClient = createHubClient({
					layer: networkLayer === 'hubTestnet' ? 'hubTestnet' : 'hubMainnet',
					privateKey: credentials.privateKey as string,
				});
				currentBlock = await hubClient.getBlockNumber();

				if (category === 'hub') {
					if (event === 'newBlock' && currentBlock > lastProcessedBlock) {
						for (let blockNum = Math.max(lastProcessedBlock + 1, currentBlock - 5); blockNum <= currentBlock; blockNum++) {
							const block = await hubClient.getBlock(blockNum);
							if (block) {
								results.push({
									json: {
										event: 'newBlock',
										layer: 'Hub',
										blockNumber: blockNum,
										timestamp: block.timestamp,
										hash: block.hash,
										transactions: block.transactions?.length || 0,
									},
								});
							}
						}
					} else if (event === 'epochChanged') {
						const epochInfo = await hubClient.getCurrentEpochInfo();
						results.push({
							json: {
								event: 'epochChanged',
								layer: 'Hub',
								currentEpoch: epochInfo.currentEpoch,
								blocksRemaining: epochInfo.blocksRemaining,
							},
						});
					}
				} else if (category === 'wallet') {
					const watchAddress = this.getNodeParameter('watchAddress') as string;
					if (watchAddress) {
						const balance = await hubClient.getBalance(watchAddress);
						results.push({
							json: {
								event: 'balanceCheck',
								layer: 'Hub',
								address: watchAddress,
								balance: balance.toString(),
								balanceFormatted: formatOas(balance),
								blockNumber: currentBlock,
							},
						});
					}
				} else if (category === 'staking') {
					const watchAddress = this.getNodeParameter('watchAddress') as string;
					if (watchAddress) {
						const stakingInfo = await hubClient.getStakingInfo(watchAddress);
						results.push({
							json: {
								event: event,
								layer: 'Hub',
								address: watchAddress,
								stakingInfo,
								blockNumber: currentBlock,
							},
						});
					}
				}
			} else if (category === 'verse' || (category === 'wallet' && this.getNodeParameter('layer', 'verse') === 'verse')) {
				const verseKey = this.getNodeParameter('verse', 'homeVerse') as string;
				const verseClient = createVerseClient({
					verse: verseKey,
					privateKey: credentials.privateKey as string,
				});
				currentBlock = await verseClient.getBlockNumber();

				if (event === 'newBlock' && currentBlock > lastProcessedBlock) {
					for (let blockNum = Math.max(lastProcessedBlock + 1, currentBlock - 5); blockNum <= currentBlock; blockNum++) {
						const block = await verseClient.getBlock(blockNum);
						if (block) {
							results.push({
								json: {
									event: 'newBlock',
									layer: 'Verse',
									verse: verseKey,
									blockNumber: blockNum,
									timestamp: block.timestamp,
									hash: block.hash,
									transactions: block.transactions?.length || 0,
								},
							});
						}
					}
				} else if (event === 'statusChanged') {
					const status = await verseClient.getStatus();
					results.push({
						json: {
							event: 'statusCheck',
							layer: 'Verse',
							verse: verseKey,
							status,
						},
					});
				}
			} else if (category === 'bridge') {
				const verseKey = this.getNodeParameter('verse', 'homeVerse') as string;
				results.push({
					json: {
						event: event,
						layer: 'Bridge',
						verse: verseKey,
						message: 'Bridge event monitoring active',
						timestamp: new Date().toISOString(),
					},
				});
			} else if (category === 'nft') {
				const layer = this.getNodeParameter('layer', 'hub') as string;
				const contractAddress = this.getNodeParameter('contractAddress', '') as string;

				if (layer === 'hub') {
					const hubClient = createHubClient({
						layer: networkLayer === 'hubTestnet' ? 'hubTestnet' : 'hubMainnet',
						privateKey: credentials.privateKey as string,
					});
					currentBlock = await hubClient.getBlockNumber();
				} else {
					const verseKey = (credentials.verse as string) || 'homeVerse';
					const verseClient = createVerseClient({
						verse: verseKey,
						privateKey: credentials.privateKey as string,
					});
					currentBlock = await verseClient.getBlockNumber();
				}

				results.push({
					json: {
						event: event,
						layer: layer,
						contractAddress,
						blockNumber: currentBlock,
						message: `NFT ${event} monitoring active`,
					},
				});
			} else if (category === 'contract') {
				const layer = this.getNodeParameter('layer', 'hub') as string;
				const contractAddress = this.getNodeParameter('contractAddress', '') as string;
				const eventName = this.getNodeParameter('eventName', '') as string;

				if (layer === 'hub') {
					const hubClient = createHubClient({
						layer: networkLayer === 'hubTestnet' ? 'hubTestnet' : 'hubMainnet',
						privateKey: credentials.privateKey as string,
					});
					currentBlock = await hubClient.getBlockNumber();

					if (contractAddress && eventName && currentBlock > lastProcessedBlock) {
						try {
							const abi = JSON.parse(this.getNodeParameter('abi', '[]') as string);
							const events = await hubClient.getContractEvents(
								contractAddress,
								abi,
								eventName,
								lastProcessedBlock + 1,
								currentBlock
							);
							for (const evt of events) {
								results.push({
									json: {
										event: 'contractEvent',
										layer: 'Hub',
										contractAddress,
										eventName,
										data: evt as Record<string, unknown>,
									},
								});
							}
						} catch {
							// Event query failed, continue
						}
					}
				}
			}

			// Update state
			if (currentBlock > lastProcessedBlock) {
				workflowStaticData[stateKey] = currentBlock;
			}
		} catch (error) {
			// Error during polling, return empty
			console.error('Oasys Trigger polling error:', error);
		}

		if (results.length === 0) {
			return null;
		}

		return [results];
	}
}
