"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPackageManager = exports.initProofService = exports.initCircuitStorage = exports.initCredentialWallet = exports.initInMemoryDataStorageAndWallets = exports.initIdentityWallet = exports.initDataStorage = void 0;
const getCurveFromName = require("ffjavascript").getCurveFromName;
const js_jwz_1 = require("@iden3/js-jwz");
const js_sdk_1 = require("@0xpolygonid/js-sdk");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rpcUrl = process.env.RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const circuitsFolder = process.env.CIRCUITS_PATH;
function initDataStorage() {
    let conf = js_sdk_1.defaultEthConnectionConfig;
    conf.contractAddress = contractAddress;
    conf.url = rpcUrl;
    var dataStorage = {
        credential: new js_sdk_1.CredentialStorage(new js_sdk_1.InMemoryDataSource()),
        identity: new js_sdk_1.IdentityStorage(new js_sdk_1.InMemoryDataSource(), new js_sdk_1.InMemoryDataSource()),
        mt: new js_sdk_1.InMemoryMerkleTreeStorage(40),
        states: new js_sdk_1.EthStateStorage(js_sdk_1.defaultEthConnectionConfig),
    };
    return dataStorage;
}
exports.initDataStorage = initDataStorage;
async function initIdentityWallet(dataStorage, credentialWallet) {
    const memoryKeyStore = new js_sdk_1.InMemoryPrivateKeyStore();
    const bjjProvider = new js_sdk_1.BjjProvider(js_sdk_1.KmsKeyType.BabyJubJub, memoryKeyStore);
    const kms = new js_sdk_1.KMS();
    kms.registerKeyProvider(js_sdk_1.KmsKeyType.BabyJubJub, bjjProvider);
    return new js_sdk_1.IdentityWallet(kms, dataStorage, credentialWallet);
}
exports.initIdentityWallet = initIdentityWallet;
async function initInMemoryDataStorageAndWallets() {
    const dataStorage = initDataStorage();
    const credentialWallet = await initCredentialWallet(dataStorage);
    const identityWallet = await initIdentityWallet(dataStorage, credentialWallet);
    return {
        dataStorage,
        credentialWallet,
        identityWallet,
    };
}
exports.initInMemoryDataStorageAndWallets = initInMemoryDataStorageAndWallets;
async function initCredentialWallet(dataStorage) {
    const resolvers = new js_sdk_1.CredentialStatusResolverRegistry();
    resolvers.register(js_sdk_1.CredentialStatusType.SparseMerkleTreeProof, new js_sdk_1.IssuerResolver());
    resolvers.register(js_sdk_1.CredentialStatusType.Iden3ReverseSparseMerkleTreeProof, new js_sdk_1.RHSResolver(dataStorage.states));
    resolvers.register(js_sdk_1.CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023, new js_sdk_1.OnChainResolver([js_sdk_1.defaultEthConnectionConfig]));
    resolvers.register(js_sdk_1.CredentialStatusType.Iden3commRevocationStatusV1, new js_sdk_1.AgentResolver());
    return new js_sdk_1.CredentialWallet(dataStorage, resolvers);
}
exports.initCredentialWallet = initCredentialWallet;
async function initCircuitStorage() {
    return new js_sdk_1.FSCircuitStorage({ dirname: path_1.default.join(__dirname, circuitsFolder) });
}
exports.initCircuitStorage = initCircuitStorage;
async function initProofService(identityWallet, credentialWallet, stateStorage, circuitStorage) {
    return new js_sdk_1.ProofService(identityWallet, credentialWallet, circuitStorage, stateStorage, { ipfsGatewayURL: "https://ipfs.io" });
}
exports.initProofService = initProofService;
async function initPackageManager(circuitData, prepareFn, stateVerificationFn) {
    const authInputsHandler = new js_sdk_1.DataPrepareHandlerFunc(prepareFn);
    const verificationFn = new js_sdk_1.VerificationHandlerFunc(stateVerificationFn);
    const mapKey = js_jwz_1.proving.provingMethodGroth16AuthV2Instance.methodAlg.toString();
    const verificationParamMap = new Map([
        [
            mapKey,
            {
                key: circuitData.verificationKey,
                verificationFn,
            },
        ],
    ]);
    const provingParamMap = new Map();
    provingParamMap.set(mapKey, {
        dataPreparer: authInputsHandler,
        provingKey: circuitData.provingKey,
        wasm: circuitData.wasm,
    });
    const mgr = new js_sdk_1.PackageManager();
    const packer = new js_sdk_1.ZKPPacker(provingParamMap, verificationParamMap);
    const plainPacker = new js_sdk_1.PlainPacker();
    mgr.registerPackers([packer, plainPacker]);
    return mgr;
}
exports.initPackageManager = initPackageManager;
//# sourceMappingURL=walletSetup.js.map