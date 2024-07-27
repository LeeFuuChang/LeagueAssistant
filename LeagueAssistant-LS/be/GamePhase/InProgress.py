from thread import TaskThread

from .utils.SpellHelper import SpellHelperUI
from .utils.Collector import StatsDataCollector
from .utils import Chat

from .abstract import AbstractPhase

import win32api
import logging



class InProgress(AbstractPhase):
    InGameSpellHelperUI = None
    gameMode = None

    sendStatsDataThread = None
    collectStatsDataThread = None

    def reset(self):
        super().reset()

        self.endInGameSpellHelper()
        self.InGameSpellHelperUI = SpellHelperUI(self.parent.server, None, None)
        self.gameMode = None

        self.sendStatsDataThread = None
        self.collectStatsDataThread = None



    def getInProgressData(self):
        with self.parent.server.test_client() as client:
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
        self.InGameSpellHelperUI = SpellHelperUI(self.parent.server, localTeam, gameStats)
        self.InGameSpellHelperUI.show()
        logging.info(f"[{self.__class__.__name__}] Starting InGameSpellHelper")

    def endInGameSpellHelper(self):
        if(self.InGameSpellHelperUI and self.InGameSpellHelperUI.isVisible()):
            self.InGameSpellHelperUI.close()
            logging.info(f"[{self.__class__.__name__}] Closing InGameSpellHelper")

    def update_InGameSpellHelper(self, localTeam, gameStats):
        with self.parent.server.test_client() as client:
            spellOverallOptions = None
            try: spellOverallOptions = client.get("/config/settings/spell/overall/options").get_json(force=True)
            except: spellOverallOptions = None
            if(spellOverallOptions is None): return
            if(not spellOverallOptions["switch"]):
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
            delay=0, tries=30, fargs=(dataStrings, ),
            onFinished=self.endSendStatsDataThread
        ).start()

    def update_SendStatsData(self, localTeam, playerListByTeamByName):
        if(self.isSendingStatsData()): return True
        enemyOf = {"ORDER":"CHAOS", "CHAOS":"ORDER"}
        with self.parent.server.test_client() as client:
            if(self.isSendingStatsData()): return True
            try: fastTeamData = client.get(f"/config/settings/stats/progress-send/fast-team").get_json(force=True)
            except: fastTeamData = {}
            if(fastTeamData and win32api.GetAsyncKeyState(fastTeamData["keybind"])):
                if(self.isSendingStatsData()): return True
                logging.info(f"[Phase InProgress] fastTeamData: {fastTeamData}")
                playerNames = [n for n,p in playerListByTeamByName[localTeam].items() if not p["isBot"]]
                self.collectStatsDataThread = TaskThread(
                    target=StatsDataCollector.sendStatsData, 
                    delay=0, tries=30, fargs=(
                        self.sendStatsDataStrings, playerNames, 
                        not fastTeamData["no-self"], not fastTeamData["no-friend"], True, True,
                        self.__class__.__name__
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
            if(self.isSendingStatsData()): return True
            try: fastEnemyData = client.get(f"/config/settings/stats/progress-send/fast-enemy").get_json(force=True)
            except: fastEnemyData = {}
            if(fastEnemyData and win32api.GetAsyncKeyState(fastEnemyData["keybind"])):
                if(self.isSendingStatsData()): return True
                logging.info(f"[Phase InProgress] fastEnemyData: {fastEnemyData}")
                playerNames = [n for n,p in playerListByTeamByName[enemyOf[localTeam]].items() if not p["isBot"]]
                self.collectStatsDataThread = TaskThread(
                    target=StatsDataCollector.sendStatsData, 
                    delay=0, tries=30, fargs=(
                        self.sendStatsDataStrings, playerNames, 
                        False, False, True, False,
                        self.__class__.__name__
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
        return True

    def update_SendStatsData(self, localTeam, playerListByTeamByName):
        if(self.isSendingStatsData()): return True
        enemyOf = {"ORDER":"CHAOS", "CHAOS":"ORDER"}
        fastRef = {"fast-team": localTeam, "fast-enemy": enemyOf[localTeam]}
        with self.parent.server.test_client() as client:
            for fastType, fastTeam in fastRef.items():
                if(self.isSendingStatsData()): return True
                try: fastData = client.get(f"/config/settings/stats/progress-send/{fastType}").get_json(force=True)
                except: fastData = {}
                if(not fastData): continue
                if(win32api.GetAsyncKeyState(fastData["keybind"])):
                    playerNames = [n for n,p in playerListByTeamByName.get(fastTeam,{}).items() if not p["isBot"]]
                    sendSelf = (not fastData.get("no-self", True))
                    sendFriends = (not fastData.get("no-friend", True))
                    isAlly = (fastTeam == localTeam)
                    self.collectStatsDataThread = TaskThread(
                        target=StatsDataCollector.sendStatsData, 
                        delay=0, tries=30, fargs=(
                            self.sendStatsDataStrings, playerNames, 
                            sendSelf, sendFriends, True, isAlly,
                            self.__class__.__name__
                        ), onFinished=self.endCollectStatsDataThread
                    ).start()
                    break
        return True



    def update(self):
        localTeam, playerListByTeamByName, gameStats = self.getInProgressData()
        if(gameStats is None): return
        if(gameStats["gameMode"] not in ["CLASSIC", "ARAM"]): return
        if(localTeam is not None and playerListByTeamByName and not self.isSendingStatsData()):
            self.update_SendStatsData(localTeam, playerListByTeamByName)
        self.update_InGameSpellHelper(localTeam, gameStats)