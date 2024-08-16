from .PlayerWidget import SpellHelperPlayer

from Script.utils.thread import TaskThread

from Server.Flask import WebServer

from PyQt5.QtWidgets import QWidget, QDesktopWidget, QGridLayout
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QIcon

import requests as rq
import win32process
import win32gui
import logging
import time
import json
import sys
import os
import re



class SpellHelper(QWidget):
    setupCompleted:bool = False
    setupThread:TaskThread

    _size:int = 24


    def __init__(self):
        self.setContentsMargins(0, 0, 0, 0)

        self.setWindowTitle(os.environ["PROJECT_NAME"])
        self.setWindowIcon(QIcon(os.environ["ICON_PATH"]))
        self.setToolTip("按住滑鼠滾輪可以移動")
        self.setWindowFlags(Qt.Window | Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.WindowMinMaxButtonsHint)
        self.setAttribute(Qt.WA_NoSystemBackground, True)
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAutoFillBackground(True)

        self._layout = QGridLayout()
        self._layout.setSpacing(0)
        self._layout.setContentsMargins(0, 0, 0, 0)
        self.setLayout(self._layout)

        self.setFixedSize(self._layout.sizeHint())

        self.players = {}



    def __new__(cls):
        if hasattr(cls, "_instance"): return cls._instance
        
        self = super(cls, cls).__new__(cls)
        super(self.__class__, self).__init__()

        self.setupThread = TaskThread(
            target=self.setup,
            delay=0,
            tries=-1,
        ).start()

        cls.instance = self

        return cls.instance



    def mousePressEvent(self, e):
        if(e.buttons() == Qt.MiddleButton):
            self.dragStartPosition = e.globalPos()
        else: self.dragStartPosition = None
        super().mousePressEvent(e)

    def mouseReleaseEvent(self, e):
        self.dragStartPosition = None
        super().mouseReleaseEvent(e)

    def mouseMoveEvent(self, e):
        if(self.dragStartPosition):
            delta = e.globalPos() - self.dragStartPosition
            self.dragStartPosition = e.globalPos()
            sg = QDesktopWidget().screenGeometry()
            self.move(
                max(0, min(self.x()+delta.x(), sg.width()-self.width())),
                max(0, min(self.y()+delta.y(), sg.height()-self.height()))
            )
        super().mouseMoveEvent(e)



    def setup(self):
        ddragonVersion = rq.get("https://ddragon.leagueoflegends.com/api/versions.json").json()[0]

        ddragonSpells = rq.get(f"https://ddragon.leagueoflegends.com/cdn/{ddragonVersion}/data/en_US/summoner.json").json()["data"]

        cdragonSpells = rq.get(f"https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/summoner-spells.json").json()
        numId_2_Spell = {str(spell["id"]):spell for spell in cdragonSpells}

        self.spellsData = {}
        for strId in ddragonSpells:
            communityDragonAssetsURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/"
            self.spellsData[strId] = {
                "en": ddragonSpells[strId]["name"],
                "tw": numId_2_Spell[ddragonSpells[strId]["key"]]["name"],
                "icon": communityDragonAssetsURL + numId_2_Spell[ddragonSpells[strId]["key"]]["iconPath"].replace("/lol-game-data/assets/", "").lower(),
                "cooldown": ddragonSpells[strId]["cooldown"][0],
            }

        cdragonItems = rq.get("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json").json()
        self.itemsData = {i["id"]:i["description"] for i in cdragonItems}

        self.setupCompleted = True

        return True



    def setVisibility(self, boolean):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "overall", "options.json"
        ), "r", encoding="UTF-8") as f: spellOverallOptions = json.load(f)
        isVisible = boolean and spellOverallOptions.get("switch", False)

        focusPID = win32process.GetWindowThreadProcessId(win32gui.GetForegroundWindow())[1]
        if(focusPID == os.getpid() and isVisible): self.updateStyle()

        self.setVisible(isVisible)



    def addPlayer(self, playerData):
        helper = SpellHelperPlayer(self)

        spellRef = {
            "spell1": "summonerSpellOne",
            "spell2": "summonerSpellTwo",
        }

        helper.data["riotId"] = playerData["riotId"]
        helper.data["summonerName"] = playerData["summonerName"]

        helper.data["champion"]["championName"] = playerData["championName"]
        helper.data["champion"]["rawChampionName"] = playerData["rawChampionName"]
        helper.data["champion"]["imageURL"] = f"https://cdn.communitydragon.org/latest/champion/{playerData['rawChampionName'].split('_')[3]}/square"

        for ref in spellRef:
            spellData = playerData["summonerSpells"][spellRef[ref]]

            if(not re.match(r"SummonerSpell\_(\S+)\_DisplayName", spellData["rawDisplayName"])): continue
            spell = re.search(r"SummonerSpell\_(\S+)\_DisplayName", spellData["rawDisplayName"]).group(1)

            helper.data["spells"][ref]["tw"] = self.spellsData[spell]["tw"]
            helper.data["spells"][ref]["en"] = self.spellsData[spell]["en"]
            helper.data["spells"][ref]["imageURL"] = self.spellsData[spell]["icon"]
            helper.data["spells"][ref]["fullCooldown"] = self.spellsData[spell]["cooldown"]
            helper.data["spells"][ref]["displayName"] = spellData["displayName"]
            helper.data["spells"][ref]["rawDisplayName"] = spellData["rawDisplayName"]

        helper.updatePixmap()

        self.players[playerData["summonerName"]] = helper



    def updateStyle(self):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "appearance", "spell", "overall", "options.json"
        ), "r", encoding="UTF-8") as f: overallOptions = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "appearance", "spell", "overall", "notify-color.json"
        ), "r", encoding="UTF-8") as f: overallNotify = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "appearance", "spell", "overall", "counter-color.json"
        ), "r", encoding="UTF-8") as f: overallCounter = json.load(f)

        format = sorted([
            "format-u",
            "format-d",
            "format-l",
            "format-r"
        ], key=lambda k:overallOptions.get(k,0))[-1]

        for playerWidget in self.players.values():
            self._layout.removeWidget(playerWidget)
            self._layout.addWidget(
                playerWidget,
                playerWidget.data["index"] * (format in {"format-l","format-r"}),
                playerWidget.data["index"] * (format in {"format-u","format-d"}),
                Qt.AlignCenter,
            )

            playerWidget.updateLayout(format)

            playerWidget.updateSize(self._size * (overallOptions.get("scale", 10)/10))

            playerWidget.updateNotifyStyle(overallNotify)
            playerWidget.updateCounterStyle(overallCounter)



    def update(self, localTeam, gameStats):
        if(not self.setupCompleted): return logging.error("[SpellHelper] Setup Incomplete")

        self.localTeam = localTeam
        if(gameStats):
            self.gameStartTime = time.time() - gameStats["gameTime"]
        else:
            self.gameStartTime = 0

        with WebServer().test_client() as client:
            playerList = []
            try: playerListRequest = client.get("/riot/ingame/playerlist").get_json(force=True)
            except: playerListRequest = {"success": False}
            if(playerListRequest["success"]): playerList = playerListRequest["response"]
            playerListNames = {player["summonerName"] for player in playerList}

        for name in self.players:
            if(name in playerListNames): continue
            self._layout.removeWidget(self.players[name])
            self.players[name].deleteLater()
            del self.players[name]

        for idx, playerData in enumerate(playerList):
            if(playerData["team"] == self.localTeam): continue
            if(playerData["summonerName"] not in self.players): self.addPlayer(playerData)
            self.players[playerData["summonerName"]].data["index"] = idx
            self.players[playerData["summonerName"]].update(playerData)

        self.setFixedSize(self._layout.sizeHint())
