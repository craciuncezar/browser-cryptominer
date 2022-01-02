<div align="center">
<h1>Browser cryptominer</h1>  
  
<p>
Browser monero crypto miner client implementation using wasm and web workers
</p>
  
 > **DISCLAIMER:** The demo app below will perform hash computations in order to mine cryptocurrency on my behalf, but the script is throttled so that it does not affect your device. There is no virus, and the script is ephemeral; once you leave the page, it stops working. This repository should only be used for educational purposes.

[Live demo here](https://browser-crypto.herokuapp.com/)
  
![coin](https://user-images.githubusercontent.com/27342306/147887308-bafc0e1b-7a3d-41da-8f5b-56298ea740e2.png)

</div>

## About

This project was one of several demonstrations I gave for my cybersecurity dissertation paper, "Browser-based fileless malware: cryptojacking and botnets." What you're looking at is a web-based crypto miner implementation.

The web client is using a wasm compiled version of [cryptonight](https://monerodocs.org/proof-of-work/cryptonight/), the hashing algorithm used by monero. The reason for using this algorithm is that it is designed to rely on CPU power rather than GPU power, making it more efficient on the web. The hashing algorithm was compiled to wasm from `C` using [emscripten](https://emscripten.org/) and can be found in the `/public` directory; `cn.js` is a js wrapper around the binary file `cn.wasm` which contains the hashing function.

In order to not block the main/ui thread this app is using [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), in theory this app should span a number of web workers equal to the number of logical processors available to run threads on the user's computer. Each web worker then is comunicating with the main thread that keeps a web socket connection to a monero mining pool (moneroocean). The connection to the mining pool is beeing proxied through a [light node server](https://github.com/craciuncezar/browser-cryptominer/blob/4ca0a2b6dc93c7c9033667b125b81b4bbe460a27/proxy-server/index.js), the reason behind this is to avoid detection from ad blockers or antiviruses which can block server requests to the `wss://webminer.moneroocean.stream/` address.

The script files are obfuscated on the build process, this can be done on a cron job as well, this can assure that antiviruses can't banlist the file hash. There are also many ways of distributing this sort of malicious scripts one way beeing through an Iframe ad. 

> **DISCLAIMER 2:** This is a proof of concept, please don't use this for malicious purposes. There are obviously point of failures for this web app, such as the address to the proxy server that can be banned, there is also more performant ways of mining crypto on the web if thats what you are going for. 

## Learn more

I shared more on this topic at [this page](https://browser-crypto.herokuapp.com/about/) with a simple demonstration on how you can hide the malicious script behind an iframe.

Other cool resource on the same topic:
- [Browser as Botnet](https://www.youtube.com/watch?v=GcXfu-EAECo) talk given at the Radical Networks in 2017
- [Million Browser Botnet](https://www.youtube.com/watch?v=ERJmkLxGRC0) talk given at Black Hat 2013
