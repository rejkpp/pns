import './styles/App.css';
import { ethers } from "ethers";
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import contractAbi from './utils/contractABI.json';
import React, { useEffect, useState } from "react";
import twitterLogo from './assets/twitter-logo.svg';
import polygonLogo from './assets/polygonlogo.png';

// Add the domain you will be minting
const tld = '.com';
// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = '0x241e19964C29c0E424FB14d0759040D6b59D15C4';




const App = () => {
 	// Add some state data propertie
  const [mints, setMints] = useState([]);
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  const [network, setNetwork] = useState('');
  const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [minting, setMinting] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');


  // Implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      // Fancy method to request access to account.
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    
      // Boom! This should print out public address once we authorize Metamask.
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }
        // This is the new part, we check the user's network chain ID
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setNetwork(networks[chainId]);

    ethereum.on('chainChanged', handleChainChanged);
    
    // Reload the page when they change networks
    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        alert("add mumbai network to metamask");
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {	
                  chainId: '0x13881',
                  chainName: 'Matic Mumbai',
                  rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
                  nativeCurrency: {
                      name: "Matic",
                      symbol: "MATIC",
                      decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    } 
  }

  const mintDomain = async () => {
	// Don't run if the domain is empty
	if (!domain) { return }
	// Alert the user if the domain is too short
	if (domain.length < 3) {
		alert('Domain must be at least 3 characters long');
		return;
	}
	if (domain.length > 10) {
		alert('Domain cannot be more than 10 characters long');
		return;
	}
	// Calculate price based on length of domain (change this to match your contract)	
	// 3 chars = 0.03 MATIC, 4 chars = 0.02 MATIC, 5 or more = 0.01 MATIC
	const price = domain.length === 3 ? '0.03' : domain.length === 4 ? '0.02' : '0.01';
	console.log("Minting domain", domain, "with price", price);
  try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

      setMinting (true);
      setLoading (true);

      // Get all the domain names from our contract
      const names = await contract.getAllNames();
      const totalRegisteredNames = names.length;
      
      console.log(totalRegisteredNames);
      for (let i = 0; i < totalRegisteredNames; i++) {
        const registeredName = await contract.names(i);
        if (domain == registeredName) {
          alert(domain+tld+ " already registered. please choose a different name");
          setDomain('');
          setLoading (false);
          setMinting (false);
        }
       }
      
			console.log("Going to pop wallet now to pay gas...")
      let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
      // Wait for the transaction to be mined
			const receipt = await tx.wait();

			// Check if the transaction was successfully completed
			if (receipt.status === 1) {
				console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
        alert("minted: "+domain+tld);
				
        if (!record) { 
          setDomain('');
          setLoading (false);
          setMinting (false);
          fetchMints();
          return 
        }

        try {
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);

            // Call fetchMints after 2 seconds
          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord('');
          setDomain('');
          setLoading (false);
          setMinting (false);
          
        } catch (error) {
          setEditing(true);
          setLoading (false);
          setMinting (false);
          fetchMints();
          console.log(error);  
        }
			}
			else {
        setLoading (false);
        setMinting (false);
				alert("Transaction failed! Please try again");
			}
    }
  }
  catch(error){
    setLoading (false);
    setMinting (false);
    console.log(error);
  }
}


    // Add this function anywhere in your component (maybe after the mint function)
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
        if (ethereum) {
          // You know all this
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
            
          // Get all the domain names from our contract
          const names = await contract.getAllNames();
            
          // For each name, get the record and the address
          const mintRecords = await Promise.all(names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          }));
  
          console.log("MINTS FETCHED ", mintRecords);
          setMints(mintRecords);
        }
    } catch(error){
      console.log(error);
    }
  }


  const updateDomain = async () => {
    if (!record || !domain) { return }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
      try {
        const { ethereum } = window;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
    
          let tx = await contract.setRecord(domain, record);
          await tx.wait();
          console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
    
          fetchMints();
          setRecord('');
          setDomain('');
        }
      } catch(error) {
        console.log(error);
      }
    setLoading(false);
  }
  
  // Create a function to render if wallet is not connected yet
  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <img src="https://media4.giphy.com/media/ieW5dfu5bWoP6/giphy.gif" alt="bubbles gif" />
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        connect wallet
      </button>
    </div>
  );


  // Form to enter domain name and data
	const renderInputForm = () =>{
    // If not on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
    if (network !== 'Polygon Mumbai Testnet') {
      return (
        <div className="connect-wallet-container">
        <h2>Please switch to Polygon Mumbai Testnet</h2>
        {/* This button will call our switch network function */}
        <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
        </div>
      );
    }
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='whats ur secret weapon'
					onChange={e => setRecord(e.target.value)}
				/>

          {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
          {editing ? (
            <div className="button-container">
              {/* This will call the updateDomain function we just made */}
              <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
                Set record
              </button>  
              {/* This will let us get out of editing mode by setting editing to false */}
              <button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
                Cancel
              </button>  
            </div>
          ) : (
            minting ? (
              <div>
                <h1>minting...</h1>
              </div>
            ) : (
              <button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
                Mint
              </button>  
            )          )}



			</div>
		);
	}


  // Add this render function next to your other render functions
  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="mint-container">
          <p className="subtitle"> Recently minted domains!</p>
          <div className="mint-list">
            { mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className='mint-row'>
                    <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                      <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                      <button className="edit-button" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                    }
                  </div>
            <p> {mint.record} </p>
          </div>)
          })}
        </div>
      </div>);
    }
  };


  // This will take us into edit mode and show us the edit buttons!
  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  }
  
  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // This will run any time currentAccount or network are changed
  useEffect(() => {
    if (network === 'Polygon Mumbai Testnet') {
      fetchMints();
    }
  }, [currentAccount, network]);

  
  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title"> ramiro name service on polygon testnet</p>
              <p className="subtitle">make sure to connect to mumbai testnet.</p>
              <p>register your domain through the mint button. <br></br>it's cheap. <br></br>0.01 - 0.03 matic</p>
            </div>

            {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
              { currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
            </div>
					</header>
				</div>

        {/* Hide the connect button if currentAccount isn't empty*/}
        {!currentAccount && renderNotConnectedContainer()}
 				{/* Render the input form if an account is connected */}
				{currentAccount && renderInputForm()}
        {mints && renderMints()}

        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
