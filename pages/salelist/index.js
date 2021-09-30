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

  const [confirming, setConfirming] = useState(false);
  const [fOption, setfOption] = useState("1");

  const graphqlEndpoint ='https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';

  useEffect(async () => {
    let priceRes = await axios.post(graphqlEndpoint, {
      query: ETHPRICE_QUERY,
    });
    setETHUSD(parseFloat(priceRes.data.data.bundle.ethPriceUSD));
    loadData(0, "1");
  }, []);

  const loadData = async (offset, fstatus) => {
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
          <Text fontSize="12px" color="#000" m="auto 10px auto 0">on sale for</Text>
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
            <Flex bg="#2D81FF" p="0.5rem 1.5rem" borderRadius="10px" cursor="pointer" m="0 auto" onClick={() => onNFTSelect(item)}>
                <Text fontSize="12px">Buy</Text>
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
                <Spinner size="sm"/>
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

  const renderBuyButton = () => {
    if (approved || (buyItem && buyItem.payToken.toLowerCase() === "0x000000000000000000000000000000000000dead")) {
      if (confirming) {
        return (
            <Flex bg="#2D81FF80" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem">
                <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
                <Spinner size="sm"/>
            </Flex>
        );
      }
      return (
        <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="10px" cursor="pointer" userSelect="none" ml="1rem" onClick={onBuyItem}>
            <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
        </Flex>
      );
    }
    return (
      <Flex bg="#aaa" p="0.5rem 1rem" borderRadius="10px" userSelect="none" ml="1rem">
          <Text fontWeight="bold" fontSize="14px" mr="0.5rem">BUY NOW</Text>
      </Flex>
    );
  }

  const renderModal = () => {
    if (!buyItem) return (null);
    console.log(buyItem);
    return (
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
          <ModalOverlay />
          <ModalContent>
              <ModalHeader>Item Info</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                  <Box w="100%" h="1px" bg="#555" mb="1rem"/>
                  <Flex flexDirection="row">
                      <Box minW={150}>
                          <Image src={buyItem.image} width={150} height={200} alt="" /> 
                      </Box>
                      <Box ml="1rem" mt="1rem" color="#ccc">
                        <Text fontSize="14px" fontWeight="bold">Token id: {buyItem.tokenId}</Text>
                        <Text fontSize="14px" fontWeight="bold" mt="1rem">{buyItem.name}</Text>
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

  const onFilterChange = (e) => {
    setfOption(e.target.value);
    setSaleList([]);
    setOffset(0);
    loadData(0, e.target.value);
  }
  const onNFTSelect = (item) => {
    router.push("/pools/" + item.tokenId)
  }
  const renderFilterOption = () => {
    return (
      <Box mb="30px">
        <Box w="30%" minW="300px">
          <Select placeholder="Select option" onChange={onFilterChange}>
            <option value="1">Open</option>
            <option value="2">Sold items</option>
            <option value="0">Closed</option>
          </Select>
        </Box>
      </Box>
    )
  }

  return (
    <Box w="100%" mt="6rem" minHeight="71vh">
      {renderModal()}
      <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
        {renderFilterOption()}
        <SimpleGrid spacing="1rem" minChildWidth="15rem" w="100%">
          {saleList.map((item, index) => {
              return (
                  <Box key={index} border="1px solid #2e2e2e" p="10px 0" borderRadius="10px" userSelect="none" 
                      _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                  >
                    {renderStatus(item)}
                      <Flex flexDirection="row" justifyContent="center" cursor="pointer" onClick={() => onNFTSelect(item)}>
                          <Image src={item.image} width={150} height={200} alt=""/>
                      </Flex>
                      <Text fontSize="12px" p="1rem 0.5rem 0 0.5rem" color="#000" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">{item.name}</Text>
                      <Box p="0 10px" color="#000">
                        {renderPrice(item)}
                      </Box>
                      {renderAction(item)}
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
              <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} m="1rem auto" onClick={() => loadData(offset, fOption)}>
                  <Text fontSize="14px" fontWeight="bold">Load more</Text>
              </Flex>
            )
        }
      </Flex>
    </Box>
  )
}
export default SaleList;
  