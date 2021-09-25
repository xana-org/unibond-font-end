import {
    Box,
    Flex,
    Text,
    Menu,
    MenuItem,
    MenuList,
    MenuButton,
} from "@chakra-ui/core";
import Link from "next/link";
import { useWallet } from "use-wallet";
import { ethers } from "ethers";
import {
    shortenWalletAddress,
    isWalletConnected,
    getWalletAddress,
} from "../../lib/wallet";

const Header = () => {
    const wallet = useWallet();

    const getMyWalletAddress = () => {
        const walletAddress = getWalletAddress(wallet);
        return shortenWalletAddress(walletAddress);
    }

    const viewOnEtherscan = async () => {
        const walletAddress = getWalletAddress(wallet);
        const provider = new ethers.providers.Web3Provider(wallet.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId === 1) {
            window.open("https://etherscan.io/address/" + walletAddress);
        } else {
            window.open("https://rinkeby.etherscan.io/address/" + walletAddress);
        }

    }

    const onDisconnect = () => {
        window.localStorage.setItem("Unibond", "");
        wallet.reset();
    }

    const renderWallet = () => {
        if (!isWalletConnected(wallet))
            return (
                <Link href="/connect">
                    <Flex bg="#24252C" p="0.7rem 1rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                        <Text fontSize="14px" color="#fff" fontWeight="bold">Connect</Text>
                    </Flex>
                </Link>
            );
        return (
            <Flex flexDirection="row" color="#fff">
                <Menu>
                    <MenuButton>
                        <Flex cursor="pointer" p="0.7rem 2rem" bg="#24252C" borderRadius="30px" m="auto 0" _hover={{opacity: 0.9}} transition="0.3s">
                            <Text fontWeight="bold" fontSize="12px">{getMyWalletAddress()}</Text>
                        </Flex>
                    </MenuButton>
                    <MenuList>
                        <MenuItem onClick={viewOnEtherscan}>
                            <Text color="#fff" fontSize="14px" fontWeight="bold">View on Etherscan</Text>
                        </MenuItem>
                        <MenuItem onClick={onDisconnect}>
                            <Text color="#DC002D" fontSize="14px" fontWeight="bold">Disconnect</Text>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        )
    }
    return (
        <Box w="100%" color="#0E0F11" borderBottom="1px solid #E7E9EC" position="fixed" top={0} bg="#fff" zIndex={10}>
            <Flex maxW="80rem" w="100%" m="0 auto"  p="1rem 1rem" flexDirection="row" justifyContent="space-between">
                <Text fontWeight="bold" fontSize="24px">Unibond</Text>
                <Flex flexDirection="row" display={["none", "none", "none", "flex"]}>
                    <Link href="/explore">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#FB575F"}} color="#0E0F11" transition="0.2s">Explore</Text>
                    </Link>
                    <Link href="/mypositions">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#FB575F"}} color="#0E0F11" transition="0.2s">My Item</Text>
                    </Link>
                    {/* <Link href="/create">
                        <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Create Swap</Text>
                    </Link> */}
                    <Link href="/salelist">
                        <Text fontSize="14px" fontWeight="500" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#FB575F"}} color="#0E0F11" transition="0.2s">Sale List</Text>
                    </Link>
                </Flex>
                {renderWallet()}
            </Flex>
        </Box>
    )
}

export default Header;
