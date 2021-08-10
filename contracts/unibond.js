import { ethers } from "ethers";
import abi from './unibond.abi.json';
import { isTransactionMined } from "../lib/helper";

export async function createSwap(address, tokenId, payToken, amount, assetType, signer) {
    try {
      const unibond = new ethers.Contract(address, abi, signer);
      const { hash } = await unibond.createSwap(
          tokenId,
          payToken,
          amount,
          assetType
      );
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
    console.log(e);
      return "";
  }
}

export async function cancelSwap(address, swapId, signer) {
  try {
    const unibond = new ethers.Contract(address, abi, signer);
    const { hash } = await unibond.closeSwap(swapId);
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
    console.log(e);
      return "";
  }
}

export async function swapWithETH(address, amount, swapId, signer) {
  try {
    const unibond = new ethers.Contract(address, abi, signer);
    const { hash } = await unibond.swapWithETH(swapId, {value: ethers.utils.parseEther(amount + "")});
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
    console.log(e);
      return "";
  }
}

export async function swapWithToken(address, swapId, signer) {
  try {
    const unibond = new ethers.Contract(address, abi, signer);
    const { hash } = await unibond.swapWithToken(swapId);
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
    console.log(e);
      return "";
  }
}