# Flight Insurance

Flight Insurance is a dApp for managing flight insurance policies using blockchain technology. It allows users to purchase, track, and manage their flight insurance policies securely on the blockchain. Through smart contracts, Flight Insurance automates claim processing, ensuring efficient and transparent handling of insurance claims. 

## Tools required and versions

* Truffle v5.8.0 (core: 5.8.0)
* Ganache v7.7.6
* Solidity - 0.8.19 (solc-js)
* Node v16.14.0
* Web3.js v1.8.2

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using React, NextJS, TailwindCSS, and JS)

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js` or `npm run test`

To use the dapp:

`truffle migrate`
`npm run dev`

To view dapp:

`http://localhost:3000`


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)