import {
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
                    <Flex bg="#2D81FF" p="0.5rem 1rem" borderRadius="30px" cursor="pointer" transition="0.3s" _hover={{opacity: 0.9}}>
                        <Text fontSize="14px" fontWeight="bold">Connect</Text>
                    </Flex>
                </Link>
            );
        return (
            <Flex flexDirection="row">
                <Menu>
                    <MenuButton>
                        <Flex cursor="pointer" p="0.5rem 2rem" bg="#2D81FF" borderRadius="30px" m="auto 0" _hover={{opacity: 0.9}} transition="0.3s">
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
        <Flex flexDirection="row" w="100%" p="1rem 2rem" color="#fff" borderBottom="1px solid #2A2A2A" position="fixed" top={0} bg="#131313" zIndex={10}>
            <Text mr="auto" fontWeight="bold" fontSize="24px">Unibond</Text>
            <Flex flexDirection="row" display={["none", "none", "none", "flex"]}>
                <Link href="/explore">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Explore</Text>
                </Link>
                <Link href="/mypositions">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">My Item</Text>
                </Link>
                {/* <Link href="/create">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Create Swap</Text>
                </Link> */}
                <Link href="/salelist">
                    <Text fontWeight="bold" m="auto 2rem auto 0" cursor="pointer" _hover={{color:"#fff"}} color="#858585" transition="0.2s">Sale List</Text>
                </Link>
                {renderWallet()}
            </Flex>
        </Flex>
    )
}

export default Header;
