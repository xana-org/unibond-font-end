export const UNI_V3_NFT_POSITIONS_ADDRESS = "0xc36442b4a4522e871399cd717abdd847ab11fe88";
export const UNIBOND_ADDRESS = "0x7cB4867950Bc819bb5aA5269a30E651901e1b269";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

export const COINGECKO_URL = 'https://tokens.coingecko.com/uniswap/all.json';

export const ONSALE_ASSETS_QUERY = `
    query onSaleAssets {
        swapLists(first: 5, where: {
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