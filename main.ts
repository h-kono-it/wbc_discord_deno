import { discordeno } from "./deps.ts";
import { Secret } from "./secret.ts";
import { Members } from "./members.ts";

const bot = discordeno.createBot({
  token: Secret.DISCORD_TOKEN,
  intents:
    discordeno.Intents.Guilds |
    discordeno.Intents.GuildMessages |
    discordeno.Intents.MessageContent,
  events: {
    ready: (_bot, payload) => {
      console.log(`${payload.user.username} is ready!`);
    },
  },
});

const listCommand: discordeno.CreateSlashApplicationCommand = {
  name: "list",
  description: "代表メンバーを返します",
};
const detailCommand: discordeno.CreateSlashApplicationCommand = {
  name: "detail",
  description: "代表メンバーの情報を返します",
  options: [
    {
      type: discordeno.ApplicationCommandOptionTypes.String,
      name: "number",
      description: "背番号",
      required: true,
    },
  ],
};
await bot.helpers.createGuildApplicationCommand(listCommand, Secret.GUILD_ID);
await bot.helpers.createGuildApplicationCommand(detailCommand, Secret.GUILD_ID);
await bot.helpers.upsertGuildApplicationCommands(Secret.GUILD_ID, [
  listCommand,
  detailCommand,
]);

bot.events.messageCreate = (b, message) => {
  if (message.content === "!neko") {
    b.helpers.sendMessage(message.channelId, {
      content: "にゃーん",
    });
  }
};

bot.events.interactionCreate = async (b, interaction) => {
  switch (interaction.data?.name) {
    case "list": {
      b.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: discordeno.InteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: "```" + memberText() + "```",
        },
      });
      break;
    }
    case "detail": {
      b.helpers.sendInteractionResponse(interaction.id, interaction.token, {
        type: discordeno.InteractionResponseTypes.ChannelMessageWithSource,
        data: await getMemberData(
          (
            interaction.data.options?.find((option) => option.name === "number")
              ?.value || ""
          ).toString()
        ),
      });
      break;
    }
    default: {
      break;
    }
  }
};

const getMemberData = async (
  num: string
): Promise<discordeno.InteractionCallbackData | undefined> => {
  const member = Members[num];
  if (member) {
    return {
      content: member.name,
      file: member.imageName
        ? { blob: await fileToBlob(member.imageName), name: member.imageName }
        : undefined,
    };
  }
  return undefined;
};

const memberText = (): string => {
  const result = [];
  for (const key of Object.keys(Members)) {
    result.push(`背番号：${key}、${Members[key]}`);
  }
  return result.join("\n");
};

const fileToBlob = async (path: string): Promise<Blob> => {
  return new Blob([(await Deno.readFile(`./images/${path}`)).buffer]);
};

await discordeno.startBot(bot);
