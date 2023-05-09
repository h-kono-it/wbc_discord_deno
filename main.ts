import { discordeno } from "./deps.ts";
import { Secret } from "./secret.ts";
import { Members, PleyerResult } from "./members.ts";

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
  name: "member_list",
  description: "代表メンバーを返します",
  options: [],
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
    case "member_list": {
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
      content: detailContentText(member),
      file: member.imageName
        ? { blob: await fileToBlob(member.imageName), name: member.imageName }
        : undefined,
    };
  }
  return undefined;
};

const memberText = () => {
  const result = [];
  for (const key of Object.keys(Members)) {
    result.push(`背番号：${key}、${Members[key].name}`);
  }
  return result.join("\n");
};

const detailContentText = (member: {
  name: string;
  imageName: string;
  season: PleyerResult;
}): string => {
  const result = [];
  result.push(`${member.name}(2022年度:${member.season.joined})`);
  result.push("```" + resultToText(member.season) + "```");
  return result.join("\n");
};

const resultToText = (result: PleyerResult): string => {
  if (result.isPitcher) {
    return `防 ${result.era.toFixed(2)} ${result.win}勝 ${result.lose}敗 ${
      result.holdPoint
    }HP ${result.save}S`;
  } else {
    return `率 .${result.ba.toFixed(3).toString().split(".")[1]} ${
      result.homerun
    }本 ${result.rbi}打点 ${result.steal}盗塁`;
  }
};

const fileToBlob = async (path: string): Promise<Blob> => {
  return new Blob([(await Deno.readFile(`./images/${path}`)).buffer]);
};

await discordeno.startBot(bot);
