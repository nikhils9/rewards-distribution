import { NETWORK, CREDENTIALS_PATH } from "./constants.ts";
import { AppliedValidator } from "./types.ts";
import {
    applyParamsToScript,
    applyDoubleCborEncoding,
    Lucid,
    UTxO,
    Assets,
    addAssets
} from "lucid";

const lucid = await Lucid.new(undefined, NETWORK);

export async function getCredential(fileName: string, filePath?: string) {
    let path = CREDENTIALS_PATH;
    
    if(filePath)
        path = filePath;

    return Deno.readTextFile(path + fileName);
}

export function getPublicKeyHash(address: string) {
    return lucid.utils.getAddressDetails(address).paymentCredential?.hash;
}

export function sumUtxos(utxos: UTxO[]): Assets {
    return utxos
            .map((utxo) => utxo.assets)
            .reduce((acc, assets) => addAssets(acc, assets), {});
}

export async function parseValidator(validators, title: string) : Promise<any> {
    const validator = validators.find((e) => e.title === title );

    if(!validator)
        throw new Error(title + " validator not found!");

    return {
        type: "PlutusV2",
        script: validator.compiledCode
    }
}

export async function parseValidatorAndApplyParameters(validators, params: [any], title: string): Promise<AppliedValidator> {
    const validator = await parseValidator(validators, title);
    return applyValidatorParameters(validator, params, title);
}

export async function applyValidatorParameters(rawValidator, params: [any], title: string): Promise<AppliedValidator> {

    const compiledCode = await applyParamsToScript(rawValidator.script, params);
    const validator = {
        type: "PlutusV2",
        script: await applyDoubleCborEncoding(compiledCode)
    };
    
    const policyId = await lucid.utils.validatorToScriptHash(validator);
    const lockAddress = await lucid.utils.validatorToAddress(validator);

    const appliedValidator: AppliedValidator = {
        validator: validator,
        policyId: policyId,
        lockAddress: lockAddress,
        params: params
    }

    const appliedValidatorString = JSON.stringify(appliedValidator, bigIntReplacer);
    console.log(appliedValidatorString);
    await Deno.writeTextFile(title + "_applied_validator.json", appliedValidatorString);

    return appliedValidator;
}

// Parameter to 'JSON.stringify()' to help with bigint conversion
export function bigIntReplacer(k, v){
    return typeof v === 'bigint' ? v.toString() : v;
}