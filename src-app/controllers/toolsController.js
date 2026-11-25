const process = require('child_process');
const fortuneRiddle = require('../utils/fortuneData.js');

// Allowlist for permitted hosts to ping
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'example.com', 'google.com', '8.8.8.8'];

// Allowlist for permitted fortune files
const ALLOWED_FORTUNE_FILES = ['fortunes', 'riddles', 'literature', 'art', 'computers', 'food', 'people', 'wisdom'];

// Loads tools page
function showTools(req, res) {
    res.render('tools.hbs', {});
}
// Performs actions on tools page
async function processTools(req, res) {
    console.log("Request body:", req.body); // Log the entire request body
    let host = req.body.host;
    let fortuneFile = req.body.fortuneFile;

    res.locals['ping'] = await ((host != null) ? ping(host).catch(function () { console.log("Promise rejected"); }) : "");

    if (!fortuneFile) {
        fortuneFile = "fortunes";
    }
    console.log("Selected fortune file:", fortuneFile);
    
    res.locals['fortunes'] = await fortune(fortuneFile).catch(function () { console.log("Promise rejected"); });
    
    return res.render('tools', {host});
}
// Pings selected host based on user input, then outputs the results
async function ping(host) {
    return new Promise((resolve, reject) => {
        // Validate host against allowlist
        const hostIndex = ALLOWED_HOSTS.indexOf(host);
        if (hostIndex === -1) {
            console.log("Host not in allowlist: " + host);
            reject("Invalid host specified");
            return;
        }
        // Retrieve safe value from allowlist
        const safeHost = ALLOWED_HOSTS[hostIndex];

        let output = "";
        console.log("Pinging " + safeHost);

        let timer = setTimeout(() => {
            console.log("Ping timed out");
            output = "ping: unknown host " + safeHost;
            reject(output);
        }, 5000);
        try {
            let pingProcess = process.spawn('ping', ['-c', '1', safeHost]);
            pingProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pingProcess.stderr.on('data', (data) => {
                console.log("Error: " + data.toString());
                clearTimeout(timer);
                reject(data.toString());
            });

            pingProcess.on('exit', (code) => {
                console.log("Exit code: " + code);
                clearTimeout(timer);
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(`ping process exited with code ${code}`);
                }
            });
        } catch (err) {
            console.error("Error occured during ping: ", err);
            output = "ping: unknown host " + host;
            resolve(output);
        }
    });
}

// Produces a fortune based on selection
async function fortune(fortuneFile) {
    
    if (fortuneFile === "fortunes") {
        console.log(fortuneFile)
        console.log(fortuneRiddle.FortuneData())
        return fortuneRiddle.FortuneData();
    }
    else if (fortuneFile === "riddles") {
        console.log(fortuneFile)
        console.log(fortuneRiddle.RiddleData())
        return fortuneRiddle.RiddleData();
    } else {
        return new Promise((resolve, reject) => {
            // Validate fortuneFile against allowlist
            const fileIndex = ALLOWED_FORTUNE_FILES.indexOf(fortuneFile);
            if (fileIndex === -1) {
                console.log("Fortune file not in allowlist: " + fortuneFile);
                reject("Invalid fortune file specified");
                return;
            }
            // Retrieve safe value from allowlist
            const safeFortuneFile = ALLOWED_FORTUNE_FILES[fileIndex];

            let output=""
            try{
                // Use execFile instead of exec to avoid shell injection
                process.execFile('fortune', [safeFortuneFile], (error, stdout, stderr) => {
                    if (error) {
                      console.error(`execFile error: ${error}`);
                      reject(output);
                    }
                    resolve(stdout)
                });
            }
            catch(err)
            {
                console.log(err);
                resolve(output);
            }
        })
    }
}


module.exports = {showTools, processTools,}


