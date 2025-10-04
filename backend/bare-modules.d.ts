declare module 'hypercore-crypto' {
  export interface KeyPair {
    publicKey: Buffer;
    secretKey: Buffer;
  }

  export function keyPair(seed?: Buffer): KeyPair;
  export function hash(data: Buffer | Uint8Array): Buffer;
  export function sign(message: Buffer, secretKey: Buffer): Buffer;
  export function verify(
    message: Buffer,
    signature: Buffer,
    publicKey: Buffer
  ): boolean;

  const crypto: {
    keyPair: typeof keyPair;
    hash: typeof hash;
    sign: typeof sign;
    verify: typeof verify;
  };

  export default crypto;
}

declare module 'corestore' {
  export interface Hypercore {
    ready(): Promise<void>;
    getUserData(key: string): Promise<Buffer | null>;
    setUserData(key: string, value: Buffer | string | null): Promise<void>;
    length: number;
    key: Buffer;
    discoveryKey: Buffer;
    writable: boolean;
    readable: boolean;
    id: string;
  }

  export default class Corestore {
    constructor(
      storage: string | null,
      options?: {
        root?: Corestore | null;
        primaryKey?: Buffer | null;
        namespace?: Buffer;
        manifestVersion?: number;
        globalCache?: any;
        writable?: boolean;
        active?: boolean;
        suspend?: boolean;
      }
    );
    primaryKey: Buffer | null;
    readonly: boolean;
    ready(): Promise<void>;
    get(options?: {
      name?: string;
      key?: Buffer | string;
      discoveryKey?: Buffer;
      keyPair?: { publicKey: Buffer; secretKey: Buffer };
      manifest?: any;
      valueEncoding?: any;
      exclusive?: boolean;
      writable?: boolean;
      wait?: boolean;
      timeout?: number;
    }): Hypercore;
    session(options?: any): Corestore;
    namespace(name: string | Buffer, options?: any): Corestore;
    close(): Promise<void>;
  }
}

declare module 'hyperswarm' {
  import { EventEmitter } from 'events';

  export interface PeerInfo {
    publicKey: Buffer;
    topics?: Buffer[];
    client?: boolean;
    relayAddresses?: any[];
  }

  export interface Discovery {
    flushed(): Promise<void>;
    destroy(): Promise<void>;
    session(opts?: any): Discovery;
  }

  export interface SwarmConnection extends EventEmitter {
    remotePublicKey: Buffer;
    publicKey: Buffer;
    isInitiator: boolean;
    rawBytesRead: number;
    rawBytesWritten: number;
    destroy(err?: Error): void;
    write(data: Buffer): boolean;
    sendKeepAlive(): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    _remoteUserId?: string;
    _isDuplicate?: boolean;
  }

  export interface HyperswarmOptions {
    seed?: Buffer;
    keyPair?: { publicKey: Buffer; secretKey: Buffer };
    maxPeers?: number;
    maxClientConnections?: number;
    maxServerConnections?: number;
    maxParallel?: number;
    bootstrap?: any[];
    dht?: any;
    firewall?: (remotePublicKey: Buffer, payload: any) => boolean;
  }

  export default class Hyperswarm extends EventEmitter {
    constructor(options?: HyperswarmOptions);
    keyPair: { publicKey: Buffer; secretKey: Buffer };
    connections: Set<SwarmConnection>;
    peers: Map<string, any>;
    destroyed: boolean;
    listening: Promise<void> | null;

    join(topic: Buffer, options?: { client?: boolean; server?: boolean }): Discovery;
    leave(topic: Buffer): Promise<void>;
    joinPeer(publicKey: Buffer): void;
    leavePeer(publicKey: Buffer): void;
    listen(): Promise<void>;
    flush(): Promise<boolean>;
    destroy(options?: { force?: boolean }): Promise<void>;

    on(
      event: 'connection',
      listener: (conn: SwarmConnection, info: PeerInfo) => void
    ): this;
    on(event: 'update', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }

  export { Discovery };
}

declare module 'protomux' {
  export interface Channel {
    open(handshake?: any): void;
    close(): void;
    opened: boolean;
    cork(): void;
    uncork(): void;
    addMessage(options: {
      encoding?: any;
      onmessage?: (data: any, session: Channel) => void | Promise<void>;
    }): {
      send: (data: any, session?: Channel) => void;
    };
  }

  export default class Protomux {
    constructor(stream: any, options?: { alloc?: (size: number) => Buffer });
    static from(stream: any, opts?: any): Protomux;
    static isProtomux(mux: any): boolean;
    isIdle(): boolean;
    cork(): void;
    uncork(): void;
    createChannel(options: {
      userData?: any;
      protocol: string;
      aliases?: string[];
      id?: Buffer | null;
      unique?: boolean;
      handshake?: any;
      messages?: any[];
      onopen?: (handshake: any) => void | Promise<void>;
      onclose?: () => void;
      ondestroy?: () => void;
      ondrain?: () => void;
    }): Channel;
    destroy(err?: Error): void;
  }
}

declare module 'compact-encoding' {
  export interface State {
    start: number;
    end: number;
    buffer: Buffer | null;
    cache: any;
  }

