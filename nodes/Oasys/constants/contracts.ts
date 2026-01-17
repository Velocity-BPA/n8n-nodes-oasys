/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */
/**
 * Oasys Smart Contract Addresses and ABIs
 * 
 * Contains addresses for system contracts on Hub and Verses
 */

/**
 * Hub (Layer 1) System Contracts
 */
export const HUB_CONTRACTS = {
	// Staking and Validator contracts
	stakeManager: '0x0000000000000000000000000000000000001001',
	environment: '0x0000000000000000000000000000000000001000',
	allowList: '0x0000000000000000000000000000000000001002',
	
	// Bridge contracts (Hub side)
	l1StandardBridge: '0x5200000000000000000000000000000000000007',
	l1CrossDomainMessenger: '0x5200000000000000000000000000000000000001',
	
	// Token contracts
	wrappedOAS: '0x5200000000000000000000000000000000000001', // WOAS
};

/**
 * Verse (Layer 2) System Contracts
 */
export const VERSE_CONTRACTS = {
	// Bridge contracts (Verse side)
	l2StandardBridge: '0x4200000000000000000000000000000000000010',
	l2CrossDomainMessenger: '0x4200000000000000000000000000000000000007',
	
	// System contracts
	gasPriceOracle: '0x420000000000000000000000000000000000000F',
	l2ToL1MessagePasser: '0x4200000000000000000000000000000000000016',
	
	// Token contracts
	wrappedOAS: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', // WOAS on Verse
};

/**
 * Common token addresses (varies by chain)
 */
export const TOKEN_ADDRESSES = {
	hub: {
		WOAS: '0x5200000000000000000000000000000000000001',
		USDT: '0x0000000000000000000000000000000000000000', // Not deployed
		USDC: '0x0000000000000000000000000000000000000000', // Not deployed
	},
	verse: {
		WOAS: '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000',
	},
};

/**
 * ERC20 Standard ABI (common functions)
 */
export const ERC20_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address owner) view returns (uint256)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function allowance(address owner, address spender) view returns (uint256)',
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * ERC721 Standard ABI (NFT)
 */
export const ERC721_ABI = [
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function balanceOf(address owner) view returns (uint256)',
	'function ownerOf(uint256 tokenId) view returns (address)',
	'function safeTransferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function approve(address to, uint256 tokenId)',
	'function setApprovalForAll(address operator, bool approved)',
	'function getApproved(uint256 tokenId) view returns (address)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
	'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
	'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

/**
 * ERC1155 Standard ABI (Multi-token)
 */
export const ERC1155_ABI = [
	'function uri(uint256 id) view returns (string)',
	'function balanceOf(address account, uint256 id) view returns (uint256)',
	'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
	'function setApprovalForAll(address operator, bool approved)',
	'function isApprovedForAll(address account, address operator) view returns (bool)',
	'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
	'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
	'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
	'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
	'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
];

/**
 * Oasys Stake Manager ABI
 */
export const STAKE_MANAGER_ABI = [
	'function getValidators() view returns (address[])',
	'function getValidatorInfo(address validator) view returns (tuple(address operator, uint256 stakes, uint256 commissionRate, uint256 status))',
	'function getTotalStake() view returns (uint256)',
	'function stake(address validator) payable',
	'function unstake(address validator, uint256 amount)',
	'function claimRewards(address validator)',
	'function getRewards(address delegator, address validator) view returns (uint256)',
	'function getDelegation(address delegator, address validator) view returns (uint256)',
	'function getCurrentEpoch() view returns (uint256)',
	'function getEpochInfo(uint256 epoch) view returns (tuple(uint256 startBlock, uint256 endBlock, uint256 rewards))',
	'event Staked(address indexed delegator, address indexed validator, uint256 amount)',
	'event Unstaked(address indexed delegator, address indexed validator, uint256 amount)',
	'event RewardsClaimed(address indexed delegator, address indexed validator, uint256 amount)',
];

/**
 * L1 Standard Bridge ABI
 */
export const L1_BRIDGE_ABI = [
	'function depositETH(uint32 _minGasLimit, bytes _extraData) payable',
	'function depositETHTo(address _to, uint32 _minGasLimit, bytes _extraData) payable',
	'function depositERC20(address _l1Token, address _l2Token, uint256 _amount, uint32 _minGasLimit, bytes _extraData)',
	'function depositERC20To(address _l1Token, address _l2Token, address _to, uint256 _amount, uint32 _minGasLimit, bytes _extraData)',
	'function finalizeETHWithdrawal(address _from, address _to, uint256 _amount, bytes _extraData)',
	'function finalizeERC20Withdrawal(address _l1Token, address _l2Token, address _from, address _to, uint256 _amount, bytes _extraData)',
	'event ETHDepositInitiated(address indexed _from, address indexed _to, uint256 _amount, bytes _extraData)',
	'event ERC20DepositInitiated(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _extraData)',
	'event ETHWithdrawalFinalized(address indexed _from, address indexed _to, uint256 _amount, bytes _extraData)',
	'event ERC20WithdrawalFinalized(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _extraData)',
];

/**
 * L2 Standard Bridge ABI
 */
export const L2_BRIDGE_ABI = [
	'function withdraw(address _l2Token, uint256 _amount, uint32 _minGasLimit, bytes _extraData)',
	'function withdrawTo(address _l2Token, address _to, uint256 _amount, uint32 _minGasLimit, bytes _extraData)',
	'function finalizeDeposit(address _l1Token, address _l2Token, address _from, address _to, uint256 _amount, bytes _extraData)',
	'event WithdrawalInitiated(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _extraData)',
	'event DepositFinalized(address indexed _l1Token, address indexed _l2Token, address indexed _from, address _to, uint256 _amount, bytes _extraData)',
];

/**
 * Gas Price Oracle ABI (Verse)
 */
export const GAS_PRICE_ORACLE_ABI = [
	'function gasPrice() view returns (uint256)',
	'function baseFee() view returns (uint256)',
	'function overhead() view returns (uint256)',
	'function scalar() view returns (uint256)',
	'function l1BaseFee() view returns (uint256)',
	'function decimals() view returns (uint256)',
	'function getL1Fee(bytes _data) view returns (uint256)',
	'function getL1GasUsed(bytes _data) view returns (uint256)',
];
