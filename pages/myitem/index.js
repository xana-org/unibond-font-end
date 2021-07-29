import { useEffect, useState }  from "react";
import {
    Flex, 
    Box,
    Text,
    Image,
    SimpleGrid,
    Input,
} from "@chakra-ui/core";
import { useWallet } from "use-wallet";
import { useRouter } from "next/router";
import {
    isWalletConnected
} from "../../lib/wallet";

const MyItemPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    useEffect(() => {
        const status = window.localStorage.getItem("Unibond");
        if (!isWalletConnected(wallet) && !status)
            router.push("/connect");
    }, [wallet]);
    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="70rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
            </Flex>
        </Box>
    )
}

export default MyItemPage;
  