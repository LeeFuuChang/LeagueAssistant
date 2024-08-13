class AbstractPhase:
    name, id = "None", 0

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

    def update(self):
        pass



class Lobby(AbstractPhase):
    name, id = "Lobby", 1

class Matchmaking(AbstractPhase):
    name, id = "Matchmaking", 2

class CheckedIntoTournament(AbstractPhase):
    name, id = "CheckedIntoTournament", 3

class ReadyCheck(AbstractPhase):
    name, id = "ReadyCheck", 4

class ChampSelect(AbstractPhase):
    name, id = "ChampSelect", 5

class GameStart(AbstractPhase):
    name, id = "GameStart", 6

class FailedToLaunch(AbstractPhase):
    name, id = "FailedToLaunch", 7

class InProgress(AbstractPhase):
    name, id = "InProgress", 8

class Reconnect(AbstractPhase):
    name, id = "Reconnect", 9

class WaitingForStats(AbstractPhase):
    name, id = "WaitingForStats", 10

class PreEndOfGame(AbstractPhase):
    name, id = "PreEndOfGame", 11

class EndOfGame(AbstractPhase):
    name, id = "EndOfGame", 12

class TerminatedInError(AbstractPhase):
    name, id = "TerminatedInError", 13
