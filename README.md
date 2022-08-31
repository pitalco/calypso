# Calypso - The Blockchain OS

This repo holds the Agoric smart contract for Calypso, one wallet and desktop app to manage your blockchain protocols across 50+ chains, all decentrally.

## Getting Started on Devnet
You will need to have NodeJS and Rust installed to get started.

## Installation

```sh
git clone https://github.com/pitalco/calypso

cd calypso

# Install all required software. Agoric, Osmosis, and Hermes Relayer
make install

# Start a local Agoric chain
make start
```


Keep an eye in agoric.log file. Once Agoric starts up, initialize all the connections and the Hermes relayer
```sh
make init
```

Once the process above completes, start the Hermes Relayer to relay transactions across chains. hermes.log tracks all the logs for Hermes
```sh
make start-rly
```

## Deploying the Contract

In a seperate terminal, run the following command to start the local-solo. You will have to keep this terminal up running the solo
```sh
agoric start local-solo --reset
# once local-solo starts up, run
agoric open --repl
```

Once the repl opens, lets deploy the contract to Zoe so we can use it from our repl and our other contracts. Move back to an open terminal and run the following commands
```sh
# Make sure you are in the base contract directory
cd ~/calypso/contract

agoric deploy ./deploy.js
```

## App Store dApps At Launch
* Osmosis - Dex (Swap + LP Management)
* Juno - Junoswap (Swap + LP Management)
* Secret - Secretswap (Swap + LP Management)
* Staking Management in all IBC Chains (Autocompound)

## Future dApps
* IBC <-> EVM Bridging
* Stargaze and NFT Aggregation/Management

## Future Potential dApps
* Cosmos Hub?
* Terra and Terra dApps
* Akash + Dev Tools for Deploying Web3 Cloud
* Lending Aggregation