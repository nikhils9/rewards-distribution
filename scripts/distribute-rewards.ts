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

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./user.sk"));

const appliedValidator: AppliedValidator = JSON.parse(await Deno.readTextFile("./rewards_distribution.spend_applied_validator.json"));
const utxos = await lucid.utxosAt(appliedValidator.lockAddress);

const rdmr = Data.to(new Constr(0, []));
const userAddress = await lucid.wallet.address();

const tx = await lucid
            .newTx()
            .collectFrom(utxos, rdmr)
            .payToAddress(userAddress, { lovelace: 10000000n})
            .attachSpendingValidator(appliedValidator.validator)
            .addSigner(await Deno.readTextFile("./distributor.addr"))
            .validFrom(Date.now() - 60*1000) // Substracting 1 minute to offset diff (blockfrost server time - local system time) 
            .validTo(Date.now() + 15*60*1000)
            .complete({ 
                change: {address: appliedValidator.lockAddress, outputData: {inline: Data.void()}}, 
                coinSelection: false 
            });

const signedTx = await tx
                    .signWithPrivateKey(await Deno.readTextFile("./distributor.sk"))
                    .sign()
                    .complete();

const txHash = await signedTx.submit();
await lucid.awaitTx(txHash);

console.log(`Successfully distributed 10 ADA reward from
lockAddress: ${appliedValidator.lockAddress},
to userAddress: ${userAddress},
txHash: ${txHash}`);
