"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgeCreadential = exports.createPolygonId = exports.healthCheck = void 0;
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
function createKYCAgeCredential(did) {
    const credentialRequest = {
        credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json",
        type: "KYCAgeCredential",
        credentialSubject: {
            id: did.string(),
            birthday: 19960424,
            documentType: 99,
        },
        expiration: 12345678888,
        revocationOpts: {
            type: js_sdk_1.CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
            id: rhsUrl,
        },
    };
    return credentialRequest;
}
function createKYCAgeCredentialRequest(circuitId, credentialRequest) {
    const proofReqSig = {
        id: 1,
        circuitId: js_sdk_1.CircuitId.AtomicQuerySigV2,
        optional: false,
        query: {
            allowedIssuers: ["*"],
            type: credentialRequest.type,
            context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
            credentialSubject: {
                documentType: {
                    $eq: 99,
                },
            },
        },
    };
    const proofReqMtp = {
        id: 1,
        circuitId: js_sdk_1.CircuitId.AtomicQueryMTPV2,
        optional: false,
        query: {
            allowedIssuers: ["*"],
            type: credentialRequest.type,
            context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
            credentialSubject: {
                birthday: {
                    $lt: 20020101,
                },
            },
        },
    };
    switch (circuitId) {
        case js_sdk_1.CircuitId.AtomicQuerySigV2:
            return proofReqSig;
        case js_sdk_1.CircuitId.AtomicQueryMTPV2:
            return proofReqMtp;
        default:
            return proofReqSig;
    }
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
        res.status(200).json({ message: 'Polygon ID Created', PolygonId: did.id });
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
const createAgeCreadential = async (req, res) => {
    try {
        //const userDID = req.body.userId;
        let { dataStorage, identityWallet } = await (0, walletSetup_1.initInMemoryDataStorageAndWallets)();
        const { did: userDID, credential: authBJJCredentialUser } = await createIdentity(identityWallet);
        console.log("=============== user did ===============");
        console.log(userDID.string());
        const { did: issuerDID, credential: issuerAuthBJJCredential } = await createIdentity(identityWallet);
        const credentialRequest = createKYCAgeCredential(userDID);
        const credential = await identityWallet.issueCredential(issuerDID, credentialRequest);
        console.log("===============  credential ===============");
        console.log(JSON.stringify(credential));
        await dataStorage.credential.saveCredential(credential);
        res.status(200).json({
            message: 'Age creadential issued',
            AgeCredential: credential.id,
            issuerId: issuerDID.id
        });
    }
    catch (error) {
        let errorMessage = "Failed to do something exceptional";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ error: 'Error signing transaction', message: errorMessage });
    }
};
exports.createAgeCreadential = createAgeCreadential;
//# sourceMappingURL=polyController.js.map