import { ethers } from "ethers";
import axios from "axios";
import dayjs from 'dayjs';
import numbro from 'numbro';
import {
  UNIV3_GRAPH_ENDPOINT,
  POSITION_QUERY,
} from "../utils/const";
import Big from "big.js";
const x96 = Math.pow(2, 96);
const x128 = Math.pow(2, 128);

export function unixToDate(unix, format = 'YYYY-MM-DD') {
    return dayjs.unix(unix).format(format)
}

export const isTransactionMined = async (transactionHash) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const txReceipt = await provider.getTransactionReceipt(transactionHash);
    if (txReceipt && txReceipt.blockNumber) {
      return true;
    }
    return false;
}

export const formatAmount = (num, digits = 2) => {
    if (num === 0) return '0'
    if (!num) return '-'
    if (num < 0.001) {
        return '<0.001'
    }
    return numbro(num).format({
        average: true,
        mantissa: num > 1000 ? 2 : digits,
        abbreviations: {
            million: 'M',
            billion: 'B',
        },
    })
}
export const formatDollarAmount = (num, digits = 2, round = true) => {
    if (num === 0) return '$0.00'
    if (!num) return '-'
    if (num < 0.001 && digits <= 3) {
        return '<$0.001'
    }
  
    return numbro(num).formatCurrency({
        average: round,
        mantissa: num > 1000 ? 2 : digits,
        abbreviations: {
            million: 'M',
            billion: 'B',
        },
    })
}

export const useDeltaTimestamps = () => {
    const utcCurrentTime = dayjs()
    const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
    const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
    const t3 = utcCurrentTime.subtract(3, 'day').startOf('minute').unix()
    const t4 = utcCurrentTime.subtract(4, 'day').startOf('minute').unix()
    const t5 = utcCurrentTime.subtract(5, 'day').startOf('minute').unix()

    const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix()
    return [t1, t2,t3,t4,t5, tWeek]
}

export const get2DayChange = (valueNow, value24HoursAgo, value48HoursAgo) => {
    // get volume info for both 24 hour periods
    const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)
    const previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo)
    const adjustedPercentChange = ((currentChange - previousChange) / previousChange) * 100
    if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
        return [currentChange, 0]
    }
    return [currentChange, adjustedPercentChange]
}

const sqrtPriceToPriceAdjusted = (sqrtPriceX96Prop, decimalDifference) => {
    let sqrtPrice = parseFloat(sqrtPriceX96Prop) / x96;
    let divideBy = Math.pow(10, decimalDifference);
    let price = Math.pow(sqrtPrice, 2) / divideBy;
    return price;
}

const sqrtPriceToPrice = (sqrtPriceX96Prop) => {
    let sqrtPrice = parseFloat(sqrtPriceX96Prop) / x96;
    let price = Math.pow(sqrtPrice, 2);
    return price;
}

