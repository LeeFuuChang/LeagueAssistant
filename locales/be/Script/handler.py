from . import Phase

from Server.Flask import WebServer

from PyQt5.QtCore import QObject, QTimer, pyqtSignal
import logging
import time
import json
import sys


class PhaseHandler(QObject):
    timer: QTimer = None

    updateSignal = pyqtSignal()

    autoRequeueSteps = {
        Phase.get(None).name: [
            ["/riot/lcu/0/lol-lobby/v2/lobby", ["queueId", ]],
            ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", []],
        ],
        Phase.Lobby.name: [
            ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", []],
        ],
        Phase.PreEndOfGame.name: [
            ["/riot/lcu/0/riotclient/kill-and-restart-ux", []],
            ["/riot/lcu/0/lol-lobby/v2/play-again", []],
            ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", []],
        ],
        Phase.EndOfGame.name: [
            ["/riot/lcu/0/lol-lobby/v2/play-again", []],
            ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", []],
        ],
    }

    def __init__(self):
        super(self.__class__, self).__init__()

        self.currentPhase = Phase.get(None).name

        self.handlers = {cls.name:cls() for cls in Phase.phases}
        for h in self.handlers.values(): print(h.__class__)

        self.loopThread = None
        self.updateSignal.connect(self.update)


    def autoRequeue(self, client):
        if(self.currentPhase not in self.autoRequeueSteps): return

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "game", "overall", "options.json"
        ), "r", encoding="UTF-8") as f: gameOverallOptions = json.load(f)
        if(not gameOverallOptions.get("auto-requeue", False)): return

        matchesURL = "/riot/lcu/0/lol-match-history/v1/products/lol/current-summoner/matches"
        try: matchData = client.get(matchesURL, query_string={"begIndex": 0, "endIndex": 1}).get_json(force=True)
        except: matchData = {"success": False}
        if(not matchData["success"]): return
        matchData = matchData.get("response", {}).get("games", {}).get("games", [])
        if(len(matchData) < 1): return

        latestMatchGapTime = int(time.time() - matchData[0]["gameCreation"]/1000 - matchData[0]["gameDuration"])
        if(latestMatchGapTime > 5*60): return logging.info(f"[Auto Requeue] Cancelled duo to no recent match [{latestMatchGapTime}s ago]")

        responses = [client.post(url, json={k:matchData[0][k] for k in keys}) for url, keys in self.autoRequeueSteps[self.currentPhase]]

        return all([(res and (res.status_code//100) == 2) for res in responses])


    def update(self):
        with WebServer().test_client() as client:
            if(not client.get("/riot/lcu").get_json(force=True)): return

            try: phaseRequest = client.get("/riot/lcu/0/lol-gameflow/v1/gameflow-phase").get_json(force=True)
            except: phaseRequest = {"success": False}
            if(not phaseRequest["success"]): return

            phase = str(phaseRequest["response"])
            if(not isinstance(phase, str)): return

            if(phase != self.currentPhase):
                logging.info(f"[Phase Handler] Phase changed from {self.currentPhase} to {phase}")
                for handler in self.handlers.values(): handler.reset()
                self.currentPhase = phase
                self.autoRequeue(client)

            if(self.currentPhase in self.handlers): self.handlers[self.currentPhase].update()


    def run(self):
        if(self.timer is not None): return
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.updateSignal)
        self.timer.start(1000)
