from .abstract import AbstractPhase

from .utils.thread import TaskThread

import logging



class ReadyCheck(AbstractPhase):
    autoAccepted = False
    autoAcceptThread = None

    def reset(self):
        super().reset()

        self.autoAccepted = False
        self.autoAcceptThread = None



    def endAutoAccept(self):
        if(self.autoAcceptThread is not None):
            self.autoAcceptThread.event.set()
        self.autoAccepted = True

    def isAutoAccepting(self):
        return (self.autoAcceptThread is not None and not self.autoAccepted)

    def postAutoAccept(self):
        logging.info(f"[{self.__class__.__name__}] Posting AutoAccept")
        with self.parent.server.test_client() as client:
            response = client.post("/riot/lcu/0/lol-matchmaking/v1/ready-check/accept")
            if(not response): return False
            return (response.status_code//100) == 2



    def update(self):
        with self.parent.server.test_client() as client:
            try: gameOverallOptions = client.get(f"/app/config/settings/game/overall/options.json").get_json(force=True)
            except: gameOverallOptions = {}
            if(gameOverallOptions and gameOverallOptions["auto-accept"] and not self.isAutoAccepting()):
                self.autoAcceptThread = TaskThread(
                    target=self.postAutoAccept,
                    delay=1,
                    tries=30,
                    onFinished=self.endAutoAccept
                ).start()


