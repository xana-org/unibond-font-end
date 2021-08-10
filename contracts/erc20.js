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

export async function getAllowance(coinAddress, owner, operator, signer) {
  try {
    const erc20 = new ethers.Contract(coinAddress, abi, signer);
    const allownce = await erc20.allowance(owner, operator);
    return allownce.toString();
  } catch (e) {
    return "";
  }
}

export async function approveAsset(coinAddress, operator, signer) {
  try {
    const erc20 = new ethers.Contract(coinAddress, abi, signer);
    const { hash } = await erc20.approve(operator, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
    try {
      while (true) {
        let mined = await isTransactionMined(hash);
        if (mined) break;
      }
    } catch (e) {
      console.error(e);
      return "";
    }
    return hash;
  } catch (e) {
    return "";
  }
}