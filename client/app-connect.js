// ethers, Magic are loaded
const apiKey = 'pk_live_3660B1FEDB5BFEFE'
const infuraKey = '4026a8ce431c497a816b8bffeeb07eee'
const network = {
    rpcUrl: `https://sepolia.infura.io/v3/${infuraKey}`,
    chainId: "11155111"
}
const endpoint = location.protocol + '//' + location.host
const magic = new Magic(apiKey, {
    network,
    // endpoint
});
const provider = new ethers.providers.Web3Provider(magic.rpcProvider);

window.magic = magic
window.provider = provider

const elem = (id) => {
    return document.getElementById(id)
}
const addCallback = (id, event, callback) => {
    elem(id).addEventListener(event, callback);
}

const login = async () => {
    const email = elem("email").value

    const result = await magic.auth.loginWithMagicLink({
        email: email,
        showUI: true,
        redirectURI: location.toString()
    });
    console.log({result})

    if(result){
        const params = new URL(location.toString()).searchParams;
        const credentialFromURL = params.get('magic_credential');
        const credentialFromLocalStorage = localStorage.getItem('magic_credential');
        await loginCallBack(credentialFromURL, credentialFromLocalStorage);
    }
}

const clearCredential = async () => {
    const disconnect = await magic.wallet.disconnect()
    if(disconnect){
        elem("connect_status").innerText = "not connected"
    }else{
        elem("connect_status").innerText = "connected"
    }
}

const transfer = async () => {
    const ethAmountTransfer = elem("eth_amount_transfer").value
    const ethAddressTransfer = elem("eth_address_transfer").value

    const destination = ethAddressTransfer;
    const amount = ethers.utils.parseEther(ethAmountTransfer); // Convert 1 ether to wei
    
    const signer = provider.getSigner();
    console.log({signer})

    // Submit transaction to the blockchain
    const tx = await signer.sendTransaction({
      to: destination,
      value: amount,
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    elem("eth_receipt_transfer").innerText = JSON.stringify(receipt, null, 2);
}

const requestEmail = async () => {
    const email = await magic.wallet.requestUserInfoWithUI({ scope: { email: "required" }})
    elem("email").innerText = JSON.stringify(email, null, 2);
}

const connectCallback = async () => {

    const signer = provider.getSigner();
    const account = await signer.getAddress() ;

    elem("accounts").innerText = JSON.stringify(account, null, 2);

    // Get user's balance in ether
    const balance = ethers.utils.formatEther(
        await provider.getBalance(account), // Balance is in wei
    );
    console.log({balance})

    elem("wallet_balance").innerText = balance

    // transfer
    addCallback("transfer", "click", transfer)
    // request email
    addCallback("request_email", "click", requestEmail)
    // clear
    addCallback("clear_credential", "click", clearCredential)
}

const connect = async () => {
    const accounts = await magic.wallet.connectWithUI();
    await connectCallback();
}

const main = async () => {

    magic.preload().then(() => console.log('Magic <iframe> loaded.'));

    let walletType = "";
    try{
        const walletInfo = await magic.wallet.getInfo() 
        walletType = walletInfo.walletType;
    }catch(e){
        console.log("wallet not connected" + e)
    }
    if (walletType === "magic") {

        elem("connect_status").innerText = "connected"
        await magic.wallet.showUI();
        await connectCallback();

    }else{
        elem("connect_status").innerText = "not connected"
        addCallback("connect", "click", connect)
    }
}

main().catch((error) => console.log(error))