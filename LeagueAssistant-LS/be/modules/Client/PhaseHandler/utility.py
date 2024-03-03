from ..constants import RANK_TIER_DIVISION_TRANSLATION



class __Phase():
    _phases = [
        {
            "name": "None",
            "value": 0
        },
        {
            "name": "Lobby",
            "value": 1
        },
        {
            "name": "Matchmaking",
            "value": 2
        },
        {
            "name": "CheckedIntoTournament",
            "value": 3
        },
        {
            "name": "ReadyCheck",
            "value": 4
        },
        {
            "name": "ChampSelect",
            "value": 5
        },
        {
            "name": "GameStart",
            "value": 6
        },
        {
            "name": "FailedToLaunch",
            "value": 7
        },
        {
            "name": "InProgress",
            "value": 8
        },
        {
            "name": "Reconnect",
            "value": 9
        },
        {
            "name": "WaitingForStats",
            "value": 10
        },
        {
            "name": "PreEndOfGame",
            "value": 11
        },
        {
            "name": "EndOfGame",
            "value": 12
        },
        {
            "name": "TerminatedInError",
            "value": 13
        }
    ]

    _None = "None"
    _None_Id = 0

    _Lobby = "Lobby"
    _Lobby_Id = 1

    _Matchmaking = "Matchmaking"
    _Matchmaking_Id = 2

    _CheckedIntoTournament = "CheckedIntoTournament"
    _CheckedIntoTournament_Id = 3

    _ReadyCheck = "ReadyCheck"
    _ReadyCheck_Id = 4

    _ChampSelect = "ChampSelect"
    _ChampSelect_Id = 5

    _GameStart = "GameStart"
    _GameStart_Id = 6

    _FailedToLaunch = "FailedToLaunch"
    _FailedToLaunch_Id = 7

    _InProgress = "InProgress"
    _InProgress_Id = 8

    _Reconnect = "Reconnect"
    _Reconnect_Id = 9

    _WaitingForStats = "WaitingForStats"
    _WaitingForStats_Id = 10

    _PreEndOfGame = "PreEndOfGame"
    _PreEndOfGame_Id = 11

    _EndOfGame = "EndOfGame"
    _EndOfGame_Id = 12

    _TerminatedInError = "TerminatedInError"
    _TerminatedInError_Id = 13

    def range(self, a, b):
        aid = 0
        bid = 0
        while(self._phases[aid]["name"] != a): aid += 1
        while(self._phases[bid]["name"] != b): bid += 1
        return [_["name"] for _ in self._phases[aid:bid+1]]

PHASE = __Phase()


class AbstractPhase:
    def __new__(cls, parent):
        if not hasattr(cls, "_instance"):
            cls._instance = object.__new__(cls)
            cls._instance.parent = parent
            cls._instance.reset()
        return cls._instance

    def reset(self):
        for attr in dir(self):
            if(not attr.startswith("end")): continue
            if(not callable(getattr(self, attr))): continue
            getattr(self, attr)()



