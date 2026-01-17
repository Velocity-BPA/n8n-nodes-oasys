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
 * Oasys API Credentials
 * 
 * Used for accessing Oasys REST APIs, Explorer APIs, and other services.
 * These credentials provide access to:
 * - Block Explorer APIs
 * - Gaming APIs
 * - Partner APIs
 * - Statistics and Analytics
 */
export class OasysApi implements ICredentialType {
	name = 'oasysApi';
	displayName = 'Oasys API';
	documentationUrl = 'https://docs.oasys.games/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Hub Explorer API URL',
			name: 'hubExplorerUrl',
			type: 'string',
			default: 'https://explorer.oasys.games/api',
			description: 'Oasys Hub Block Explorer API endpoint',
		},
		{
			displayName: 'Hub Explorer API Key',
			name: 'hubExplorerApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for Hub Explorer (optional for basic queries)',
		},
		{
			displayName: 'Verse Explorer API URL',
			name: 'verseExplorerUrl',
			type: 'string',
			default: 'https://scan.oasys.games/api',
			description: 'Oasys Verse Block Explorer API endpoint',
		},
		{
			displayName: 'Verse Explorer API Key',
			name: 'verseExplorerApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for Verse Explorer (optional for basic queries)',
		},
		{
			displayName: 'Gaming API URL',
			name: 'gamingApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.game.oasys.games',
			description: 'Gaming platform API endpoint',
		},
		{
			displayName: 'Gaming API Key',
			name: 'gamingApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for Gaming platform access',
		},
		{
			displayName: 'Partner API URL',
			name: 'partnerApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://partner-api.oasys.games',
			description: 'Partner API endpoint for game studios',
		},
		{
			displayName: 'Partner API Key',
			name: 'partnerApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for Partner access',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.hubExplorerApiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.hubExplorerUrl}}',
			url: '?module=stats&action=tokensupply',
			method: 'GET',
		},
	};
}
