from flask import current_app
import json
import sys


class StatsDataCollector:
    RankTranslate = {
        "NONE-NA"        : "無牌位",

        "IRON-IV"        : "鐵牌 IV",
        "IRON-III"       : "鐵牌 III",
        "IRON-II"        : "鐵牌 II",
        "IRON-I"         : "鐵牌 I",

        "BRONZE-IV"      : "銅牌 IV",
        "BRONZE-III"     : "銅牌 III",
        "BRONZE-II"      : "銅牌 II",
        "BRONZE-I"       : "銅牌 I",

        "SILVER-IV"      : "銀牌 IV",
        "SILVER-III"     : "銀牌 III",
        "SILVER-II"      : "銀牌 II",
        "SILVER-I"       : "銀牌 I",

        "GOLD-IV"        : "金牌 IV",
        "GOLD-III"       : "金牌 III",
        "GOLD-II"        : "金牌 II",
        "GOLD-I"         : "金牌 I",

        "PLATINUM-IV"    : "白金 IV",
        "PLATINUM-III"   : "白金 III",
        "PLATINUM-II"    : "白金 II",
        "PLATINUM-I"     : "白金 I",

        "EMERALD-IV"    : "翡翠 IV",
        "EMERALD-III"   : "翡翠 III",
        "EMERALD-II"    : "翡翠 II",
        "EMERALD-I"     : "翡翠 I",

        "DIAMOND-IV"     : "鑽石 IV",
        "DIAMOND-III"    : "鑽石 III",
        "DIAMOND-II"     : "鑽石 II",
        "DIAMOND-I"      : "鑽石 I",

        "MASTER-IV"      : "大師",
        "MASTER-III"     : "大師",
        "MASTER-II"      : "大師",
        "MASTER-I"       : "大師",
        "MASTER-NA"      : "大師",

        "GRANDMASTER-IV" : "宗師",
        "GRANDMASTER-III": "宗師",
        "GRANDMASTER-II" : "宗師",
        "GRANDMASTER-I"  : "宗師",
        "GRANDMASTER-NA" : "宗師",

        "CHALLENGER-IV"  : "菁英",
        "CHALLENGER-III" : "菁英",
        "CHALLENGER-II"  : "菁英",
        "CHALLENGER-I"   : "菁英",
        "CHALLENGER-NA"  : "菁英"
    }


    @staticmethod
    def fetchPlayer(name):
        with current_app.test_client() as client:
            summonerData = None
            try: 
                summonerData = client.get(
                    "/riot/lcu/0/lol-summoner/v1/summoners", 
                    query_string={"name":name}
                ).get_json(force=True)
            except: summonerData = {"success": False}
            if(not summonerData["success"]): return None
            else: summonerData = summonerData["response"]
            if(summonerData is None): return None

            rankData = None
            try: 
                rankData = client.get(
                    f"/riot/lcu/0/lol-ranked/v1/ranked-stats/{summonerData['puuid']}"
                ).get_json(force=True)
            except: rankData = {"success": False}
            if(not rankData["success"]): return None
            else: rankData = rankData["response"]
            if(rankData is None): return None

            matchData = None
            try: 
                matchData = client.get(
                    f"/riot/lcu/0/lol-match-history/v1/products/lol/{summonerData['puuid']}/matches",
                    query_string={"begIndex": 0, "endIndex": 50}
                ).get_json(force=True)
            except: matchData = {"success": False}
            if(not matchData["success"]): return None
            else: matchData = matchData["response"]["games"]["games"]
            if(matchData is None): return None
        return summonerData, rankData, matchData        


    @classmethod
    def collectSendingStatsData(cls, name, gameCount, queueIds):
        collectedData = {
            "name": "",
            "games": [],
            "winrate": 0,
            "wins": 0,
            "kills": 0,
            "deaths": 0,
            "assists": 0,
            "kda": 0,
            "tier": "",
            "division": "",
            "highestTier": "",
            "highestDivision": "",
        }

        sendingData = cls.fetchPlayer(name)
        if(sendingData is None): return None
        summonerData, rankData, matchData = sendingData

        collectedData["name"] = summonerData["displayName"]
        collectedData["tier"] = rankData["highestRankedEntry"]["tier"]
        collectedData["division"] = rankData["highestRankedEntry"]["division"]
        collectedData["highestTier"] = rankData["highestRankedEntry"]["highestTier"]
        collectedData["highestDivision"] = rankData["highestRankedEntry"]["highestDivision"]
        for game in matchData:
            if(len(collectedData["games"]) >= gameCount): break
            if(game["queueId"] not in queueIds): continue
            if(game["gameDuration"] < 300): continue
            stats = game["participants"][0]["stats"]
            collectedData["wins"] += stats["win"]
            collectedData["kills"] += stats["kills"]
            collectedData["deaths"] += stats["deaths"]
            collectedData["assists"] += stats["assists"]
            collectedData["games"].append({
                "win": stats["win"],
                "kills": stats["kills"],
                "deaths": stats["deaths"],
                "assists": stats["assists"],
                "kda": round((stats["kills"]+stats["assists"])/max(stats["deaths"], 1), 1)
            })
        collectedData["winrate"] = int((collectedData["wins"]/max(len(collectedData["games"]), 1))*100)
        collectedData["kda"] = round((collectedData["kills"]+collectedData["assists"])/max(collectedData["deaths"], 1), 1)
        return collectedData


    @classmethod
    def constructSendingString(cls, nickname, collectedData, sendingConfig, isAlly):
        if(not sendingConfig): return ""
        playerName = f"{'友方' if(isAlly)else '敵方'} {nickname}: {collectedData['name']}"

        playerCurrentHighest = ""
        if(sendingConfig["current-highest"]):
            nowRankKey = f"{collectedData['tier']}-{collectedData['division']}"
            if(nowRankKey in cls.RankTranslate):
                playerCurrentHighest = f"當前排位:{cls.RankTranslate[nowRankKey]}"
            else: playerCurrentHighest = f"當前排位:無"

        playerSeasonHighest = ""
        if(sendingConfig["season-highest"]):
            highestRankKey = f"{collectedData['highestTier']}-{collectedData['highestDivision']}"
            if(highestRankKey in cls.RankTranslate):
                playerSeasonHighest = f"本季最高:{cls.RankTranslate[highestRankKey]}"
            else: playerSeasonHighest = f"本季最高:無"

        playerWinrate = ""
        if(sendingConfig["avg-winrate"] and collectedData["games"]):
            playerWinrate = f"近{len(collectedData['games'])}場勝率:{collectedData['winrate']}%"

        playerKDA = ""
        if(sendingConfig["avg-kda"] and collectedData["games"]):
            playerKDA = f"近{len(collectedData['games'])}場評分:{collectedData['kda']}"

        playerMatches = ""
        if(sendingConfig["match-win"] or sendingConfig["match-stats"] or sendingConfig["match-kda"]):
            playerMatches = f"近期對戰:"
            if(collectedData["games"]):
                for game in collectedData["games"]:
                    gameString = ""
                    if(sendingConfig["match-win"]):
                        gameString += ("勝" if(game["win"])else "敗")
                    if(sendingConfig["match-stats"]):
                        gameString += f" {game['kills']}/{game['deaths']}/{game['assists']}"
                    if(sendingConfig["match-kda"]):
                        gameString += f" ({game['kda']})"
                    playerMatches += f"【{gameString}】"
            else: playerMatches += "無"

        playerResult = [
            playerName, 
            playerCurrentHighest, 
            playerSeasonHighest, 
            playerWinrate, 
            playerKDA, 
            playerMatches
        ]
        return " | ".join(filter(lambda s:s, playerResult))


    @classmethod
    def collectSendingStrings(cls, names, isAlly, currentPhase):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "stats", "overall", "options.json"
        ), "r") as f: statsOverallOptions = json.load(f)
        gameCount = int(statsOverallOptions["games"])

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "stats", "overall", "queues.json"
        ), "r") as f: statsOverallQueues = json.load(f)
        queueIds = {int(qid) for qid, v in statsOverallQueues.items() if v}

        phase = {"ChampSelect":"select", "InProgress":"progress"}[currentPhase]

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "stats", f"{phase}-send", "options.json"
        ), "r") as f: statsSendOptions = json.load(f)
        sorting = [*[key.split("-")[0] for key, v in statsSendOptions.items() if v], "winrate"][0]

        collectedData = [cls.collectSendingStatsData(name, gameCount, queueIds) for name in names]
        collectedData = sorted(filter(lambda p:p, collectedData), key=lambda p:p.get(sorting, 0), reverse=True)
        if(len(collectedData) != len(names)): return None

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "stats", f"{phase}-send", "nickname.json"
        ), "r") as f: statsSendNickname = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "stats", "overall", "sending.json"
        ), "r") as f: statsOverallSending = json.load(f)

        return [cls.constructSendingString(
            statsSendNickname[f"player{idx+1}"], data, statsOverallSending, isAlly
        ) for idx, data in enumerate(collectedData)]


    @classmethod
    def sendStatsData(cls, sendingFunction, names, sendSelf, sendFriends, sendOthers, isAlly, currentPhase):
        with current_app.test_client() as client:
            try: selfData = client.get(f"/riot/lcu/0/lol-summoner/v1/current-summoner").get_json(force=True)
            except: return False
            if(not selfData["success"]): return False
            selfName = selfData.get("response", {}).get("displayName", None)
            if(selfName is None): return False

            friendNames = []
            othersNames = []
            if(sendOthers):
                try: friendData = client.get(f"/riot/lcu/0/lol-lobby/v2/lobby/members").get_json(force=True)
                except: return False
                if(not friendData["success"]): return False
                friendNames = [p["summonerName"] for p in friendData["response"] if p["summonerName"] != selfName]
                othersNames = [name for name in names if(name != selfName and name not in friendNames)]

            sendingNames = set()
            if(sendSelf): sendingNames.add(selfName)
            if(sendFriends): sendingNames.update(friendNames)
            if(sendOthers): sendingNames.update(othersNames)

            if(not sendingNames): return False

            statsStrings = cls.collectSendingStrings(sendingNames, isAlly, currentPhase)
            if(None in statsStrings): return False

            sendingFunction(statsStrings)
        return True
