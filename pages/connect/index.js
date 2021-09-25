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
        <Box w="100%" mt="8rem" color="#0E0F11">
            <Center>
                <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
                    <Text fontSize="34px" fontWeight="bold">Connect your wallet</Text>
                    <Text color="#888" fontWeight="bold">Connect with one of available wallet providers or create a new wallet!</Text>
                    <SimpleGrid spacing="2rem" minChildWidth="15rem" w="100%" m="2rem 0">
                        <Box p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "2px solid #FB575F"}} transition="0.2s" onClick={onMetamask} bg="#EDF0F3" border="2px solid #EDF0F3">
                            <Flex flexDirection="row">
                                <Image src="/images/wallets/metamask.svg" w="30px"/>
                                <Text m="auto 0 auto auto">Metamask</Text>
                            </Flex>
                            <Text color="#555" fontSize="12px" mt="1rem">One of the most secure wallets with great flexibility</Text>
                        </Box>
                        <Box p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "2px solid #FB575F"}} transition="0.2s" bg="#EDF0F3" border="2px solid #EDF0F3">
                            <Flex flexDirection="row">
                                <Image src="/images/wallets/wc.png" w="30px"/>
                                <Text m="auto 0 auto auto">Wallet Connect</Text>
                            </Flex>
                            <Text color="#555" fontSize="12px" mt="1rem">Coming soon...</Text>
                        </Box>
                        <Box p="2rem" borderRadius="10px" cursor="pointer" _hover={{border: "2px solid #FB575F"}} transition="0.2s" bg="#EDF0F3" border="2px solid #EDF0F3">
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
  