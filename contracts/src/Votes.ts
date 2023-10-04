import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Provable,
  Reducer,
  Circuit,
  Poseidon,
  PublicKey,
  Bool,
} from 'o1js';

export class Votes extends SmartContract {
  @state(Field) actionState = State<Field>();

  @state(Field) candidate1 = State<Field>();
  @state(Field) candidate2 = State<Field>();
  @state(Field) candidate3 = State<Field>();

  @state(Field) candidate1Votes = State<Field>();
  @state(Field) candidate2Votes = State<Field>();
  @state(Field) candidate3Votes = State<Field>();

  reducer = Reducer({ actionType: Field });

  init() {
    super.init();

    this.candidate1.set(
      Poseidon.hash(
        PublicKey.fromBase58(
          'B62qkhh2d4qMZ41qcXMNUt1XwFr5EyNfCM68vVXa69ESrWFFkgNrT5Y'
        ).toFields()
      )
    );
    this.candidate2.set(
      Poseidon.hash(
        PublicKey.fromBase58(
          'B62qj3DevXeeim5uEY9jVf9Gvd2tHbko4G62x2zp39NbkJhP3HW7zqL'
        ).toFields()
      )
    );
    this.candidate3.set(
      Poseidon.hash(
        PublicKey.fromBase58(
          'B62qjtHSupUKstEDPuQ4q8Ay9Pum6ZhsiwRAWG9N1EiCDYp7cEBPqqv'
        ).toFields()
      )
    );

    this.candidate1Votes.set(Field(0));
    this.candidate2Votes.set(Field(0));
    this.candidate3Votes.set(Field(0));

    this.actionState.set(Reducer.initialActionState);
  }

  @method vote(vote: PublicKey) {
    //Check if voter exists

    //Best Option MerkleMap hosted from the zkapp.

    //Check if address exists
    let candidate1 = this.candidate1.get();
    let candidate2 = this.candidate2.get();
    let candidate3 = this.candidate3.get();
    this.candidate1.assertEquals(candidate1);
    this.candidate2.assertEquals(candidate2);
    this.candidate3.assertEquals(candidate3);

    let voteHashed = Poseidon.hash(vote.toFields());

    let candidateExists = new Bool(false);

    candidateExists = Provable.if(
      voteHashed.equals(candidate1),
      Bool,
      new Bool(true),
      candidateExists
    );
    candidateExists = Provable.if(
      voteHashed.equals(candidate2),
      Bool,
      new Bool(true),
      candidateExists
    );
    candidateExists = Provable.if(
      voteHashed.equals(candidate3),
      Bool,
      new Bool(true),
      candidateExists
    );

    candidateExists.assertTrue('Candidate does not exist.');

    this.reducer.dispatch(Field(voteHashed));
  }

  @method countVotes() {
    let candidate1 = this.candidate1.get();
    let candidate2 = this.candidate2.get();
    let candidate3 = this.candidate3.get();
    this.candidate1.assertEquals(candidate1);
    this.candidate2.assertEquals(candidate2);
    this.candidate3.assertEquals(candidate3);

    let candidate1Votes = this.candidate1Votes.get();
    let candidate2Votes = this.candidate2Votes.get();
    let candidate3Votes = this.candidate3Votes.get();
    this.candidate1Votes.assertEquals(candidate1Votes);
    this.candidate2Votes.assertEquals(candidate2Votes);
    this.candidate3Votes.assertEquals(candidate3Votes);

    let actionState = this.actionState.get();
    this.actionState.assertEquals(actionState);

    let pendingActions = this.reducer.getActions({
      fromActionState: actionState,
    });

    let { state: newCandidate1Votes, actionState: newActionState1 } =
      this.reducer.reduce(
        pendingActions,
        Field,
        (state: Field, action: Field) =>
          Provable.if(action.equals(candidate1), Field, state.add(1), state),
        { state: candidate1Votes, actionState }
      );

    let { state: newCandidate2Votes, actionState: newActionState2 } =
      this.reducer.reduce(
        pendingActions,
        Field,
        (state: Field, action: Field) =>
          Provable.if(action.equals(candidate2), Field, state.add(1), state),
        { state: candidate2Votes, actionState }
      );

    let { state: newCandidate3Votes, actionState: newActionState3 } =
      this.reducer.reduce(
        pendingActions,
        Field,
        (state: Field, action: Field) =>
          Provable.if(action.equals(candidate3), Field, state.add(1), state),
        { state: candidate3Votes, actionState }
      );

    // update on-chain state
    this.candidate1Votes.set(newCandidate1Votes);
    this.candidate2Votes.set(newCandidate2Votes);
    this.candidate3Votes.set(newCandidate3Votes);

    //newActionState3, newActionState2, newActionState1 must be equal
    newActionState2.assertEquals(newActionState1);
    newActionState3.assertEquals(newActionState1);

    Circuit.log(newCandidate1Votes);
    Circuit.log(newCandidate2Votes);
    Circuit.log(newCandidate3Votes);

    this.actionState.set(newActionState1);
  }
}
