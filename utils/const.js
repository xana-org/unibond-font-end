export const x96 = Math.pow(2, 96);
export const x128 = Math.pow(2, 128);
const IS_PROD = true;
export const ZORA_SCORE_API = "https://zora.cc/rating/";

export const UNI_V3_NFT_POSITIONS_ADDRESS = "0xc36442b4a4522e871399cd717abdd847ab11fe88";
export const UNIBOND_ADDRESS = IS_PROD ? "0x43749Ed0A562503aB52005E4354391F85E38F189" : "0xdeAEc5b88596116bdfE08F5c9E1437D8d027C6E1";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const COINGECKO_URL = 'https://tokens.coingecko.com/uniswap/all.json';

export const UNISWAPV3IDS = IS_PROD ? "https://api.thegraph.com/subgraphs/name/cryptodev7/uniswapv3ids": "";
export const UNIBOND_GRAPH_ENDPOINT = IS_PROD ? "https://api.thegraph.com/subgraphs/name/cryptodev7/unibond-mainnet" : "https://api.thegraph.com/subgraphs/name/cryptodev7/unibond";
export const UNIV3_GRAPH_ENDPOINT = IS_PROD ? "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3" : "https://api.thegraph.com/subgraphs/name/cryptodev7/univ3rinkeby";
export const BLOCK_ENDPOINT = IS_PROD ? "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks" : "https://api.thegraph.com/subgraphs/name/blocklytics/rinkeby-blocks";

export const JSON_PROVIDER = IS_PROD ? "https://eth-mainnet.alchemyapi.io/v2/gURSYlgiE0OvWlmj6emPVvoh1mXuK1lr": "https://eth-rinkeby.alchemyapi.io/v2/QxTWCvdeBBSzUV9U5rM2r1dZJRvRGObN";

export const SCAN_LINK = IS_PROD ? "https://etherscan.io": "https://rinkeby.etherscan.io";

export const SUPPORT_ASSETS = [
    {name: "ETH", img: "/images/assets/eth.png", address: "0x000000000000000000000000000000000000dEaD", decimals: 18},
    {name: "WETH", img: "/images/assets/WETH.png", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimals: 18},
    {name: "DAI", img: "/images/assets/DAI.png", address: "0x6b175474e89094c44da98b954eedeac495271d0f", decimals: 18},
    //{name: "USDT", img: "/images/assets/USDT.png"},
];

export const ONE_DAY_UNIX = 24 * 60 * 60

export const IS_ON_SALE_QUERY = `
    query isOnSaleQuery {
        swapLists(where: {
            tokenId: %1,
            status: 1
        }) {
            swapId,
            amount,
            assetType,
            creator,
            status,
            buyer,
        }
    }
`;

export const EXPLORE_QUERY = `
    query exploreQuery {
        tokenHolders(skip: %1, first: 8, orderBy:tokenId,
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
        swapLists(first: 8, skip: %1, orderBy:swapId,
            orderDirection: desc, where: {
                status: %2
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
export const ETHPRICE_QUERY = `
    query ethPrice {
        bundle(id: 1) {
            ethPriceUSD
        }
    }
`;

export const POSITION_QUERY = (id, blockNumber = undefined) => {
    return `
        query tokenPosition {
            position(
                first: 1000,
                id: ${id},` +
                (blockNumber ? `block: { number: ${blockNumber}},` : ``) + 
            `) {
                id
                owner
                pool {
                id
                }
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
}

export const GET_BLOCK_QUERY = (timestamp) => {
    return `
        query GET_BLOCK {
            blocks(
                first: 1,
                orderBy: timestamp,
                orderDirection: desc,
                where: {
                  timestamp_gt: ${timestamp},
                  timestamp_lt: ${timestamp + 600}
                }
            ) {
                number
            }
        }
    `
}

export const POOL_QUERY = (poolAddress, blockNumber) => {
    return `
        query poolQuery {
            pools(
                first: 1,
                where: { id_in: ["${poolAddress}"] },` +
                (blockNumber ? `block: { number: ${blockNumber}},` : ``) + 
            `) {
                feeTier
                liquidity
                sqrtPrice
                tick
                token0 {
                    id
                    name
                    decimals
                    derivedETH
                    symbol
                }
                token1 {
                    id
                    name
                    decimals
                    derivedETH
                    symbol
                }
                totalValueLockedToken0
                totalValueLockedToken1
                volumeUSD
                totalValueLockedUSD
                createdAtTimestamp
            }
        }
    `
}

export const POOL_CHART = (startTime, skip, poolAddress) => {
    return `
      query poolDayDatasQuery {
        poolDayDatas(
          first: 1000
          skip: ${skip}
          where: { pool: "${poolAddress}", date_gt: ${startTime} }
          orderBy: date
          orderDirection: asc
          subgraphError: allow
        ) {
          date
          volumeUSD
          tvlUSD
        }
      }
    `
}