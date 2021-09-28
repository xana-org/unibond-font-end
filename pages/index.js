import { Box, Flex, Image, Input, SimpleGrid, Text } from "@chakra-ui/core";

const Home = () => {
  return (
    <Box w="100%" mt="6rem" color="#0E0E0E">
      <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
        <Box mb="2rem">
            <Flex justifyContent="center" alignItems="center" flexDirection="column"  w="100%" h="50rem" bg="url(/images/nft/3.png)">
                <Text fontWeight="bold" color="#5a5a5a" fontSize="46px">The First Marketplace Dedicated to </Text>
                <Text fontWeight="regular" color="#5a5a5a" fontSize="36px">Uniswap V3 NFTs </Text>
            </Flex>
        </Box>
      </Flex>
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="row">
        <Box w='49%' mb="2rem" justifyContent='center' alignItems='center' display='flex'>
          <Text fontWeight="bold" color="#5a5a5a" fontSize="46px">Buy Uniswap V3 NFTs</Text>
        </Box>

        <Box w='49%' mb="2rem">
          <Image src="/images/nft/8.png" mr="1%" alt="img8" borderRadius="5%"/>
        </Box>
      </Flex>
      <Flex maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="column">
        <Box mb="2rem">
          <Flex justifyContent="center" alignItems="center" flexDirection="row"  w="100%" >
            <Image src="/images/nft/1.png" mr="1%" alt="img1" w="19%" h="200px" borderRadius="5%"/>
            <Image src="/images/nft/2.png" mr="1%" alt="img2" w="19%" h="200px" borderRadius="5%"/>
            <Image src="/images/nft/5.png" mr="1%" alt="img3" w="19%" h="200px" borderRadius="5%"/>
            <Image src="/images/nft/7.png" mr="1%" alt="img4" w="19%" h="200px" borderRadius="5%"/>
            <Image src="/images/nft/4.png" alt="img5" w="19%"/>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}
export default Home;
