from .abstract import InProgress

from Script.utils.Collector import StatsDataCollector
from Script.utils.thread import TaskThread
from Script.utils import Chat

from Server.Flask import WebServer

# from Script.SpellHelper import SpellHelper
from Script.utils.SpellHelper import SpellHelperUI as SpellHelper

import win32api
import json
import sys



ENEMY_OF = {"ORDER":"CHAOS", "CHAOS":"ORDER"}



class InProgress(InProgress):
    InGameSpellHelper = None
    gameMode = None

    sendStatsDataThread = None
    collectStatsDataThread = None



    def reset(self):
        super(self.__class__, self).reset()

        self.InGameSpellHelper = SpellHelper()
        self.InGameSpellHelper.setVisibility(False)
        self.gameMode = None

        self.sendStatsDataThread = None
        self.collectStatsDataThread = None



    def getInProgressData(self):
        with WebServer().test_client() as client:
            localName = None
            try: localNameRequest = client.get("/riot/ingame/activeplayername").get_json(force=True)
            except: localNameRequest = {"success": False}
            if(localNameRequest["success"]): localName = localNameRequest["response"]

            localTeam = None
            playerListByTeam = {}
            if(localName is not None):
                playerList = []
                try: playerListRequest = client.get("/riot/ingame/playerlist").get_json(force=True)
                except: playerListRequest = {"success": False}
                if(playerListRequest["success"]): playerList = playerListRequest["response"]
                for player in playerList:
                    if(player["summonerName"] == localName): localTeam = player["team"]
                    if(player["team"] not in playerListByTeam):
                        playerListByTeam[player["team"]] = []
                    playerListByTeam[player["team"]].append(player)

            gameStats = None
            try: gameStatsRequest = client.get("/riot/ingame/gamestats").get_json(force=True)
            except: gameStatsRequest = {"success": False}
            if(gameStatsRequest["success"]): gameStats = gameStatsRequest["response"]

        return localTeam, playerListByTeam, gameStats



    def update_InGameSpellHelper(self, localTeam, gameStats):
        if(not self.InGameSpellHelper.isVisible()):
            self.InGameSpellHelper.setVisibility(True)
        else:
            self.InGameSpellHelper.update(localTeam, gameStats)



    def endSendStatsDataThread(self):
        if(self.sendStatsDataThread is not None):
            self.sendStatsDataThread.event.set()
        self.sendStatsDataThread = None

    def endCollectStatsDataThread(self):
        if(self.collectStatsDataThread is not None):
            self.collectStatsDataThread.event.set()
        self.collectStatsDataThread = None

    def isSendingStatsData(self):
        if(self.sendStatsDataThread is not None): return True
        if(self.collectStatsDataThread is not None): return True
        return False

    def sendStatsDataStrings(self, dataStrings):
        if(self.sendStatsDataThread is not None): self.sendStatsDataThread.event.set()
        self.sendStatsDataThread = TaskThread(
            target=Chat.sendInProgress,
            delay=0, tries=10, fargs=(dataStrings, ),
            onFinished=self.endSendStatsDataThread
        ).start()

    def update_SendStatsData(self, localTeam, playerListByTeam):
        if(self.isSendingStatsData()): return True
        fastRef = {"fast-team":localTeam, "fast-enemy":ENEMY_OF.get(localTeam, "")}
        for fastType, fastTeam in fastRef.items():
            if(self.isSendingStatsData()): return True
            with open(sys.modules["StorageManager"].LocalStorage.path(
                "cfg", "settings", "stats", "progress-send", f"{fastType}.json"
            ), "r", encoding="UTF-8") as f: fastData = json.load(f)
            if(fastData.get("keybind", -1) > 0 and win32api.GetAsyncKeyState(fastData["keybind"])):
                playerNames = [p["summonerName"] for p in playerListByTeam.get(fastTeam, []) if not p["isBot"]]
                if(not playerNames): return True
                sendSelf = (not fastData.get("no-self", True))
                sendFriends = (not fastData.get("no-friend", True))
                isAlly = (fastTeam == localTeam)
                self.collectStatsDataThread = TaskThread(
                    target=StatsDataCollector.sendStatsDataByNames,
                    delay=0, tries=10, fargs=(
                        self.sendStatsDataStrings, playerNames, 
                        sendSelf, sendFriends, True, isAlly,
                        self.__class__.name
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
        return True



    def update(self):
        localTeam, playerListByTeam, gameStats = self.getInProgressData()
        if(gameStats is None or gameStats["gameMode"] not in ["CLASSIC", "ARAM"]): return
        if(localTeam is not None and playerListByTeam and not self.isSendingStatsData()):
            self.update_SendStatsData(localTeam, playerListByTeam)
        if(playerListByTeam.get(ENEMY_OF.get(localTeam, ""), [])):
            self.update_InGameSpellHelper(localTeam, gameStats)