export const getPositionData = async (id, _regTokens, blockNumber = undefined) => {
    try {
        // The call to the subgraph
        let positionRes = await axios.post(UNIV3_GRAPH_ENDPOINT, {
            query: POSITION_QUERY(id, blockNumber),
        });
        // Setting up some variables to keep things shorter & clearer
        let position = positionRes.data.data.position;
        let positionLiquidity = position.liquidity;
        let pool = position.pool;
        let decimalDifference = parseInt(position.token1.decimals, 10) - parseInt(position.token0.decimals, 10);
        let [symbol_0, symbol_1] = [position.token0.symbol, position.token1.symbol];

        // Prices (not decimal adjusted)
        let priceCurrent = sqrtPriceToPrice(pool.sqrtPrice);
        let priceUpper = parseFloat(position.tickUpper.price0);
        let priceLower = parseFloat(position.tickLower.price0);

        // Square roots of the prices (not decimal adjusted)
        let priceCurrentSqrt = parseFloat(pool.sqrtPrice) / Math.pow(2, 96);
        let priceUpperSqrt = Math.sqrt(parseFloat(position.tickUpper.price0));
        let priceLowerSqrt = Math.sqrt(parseFloat(position.tickLower.price0));

        // Prices (decimal adjusted)
        let priceCurrentAdjusted = sqrtPriceToPriceAdjusted(pool.sqrtPrice, decimalDifference);
        let priceUpperAdjusted = parseFloat(position.tickUpper.price0) / Math.pow(10, decimalDifference);
        let priceLowerAdjusted = parseFloat(position.tickLower.price0) / Math.pow(10, decimalDifference);

        // Prices (decimal adjusted and reversed)
        let priceCurrentAdjustedReversed = 1 / priceCurrentAdjusted;
        let priceLowerAdjustedReversed = 1 / priceUpperAdjusted;
        let priceUpperAdjustedReversed = 1 / priceLowerAdjusted;

        // The amount calculations using positionLiquidity & current, upper and lower priceSqrt
        let amount_0, amount_1;
        if (priceCurrent <= priceLower) {
            amount_0 = positionLiquidity * (1 / priceLowerSqrt - 1 / priceUpperSqrt);
            amount_1 = 0;
        } else if (priceCurrent < priceUpper) {
            amount_0 = positionLiquidity * (1 / priceCurrentSqrt - 1 / priceUpperSqrt);
            amount_1 = positionLiquidity * (priceCurrentSqrt - priceLowerSqrt);
        } else {
            amount_1 = positionLiquidity * (priceUpperSqrt - priceLowerSqrt);
            amount_0 = 0;
        }

        // Decimal adjustment for the amounts
        let amount_0_Adjusted = amount_0 / Math.pow(10, position.token0.decimals);
        let amount_1_Adjusted = amount_1 / Math.pow(10, position.token1.decimals);

        // UNCOLLECTED FEES --------------------------------------------------------------------------------------
        // Check out the relevant formulas below which are from Uniswap Whitepaper Section 6.3 and 6.4

        // These will be used for both tokens' fee amounts
        let tickCurrent = parseFloat(position.pool.tick);
        let tickLower = parseFloat(position.tickLower.tickIdx);
        let tickUpper = parseFloat(position.tickUpper.tickIdx);

        // Global fee growth per liquidity '��' for both token 0 and token 1
        let feeGrowthGlobal_0 = parseFloat(position.pool.feeGrowthGlobal0X128) / x128;
        let feeGrowthGlobal_1 = parseFloat(position.pool.feeGrowthGlobal1X128) / x128;

        // Fee growth outside '��' of our lower tick for both token 0 and token 1
        let tickLowerFeeGrowthOutside_0 = parseFloat(position.tickLower.feeGrowthOutside0X128) / x128;
        let tickLowerFeeGrowthOutside_1 = parseFloat(position.tickLower.feeGrowthOutside1X128) / x128;

        // Fee growth outside '��' of our upper tick for both token 0 and token 1
        let tickUpperFeeGrowthOutside_0 = parseFloat(position.tickUpper.feeGrowthOutside0X128) / x128;
        let tickUpperFeeGrowthOutside_1 = parseFloat(position.tickUpper.feeGrowthOutside1X128) / x128;
        

        // These are '��(��)' and '��(��)' from the formula
        // for both token 0 and token 1
        let tickLowerFeeGrowthBelow_0;
        let tickLowerFeeGrowthBelow_1;
        let tickUpperFeeGrowthAbove_0;
        let tickUpperFeeGrowthAbove_1;

        // These are the calculations for '��(�)' from the formula
        // for both token 0 and token 1
        if (tickCurrent >= tickUpper) {
            tickUpperFeeGrowthAbove_0 = feeGrowthGlobal_0 - tickUpperFeeGrowthOutside_0;
            tickUpperFeeGrowthAbove_1 = feeGrowthGlobal_1 - tickUpperFeeGrowthOutside_1;
        } else {
            tickUpperFeeGrowthAbove_0 = tickUpperFeeGrowthOutside_0;
            tickUpperFeeGrowthAbove_1 = tickUpperFeeGrowthOutside_1;
        }

        // These are the calculations for '�b(�)' from the formula
        // for both token 0 and token 1
        if (tickCurrent >= tickLower) {
            tickLowerFeeGrowthBelow_0 = tickLowerFeeGrowthOutside_0;
            tickLowerFeeGrowthBelow_1 = tickLowerFeeGrowthOutside_1;
        } else {
            tickLowerFeeGrowthBelow_0 = feeGrowthGlobal_0 - tickLowerFeeGrowthOutside_0;
            tickLowerFeeGrowthBelow_1 = feeGrowthGlobal_1 - tickLowerFeeGrowthOutside_1;
        }

        // for both token 0 and token 1
        let fr_t1_0 = feeGrowthGlobal_0 - tickLowerFeeGrowthBelow_0 - tickUpperFeeGrowthAbove_0;
        let fr_t1_1 = feeGrowthGlobal_1 - tickLowerFeeGrowthBelow_1 - tickUpperFeeGrowthAbove_1;

        // for both token 0 and token 1
        let feeGrowthInsideLast_0 = parseFloat(position.feeGrowthInside0LastX128) / x128;
        let feeGrowthInsideLast_1 = parseFloat(position.feeGrowthInside1LastX128) / x128;

        // The final calculations for the '�� =�·(��(�1)−��(�0))' uncollected fees formula
        // for both token 0 and token 1 since we now know everything that is needed to compute it
        let uncollectedFees_0 = new Big(positionLiquidity).times(fr_t1_0 - feeGrowthInsideLast_0);
        let uncollectedFees_1 = new Big(positionLiquidity).times(fr_t1_1 - feeGrowthInsideLast_1);

        // Decimal adjustment to get final results
        // let uncollectedFeesAdjusted_0 = uncollectedFees_0 / Math.pow(10, position.token0.decimals);
        let uncollectedFeesAdjusted_0 = uncollectedFees_0.div(Math.pow(10, position.token0.decimals));
        // let uncollectedFeesAdjusted_1 = uncollectedFees_1 / Math.pow(10, position.token1.decimals);
        let uncollectedFeesAdjusted_1 = uncollectedFees_1.div(Math.pow(10, position.token1.decimals));
        // UNCOLLECTED FEES END ----------------------------------------------------------------------------------

        const img0 = _regTokens.find(token => token.address.toLowerCase() === position.token0.id.toLowerCase());
        const img1 = _regTokens.find(token => token.address.toLowerCase() === position.token1.id.toLowerCase());
        return {
            poolAddr: pool.id,
            tickLower,
            tickUpper,
            tick: tickCurrent,
            token0: position.token0.id,
            token1: position.token1.id,
            symbol0: symbol_0,
            symbol1: symbol_1,
            fee: parseInt(position.pool.feeTier),
            liquidity: positionLiquidity,
            img0: symbol_0 === "ETH" ? "/images/assets/eth.png": ((img0 && img0.logoURI) ? img0.logoURI : "/images/assets/infinite.svg"),
            img1: symbol_1 === "ETH" ? "/images/assets/eth.png": ((img1 && img1.logoURI) ? img1.logoURI : "/images/assets/infinite.svg"),
            //   decimals0: parseInt(position.token0.decimals),
            //   decimals1: parseInt(position.token1.decimals),
            amount0: amount_0_Adjusted,
            amount1: amount_1_Adjusted,
            curPrice: priceCurrentAdjustedReversed,
            //   lowerPrice: priceLowerAdjustedReversed,
            //   upperPrice: priceUpperAdjustedReversed,
            fee0: uncollectedFeesAdjusted_0,
            fee1: uncollectedFeesAdjusted_1,
            owner: position.owner,
        };
    } catch (e) {
        console.log("Error", e);
        return null;
    }
}

export const isStableCoin  = (addr) => {
    const coins = [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC,
        "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT,
        "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI,
        "0x71fc860F7D3A592A4a98740e39dB31d25db65ae8", // aUSDT,
        "0x4fabb145d64652a948d72533023f6e7a623c7c53", // BUSD
    ];
    for(let i = 0; i < coins.length; i ++)
        if(addr.toLowerCase() === coins[i].toLowerCase()) return true;
    return false;
}

export const isWETH = (addr) => {
    const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    if (addr.toLowerCase() === weth.toLowerCase()) return true;
    return false;
}