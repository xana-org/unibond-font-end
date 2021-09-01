import { useEffect, useState }  from "react";
import { useRouter }            from "next/router";
import axios                    from "axios";
import { ethers }               from "ethers";
import { useWallet }            from "use-wallet";
import {
    Flex, 
    Box,
    Text,
    Link,
    Spinner,
    Image,
    useToast,
} from "@chakra-ui/core";
import {
    ExternalLinkIcon
} from "@chakra-ui/icons";
import {
    POSITION_QUERY,
    COINGECKO_URL,
    UNI_V3_NFT_POSITIONS_ADDRESS,
    ETHPRICE_QUERY,
    UNIV3_GRAPH_ENDPOINT,
    JSON_PROVIDER,
    SCAN_LINK,
    UNIBOND_GRAPH_ENDPOINT,
    IS_ON_SALE_QUERY,
    SUPPORT_ASSETS,
    UNIBOND_ADDRESS,
} from "../../utils/const";
import {
    getTokenURI,
} from "../../contracts/erc721";
import {
    approveAsset,
    getAllowance,
} from "../../contracts/erc20";
import {
    getOwnerOf
} from "../../contracts/univ3_positions_nft";
import {
    getWalletAddress
} from "../../lib/wallet";
import {
    swapWithETH,
    swapWithToken,
} from "../../contracts/unibond";
import {
    isStableCoin,
    isWETH
} from "../../lib/helper";
const base64  = require("base-64");
import BigNumber from "bignumber.js";

