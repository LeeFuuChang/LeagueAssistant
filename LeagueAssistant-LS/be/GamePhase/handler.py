from .abstract import Phase

from .ReadyCheck import ReadyCheck
from .ChampSelect import ChampSelect
from .InProgress import InProgress

from PyQt5.QtCore import QObject, pyqtSignal
import logging
import time


class PhaseHandler(QObject):
    updateSignal = pyqtSignal()

    def __init__(self, server):
        super(self.__class__, self).__init__()
        self.server = server

        self.currentPhase = "None"

        self.handlingPhases = [
            ReadyCheck,
            ChampSelect,
            InProgress,
        ]

        self.handlers = {cls.__name__:cls(self) for cls in self.handlingPhases}

        self.loopThread = None
        self.updateSignal.connect(self.update)


    def autoRequeue(self, client):
        try: gameOverallOptions = client.get(f"/config/settings/game/overall/options").get_json(force=True)
        except: gameOverallOptions = {}
        if(not gameOverallOptions or not gameOverallOptions["auto-requeue"]): return

        matchData = None
        matchesURL = "/riot/lcu/0/lol-match-history/v1/products/lol/current-summoner/matches"
        try: matchData = client.get(matchesURL, query_string={"begIndex": 0, "endIndex": 1}).get_json(force=True)
        except: matchData = {"success": False}
        if(not matchData["success"]): return
        else: matchData = matchData["response"]["games"]["games"]
        if(matchData is None or len(matchData) < 1): return

        latestMatchGapTime = int(time.time() - matchData[0]["gameCreation"]/1000 - matchData[0]["gameDuration"])
        if(latestMatchGapTime > 5*60): return logging.info(f"[Auto Requeue] Cancelled duo to previous match was way too long ago [{latestMatchGapTime}s ago]")

        requests = {
            Phase._None: [
                ["/riot/lcu/0/lol-lobby/v2/lobby", {"queueId": matchData[0]["queueId"]}],
                ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", {}],
            ],
            Phase._Lobby: [
                ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", {}],
            ],
            Phase._PreEndOfGame: [
                ["/riot/lcu/0/riotclient/kill-and-restart-ux", {}],
                ["/riot/lcu/0/lol-lobby/v2/play-again", {}],
                ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", {}],
            ],
            Phase._EndOfGame: [
                ["/riot/lcu/0/lol-lobby/v2/play-again", {}],
                ["/riot/lcu/0/lol-lobby/v2/lobby/matchmaking/search", {}],
            ],
        }

        responses = [client.post(url, json=json) for url, json in requests.get(self.currentPhase, [])]

        return all([(res and (res.status_code//100) == 2) for res in responses])


    def update(self):
        with self.server.test_client() as client:
            phase = None
            try: phaseRequest = client.get("/riot/lcu/0/lol-gameflow/v1/gameflow-phase").get_json(force=True)
            except: phaseRequest = {"success": False}
            if(not phaseRequest["success"]): return
            else: phase = str(phaseRequest["response"])
            if(not isinstance(phase, str)): return
            if(phase != self.currentPhase):
                logging.info(f"[Phase Handler] Phase changed {self.currentPhase} to {phase}")
                for handler in self.handlers.values(): handler.reset()
            if(phase in self.handlers): self.handlers[phase].update()
            if(phase not in {self.currentPhase, *Phase.range(Phase._Matchmaking, Phase._WaitingForStats)}): self.autoRequeue(client)
            self.currentPhase = phase


