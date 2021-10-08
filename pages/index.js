import { Box, Flex, Image, SimpleGrid, Text } from "@chakra-ui/core";
import { useRouter }            from "next/router";

const Home = () => {
  const router = useRouter();
  return (
    <Box w="100%" m="6rem 0rem" color="#0E0E0E">
      <Flex maxW="80rem" w="100%" height="auto" m="3rem auto" p="0 1rem" flexDirection="column">
        {/* <Box mb="2rem" justifyContent="center" position="relative">
          <Box position="absolute" top="17%" textAlign="center" w="100%" pl="5%">
            <Text fontWeight="300" color="#fff" fontSize="34px">Financial</Text>
            <Text fontWeight="200" color="#fff" fontSize="30px">NFT Marketplace</Text>
          </Box>
          <Image src="./images/back.png" alt="" maxH="600px" width="100%" objectFit="cover"/>
        </Box> */}
        <Flex flexDirection="row" mb="150px">
          <Flex w="55%" flexDirection="column">
            <Flex w="100%" flexDirection="column" m="auto 0">
              <Text fontSize="50px" fontWeight="bold">Yield-generating <br/> financial NFTS</Text>
              <Text fontSize="20px" color="#555">Unibond is the world's first financial NFT marketplace.</Text>
              <Flex
                  bg="#000" color="#fff" p="0.8rem 2rem" borderRadius="30px" cursor="pointer" transition="0.2s" m="2rem auto 0 0"
                  _hover={{opacity: 0.9}}
                  onClick={() => {
                    router.push("/salelist");
                  }}
              >
                  <Text fontSize="14px" fontWeight="bold">Buy Now</Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex w="40%" ml="5%">
            <Image src="./images/homepage.png" alt="" width="100%" maxH="400px" objectFit="cover"
              borderRadius="20px"
            />
          </Flex>
        </Flex>
        <SimpleGrid minChildWidth="20rem" spacing="30px">
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">Connect your wallet</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">Use Metamask, Wallet Connect or Coinbase to enter marketplace</Text>
          </Box>
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">List Your NFT</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">Create listing for your Uniswap V3 NFT or fNFT</Text>
          </Box>
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">Sale For A Premium</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">Best performing NFTs will get a price boost</Text>
          </Box>
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">Low Marketplace Fees</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">Only 1.75% per transaction to sell NFTs</Text>
          </Box>
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">Simple Interface</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">UI/UX is a priority for ease of use</Text>
          </Box>
          <Box bg="#FDFDFF" p="2rem  4rem">
            <Text fontWeight="bold" color="#000" fontSize="22px">Data Drive</Text>
            <Text fontWeight="regular" color="#a2a2ad" mt="20px" fontSize="15px">Marketplace gathers data to price your assets</Text>
          </Box>
        </SimpleGrid>
      </Flex>
    </Box>
  )
}
export default Home;