  export interface Encoding<T = any> {
    preencode(state: State, val: T): void;
    encode(state: State, val: T): void;
    decode(state: State): T;
  }

  export function state(start?: number, end?: number, buffer?: Buffer | null): State;
  export function encode<T>(enc: Encoding<T>, val: T): Buffer;
  export function decode<T>(enc: Encoding<T>, buffer: Buffer): T;

  // Primitive encodings
  export const uint: Encoding<number>;
  export const uint8: Encoding<number>;
  export const uint16: Encoding<number>;
  export const uint32: Encoding<number>;
  export const uint64: Encoding<number>;
  export const int: Encoding<number>;
  export const int8: Encoding<number>;
  export const int16: Encoding<number>;
  export const int32: Encoding<number>;
  export const int64: Encoding<number>;
  export const float32: Encoding<number>;
  export const float64: Encoding<number>;

  // Buffer encodings
  export const buffer: Encoding<Buffer | null>;
  export const uint8array: Encoding<Uint8Array>;
  export const raw: Encoding<Buffer>;

  // String encodings
  export const string: Encoding<string>;
  export const utf8: Encoding<string>;
  export const ascii: Encoding<string>;
  export const hex: Encoding<string>;
  export const base64: Encoding<string>;

  // Complex encodings
  export const json: Encoding<any>;
  export const bool: Encoding<boolean>;
  export const none: Encoding<null>;
  export const any: Encoding<any>;

  export function array<T>(enc: Encoding<T>): Encoding<T[]>;
  export function fixed(n: number): Encoding<Buffer>;
  export const fixed32: Encoding<Buffer>;
  export const fixed64: Encoding<Buffer>;
}

declare module 'b4a' {
  export function isBuffer(value: any): boolean;
  export function isEncoding(encoding: string): boolean;
  export function alloc(
    size: number,
    fill?: string | number | Buffer,
    encoding?: BufferEncoding
  ): Buffer;
  export function allocUnsafe(size: number): Buffer;
  export function allocUnsafeSlow(size: number): Buffer;
  export function byteLength(string: string, encoding?: BufferEncoding): number;
  export function compare(a: Buffer | Uint8Array, b: Buffer | Uint8Array): number;
  export function concat(buffers: Buffer[], totalLength?: number): Buffer;
  export function copy(
    source: Buffer | Uint8Array,
    target: Buffer,
    targetStart?: number,
    start?: number,
    end?: number
  ): number;
  export function equals(a: Buffer | Uint8Array, b: Buffer | Uint8Array): boolean;
  export function fill(
    buffer: Buffer | Uint8Array,
    value: string | number | Buffer,
    offset?: number,
    end?: number,
    encoding?: BufferEncoding
  ): Buffer;
  export function from(
    value: string | Buffer | Uint8Array | ArrayBuffer | number[],
    encodingOrOffset?: BufferEncoding | number,
    length?: number
  ): Buffer;
  export function includes(
    buffer: Buffer | Uint8Array,
    value: string | number | Buffer,
    byteOffset?: number,
    encoding?: BufferEncoding
  ): boolean;
  export function indexOf(
    buffer: Buffer | Uint8Array,
    value: string | number | Buffer,
    byteOffset?: number,
    encoding?: BufferEncoding
  ): number;
  export function lastIndexOf(
    buffer: Buffer | Uint8Array,
    value: string | number | Buffer,
    byteOffset?: number,
    encoding?: BufferEncoding
  ): number;
  export function swap16(buffer: Buffer | Uint8Array): Buffer;
  export function swap32(buffer: Buffer | Uint8Array): Buffer;
  export function swap64(buffer: Buffer | Uint8Array): Buffer;
  export function toBuffer(buffer: Buffer | Uint8Array): Buffer;
  export function toString(
    buffer: Buffer | Uint8Array,
    encoding?: BufferEncoding,
    start?: number,
    end?: number
  ): string;
  export function write(
    buffer: Buffer | Uint8Array,
    string: string,
    offset?: number,
    length?: number,
    encoding?: BufferEncoding
  ): number;
}

declare module 'bare-path' {
  export const sep: string;
  export const delimiter: string;
  export function normalize(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function isAbsolute(path: string): boolean;
  export function relative(from: string, to: string): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function parse(path: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  };
  export function format(pathObject: {
    root?: string;
    dir?: string;
    base?: string;
    ext?: string;
    name?: string;
  }): string;
  export function toNamespacedPath(path: string): string;
}

declare global {
  const BareKit: {
    IPC: any;
  };
}
