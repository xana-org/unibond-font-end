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
import { useRouter } from "next/router";
import { useWallet } from "use-wallet";

import {
    isWalletConnected
} from "../../../lib/wallet";

const Pool = () => {
    const router = useRouter();
    const wallet = useWallet();

    useEffect(() => {
        if (router.query && isWalletConnected(wallet)) {
            const { address, tokenId } = router.query;
            if (address && tokenId) {
                console.log(address, tokenId);
            }
        }
    }, [router, wallet]);
    return (
        <Box w="100%" mt="6rem">
            <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">

            </Flex>
        </Box>
    );
};

export default Pool;