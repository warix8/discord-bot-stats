# Discord-bot-stats

Discord-bot-stats is a cool Node.js package to have statistics graphs for your Discord Bot.

## Installation

```bash
npm install discord-bot-stats
OR
yarn add discord-bot-stats
```

## Example Usage with a local database enmap in javascript

```bash
npm i enmap
OR
yarn add enmap
```

Note: See more about enmap installation [here](https://enmap.evie.dev/install/).

Create a config.json.

```json
{
	"token": "YOUR_BOT_TOKEN",
	"guildId": "YOUR_GUILD_ID",
	"clientId": "YOUR_CLIENT_ID"
}
```

Create a new file called `deploycommands.js` and paste the following code in it:

```js
const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { clientId, guildId, token } = require("./config.json");

const commands = [
	new SlashCommandBuilder().setName("ram").setDescription("Generates a beautiful graph for my bot ram usage.")
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log("Successfully registered application commands."))
	.catch(console.error);
```

Create a new file called `EnmapStatsManager.js` and paste the following code in it:

```js
const { StatsManager } = require("discord-bot-stats");

const Enmap = require("enmap");

module.exports = class extends StatsManager {
	constructor(options) {
		super(options);
		this.stats = new Enmap({ name: "stats" });
	}

	async deleteStats(timestamps) {
		for (const timestamp of timestamps) {
			this.stats.delete(timestamp.toString());
		}
		this.return;
	}

	async getStats() {
		return this.stats.fetchEverything().array();
	}

	async saveStats(stats) {
		this.stats.set(stats.timestamp.toString(), stats);
		return;
	}
};
```

Now create your bot main file index.js

```js
// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { LineGraph } = require("discord-bot-stats");
const EnmapStatsManager = require("./EnmapStatsManager.js");

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const statsManager = new EnmapStatsManager({
	enabledStats: {
		servers: true,
		users: true,
		ram: true
	}
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
	statsManager.start(async () => {
		return {
			stats: {
				servers: client.guilds.cache.size,
				users: client.users.cache.size,
				ram: process.memoryUsage().heapUsed / 1024 / 1024
			}
		};
	});
});

client.on("interactionCreate", async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	if (commandName === "line") {
		const graph = await new LineGraph(statsManager).generate("ram");
		await interaction.reply({
			files: [{ name: "graph.png", attachment: graph }]
		});
	}
});

// Login to Discord with your client's token
client.login(token);
```

## Example Usage With MongoDB in typescript

```bash
npm i mongoose
OR
yarn add mongoose
```

Creates a first file named MongoStatsManager.ts

```typescript
import { StatsManager } from "discord-bot-stats";
import mongoose from "mongoose";
import { SavedStatsFormat, StatsManagerOptions } from "discord-bot-stats/types/types";

const StatsSchema = new mongoose.Schema({
	timestamp: Number,
	stats: {
		cpu: Number,
		ram: Number,
		servers: Number,
		users: Number,
		commands: Map,
		errors: Number
	}
});

const StatsModel = mongoose.model("BotStats", StatsSchema);

export default class extends StatsManager {
	constructor(options: StatsManagerOptions) {
		super(options);
		this._connect();
	}

	async _connect() {
		await mongoose.connect("mongodb://localhost:27017/botstatsmodule");
	}

	async deleteStats(timestamps: number[]): Promise<void> {
		StatsModel.deleteMany({ timestamp: { $in: timestamps } }).exec();
		return;
	}

	async getStats(): Promise<SavedStatsFormat[]> {
		return StatsModel.find().lean().exec() as unknown as Promise<SavedStatsFormat[]>;
	}

	async saveStats(stats: SavedStatsFormat): Promise<void> {
		StatsModel.create(stats);
		return;
	}
}
```

Crate a second file named bot.ts

```typescript
import { Client, GatewayIntentBits } from "discord.js";
import { LineGraph } from "discord-bot-stats";
import MongoStatsManager from "./MongoStatsManager";

// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const statsManager = new MongoStatsManager({
	enabledStats: {
		cpu: true,
		ram: true,
		servers: true,
		commands: true
	}
});

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
	statsManager.start(async () => {
		const cmds = new Map()
			.set("ping", Math.floor(Math.random() * 12))
			.set("stats", Math.floor(Math.random() * 12))
			.set("lmao", Math.floor(Math.random() * 12))
			.set("trala", Math.floor(Math.random() * 12))
			.set("xxx", Math.floor(Math.random() * 12))
			.set("pitttng", Math.floor(Math.random() * 12));
		return {
			timestamp: Date.now(),
			stats: {
				cpu: 0.1,
				ram: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
				servers: client.guilds.cache.size,
				users: client.users.cache.size,
				commands: cmds
			}
		};
	});
});

client.on("messageCreate", async message => {
	if (message.author.bot) return;
	console.log(message.content);
	if (message.content.startsWith("+stats")) {
		const graph = await new LineGraph(statsManager).generate("ram");
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
```
