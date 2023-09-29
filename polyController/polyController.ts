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
        res.status(200).json({ message: 'Polygon ID Created', PolygonId: did.toString() });
    } catch (error) {
      let errorMessage = "Failed to do something exceptional";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      res.status(500).json(
        { error: 'Error signing transaction', message: errorMessage });
    }
  };
