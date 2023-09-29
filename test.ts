import {
    EthStateStorage,
    CredentialRequest,
    CircuitId,
    IIdentityWallet,
    ZeroKnowledgeProofRequest,
    AuthorizationRequestMessage,
    PROTOCOL_CONSTANTS,
    AuthHandler,
    core,
    CredentialStatusType,
  } from "@0xpolygonid/js-sdk";
  
  import {
    initInMemoryDataStorageAndWallets,
    initCircuitStorage,
    initProofService,
    initPackageManager,
  } from "./walletSetup";
  
  import { ethers } from "ethers";
  import dotenv from "dotenv";
  import { generateRequestData } from "./request";
  dotenv.config();
  
  const rhsUrl = process.env.RHS_URL as string;
  const walletKey = process.env.WALLET_KEY as string;
  
  async function createIdentity(identityWallet: IIdentityWallet) {
    const { did, credential } = await identityWallet.createIdentity({
      method: core.DidMethod.Iden3,
      blockchain: core.Blockchain.Polygon,
      networkId: core.NetworkId.Mumbai,
      revocationOpts: {
        type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        id: rhsUrl,
      },
    });
  
    return {
      did,
      credential,
    };
  }
  
  function createKYCAgeCredential(did: core.DID) {
    const credentialRequest: CredentialRequest = {
      credentialSchema:
        "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json",
      type: "KYCAgeCredential",
      credentialSubject: {
        id: did.string(),
        birthday: 19960424,
        documentType: 99,
      },
      expiration: 12345678888,
      revocationOpts: {
        type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        id: rhsUrl,
      },
    };
    return credentialRequest;
  }
  
  function createKYCAgeCredentialRequest(
    circuitId: CircuitId,
    credentialRequest: CredentialRequest
  ): ZeroKnowledgeProofRequest {
    const proofReqSig: ZeroKnowledgeProofRequest = {
      id: 1,
      circuitId: CircuitId.AtomicQuerySigV2,
      optional: false,
      query: {
        allowedIssuers: ["*"],
        type: credentialRequest.type,
        context:
          "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          documentType: {
            $eq: 99,
          },
        },
      },
    };
  
    const proofReqMtp: ZeroKnowledgeProofRequest = {
      id: 1,
      circuitId: CircuitId.AtomicQueryMTPV2,
      optional: false,
      query: {
        allowedIssuers: ["*"],
        type: credentialRequest.type,
        context:
          "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
        credentialSubject: {
          birthday: {
            $lt: 20020101,
          },
        },
      },
    };
  
    switch (circuitId) {
      case CircuitId.AtomicQuerySigV2:
        return proofReqSig;
      case CircuitId.AtomicQueryMTPV2:
        return proofReqMtp;
      default:
        return proofReqSig;
    }
  }

  async function generateProofs() {
    console.log("=============== generate proofs ===============");
  
    let { dataStorage, credentialWallet, identityWallet } =
      await initInMemoryDataStorageAndWallets();
  
    const circuitStorage = await initCircuitStorage();
    const proofService = await initProofService(
      identityWallet,
      credentialWallet,
      dataStorage.states,
      circuitStorage
    );
  
    const { did: userDID, credential: authBJJCredentialUser } =
      await createIdentity(identityWallet);
  
    console.log("=============== user did ===============");
    console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    await dataStorage.credential.saveCredential(credential);
  
    console.log(
      "================= generate Iden3SparseMerkleTreeProof ======================="
    );
  
    const res = await identityWallet.addCredentialsToMerkleTree(
      [credential],
      issuerDID
    );
  
    console.log("================= push states to rhs ===================");
  
    await identityWallet.publishStateToRHS(issuerDID, rhsUrl);
  
    console.log("================= publish to blockchain ===================");
  
    const ethSigner = new ethers.Wallet(
      walletKey,
      (dataStorage.states as EthStateStorage).provider
    );
    const txId = await proofService.transitState(
      issuerDID,
      res.oldTreeState,
      true,
      dataStorage.states,
      ethSigner
    );
    console.log(txId);
  
    console.log(
      "================= generate credentialAtomicSigV2 ==================="
    );
  
    const proofReqSig: ZeroKnowledgeProofRequest = createKYCAgeCredentialRequest(
      CircuitId.AtomicQuerySigV2,
      credentialRequest
    );
  
    const { proof, pub_signals } = await proofService.generateProof(
      proofReqSig,
      userDID
    );
  
    const sigProofOk = await proofService.verifyProof(
      { proof, pub_signals },
      CircuitId.AtomicQuerySigV2
    );
    console.log("valid: ", sigProofOk);
  
    console.log(
      "================= generate credentialAtomicMTPV2 ==================="
    );
  
    const credsWithIden3MTPProof =
      await identityWallet.generateIden3SparseMerkleTreeProof(
        issuerDID,
        res.credentials,
        txId
      );
  
    console.log(credsWithIden3MTPProof);
    credentialWallet.saveAll(credsWithIden3MTPProof);
  
    const proofReqMtp: ZeroKnowledgeProofRequest = createKYCAgeCredentialRequest(
      CircuitId.AtomicQueryMTPV2,
      credentialRequest
    );
  
    const { proof: proofMTP } = await proofService.generateProof(
      proofReqMtp,
      userDID
    );
  
    console.log(JSON.stringify(proofMTP));
    const mtpProofOk = await proofService.verifyProof(
      { proof, pub_signals },
      CircuitId.AtomicQueryMTPV2
    );
    console.log("valid: ", mtpProofOk);
  
    const { proof: proof2, pub_signals: pub_signals2 } =
      await proofService.generateProof(proofReqSig, userDID);
  
    const sigProof2Ok = await proofService.verifyProof(
      { proof: proof2, pub_signals: pub_signals2 },
      CircuitId.AtomicQuerySigV2
    );
    console.log("valid: ", sigProof2Ok);
  }
  
  
  
  async function main(choice: String) {
    switch (choice) {
      case "generateProofs":
        await generateProofs();
        break;
      case "generateRequestData":
        await generateRequestData();
        break;
  
      default:
        await generateProofs();
        await generateRequestData();
  
    }
  }
  
  (async function () {
    const args = process.argv.slice(2);
    await main(args[0]);
  })();
  