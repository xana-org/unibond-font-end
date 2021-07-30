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
        return "";
    }
}
