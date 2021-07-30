//const api_address = 'https://api.opensea.io/api/v1';
const api_address = 'https://testnets-api.opensea.io/api/v1';

export const getAllData = (offset = 0) => {
  const options = {method: 'GET'};
  return fetch(`${api_address}/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&order_direction=dec&offset=${offset}`, options)
    .then(response => response.json())
    .catch(err => console.error(err));
}

export const getAllAssets = (address, offset = 0, limit = 50) => {
  const options = {method: 'GET'};
  return fetch(`${api_address}/assets?asset_contract_address=0xc36442b4a4522e871399cd717abdd847ab11fe88&owner=${address}&offset=${offset}&limit=${limit}`, options)
    .then(response => response.json())
    .catch(err => console.error(err));
}

export const getNFTDetail = (address, tokenId) => {
  const options = {method: 'GET'};
  return fetch(`${api_address}/asset/${address}/${tokenId}`, options)
    .then(response => response.json())
    .catch(err => console.error(err));
}