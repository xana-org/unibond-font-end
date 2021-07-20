import { ethers, BigNumber } from "ethers";
import abi from "./univ3_pool.abi.json";

export async function getSlot0(addr, signer) {
    try {
        const contract = new ethers.Contract(addr, abi, signer);
        const slot = await contract.slot0();
        return slot;
    } catch (e) {
        return null;
    }
}

export async function getToken0(addr, signer) {
    try {
        const contract = new ethers.Contract(addr, abi, signer);
        const slot = await contract.token0();
        return slot;
    } catch (e) {
        return null;
    }
}