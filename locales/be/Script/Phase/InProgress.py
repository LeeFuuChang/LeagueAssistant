from .utils.SpellHelper import SpellHelperUI
from .utils.Collector import StatsDataCollector
from .utils.thread import TaskThread
from .utils import Chat

from .abstract import InProgress

from flask import current_app
import win32api
import logging
import json
import sys



class InProgress(InProgress):
    InGameSpellHelperUI = None
    gameMode = None

    sendStatsDataThread = None
    collectStatsDataThread = None

    def reset(self):
        super().reset()

        self.endInGameSpellHelper()
        self.InGameSpellHelperUI = SpellHelperUI(None, None)
        self.gameMode = None

        self.sendStatsDataThread = None
        self.collectStatsDataThread = None



    def getInProgressData(self):
        with current_app.test_client() as client:
            localName = None
            try: localNameRequest = client.get("/riot/ingame/activeplayername").get_json(force=True)
            except: localNameRequest = {"success": False}
            if(localNameRequest["success"]): localName = localNameRequest["response"][:localNameRequest["response"].rfind("#")]

            localTeam = None
            playerListByTeamByName = {}
            if(localName is not None):
                playerList = []
                try: playerListRequest = client.get("/riot/ingame/playerlist").get_json(force=True)
                except: playerListRequest = {"success": False}
                if(playerListRequest["success"]): playerList = playerListRequest["response"]
                for player in playerList:
                    if(player["summonerName"] == localName): localTeam = player["team"]
                    if(player["team"] not in playerListByTeamByName):
                        playerListByTeamByName[player["team"]] = {}
                    playerListByTeamByName[player["team"]][player["summonerName"]] = player

            gameStats = None
            try: gameStatsRequest = client.get("/riot/ingame/gamestats").get_json(force=True)
            except: gameStatsRequest = {"success": False}
            if(gameStatsRequest["success"]): gameStats = gameStatsRequest["response"]
        return localTeam, playerListByTeamByName, gameStats



    def startInGameSpellHelper(self, localTeam, gameStats):
        self.InGameSpellHelperUI = SpellHelperUI(localTeam, gameStats)
        self.InGameSpellHelperUI.show()
        logging.info(f"[{self.__class__.__name__}] Starting InGameSpellHelper")

    def endInGameSpellHelper(self):
        if(self.InGameSpellHelperUI and self.InGameSpellHelperUI.isVisible()):
            self.InGameSpellHelperUI.close()
            logging.info(f"[{self.__class__.__name__}] Closing InGameSpellHelper")

    def update_InGameSpellHelper(self, localTeam, gameStats):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "overall", "options.json"
        ), "r") as f: spellOverallOptions = json.load(f)
        if(not spellOverallOptions.get("switch", False)):
            self.endInGameSpellHelper()
        elif(self.InGameSpellHelperUI):
            if(not self.InGameSpellHelperUI.isVisible()):
                if(localTeam is None or gameStats is None): return
                self.startInGameSpellHelper(localTeam, gameStats)
            else:
                self.InGameSpellHelperUI.update()



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

    def update_SendStatsData(self, localTeam, playerListByTeamByName):
        if(self.isSendingStatsData()): return True
        enemyOf = {"ORDER":"CHAOS", "CHAOS":"ORDER"}
        fastRef = {"fast-team":localTeam, "fast-enemy":enemyOf[localTeam]}
        for fastType, fastTeam in fastRef.items():
            if(self.isSendingStatsData()): return True
            with open(sys.modules["StorageManager"].LocalStorage.path(
                "cfg", "settings", "stats", "progress-send", f"{fastType}.json"
            ), "r") as f: fastData = json.load(f)
            if(fastData.get("keybind", -1) > 0 and win32api.GetAsyncKeyState(fastData["keybind"])):
                playerNames = [n for n,p in playerListByTeamByName.get(fastTeam,{}).items() if not p["isBot"]]
                sendSelf = (not fastData.get("no-self", True))
                sendFriends = (not fastData.get("no-friend", True))
                isAlly = (fastTeam == localTeam)
                self.collectStatsDataThread = TaskThread(
                    target=StatsDataCollector.sendStatsData, 
                    delay=0, tries=10, fargs=(
                        self.sendStatsDataStrings, playerNames, 
                        sendSelf, sendFriends, True, isAlly,
                        self.__class__.__name__
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
        return True



    def update(self):
        localTeam, playerListByTeamByName, gameStats = self.getInProgressData()
        if(gameStats is None): return
        if(gameStats["gameMode"] not in ["CLASSIC", "ARAM"]): return
        if(localTeam is not None and playerListByTeamByName and not self.isSendingStatsData()):
            self.update_SendStatsData(localTeam, playerListByTeamByName)
        self.update_InGameSpellHelper(localTeam, gameStats)
