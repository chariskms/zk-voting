import { Votes } from './MerkleVotes.js';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  MerkleTree,
  PrivateKey,
  AccountUpdate,
  MerkleWitness,
  Poseidon,
  MerkleMap,
} from 'o1js';

await isReady;

console.log('SnarkyJS loaded');

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];

// Create a public/private key pair. The public key is your address and where you deploy the zkApp to
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

// create an instance of Votes - and deploy it to zkAppAddress
const zkAppInstance = new Votes(zkAppAddress);

const voters = new MerkleMap();
const candidates = new MerkleMap();

/////////////////////
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
  zkAppInstance.initState(candidates.getRoot(), voters.getRoot());

});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

//voter
const voter = PrivateKey.random();
const voterPublic = voter.toPublicKey();

// get the voter witness
const vkey = Field(Poseidon.hash(voterPublic.toFields()));
const voterWitness = voters.getWitness(vkey);

//candidate
const candidate = PrivateKey.random();
const candidatePublic = candidate.toPublicKey();

////////////////////////////////

const ckey = Field(Poseidon.hash(candidatePublic.toFields()));
const candidateWitness = candidates.getWitness(ckey);

const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.vote(voterWitness, candidateWitness, Field(0), voterPublic, candidatePublic);
});
await txn1.prove();
await txn1.sign([senderKey]).send();

console.log('after txn1');
voters.set(vkey, Field(1));

const value = candidates.get(ckey)
candidates.set(ckey, value.add(Field(1)));

//voter
// const voter2 = PrivateKey.random();
// const voterPublic2 = voter.toPublicKey();


// const voterIndex2 = 1n;

// get the witness for the current tree
// const voterWitness = new MerkleWitness3(voters.getWitness(voterIndex));

// ----------------------------------------------------
try {
  const txn2 = await Mina.transaction(senderAccount, () => {
    zkAppInstance.vote(voterWitness, candidateWitness, Field(1), voterPublic, candidatePublic);
  });
  await txn2.prove();
  await txn2.sign([senderKey]).send();
} catch (ex: any) {
  console.log(ex.message);
}
console.log('after txn2');

console.log('Shutting down');
