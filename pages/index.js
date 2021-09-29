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
      {/* <Flex  maxW="80rem" w="100%" m="3rem auto" p="0 1rem" flexDirection="row">
        <Box w='29%' mb="2rem" justifyContent='center' alignItems='center' display='flex'>
          <Text fontWeight="bold" color="#5a5a5a" fontSize="38px">Trade Uniswap V3 NFTs</Text>
        </Box>
        <Box w='69%' mb="2rem">
          <Image src="/images/nft/10.png" mr="1%" alt="img8" borderRadius="5%"/>
        </Box>
      </Flex> */}
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="1rem  0rem" flexDirection="row" >
        <Box w='32%' mr="2%" ml="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%'display='flex' flexDirection='column'>
          <Image src="/images/icon/4.svg" w="16px" mt="5%" alt="ico4" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Accurate</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">95+% accuracy, indoor coordinate accuracy at +/- 30 cm, surface temperature reading at +/- 0.5 C.</Text>
        </Box>
        <Box w='32%' mr="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          <Image src="/images/icon/5.svg" w="32px" mt="5%" alt="ico5" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Private by design</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Our GDPR-compliant Heatic sensors use body heat to detect presence. We go where cameras can’t go. PII not possible.</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          <Image src="/images/icon/6.svg" w="32px" mt="5%" alt="ico6" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Wireless</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Our magnetically mounted sensors run on a 2+ year battery life. No need for expensive cabling and complicated networking equipment on site.</Text>
        </Box>
      </Flex>
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="1rem  0rem" flexDirection="row" >
        <Box w='32%' mr="2%" ml="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%'display='flex' flexDirection='column'>
          <Image src="/images/icon/1.svg" w="32px" mt="5%" alt="ico1" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Real-time</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">With an update rate up to 7 fps, Heatic sensors provide real-time information in addition to historical data.</Text>
        </Box>
        <Box w='32%' mr="2%" bg="#FDFDFF" p="1rem  2rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          <Image src="/images/icon/2.svg" w="32px" mt="5%" alt="ico2" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Scalable</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Installs in minutes. Each Heatic sensor can cover up to 200 square feet depending on ceiling height.</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" mb="2rem" p="1rem  2rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          <Image src="/images/icon/3.svg" w="32px" mt="5%" alt="ico3" />
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Extensible</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Systems integrators and developers can use our open APIs to integrate Heatic data into third party applications.</Text>
        </Box>
      </Flex>
    </Box>
  )
}
export default Home;
