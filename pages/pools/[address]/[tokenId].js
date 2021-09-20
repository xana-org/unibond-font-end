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
    isWalletConnected,
    shortenWalletAddress,
} from "../../../lib/wallet";
import {
    get2DayChange,
    useDeltaTimestamps,
    formatAmount,
    formatDollarAmount,
    unixToDate,
    getPositionData,
    isStableCoin,
    isWETH
} from "../../../lib/helper";
import {
    UNIV3_GRAPH_ENDPOINT,
    BLOCK_ENDPOINT,
    GET_BLOCK_QUERY,
    POOL_QUERY,
    POOL_CHART,
    COINGECKO_URL,
    ONE_DAY_UNIX,
    SCAN_LINK,
} from "../../../utils/const"
import LineChart from "../../../components/LineChart";
import BarChart from "../../../components/BarChart";
import dayjs from 'dayjs';

const Pool = () => {
    const router = useRouter();
    const wallet = useWallet();
    const [initiated, setInitiated] = useState(false);
    const [poolLoaded, setPoolLoaded] = useState(false);
    const [pool, setPool] = useState(null);
    const [position, setPosition] = useState(null);
    const [regTokens, setRegTokens] = useState(null);
    const [chartData, setChartData] = useState(undefined);
    const [view, setView] = useState(1);
    const [latestValue, setLatestValue] = useState(undefined);
    const [valueLabel, setValueLabel] = useState(undefined);


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

    const fetchPoolChartData = async (poolAddress) => {
        const startTimestamp = 1619170975
        const endTimestamp = dayjs.unix();
        let skip = 0;
        let error = false;
        let allFound = false;

        let data = [];
        try {
            while(!allFound) {
                let { data: chartResData } = await axios.post(UNIV3_GRAPH_ENDPOINT, {
                    query: POOL_CHART(startTimestamp, skip, poolAddress),
                });
                if (chartResData && chartResData.data) {
                    skip += 1000;
                    if (chartResData.data.poolDayDatas && chartResData.data.poolDayDatas.length < 1000) {
                        allFound = true;
                    }
                    if (chartResData.data.poolDayDatas) {
                        data = data.concat(chartResData.data.poolDayDatas)
                    }
                } else {
                    allFound = true;
                }
            }

        } catch (e) {
            error = true;
        }

        if (data.length > 0) {
            const formattedExisting = data.reduce((accum, dayData) => {
              const roundedDate = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))
              accum[roundedDate] = {
                date: dayData.date,
                volumeUSD: parseFloat(dayData.volumeUSD),
                totalValueLockedUSD: parseFloat(dayData.tvlUSD),
              }
              return accum
            }, {})
            
            const firstEntry = formattedExisting[parseInt(Object.keys(formattedExisting)[0])]
            let timestamp = firstEntry?.date ?? startTimestamp
            let latestTvl = firstEntry?.totalValueLockedUSD ?? 0

            while (timestamp < endTimestamp - ONE_DAY_UNIX) {
                const nextDay = timestamp + ONE_DAY_UNIX
                const currentDayIndex = parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
                if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
                    formattedExisting[currentDayIndex] = {
                        date: nextDay,
                        volumeUSD: 0,
                        totalValueLockedUSD: latestTvl,
                    }
                } else {
                    latestTvl = formattedExisting[currentDayIndex].totalValueLockedUSD
                }
                timestamp = nextDay
            }

            const dateMap = Object.keys(formattedExisting).map((key) => {
              return formattedExisting[parseInt(key)]
            })
            return dateMap;
        }
        return undefined;
    }    

    useEffect(async () => {
        if (router.query && regTokens && !poolLoaded) {
            setPoolLoaded(true);
            const { address } = router.query;
            const _pool = await getPoolData(address);
            setPool(_pool);
            const _chartData = await fetchPoolChartData(address);
            setChartData(_chartData);
        }
    }, [router, regTokens]);

    useEffect(async () => {
        if (router.query && isWalletConnected(wallet) && regTokens) {
            const { tokenId } = router.query;
            if (tokenId && !initiated) {
                setInitiated(true);
                console.log(tokenId);
                const _position = await getPositionData(tokenId, regTokens);
                console.log("position", _position);
                setPosition(_position);
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

    const formattedTvlData = useMemo(() => {
        if (chartData) {
          return chartData.map((day) => {
            return {
              time: unixToDate(day.date),
              value: day.totalValueLockedUSD,
            }
          })
        } else {
          return []
        }
    }, [chartData]);

    const formattedVolumeData = useMemo(() => {
      if (chartData) {
        return chartData.map((day) => {
          return {
            time: unixToDate(day.date),
            value: day.volumeUSD,
          }
        })
      } else {
        return []
      }
    }, [chartData])

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

    const priceRange = useMemo(() => {
        if (position) {
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
    }, [position]);

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

    const liquidityBox = useMemo(() => {
        if (position) {
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
            return (
                <Box bg="#41444F" p="0.5rem" borderRadius="10px">
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
            );
        }
    }, [position]);

    const getLiquidityValue = useMemo(() => {
        if (!position) return "-";
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
    }, [position]);

    const getFeeValue = useMemo(() => {
        if (!position) return "-";
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
    }, [position]);

    const feeBox = useMemo(() => {
        if (position) {
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
            return (
                <Box bg="#41444F" p="0.5rem" borderRadius="10px">
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
    }, [position]);

    const ownerStr = useMemo(() => {
        if (position) {
            return (
                <Link isExternal href={SCAN_LINK + "/address/" + position.owner}>
                    {shortenWalletAddress(position.owner)}
                </Link>                
            );
        }
        return "-";
    }, [position]);

    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Flex flexDirection="row" justifyContent="space-between">
                    <Box w="400px">
                        <Box bg="#31333F" borderRadius="10px" mb="20px">
                            <Box p="20px 20px">
                                {poolNameBox}
                            </Box>
                            <Box m="" h="1px" w="100%" bg="#2D81FF"/>
                            <Box p="15px 20px">
                                {TTLBox}
                            </Box>
                        </Box>
                        <Box bg="#31333F" borderRadius="10px" m="auto 0" p="20px">
                            <Flex flexDirection="row" mb="10px">
                                <Text fontWeight="bold" m="auto 0" >Position Info</Text>
                                {priceRange}
                            </Flex>
                            <Box>
                                <Flex flexDirection="row" justifyContent="space-between">
                                    <Text fontSize="14px" m="auto 0">Liquidity</Text>
                                    <Text fontWeight="bold" fontSize="26px">${getLiquidityValue}</Text>
                                </Flex>
                                {liquidityBox}
                            </Box>
                            <Box m="20px 0">
                                <Flex flexDirection="row" justifyContent="space-between">
                                    <Text fontSize="14px" m="auto 0">Unclaimed fees</Text>
                                    <Text fontWeight="bold" fontSize="26px">${getFeeValue}</Text>
                                </Flex>
                                {feeBox}
                            </Box>
                            <Box>
                                <Flex flexDirection="row">
                                    <Text fontSize="14px" mr="20px">Owner</Text>
                                    <Text fontSize="14px" fontWeight="bold">{ownerStr}</Text>
                                </Flex>
                            </Box>
                        </Box>
                    </Box>
                    <Flex w="calc(100% - 420px)" flexDirection="column">
                        <Box p="20px 40px" bg="#31333F" borderRadius="10px" w="100%" mb="30px">
                            {TwoDayData}
                        </Box>
                        <Flex p="20px 20px" bg="#31333F" w="100%" m="auto 0" borderRadius="10px" flexDirection="column">
                            <Flex flexDirection="row">
                                <Flex flexDirection="row">
                                    <Text fontWeight="bold">
                                        {latestValue
                                            ? formatDollarAmount(latestValue)
                                            : view === 1
                                            ? formatDollarAmount(formattedVolumeData[formattedVolumeData.length - 1]?.value)
                                            : view === 0
                                            ? ''
                                            : formatDollarAmount(formattedTvlData[formattedTvlData.length - 1]?.value)}{' '}
                                    </Text>
                                    <Text m="auto 1rem" fontSize="12px" fontWeight="bold">{valueLabel?valueLabel : ''}</Text>
                                </Flex>
                                <Flex flexDirection="row" ml="auto" bg="#41444F" p="2px 10px" borderRadius="20px">
                                    <Flex bg={!view?"#000":"none"} p="0 10px" borderRadius="20px" cursor="pointer" userSelect="none" onClick={() => {setView(0)}}>
                                        <Text fontWeight="bold" fontSize="14px">Volume</Text>
                                    </Flex>
                                    <Flex bg={view?"#000":"none"} p="0 10px" borderRadius="20px" cursor="pointer" userSelect="none" onClick={() => {setView(1)}}>
                                        <Text fontWeight="bold" fontSize="14px">TVL</Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                            {view === 1 && <LineChart
                                data={formattedTvlData}
                                setLabel={setValueLabel}
                                setValue={setLatestValue}
                                value={latestValue}
                                label={valueLabel}
                                minHeight={340}
                                color="#56B2A4"
                            />}
                            {view === 0 && <BarChart
                                data={formattedVolumeData}
                                setLabel={setValueLabel}
                                setValue={setLatestValue}
                                value={latestValue}
                                label={valueLabel}
                                minHeight={340}
                                color="#56B2A4"
                            />}
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
};

export default Pool;