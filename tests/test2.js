/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const Graph = require("../dist/src/Graph");
const StatsManager = require("../dist/src/StatsManager");

// new Graph("line").generateLine();

// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const statsManager = new StatsManager({
	enabledStats: {
		cpu: true
	}
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
	// eslint-disable-next-line no-undef
	console.log("Ready!");
});

client.on("message", async message => {
	if (message.content.startsWith("+stats")) {
		// await message.channel.send(new Graph("line").generateLine(""));
	}
});

// Login to Discord with your client's token
client.login(token);
