import Web3 from "web3";

export async function throwsError(body: () => Promise<unknown>) {
  try {
    await body();
  } catch(e) {
    return true;
  }

  throw new Error('This does not throw error!');
}

export async function setTime(time: number, mine?: boolean) {
  const provider = web3.currentProvider as any;
  await new Promise(resolve => provider.send({ method: "evm_setNextBlockTimestamp", params: [time] }, resolve));

  if (mine) {
    await new Promise(resolve => provider.send({ method: "evm_mine" }, resolve));
  }
}

export function toWei(value: string | number) {
  return Web3.utils.toWei(value.toString(), 'ether');
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ONE_DAY = 86400;
export const TWO_WEEKS = 1209600;