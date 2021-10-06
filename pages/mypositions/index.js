import { Box, Flex, Image, Link, SimpleGrid, SkeletonText, Text } from "@chakra-ui/core";
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import axios                    from "axios";
import { ethers }               from "ethers";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState }  from "react";
import { useWallet } from "use-wallet";

import { getBalanceOf, getTokenURI } from "../../contracts/erc721";
import { getWalletAddress, isWalletConnected } from "../../lib/wallet";

const base64  = require("base-64");
import {
    ETHPRICE_QUERY,
    POSITION_QUERY,
    UNI_V3_NFT_POSITIONS_ADDRESS,
    UNIBOND_ADDRESS,
    ONSALE_ASSETS_QUERY,
    UNIBOND_GRAPH_ENDPOINT,
    OWNED_ASSETS_QUERY,
    SUPPORT_ASSETS,
    UNIV3_GRAPH_ENDPOINT,
    x96,
    x128,
    POOL_QUERY,
    ZORA_SCORE_API,
    BLOCK_ENDPOINT,
    GET_BLOCK_QUERY,
    SCAN_LINK,
} from "../../utils/const";
import {
    isStableCoin,
    isWETH,
    get2DayChange,
    useDeltaTimestamps,
    formatDollarAmount,
} from "../../lib/helper";

const MyPositionPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const [v3Balance, setv3Balance] = useState("-");
    const [initiated, setInitiated] = useState(false);
    const [myItems, setMyItems] = useState([]);
    const [ethUSD, setETHUSD] = useState(0);
    const [zoraScore, setZoraScore] = useState("-");
    const [loading, setLoading] = useState(true);
    const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
    
    useEffect(async () => {
        let priceRes = await axios.post(graphqlEndpoint, {
          query: ETHPRICE_QUERY,
        });
        setETHUSD(parseFloat(priceRes.data.data.bundle.ethPriceUSD));
    }, []);

    const getChange2DayData = async (poolAddress) => {
        let poolRes = await axios.post(UNIV3_GRAPH_ENDPOINT, {
            query: POOL_QUERY(poolAddress, undefined),
        });
        const current = poolRes.data.data.pools[0];
        const [t24, t48, tWeek] = useDeltaTimestamps();
        let block24 = (await axios.post(BLOCK_ENDPOINT, {
            query: GET_BLOCK_QUERY(t24),
        })).data.data;
        const poolRes24 = await axios.post(UNIV3_GRAPH_ENDPOINT, {
            query: POOL_QUERY(poolAddress, block24.blocks[0].number),
        });
        const oneDay = poolRes24.data.data.pools[0];
        let block48 = (await axios.post(BLOCK_ENDPOINT, {
            query: GET_BLOCK_QUERY(t48),
        })).data.data;
        const poolRes48 = await axios.post(UNIV3_GRAPH_ENDPOINT, {
            query: POOL_QUERY(poolAddress, block48.blocks[0].number),
        });
        const twoDay = poolRes48.data.data.pools[0];

        const [volumeUSD, volumeUSDChange] =
            current && oneDay && twoDay
                ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
                : current
                ? [parseFloat(current.volumeUSD), 0]
                : [0, 0]
        const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

        const tvlUSDChange =
            current && oneDay
                ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
                    parseFloat(oneDay.totalValueLockedUSD)) *
                100
                : 0

        return {
            volumeUSD,
            volumeUSDChange,
            tvlUSD,
            tvlUSDChange
        }
    };

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

    const getPositionbySubGraph = async (tokenId) => {
        try {
            // The call to the subgraph
            let positionRes = await axios.post(UNIV3_GRAPH_ENDPOINT, {
                query: POSITION_QUERY.replace('%1', tokenId),
            });
            // Setting up some variables to keep things shorter & clearer
            let position = positionRes.data.data.position;
            let positionLiquidity = position.liquidity;
            let pool = position.pool;
            let decimalDifference =
            parseInt(position.token1.decimals, 10) -
            parseInt(position.token0.decimals, 10);
            // let [symbol_0, symbol_1] = [position.token0.symbol, position.token1.symbol];
        
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
            // let priceUpperAdjusted = parseFloat(position.tickUpper.price0) / Math.pow(10, decimalDifference);
            // let priceLowerAdjusted = parseFloat(position.tickLower.price0) / Math.pow(10, decimalDifference);
        
            // Prices (decimal adjusted and reversed)
            let priceCurrentAdjustedReversed = 1 / priceCurrentAdjusted;
            // let priceLowerAdjustedReversed = 1 / priceUpperAdjusted;
            // let priceUpperAdjustedReversed = 1 / priceLowerAdjusted;
        
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

            // for both token 0 and token 1
            let tickLowerFeeGrowthBelow_0;
            let tickLowerFeeGrowthBelow_1;
            let tickUpperFeeGrowthAbove_0;
            let tickUpperFeeGrowthAbove_1;

            // for both token 0 and token 1
            if (tickCurrent >= tickUpper) {
                tickUpperFeeGrowthAbove_0 = feeGrowthGlobal_0 - tickUpperFeeGrowthOutside_0;
                tickUpperFeeGrowthAbove_1 = feeGrowthGlobal_1 - tickUpperFeeGrowthOutside_1;
            } else {
                tickUpperFeeGrowthAbove_0 = tickUpperFeeGrowthOutside_0;
                tickUpperFeeGrowthAbove_1 = tickUpperFeeGrowthOutside_1;
            }

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

            // for both token 0 and token 1 since we now know everything that is needed to compute it
            let uncollectedFees_0 = positionLiquidity * (fr_t1_0 - feeGrowthInsideLast_0);
            let uncollectedFees_1 = positionLiquidity * (fr_t1_1 - feeGrowthInsideLast_1);
        
            // Decimal adjustment to get final results
            let uncollectedFeesAdjusted_0 = uncollectedFees_0 / Math.pow(10, position.token0.decimals);
            let uncollectedFeesAdjusted_1 = uncollectedFees_1 / Math.pow(10, position.token1.decimals);
            // UNCOLLECTED FEES END ----------------------------------------------------------------------------------
            const twodayChgInfo = await getChange2DayData(position.pool.id);
            return {
                token0: position.token0.id,
                token1: position.token1.id,
                liquidity: positionLiquidity,
                amount0: amount_0_Adjusted,
                amount1: amount_1_Adjusted,
                curPrice: priceCurrentAdjustedReversed,
                fee0: uncollectedFeesAdjusted_0,
                fee1: uncollectedFeesAdjusted_1,
                twodayChgInfo,
                poolAddress: position.pool.id
            };
        } catch (e) {
            console.log("Error", e)
        }
    }

    const getLiquidityValue = (position) => {
        const { curPrice, token0, token1, amount0, amount1, liquidity } = position;
        if (!liquidity || !parseInt(liquidity)) return "-";
        let usdLiq = 0;
        if (isStableCoin(token1)) {
            usdLiq = amount0 / curPrice + amount1;
        } else if (isStableCoin(token0)) {
            usdLiq = amount1 * curPrice + amount0;
        } else if (isWETH(token1)) {
            usdLiq = amount0 / curPrice * ethUSD + amount1 * ethUSD;
        } else if (isWETH(token0)) {
            usdLiq = amount1 * curPrice * ethUSD + amount0 * ethUSD;
        } else {
            return "-";
        }
        if (usdLiq > 1) return usdLiq.toFixed(2);
        if (usdLiq >= 0.00001) return usdLiq.toFixed(6);
        return "<0.00001";
    }

    const getFeeValue = (position) => {
        const { curPrice, token0, token1, fee0, fee1, liquidity } = position;
        if (!liquidity || !parseInt(liquidity)) return "-";
        let usdLiq = 0;
        if (isStableCoin(token1)) {
            usdLiq = fee0 / curPrice + fee1;
        } else if (isStableCoin(token0)) {
            usdLiq = fee1 * curPrice + fee0;
        } else if (isWETH(token1)) {
            usdLiq = fee0 / curPrice * ethUSD + fee1 * ethUSD;
        } else if (isWETH(token0)) {
            usdLiq = fee1 * curPrice * ethUSD + fee0 * ethUSD;
        } else {
            return "-";
        }
        if (usdLiq > 1) return usdLiq.toFixed(2);
        if (usdLiq >= 0.00001) return usdLiq.toFixed(6);
        return "<0.00001";
    }

    useEffect(async () => {
        if (!initiated && isWalletConnected(wallet)) {
            setInitiated(true);
            try {
                const address = getWalletAddress(wallet);
                const res = await axios.get(ZORA_SCORE_API + address);
                if (res && res.data) {
                    const rating = parseFloat(res.data.result.rating);
                    setZoraScore(rating / 8);
                }
            } catch (e) {
            }
            try {
                const provider = new ethers.providers.Web3Provider(wallet.ethereum);
                const signer = await provider.getSigner();
                const address = getWalletAddress(wallet);
                const bal = await getBalanceOf(UNI_V3_NFT_POSITIONS_ADDRESS, address, signer);
                setv3Balance(bal);

                let promises = [];
                let _swapList = [];

                const ownedAssets = await axios.post(UNIBOND_GRAPH_ENDPOINT, {
                    query: OWNED_ASSETS_QUERY.replace('%1', address),
                });
                let assets = ownedAssets.data.data.tokenHolders;
                for (let i = 0; i < assets.length; i ++) {
                    const _swap = assets[i];
                    promises.push(getTokenURI(UNI_V3_NFT_POSITIONS_ADDRESS, _swap.tokenId, provider));
                }
                let promiseResult = await Promise.all(promises);
                for(let i = 0; i < promiseResult.length; i ++) {
                    const parts = promiseResult[i].split(",");
                    const bytes = base64.decode(parts[1]);
                    let jsonData = JSON.parse(bytes);
                    jsonData.tokenId = assets[i].tokenId;
                    const pos = await getPositionbySubGraph(assets[i].tokenId);
                    jsonData.assetValue = getLiquidityValue(pos);
                    jsonData.feeValue = getFeeValue(pos);
                    jsonData.chgData = pos.twodayChgInfo;
                    jsonData.poolAddress = pos.poolAddress;
                    _swapList.push(jsonData);
                }
                setMyItems([..._swapList])
                setLoading(false);
            } catch (e) {
                console.log(e);
                setInitiated(false);
            } finally {
            }
        }
    }, [wallet]);

    const v3BalanceStr = useMemo(() => {
        if (v3Balance === "-") {
            return "My Uniswap V3 positions (-)";
        }
        return `My Uniswap V3 positions (${v3Balance})`;
    }, [v3Balance]);

    const renderDetailItem = (oName, value) => {
        return (
            <Flex flexDirection="row" m="3px 0">
                <Text minW="140px" color="rgb(195, 197, 203)">{oName}</Text>
                <Box w="10px" h="10px" borderRadius="100%" bg="none" m="auto 10px"/>
                <Text fontWeight="bold">{value}</Text>
            </Flex>
        );
    };

    const renderDetailItem24 = (oName, value, percent) => {
        return (
            <Flex flexDirection="row" m="3px 0">
                <Text minW="140px" color="rgb(195, 197, 203)">{oName}</Text>
                <Box w="10px" h="10px" borderRadius="100%" bg="none" m="auto 10px"/>
                <Flex flexDirection="row">
                    <Text fontWeight="bold" mr="3px">{value}</Text>
                    {percent && parseFloat(percent) > 0 ? <ArrowUpIcon m="auto 0" color="rgb(39, 174, 96)"/> : <ArrowDownIcon m="auto 0" color="rgb(253, 64, 64)"/>}
                    <Text color={percent && parseFloat(percent) > 0 ? "rgb(39, 174, 96)" : "rgb(253, 64, 64)"}>
                        ({percent ? parseFloat(percent).toFixed(2): "0.00"}%)
                    </Text>
                </Flex>
            </Flex>
        );
    }

    const zoraScoreStr = useMemo(() => {
        if (zoraScore === "-") return "-";
        return parseInt(zoraScore) + "%";
    }, [zoraScore]);

    return (
        <Box w="100%" mt="6rem" minHeight="71vh" color="#000">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Flex flexDirection="row" justifyContent="space-between" mb="30px">
                    <Flex flexDirection="row">
                        <Image src="/images/tokenpage/avatar.png" alt="/" w={14}/>
                        <Flex flexDirection="column" m="auto 1rem">
                            <Text fontWeight="bold">Welcome</Text>
                            <Text fontWeight="bold">{zoraScoreStr} ZORA SCORE</Text>
                        </Flex>
                    </Flex>
                    <Flex flexDirection="row">
                        <Image src="/images/tokenpage/uni.png" alt="/" w={14} borderRadius="100%"/>
                        <Text fontWeight="bold" m="auto 1rem" fontSize="20px">{v3BalanceStr}</Text>
                    </Flex>
                    <Flex>
                    </Flex>
                </Flex>
                {loading &&
                    <Box padding="6" boxShadow="lg">
                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                    </Box>
                }
                <SimpleGrid spacing="2rem" minChildWidth="35rem" w="100%">
                    {myItems.map((item, index) => {
                        console.log(item)
                        return (
                            <Flex key={index} borderRadius="20px" p="20px 30px" flexDirection="row" bg="#41444F">
                                <Image src={item.image} alt="/" maxW="140px" mr="30px"/>
                                <Flex flexDirection="column" mt="15px">
                                    {renderDetailItem("Asset Value:", "$ " + item.assetValue)}
                                    {renderDetailItem("Unclaimed Fees:", "$ " + item.feeValue)}
                                    {renderDetailItem("LP Risk Profile:","-")}
                                    {renderDetailItem24("Volume 24h:", formatDollarAmount(item.chgData.volumeUSD), item.chgData.volumeUSDChange)}
                                    {renderDetailItem24("TVL:", formatDollarAmount(item.chgData.tvlUSD), item.chgData.tvlUSDChange)}
                                    <Flex bg="#2D81FF" m="15px auto 0 0" p="3px 30px" borderRadius="10px"
                                        cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s"
                                        onClick={() => {
                                            router.push("/pools/" + item.tokenId)
                                        }}
                                    >
                                        <Text>View</Text>
                                    </Flex>
                                </Flex>
                                <Flex ml="auto">
                                    <Link isExternal href={SCAN_LINK + "/address/" + item.poolAddress}>
                                        <ExternalLinkIcon/>
                                    </Link>
                                </Flex>
                            </Flex>
                        )
                    })}
                    <Box/>
                </SimpleGrid>
            </Flex>
        </Box>
    );
}

export default MyPositionPage;