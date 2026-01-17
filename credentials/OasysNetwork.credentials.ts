/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Oasys Network Credentials
 * 
 * Oasys uses a two-layer architecture:
 * - Hub (Layer 1): The main PoS chain for security and staking
 * - Verse (Layer 2): Gaming-optimized rollup chains with gasless transactions
 * 
 * This credential supports connecting to both layers and their testnets.
 */
export class OasysNetwork implements ICredentialType {
	name = 'oasysNetwork';
	displayName = 'Oasys Network';
	documentationUrl = 'https://docs.oasys.games/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Layer',
			name: 'layer',
			type: 'options',
			options: [
				{
					name: 'Hub Mainnet (Layer 1)',
					value: 'hubMainnet',
					description: 'Oasys Hub Mainnet - Main PoS chain for staking and security',
				},
				{
					name: 'Verse (Layer 2)',
					value: 'verse',
					description: 'Oasys Verse - Gaming-optimized L2 chains',
				},
				{
					name: 'Hub Testnet',
					value: 'hubTestnet',
					description: 'Oasys Hub Testnet for development',
				},
				{
					name: 'Custom Endpoint',
					value: 'custom',
					description: 'Use a custom RPC endpoint',
				},
			],
			default: 'hubMainnet',
			description: 'Select the Oasys layer to connect to',
		},
		{
			displayName: 'Verse',
			name: 'verse',
			type: 'options',
			options: [
				{
					name: 'HOME Verse',
					value: 'homeVerse',
					description: 'Official Oasys HOME Verse',
				},
				{
					name: 'MCH Verse',
					value: 'mchVerse',
					description: 'My Crypto Heroes Verse',
				},
				{
					name: 'TCG Verse',
					value: 'tcgVerse',
					description: 'TCG Verse for card games',
				},
				{
					name: 'DEFI Verse',
					value: 'defiVerse',
					description: 'DeFi Verse',
				},
				{
					name: 'Saakuru Verse',
					value: 'saakuruVerse',
					description: 'Saakuru Verse',
				},
				{
					name: 'Chain Verse',
					value: 'chainVerse',
					description: 'Chain Verse',
				},
				{
					name: 'Yooldo Verse',
					value: 'yooldoVerse',
					description: 'Yooldo Verse',
				},
				{
					name: 'GEEK Verse',
					value: 'geekVerse',
					description: 'GEEK Verse',
				},
				{
					name: 'Custom Verse',
					value: 'customVerse',
					description: 'Connect to a custom Verse',
				},
			],
			default: 'homeVerse',
			displayOptions: {
				show: {
					layer: ['verse'],
				},
			},
			description: 'Select the Verse to connect to',
		},
		{
			displayName: 'Custom Verse RPC URL',
			name: 'customVerseRpcUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					layer: ['verse'],
					verse: ['customVerse'],
				},
			},
			placeholder: 'https://rpc.custom-verse.oasys.games',
			description: 'RPC URL for custom Verse',
		},
		{
			displayName: 'Custom Verse Chain ID',
			name: 'customVerseChainId',
			type: 'number',
			default: 0,
			displayOptions: {
				show: {
					layer: ['verse'],
					verse: ['customVerse'],
				},
			},
			description: 'Chain ID for custom Verse',
		},
		{
			displayName: 'Custom RPC URL',
			name: 'customRpcUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					layer: ['custom'],
				},
			},
			placeholder: 'https://rpc.mainnet.oasys.games',
			description: 'Custom RPC endpoint URL',
		},
		{
			displayName: 'Custom Chain ID',
			name: 'customChainId',
			type: 'number',
			default: 248,
			displayOptions: {
				show: {
					layer: ['custom'],
				},
			},
			description: 'Chain ID for custom endpoint',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: '0x...',
			description: 'Private key for signing transactions (never shared or logged)',
		},
		{
			displayName: 'WebSocket URL (Optional)',
			name: 'wsUrl',
			type: 'string',
			default: '',
			placeholder: 'wss://ws.mainnet.oasys.games',
			description: 'WebSocket URL for real-time subscriptions',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.layer === "hub" ? "https://rpc.mainnet.oasys.games" : $credentials.layer === "hubTestnet" ? "https://rpc.testnet.oasys.games" : $credentials.customRpcUrl || "https://rpc.mainnet.oasys.games"}}',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			}),
		},
	};
}
