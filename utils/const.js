export const UNI_V3_NFT_POSITIONS_ADDRESS = "0xc36442b4a4522e871399cd717abdd847ab11fe88";
export const UNIBOND_ADDRESS = "0x7cB4867950Bc819bb5aA5269a30E651901e1b269";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const COINGECKO_URL = 'https://tokens.coingecko.com/uniswap/all.json';

export const UNIBOND_GRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/cryptodev7/unibond";
export const UNIV3_GRAPH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/cryptodev7/univ3rinkeby";

export const JSON_PROVIDER = "https://eth-rinkeby.alchemyapi.io/v2/QxTWCvdeBBSzUV9U5rM2r1dZJRvRGObN";

export const SCAN_LINK = "https://rinkeby.etherscan.io";

export const EXPLORE_QUERY = `
    query exploreQuery {
        tokenHolders(skip: %1, first: 12, orderBy:tokenId,
          orderDirection: desc
        ) {
          tokenId
          holderAddress
        }
    }      
`;

export const OWNED_ASSETS_QUERY = `
    query ownedAssets {
        tokenHolders(first: 100, orderBy:tokenId, orderDirection: asc, where: {
            holderAddress: "%1"  
        }) {
          tokenId
          holderAddress
        }
    }      
`;

export const ONSALE_ASSETS_QUERY = `
    query onSaleAssets {
        swapLists(first: 100, where: {
            creator: "%1",
            status: 1
        }) {
            swapId
            tokenId
            payToken
            amount
            assetType
            creator
            status
            buyer
        }
    }
`;

export const SALELIST_ASSETS_QUERY = `
    query saleList {
        swapLists(first: 100, skip: 0) {
            swapId
            tokenId
            payToken
            amount
            assetType
            creator
            status
            buyer
        }
    }
`;
export const ETHPRICE_QUERY = `
    query ethPrice {
        bundle(id: 1) {
            ethPriceUSD
        }
    }
`;

export const POSITION_QUERY = `
    query tokenPosition {
        position(id: "%1"){
            id
            token0{
                symbol
                derivedETH
                id
                decimals
            }
            token1{
                symbol
                derivedETH
                id
                decimals
            }
            pool{
                id
                liquidity
                sqrtPrice
                tick
                feeGrowthGlobal0X128
                feeGrowthGlobal1X128
                feeTier
            }
            liquidity
            depositedToken0
            depositedToken1
            feeGrowthInside0LastX128
            feeGrowthInside1LastX128
            tickLower {
                tickIdx
                price0
                price1
                feeGrowthOutside0X128
                feeGrowthOutside1X128
            }
            tickUpper {
                tickIdx
                price0
                price1
                feeGrowthOutside0X128
                feeGrowthOutside1X128
            }
            withdrawnToken0
            withdrawnToken1
            collectedFeesToken0
            collectedFeesToken1
            transaction{
                timestamp
                blockNumber
            }
        }
    }
`;