import { AspectRatio, Box, Flex, Image, Input, SimpleGrid, Text } from "@chakra-ui/core";

const Home = () => {
  return (
    <Box w="100%" mt="6rem" color="#0E0E0E">
      <Flex maxW="80rem" w="100%" height="auto" m="3rem auto" p="0 1rem" flexDirection="column">
        <Box mb="2rem" justifyContent="center" position="relative">
          <Text fontWeight="bold" color="#5a5a5a" fontSize="46px" position="absolute" top="40%" left="20px">Uniswap V3 NFTs</Text>
          <Text fontWeight="regular" color="#5a5a5a" fontSize="36px" position="absolute" top="48%" left="20px">NFT MarketPlace</Text>

          <video loop={true} autoPlay={true} muted={true} style={{backgroundImage:`url('/images/nft/9.png')`}}>
            <source src="https://assets-global.website-files.com/60b908aee9c9240efc4b480e/60ee13d83afcd6fa8304b66c_Butlr%20New%20Banner%20background_v1_no_red%20(3)-transcode.mp4" data-wf-ignore="true"/>
            <source src="https://assets-global.website-files.com/60b908aee9c9240efc4b480e/60ee13d83afcd6fa8304b66c_Butlr%20New%20Banner%20background_v1_no_red%20(3)-transcode.webm" data-wf-ignore="true"/>
          </video>
        </Box>
      </Flex>
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="row">
        <Box w='49%' mb="2rem" justifyContent='center' alignItems='center' display='flex'>
          <Text fontWeight="bold" color="#5a5a5a" fontSize="38px">Trade Uniswap V3 NFTs</Text>
        </Box>

        <Box w='49%' mb="2rem">
          <Image src="/images/nft/8.png" mr="1%" alt="img8" borderRadius="5%"/>
        </Box>
      </Flex>
    </Box>
  )
}
export default Home;
