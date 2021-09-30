import { AspectRatio, Box, Flex, Image, Input, SimpleGrid, Text } from "@chakra-ui/core";

const Home = () => {
  return (
    <Box w="100%" m="6rem 0rem" color="#0E0E0E">
      <Flex maxW="80rem" w="100%" height="auto" m="3rem auto" p="0 1rem" flexDirection="column">
        <Box mb="2rem" justifyContent="center" position="relative">
          <Text fontWeight="bold" color="#5a5a5a" fontSize="46px" position="absolute" top="40%" left="20px">World's First</Text>
          <Text fontWeight="regular" color="#5a5a5a" fontSize="36px" position="absolute" top="48%" left="20px">fNFT Marketplace</Text>

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
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="1rem  2rem" flexDirection="row" >
        <Box w='32%' ml="4%"  bg="#FDFDFF" p="2rem  4rem" justifyContent='center' borderRadius='5%'display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/4.svg" w="16px" mt="5%" alt="ico4" /> */}
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Connect your wallet</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Use Metamask, Wallet Connect or Coinbase to enter marketplace</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="2rem  4rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/5.svg" w="32px" mt="5%" alt="ico5" /> */}
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">List Your NFT</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Create listing for your Uniswap V3 NFT or fNFT</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="2rem  4rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/6.svg" w="32px" mt="5%" alt="ico6" /> */}
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Sale For A Premium</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Best performing NFTs will get a price boost</Text>
        </Box>
      </Flex>
      <Flex  maxW="80rem" w="100%" m="3rem auto" p="1rem  2rem" flexDirection="row" >
        <Box w='32%' bg="#FDFDFF" ml="4%" p="1rem  4rem" justifyContent='center' borderRadius='5%'display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/1.svg" w="32px" mt="5%" alt="ico1" /> */}
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Low Marketplace Fees</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Only 1.75% per transaction to sell NFTs</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="1rem  4rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/2.svg" w="32px" mt="5%" alt="ico2" /> */}
          <Text fontWeight="bold" color="#000" mt="5%" fontSize="22px">Simple Interface</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">UI/UX is a priority for ease of use</Text>
        </Box>
        <Box w='32%' bg="#FDFDFF" p="1rem  4rem" justifyContent='center' borderRadius='5%' display='flex' flexDirection='column'>
          {/* <Image src="/images/icon/3.svg" w="32px" mt="5%" alt="ico3" /> */}
          <Text fontWeight="bold" color="#000" mt="15%" fontSize="22px">Data Drive</Text>
          <Text fontWeight="regular" color="#a2a2ad" mt="5%" fontSize="15px">Marketplace gathers data to price your assets</Text>
        </Box>
      </Flex>
    </Box>
  )
}
export default Home;
