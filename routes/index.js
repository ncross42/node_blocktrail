var express = require('express');
var router = express.Router();
//var fs = require('fs');
var util = require('util');

const conf = require('config');
const blocktrail = require('blocktrail-sdk');
const is_url = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;

console.time('t_client');
const client = blocktrail.BlocktrailSDK({ //{{{
  apiKey: conf.apiKey,
  apiSecret: conf.apiSecret,
  testnet: conf.testnet
}); //}}}
console.timeEnd('t_client');

console.time('t_wallet');
var wallet = null;//{{{
client.initWallet({ identifier: conf.wallet_id, readOnly: true }, (err, wal) => {
  if (err) {
    console.log('FAILED TO initWallet');
    console.log(err);
    process.exit();
    return;
  }
  console.timeEnd('t_wallet');
  // fs.writeFile('wallet.json', util.inspect(wal), err => { if (err) console.log(err); } );
  wallet = wal;
});//}}}

router.get('/', function(req, res, next) { res.end('Express'); });

router.get('/balance', (req, res, next) => {//{{{
  console.log('balance');
  wallet.getBalance( (err, confirmed, unconfirmed) => {
    if (err) { console.log(err); res.status(500).end('Internal Error'); }
    else res.json({confirmed,unconfirmed});
  });
});//}}}

router.get('/new_address', (req, res, next) => { //{{{
  console.log('new_address');
  wallet.getNewAddress( (err, address) => {
    if (err) { console.log(err); res.status(500).end('Internal Error'); }
    else res.end(address);
  });
});//}}}

router.post('/setup_webhook', (req, res, next) => { //{{{
  console.log('');
  let webhook_id = req.body.webhook_id;
  let webhook_url = req.body.webhook_url;
  console.log('setup_webhook1 = '+util.inspect(req.body,{breakLength:Infinity}) );
  if ( ! is_url.test(webhook_url) ) {
    return res.status(400).end('Bad Request');
  }

  if (!webhook_id) {
    wallet.setupWebhook(webhook_url, (err, result) => {
      if (err) { console.log(err); res.status(500).end('Internal Error'); }
      else { console.log('setupWebhook = '+util.inspect(result,{breakLength:Infinity}) ); res.json(result); }
    });
  } else {
    wallet.deleteWebhook(webhook_id, (err, result) => {
      if (err) console.log(err);
      else console.log('webhook deleted');

      wallet.setupWebhook(webhook_url, (err, result) => {
        if (err) { console.log(err); res.status(500).end('Internal Error2'); }
        else { console.log('setupWebhook = '+util.inspect(result,{breakLength:Infinity}) ); res.json(result); }
      });
    });
  }
});//}}}

router.get('/address/info/:addr', (req, res, next) => {//{{{
  /* Return Value { //{{{
    "address": "1NcXPMRaanz43b1kokpPuYDdk6GGDvxT2T",
    "hash160": "ED12908714FFD43142BF9832692017E8AD54E9A8",
    "balance": 49497392,
    "received": 115015000,
    "sent": 65517608,
    "unconfirmed_received": 0,
    "unconfirmed_sent": 0,
    "unconfirmed_transactions": 0,
    "total_transactions_in": 4,
    "total_transactions_out": 10,
    "category": "donations",
    "tag": "blocktrail"
  }*/ //}}}
  console.log('address info');
  const addr = req.params.addr;
  if ( 35 != addr.length ) {
    res.status(400).end('Bad Request');
  } else {
    client.address(addr, (err, info) => {
      if (err) { console.log(err); res.status(500).end('Internal Error'); }
      else { res.json(info); }
    });
  }
});//}}}

router.get('/address/txs/:addr', (req, res, next) => {//{{{
  console.log('address txs');
  const addr = req.params.addr;
  if ( 35 != addr.length ) {
    res.status(400).end('Bad Request');
  } else {
    client.addressTransactions(addr, {page:1, limit: 200}, (err, addressTxs) => {
      if (err) { console.log(err); res.status(500).end('Internal Error'); }
      else { res.json(addressTxs); }
    });
  }
});//}}}

//router.get('/balance', async (req, res, next) => { // express-asyncify
//  console.log('get balance');
//  let ret = '';
//  try {
//    const [confirmed,unconfirmed] = await wallet.getBalance( 
//      (err, confirmed, unconfirmed) => [confirmed, unconfirmed] 
//    );
//    ret = `confirmed balance: ${confirmed}, unconfirmed balance: ${unconfirmed}`
//  } catch (err) { ret = 'err balance'; console.log(err); }
//  filnally { res.send(ret); }
//});

module.exports = router;