const TokenPage = () => {
    const wallet = useWallet();
    const toast = useToast();
    const [uni_v3_nft, setUniV3NFT] = useState(null);
    const [tokenId, setTokenId] = useState(0);
    const [position, setPosition] = useState(null);
    const [order, setOrder] = useState(false);
    const [regTokens, setRegTokens] = useState([]);
    const [ethUSD, setETHUSD] = useState(0);
    const router = useRouter();
    const [saleInfo, setSaleInfo] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [approved, setApproved] = useState(false);
    const [formatted, setFormatted] = useState(false);

    // Constants ---------------------------------------------------------------
    const x96 = Math.pow(2, 96);
    const x128 = Math.pow(2, 128);
    const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/cryptodev7/univ3rinkeby';
    //const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';

    useEffect(async () => {
        if (wallet && wallet.ethereum && !formatted && saleInfo) {
            setFormatted(true);
            try {
                const provider = new ethers.providers.Web3Provider(wallet.ethereum);
                const walletAddr = getWalletAddress(wallet);
                const allowance = await getAllowance(saleInfo.payToken, walletAddr, UNIBOND_ADDRESS, provider);
                const bA = new BigNumber(allowance);
                if (bA.greaterThanOrEqualTo(saleInfo.amount)) setApproved(true);
                else setApproved(false);
                } catch (e) {
                    console.log(e);
            }
        }
    }, [wallet]);
    
    useEffect(() => {
        if (router.query && router.query.id) {
            initialize(router.query.id);
            checkIsOnSale(router.query.id);
        }
    }, [router]);

    const checkIsOnSale = async (id) => {
        let { data } = await axios.post(UNIBOND_GRAPH_ENDPOINT, {
            query: IS_ON_SALE_QUERY.replace('%1', id),
        });
        if (data && data.data && data.data.swapLists) {
            const _swapLists = data.data.swapLists;
            if (_swapLists.length) {
                setSaleInfo(_swapLists[0]);
            }
        }
    }

    const getPositionbySubGraph = async (id, _regTokens) => {
        try {
            // The call to the subgraph
            let positionRes = await axios.post(UNIV3_GRAPH_ENDPOINT, {
                query: POSITION_QUERY.replace('%1', id),
            });
            // Setting up some variables to keep things shorter & clearer
            let position = positionRes.data.data.position;
            let positionLiquidity = position.liquidity;
            let pool = position.pool;
            let decimalDifference =
            parseInt(position.token1.decimals, 10) -
            parseInt(position.token0.decimals, 10);
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
            let priceCurrentAdjusted = sqrtPriceToPriceAdjusted(
            pool.sqrtPrice,
            decimalDifference
            );
            let priceUpperAdjusted =
            parseFloat(position.tickUpper.price0) / Math.pow(10, decimalDifference);
            let priceLowerAdjusted =
            parseFloat(position.tickLower.price0) / Math.pow(10, decimalDifference);
        
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
            let tickLowerFeeGrowthOutside_0 =
            parseFloat(position.tickLower.feeGrowthOutside0X128) / x128;
            let tickLowerFeeGrowthOutside_1 =
            parseFloat(position.tickLower.feeGrowthOutside1X128) / x128;
        
            // Fee growth outside '��' of our upper tick for both token 0 and token 1
            let tickUpperFeeGrowthOutside_0 =
            parseFloat(position.tickUpper.feeGrowthOutside0X128) / x128;
            let tickUpperFeeGrowthOutside_1 =
            parseFloat(position.tickUpper.feeGrowthOutside1X128) / x128;
            
        
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
            let fr_t1_0 =
            feeGrowthGlobal_0 - tickLowerFeeGrowthBelow_0 - tickUpperFeeGrowthAbove_0;
            let fr_t1_1 =
            feeGrowthGlobal_1 - tickLowerFeeGrowthBelow_1 - tickUpperFeeGrowthAbove_1;
        
            // for both token 0 and token 1
            let feeGrowthInsideLast_0 =
            parseFloat(position.feeGrowthInside0LastX128) / x128;
            let feeGrowthInsideLast_1 =
            parseFloat(position.feeGrowthInside1LastX128) / x128;
        
            // The final calculations for the '�� =�·(��(�1)−��(�0))' uncollected fees formula
            // for both token 0 and token 1 since we now know everything that is needed to compute it
            let uncollectedFees_0 = positionLiquidity * (fr_t1_0 - feeGrowthInsideLast_0);
            let uncollectedFees_1 = positionLiquidity * (fr_t1_1 - feeGrowthInsideLast_1);
        
            // Decimal adjustment to get final results
            let uncollectedFeesAdjusted_0 =
            uncollectedFees_0 / Math.pow(10, position.token0.decimals);
            let uncollectedFeesAdjusted_1 =
            uncollectedFees_1 / Math.pow(10, position.token1.decimals);
            // UNCOLLECTED FEES END ----------------------------------------------------------------------------------
        
            const img0 = _regTokens.find(token => token.address.toLowerCase() === position.token0.id.toLowerCase());
            const img1 = _regTokens.find(token => token.address.toLowerCase() === position.token1.id.toLowerCase());
            setPosition({
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
                decimals0: parseInt(position.token0),
                decimals1: parseInt(position.token1.decimals),
                amount0: amount_0_Adjusted,
                amount1: amount_1_Adjusted,
                curPrice: priceCurrentAdjustedReversed,
                lowerPrice: priceLowerAdjustedReversed,
                upperPrice: priceUpperAdjustedReversed,
                fee0: uncollectedFeesAdjusted_0,
                fee1: uncollectedFeesAdjusted_1,
            });
        } catch (e) {
            console.log("Error")
        }
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

    const initialize = async (id) => {
        setTokenId(id);
        let _regTokens = [];

        let priceRes = await axios.post(graphqlEndpoint, {
          query: ETHPRICE_QUERY,
        });
        setETHUSD(parseFloat(priceRes.data.data.bundle.ethPriceUSD));
    
        try {
            const res = await axios.get(COINGECKO_URL);
            if (res && res.data && res.data.tokens) {
                _regTokens = res.data.tokens.filter(token => token.chainId === 1);
                setRegTokens(_regTokens);
            }
        } catch (e) {

        } finally {

        }

        try {
            const provider = new ethers.providers.JsonRpcProvider(JSON_PROVIDER);
            const data = await getTokenURI(UNI_V3_NFT_POSITIONS_ADDRESS, id, provider);
            const ownerAddr = await getOwnerOf(UNI_V3_NFT_POSITIONS_ADDRESS, id, provider);
            if (data) {
                const parts = data.split(",");
                const bytes = base64.decode(parts[1]);
                let jsonData = JSON.parse(bytes);
                setUniV3NFT({
                    name: jsonData.name,
                    image: jsonData.image,
                    description: jsonData.description,
                    owner: ownerAddr
                })
            }
        } catch (e) {
            console.log(e);
        } finally {

        }
        try {
            getPositionbySubGraph(id, _regTokens);
        } catch (e) {

        }
    }

    const renderFee = () => {
        let fee = 0;
        if (position.fee === 3000) fee = 0.3;
        else if (position.fee === 10000) fee = 1;
        else fee = 0.05;
        return (
            <Text bg="#2C2F36" m="auto 0 auto 1rem" p="0 0.3rem" borderRadius="5px" fontWeight="bold" fontSize="14px">{fee}%</Text>
        );
    }

    const renderRange = () => {
        if (!position.liquidity || parseInt(position.liquidity) === 0) {
            return (
                <Flex flexDirection="row" bg="#2C2F36" borderRadius="5px" m="auto 0.5rem">
                    <Box bg="#F65770" w="10px" h="10px" borderRadius="100%" m="auto 0.5rem"/>
                    <Text m="auto 0" fontSize="14px" fontWeight="bold" pr="0.5rem" color="#F65770">Closed</Text>
                </Flex>
            )
        }
        if (position.tick >= position.tickLower && position.tick <= position.tickUpper) {
            return (
                <Flex flexDirection="row" bg="#2C2F36" borderRadius="5px" m="auto 0.5rem">
                    <Box bg="#26AE60" w="10px" h="10px" borderRadius="100%" m="auto 0.5rem"/>
                    <Text m="auto 0" fontSize="14px" fontWeight="bold" pr="0.5rem">In range</Text>
                </Flex>
            )
        } else {
            return (
                <Flex flexDirection="row" bg="#2C2F36" borderRadius="5px" m="auto 0.5rem">
                    <Box bg="#FF8F00" w="10px" h="10px" borderRadius="100%" m="auto 0.5rem"/>
                    <Text m="auto 0" fontSize="14px" fontWeight="bold" pr="0.5rem" color="#FF8F00">Out of range</Text>
                </Flex>
            )
        }
    }

    const renderToken = (symbol, addr, imgLink) => {
        if (symbol === "ETH")
            return (
                <Flex flexDirection="row">
                    <Image alt="" src="/images/assets/eth.png" w="24px" />
                    <Text m="auto 0.5rem">{symbol}</Text>
                </Flex>
            );
        return (
            <Link href={SCAN_LINK + "/address/" + addr} isExternal>
                <Flex flexDirection="row">
                    <Image alt="" src={imgLink} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                    <Text m="auto 0.5rem">{symbol}</Text>
                    <ExternalLinkIcon m="auto 0"/>
                </Flex>
            </Link>
        );
    }

    const renderLiquidity = () => {
        const { symbol0, symbol1, token0, token1, img0, img1, tick, tickUpper, tickLower, liquidity, amount0, amount1 } = position;
        let percent = 0;
        let a0 = amount0;
        let a1 = amount1;
        if (amount0 < 1 && amount0 !== 0) {
            if (amount0 < 0.00001) a0 = "<0.00001";
            else a0 = amount0.toFixed(6);
        }  else if (amount0 > 1) a0 = amount0.toFixed(2);
        if (amount1 < 1 && amount1 !== 0) {
            if (amount1 < 0.00001) a1 = "<0.00001";
            else a1 = amount1.toFixed(6);
        }  else if (amount1 > 1) a1 = amount1.toFixed(2);
        if (liquidity && parseInt(liquidity)) {
            if (tick > tickUpper)
                percent = 0;
            else if (tick < tickLower)
                percent = 100;
            else
                percent = parseInt((tickUpper - tick) / (tickUpper - tickLower) * 100);
        }
        if (order)
            return (
                <Box bg="#212429" p="0.5rem" borderRadius="10px">
                    <Flex flexDirection="row" w={["100%", "100%", "20rem"]}>
                        {renderToken(symbol1, token1, img1)}
                        <Text ml="auto">{a1}</Text>
                        {(liquidity && parseInt(liquidity)) ? <Text fontSize="12px" bg="#2C2F36" borderRadius="10px" borderRadius="10px" m="auto 0 auto 1rem" p="0.1rem 0.5rem">{100 - percent}%</Text>:(null)}
                    </Flex>
                    <Flex flexDirection="row" w={["100%", "100%", "20rem"]} mt="0.5rem">
                        {renderToken(symbol0, token0, img0)}
                        <Text ml="auto">{a0}</Text>
                        {(liquidity && parseInt(liquidity)) ? <Text fontSize="12px" bg="#2C2F36" borderRadius="10px" borderRadius="10px" m="auto 0 auto 1rem" p="0.1rem 0.5rem">{percent}%</Text>:(null)}
                    </Flex>
                </Box>
            )
        return (
            <Box bg="#212429" p="0.5rem" borderRadius="10px">
                <Flex flexDirection="row" w={["100%", "100%", "20rem"]}>
                    {renderToken(symbol0, token0, img0)}
                    <Text ml="auto">{a0}</Text>
                    {(liquidity && parseInt(liquidity)) ? <Text fontSize="12px" bg="#2C2F36" borderRadius="10px" borderRadius="10px" m="auto 0 auto 1rem" p="0.1rem 0.5rem">{percent}%</Text>:(null)}
                </Flex>
                <Flex flexDirection="row" w={["100%", "100%", "20rem"]} mt="0.5rem">
                    {renderToken(symbol1, token1, img1)}
                    <Text ml="auto">{a1}</Text>
                    {(liquidity && parseInt(liquidity)) ? <Text fontSize="12px" bg="#2C2F36" borderRadius="10px" borderRadius="10px" m="auto 0 auto 1rem" p="0.1rem 0.5rem">{100 - percent}%</Text>:(null)}
                </Flex>
            </Box>
        )
    }

    const renderFees = () => {
        const { fee0, fee1, img0, img1, symbol0, symbol1 } = position;
        let a0 = fee0;
        let a1 = fee1;
        if (fee0 < 1 && fee0 !== 0) {
            if (fee0 < 0.00001) a0 = "<0.00001";
            else a0 = fee0.toFixed(6);
        }  else if (fee0 > 1) a0 = fee0.toFixed(2);
        if (fee1 < 1 && fee1 !== 0) {
            if (fee1 < 0.00001) a1 = "<0.00001";
            else a1 = fee1.toFixed(6);
        }  else if (fee1 > 1) a1 = fee1.toFixed(2);
        if (order)
            return (
                <Box bg="#212429" p="0.5rem" borderRadius="10px">
                    <Flex flexDirection="row" w={["100%", "100%", "20rem"]} justifyContent="space-between">
                        <Flex flexDirection="row">
                            <Image alt="" src={img1} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                            <Text m="auto 0.5rem">{symbol1}</Text>
                        </Flex>
                        <Text>{a1}</Text>
                    </Flex>
                    <Flex flexDirection="row" w={["100%", "100%", "20rem"]} justifyContent="space-between" mt="0.5rem">
                        <Flex flexDirection="row">
                            <Image alt="" src={img0} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                            <Text m="auto 0.5rem">{symbol0}</Text>
                        </Flex>
                        <Text>{a0}</Text>
                    </Flex>
                </Box>
            );
        return (
            <Box bg="#212429" p="0.5rem" borderRadius="10px">
                <Flex flexDirection="row" w={["100%", "100%", "20rem"]} justifyContent="space-between">
                    <Flex flexDirection="row">
                        <Image alt="" src={img0} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                        <Text m="auto 0.5rem">{symbol0}</Text>
                    </Flex>
                    <Text>{a0}</Text>
                </Flex>
                <Flex flexDirection="row" w={["100%", "100%", "20rem"]} justifyContent="space-between" mt="0.5rem">
                    <Flex flexDirection="row">
                        <Image alt="" src={img1} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                        <Text m="auto 0.5rem">{symbol1}</Text>
                    </Flex>
                    <Text>{a1}</Text>
                </Flex>
            </Box>
        );
    }

    const renderPairsLogo = () => {
        return (
            <Flex m="auto 0">
                <Image alt="" src={order?position.img1:position.img0} w="24px" h="24px" bg="#fff" borderRadius="100%"/>
                <Image alt="" src={!order?position.img1:position.img0} w="24px"  h="24px" bg="#fff" borderRadius="100%" ml="-10px" mr="0.5rem"/>
            </Flex>
        )
    }

    const renderMinPrice = () => {
        const {
            upperPrice,
            lowerPrice,
            symbol0,
            symbol1,
        } = position;
        let minPrice = !order ? lowerPrice : 1 / upperPrice;
        return (
            <Box p="1rem 0.5rem" bg="#212429" w="50%" borderRadius="10px" textAlign="center">
                <Text fontSize="14px">Min price</Text>
                <Text fontSize="16px" fontWeight="bold" m="0.3rem 0">{minPrice > 1 ? minPrice.toFixed(3) : minPrice.toFixed(7)}</Text>
                <Text fontSize="14px">{order?symbol1:symbol0} per {!order?symbol1:symbol0}</Text>
                <Text fontSize="11px" mt="0.3rem">Your position will be 100% {!order?symbol1:symbol0} at this price.</Text>
            </Box>
        )
    }

    const renderMaxPrice = () => {
        const {
            upperPrice,
            lowerPrice,
            symbol0,
            symbol1,
        } = position;
        let maxPrice = !order ? upperPrice : 1 / lowerPrice;
        return (
            <Box p="1rem 0.5rem" bg="#212429" w="50%" borderRadius="10px" textAlign="center">
                <Text fontSize="14px">Max price</Text>
                <Text fontSize="16px" fontWeight="bold" m="0.3rem 0">{maxPrice > 1 ? maxPrice.toFixed(3) : maxPrice.toFixed(7)}</Text>
                <Text fontSize="14px">{order?symbol1:symbol0} per {!order?symbol1:symbol0}</Text>
                <Text fontSize="11px" mt="0.3rem">Your position will be 100% {order?symbol1:symbol0} at this price.</Text>
            </Box>
        )
    }

    const renderCurPrice = () => {
        const {
            symbol0,
            symbol1,
            curPrice
        } = position;
        let cPrice = !order ? curPrice : 1 / curPrice;
        return (
            <Box p="1rem 0.5rem" bg="#212429" w="100%" borderRadius="10px" textAlign="center">
                <Text fontSize="14px">Current price</Text>
                <Text fontSize="16px" fontWeight="bold" m="0.3rem 0">{cPrice > 1 ? cPrice.toFixed(5) : cPrice.toFixed(7)}</Text>
                <Text fontSize="14px">{order?symbol1:symbol0} per {!order?symbol1:symbol0}</Text>
            </Box>
        )
    }

    const getLiquidityValue = () => {
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

    const getFeeValue = () => {
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

    const onBuy = async () => {
        try {
          setConfirming(true);
          const provider = new ethers.providers.Web3Provider(wallet.ethereum);
          const signer = await provider.getSigner();
          let hash = "";
          if (saleInfo.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead") {
            hash = await swapWithETH(UNIBOND_ADDRESS, parseFloat(saleInfo.amount) / Math.pow(10, 18), saleInfo.swapId, signer);
          } else {
            hash = await swapWithToken(UNIBOND_ADDRESS, saleInfo.swapId, signer);
          }
          if (hash) {
            toast({
                title: "Success",
                description: "Transaction is confirmed.",
                status: "success",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
            setSaleInfo(null);
          } else {
            toast({
                title: "Error",
                description: "Transaction is reverted.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
          }
        } catch(e) {
          toast({
              title: "Error",
              description: "Transaction is reverted.",
              status: "error",
              duration: 5000,
              isClosable: true,
              position: "top-right"
          });   
        } finally {
          setConfirming(false);
        }

    }

    const onApproveItem = async () => {
        try {
            setConfirming(true);
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const signer = await provider.getSigner();
            const hash = await approveAsset(saleInfo.payToken, UNIBOND_ADDRESS, signer);
            if (hash) {
                toast({
                    title: "Success",
                    description: "Transaction is confirmed.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
                setApproved(true);
            } else {
                toast({
                    title: "Error",
                    description: "Transaction is reverted.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
            }
        } catch (e) {
            console.log(e);
            toast({
                title: "Error",
                description: "Transaction is reverted.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setConfirming(false);
        }
    }

    const renderApproveButton = () => {
        if (saleInfo && saleInfo.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead") {
          return (null);
        }
        if (!approved) {
            if (confirming) {
                return (
                    <Flex bg="#2D81FF80" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" mb="0.5rem">
                        <Text fontSize="14px" fontWeight="bold" m="0 auto">APPROVE</Text>
                        <Spinner size="sm"/> 
                    </Flex>
                );
            }
            return (
                <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} mb="0.5rem" onClick={onApproveItem}>
                    <Text fontSize="14px" fontWeight="bold" m="0 auto">APPROVE</Text>
                </Flex>
            );
        }
        return (
            <Flex bg="#aaa" p="0.5rem 2rem" borderRadius="30px" mb="0.5rem">
                <Text fontSize="14px" fontWeight="bold" m="0 auto">APPROVED</Text>
            </Flex>
        );
    }

    const renderBuyButton = () => {
      if (approved || (saleInfo && saleInfo.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead")) {
        if (confirming) {
          return (
                <Flex bg="#2D81FF80" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                    <Text fontSize="14px" fontWeight="bold" m="0 auto">BUY NOW!</Text>
                    <Spinner size="sm"/>
                </Flex>
          );
        }
        return (
            <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} onClick={onBuy}>
                <Text fontSize="14px" fontWeight="bold" m="0 auto">BUY NOW!</Text>
            </Flex>
        );
      }
      return (
            <Flex bg="#aaa" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                <Text fontSize="14px" fontWeight="bold" m="0 auto">BUY NOW!</Text>
            </Flex>
      );
    }

    const renderBuyNow = () => {
        if (!saleInfo) return (null);
        if (!wallet || !wallet.ethereum) return (null);
        let index = 0;
        for (let i = 0; i < SUPPORT_ASSETS.length; i ++) {
            if (saleInfo.payToken.toLowerCase() === SUPPORT_ASSETS[i].address.toLowerCase()) {
                index = i;
                break;
            }
        }
        const sAsset = SUPPORT_ASSETS[index];
        const amount = parseFloat(saleInfo.amount) / Math.pow(10, sAsset.decimals);
        return (
            <Box>
                <Text fontSize="14px" color="#26AE60" fontWeight="bold">This NFT is on sale now.</Text>
                <Flex flexDirection="row" justifyContent="space-between" mb="1rem">
                    <Text fontSize="14px">Sale price</Text>
                    <Flex flexDirection="row">
                        <Image src={sAsset.img} h="20px"/>
                        <Text fontSize="14px" m="auto 5px auto 5px" fontWeight="bold">{amount.toFixed(4)}</Text>
                        <Text fontSize="14px" color="#aaa" m="auto 0">{sAsset.name}</Text>
                    </Flex>
                </Flex>
                {renderApproveButton()}
                {renderBuyButton()}
            </Box>
        )
    }

    const renderNFT = () => {
        if (uni_v3_nft === null || position === null) {
            return (
                <Flex flexDirection="column" mt="2rem" w="100%">
                    <Text textAlign="center"m="1rem 0">Loading position...</Text>
                    <Spinner m="0 auto"/>
                </Flex>
            );
        }
        return (
            <Flex flexDirection={["column", "column", "column", "column","row"]} mt="3rem">
                <Box w={["100%", "100%", "100%", "100%", "calc(100% - 400px)"]} mb={["2rem","2rem","2rem","2rem", 0]}>
                    <Flex flexDirection="row" w="100%" justifyContent="center">
                        <Box w={["100%", "100%", "auto"]}>
                            <Flex flexDirection="row">
                                {renderPairsLogo()}
                                <Text fontWeight="bold" fontSize="26px" m="auto 0">{order?position.symbol1:position.symbol0} / {!order?position.symbol1:position.symbol0}</Text>
                                {renderFee()}
                                {renderRange()}
                            </Flex>
                            <Flex flexDirection={["column", "column", "row"]}>
                                <Flex flexDirection="column" bg="#191B1F" p={["1rem", "1rem", "1rem 4rem"]} borderRadius="20px" mb={["1rem", "1rem", 0]} w="100%">
                                    {uni_v3_nft.image?
                                        <Flex m="0 auto">
                                            <Image src={uni_v3_nft.image} width={250} height={400}/>
                                        </Flex>
                                        :<Image src="/images/tokenpage/uni.png"/>
                                    }
                                    <Flex mt="0.5rem">
                                        <Link  _active={{}} _focus={{}} isExternal href={SCAN_LINK + "/address/" + uni_v3_nft.owner} m="0 auto">
                                            <Text m="0 auto">Owner</Text>
                                        </Link>
                                    </Flex>
                                </Flex>
                                <Box>
                                    <Box bg="#191B1F" p="1rem" borderRadius="20px" ml={[0, 0, "1rem"]} h="50%">
                                        <Text fontWeight="bold">Liquidity</Text>
                                        <Text fontWeight="bold" p="0.2rem 0 0.5rem 0" fontSize="40px">${getLiquidityValue()}</Text>
                                        {renderLiquidity()}
                                    </Box>
                                    <Box bg="#191B1F" p="1rem" borderRadius="20px" ml={[0, 0, "1rem"]} h="calc(50% - 1rem)" mt="1rem">
                                        <Text fontWeight="bold">Unclaimed fees</Text>
                                        <Text fontWeight="bold" fontSize="40px">${getFeeValue()}</Text>
                                        {renderFees()}
                                    </Box>
                                </Box>
                            </Flex>
                            <Box bg="#191B1F" borderRadius="10px" p="1rem" mt="1rem">
                                <Flex flexDirection="row">
                                    <Text fontWeight="bold">Price range</Text>
                                    {renderRange()}
                                    <Flex flexDirection="row" ml="auto" borderRadius="10px" border="1px solid #2C2F36" bg="#212429">
                                        <Flex m="auto 0" p="0.2rem 0.5rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.6}} transition="0.2s"
                                            bg={!order?"#212429":"#191B1F"} onClick={() => {setOrder(true)}}
                                        >
                                            <Text fontSize="12px">{position.symbol0} price</Text>
                                        </Flex>
                                        <Flex m="auto 0" p="0.2rem 0.5rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.6}} transition="0.2s"
                                            bg={order?"#212429":"#191B1F"} onClick={() => {setOrder(false)}}
                                        >
                                            <Text fontSize="12px">{position.symbol1} price</Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Flex flexDirection="row" m="1rem 0">
                                    {renderMinPrice()}
                                    <Flex m="auto 1rem">
                                        ⟷
                                    </Flex>
                                    {renderMaxPrice()}
                                </Flex>
                                {renderCurPrice()}
                            </Box>
                        </Box>
                    </Flex>
                </Box>
                <Box w={["100%", "100%", "100%", "100%", "400px"]}>
                    <Text fontWeight="bold" fontSize="22px">{uni_v3_nft.name}</Text>
                    <Text whiteSpace="pre-wrap" overflowWrap="break-word" fontSize="14px" mt="30px">{uni_v3_nft.description}</Text>
                    <Flex flexDirection={["column", "row"]} mt="1.5rem">
                        <Link href={"https://opensea.io/assets/0xc36442b4a4522e871399cd717abdd847ab11fe88/" + tokenId} isExternal _focus={{}} _active={{}} _hover={{}}>
                            <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                                <Text fontSize="14px" fontWeight="bold">View at Opensea</Text>
                            </Flex>
                        </Link>
                        <Link href={"https://app.uniswap.org/#/pool/" + tokenId} isExternal _focus={{}} _active={{}} _hover={{}}>
                            <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} ml={[0, "1rem"]} mt={["1rem", 0]}>
                                <Text fontSize="14px" fontWeight="bold">View at Uniswap</Text>
                            </Flex>
                        </Link>
                    </Flex>
                    <Box h="1px" w="100%" bg="#777" m="1rem auto"/>
                    {renderBuyNow()}
                </Box>
            </Flex>
        )
    }

    return (
      <Box w="100%" p="3rem 2rem">
          {renderNFT()}
      </Box>
    )
}
export default TokenPage;
  