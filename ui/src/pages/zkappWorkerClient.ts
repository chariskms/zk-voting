import { fetchAccount, PublicKey, Field } from 'o1js';

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from './zkappWorker';

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToBerkeley() {
    return this._call('setActiveInstanceToBerkeley', {});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }

  vote(candidate: string) {
    return this._call('vote', {
      candidate,
    });
  }

  countVotes() {
    return this._call('countVotes', {});
  }

  async getCandidate1Votes(): Promise<Field> {
    const result = await this._call('getCandidate1Votes', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getCandidate2Votes(): Promise<Field> {
    const result = await this._call('getCandidate2Votes', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getCandidate3Votes(): Promise<Field> {
    const result = await this._call('getCandidate3Votes', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getCandidate1(): Promise<Field> {
    const result = await this._call('getCandidate1', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getCandidate2(): Promise<Field> {
    const result = await this._call('getCandidate2', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  async getCandidate3(): Promise<Field> {
    const result = await this._call('getCandidate3', {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  proveUpdateTransaction() {
    return this._call('proveUpdateTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
