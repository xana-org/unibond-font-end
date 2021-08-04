import { useEffect, useState }  from "react";
import { useWallet }            from "use-wallet";
import { useRouter }            from "next/router";
import { ethers }               from "ethers";
import axios                    from "axios";
import {
    Flex, 
    Box,
    Text,
    SimpleGrid,
    Spinner,
    Image
} from "@chakra-ui/core";
import {
    getTotalSupply
} from "../../contracts/univ3_positions_nft";
import {
    UNI_V3_NFT_POSITIONS_ADDRESS,
    EXPLORE_QUERY,
    UNIBOND_GRAPH_ENDPOINT,
    JSON_PROVIDER,
} from "../../utils/const";
import {
    getTokenURI
} from "../../contracts/erc721";
const base64  = require("base-64");

const ExplorePage = () => {
    const router = useRouter();
    const [univ3Data, setUniv3Data] = useState([]);
    const [offset, setOffset] = useState(0);
    const [tSupply, setTSupply] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        initialize();
    }, []);

    const loadData = async (skip) => {
        try {
            let assets = await axios.post(UNIBOND_GRAPH_ENDPOINT, {
                query: EXPLORE_QUERY.replace("%1", skip),
            });
            if (assets && assets.data && assets.data.data && assets.data.data.tokenHolders) {
                const provider = new ethers.providers.JsonRpcProvider(JSON_PROVIDER);
                const _data = [];
                const _promises = [];
                const len = assets.data.data.tokenHolders.length;
                for (let i = 0; i < len; i ++) {
                    const item = assets.data.data.tokenHolders[i];
                    _promises.push(getTokenURI(UNI_V3_NFT_POSITIONS_ADDRESS, item.tokenId, provider));
                }
                const promiseResult = await Promise.all(_promises);
                for(let i = 0; i < promiseResult.length; i ++) {
                    const item = assets.data.data.tokenHolders[i];
                    const parts = promiseResult[i].split(",");
                    const bytes = base64.decode(parts[1]);
                    let jsonData = JSON.parse(bytes);
                    jsonData.tokenId = item.tokenId;
                    _data.push(jsonData);
                }
                setUniv3Data(univ3Data.concat(_data));
                setOffset(offset + _data.length);
            }
        } catch (e) {
            console.log("error", e);
        }
    }

    const initialize = async () => {
        try {
            await loadData(0);
        } catch (e) {

        } finally {
            setLoading(false);
        }

        try {
            const provider = new ethers.providers.JsonRpcProvider(JSON_PROVIDER);
            const tSupply = await getTotalSupply(UNI_V3_NFT_POSITIONS_ADDRESS, provider);
            if (tSupply)
                setTSupply(tSupply);
        } catch (e) {

        }
    }

    const formattSupply = () => {
        if(!tSupply)
            return (
                <Flex>
                    <Spinner m="0.5rem auto"/>
                </Flex>
            );
        const tsupply = parseInt(tSupply) / 1000;
        return <Text fontWeight="bold" fontSize="30px">{tsupply.toString().match(/^-?\d+(?:\.\d{0,1})?/) + 'K'}</Text>
    }

    const onNFTSelect = (item) => {
        router.push("/token?id=" + item.tokenId)
    }

    const loadMore = async () => {
        setLoading(true);
        try {
            await loadData(offset);
        } catch(e) {

        } finally {
            setLoading(false);
        }
    }

    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Box mb="2rem">
                    <Flex flexDirection="row" justifyContent="center">
                        <Image w="60px" src="/images/tokenpage/uni.png" borderRadius="100%"/>
                        <Text fontWeight="bold" fontSize="24px" m="auto 0 auto 1rem">Uniswap V3 Positions</Text>
                    </Flex>
                    <Flex m="1rem auto" flexDirection="row" justifyContent="center">
                        <Box border="1px solid #333" p="0.5rem 1rem">
                            {formattSupply()}
                            <Text textAlign="center" color="#777">items</Text>
                        </Box>
                    </Flex>
                    <Text textAlign="center" color="#aaa" fontSize="14px">Welcome to the home of Uniswap V3 Positions on Zoracles. Discover the best items in this collection.</Text>
                </Box>
                <SimpleGrid spacing="1rem" minChildWidth="15rem" w="100%">
                    {univ3Data.map((item, index) => {
                        return (
                            <Box key={index} border="1px solid #2e2e2e" p="2rem 0 0rem 0" borderRadius="10px" cursor="pointer" userSelect="none" 
                                _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                                onClick={() => onNFTSelect(item)}
                            >
                                <Flex flexDirection="row" justifyContent="center">
                                    <Image src={item.image} maxW="150px"/>
                                </Flex>
                                <Text fontSize="12px" p="1rem 0.5rem" whiteSpace="nowrap" textOverflow="ellipsis" overflow="hidden">{item.name}</Text>
                            </Box>
                        )
                    })}
                </SimpleGrid>
                {loading?<Spinner m="1rem auto"/>:
                    <Flex bg="#2D81FF" p="0.5rem 2rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}} m="1rem auto" onClick={loadMore}>
                        <Text fontSize="14px" fontWeight="bold">Load more</Text>
                    </Flex>
                }
            </Flex>
        </Box>
    )
}

export default ExplorePage;
  