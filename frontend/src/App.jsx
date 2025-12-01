import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingABI from './VotingSystem.json';

const CONTRACT_ADDRESS = ""; 
// NOTE: Copy & Paste the deployed contract address here (e.g., "0x5FbDB...")

function App() {
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  // Connect to metamask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        checkIfVoted(accounts[0]);
      } catch (err) {
        setError("Gagal konek wallet: " + err.message);
      }
    } else {
      setError("Install Metamask dulu!");
    }
  };

  // Get Data Candidate from Blockchain
  const fetchCandidates = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI.abi, provider);
      
      try {
        const count = await contract.candidatesCount();
        const tempCandidates = [];

        // Loop candidate Data
        for (let i = 1; i <= count; i++) {
          const candidate = await contract.candidates(i);
          tempCandidates.push({
            id: Number(candidate.id),
            name: candidate.name,
            voteCount: Number(candidate.voteCount)
          });
        }
        setCandidates(tempCandidates);
      } catch (err) {
        console.error("Error fetch data", err);
      }
    }
  };

  const checkIfVoted = async (userAddress) => {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI.abi, provider);
        try {
            const status = await contract.voters(userAddress);
            setHasVoted(status);
        } catch (err) {
            console.log("Belum vote / Error cek status");
        }
    }
  }

  // Function Vote
  const voteCandidate = async (id) => {
    if (!account) return alert("Konek wallet dulu!");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(); 
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingABI.abi, signer);

      const tx = await contract.vote(id);
      await tx.wait();
      
      alert("Vote Berhasil! 🎉");
      setHasVoted(true);
      fetchCandidates(); 
    } catch (err) {
      console.error(err);
      alert("Gagal Vote: " + (err.reason || "Transaksi Ditolak"));
    }
    setLoading(false);
  };

  // Load data 
  useEffect(() => {
    fetchCandidates();
    if(window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
            window.location.reload();
        });
    }
  }, []);

  return (
  <div className="min-h-screen bg-[#05060A] text-white font-inter px-6 py-8 relative overflow-hidden">

    {/* Web3 Gradient Glow Background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="w-[600px] h-[600px] bg-[#5A4AE3] blur-[180px] opacity-20 absolute -top-40 -left-32"></div>
      <div className="w-[600px] h-[600px] bg-[#00E8FF] blur-[200px] opacity-20 absolute bottom-0 right-0"></div>
    </div>

    <div className="relative max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-emerald-400 font-mono tracking-wide">
              Ethereum Local Chain
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight mt-3">
            Decentralized Voting System
          </h1>
          
          <p className="text-gray-400 text-sm mt-1">
            Votes are stored cryptographically on-chain 🔐
          </p>
        </div>

        {!account ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 rounded-xl bg-gradient-to-br from-[#00E8FF] to-[#A259FF]
            hover:brightness-110 transition shadow-lg shadow-[#6C5DF0]/40 text-black font-semibold text-sm tracking-wide"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-right bg-[#111318] border border-[#5A4AE3]/40 
          px-4 py-2 rounded-xl backdrop-blur-md shadow-md">
            <p className="text-[10px] text-gray-500">Connected Wallet</p>
            <p className="font-mono text-[13px] text-[#00E8FF]">
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {hasVoted && (
        <div className="alert-toast success flex items-center gap-2 mb-8">
          <span className="text-lg">✔</span> Vote Recorded On-Chain Successfully
        </div>
      )}

      {error && (
        <div className="alert-toast error mb-8">
          ⚠ {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 mt-10">
        {candidates.map((candidate) => (
          <div key={candidate.id}
            className="group bg-[#0C1016]/80 border border-[#1B2330] hover:border-[#5A4AE3]/60 
            shadow-lg shadow-black/30 rounded-2xl px-7 py-6 backdrop-blur-xl transition duration-300
            hover:shadow-[#5A4AE3]/25 hover:-translate-y-1">
            
            <div className="text-[11px] text-gray-500 mb-3 font-mono">
              Candidate #{String(candidate.id).padStart(2, "0")}
            </div>

            <h2 className="text-xl font-light tracking-wide">
              {candidate.name}
            </h2>

            <p className="text-gray-500 text-[11px] font-mono mt-1">
              On-Chain Votes
            </p>

            <p className="text-4xl font-bold text-[#00E8FF] mt-3 drop-shadow-[0_0_15px_#00E8FF55]">
              {candidate.voteCount}
            </p>

            <button
              onClick={() => voteCandidate(candidate.id)}
              disabled={loading || hasVoted}
              className={`w-full mt-6 py-3 rounded-xl text-sm font-semibold tracking-wide
              transition ${hasVoted 
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-br from-[#00E8FF] to-[#A259FF] hover:brightness-110 shadow-md shadow-[#00E8FF]/30"}`
              }
            >
              {loading ? "Broadcasting..." : hasVoted ? "Voted" : "Vote Now"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-14 font-mono">
        🔗 Smart Contract: {CONTRACT_ADDRESS}
      </p>

    </div>
  </div>
);

}

export default App;