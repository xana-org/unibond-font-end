import { useEffect, useState }  from "react";
import Image                    from "next/image";
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
    Image as ChakraImg,
    NumberInput,
    NumberInputField,
    useDisclosure,
} from "@chakra-ui/core";
import { useWallet } from "use-wallet";
import { useRouter } from "next/router";
import {
    isWalletConnected,
    getWalletAddress
} from "../../lib/wallet";
import {
    getAllAssets
} from "../../opensea/api";
import {
    ETHPRICE_QUERY,
    UNI_V3_NFT_POSITIONS_ADDRESS,
    UNIBOND_ADDRESS,
} from "../../utils/const";
import {
    isApprovedForAll,
    setApprovalForAll
} from "../../contracts/erc721";
import {
    createSwap
} from "../../contracts/unibond";

const MyItemPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const [loaded, setLoaded] = useState(false);
    const [myItems, setMyItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sellItem, setSellItem] = useState(null);
    const [ethUSD, setETHUSD] = useState(0);
    const [curAsset, setCurAsset] = useState(0);
    const { isOpen, onToggle } = useDisclosure();
    const [assetAmount, setAssetAmount] = useState(0);
    const [isUniv3approved, setIsUniv3Approved] = useState(false);
    const [approving, setApproving] = useState(false);
    const [listing, setListing] = useState(false);

    const supportAssets = [
        {name: "ETH", img: "/images/assets/eth.png"},
        {name: "WETH", img: "/images/assets/WETH.png", address: "0xdf032bc4b9dc2782bb09352007d4c57b75160b15", decimals: 18},
        {name: "DAI", img: "/images/assets/DAI.png", address: "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735", decimals: 18},
        //{name: "USDT", img: "/images/assets/USDT.png"},
    ];
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
            const address = getWalletAddress(wallet);
            const res = await getAllAssets(address, 0, 50);
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const approved = await isApprovedForAll(UNI_V3_NFT_POSITIONS_ADDRESS, address, UNIBOND_ADDRESS, provider);
            setIsUniv3Approved(approved);
            if (res && res.assets) {
                console.log(res.assets);
                setMyItems([...res.assets]);
            }
        }
    }, [wallet]);

    const onNFTSelect = (item) => {
        router.push("/token?id=" + item.token_id)
    }

    const onPutonSale = (item) => {
        console.log(item);
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
                                <Image src={sellItem.image_thumbnail_url} width={150} height={200} alt="" priority={true} loading="eager"/> 
                            </Box>
                            <Box ml="1rem" mt="1rem" color="#ccc">
                                <Text fontSize="14px" fontWeight="bold">Token id: {sellItem.token_id}</Text>
                                <Text fontSize="14px" fontWeight="bold" mt="1rem">{sellItem.name}</Text>
                            </Box>
                        </Flex>
                        <Box w="100%" h="1px" bg="#555" m="1rem 0"/>
                        <Text fontWeight="bold">Price for this item</Text>
                        <Flex flexDirection="row" justifyContent="space-between" mt="0.5rem">
                            <Flex flexDirection="row" m="auto 0" w="90px">
                                <Flex flexDirection="row" cursor="pointer" onClick={onToggle} userSelect="none">
                                    <ChakraImg src={supportAssets[curAsset].img} w="24px" m="auto 0"/>
                                    <Text fontSize="14px" m="auto 0.5rem">{supportAssets[curAsset].name}</Text>
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
                                {supportAssets.map((item, index) => {
                                    return (
                                        <Flex flexDirection="row" key={index} userSelect="none" cursor="pointer" m="0.5rem 0"
                                            onClick={() => {setCurAsset(index); onToggle();}}
                                        >
                                            <ChakraImg src={item.img} w="24px" m="auto 0"/>
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
            }
        } catch (e) {
            
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

    const onList = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(wallet.ethereum);
            const signer = await provider.getSigner();
            setListing(true);
            // const hash = await createSwap(
            //     UNIBOND_ADDRESS,
            //     sellItem.
            //     signer
            // );
            if (hash) {
                setIsUniv3Approved(true);
            }
        } catch (e) {
            
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

    return (
        <Box w="100%" mt="6rem">
            {renderModal()}
            {!loaded?
                <Flex>
                    <Spinner m="0 auto"/>
                </Flex>:
                <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                    <Tabs variant="enclosed">
                        <TabList>
                            <Tab>Owned ({myItems.length})</Tab>
                            <Tab>On Sale</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <SimpleGrid spacing="1rem" minChildWidth="15rem" w="100%">
                                    {myItems.map((item, index) => {
                                        if (!item.image_thumbnail_url) return (null);
                                        return (
                                            <Box key={index} border="1px solid #2e2e2e" p="2rem 0 0rem 0" borderRadius="10px" userSelect="none" 
                                                _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                                            >
                                                <Flex flexDirection="row" justifyContent="center" cursor="pointer" onClick={() => onNFTSelect(item)}>
                                                    <Image src={item.image_thumbnail_url} width={150} height={200} alt="" priority={true} loading="eager"/>
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
                            <TabPanel>
                            <p>two!</p>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Flex>
            }
        </Box>
    )
}

export default MyItemPage;
  