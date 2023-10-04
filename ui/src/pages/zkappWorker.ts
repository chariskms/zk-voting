import { Field, Mina, PublicKey, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Votes } from '../../../contracts/src/Votes';

const state = {
  Votes: null as null | typeof Votes,
  zkapp: null as null | Votes,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network({
      mina: 'https://proxy.berkeley.minaexplorer.com/graphql',
      archive: 'https://api.minascan.io/archive/berkeley/v1/graphql/'
  });
    console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { Votes } = await import('../../../contracts/build/src/Votes.js');
    state.Votes = Votes;
  },
  compileContract: async (args: {}) => {
    await state.Votes!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Votes!(publicKey);
  },
  getCandidate1: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate1.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  getCandidate2: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate2.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  getCandidate3: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate3.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  getCandidate1Votes: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate1Votes.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  getCandidate2Votes: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate2Votes.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  getCandidate3Votes: async (args: {}) => {
    console.log("contract", state.zkapp);
    const result = await state.zkapp!.candidate3Votes.getAndAssertEquals();
    console.log(result);
    return JSON.stringify(result.toJSON());
  },
  vote: async (args: {candidate: string}) => {
    const candidate = args.candidate;
    const transaction = await Mina.transaction(() => {
      state.zkapp!.vote(PublicKey.fromBase58(candidate));
    });
    state.transaction = transaction;
  },
  countVotes: async (args: {}) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.countVotes();
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== 'undefined') {
  addEventListener(
    'message',
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log('Web Worker Successfully Initialized.');
