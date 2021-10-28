import { RynoNFTMarketInstance, TestTokenInstance } from '../typechain';
import { ONE_DAY, setTime, throwsError, toWei, TWO_WEEKS, ZERO_ADDRESS } from './support';
import BN from 'bn.js';

const Market = artifacts.require('RynoNFTMarket');
const TestToken = artifacts.require('TestToken');

describe('Token', () => {
  let market: RynoNFTMarketInstance;
  let accounts: string[];

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    market = await Market.new({ from: accounts[9] });
  });

  describe('createListing', () => {
    let tokenA: TestTokenInstance;
    let tokenB: TestTokenInstance;

    beforeEach(async () => {
      tokenA = await TestToken.new('Token A', 'TOKA');
      await tokenA.mint(1);
      await tokenA.mint(2);
      await tokenA.approve(market.address, 2);
      tokenB = await TestToken.new('Token B', 'TOKB');
    });

    it('returns error if price is below minPrice', () => {
      return throwsError(() => market.createListing(tokenA.address, 1, toWei(0.9)))
    });

    it('returns error if price is above maxPrice', () => {
      return throwsError(() => market.createListing(tokenA.address, 1, toWei(100_000_001)))
    });

    it('returns error if it is already added', async () => {
      await market.createListing(tokenA.address, 2, toWei(100));
      await throwsError(() => market.createListing(tokenA.address, 2, toWei(10)));
    });

    it('transfers the token to the market', async () => {
      await market.createListing(tokenA.address, 2, toWei(100));
      expect(await tokenA.ownerOf(2)).to.eq(market.address);
    });
  });

  describe('removeListing', () => {
    let tokenA: TestTokenInstance;
    let tokenB: TestTokenInstance;

    beforeEach(async () => {
      tokenA = await TestToken.new('Token A', 'TOKA');
      await tokenA.mint(1);
      await tokenA.mint(2);
      await tokenA.approve(market.address, 1);
      tokenB = await TestToken.new('Token B', 'TOKB');
    });

    it('throws error if sender is not owner', async () => {
      await market.createListing(tokenA.address, 1, toWei(10));
      await throwsError(() => market.removeListing(tokenA.address, 1, { from: accounts[1] }));
    });

    it('transfers the token back and deleted listing', async () => {
      await market.createListing(tokenA.address, 1, toWei(10));
      expect(await tokenA.ownerOf(1)).to.eq(market.address);

      await market.removeListing(tokenA.address, 1);
      expect(await tokenA.ownerOf(1)).to.eq(accounts[0]);

      expect((await market.listingOf(tokenA.address, 1))[0]).to.eq(ZERO_ADDRESS);
    });
  });

  describe('buyListing', () => {
    let tokenA: TestTokenInstance;
    let tokenB: TestTokenInstance;

    beforeEach(async () => {
      tokenA = await TestToken.new('Token A', 'TOKA');
      await tokenA.mint(1);
      await tokenA.mint(2);
      await tokenA.approve(market.address, 1);
      tokenB = await TestToken.new('Token B', 'TOKB');
    });

    it('throws error if amount is different', async () => {
      await market.createListing(tokenA.address, 1, toWei(10));
      await throwsError(() => market.buyListing(tokenA.address, 1, { from: accounts[2], value: toWei(20) }));
    });

    it('removes listing', async () => {
      await market.createListing(tokenA.address, 1, toWei(10));
      await market.buyListing(tokenA.address, 1, { from: accounts[2], value: toWei(10) });
      const listing = await market.listingOf(tokenA.address, 1);
      expect(listing[0]).to.eq(ZERO_ADDRESS);
    });

    it('transfer token to buyer', async () => {
      await market.createListing(tokenA.address, 1, toWei(10));
      await market.buyListing(tokenA.address, 1, { from: accounts[2], value: toWei(10) });
      const owner = await tokenA.ownerOf(1);
      expect(owner).to.eq(accounts[2]);
    });

    it('transfer amount to seller and fee to owner', async () => {
      await market.createListing(tokenA.address, 1, toWei(1000));
      const firstBalance = new BN(await web3.eth.getBalance(accounts[0]));

      await market.buyListing(tokenA.address, 1, { value: toWei(1000), from: accounts[2] });
      const lastBalance = await web3.eth.getBalance(accounts[0]);

      expect(await tokenA.ownerOf(1)).to.eq(accounts[2]);
      expect(firstBalance.add(new BN(toWei(995))).toString()).to.eq(lastBalance);
    });
  });
});
