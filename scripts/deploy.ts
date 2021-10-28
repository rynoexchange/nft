const RynoNFTMarket = artifacts.require('RynoNFTMarket');

async function main() {
  const market = await RynoNFTMarket.new();
  console.log("Market deployed to:", market.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });