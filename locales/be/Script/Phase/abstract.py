class AbstractPhase:
    name, id = "None", 0

    def __new__(cls):
        if not hasattr(cls, "_instance"):
            cls._instance = object.__new__(cls)
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
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class Matchmaking(AbstractPhase):
    name, id = "Matchmaking", 2
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class CheckedIntoTournament(AbstractPhase):
    name, id = "CheckedIntoTournament", 3
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class ReadyCheck(AbstractPhase):
    name, id = "ReadyCheck", 4
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class ChampSelect(AbstractPhase):
    name, id = "ChampSelect", 5
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class GameStart(AbstractPhase):
    name, id = "GameStart", 6
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class FailedToLaunch(AbstractPhase):
    name, id = "FailedToLaunch", 7
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class InProgress(AbstractPhase):
    name, id = "InProgress", 8
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class Reconnect(AbstractPhase):
    name, id = "Reconnect", 9
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class WaitingForStats(AbstractPhase):
    name, id = "WaitingForStats", 10
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class PreEndOfGame(AbstractPhase):
    name, id = "PreEndOfGame", 11
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class EndOfGame(AbstractPhase):
    name, id = "EndOfGame", 12
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)

class TerminatedInError(AbstractPhase):
    name, id = "TerminatedInError", 13
    def __new__(cls):
        return super(cls.__class__, cls).__new__(cls)
