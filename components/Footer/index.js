import { Box, Flex, Link as ChakraLink, Text } from "@chakra-ui/core";
import Link from "next/link";

const Footer = () => {
    return (
        <Box w="100%" color="#FFF" mt="auto" bottom={0} bg="#24252c" zIndex={10}>
            <Flex maxW="80rem" w="100%"  flexDirection={["column", "column", "column", "row"]} p="30px 10px 40px 10px" m="0 auto" justifyContent="space-between">
                <Box maxW="400px" pr="30px">
                    <Text fontSize="18px" fontWeight="bold">ABOUT ZORACLES</Text>
                    <Text fontSize="14px" fontWeight="regular" mt="20px">The world’s first NFT marketplace for Uniswap non-fungible tokens (NFTs). Buy, sell, and discover new financial NFTs. Unibond is  powered by Zoracles technology.</Text>
                </Box>
                <Box m={["30px 0", "30px 0", "30px 0", "0"]}>
                    <Text fontSize="18px" fontWeight="bold" mb="20px">Quick Menu</Text>
                    <Link href="/explore">
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s">Uniswap</Text>
                    </Link>
                    <Link href="/mypositions">
                        <Text fontSize="14px" fontWeight="500" mt="10px" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s">NFTs</Text>
                    </Link>
                    <Link href="/salelist">
                        <Text fontSize="14px" fontWeight="500" mt="10px" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s">Bonds</Text>
                    </Link>
                </Box>
                <Box>
                    <Text fontSize="18px" fontWeight="bold" mb="20px">More Links</Text>
                    <ChakraLink href="https://discord.com/invite/DSYQYAqEUX" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s">Discord</Text>
                    </ChakraLink>
                    <ChakraLink href="https://t.me/zoracles" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s" mt="10px">Telegram</Text>
                    </ChakraLink>
                    <ChakraLink href="https://zoracles.medium.com/" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s" mt="10px">Medium</Text>
                    </ChakraLink>
                    <ChakraLink href="https://twitter.com/z0racles" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s" mt="10px">Twitter</Text>
                    </ChakraLink>
                    <ChakraLink href="https://www.reddit.com/r/Zoracles/" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s" mt="10px">Reddit</Text>
                    </ChakraLink>
                    <ChakraLink href="https://www.youtube.com/channel/UCFx9FbUYK38_HhSm9DL38fQ" isExternal _hover={{}}>
                        <Text fontSize="14px" fontWeight="500" cursor="pointer" _hover={{color:"#0E0F11"}} transition="0.2s" mt="10px">YouTube</Text>
                    </ChakraLink>
                </Box>                
                <Box/>
            </Flex>
        </Box>
    )
}

export default Footer;
