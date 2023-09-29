"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolygonId = exports.healthCheck = void 0;
//import abi from "./abi.json";
const js_sdk_1 = require("@0xpolygonid/js-sdk");
const walletSetup_1 = require("./walletSetup");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rhsUrl = process.env.RHS_URL;
const walletKey = process.env.WALLET_KEY;
async function createIdentity(identityWallet) {
    const { did, credential } = await identityWallet.createIdentity({
        method: js_sdk_1.core.DidMethod.Iden3,
        blockchain: js_sdk_1.core.Blockchain.Polygon,
        networkId: js_sdk_1.core.NetworkId.Mumbai,
        revocationOpts: {
            type: js_sdk_1.CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
            id: rhsUrl,
        },
    });
    return {
        did,
        credential
    };
}
const healthCheck = async (req, res) => {
    try {
        console.log("=============== key creation ===============");
        res.status(200).json({ message: 'working' });
    }
    catch (error) {
        let errorMessage = "Failed to do something exceptional";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ error: 'Error signing transaction', message: errorMessage });
    }
};
exports.healthCheck = healthCheck;
const createPolygonId = async (req, res) => {
    try {
        console.log("=============== key creation ===============");
        let { identityWallet } = await (0, walletSetup_1.initInMemoryDataStorageAndWallets)();
        const { did, credential } = await createIdentity(identityWallet);
        console.log("=============== did ===============");
        console.log(did.string());
        console.log("=============== Auth BJJ credential ===============");
        console.log(JSON.stringify(credential));
        res.status(200).json({ message: 'Polygon ID Created', PolygonId: did.toString() });
    }
    catch (error) {
        let errorMessage = "Failed to do something exceptional";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ error: 'Error signing transaction', message: errorMessage });
    }
};
exports.createPolygonId = createPolygonId;
//# sourceMappingURL=polyController.js.map