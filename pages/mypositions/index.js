import {
    Box,
    Flex,
    Image,
    Link,
    SimpleGrid,
    SkeletonText,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Collapse,
    useToast,
    Spinner,
    NumberInput,
    NumberInputField,
    useDisclosure,
} from "@chakra-ui/core";
import Big from "big.js";
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import axios                    from "axios";
import { ethers }               from "ethers";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState }  from "react";
import { useWallet } from "use-wallet";

import { getBalanceOf } from "../../contracts/erc721";
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
    getPositionData,
} from "../../lib/helper";
import {
    isApprovedForAll,
    setApprovalForAll,
    getTokenURI,
} from "../../contracts/erc721";

const MyPositionPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const toast = useToast();
    const [v3Balance, setv3Balance] = useState("-");
    const [initiated, setInitiated] = useState(false);
    const [myItems, setMyItems] = useState([]);
    const [ethUSD, setETHUSD] = useState(0);
    const [zoraScore, setZoraScore] = useState("-");
    const [loading, setLoading] = useState(true);
    const [sellItem, setSellItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isOpen, onToggle } = useDisclosure();
    const [isUniv3approved, setIsUniv3Approved] = useState(false);
    const [approving, setApproving] = useState(false);
    const [listing, setListing] = useState(false);
    const [curAsset, setCurAsset] = useState(0);
    const [assetAmount, setAssetAmount] = useState(0);
    const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';
    
    useEffect(async () => {
    }, []);

    const onAssetAmountChange = (value) => {
        setAssetAmount(value);
    }

    const onPutonSale = (item) => {
        setSellItem(item);
        setIsModalOpen(true);
    }

    const onModalClose = () => {
        setIsModalOpen(false);
    }

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


    const getLiquidityValue = (position, ethUSDPrice) => {
        const { curPrice, token0, token1, amount0, amount1, liquidity } = position;
        if (!liquidity || !parseInt(liquidity)) return "-";
        let usdLiq = 0;
        if (isStableCoin(token1)) {
            usdLiq = amount0 / curPrice + amount1;
        } else if (isStableCoin(token0)) {
            usdLiq = amount1 * curPrice + amount0;
        } else if (isWETH(token1)) {
            usdLiq = amount0 / curPrice * ethUSDPrice + amount1 * ethUSDPrice;
        } else if (isWETH(token0)) {
            usdLiq = amount1 * curPrice * ethUSDPrice + amount0 * ethUSDPrice;
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
            let priceRes = await axios.post(graphqlEndpoint, {
              query: ETHPRICE_QUERY,
            });
            const ethUSDPrice = parseFloat(priceRes.data.data.bundle.ethPriceUSD);
            setETHUSD(ethUSDPrice);
            const address = getWalletAddress(wallet);
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const approved = await isApprovedForAll(UNI_V3_NFT_POSITIONS_ADDRESS, address, UNIBOND_ADDRESS, provider);
            setIsUniv3Approved(approved);
            try {
                const res = await axios.get(ZORA_SCORE_API + address);
                if (res && res.data) {
                    const rating = parseFloat(res.data.result.rating);
                    setZoraScore(rating / 8);
                }
            } catch (e) {
            }
            try {
                const signer = await provider.getSigner();
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
                    let pos = await getPositionData(assets[i].tokenId, []);
                    const twodayChgInfo = await getChange2DayData(pos.poolAddr);
                    pos.twodayChgInfo = twodayChgInfo;
                    jsonData.assetValue = getLiquidityValue(pos, ethUSDPrice);
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
                <Text minW="140px" color="#555">{oName}</Text>
                <Box w="10px" h="10px" borderRadius="100%" bg="none" m="auto 10px"/>
                <Text fontWeight="bold">{value}</Text>
            </Flex>
        );
    };

    const renderDetailItem24 = (oName, value, percent) => {
        return (
            <Flex flexDirection="row" m="3px 0">
                <Text minW="140px" color="#555">{oName}</Text>
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

    const onApprove = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const signer = await provider.getSigner();
            setApproving(true);
            const hash = await setApprovalForAll(UNI_V3_NFT_POSITIONS_ADDRESS, UNIBOND_ADDRESS, signer);
            if (hash) {
                setIsUniv3Approved(true);
                toast({
                    title: "Success",
                    description: "Transaction is confirmed.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
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
            toast({
                title: "Error",
                description: "Transaction is reverted.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });            
        } finally {
            setApproving(false);
        }
    }

    const onList = async () => {
        try {
            const amount = convertToBigNumer(assetAmount + "", SUPPORT_ASSETS[curAsset].decimals);
            if (!amount || !parseFloat(amount)) {
                toast({
                    title: "Error",
                    description: "Amount can not be zero",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
                return;
            }
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const signer = await provider.getSigner();
            setListing(true);
            const hash = await createSwap(
                UNIBOND_ADDRESS,
                sellItem.tokenId,
                SUPPORT_ASSETS[curAsset].address,
                amount,
                curAsset ? 0 : 1,
                signer
            );
            if (hash) {
                toast({
                    title: "Success",
                    description: "Transaction is confirmed.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
                setIsModalOpen(false);
                setOnSaleAssets([...onsaleAssets, sellItem]);
                let i;
                const _newItems = [];
                for (i = 0; i < myItems.length; i ++)
                    if (myItems[i].tokenId !== sellItem.tokenId) _newItems.push(myItems[i]);
                setMyItems([..._newItems]);
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
            toast({
                title: "Error",
                description: "Transaction is reverted.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });       
        } finally {
            setListing(false);
        }

    }

    const renderApproveButton = () => {
        if (approving) {
            return (
                <Flex bg="#000" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none">
                    <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Approve</Text>
                    <Spinner size="sm"/>
                </Flex>
            );
        }
        if (!isUniv3approved)
            return (
                <Flex bg="#000" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s" onClick={onApprove}>
                    <Text fontWeight="bold" fontSize="14px">Approve</Text>
                </Flex>
            );
        return (
            <Flex bg="#aaa" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="not-allowed" userSelect="none">
                <Text fontWeight="bold" fontSize="14px">Approve</Text>
            </Flex>
        );
    }

    const getUSDPrice = () => {
        if (curAsset > 1) return assetAmount;
        else return assetAmount * ethUSD;
    }

    const renderModal = () => {
        if (!sellItem) return (null);
        return (
            <Modal isOpen={isModalOpen} onClose={onModalClose}>
                <ModalOverlay />
                <ModalContent bg="#fff" color="#000">
                    <ModalHeader fontSize="18px">Put on Sale</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box w="100%" h="1px" bg="#EDF0F3" mb="1rem"/>
                        <Flex flexDirection="row">
                            <Box minW={150}>
                                <Image src={sellItem.image} width={150} height={200} alt="" /> 
                            </Box>
                            <Box ml="1rem" mt="1rem" color="#555">
                                <Text fontSize="14px" fontWeight="bold">Token id: {sellItem.tokenId}</Text>
                                <Text fontSize="14px" fontWeight="bold" mt="1rem">{sellItem.name}</Text>
                            </Box>
                        </Flex>
                        <Box w="100%" h="1px" bg="#EDF0F3" m="1rem 0"/>
                        <Text fontWeight="bold" color="#555" fontSize="14px">Price for this item</Text>
                        <Flex flexDirection="row" justifyContent="space-between" mt="0.5rem">
                            <Flex flexDirection="row" m="auto 0" w="90px" border="1px solid #EDF0F3" borderRadius="5px" p="7px 2px">
                                <Flex flexDirection="row" cursor="pointer" onClick={onToggle} userSelect="none">
                                    <Image src={SUPPORT_ASSETS[curAsset].img} w="24px" m="auto 0"/>
                                    <Text fontSize="14px" m="auto 0.5rem">{SUPPORT_ASSETS[curAsset].name}</Text>
                                </Flex>
                            </Flex>
                            <Flex m="auto 0">
                                <NumberInput min={0} defaultValue={1} value={assetAmount} onChange={onAssetAmountChange}  outline="none">
                                    <NumberInputField  outline="none" _focus={{}} bg="#EDF0F3"/>
                                </NumberInput>
                            </Flex>
                            <Flex w="100px" border="1px solid #EDF0F3" borderRadius="5px">
                                <Text m="auto 0" p="0 0.5rem" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" fontSize="12px">$ {getUSDPrice()}</Text>
                            </Flex>
                        </Flex>
                        <Box mt="0.5rem" bg="#EDF0F3" p="0 0.5rem" borderRadius="10px" w="150px">
                            <Collapse in={isOpen} animateOpacity>
                                {SUPPORT_ASSETS.map((item, index) => {
                                    return (
                                        <Flex flexDirection="row" key={index} userSelect="none" cursor="pointer" m="0.5rem 0"
                                            onClick={() => {setCurAsset(index); onToggle();}}
                                        >
                                            <Image src={item.img} w="24px" m="auto 0"/>
                                            <Text fontSize="14px" m="auto 0.5rem">{item.name}</Text>
                                        </Flex>
                                    )
                                })}
                            </Collapse>
                        </Box>
                        <Box w="100%" h="1px" bg="#555" m="1rem 0"/>
                        <Flex flexDirection="row" justifyContent="center" mb="1rem">
                            {renderApproveButton()}
                            {renderListingButton()}
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    const renderListingButton = () => {
        if (listing) {
            return (
                <Flex bg="#000" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem">
                    <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Complete listing</Text>
                    <Spinner size="sm"/>
                </Flex>
            );
        }
        if (isUniv3approved)
            return (
                <Flex bg="#000" color="#fff"  p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s" ml="1rem" onClick={onList}>
                    <Text fontWeight="bold" fontSize="14px">Complete listing</Text>
                </Flex>
            );
        return (
            <Flex bg="#aaa" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="not-allowed" userSelect="none" ml="1rem">
                <Text fontWeight="bold" fontSize="14px">Complete listing</Text>
            </Flex>
        );
    }

    return (
        <Box w="100%" mt="6rem" minHeight="71vh" color="#000">
            {renderModal()}
            <Flex maxW="80rem" w="100%" m="2rem auto" p="0 1rem" flexDirection="column">
                <Flex flexDirection="row" justifyContent="space-between" mb="30px" bg="#EDF0F3" p="20px" borderRadius="10px">
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
                        return (
                            <Flex key={index} borderRadius="20px" p="20px 30px" flexDirection="row" bg="#EDF0F3">
                                <Image src={item.image} alt="/" maxW="140px" mr="30px"/>
                                <Flex flexDirection="column" mt="15px">
                                    {renderDetailItem("Asset Value:", "$ " + item.assetValue)}
                                    {renderDetailItem("Unclaimed Fees:", "$ " + item.feeValue)}
                                    {/* {renderDetailItem("LP Risk Profile:","-")} */}
                                    {renderDetailItem24("Volume 24h:", formatDollarAmount(item.chgData.volumeUSD), item.chgData.volumeUSDChange)}
                                    {renderDetailItem24("TVL:", formatDollarAmount(item.chgData.tvlUSD), item.chgData.tvlUSDChange)}
                                    <Flex flexDirection="row">
                                        <Flex bg="#000" m="15px auto 0 0" p="5px 30px" borderRadius="10px" color="#fff"
                                            cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s"
                                            onClick={() => {
                                                router.push("/pools/" + item.tokenId)
                                            }}
                                        >
                                            <Text>View</Text>
                                        </Flex>
                                        <Flex bg="#000" m="15px auto 0 0" p="5px 30px" borderRadius="10px" color="#fff"
                                            cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s"
                                            onClick={() => {
                                                onPutonSale(item);
                                            }}
                                        >
                                            <Text>Put on Sale</Text>
                                        </Flex>
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
                {(!loading && !myItems.length) &&
                    <Box w="100%">
                        <Text textAlign="center" color="#555" fontWeight="bold">You don't have any Uniswap V3 NFTs in your wallet.</Text>
                    </Box>
                }
            </Flex>
        </Box>
    );
}

export default MyPositionPage;