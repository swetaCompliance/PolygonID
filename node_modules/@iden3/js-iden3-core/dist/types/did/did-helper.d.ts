import { Blockchain, DidMethod, NetworkId } from '../constants';
export declare class DIDNetworkFlag {
    readonly blockchain: Blockchain;
    readonly networkId: NetworkId;
    constructor(blockchain: Blockchain, networkId: NetworkId);
    toString(): string;
    static fromString(s: string): DIDNetworkFlag;
}
export declare function buildDIDType(method: DidMethod, blockchain: Blockchain, network: NetworkId): Uint8Array;
export declare function findNetworkIDForDIDMethodByValue(method: DidMethod, byteNumber: number): NetworkId;
export declare function findBlockchainForDIDMethodByValue(method: DidMethod, byteNumber: number): Blockchain;
export declare function findDIDMethodByValue(byteNumber: number): DidMethod;
