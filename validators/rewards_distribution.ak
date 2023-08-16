use aiken/interval.{Finite}
use aiken/list
use aiken/transaction.{ScriptContext, ValidityRange}
use rewards_distribution/types.{Action, POSIXTime, Params, Reward, Withdraw}

validator(params: Params) {
  fn spend(_d: Void, rdmr: Action, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, .. } = ctx

    when rdmr is {
      Reward -> list.has(transaction.extra_signatories, params.distributor)
      Withdraw ->
        list.has(transaction.extra_signatories, params.provider) && must_start_after(
          transaction.validity_range,
          params.lock_until,
        )
    }
  }
}

fn must_start_after(range: ValidityRange, lock_until: POSIXTime) -> Bool {
  when range.lower_bound.bound_type is {
    Finite(now) -> now > lock_until
    _ -> False
  }
}
