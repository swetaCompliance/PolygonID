"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetBalance = exports.existingSupply = exports.assets = exports.isWhiteListed = exports.transfer = exports.mint = exports.whitelist = exports.signTransaction = exports.createAsset = void 0;
const ethers_1 = require("ethers");
const abi_json_1 = __importDefault(require("./abi.json"));
require("dotenv").config();
const ethereumNodeUrl = 'https://rpc-mumbai.maticvigil.com';
const provider = new ethers_1.ethers.providers.JsonRpcProvider(ethereumNodeUrl);
const privateKey1 = `0x${process.env.privateKey}`;
const privateKey2 = `0x${process.env.privateKey2}`;
const wallet = new ethers_1.ethers.Wallet(privateKey1, provider);
const wallet2 = new ethers_1.ethers.Wallet(privateKey2, provider);
const contractAddress = '0x77b6849f32B3104E76EFa5A971ed94B23bb0204A';
const contractAbi = abi_json_1.default;
const contract = new ethers_1.ethers.Contract(contractAddress, contractAbi, wallet);
// const contract2 = new ethers.Contract(contractAddress, contractAbi, wallet2);
const createAsset = async (req, res) => {
    try {
        const { name, symbol, totalSupply, requiredSignatures, initialSigners } = req.body;
        const tx = await contract.createAsset(name, symbol, totalSupply, requiredSignatures, initialSigners);
        const receipt = await tx.wait();
        // Find the AssetCreated event in the transaction receipt logs
        const event = receipt.events.find((e) => e.event === 'createdAsset');
        if (!event) {
            throw new Error('Asset creation event not found');
        }
        const assetDetails = {
            uId: event.args.assetId.toNumber(),
            tokenAddress: event.args.tokenAddress,
            name: event.args.name,
            symbol: event.args.symbol,
            totalSupply: event.args.totalSupply.toNumber(),
            requiredSignatures: event.args.requiredSignatures.toNumber(),
            signers: event.args.initialSignatures,
        };
        res.status(200).json({ message: 'Asset created', assetDetails, transactionHash: tx.hash });
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating asset', message: error.message });
    }
};
exports.createAsset = createAsset;
const signTransaction = async (req, res) => {
    try {
        const assetId = req.params.assetId;
        const tx = await contract.signTransaction(assetId);
        await tx.wait();
        res.status(200).json({ message: 'Transaction signed', transactionHash: tx.hash });
    }
    catch (error) {
        res.status(500).json({ error: 'Error signing transaction', message: error.message });
    }
};
exports.signTransaction = signTransaction;
const whitelist = async (req, res) => {
    try {
        const assetId = req.params.assetId;
        const { addressToWhitelist } = req.body;
        const tx = await contract.whitelist(assetId, addressToWhitelist);
        await tx.wait();
        res.status(200).json({ message: 'Address whitelisted', transactionHash: tx.hash });
    }
    catch (error) {
        res.status(500).json({ error: 'Error whitelisting address', message: error.message });
    }
};
exports.whitelist = whitelist;
const mint = async (req, res) => {
    try {
        const assetId = req.params.assetId;
        const { toAddress, amount } = req.body;
        const tx = await contract.mint(assetId, toAddress, amount);
        await tx.wait();
        res.status(200).json({ message: 'Tokens minted', transactionHash: tx.hash });
    }
    catch (error) {
        res.status(500).json({ error: 'Error minting tokens', message: error.message });
    }
};
exports.mint = mint;
const transfer = async (req, res) => {
    try {
        const assetId = req.params.assetId;
        const { toAddress, amount } = req.body;
        const tx = await contract.transfer(assetId, toAddress, amount);
        await tx.wait();
        res.status(200).json({ message: 'Tokens transferred', transactionHash: tx.hash });
    }
    catch (error) {
        res.status(500).json({ error: 'Error transferring tokens', message: error.message });
    }
};
exports.transfer = transfer;
const isWhiteListed = async (req, res) => {
    try {
        const { assetId, address } = req.params;
        const isWhitelisted = await contract.isWhiteListed(assetId, address);
        res.status(200).json({ isWhitelisted });
    }
    catch (error) {
        res.status(500).json({ error: 'Error checking whitelist status', message: error.message });
    }
};
exports.isWhiteListed = isWhiteListed;
const assets = async (req, res) => {
    try {
        const { assetId } = req.params;
        const assets = await contract.getAssetDetails(assetId);
        const response = {
            uId: assets.id.toNumber(),
            tokenAddress: assets.tokenAddress,
            name: assets.name,
            symbol: assets.symbol,
            maxSupply: assets.maxSupply.toNumber(),
            requiredSignatures: assets.requiredSignatures,
            signers: assets.signers
        };
        res.status(200).json({ response });
    }
    catch (error) {
        res.status(500).json({ error: 'Error checking assets status', message: error.message });
    }
};
exports.assets = assets;
const existingSupply = async (req, res) => {
    try {
        const { assetId } = req.params;
        const existingSupply = await contract.existingSupply(assetId);
        const supply = existingSupply.toNumber();
        res.status(200).json({ "existingSupply": supply });
    }
    catch (error) {
        res.status(500).json({ error: 'Error checking assets status', message: error.message });
    }
};
exports.existingSupply = existingSupply;
const assetBalance = async (req, res) => {
    try {
        const { assetId, address } = req.params;
        const assetBalance = await contract.assetBalance(assetId, address);
        const balance = assetBalance.toNumber();
        res.status(200).json({ "assetBalance": balance });
    }
    catch (error) {
        res.status(500).json({ error: 'Error checking assets status', message: error.message });
    }
};
exports.assetBalance = assetBalance;
//# sourceMappingURL=assetController.js.map