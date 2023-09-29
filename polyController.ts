import { Request, Response } from 'express';
//import abi from "./abi.json";
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
    credential
  }
  
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


export const healthCheck = async (req: Request, res: Response) => {
  try {
    console.log("=============== key creation ===============");
    res.status(200).json({ message: 'working' });
} catch (error) {
  let errorMessage = "Failed to do something exceptional";
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  res.status(500).json(
    { error: 'Error signing transaction', message: errorMessage });
}

}

export const createPolygonId = async (req: Request, res: Response) => {
    try {
        console.log("=============== key creation ===============");

        let { identityWallet } = await initInMemoryDataStorageAndWallets();
        const { did, credential } = await createIdentity(identityWallet);
        console.log("=============== did ===============");
        console.log(did.string());
        console.log("=============== Auth BJJ credential ===============");
        console.log(JSON.stringify(credential));
        res.status(200).json({ message: 'Polygon ID Created', PolygonId:did.id});
    } catch (error) {
      let errorMessage = "Failed to do something exceptional";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      res.status(500).json(
        { error: 'Error signing transaction', message: errorMessage });
    }
  };



export const createAgeCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};

export const createKYCCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};

export const createKYBCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};

export const createSanctionCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};

export const createPEPCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};

export const createAccCreadential = async (req: Request, res: Response) => {
  try {

    const userDID = req.body.userId;
    let { dataStorage, identityWallet } = await initInMemoryDataStorageAndWallets();

    // const { did: userDID, credential: authBJJCredentialUser } =
    //   await createIdentity(identityWallet);
  
    // console.log("=============== user did ===============");
    // console.log(userDID.string());
  
    const { did: issuerDID, credential: issuerAuthBJJCredential } =
      await createIdentity(identityWallet);
  
    const credentialRequest = createKYCAgeCredential(userDID);
    const credential = await identityWallet.issueCredential(
      issuerDID,
      credentialRequest
    );
  
    console.log("===============  credential ===============");
    console.log(JSON.stringify(credential));
  
    await dataStorage.credential.saveCredential(credential);
      res.status(200).json({ 
        message: 'Age creadential issued', 
        AgeCredential:credential.id,
        issuerId:issuerDID.id});
  } catch (error) {
    let errorMessage = "Failed to do something exceptional";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json(
      { error: 'Error signing transaction', message: errorMessage });
  }
};