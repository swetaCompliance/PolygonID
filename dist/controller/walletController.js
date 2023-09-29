"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWallet = void 0;
const ethers_1 = require("ethers");
const generateWallet = (req, res) => {
    try {
        const wallet = ethers_1.ethers.Wallet.createRandom();
        const response = {
            address: wallet.address,
            privateKey: wallet.privateKey,
        };
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ error: 'Error generating wallet', message: error.message });
    }
};
exports.generateWallet = generateWallet;
//# sourceMappingURL=walletController.js.map