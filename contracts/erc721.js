import { ethers } from "ethers";
import abi from './erc721.abi.json';
import { isTransactionMined } from "../lib/helper";

export async function getBalanceOf(address, wallet, signer) {
  try {
      const erc721 = new ethers.Contract(address, abi, signer);
      const balance = await erc721.balanceOf(wallet);
      return balance.toString();
  } catch (e) {
      return "";
  }
}

export async function getTokenURI(address, tokenId, signer) {
  try {
      const erc721 = new ethers.Contract(address, abi, signer);
      const res = await erc721.tokenURI(tokenId);
      return res;
  } catch (e) {
      return "";
  }
}

export async function isApprovedForAll(address, owner, operator, signer) {
    try {
        const erc721 = new ethers.Contract(address, abi, signer);
        const res = await erc721.isApprovedForAll(owner, operator);
        return res;
    } catch (e) {
        return false;
    }
}

export async function setApprovalForAll(address, operator, signer) {
    try {
        const erc721 = new ethers.Contract(address, abi, signer);
        const { hash } = await erc721.setApprovalForAll(operator, true);
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
