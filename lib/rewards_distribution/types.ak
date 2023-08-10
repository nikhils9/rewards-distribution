use aiken/hash.{Blake2b_224, Hash}
use aiken/transaction/credential.{VerificationKey}

/// Custom Params type
pub type Params {
  /// PubKeyHash of the address that locks funds into the contract
  provider: Hash<Blake2b_224, VerificationKey>,
  /// PubKeyHash of the address that distributes the locked funds as rewards
  distributor: Hash<Blake2b_224, VerificationKey>,
  /// Time until the provider cannot withdraw funds from the contract
  lock_until: POSIXTime
}

/// Custom Redeemer type
pub type Action {
  Reward
  Withdraw
}

pub type POSIXTime = Int

test sum() {
  1 + 1 == 2
}
