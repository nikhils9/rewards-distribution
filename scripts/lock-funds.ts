import {
    Lucid,
    Blockfrost,
    Constr,
    Data
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

const params = new Constr(0, [providerPubKeyHash, distributorPublicKeyHash, BigInt(1691643728)]);

const appliedValidator = await parseValidatorAndApplyParameters(blueprint.validators, [params], "rewards_distribution.spend");

const tx = await lucid
            .newTx()
            .payToContract(appliedValidator.lockAddress, Data.void(), {lovelace:100000000n})
            .complete();

const signedTx = await tx.sign().complete();
const txHash = await signedTx.submit();
await lucid.awaitTx(txHash);

console.log(`Successfully locked 100 ADA at
lockAddress: ${appliedValidator.lockAddress},
policyId: ${appliedValidator.policyId},
txHash: ${txHash}`);