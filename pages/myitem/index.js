import { useEffect, useState }  from "react";
import axios                    from "axios";
import { ethers }               from "ethers";
import {
    Flex, 
    Box,
    Text,
    SimpleGrid,
    Tab,
    Tabs,
    TabList,
    TabPanels,
    TabPanel,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Collapse,
    Image,
    NumberInput,
    NumberInputField,
    useDisclosure,
    useToast,
    SkeletonText,
} from "@chakra-ui/core";
import { useWallet } from "use-wallet";
import { useRouter } from "next/router";
import {
    isWalletConnected,
    getWalletAddress
} from "../../lib/wallet";
import {
    ETHPRICE_QUERY,
    UNI_V3_NFT_POSITIONS_ADDRESS,
    UNIBOND_ADDRESS,
    ONSALE_ASSETS_QUERY,
    UNIBOND_GRAPH_ENDPOINT,
    OWNED_ASSETS_QUERY,
    SUPPORT_ASSETS,
} from "../../utils/const";
import {
    isApprovedForAll,
    setApprovalForAll,
    getTokenURI,
} from "../../contracts/erc721";
import {
    createSwap,
    cancelSwap,
} from "../../contracts/unibond";
const base64  = require("base-64");

const MyItemPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const toast = useToast();

    const { isOpen, onToggle } = useDisclosure();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [isUniv3approved, setIsUniv3Approved] = useState(false);
    const [approving, setApproving] = useState(false);
    const [listing, setListing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [sellItem, setSellItem] = useState(null);

    const [ethUSD, setETHUSD] = useState(0);
    const [curAsset, setCurAsset] = useState(0);
    const [assetAmount, setAssetAmount] = useState(0);

    const [myItems, setMyItems] = useState([]);
    const [onsaleAssets, setOnSaleAssets] = useState([]);

    const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';

    useEffect(() => {
        initialize()
    }, []);

    const initialize = async () => {
        let priceRes = await axios.post(graphqlEndpoint, {
          query: ETHPRICE_QUERY,
        });
        setETHUSD(parseFloat(priceRes.data.data.bundle.ethPriceUSD));
    }

    useEffect(async () => {
        const status = window.localStorage.getItem("Unibond");
        if (!isWalletConnected(wallet) && !status)
            router.push("/connect");
        if (isWalletConnected(wallet) && !loaded) {
            setLoaded(true);
            try {
                const address = getWalletAddress(wallet);
                const provider = new ethers.providers.Web3Provider(wallet.ethereum);
                const approved = await isApprovedForAll(UNI_V3_NFT_POSITIONS_ADDRESS, address, UNIBOND_ADDRESS, provider);
                setIsUniv3Approved(approved);
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
                    jsonData.swapId = assets[i].swapId;
                    _swapList.push(jsonData);
                }
                setMyItems([..._swapList])
                const onsaleAssets = await axios.post(UNIBOND_GRAPH_ENDPOINT, {
                  query: ONSALE_ASSETS_QUERY.replace('%1', address),
                });
                promises = [];
                _swapList = [];
                assets = onsaleAssets.data.data.swapLists;
                for (let i = 0; i < assets.length; i ++) {
                    const _swap = assets[i];
                    promises.push(getTokenURI(UNI_V3_NFT_POSITIONS_ADDRESS, _swap.tokenId, provider));
                }
                promiseResult = await Promise.all(promises);
                for(let i = 0; i < promiseResult.length; i ++) {
                    const parts = promiseResult[i].split(",");
                    const bytes = base64.decode(parts[1]);
                    let jsonData = JSON.parse(bytes);
                    jsonData.tokenId = assets[i].tokenId;
                    jsonData.swapId = assets[i].swapId;
                    _swapList.push(jsonData);
                }
                setOnSaleAssets([..._swapList]);
            } catch (e) {
                console.log("HHERE", e);
            } finally {
                setLoading(false);
            }
        }
    }, [wallet]);

    const onNFTSelect = (tokenId) => {
        router.push("/token?id=" + tokenId)
    }

    const onPutonSale = (item) => {
        setSellItem(item);
        setIsModalOpen(true);
    }

    const onModalClose = () => {
        setIsModalOpen(false);
    }

    const getUSDPrice = () => {
        if (curAsset > 1) return assetAmount;
        else return assetAmount * ethUSD;
    }

    const onAssetAmountChange = (value) => {
        setAssetAmount(value);
    }

    const renderModal = () => {
        if (!sellItem) return (null);
        return (
            <Modal isOpen={isModalOpen} onClose={onModalClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Sell your item</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box w="100%" h="1px" bg="#555" mb="1rem"/>
                        <Flex flexDirection="row">
                            <Box minW={150}>
                                <Image src={sellItem.image} width={150} height={200} alt="" /> 
                            </Box>
                            <Box ml="1rem" mt="1rem" color="#ccc">
                                <Text fontSize="14px" fontWeight="bold">Token id: {sellItem.tokenId}</Text>
                                <Text fontSize="14px" fontWeight="bold" mt="1rem">{sellItem.name}</Text>
                            </Box>
                        </Flex>
                        <Box w="100%" h="1px" bg="#555" m="1rem 0"/>
                        <Text fontWeight="bold">Price for this item</Text>
                        <Flex flexDirection="row" justifyContent="space-between" mt="0.5rem">
                            <Flex flexDirection="row" m="auto 0" w="90px">
                                <Flex flexDirection="row" cursor="pointer" onClick={onToggle} userSelect="none">
                                    <Image src={SUPPORT_ASSETS[curAsset].img} w="24px" m="auto 0"/>
                                    <Text fontSize="14px" m="auto 0.5rem">{SUPPORT_ASSETS[curAsset].name}</Text>
                                </Flex>
                            </Flex>
                            <Flex m="auto 0">
                                <NumberInput min={0} defaultValue={1} value={assetAmount} onChange={onAssetAmountChange}>
                                    <NumberInputField />
                                </NumberInput>
                            </Flex>
                            <Flex w="100px" border="1px solid #4F5765" borderRadius="5px">
                                <Text m="auto 0" p="0 0.5rem" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap" fontSize="12px">$ {getUSDPrice()}</Text>
                            </Flex>
                        </Flex>
                        <Box mt="0.5rem" bg="#131313" p="0 0.5rem" borderRadius="10px" w="150px">
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

    const renderApproveButton = () => {
        if (approving) {
            return (
                <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none">
                    <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Approve</Text>
                    <Spinner size="sm"/>
                </Flex>
            );
        }
        if (!isUniv3approved)
            return (
                <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s" onClick={onApprove}>
                    <Text fontWeight="bold" fontSize="14px">Approve</Text>
                </Flex>
            );
        return (
            <Flex bg="#aaa" p="0.5rem 1rem" borderRadius="10px" cursor="not-allowed" userSelect="none">
                <Text fontWeight="bold" fontSize="14px">Approve</Text>
            </Flex>
        );
    }

    const convertToBigNumer = (str, decimals) => {
        const parts = str.split(".");
        let plen = 0;
        if (parts[1] && parts[1].length) plen = parts[1].length;
        if (plen > decimals) return "";
        return parts[0] + (plen ? parts[1] : "") + "0".repeat(decimals - plen);
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

    const renderListingButton = () => {
        if (listing) {
            return (
                <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem">
                    <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Complete listing</Text>
                    <Spinner size="sm"/>
                </Flex>
            );
        }
        if (isUniv3approved)
            return (
                <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" _hover={{opacity: 0.9}} transition="0.2s" ml="1rem" onClick={onList}>
                    <Text fontWeight="bold" fontSize="14px">Complete listing</Text>
                </Flex>
            );
        return (
            <Flex bg="#aaa" p="0.5rem 1rem" borderRadius="10px" cursor="not-allowed" userSelect="none" ml="1rem">
                <Text fontWeight="bold" fontSize="14px">Complete listing</Text>
            </Flex>
        );
    }

    const renderOwnedPanel = () => {
        if (myItems.length)
            return (
                <TabPanel>
                    <SimpleGrid spacing="1rem" minChildWidth="15rem" w="100%">
                        {myItems.map((item, index) => {
                            return (
                                <Box key={index} border="1px solid #2e2e2e" p="2rem 0 0rem 0" borderRadius="10px" userSelect="none" 
                                    _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                                >
                                    <Flex flexDirection="row" justifyContent="center" cursor="pointer" onClick={() => onNFTSelect(item.tokenId)}>
                                        <Image src={item.image} width={150} height={200} alt=""/>
                                    </Flex>
                                    <Text fontSize="12px" p="1rem 0.5rem" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">{item.name}</Text>
                                    <Flex flexDirection="row" m="0 1rem 1rem 1rem">
                                        <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" m="0 auto" onClick={() => onPutonSale(item)}>
                                            <Text fontSize="12px">Put on Sale</Text>
                                        </Flex>
                                    </Flex>
                                </Box>
                            )
                        })}
                        <Box/>
                        <Box/>
                        <Box/>
                    </SimpleGrid>
                </TabPanel>
            );
        return (
            <TabPanel>
                <Flex mt="3rem" flexDirection="column">
                    <Text m="0 auto" fontSize="24px" fontWeight="bold">No items found</Text>
                    <Text m="0 auto" fontSize="18px" fontWeight="bold" color="#999" pt="1rem">Please try to browse something for you on our marketplace</Text>
                    <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" m="2rem auto" onClick={() => {router.push("/salelist")}}>
                        <Text fontSize="12px">Browse marketplace</Text>
                    </Flex>
                </Flex>
            </TabPanel>
        );
    }

    const onCancelSale = async (item) => {
        if (listing) return;
        try {
            setListing(true);
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const signer = await provider.getSigner();
            const hash = await cancelSwap(UNIBOND_ADDRESS, item.swapId, signer);
            if (hash) {
                toast({
                    title: "Success",
                    description: "Transaction is confirmed.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
                setMyItems([...myItems, item]);
                let i;
                const _newItems = [];
                for (i = 0; i < onsaleAssets.length; i ++)
                    if (onsaleAssets[i].tokenId !== item.tokenId) _newItems.push(onsaleAssets[i]);
                setOnSaleAssets([..._newItems]);
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

    const renderOnSalePanel = () => {
        if (onsaleAssets.length)
            return (
                <TabPanel>
                    <SimpleGrid spacing="1rem" minChildWidth="15rem" w="100%">
                        {onsaleAssets.map((item, index) => {
                            let tempItem = item;
                            return (
                                <Box key={index} border="1px solid #2e2e2e" p="2rem 0 0rem 0" borderRadius="10px" userSelect="none" 
                                    _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                                >
                                    <Flex flexDirection="row" justifyContent="center" cursor="pointer" onClick={() => onNFTSelect(item.tokenId)}>
                                        <Image src={item.image} width={150} height={200} alt=""/>
                                    </Flex>
                                    <Text fontSize="12px" p="1rem 0.5rem" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">{item.name}</Text>
                                    <Flex flexDirection="row" m="0 1rem 1rem 1rem">
                                        <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" m="0 auto" onClick={() => onCancelSale(tempItem)}>
                                            <Text fontSize="12px">Cancel Sale</Text>
                                            {listing && <Spinner size="sm" ml="0.5rem"/>}
                                        </Flex>
                                    </Flex>
                                </Box>
                            )
                        })}
                        <Box/>
                        <Box/>
                        <Box/>
                    </SimpleGrid>
                </TabPanel>
            );
        return (
            <TabPanel>
                <Flex mt="3rem" flexDirection="column">
                    <Text m="0 auto" fontSize="24px" fontWeight="bold">No items found</Text>
                    <Text m="0 auto" fontSize="18px" fontWeight="bold" color="#999" pt="1rem">Please try to browse something for you on our marketplace</Text>
                    <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" m="2rem auto" onClick={() => {router.push("/salelist")}}>
                        <Text fontSize="12px">Browse marketplace</Text>
                    </Flex>
                </Flex>
            </TabPanel>
        );
    }

    return (
        <Box w="100%" mt="6rem" height={loading?'71vh':'100%'}>
            {renderModal()}
            {loading?
                <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                    <Box padding="6" boxShadow="lg">
                        <SkeletonText mt="4" noOfLines={4} spacing="4" />
                    </Box>
                </Flex>:
                <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                    <Tabs variant="enclosed">
                        <TabList>
                            <Tab>Owned ({myItems.length})</Tab>
                            <Tab>On Sale ({onsaleAssets.length})</Tab>
                        </TabList>
                        <TabPanels>
                            {renderOwnedPanel()}
                            {renderOnSalePanel()}
                        </TabPanels>
                    </Tabs>
                </Flex>
            }
        </Box>
    )
}

export default MyItemPage;
  