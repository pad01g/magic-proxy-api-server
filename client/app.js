// ethers, Magic are loaded
const apiKey = 'pk_live_581C324CA3D5A249'
const magic = new Magic(apiKey);

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

    }catch(e){

        console.log("credential not found. now let's try to login using email."+ e)
        // enable login button
        addCallback("login", "click", login)
        elem("login_status").innerText = "not logged in"
    }
}

main().catch((error) => console.log(error))