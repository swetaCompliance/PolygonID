"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_sdk_1 = require("@0xpolygonid/js-sdk");
const walletSetup_1 = require("./walletSetup");
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
const request_1 = require("./request");
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
        credential,
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
async function generateProofs() {
    console.log("=============== generate proofs ===============");
    let { dataStorage, credentialWallet, identityWallet } = await (0, walletSetup_1.initInMemoryDataStorageAndWallets)();
    const circuitStorage = await (0, walletSetup_1.initCircuitStorage)();
    const proofService = await (0, walletSetup_1.initProofService)(identityWallet, credentialWallet, dataStorage.states, circuitStorage);
    const { did: userDID, credential: authBJJCredentialUser } = await createIdentity(identityWallet);
    console.log("=============== user did ===============");
    console.log(userDID.string());
    const { did: issuerDID, credential: issuerAuthBJJCredential } = await createIdentity(identityWallet);
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(issuerDID, credentialRequest);
    await dataStorage.credential.saveCredential(credential);
    console.log("================= generate Iden3SparseMerkleTreeProof =======================");
    const res = await identityWallet.addCredentialsToMerkleTree([credential], issuerDID);
    console.log("================= push states to rhs ===================");
    await identityWallet.publishStateToRHS(issuerDID, rhsUrl);
    console.log("================= publish to blockchain ===================");
    const ethSigner = new ethers_1.ethers.Wallet(walletKey, dataStorage.states.provider);
    const txId = await proofService.transitState(issuerDID, res.oldTreeState, true, dataStorage.states, ethSigner);
    console.log(txId);
    console.log("================= generate credentialAtomicSigV2 ===================");
    const proofReqSig = createKYCAgeCredentialRequest(js_sdk_1.CircuitId.AtomicQuerySigV2, credentialRequest);
    const { proof, pub_signals } = await proofService.generateProof(proofReqSig, userDID);
    const sigProofOk = await proofService.verifyProof({ proof, pub_signals }, js_sdk_1.CircuitId.AtomicQuerySigV2);
    console.log("valid: ", sigProofOk);
    console.log("================= generate credentialAtomicMTPV2 ===================");
    const credsWithIden3MTPProof = await identityWallet.generateIden3SparseMerkleTreeProof(issuerDID, res.credentials, txId);
    console.log(credsWithIden3MTPProof);
    credentialWallet.saveAll(credsWithIden3MTPProof);
    const proofReqMtp = createKYCAgeCredentialRequest(js_sdk_1.CircuitId.AtomicQueryMTPV2, credentialRequest);
    const { proof: proofMTP } = await proofService.generateProof(proofReqMtp, userDID);
    console.log(JSON.stringify(proofMTP));
    const mtpProofOk = await proofService.verifyProof({ proof, pub_signals }, js_sdk_1.CircuitId.AtomicQueryMTPV2);
    console.log("valid: ", mtpProofOk);
    const { proof: proof2, pub_signals: pub_signals2 } = await proofService.generateProof(proofReqSig, userDID);
    const sigProof2Ok = await proofService.verifyProof({ proof: proof2, pub_signals: pub_signals2 }, js_sdk_1.CircuitId.AtomicQuerySigV2);
    console.log("valid: ", sigProof2Ok);
}
async function main(choice) {
    switch (choice) {
        case "generateProofs":
            await generateProofs();
            break;
        case "generateRequestData":
            await (0, request_1.generateRequestData)();
            break;
        default:
            await generateProofs();
            await (0, request_1.generateRequestData)();
    }
}
(async function () {
    const args = process.argv.slice(2);
    await main(args[0]);
})();
//# sourceMappingURL=test.js.map