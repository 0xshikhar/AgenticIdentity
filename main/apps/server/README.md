Get Account Balance
curl -X GET "https://rootstock-testnet.blockscout.com/api?module=account&action=balance&address=0xb4beF264785fd51D80347f578E0245fCcdF3C055&apikey=f5218b64-fed1-4bad-8246-df760bad1b86"

response format : {"message":"OK","result":"998631556000000","status":"1"}

Get Transaction List
curl -X GET "https://rootstock-testnet.blockscout.com/api?module=account&action=txlist&address=0xb4beF264785fd51D80347f578E0245fCcdF3C055&startblock=0&endblock=99999999&apikey=f5218b64-fed1-4bad-8246-df760bad1b86"

response format : {"message":"OK","result":[{"blockHash":"0x219b777f35afd98b8f60705968c131f46ca325496190b8149455ffd5ee6f94cf","blockNumber":"5567389","confirmations":"770016","contractAddress":"","cumulativeGasUsed":"173725","from":"0x88250f772101179a4ecfaa4b92a983676a3ce445","gas":"800000","gasPrice":"60000000","gasUsed":"21000","hash":"0x311850c8a22b68617400f548b14cdd0e604bb5907ea7688dfc0f62a2ab3c7626","input":"0x","isError":"0","nonce":"43537","timeStamp":"1726965166","to":"0x1b4acaba13f8b3b858c0796a7d62fc35a5ed3ba5","transactionIndex":"2","txreceipt_status":"1","value":"498631556000000"},{"blockHash":"0xd7886b150ff394d7ee88ab3f2fc0113042fbbb1883a0b488a269999c7c8e212b","blockNumber":"6337368","confirmations":"37","contractAddress":"","cumulativeGasUsed":"21000","from":"0x88250f772101179a4ecfaa4b92a983676a3ce445","gas":"800000","gasPrice":"60000000","gasUsed":"21000","hash":"0x3d329fbac0a10f4fa174b8bfa43220031eabcd936912261b98b2dfefaed44b73","input":"0x","isError":"0","nonce":"56987","timeStamp":"1746015881","to":"0x1b4acaba13f8b3b858c0796a7d62fc35a5ed3ba5","transactionIndex":"0","txreceipt_status":"1","value":"500000000000000"}],"status":"1"}%

Get Token Transfers
curl -X GET "https://rootstock-testnet.blockscout.com/api?module=account&action=tokentx&contractaddress=WALLET_ADDRESS_HERE&address=WALLET_ADDRESS_HERE&page=1&offset=10&sort=asc&apikey=f5218b64-fed1-4bad-8246-df760bad1b86"

Get Token Balance for ERC-20
curl -X GET "https://rootstock-testnet.blockscout.com/api?module=account&action=tokenbalance&contractaddress=WALLET_ADDRESS_HERE&address=WALLET_ADDRESS_HERE&tag=latest&apikey=f5218b64-fed1-4bad-8246-df760bad1b86"
"
Get Internal Transactions
"
curl -X GET "https://rootstock-testnet.blockscout.com/api?module=account&action=txlistinternal&address=WALLET_ADDRESS_HERE&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=f5218b64-fed1-4bad-8246-df760bad1b86"
