import { Box, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/core";
import { ethers } from "ethers";
import Link from "next/link";
import { useWallet } from "use-wallet";

import { getWalletAddress, isWalletConnected, shortenWalletAddress } from "../../lib/wallet";

const Footer = () => {
    return (
        <Box w="100%" bg="#24252c" color="#FFF" bottom={0}  position="fixed">
            <Flex maxW="80rem" w="100%" m="0 auto"  p="1rem 1rem" flexDirection="row" justifyContent="space-between">
                <Link href="/"><Text fontWeight="bold" fontSize="24px" cursor="pointer">Unibond</Text></Link>
                <Flex flexDirection="row" display={["none", "none", "none", "flex"]}>
                    <Link href="/explore">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Explore</Text>
                    </Link>
                    <Link href="/mypositions">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">My Item</Text>
                    </Link>
                    <Link href="/salelist">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Sale List</Text>
                    </Link>
                </Flex>
            </Flex>
        </Box>
    )
}

export default Footer;
