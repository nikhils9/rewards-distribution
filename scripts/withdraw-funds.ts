import { BLOCKFROST_URL, NETWORK } from "./constants.ts"
import {
    Lucid,
    Blockfrost,
    Data,
    Constr
} from "lucid";
import {AppliedValidator} from "./types.ts";

const lucid = await Lucid.new(
    new Blockfrost(BLOCKFROST_URL, await Deno.env.get("BLOCKFROST_API_KEY")),
    NETWORK
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./provider.sk"));

const appliedValidator: AppliedValidator = JSON.parse(await Deno.readTextFile("./rewards_distribution.spend_applied_validator.json"));
const utxos = await lucid.utxosAt(appliedValidator.lockAddress);

const rdmr = Data.to(new Constr(1, []));
const providerAddress = await lucid.wallet.address()

const tx = await lucid
            .newTx()
            .collectFrom(utxos, rdmr)
            .attachSpendingValidator(appliedValidator.validator)
            .addSigner(providerAddress)
            .validFrom(Date.now() - 60*1000) // Substracting 1 minute from current time to offset diff (blockfrost server time - local system time) 
            .validTo(Date.now() + 15*60*1000)
            .complete();

const signedTx = await tx.sign().complete();

const txHash = await signedTx.submit();

await lucid.awaitTx(txHash);

console.log(`Successfully withdrew all locked funds from
lockAddress: ${appliedValidator.lockAddress},
to address: ${providerAddress},
txHash: ${txHash}`);