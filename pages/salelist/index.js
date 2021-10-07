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
  SimpleGrid,
  SkeletonText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Select,
} from "@chakra-ui/core";
import { ArrowDownIcon, ArrowUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  getTokenURI
} from "../../contracts/erc721";
import {
  SALELIST_ASSETS_QUERY,
  UNIBOND_GRAPH_ENDPOINT,
  UNI_V3_NFT_POSITIONS_ADDRESS,
  JSON_PROVIDER,
  SUPPORT_ASSETS,
  ETHPRICE_QUERY,
  UNIBOND_ADDRESS,
} from "../../utils/const";
import {
  isWalletConnected,
  getWalletAddress
} from "../../lib/wallet";
import {
  swapWithETH,
  swapWithToken
} from "../../contracts/unibond";
import {
  getAllowance,
  approveAsset
} from "../../contracts/erc20";
import {
  getLiquidityValue,
  getFeeValue,
  getPositionData,
  getChange2DayData,
  formatDollarAmount,
} from "../../lib/helper";
const base64  = require("base-64");
import BigNumber from "bignumber.js";

const SaleList = () => {
  const toast = useToast();
  const wallet = useWallet();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [offset, setOffset] = useState(0);
  const [approved, setApproved] = useState(false);
  const [saleList, setSaleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ethUSD, setETHUSD] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buyItem, setBuyItem] = useState(null);
  const [nodata, setNodata] = useState(false);
  const [curTab, setCurTab] = useState("1");

  const [confirming, setConfirming] = useState(false);

  const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';

  useEffect(async () => {
    let priceRes = await axios.post(graphqlEndpoint, {
      query: ETHPRICE_QUERY,
    });
    setETHUSD(parseFloat(priceRes.data.data.bundle.ethPriceUSD));
    loadData(0, "1", parseFloat(priceRes.data.data.bundle.ethPriceUSD));
  }, []);

  const loadData = async (offset, fstatus, ethUSDPrice) => {
    setLoading(true);
    try {
      const _salelist = await axios.post(UNIBOND_GRAPH_ENDPOINT, {
          query: SALELIST_ASSETS_QUERY.replace('%1', offset).replace('%2', fstatus),
      });
      let promises = [];
      let _swapList = [];
      if (_salelist && _salelist.data && _salelist.data.data && _salelist.data.data.swapLists) {
        const provider = new ethers.providers.JsonRpcProvider(JSON_PROVIDER);
        const assets = _salelist.data.data.swapLists;
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
            jsonData.status = assets[i].status;
            jsonData.buyer = assets[i].buyer;
            jsonData.amount = assets[i].amount;
            jsonData.payToken = assets[i].payToken;

            let pos = await getPositionData(assets[i].tokenId, []);
            const twodayChgInfo = await getChange2DayData(pos.poolAddr);
            pos.twodayChgInfo = twodayChgInfo;
            jsonData.assetValue = getLiquidityValue(pos, ethUSDPrice);
            jsonData.feeValue = getFeeValue(pos, ethUSDPrice);
            jsonData.chgData = pos.twodayChgInfo;
            jsonData.poolAddress = pos.poolAddr;
            _swapList.push(jsonData);
        }
        if (_swapList.length < 8) setNodata(true);
        else setNodata(false);
        if (offset === 0)
          setSaleList([..._swapList]);
        else
          setSaleList([...saleList, ..._swapList]);
        setOffset(offset + _swapList.length);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const renderStatus = (item) => {
    if (item.status === "1")
      return (
        <Flex flexDirection="row" justifyContent="space-between" p="0 1rem">
          <Flex flexDirection="row">
            <Box w="12px" h="12px" borderRadius="100%" bg="#26AE60" margin="auto 10px auto 0"></Box>
            <Text color="#26AE60" fontWeight="bold">Open</Text>
          </Flex>
          <Text color="#26AE60" fontWeight="bold">{item.swapId}</Text>
        </Flex>
      ); 
    else if (item.status === "2")
      return (
        <Flex flexDirection="row" justifyContent="space-between" p="0 1rem">
          <Flex flexDirection="row">
            <Box w="12px" h="12px" borderRadius="100%" bg="#FF8F00" margin="auto 10px auto 0"></Box>
            <Text color="#FF8F00" fontWeight="bold">Sold</Text>
          </Flex>
          <Text color="#FF8F00" fontWeight="bold">{item.swapId}</Text>
        </Flex>
    )
    return (
      <Flex flexDirection="row" justifyContent="space-between" p="0 1rem">
        <Flex flexDirection="row">
          <Box w="12px" h="12px" borderRadius="100%" bg="#F65770" margin="auto 10px auto 0"></Box>
          <Text color="#F65770" fontWeight="bold">Canceled</Text>
        </Flex>
        <Text color="#F65770" fontWeight="bold">{item.swapId}</Text>
      </Flex>
    )
  }

  const getUSDPrice = (index, amount) => {
    if (index > 1) return amount;
    else return amount * ethUSD;
}

  const renderPrice = (item) => {
    let index = 0;
    for (let i = 0; i < SUPPORT_ASSETS.length; i ++) {
      if (item.payToken.toLowerCase() === SUPPORT_ASSETS[i].address.toLowerCase()) {
        index = i; break;
      }
    }
    const sAsset = SUPPORT_ASSETS[index];
    const amount = parseFloat(item.amount) / Math.pow(10, sAsset.decimals);
    return (
      <Box p="10px 0rem">
        <Flex flexDirection="row" justifyContent="space-between">
          <Text fontSize="14px" color="#555" m="auto 10px auto 0">on sale for</Text>
          <Flex flexDirection="row">
            <Image src={sAsset.img} h="20px"/>
            <Text fontSize="14px" m="auto 5px auto 5px" fontWeight="bold">{amount.toFixed(4)}</Text>
            <Text fontSize="14px" color="#000" m="auto 0">{sAsset.name}</Text>
          </Flex>
        </Flex>
        <Text textAlign="right" fontSize="14px" color="#000" m="auto 0 auto" fontWeight="bold">${getUSDPrice(index, amount).toFixed(3)} (USD)</Text>
      </Box>
    )
  }

  const onBuy = async (item) => {
    setBuyItem(item);
    setIsModalOpen(true);
    if (wallet && isWalletConnected(wallet) && item.status === "1" && item.payToken.toLowerCase() !== "0x000000000000000000000000000000000000dead") {
      try {
        const provider = new ethers.providers.Web3Provider(wallet.ethereum);
        const walletAddr = getWalletAddress(wallet);
        const allowance = await getAllowance(item.payToken, walletAddr, UNIBOND_ADDRESS, provider);
        const bA = new BigNumber(allowance);
        if (bA.greaterThanOrEqualTo(item.amount)) setApproved(true);
        else setApproved(false);
      } catch (e) {
        console.log(e);
      }
    }
  }

  const renderAction = (item) => {
    if (!wallet || !isWalletConnected(wallet)) return (null);
    if (item.status === "1") {
      return (
        <Flex flexDirection="row">
            <Flex bg="#000" color="#fff" p="0.5rem 2rem" borderRadius="10px" cursor="pointer" onClick={() => onNFTSelect(item)} _hover={{opacity: 0.9}}>
                <Text fontSize="14px">View</Text>
            </Flex>
            <Flex bg="#000" color="#fff" p="0.5rem 2rem" borderRadius="10px" cursor="pointer" onClick={() => onBuy(item)} ml="1rem" _hover={{opacity: 0.9}}>
                <Text fontSize="14px">Buy</Text>
            </Flex>
        </Flex>
      )
    }
  }

  const onModalClose = () => {
    setIsModalOpen(false);
  }

  const onApproveItem = async () => {
    try {
      setConfirming(true);
      const provider = new ethers.providers.Web3Provider(wallet.ethereum);
      const signer = await provider.getSigner();
      const hash = await approveAsset(buyItem.payToken, UNIBOND_ADDRESS, signer);
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
    if (buyItem.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead") {
      return (null);
    }
    if (!approved) {
      if (confirming) {
        return (
            <Flex bg="#2D81FF80" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none">
                <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Approve</Text>
                <Spinner size="sm" m="auto 0"/>
            </Flex>
        );
      }
      return (
        <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" onClick={onApproveItem}>
            <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Approve</Text>
        </Flex>
      );
    }
    return (
      <Flex bg="#aaa" p="0.5rem 1rem" borderRadius="10px" userSelect="none">
          <Text fontWeight="bold" fontSize="14px" mr="0.5rem">Approve</Text>
      </Flex>
    );
  }

  const onBuyItem = async () => {
    try {
      setConfirming(true);
      const provider = new ethers.providers.Web3Provider(wallet.ethereum);
      const signer = await provider.getSigner();
      let hash = "";
      console.log("item: ", buyItem);
      if (buyItem.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead") {
        hash = await swapWithETH(UNIBOND_ADDRESS, parseFloat(buyItem.amount) / Math.pow(10, 18), buyItem.swapId, signer);
      } else {
        hash = await swapWithToken(UNIBOND_ADDRESS, buyItem.swapId, signer);
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
        const _newItems = [];
        for (let i = 0; i < myItems.length; i ++)
            if (saleList[i].tokenId !== buyItem.tokenId) _newItems.push(myItems[i]);
        setSaleList([..._newItems]);

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
      console.log(e)
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

  const renderBuyButton = () => {
    if (approved || (buyItem && buyItem.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead")) {
      if (confirming) {
        return (
            <Flex bg="#000" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem">
                <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
                <Spinner size="sm"/>
            </Flex>
        );
      }
      return (
        <Flex bg="#000" color="#fff" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem" onClick={onBuyItem}>
            <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
        </Flex>
      );
    }
    return (
      <Flex bg="#aaa" color="#fff" p="0.5rem 1rem" borderRadius="10px" userSelect="none" ml="1rem">
          <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
      </Flex>
    );
  }

  const renderModal = () => {
    if (!buyItem) return (null);
    console.log(buyItem);
    return (
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="lg">
          <ModalOverlay />
          <ModalContent bg="#fff" color="#000">
              <ModalHeader fontSize="18px">Buy Now</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                  <Box w="100%" h="1px" bg="#555" mb="1rem"/>
                  <Flex flexDirection="row">
                      <Box minW={150}>
                          <Image src={buyItem.image} width={150} height={200} alt="" /> 
                      </Box>
                      <Box ml="1rem" mt="1rem" w="100%">
                        {renderDetailItem("Asset Value:", "$ " + buyItem.assetValue)}
                        {renderDetailItem("Unclaimed Fees:", "$ " + buyItem.feeValue)}
                        {renderPrice(buyItem)}
                      </Box>
                  </Flex>
                  <Box w="100%" h="1px" bg="#555" m="1rem 0"/>
                  {buyItem.status === "1" && <Flex flexDirection="row" justifyContent="center" mb="1rem">
                      {renderApproveButton()}
                      {renderBuyButton()}
                  </Flex>}
              </ModalBody>
          </ModalContent>
      </Modal>
    )
  }

  const onFilterChange = (curId) => {
    setCurTab(curId);
    setSaleList([]);
    setOffset(0);
    loadData(0, curId, ethUSD);
  }
  const onNFTSelect = (item) => {
    router.push("/pools/" + item.tokenId)
  }
  const renderFilterOption = () => {
    return (
        <Flex flexDirection="row" mb="30px">
            <Flex bg={curTab !== "1"?"#aaa":"#000"} color="#fff" borderRadius="10px" p="8px 20px" fontSize="14px" fontWeight="bold"
                cursor="pointer" _hover={{opacity: 0.9}} userSelect="none" onClick={() => {onFilterChange("1")}}
            >
                Open
            </Flex>
            <Flex bg={curTab !== "2"?"#aaa":"#000"} color="#fff" borderRadius="10px" p="8px 20px" fontSize="14px" fontWeight="bold" ml="10px"
                cursor="pointer" _hover={{opacity: 0.9}} userSelect="none" onClick={() => {onFilterChange("2")}}
            >
                Sold
            </Flex>
            <Flex bg={curTab !== "0"?"#aaa":"#000"} color="#fff" borderRadius="10px" p="8px 20px" fontSize="14px" fontWeight="bold" ml="10px"
                cursor="pointer" _hover={{opacity: 0.9}} userSelect="none" onClick={() => {onFilterChange("0")}}
            >
                Close
            </Flex>
        </Flex>
    )
  }

  const renderDetailItem = (oName, value) => {
    return (
        <Flex flexDirection="row" m="3px 0" fontSize="14px">
            <Text minW="140px" color="#555">{oName}</Text>
            <Box w="10px" h="10px" borderRadius="100%" bg="none" m="auto 10px"/>
            <Text fontWeight="bold">{value}</Text>
        </Flex>
    );
  };

  const renderDetailItem24 = (oName, value, percent) => {
      return (
          <Flex flexDirection="row" m="3px 0" fontSize="14px">
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

  return (
    <Box w="100%" mt="6rem" minHeight="71vh" color="#000">
      {renderModal()}
      <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
        {renderFilterOption()}
        <SimpleGrid spacing="1rem" minChildWidth="30rem" w="100%">
          {saleList.map((item, index) => {
              return (
                  <Box key={index} bg="#EDF0F3" p="10px 0" borderRadius="10px" userSelect="none">
                    {renderStatus(item)}
                    <Flex flexDirection="row" p="10px">
                      <Flex flexDirection="row" justifyContent="center" cursor="pointer" onClick={() => onNFTSelect(item)} w="300px">
                          <Image src={item.image} width={250} height={250} alt=""/>
                      </Flex>
                      <Box w="100%">
                        <Text fontSize="14px" p="1rem 0.5rem 0 0.5rem" color="#000" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden" fontWeight="bold">{item.name}</Text>
                        <Box p="0 10px" color="#000">
                          {renderDetailItem("Asset Value:", "$ " + item.assetValue)}
                          {renderDetailItem("Unclaimed Fees:", "$ " + item.feeValue)}
                          {/* {renderDetailItem("LP Risk Profile:","-")} */}
                          {renderDetailItem24("Volume 24h:", formatDollarAmount(item.chgData.volumeUSD), item.chgData.volumeUSDChange)}
                          {renderDetailItem24("TVL:", formatDollarAmount(item.chgData.tvlUSD), item.chgData.tvlUSDChange)}
                          <Box w="100%" h="1px" bg="#aaa" m="10px 0"/>
                          {renderPrice(item)}
                        </Box>
                        {renderAction(item)}
                      </Box>
                    </Flex>
                  </Box>
              )
          })}
          <Box/>
          <Box/>
          <Box/>
        </SimpleGrid>
        {loading?
            <Box padding="6" boxShadow="lg">
                <SkeletonText mt="4" noOfLines={4} spacing="4" />
            </Box>:
            (nodata?(null):
              <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} m="1rem auto" onClick={() => loadData(offset, curTab, ethUSD)}>
                  <Text fontSize="14px" fontWeight="bold">Load more</Text>
              </Flex>
            )
        }
        {(!loading && saleList.length === 0) && 
          <Box w="100%">
              <Text textAlign="center" color="#555" fontWeight="bold">No Data</Text>
          </Box>
        }
      </Flex>
    </Box>
  )
}
export default SaleList;
  