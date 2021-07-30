import {
    Flex, 
    Box,
    Text,
    Image,
    SimpleGrid,
    Center,
} from "@chakra-ui/core";
import { useWallet } from "use-wallet";
import { useRouter } from "next/router";

const ConnectPage = () => {
    const wallet = useWallet();
    const router = useRouter();

    const onMetamask = () => {
        wallet.connect("injected");
        window.localStorage.setItem("Unibond", "metamask");
        router.push("/explore")
    }

    return (
        <Box w="100%" mt="8rem">
            <Center>
                <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                    <Text fontSize="34px" fontWeight="bold">Connect your wallet</Text>
                    <Text color="#888" fontWeight="bold">Connect with one of available wallet providers or create a new wallet!</Text>
                    <SimpleGrid spacing="2rem" minChildWidth="15rem" w="100%" m="2rem 0">
                        <Box border="1px solid #555" p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "1px solid #999"}} transition="0.2s" onClick={onMetamask}>
                            <Flex flexDirection="row">
                                <Image src="/images/wallets/metamask.svg" w="30px"/>
                                <Text m="auto 0 auto auto">Metamask</Text>
                            </Flex>
                            <Text color="#555" fontSize="12px" mt="1rem">One of the most secure wallets with great flexibility</Text>
                        </Box>
                        <Box border="1px solid #555" p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "1px solid #999"}} transition="0.2s">
                            <Flex flexDirection="row">
                                <Image src="/images/wallets/wc.png" w="30px"/>
                                <Text m="auto 0 auto auto">Wallet Connect</Text>
                            </Flex>
                            <Text color="#555" fontSize="12px" mt="1rem">Coming soon...</Text>
                        </Box>
                        <Box border="1px solid #555" p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "1px solid #999"}} transition="0.2s">
                            <Flex flexDirection="row">
                                <Image src="/images/wallets/coinbase.svg" w="30px"/>
                                <Text m="auto 0 auto auto">Coinbase</Text>
                            </Flex>
                            <Text color="#555" fontSize="12px" mt="1rem">Coming soon...</Text>
                        </Box>
                    </SimpleGrid>
                    <Text color="#888" fontWeight="bold" mt="2rem">
                        We do not own your private keys and cannot access your <br/> funds without your confirmation
                    </Text>
                </Flex>
            </Center>
        </Box>
    )
}

export default ConnectPage;
  