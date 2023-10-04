import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  Poseidon,
  MerkleMapWitness,
} from 'o1js';

export class Votes extends SmartContract {
  //MerkleMap key: PublicKey value: count(Votes)
  @state(Field) candidates = State<Field>();
  //Merkle Map: PublicKey    value: 1 (Already has voted)
  @state(Field) voters = State<Field>();  

  @method initState(initialRootCandidates: Field, initialRootVoters: Field) {
    this.candidates.set(initialRootCandidates);
    this.voters.set(initialRootVoters);
  }

  @method vote(voterWitness: MerkleMapWitness, candidateWitness: MerkleMapWitness, votesBefore: Field, voter: PublicKey, candidate: PublicKey) {
  
    //check of Voters root
    const votersRoot = this.voters.get();
    this.voters.assertEquals(votersRoot);

    //check of Candidates root
    const candidatesRoot = this.candidates.get();
    this.candidates.assertEquals(candidatesRoot);

    const [ votersRootBefore, votersKey ] = voterWitness.computeRootAndKey(Field(0));

    //check if voter exists
    const voterNotExists = votersRootBefore.equals(votersRoot);
    voterNotExists.assertTrue('Voter already has voted!');
    votersKey.assertEquals(Poseidon.hash(voter.toFields()));

    //check candidate address and vote
    const [ candidatesRootBefore, cankey ] = candidateWitness.computeRootAndKey(votesBefore);
    candidatesRootBefore.assertEquals(candidatesRoot);
    cankey.assertEquals(Poseidon.hash(candidate.toFields()));

    //Add a vote
    const [ candidatesAfter, _1] = candidateWitness.computeRootAndKey(votesBefore.add(1));

    //Add voter
    const [ votersAfter, _2] = voterWitness.computeRootAndKey(Field(1));

    this.candidates.set(candidatesAfter);
    this.voters.set(votersAfter);
  }

  @method countVotes(){
    const votersRoot = this.voters.get();
    this.voters.assertEquals(votersRoot);

    const candidatesRoot = this.candidates.get();
    this.candidates.assertEquals(candidatesRoot);  
  }
}
