import { BLOCKFROST_URL, NETWORK } from "./constants.ts"
import {
    Lucid,
    Blockfrost,
    Data,
    Constr,
    fromText
} from "lucid";
import {AppliedValidator} from "./types.ts";
import { getCredential, sumUtxos } from "./utils.ts";

const lucid = await Lucid.new(
    new Blockfrost(BLOCKFROST_URL, await Deno.env.get("BLOCKFROST_API_KEY")),
    NETWORK
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./distributor.sk"));
const distributorAddress = await lucid.wallet.address();

const appliedValidator: AppliedValidator = JSON.parse(await Deno.readTextFile("./rewards_distribution.spend_applied_validator.json"));
const scriptUtxos = await lucid.utxosAt(appliedValidator.lockAddress);
let scriptAssets = sumUtxos(scriptUtxos);

const rdmr = Data.to(new Constr(0, []));
const userAddress = await getCredential("user.addr");
const userUtxos = await lucid.utxosAt(userAddress);

const policyId = "40939f6c07ec1c6fffd08207ff22ae139a05e8f6af4404c025adb927";
const tokenName = "BTC";
const token = policyId + fromText(tokenName);
const reward = 10n;
const balance = scriptAssets[token];

if(reward > balance)
    throw new Error(`Insufficient token balance for ${tokenName}`);

scriptAssets[token] = balance - reward;

/* 
The below steps facilitate building the tx server side. Partially sign it
with distributor key and then send it (tx + partialSignedTx) accross to 
client for assembling the tx with distributor witness and sign + submit.
*/
// TODO: Instead of selecting all utxos at script and user addresses, select based on tx costs
const tx = await lucid
            .newTx()
            .collectFrom(scriptUtxos, rdmr)
            .collectFrom(userUtxos)
            .payToAddress(userAddress, {[token]: reward})
            .payToContract(appliedValidator.lockAddress, Data.void(), scriptAssets)
            .attachSpendingValidator(appliedValidator.validator)
            .addSigner(distributorAddress)
            .addSigner(userAddress)
            .validFrom(Date.now() - 60*1000) // Substracting 1 minute to offset diff (blockfrost server time - local system time) 
            .validTo(Date.now() + 15*60*1000)
            .complete({ 
                change: {address: userAddress}, 
                coinSelection: false  // Setting to false to avoid using distributor funds
            });

const partialSignedTx = await tx.partialSign();

lucid.selectWalletFromPrivateKey(await getCredential("user.sk"));

const signedTx = await lucid
                    .fromTx(tx.toString())
                    .assemble([partialSignedTx])
                    .sign()
                    .complete();

const txHash = await signedTx.submit();
await lucid.awaitTx(txHash);

console.log(`Successfully distributed ${reward.toString()} ${tokenName} token reward from
lockAddress: ${appliedValidator.lockAddress},
to userAddress: ${userAddress},
token: ${policyId + "." + fromText(tokenName)},
txHash: ${txHash}`);
