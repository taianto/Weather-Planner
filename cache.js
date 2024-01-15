const imCache = require("node-cache");

const cache = new imCache();

const cacheURL = (duration) => (req, res, next) => {
    // Convert URL to uppercase to ignore case comparisons.
    const key = req.originalUrl.toUpperCase();

    //Check if URL has been cached before
    const cacheResp = cache.get(key); 

    // If not cached
    if (cacheResp === undefined) {
        console.log(`Cache miss: ${key}`);

        res.originalSend = res.send;

        // Replace original send with a new function which takes the result as a parameter
        // and sends it as a response as normal, but also store the result in cache with
        // the URL as the key
        res.send = result => {
            res.originalSend(result);
            cache.set(key, result, duration);
        };
        next();
    }
    else {
        // If cached, send result as normal
        console.log(`Cache hit: ${key}`);
        res.send(cacheResp); 
    }
}

module.exports = { cacheURL };