import { useEffect, useState }  from "react";
import Image                    from "next/image";
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
    Spinner
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

const CreatePage = () => {
    const wallet = useWallet();
    const router = useRouter();

    useEffect(async () => {
        const status = window.localStorage.getItem("Unibond");
        if (!isWalletConnected(wallet) && !status)
            router.push("/connect");
    }, [wallet]);


    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                <Text fontSize="30px" fontWeight="bold">Create Swap</Text>
                <Flex flexDirection="row" mt="2rem">
                    <Box>
                        <Text fontSize="24px" color="#ccc" fontWeight="bold">You'll send</Text>
                    </Box>
                </Flex>
            </Flex>
        </Box>
    )
}

export default CreatePage;
  