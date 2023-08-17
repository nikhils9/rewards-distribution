import {
    Lucid,
    Blockfrost,
    Constr,
    Data,
    fromText
} from "lucid";
import {BLOCKFROST_URL, NETWORK} from "./constants.ts";
import { getPublicKeyHash, parseValidatorAndApplyParameters } from "./utils.ts";
import blueprint from "../plutus.json" assert { type: "json"};

const lucid = await Lucid.new(
    new Blockfrost(BLOCKFROST_URL, Deno.env.get("BLOCKFROST_API_KEY")),
    NETWORK
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./provider.sk"));

const providerPubKeyHash = getPublicKeyHash(await Deno.readTextFile("./provider.addr"));
const distributorPublicKeyHash = getPublicKeyHash(await Deno.readTextFile("./distributor.addr"));

const params = new Constr(0, [providerPubKeyHash, distributorPublicKeyHash, BigInt(1692269515000)]); // Set lock_until unix time

const appliedValidator = await parseValidatorAndApplyParameters(blueprint.validators, [params], "rewards_distribution.spend");

const policyId = "40939f6c07ec1c6fffd08207ff22ae139a05e8f6af4404c025adb927";
const tokenName = "BTC";
const amount = 100;

const tx = await lucid
            .newTx()
            .payToContract(
                appliedValidator.lockAddress, Data.void(), 
                {[ policyId + fromText(tokenName)]: BigInt(amount), lovelace : 10000000n}
            )
            .complete();

const signedTx = await tx.sign().complete();
const txHash = await signedTx.submit();
await lucid.awaitTx(txHash);

console.log(`Successfully locked ${amount} ${tokenName} tokens at
lockAddress: ${appliedValidator.lockAddress},
policyId: ${appliedValidator.policyId},
token: ${policyId + "." + fromText(tokenName)},
txHash: ${txHash}`);