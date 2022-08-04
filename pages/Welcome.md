# Discord-bot-stats

Discord-bot-stats is a cool Node.js package to have statistics graphs for your Discord Bot.

## Installation

```bash
npm install discord-bot-stats
OR
yarn add discord-bot-stats
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
