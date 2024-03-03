import discord
intents = discord.Intents.default()
intents.reactions = True

BOT_TOKEN = ""

ROLES_ON_REACTION = {
    1071364358854164480: {
        "🔵": 1071348984263749714,
        "🟣": 1071349081445761116,
        "🟡": 1124697440868630650,
    }
}

REPLY_ON_KEYWORD = {
    1064135225787035648: {
        ""
    }
}

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print("Login as:", client.user)

@client.event
async def on_raw_reaction_add(payload):
    if(payload.message_id in ROLES_ON_REACTION):
        guild = discord.utils.find(lambda g: g.id == payload.guild_id, client.guilds)
        if(guild):
            member = await guild.fetch_member(payload.user_id)
            if(member):
                emoji = payload.emoji.name
                if(emoji in ROLES_ON_REACTION[payload.message_id]):
                    role = discord.utils.get(guild.roles, id=ROLES_ON_REACTION[payload.message_id][emoji])
                    if(role):
                        await member.add_roles(role)
                        print(f"Gave {member.display_name} the {role.name} role.")

@client.event
async def on_raw_reaction_remove(payload):
    if(payload.message_id in ROLES_ON_REACTION):
        guild = discord.utils.find(lambda g: g.id == payload.guild_id, client.guilds)
        if(guild):
            member = await guild.fetch_member(payload.user_id)
            if(member):
                emoji = payload.emoji.name
                if(emoji in ROLES_ON_REACTION[payload.message_id]):
                    role = discord.utils.get(guild.roles, id=ROLES_ON_REACTION[payload.message_id][emoji])
                    if(role and role in member.roles):
                        await member.remove_roles(role)
                        print(f"Removed {role.name} role from {member.display_name}.")

client.run("")
