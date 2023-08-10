import { Lucid } from "lucid";

await generateNewWallet("provider");
await generateNewWallet("distributor");
await generateNewWallet("user");

async function generateNewWallet(walletName: string) {

    const lucid = await Lucid.new(undefined, "Preprod");

    const privateKey = lucid.utils.generatePrivateKey();
    await Deno.writeTextFile(walletName + ".sk", privateKey);

    const address = await lucid.selectWalletFromPrivateKey(privateKey).wallet.address();
    await Deno.writeTextFile(walletName + ".addr", address);
}

