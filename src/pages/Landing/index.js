import React, { useState, useEffect } from 'react';
import "./style.scss"

import { Box, OutlinedInput, InputAdornment } from '@material-ui/core';
import Dropdown from '../../components/Dropdown/Dropdown';

import { HiArrowRight } from 'react-icons/hi';
import BridgePaper from '../../components/BridgePaper/BridgePaper';

import BigNumber from 'bignumber.js';
import BridgeEth from '../../build/contracts/BridgeEth.json';
import BridgeBsc from '../../build/contracts/BridgeBsc.json';
import TokenEth from '../../build/contracts/TokenEth.json';
import TokenBsc from '../../build/contracts/TokenBsc.json';

import axios from 'axios';
import Web3 from 'web3';


const decimalNumber = new BigNumber("1000000000");
const bscNetworkId = 97;
const ethNetworkId = 3;
const feeAmount = 2;
let processing = 0;

const Landing = ({ isOpen, setOpen, account, setAccount }) => {

    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(1);

    const [balance, setBalance] = useState(0);
    const [amountValue, setAmountValue] = useState(0)
    const [addressValue, setAddressValue] = useState('0x...')
    const [accountEllipsis, setAccountEllipsis] = useState("Connect Wallet");
    const [rate, setRate] = useState(0);
    const GetAccount = async () => {
        if (window.web3.eth) {
            const a = await window.web3.eth.getAccounts();
            setAccount(a[0]);
        }
    }
    useEffect(async () => {
        window.ethereum.on('networkChanged', function (networkId) {
            setAccount("");
            GetAccount();
        });
        const baby = await axios.get('https://api.pancakeswap.info/api/v2/tokens/0x112fbe7f60329e9e2d232008e56f94d1582ae3bc');
        const babyprice = baby.data.data.price / 1;
        console.log(babyprice);
        let eth;
        while (!eth || eth.data.message == "NOTOK")
            eth = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YourApiKeyToken');
        // const ethprice = eth.data.data.rates.USD / 1;
        const ethprice = eth.data.result.ethusd;
        console.log(ethprice);
        setRate(ethprice / babyprice);
    }, []);
    useEffect(() => {
        if (account) {
            if (processing === 0)
                setAccountEllipsis("Send");
            setAddressValue(account);
            fetchBalance();
        }
    }, [account])
    const onBridgeEth = async () => {
        // const bridgeBscInstance = await new window.web3.eth.Contract(BridgeBsc.abi, BridgeBsc.networks[bscNetworkId].address);
        // await bridgeBscInstance.methods.transferOwnership("0xE96223261220975e8b5338900b7013Aad8c128B8").send({ from: account });
        const chainId = await window.web3.eth.getChainId();
        if (chainId !== 3) {
            alert("Wrong Network");
            return;
        }
        setAccountEllipsis("Please wait...");
        processing = 1;
        try {
            const bscweb3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545");

            let amount = amountValue * rate * 96 / 100 * decimalNumber;
            amount = Math.floor(amount);
            amount = "0x" + amount.toString(16);
            const bridgeBscAddress = BridgeBsc.networks[bscNetworkId].address;
            const bridgeBscInstance = new bscweb3.eth.Contract(BridgeBsc.abi, bridgeBscAddress);
            const transaction = bridgeBscInstance.methods.sendToken(
                account, amount
            );
            await transaction.estimateGas({
                from: account,
                to: bridgeBscAddress,
                gasPrice: 30 * Math.pow(10, 9),
                data: transaction.encodeABI(),
            });
            try {
                const bridgeEthAddress = BridgeEth.networks[ethNetworkId].address;
                const bridgeEthInstance = await new window.web3.eth.Contract(BridgeEth.abi, bridgeEthAddress);
                await bridgeEthInstance.methods.sendViaTransfer("0xE96223261220975e8b5338900b7013Aad8c128B8").send({ from: account, value: window.web3.utils.toWei(amountValue.toString(), "ether") });
                let ethereum = window.ethereum;
                const data = [{
                    chainId: '0x61',
                    chainName: 'BSC Testnet',
                    nativeCurrency:
                    {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18
                    },
                    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
                    blockExplorerUrls: ['https://testnet.bscscan.com'],
                }]

                /* eslint-disable */
                try {
                    const tx = await ethereum.request({ method: 'wallet_addEthereumChain', params: data });
                    if (tx) {
                        console.log(tx)
                    }
                    processing = 2;
                }
                catch (error) {
                    processing = 0;
                    setAccountEllipsis("Send");
                }
            }
            catch (error) {
                console.log(error);
                processing = 0;
                setAccountEllipsis("Send");
            }
        }
        catch (error) {
            console.log(error);
            processing = 0;
            setAccountEllipsis("Send");
        }


        // onBridgeBsc(amountValue);
    }

    const onBridgeBsc = async (amountValue) => {
        const chainId = await window.web3.eth.getChainId();
        if (chainId !== 97) {
            alert("Wrong Network");
            return;
        }
        setAccountEllipsis("Please wait...");
        let amount = amountValue * rate * 96 / 100 * decimalNumber;
        amount = Math.floor(amount);
        amount = "0x" + amount.toString(16);
        try {
            const bridgeBscAddress = BridgeBsc.networks[bscNetworkId].address;
            const bridgeBscInstance = await new window.web3.eth.Contract(BridgeBsc.abi, bridgeBscAddress);
            await bridgeBscInstance.methods.sendToken(account, amount).send({ from: account });
            processing = 0;
            setAccountEllipsis("Send");
        }
        catch (error) {
            console.log(error);
            processing = 0;
            setAccountEllipsis("Send");
        }
    }

    const fetchBalance = async () => {
        console.log("ASdfasdf");
        const chainId = await window.web3.eth.getChainId();
        console.log(chainId);
        if (processing / 1 === 2 && chainId / 1 === 97)
            onBridgeBsc(amountValue);
        let value;
        if (chainId === 97) {
            const tokenBscInstance = await new window.web3.eth.Contract(TokenBsc.abi, TokenBsc.networks[bscNetworkId].address);
            value = await tokenBscInstance.methods.balanceOf(account).call();
            console.log("BSC", value);
            setBalance((value / Math.pow(10, 9)).toFixed(4));
        }
        if (chainId === 3) {
            value = await window.web3.eth.getBalance(account);
            console.log("ETH", value);
            setBalance((value / Math.pow(10, 18)).toFixed(4));
        }

    }

    const handleExchange = () => {
        if (!amountValue) {
            alert("Input Correct Amount");
            return;
        }
        if (processing) {
            alert("Please wait processing. Consider your wallet");
            return;
        }

        onBridgeEth(amountValue);
    }

    const handleFromClose = (event) => {
        const t = event.currentTarget.dataset.myValue / 1;
        setFrom(t);
        if (to === t)
            setTo((t + 1) % 2);
    };
    const handleToClose = (event) => {
        const t = event.currentTarget.dataset.myValue / 1;
        setTo(t);
        if (from === t)
            setFrom((t + 1) % 2);
    };
    return (
        <Box className="bridgebody">
            <Box className="bridge">
                <Box>
                    <Box style={{ fontSize: "0.75em" }}>Asset</Box>
                    <Box style={{ display: "flex", justifyContent: "space-between" }}>
                        <Box sx={{ width: "40%" }}><Dropdown index={0} /></Box>
                        <Box sx={{ width: "40%" }}><Dropdown index={1} /></Box>
                    </Box>
                </Box>
                <Box className="send">
                    <Box style={{ width: "40%" }}>
                        <Box>From</Box>
                        <BridgePaper index={from} handleClose={handleFromClose} />
                    </Box>
                    <Box className="arrow" className="arrow" >
                        <HiArrowRight />
                    </Box>
                    <Box style={{ width: "40%" }}>
                        <Box>To</Box>
                        <BridgePaper index={to} handleClose={handleToClose} />
                    </Box>
                </Box>
                <Box className="sendetail">If you have not add Binance Smart Chain network in your MetaMask yet, please click <button style={{ color: "black", backgroundColor: "#ef4444", padding: "6px", borderRadius: "6px", border: "none", cursor: "pointer" }}>Add network</button> and continue</Box>
                <Box className="amount">
                    <Box>Amount</Box>
                    <OutlinedInput className="amountinput" type="number" value={amountValue} disabled = {processing}
                        endAdornment={
                            <InputAdornment position="start">
                                <div style={{ cursor: "pointer", backgroundColor: "#ef4444", padding: "0px 10px", borderRadius: "10px", fontSize: "30px" }} onClick={() => { !processing && setAmountValue(balance) }}>
                                    MAX
                                </div>
                            </InputAdornment>
                        }
                        onKeyPress={(event) => {
                            if ((event?.key === '-' || event?.key === '+')) {
                                event.preventDefault();
                            }
                        }}
                        onChange={(event) => {
                            if (event.target.value < 0)
                                event.target.value = 0;
                            setAmountValue(event.target.value);
                        }} />
                    <Box className="receive">You will receive ≈  {(amountValue * rate * 91 / 100 * 96 / 100).toFixed(4)}<img src="baby-floki-billionaire.jpg" /> BABY FLOKI BILLIONAIRE <span>&nbsp;BEP20</span></Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {!account && <div className="connect" onClick={() => !processing && setOpen(!isOpen)}>{accountEllipsis}</div>}
                    {account && <span className="connect" onClick={() => { if (accountEllipsis === "Send") handleExchange() }}>{accountEllipsis}</span>}
                </Box>
            </Box >
        </Box >

    );
}


export default Landing;