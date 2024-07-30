class Phase():
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

    @classmethod
    def range(cls, a, b):
        aid = 0
        bid = 0
        while(cls._phases[aid]["name"] != a): aid += 1
        while(cls._phases[bid]["name"] != b): bid += 1
        return [_["name"] for _ in cls._phases[aid:bid+1]]



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


