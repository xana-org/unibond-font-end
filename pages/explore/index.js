import { useEffect, useState }  from "react";
import { useWallet }            from "use-wallet";
import { useRouter }            from "next/router";
import Image                    from "next/image";
import { ethers }               from "ethers";
import {
    Flex, 
    Box,
    Text,
    SimpleGrid,
    Spinner,
    Image as CustomImg
} from "@chakra-ui/core";
import axios from "axios";

import {
    getTotalSupply
} from "../../contracts/univ3_positions_nft";
import {
    UNI_V3_NFT_POSITIONS_ADDRESS
} from "../../utils/const";

const ExplorePage = () => {
    const router = useRouter();
    const [univ3Data, setUniv3Data] = useState([]);
    const [offset, setOffset] = useState(0);
    const [tSupply, setTSupply] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        try {
            //const res = await axios.get("https://api.opensea.io/api/v1/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&order_direction=dec");
            const res = await axios.get("https://testnets-api.opensea.io/api/v1/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&order_direction=dec?force_update=true");
            if (res && res.data && res.data.assets) {
                setUniv3Data(res.data.assets);
                setOffset(res.data.assets.length);
            }
        } catch (e) {

        } finally {
            setLoading(false);
        }

        try {
            //const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/cVQWBBi-SmHIeEpek2OmH5xgevUvElob");
            const provider = new ethers.providers.JsonRpcProvider("https://eth-rinkeby.alchemyapi.io/v2/0mtX4U8w5QpMAcPhDhsYdobs6UDDhFYs");
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
        router.push("/token?id=" + item.token_id)
    }

    const loadMore = async () => {
        setLoading(true);
        try {
            //const res = await axios.get("https://api.opensea.io/api/v1/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&order_direction=dec&offset=" + offset);
            const res = await axios.get("https://testnets-api.opensea.io/api/v1/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&order_direction=dec&offset=" + offset);
            if (res && res.data && res.data.assets) {
                setUniv3Data(univ3Data.concat(res.data.assets));
                setOffset(offset + res.data.assets.length);
            }
        } catch(e) {

        } finally {
            setLoading(false);
        }
    }

    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="70rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Box mb="2rem">
                    <Flex flexDirection="row" justifyContent="center">
                        <CustomImg w="60px" src="/images/tokenpage/uni.png" borderRadius="100%"/>
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
                        if (!item.image_thumbnail_url) return (null);
                        return (
                            <Box key={index} border="1px solid #2e2e2e" p="2rem 0 0rem 0" borderRadius="10px" cursor="pointer" userSelect="none" 
                                _hover={{boxShadow: "0px 0px 8px 4px rgba(255, 255, 255, 0.1)"}} transition="0.3s"
                                onClick={() => onNFTSelect(item)}
                            >
                                <Flex flexDirection="row" justifyContent="center">
                                    <Image src={item.image_thumbnail_url} width={150} height={200} alt="" priority={true} loading="eager"/>
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
  