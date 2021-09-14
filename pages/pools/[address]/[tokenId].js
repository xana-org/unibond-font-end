import { useEffect, useState, useMemo }  from "react";
import axios                    from "axios";
import { ethers }               from "ethers";
import {
    Flex, 
    Box,
    Text,
    SimpleGrid,
    Image,
    Link,
} from "@chakra-ui/core";
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ExternalLinkIcon,
} from "@chakra-ui/icons";
import { useRouter } from "next/router";
import { useWallet } from "use-wallet";

import {
    isWalletConnected
} from "../../../lib/wallet";
import {
    get2DayChange,
    useDeltaTimestamps,
    formatAmount,
    formatDollarAmount,
} from "../../../lib/helper";
import {
    UNIV3_GRAPH_ENDPOINT,
    BLOCK_ENDPOINT,
    GET_BLOCK_QUERY,
    POOL_QUERY,
    COINGECKO_URL,
} from "../../../utils/const"

const Pool = () => {
    const router = useRouter();
    const wallet = useWallet();
    const [initiated, setInitiated] = useState(false);
    const [pool, setPool] = useState(null);
    const [regTokens, setRegTokens] = useState(null);

    useEffect(async () => {
        let _regTokens = [];
        try {
            const res = await axios.get(COINGECKO_URL);
            if (res && res.data && res.data.tokens) {
                _regTokens = res.data.tokens.filter(token => token.chainId === 1);
                setRegTokens(_regTokens);
            }
        } catch (e) {

        } finally {

        }

    }, []);

    useEffect(async () => {
        if (router.query && isWalletConnected(wallet) && regTokens) {
            const { address, tokenId } = router.query;
            if (address && tokenId && !initiated) {
                console.log(address, tokenId);
                setInitiated(true);
                const pool = await getPoolData(address);
                console.log(pool);
                setPool(pool);
            }
        }
    }, [router, wallet, regTokens]);

    const getPoolData = async (poolAddress) => {
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
        const img0 = regTokens.find(token => token.address.toLowerCase() === current.token0.id.toLowerCase());
        const img1 = regTokens.find(token => token.address.toLowerCase() === current.token1.id.toLowerCase());
        return {
            current,
            volumeUSD,
            volumeUSDChange,
            tvlUSD,
            tvlUSDChange,
            img0: current.token0.symbol === "WETH" ? "/images/assets/eth.png": ((img0 && img0.logoURI) ? img0.logoURI : "/images/assets/infinite.svg"),
            img1: current.token1.symbol === "WETH" ? "/images/assets/eth.png": ((img1 && img1.logoURI) ? img1.logoURI : "/images/assets/infinite.svg"),
        }
    };
    const poolNameBox = useMemo(() => {
        if (pool) {
            let tier = 0.05;
            if (pool.current.feeTier === "10000") tier = 1;
            else if (pool.current.feeTier === "3000") tier = 0.3;
            const { img0, img1, current } = pool;
            return (
                <Flex flexDirection="row">
                    <Image src={img0} alt="img0" w="30px" h="30px"/>
                    <Image src={img1} alt="img0" w="30px" h="30px"/>
                    <Text fontSize="20px" margin="auto 10px" fontWeight="bold">{current.token0.symbol + " / " + current.token1.symbol}</Text>
                    <Text fontSize="12px" margin="auto 0" bg="#2D81FF" p="1px 10px" borderRadius="20px">{tier} %</Text>
                </Flex>
            )
        }
        return (
            <Flex flexDirection="row">
                <Image src="/images/assets/infinite.svg" alt="img0" w="30px" h="30px"/>
                <Image src="/images/assets/infinite.svg" alt="img0" w="30px" h="30px"/>
                <Text fontSize="20px" margin="auto 10px" fontWeight="bold">- / -</Text>
                <Text fontSize="12px" margin="auto 0" bg="#2D81FF" p="1px 10px" borderRadius="20px">- %</Text>
            </Flex>
        )
    }, [pool]);
    const TTLBox = useMemo(() => {
        if (pool) {
            const { img0, img1, current } = pool;
            return (
                <Box w="100%" borderRadius="10px" bg="#41444F" p="15px">
                    <Text fontWeight="bold" mb="10px">Total Tokens Locked</Text>
                    <Flex flexDirection="row">
                        <Image src={img0} alt="img0" w="26px" h="26px"/>
                        <Text fontSize="14px" m="auto 8px">{current.token0.symbol}</Text>
                        <Text fontSize="14px" m="auto 0 auto auto">{formatAmount(current.totalValueLockedToken0)}</Text>
                    </Flex>
                    <Flex flexDirection="row" mt="10px">
                        <Image src={img1} alt="img0" w="26px" h="26px"/>
                        <Text fontSize="14px" m="auto 8px">{current.token1.symbol}</Text>
                        <Text fontSize="14px" m="auto 0 auto auto">{formatAmount(current.totalValueLockedToken1)}</Text>
                    </Flex>
                </Box>
            )
        }
        return (
            <Box w="100%" borderRadius="10px" bg="#41444F" p="15px">
                <Text fontWeight="bold" mb="10px">Total Tokens Locked</Text>
                <Flex flexDirection="row">
                    <Image src="/images/assets/infinite.svg" alt="img0" w="26px" h="26px"/>
                    <Text fontSize="14px" m="auto 8px">-</Text>
                    <Text fontSize="14px" m="auto 0 auto auto">-</Text>
                </Flex>
                <Flex flexDirection="row" mt="10px">
                    <Image src="/images/assets/infinite.svg" alt="img0" w="26px" h="26px"/>
                    <Text fontSize="14px" m="auto 8px">-</Text>
                    <Text fontSize="14px" m="auto 0 auto auto">-</Text>
                </Flex>
            </Box>
        )
    }, [pool]);

    const TwoDayData = useMemo(() => {
        if (pool) {
            const { tvlUSD, tvlUSDChange, volumeUSD, volumeUSDChange, current } = pool;
            return (
                <Flex flexDirection="row" justifyContent="space-between">
                    <Box>
                        <Text fontSize="14px">Total Value Locked</Text>
                        <Text fontSize="20px" fontWeight="bold" p="5px 0">{formatDollarAmount(tvlUSD)}</Text>
                        <Flex flexDirection="row">
                            {tvlUSDChange && parseFloat(tvlUSDChange) > 0 ? <ArrowUpIcon m="auto 0" color="rgb(39, 174, 96)"/> : <ArrowDownIcon m="auto 0" color="rgb(253, 64, 64)"/>}
                            <Text color={tvlUSDChange && parseFloat(tvlUSDChange) > 0 ? "rgb(39, 174, 96)" : "rgb(253, 64, 64)"} fontSize="14px">
                                {tvlUSDChange ? parseFloat(tvlUSDChange).toFixed(2): "0.00"}%
                            </Text>
                        </Flex>
                    </Box>
                    <Box h="80px" w="1px" bg="#fff"/>
                    <Box>
                        <Text fontSize="14px">Volume 24h</Text>
                        <Text fontSize="20px" fontWeight="bold" p="5px 0">{formatDollarAmount(volumeUSD)}</Text>
                        <Flex flexDirection="row">
                            {volumeUSDChange && parseFloat(volumeUSDChange) > 0 ? <ArrowUpIcon m="auto 0" color="rgb(39, 174, 96)"/> : <ArrowDownIcon m="auto 0" color="rgb(253, 64, 64)"/>}
                            <Text color={volumeUSDChange && parseFloat(volumeUSDChange) > 0 ? "rgb(39, 174, 96)" : "rgb(253, 64, 64)"} fontSize="14px">
                                {volumeUSDChange ? parseFloat(volumeUSDChange).toFixed(2): "0.00"}%
                            </Text>
                        </Flex>
                    </Box>
                    <Box h="80px" w="1px" bg="#fff"/>
                    <Box>
                        <Text fontSize="14px">24h Fees</Text>
                        <Text fontSize="20px" fontWeight="bold" p="5px 0">{formatDollarAmount(volumeUSD * (parseFloat(current.feeTier) / 1000000))}</Text>
                    </Box>
                    <Box/>
                </Flex>
            )
        }
        return (
            <Flex flexDirection="row" justifyContent="space-between">
                <Box>
                    <Text fontSize="14px">Total Value Locked</Text>
                    <Text fontSize="20px" fontWeight="bold" p="5px 0">-</Text>
                    <Flex flexDirection="row">
                        <ArrowUpIcon m="auto 0" color="rgb(39, 174, 96)"/>
                        <Text color="rgb(39, 174, 96)">
                            -%
                        </Text>
                    </Flex>
                </Box>
                <Box h="80px" w="1px" bg="#fff"/>
                <Box>
                    <Text fontSize="14px">Volume 24h</Text>
                    <Text fontSize="20px" fontWeight="bold" p="5px 0">-</Text>
                    <Flex flexDirection="row">
                        <ArrowUpIcon m="auto 0" color="rgb(39, 174, 96)"/>
                        <Text color="rgb(39, 174, 96)">
                            -%
                        </Text>
                    </Flex>
                </Box>
                <Box h="80px" w="1px" bg="#fff"/>
                <Box>
                    <Text fontSize="14px">24h Fees</Text>
                    <Text fontSize="20px" fontWeight="bold" p="5px 0">-</Text>
                </Box>
                <Box/>
            </Flex>
        )
    }, [pool]);

    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Flex flexDirection="row" justifyContent="space-between">
                    <Box w="400px" bg="#31333F" borderRadius="10px">
                        <Box p="20px 20px">
                            {poolNameBox}
                        </Box>
                        <Box m="" h="1px" w="100%" bg="#2D81FF"/>
                        <Box p="15px 20px">
                            {TTLBox}
                        </Box>
                    </Box>
                    <Flex w="calc(100% - 420px)">
                        <Box p="20px 40px" bg="#31333F" borderRadius="10px" w="100%" mb="auto">
                            {TwoDayData}
                        </Box>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
};

export default Pool;