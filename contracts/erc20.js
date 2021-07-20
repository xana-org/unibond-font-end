import { ethers } from "ethers";
import abi from './erc20.abi.json';
import { isTransactionMined } from "../lib/helper";
import {
  WETH_ADDRESS
} from "../utils/const";

export async function getSymbol(coinAddress, signer) {
  if (coinAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) return "ETH";
  try {
    const erc20 = new ethers.Contract(coinAddress, abi, signer);
    const symbol = await erc20.symbol();
    return symbol;
  } catch (e) {
    return null;
  }
}

export async function getDecimals(coinAddress, signer) {
  if (coinAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) return 18;
  try {
    const erc20 = new ethers.Contract(coinAddress, abi, signer);
    const decimals = await erc20.decimals();
    return decimals;
  } catch (e) {
    return 0;
  }
}

export async function getTotalSupply(coinAddress, signer) {
  try {
    const erc20 = new ethers.Contract(coinAddress, abi, signer);
    const total = await erc20.totalSupply();
    return total.toString();

  } catch (e) {
    return "0";
  }
}
