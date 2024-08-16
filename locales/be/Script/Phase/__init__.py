from .abstract import (
    AbstractPhase,
    Lobby,
    Matchmaking,
    CheckedIntoTournament,
    ReadyCheck,
    ChampSelect,
    GameStart,
    FailedToLaunch,
    InProgress,
    Reconnect,
    WaitingForStats,
    PreEndOfGame,
    EndOfGame,
    TerminatedInError,
)

from .ReadyCheck import ReadyCheck
from .ChampSelect import ChampSelect
from .InProgress import InProgress

phases = [
    AbstractPhase,
    Lobby,
    Matchmaking,
    CheckedIntoTournament,
    ReadyCheck,
    ChampSelect,
    GameStart,
    FailedToLaunch,
    InProgress,
    Reconnect,
    WaitingForStats,
    PreEndOfGame,
    EndOfGame,
    TerminatedInError,
]

def get(key):
    for p in phases:
        if(isinstance(key, int)):
            if p.id == key:
                return p
        if(isinstance(key, str)):
            if p.name == key:
                return p
    return AbstractPhase
