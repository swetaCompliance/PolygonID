import { Id } from '../id';
import { Blockchain, DidMethod, NetworkId } from '../constants';
import { IDID, Param } from './types';
export declare class DID {
    method: string;
    id: string;
    idStrings: string[];
    params: Param[];
    path: string;
    pathSegments: string[];
    query: string;
    fragment: string;
    constructor(d?: Partial<IDID>);
    isUrl(): boolean;
    string(): string;
    static parse(s: string): DID;
    static decodePartsFromId(id: Id): {
        method: DidMethod;
        blockchain: Blockchain;
        networkId: NetworkId;
    };
    static networkIdFromId(id: Id): NetworkId;
    static methodFromId(id: Id): DidMethod;
    static blockchainFromId(id: Id): Blockchain;
    private static throwIfDIDUnsupported;
    static newFromIdenState(typ: Uint8Array, state: bigint): DID;
    static new(typ: Uint8Array, genesis: Uint8Array): DID;
    static parseFromId(id: Id): DID;
    static idFromDID(did: DID): Id;
    static isUnsupported(method: DidMethod, blockchain: Blockchain, networkId: NetworkId): boolean;
    static idFromUnsupportedDID(did: DID): Id;
    private static getIdFromDID;
}
