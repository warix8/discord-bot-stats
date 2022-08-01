// import Graph from "../src/Graph";

// new Graph("line").generateLine();

// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from "discord.js";
import Graph from "../src/Graph";
import { token } from "./config.json";
import MongoStatsManager from "./MongoStatsManager";

// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const statsManager = new MongoStatsManager({
	enabledStats: {
		cpu: true,
		ram: true,
		servers: true
	}
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
	statsManager.start(() => {
		return {
			cpu: process.cpuUsage().user,
			ram: process.memoryUsage().heapUsed / 1024 / 1024,
			servers: client.guilds.cache.size,
			users: client.users.cache.size
		};
	});
});

client.on("messageCreate", async message => {
	if (message.author.bot) return;
	console.log(message.content);
	if (message.content.startsWith("+stats")) {
		const graph = await new Graph(statsManager).generate("ram");
		await message.channel.send({
			files: [
				{
					attachment: graph
				}
			]
		});
	}
});

// Login to Discord with your client's token
client.login(token);
