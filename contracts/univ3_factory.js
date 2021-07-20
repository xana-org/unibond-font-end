import { ethers } from "ethers";
import abi from "./univ3_factory.abi.json";

export async function getPool(addr, token0, token1, fee, signer) {
    try {
        const contract = new ethers.Contract(addr, abi, signer);
        const poolAddr = await contract.getPool(token0, token1, fee);
        return poolAddr;
    } catch (e) {
        return null;
    }
}