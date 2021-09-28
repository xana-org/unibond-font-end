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
        <Box w='29%' mb="2rem" justifyContent='center' alignItems='center' display='flex'>
          <Text fontWeight="bold" color="#5a5a5a" fontSize="38px">Trade Uniswap V3 NFTs</Text>
        </Box>
        <Box w='69%' mb="2rem">
          <Image src="/images/nft/10.png" mr="1%" alt="img8" borderRadius="5%"/>
        </Box>
      </Flex>
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="1rem  1rem" flexDirection="row" bg="#edf0f3">
        <Box w='32%' mr="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' alignItems='center' display='flex' flexDirection='column'>
          <Image src="/images/icon/1.svg" mt="5%" alt="img8" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Real-time</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">With an update rate up to 7 fps, Heatic sensors provide real-time information in addition to historical data.</Text>
        </Box>
        <Box w='32%' mr="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' alignItems='center' display='flex' flexDirection='column'>
          <Image src="/images/icon/2.svg" mt="5%" alt="img8" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Scalable</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Installs in minutes. Each Heatic sensor can cover up to 200 square feet depending on ceiling height.</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' alignItems='center' display='flex' flexDirection='column'>
          <Image src="/images/icon/3.svg" mt="5%" alt="img8" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Extensible</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Systems integrators and developers can use our open APIs to integrate Heatic data into third party applications.</Text>
        </Box>

      </Flex>

    </Box>
  )
}
export default Home;
