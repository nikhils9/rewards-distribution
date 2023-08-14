# rewards-distribution

This project is to enable distribution of token rewards on the Cardano blockchain. It uses an Aiken based smart contract with Lucid.

## Description
A "provider" locks fund in the contract till a specified time (lock_until). Any address can be rewarded from this fund if the transaction 
is signed by "distributor". Once the specified time has passed, the "provider" can withdraw all the funds from the contract.

## Requirements
1. [Deno](https://deno.land/ "A modern runtime for Javascript & Typescript"). The project was tested using Deno v1.30
2. [Aiken](https://aiken-lang.org/) - Optional. Needed if you want to make changes to the validator.

## Setup
1. Set the environment variable `BLOCKFROST_API_KEY` in your shell session. By default the scripts connect to Preprod network.
You can configure it in `/scripts/constants.ts`
2. `cd scripts/`
3. Run the script to generate credentials   
        `deno run --allow-write generate-credential.ts`  
This will create three private key files and their corresponding address files.
4. Send some tAda to `provider.addr` and `user.addr`

## Steps
1. Lock the funds in the contract  
        `deno run --allow-read --allow-write --allow-net lock-funds.ts`  
Alternatively, you can choose to give all access the script may require by running  
        `deno run --allow-all lock-funds.ts`
2. Distribute rewards  
        `deno run --allow-all distribute-rewards.ts`
3. Once the lock_until time has passed, withdraw all the locked funds by running  
        `deno run --allow-all withdraw-funds.ts`