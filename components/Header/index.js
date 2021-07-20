import {
    Flex,
    Text,
} from "@chakra-ui/core";
import Link from "next/link";

const Header = () => {
    return (
        <Flex flexDirection="row" w="100%" p="1rem 2rem" color="#fff" borderBottom="1px solid #2A2A2A" position="fixed" top={0} bg="#131313" zIndex={10}>
            <Text mr="auto" fontWeight="bold" fontSize="24px">Zoracles</Text>
            <Flex flexDirection="row" display={["none", "none", "none", "flex"]}>
                <Link href="/explore">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Explore</Text>
                </Link>
                <Link href="/myitem">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">My Item</Text>
                </Link>
                <Link href="/">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Create Swap</Text>
                </Link>
                <Link href="/">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Swap List</Text>
                </Link>
                <Link href="/connect">
                    <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                        <Text fontSize="14px" fontWeight="bold">Connect</Text>
                    </Flex>
                </Link>
            </Flex>
        </Flex>
    )
}

export default Header;
