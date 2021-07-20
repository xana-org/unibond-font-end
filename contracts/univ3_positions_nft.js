import { ethers } from "ethers";
import abi from "./univ3_positions_nft.abi.json";

export async function getTotalSupply(addr, signer) {
    try {
        const contract = new ethers.Contract(addr, abi, signer);
        const tSupply = await contract.totalSupply();
        return tSupply.toString();
    } catch (e) {
        return null;
    }
}

export async function getPosition(addr, id, signer) {
    try {
        const contract = new ethers.Contract(addr, abi, signer);
        const position = await contract.positions(id);
        return position;
    } catch (e) {
        return null;
    }
}