class StatsDataCollector:
    def __init__(self, server):
        self.server = server

    def getSendingConfig(self, currentPhase):
        with self.server.test_client() as client:
            statsOverallOptions = None
            try: statsOverallOptions = client.get("/config/settings/stats/overall/options").get_json(force=True)
            except: statsOverallOptions = None

            statsOverallQueues = None
            try: statsOverallQueues = client.get("/config/settings/stats/overall/queues").get_json(force=True)
            except: statsOverallQueues = None

            statsOverallSending = None
            try: statsOverallSending = client.get("/config/settings/stats/overall/sending").get_json(force=True)
            except: statsOverallSending = None

            phase = {"ChampSelect":"select", "InProgress":"progress"}[currentPhase]

            statsSendOptions = None
            try: statsSendOptions = client.get(f"/config/settings/stats/{phase}-send/options").get_json(force=True)
            except: statsSendOptions = None

            statsSendNickname = None
            try: statsSendNickname = client.get(f"/config/settings/stats/{phase}-send/nickname").get_json(force=True)
            except: statsSendNickname = None
        return statsOverallOptions, statsOverallQueues, statsOverallSending, statsSendOptions, statsSendNickname

    def getSendingStatsData(self, name):
        with self.server.test_client() as client:
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

    def collectSendingStatsData(self, name, gameCount, queueIds, ignoreEarly):
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

        sendingData = self.getSendingStatsData(name)
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
            if(ignoreEarly and game["gameDuration"] < 300): continue
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

    def constructSendingString(self, nickname, collectedData, sendingConfig, isAlly):
        if(not sendingConfig): return ""
        playerName = f"{'友方' if(isAlly)else '敵方'} {nickname}: {collectedData['name']}"

        playerCurrentHighest = ""
        if(sendingConfig["current-highest"]):
            nowRankKey = f"{collectedData['tier']}-{collectedData['division']}"
            if(nowRankKey in RANK_TIER_DIVISION_TRANSLATION):
                playerCurrentHighest = f"當前排位:{RANK_TIER_DIVISION_TRANSLATION[nowRankKey]}"
            else: playerCurrentHighest = f"當前排位:無"

        playerSeasonHighest = ""
        if(sendingConfig["season-highest"]):
            highestRankKey = f"{collectedData['highestTier']}-{collectedData['highestDivision']}"
            if(highestRankKey in RANK_TIER_DIVISION_TRANSLATION):
                playerSeasonHighest = f"本季最高:{RANK_TIER_DIVISION_TRANSLATION[highestRankKey]}"
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

    def collectSendingStrings(self, names, isAlly, currentPhase):
        queueIdReference = {
            "blind5": 430,
            "draft5": 400,
            "rank5solo": 420,
            "rank5flex": 440,
            "aram": 450
        }
        statsConfig = self.getSendingConfig(currentPhase)
        if(statsConfig is None): return None
        statsOverallOptions, statsOverallQueues, statsOverallSending, statsSendOptions, statsSendNickname = statsConfig
        sorting = [key for key, v in statsSendOptions.items() if v]
        if(not sorting): sorting = "winrate"
        else: sorting = sorting[0].split("-")[0]
        gameCount = int(statsOverallOptions["games"])
        queueIds = {queueIdReference[qid] for qid, v in statsOverallQueues.items() if v}
        ignoreEarly = statsOverallSending["match-ignore-early"]

        collectedData = [self.collectSendingStatsData(name, gameCount, queueIds, ignoreEarly) for name in names]
        if(None in collectedData): return None
        collectedData.sort(key=lambda p:p.get(sorting, 0), reverse=True)
        return [
            self.constructSendingString(statsSendNickname[f"player{idx+1}"], data, statsOverallSending, isAlly) 
            for idx, data in enumerate(collectedData)
        ]

    def sendStatsData(self, sendingFunction, names, sendSelf, sendFriends, sendOthers, isAlly, currentPhase):
        with self.server.test_client() as client:
            selfName = None
            try: selfData = client.get(f"/riot/lcu/0/lol-summoner/v1/current-summoner").get_json(force=True)
            except: selfData = {"success": False}
            if(not selfData["success"]): return False
            else: selfName = selfData["response"]["displayName"]
            if(selfName is None): return False

            friendNames = []
            otherNames = []
            if(sendOthers):
                friendNames = None
                try: friendData = client.get(f"/riot/lcu/0/lol-lobby/v2/lobby/members").get_json(force=True)
                except: friendData = {"success": False}
                if(not friendData["success"]): return False
                else: friendNames = [p["summonerName"] for p in friendData["response"] if p["summonerName"] != selfName]
                if(friendNames is None): return False

                otherNames = [name for name in names if(name != selfName and name not in friendNames)]

            sendingNames = set()
            if(sendSelf): sendingNames.add(selfName)
            if(sendFriends): sendingNames.update(friendNames)
            if(sendOthers): sendingNames.update(otherNames)

            statsStrings = self.collectSendingStrings(sendingNames, isAlly, currentPhase)
            if(None in statsStrings): return False

            sendingFunction(statsStrings)
        return True



