// ethers, Magic, MagicOAuthExtension are loaded
const apiKey = 'pk_live_581C324CA3D5A249'
const infuraKey = '4026a8ce431c497a816b8bffeeb07eee'
const network = {
    rpcUrl: `https://sepolia.infura.io/v3/${infuraKey}`,
    chainId: "11155111"
}
const endpoint = location.protocol + '//' + location.host
const magic = new Magic(apiKey, {
    network,
    // endpoint,
    extensions: [new MagicOAuthExtension()],
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
        await loginCallBack();
    }else{
        console.log(`login failed`)
    }
}

const loginOauthGithub = async () => {
    await magic.oauth.loginWithRedirect({
        provider: 'github' /* 'google', 'facebook', 'apple', or 'github' */,
        redirectURI: location.toString(),
        scope: ['user:email'] /* optional */,
    });
}

const loginOauthGitlab = async () => {
    await magic.oauth.loginWithRedirect({
        provider: 'gitlab' /* 'google', 'facebook', 'apple', or 'github' */,
        redirectURI: location.toString(),
    });
}

const clearCredential = async () => {
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

const transferContract = async () => {
    const ethAmountTransfer = elem("eth_amount_transfer").value
    const ethAddressTransfer = elem("eth_address_transfer").value

    const destination = ethAddressTransfer;
    const amount = ethers.utils.parseEther(ethAmountTransfer); // Convert 1 ether to wei
    
    const signer = provider.getSigner();
    console.log({signer})

    // Submit transaction to the blockchain
    const tx = await signer.sendTransaction({
      to: destination,
      value: 0,
      data: "0x6a627842" + "000000000000000000000000231d51dbeC6E3E63Ad22078C73B70fBfD1b14265",
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    elem("eth_receipt_transfer").innerText = JSON.stringify(receipt, null, 2);
}

const loginCallBack = async () => {
    elem("login_status").innerText = "logged in"

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
    addCallback("transfer_contract", "click", transferContract)
    addCallback("clear_credential", "click", clearCredential)
}

const main = async () => {

    magic.preload().then(() => console.log('Magic <iframe> loaded.'));

    const params = new URL(location.toString()).searchParams;
    const credentialFromURL = params.get('magic_credential');
    console.log(credentialFromURL)

    try{
        const result = await magic.oauth.getRedirectResult();
        console.log("successfully logged in by oauth.", result)
        elem("oauth_metadata").innerText = JSON.stringify(result,null,2);

        // this is callback context
        await loginCallBack();

    }catch(e){
        console.log(`not a redirect result from oauth login, continue to email login`, e)
        try {

            if(!credentialFromURL){
                throw new Error("no credentials found")
            }

            await magic.auth.loginWithCredential(credentialFromURL);

            console.log("successfully logged in.")

            // this is callback context
            await loginCallBack();

        }catch(e){

            console.log("credential not found. now let's try to login using email. "+ e)
            // enable login button
            addCallback("login", "click", login)
            addCallback("login_oauth_github", "click", loginOauthGithub)
            addCallback("login_oauth_gitlab", "click", loginOauthGitlab)
            elem("login_status").innerText = "not logged in"
        }
    }
}

main().catch((error) => console.log(error))