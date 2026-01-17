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
 * Verse Credentials
 * 
 * Dedicated credentials for connecting to specific Oasys Verses (Layer 2 chains).
 * Each Verse is a gaming-optimized rollup with:
 * - Gasless transactions for users
 * - Fast finality
 * - Game-specific customizations
 */
export class VerseCredentials implements ICredentialType {
	name = 'verseCredentials';
	displayName = 'Oasys Verse Credentials';
	documentationUrl = 'https://docs.oasys.games/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Verse ID',
			name: 'verseId',
			type: 'string',
			default: '',
			placeholder: 'home-verse',
			description: 'Unique identifier for the Verse',
		},
		{
			displayName: 'Verse Name',
			name: 'verseName',
			type: 'string',
			default: '',
			placeholder: 'HOME Verse',
			description: 'Human-readable name of the Verse',
		},
		{
			displayName: 'Verse RPC URL',
			name: 'verseRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://rpc.mainnet.oasys.homeverse.games',
			description: 'RPC endpoint for the Verse',
		},
		{
			displayName: 'Verse Chain ID',
			name: 'verseChainId',
			type: 'number',
			default: 19011,
			description: 'Chain ID of the Verse',
		},
		{
			displayName: 'Verse WebSocket URL',
			name: 'verseWsUrl',
			type: 'string',
			default: '',
			placeholder: 'wss://ws.mainnet.oasys.homeverse.games',
			description: 'WebSocket URL for real-time subscriptions',
		},
		{
			displayName: 'Verse Explorer URL',
			name: 'verseExplorerUrl',
			type: 'string',
			default: '',
			placeholder: 'https://scan.oasys.homeverse.games',
			description: 'Block explorer URL for the Verse',
		},
		{
			displayName: 'Verse Explorer API URL',
			name: 'verseExplorerApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://scan.oasys.homeverse.games/api',
			description: 'Block explorer API endpoint',
		},
		{
			displayName: 'Verse API Key',
			name: 'verseApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for Verse-specific services',
		},
		{
			displayName: 'Bridge Contract Address',
			name: 'bridgeContractAddress',
			type: 'string',
			default: '',
			placeholder: '0x...',
			description: 'L1-L2 Bridge contract address for this Verse',
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
			displayName: 'Is Gasless',
			name: 'isGasless',
			type: 'boolean',
			default: true,
			description: 'Whether this Verse supports gasless transactions',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.verseRpcUrl}}',
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
