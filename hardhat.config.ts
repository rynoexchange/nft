import '@typechain/hardhat';
import '@nomiclabs/hardhat-truffle5';
import 'hardhat-tracer';

const config = {
  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1500
          }
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain",
    target: "truffle-v5",
  }
};

if (process.env.PRIVATE_KEY) {
  config['networks'] = {
    poa: {
      url: 'https://core.poa.network',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 99,
      gasPrice: 20000000000
    }
  }
}

export default config;