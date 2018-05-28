'use strict';

// Import environment variables
require('dotenv').config();

/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Middlewares
var translator = require('./middlewares/translator');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

if (process.env.Environment == 'dev') {
    var tableStorage = new builder.MemoryBotStorage();
} else {
    var tableName = 'botdata';
    var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
    var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
}

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

// Load middlewares
bot.use({
    botbuilder: (session, next) => {
        translator.toBot(session, next);
    },
    send: (session, next) => {
        translator.toUser(session, next);
    }
});

// Create dialogs based on intents
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.onDefault([
    (session) => {
        // session.send('You said ' + session.message.text);
        session.send([
            'Hola ¿cómo estás?',
            'Buenas tardes joven',
            '¿Te gustaría pedir informes?'
        ]);
    }
]);