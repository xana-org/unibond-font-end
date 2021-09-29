import { Box, Flex, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/core";
import Link from "next/link";

import { getWalletAddress, isWalletConnected, shortenWalletAddress } from "../../lib/wallet";

const Footer = () => {
    return (
        <Box w="100%" color="#FFF" mt="auto" bottom={0} bg="#24252c" zIndex={10}>
            <Flex maxW="80rem" w="100%"  flexDirection="row" justifyContent="center">

                <Flex w="25%" m="0 auto"  p="1rem 1rem"  flexDirection="column" >
                    <Text fontSize="18px" fontWeight="bold" m="auto 2rem auto 0" cursor="pointer"  color="#FFF" transition="0.2s">ABOUT ZORACLES.</Text>
                    <Text fontSize="14px" fontWeight="regular" m="auto 3rem auto 0" cursor="pointer" color="#FFF" transition="0.2s">The world’s first NFT marketplace for Uniswap non-fungible tokens (NFTs). Buy, sell, and discover new financial NFTs. Unibond is  powered by Zoracles technology.</Text>
                </Flex>
                <Flex flexDirection="column"  p="1rem 1rem">
                    <Text fontSize="18px" fontWeight="bold" cursor="pointer" color="#FFF" transition="0.2s">Quick Menu</Text>
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
                <Flex flexDirection="column" ml="5%" p="1rem 1rem">
                    <Text fontSize="18px" fontWeight="bold" cursor="pointer" color="#FFF" transition="0.2s">MORE LINKS</Text>
                    <Link href="https://discord.com/invite/DSYQYAqEUX" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Discord</Text>
                    </Link>
                    <Link href="https://t.me/zoracles" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Telegram</Text>
                    </Link>
                    <Link href="https://zoracles.medium.com/" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Medium</Text>
                    </Link>
                    <Link href="https://twitter.com/z0racles" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Twitter</Text>
                    </Link>
                    <Link href="https://www.reddit.com/r/Zoracles/" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">Reddit</Text>
                    </Link>
                    <Link href="https://www.youtube.com/channel/UCFx9FbUYK38_HhSm9DL38fQ" target="_blank">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#0E0F11"}} color="#FFF" transition="0.2s">YouTube</Text>
                    </Link>
                </Flex>                
            </Flex>
        </Box>
    )
}

export default Footer;
