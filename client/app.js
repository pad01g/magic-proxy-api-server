// ethers, Magic are loaded
const apiKey = 'pk_live_581C324CA3D5A249'
const infuraKey = '4026a8ce431c497a816b8bffeeb07eee'
const network = {
    rpcUrl: `https://sepolia.infura.io/v3/${infuraKey}`,
    chainId: "11155111"
}
const magic = new Magic(apiKey, {network});
const provider = new ethers.providers.Web3Provider(magic.rpcProvider);

const elem = (id) => {
    return document.getElementById(id)
}
const addCallback = (id, event, callback) => {
    elem(id).addEventListener(event, callback);
}

const login = () => {
    const email = elem("email").value

    magic.auth.loginWithMagicLink({
        email: email,
        showUI: true,
        redirectURI: location.toString()
    });
}

const clearCredential = async () => {
    localStorage.removeItem('magic_credential');
    const isLoggedIn = await magic.user.isLoggedIn();
    console.log({isLoggedIn})
    const transferURL = location.toString().replace(location.search, "");
    if(isLoggedIn){
        await magic.user.logout()
        const isLoggedIn = await magic.user.isLoggedIn();
        console.log({isLoggedIn})
        if(!isLoggedIn){
            elem("login_status").innerText = "not logged in"
            location.href = transferURL
        }
    }else{
        elem("login_status").innerText = "not logged in"
        location.href = transferURL
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

const main = async () => {

    magic.preload().then(() => console.log('Magic <iframe> loaded.'));

    try {
        console.log(window.location.search)
        const params = new URL(location.toString()).searchParams;
        const credentialFromURL = params.get('magic_credential');
        const credentialFromLocalStorage = localStorage.getItem('magic_credential');
        const credential = credentialFromURL ?? credentialFromLocalStorage;
        console.log(credentialFromURL, credentialFromLocalStorage, credential)

        await magic.auth.loginWithCredential(credential);

        console.log("successfully logged in.")

        // this is callback context

        if(credentialFromURL && !credentialFromLocalStorage){
            localStorage.setItem('magic_credential', credentialFromURL);
        }
        elem("login_status").innerText = "logged in"
        addCallback("clear_credential", "click", clearCredential)

        elem("metadata").innerText = JSON.stringify(await magic.user.getMetadata(),null,2);

        // related to wallet
        const signer = provider.getSigner();
        console.log({signer})

        // Get user's Ethereum public address
        const address = await signer.getAddress();
        console.log({address})

        // Get user's balance in ether
        const balance = ethers.utils.formatEther(
            await provider.getBalance(address), // Balance is in wei
        );
        console.log({balance})

        elem("wallet_balance").innerText = balance

        // transfer
        addCallback("transfer", "click", transfer)

    }catch(e){

        console.log("credential not found. now let's try to login using email."+ e)
        localStorage.removeItem('magic_credential');
        // enable login button
        addCallback("login", "click", login)
        elem("login_status").innerText = "not logged in"
    }
}

main().catch((error) => console.log(error))