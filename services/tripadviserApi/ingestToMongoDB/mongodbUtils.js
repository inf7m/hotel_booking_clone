const fs = require('fs');
const { MongoClient, ServerApiVersion } = require('mongodb');
const yaml = require('js-yaml');
// read MongoDB credentials/config
function readMongoConfig() {
    try {
        const path = require('path');
        const fs = require('fs');
        const configPath = path.join(__dirname, 'mongodbConfig.yaml');
        const config = yaml.load(fs.readFileSync(configPath, 'utf8'))
        return config.mongo;  // Return the mongo configuration object
    } catch (e) {
        console.error("Error reading YAML configuration:", e);
        return null;
    }
}
const mongoConfig = readMongoConfig();
const { host, port, username, password, database, authSource, useUnifiedTopology } = mongoConfig;

// Setup connection *Use can take this on MongoDB documentation
async function settingUpTheConnection() {
    const uri = `mongodb+srv://${username}:${password}@cluster0.qsa9hsq.mongodb.net/?appName=Cluster0`;
    console.log(uri);
    console.log(mongoConfig)
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    const client = new MongoClient(uri);
    // Connect the client to the server	(optional starting in v4.7)
    const connect = await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("database").command({ping: 1});
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    return connect; // return a Connection to MongoDB
}
module.exports = {
    settingUpTheConnection
};
settingUpTheConnection()
shell script