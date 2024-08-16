from .thread import TaskThread
from . import Chat

from PyQt5.QtWidgets import QWidget, QDesktopWidget, QGridLayout, QLabel, QGraphicsOpacityEffect, QMenu, QAction
from PyQt5.QtCore import QObject, QEvent, Qt, pyqtSignal
from PyQt5.QtGui import QCursor, QPixmap, QIcon

from Server.Flask import WebServer

import requests as rq
import win32process
import win32gui
import logging
import time
import json
import sys
import os
import re



def setLeftClickable(widget):
    class Filter(QObject):
        clicked = pyqtSignal()
        def eventFilter(self, obj, event):
            if obj == widget:
                if event.type() == QEvent.MouseButtonRelease:
                    if event.button() == Qt.LeftButton:
                        if obj.rect().contains(event.pos()):
                            self.clicked.emit()
                            return True
            return False
    filter = Filter(widget)
    widget.installEventFilter(filter)
    return filter.clicked

def setRightClickable(widget):
    class Filter(QObject):
        clicked = pyqtSignal()
        def eventFilter(self, obj, event):
            if obj == widget:
                if event.type() == QEvent.MouseButtonRelease:
                    if event.button() == Qt.RightButton:
                        if obj.rect().contains(event.pos()):
                            self.clicked.emit()
                            return True
            return False
    filter = Filter(widget)
    widget.installEventFilter(filter)
    return filter.clicked



class SpellHelperPlayer(QWidget):
    def __init__(self, parent, index):
        super(self.__class__, self).__init__(parent)
        self.setContentsMargins(0, 0, 0, 0)

        self.format = None

        self._parent = parent
        self.layout = QGridLayout()
        self.setLayout(self.layout)
        self.layout.setSpacing(0)

        self.data = {
            "index": index,
            "thread": None,
            "riotId": "",
            "summonerName": "",
            "championName": "",
            "rawChampionName": "",
            "championLabel": QLabel(),
            "championPixmap": QPixmap(),
            "championImageURL": "",
            "spell1": {
                "hotkey": "D",
                "counter": {
                    "label": QLabel(),
                    "opacity": QGraphicsOpacityEffect(),
                },
                "notify": {
                    "label": QLabel(),
                    "opacity": QGraphicsOpacityEffect(),
                },
                "label": QLabel(),
                "pixmap": QPixmap(),
                "thread": None,
                "tw": "",
                "en": "",
                "displayName": "",
                "rawDisplayName": "",
                "imageURL": "",
                "castTime": 0,
                "cooldown": 0,
                "fullCooldown": 0,
            },
            "spell2": {
                "hotkey": "F",
                "counter": {
                    "label": QLabel(),
                    "opacity": QGraphicsOpacityEffect(),
                },
                "notify": {
                    "label": QLabel(),
                    "opacity": QGraphicsOpacityEffect(),
                },
                "label": QLabel(),
                "pixmap": QPixmap(),
                "thread": None,
                "tw": "",
                "en": "",
                "displayName": "",
                "rawDisplayName": "",
                "imageURL": "",
                "castTime": 0,
                "cooldown": 0,
                "fullCooldown": 0,
            },
            "styles": {
                "notify-color": {
                    "c": "#000000",
                    "a": 8
                },
                "counter-color": {
                    "c": "#ffffff",
                    "a": 10
                }
            }
        }

        self.updateSpellDisplay("spell1")
        self.updateSpellDisplay("spell2")

        self.connectSpellCallbacks("spell1")
        self.connectSpellCallbacks("spell2")

        setLeftClickable(self.data["championLabel"]).connect(self.startBroadcastSpellCooldown)

        self.data["championLabel"].setContextMenuPolicy(Qt.CustomContextMenu)
        self.data["championLabel"].customContextMenuRequested.connect(self.emptySpaceMenu)



    def emptySpaceMenu(self):
        clickPos = QCursor.pos()
        contents = [
            ["重新載入玩家", lambda:(self.reloadPixmap(), self.updateLayout(), self.updateSize()), True],
            ["重新載入圖片", lambda:(self.reloadPixmap(), self.updateSize()), True],
            ["重新載入版面", self._parent.updateLayout, True],
            ["重新計算冷卻", self.updateLayout, True],
            ["按住滾輪可以移動哦！", lambda:None, True],
        ]
        menu = QMenu()
        for text, func, state in contents:
            action = QAction(text)
            action.setEnabled(state)
            action.triggered.connect(func)
            menu.addAction(action)
        menu.exec_(clickPos)



    def reloadPixmap(self):
        if(self.data["championImageURL"]):
            self.data["championPixmap"].loadFromData(rq.get(self.data["championImageURL"]).content)
        if(self.data["spell1"]["imageURL"]):
            self.data["spell1"]["pixmap"].loadFromData(rq.get(self.data["spell1"]["imageURL"]).content)
        if(self.data["spell2"]["imageURL"]):
            self.data["spell2"]["pixmap"].loadFromData(rq.get(self.data["spell2"]["imageURL"]).content)


    def updateSize(self, size=None):
        if(size): self.size = size
        self.layout.setContentsMargins(self.size//16, self.size//16, self.size//16, self.size//16)

        self.data["championLabel"].setFixedSize(2*self.size, 2*self.size)
        self.data["championLabel"].setPixmap(self.data["championPixmap"].scaled(2*self.size, 2*self.size))

        for spell in ["spell1", "spell2"]:
            self.data[spell]["counter"]["label"].setFixedSize(self.size, self.size)
            self.data[spell]["notify"]["label"].setFixedSize(self.size, self.size)
            self.data[spell]["label"].setFixedSize(self.size, self.size)
            self.data[spell]["label"].setPixmap(self.data[spell]["pixmap"].scaled(self.size, self.size))

        self.setFixedSize(self.layout.sizeHint())


    def updateLayout(self, layoutFormat=None):
        if(not layoutFormat): layoutFormat = self._parent.format

        if(layoutFormat == "format-u"): pos = [(0, 0), (0, 1), (1, 0)]
        if(layoutFormat == "format-d"): pos = [(2, 0), (2, 1), (0, 0)]
        if(layoutFormat == "format-l"): pos = [(0, 0), (1, 0), (0, 1)]
        if(layoutFormat == "format-r"): pos = [(0, 3), (1, 3), (0, 0)]

        self.format = layoutFormat

        for idx, key in enumerate(["spell1", "spell2"]):
            self.layout.removeWidget(self.data[key]["counter"]["label"])
            self.layout.removeWidget(self.data[key]["notify"]["label"])
            self.layout.removeWidget(self.data[key]["label"])
            self.layout.addWidget(self.data[key]["counter"]["label"], *pos[idx], 1, 1, Qt.AlignCenter)
            self.layout.addWidget(self.data[key]["notify"]["label"], *pos[idx], 1, 1, Qt.AlignCenter)
            self.layout.addWidget(self.data[key]["label"], *pos[idx], 1, 1, Qt.AlignCenter)

        self.layout.removeWidget(self.data["championLabel"])
        self.layout.addWidget(self.data["championLabel"], *pos[2], 2, 2, Qt.AlignCenter)


    def calculateSpellCastTime(self, key):
        self.endBroadcastSpellCooldown()
        with WebServer().test_client() as client:
            try: playersRequest = client.get(f"/riot/ingame/playerlist").get_json(force=True)
            except: playersRequest = {"success": False}
            if(not playersRequest["success"]): return False
            playerItems = [p["items"] for p in playersRequest["response"] if p["riotId"] == self.data["riotId"]][0]

            abilityHaste = 0
            abilityHasteRegex = r"\<attention\>\s*(\d+)\s*\<\/attention\>\s*Ability\s*Haste"
            for item in playerItems:
                found = re.search(abilityHasteRegex, self._parent.itemsData.get(item["itemID"], ""))
                if found: abilityHaste += int(found.group(1))

            self.data[key]["cooldown"] = int( self.data[key]["fullCooldown"] * ( 100 / (100+abilityHaste) ) ) # https://leagueoflegends.fandom.com/wiki/Haste

            logging.info(f"[SpellHelper] recorded {key} cast time (abilityHaste: {abilityHaste:>2}) ( {self.data['championName']} )")
            return True


    def endSetSpellCastTime(self, key):
        if(self.data[key]["thread"] is not None):
            self.data[key]["thread"].event.set()
        self.data[key]["thread"] = None


    def setSpellCastTime(self, key):
        self.data[key]["castTime"] = time.time()
        self.data[key]["thread"] = TaskThread(
            target=self.calculateSpellCastTime,
            delay=0,
            tries=10,
            fargs=(key, ),
            onFinished=lambda:self.endSetSpellCastTime(key)
        ).start()


    def resetSpellCastTime(self, key):
        self.endBroadcastSpellCooldown()
        self.endSetSpellCastTime(key)
        self.data[key]["castTime"] = 0
        self.data[key]["cooldown"] = 0


    def connectSpellCallbacks(self, key):
        setLeftClickable(self.data[key]["label"]).connect(lambda:self.setSpellCastTime(key))
        setRightClickable(self.data[key]["label"]).connect(lambda:self.resetSpellCastTime(key))

        setLeftClickable(self.data[key]["counter"]["label"]).connect(lambda:self.setSpellCastTime(key))
        setRightClickable(self.data[key]["counter"]["label"]).connect(lambda:self.resetSpellCastTime(key))

        setLeftClickable(self.data[key]["notify"]["label"]).connect(lambda:self.setSpellCastTime(key))
        setRightClickable(self.data[key]["notify"]["label"]).connect(lambda:self.resetSpellCastTime(key))


    def updateSpellDisplay(self, key):
        cover = self.data[key]["castTime"]>0

        spl_L = self.data[key]["label"]
        cnt_O = self.data[key]["counter"]["opacity"]
        cnt_L = self.data[key]["counter"]["label"]
        not_O = self.data[key]["notify"]["opacity"]
        not_L = self.data[key]["notify"]["label"]

        cnt_O.setOpacity((self.data["styles"]["counter-color"]["a"]/10) * cover)
        cnt_L.setStyleSheet(f"color:{self.data['styles']['counter-color']['c']}")
        cnt_L.setGraphicsEffect(cnt_O)
        cnt_L.setAlignment(Qt.AlignCenter)

        not_O.setOpacity((self.data["styles"]["notify-color"]["a"]/10) * cover)
        not_L.setStyleSheet(f"background:{self.data['styles']['notify-color']['c']}")
        not_L.setGraphicsEffect(not_O)

        not_L.stackUnder(cnt_L)
        spl_L.stackUnder(not_L)


    def updateSpell(self, key, base):
        castTime = self.data[key]["castTime"]
        if(castTime): 
            cooldown = self.data[key]["cooldown"]
            leftTime = cooldown-int(base-castTime)
            self.data[key]["castTime"] *= (leftTime > 0)
            if(self.data[key]["castTime"]): 
                self.data[key]["counter"]["label"].setText(f"{leftTime}")
        self.updateSpellDisplay(key)


    def broadcastSpellCooldown(self):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "overall", "nickname.json"
        ), "r", encoding="UTF-8") as f: spellOverallNickname = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "send", "options.json"
        ), "r", encoding="UTF-8") as f: spellSendOptions = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "send", "format.json"
        ), "r", encoding="UTF-8") as f: spellSendFormat = json.load(f)

        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "send", "nickname.json"
        ), "r", encoding="UTF-8") as f: spellSendNickname = json.load(f)

        if(spellSendOptions["champion-name"]): playerNick = self.data["championName"]
        else: playerNick = spellOverallNickname[f"player{self.data['index']+1}"]

        def getSpellString(key):
            if(not spellSendOptions["only-incooldown"] or self.data[key]["castTime"]):
                if(not spellSendOptions["only-flash"] or "Flash" in self.data[key]["rawDisplayName"]):
                    spellNick = self.data[key]["hotkey"]
                    if(spellSendNickname["tw"]):
                        spellNick = self.data[key]["tw"]
                    elif(spellSendNickname["en"]):
                        spellNick = self.data[key]["en"]
                    elif(spellSendNickname["key"]):
                        spellNick = self.data[key]["hotkey"]

                    timeString = "ready"
                    upLeftTime = max(self.data[key]["cooldown"]-int(time.time()-self.data[key]["castTime"]), 0)
                    upGameTime = self.data[key]["castTime"]-self._parent.gameStartTime+self.data[key]["cooldown"]
                    if(not upLeftTime): 
                        timeString = "ready"
                    elif(spellSendFormat["cooldown-s"]):
                        timeString = f"{upLeftTime}s"
                    elif(spellSendFormat["cooldown-m"]):
                        if(not int(upLeftTime/60)): timeString = f"{int(upLeftTime%60)}s"
                        else: timeString = f"{int(upLeftTime/60)}m{int(upLeftTime%60)}s"
                    elif(spellSendFormat["game-time"]):
                        timeString = f"{int(upGameTime/60):0>2}{int(upGameTime%60):0>2}"

                    return f"{spellNick} {timeString}"
            return ""

        spell1str = getSpellString("spell1")
        spell2str = getSpellString("spell2")

        res =  " | ".join(filter(lambda x:x, [playerNick, spell1str, spell2str]))*bool(spell1str or spell2str)

        return Chat.sendInProgress([res, ])


    def endBroadcastSpellCooldown(self):
        if(self.data["thread"] is not None):
            self.data["thread"].event.set()
        self.data["thread"] = None


    def startBroadcastSpellCooldown(self):
        self.endBroadcastSpellCooldown()
        self.data["thread"] = TaskThread(
            target=self.broadcastSpellCooldown,
            delay=0,
            tries=10,
            fargs=(),
            onFinished=self.endBroadcastSpellCooldown
        ).start()


    def update(self):
        nowTime = time.time()
        self.updateSpell("spell1", nowTime)
        self.updateSpell("spell2", nowTime)



class SpellHelperUI(QWidget):
    setupCompleted = False

    baseSize = size = 24


    def __init__(self):
        self.setContentsMargins(0, 0, 0, 0)

        self.setWindowTitle(os.environ["PROJECT_NAME"])
        self.setWindowIcon(QIcon(os.environ["ICON_PATH"]))
        self.setWindowFlags(Qt.Window | Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint | Qt.WindowMinMaxButtonsHint)
        self.setAttribute(Qt.WA_NoSystemBackground, True)
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAutoFillBackground(True)

        self.layout.setSpacing(0)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.setFixedSize(self.layout.sizeHint())

        self.format = None

        self.players = {}
        self.gameStartTime = 0


    def __new__(cls):
        if hasattr(cls, "_instance"): return cls._instance
        cls._instance = QWidget.__new__(cls)
        self = cls._instance
        super(self.__class__, self).__init__()
        self.setWindowTitle(os.environ["PROJECT_NAME"])
        self.setWindowIcon(QIcon(os.environ["ICON_PATH"]))
        self.setToolTip("按住滑鼠滾輪可以移動")
        self.layout = QGridLayout()
        self.setLayout(self.layout)
        self.setupThread = TaskThread(
            target=self.setup,
            delay=0,
            tries=-1,
            fargs=(),
            onFinished=self.endSetup
        ).start()
        return cls._instance


    def addPlayer(self, playerData, index):
        helper = SpellHelperPlayer(self, index)

        spellRef = {
            "spell1": "summonerSpellOne",
            "spell2": "summonerSpellTwo",
        }

        helper.data["riotId"] = playerData["riotId"]
        helper.data["summonerName"] = playerData["summonerName"]
        helper.data["championName"] = playerData["championName"]
        helper.data["rawChampionName"] = playerData["rawChampionName"]
        helper.data["championImageURL"] = f"https://cdn.communitydragon.org/latest/champion/{playerData['rawChampionName'].split('_')[3]}/square"

        for ref in spellRef:
            spellData = playerData["summonerSpells"][spellRef[ref]]
            if(not re.match(r"SummonerSpell\_(\S+)\_DisplayName", spellData["rawDisplayName"])): continue

            spell = re.search(r"SummonerSpell\_(\S+)\_DisplayName", spellData["rawDisplayName"]).group(1)

            helper.data[ref]["tw"] = self.spellsData[spell]["tw"]
            helper.data[ref]["en"] = self.spellsData[spell]["en"]
            helper.data[ref]["imageURL"] = self.spellsData[spell]["icon"]
            helper.data[ref]["fullCooldown"] = self.spellsData[spell]["cooldown"]
            helper.data[ref]["displayName"] = spellData["displayName"]
            helper.data[ref]["rawDisplayName"] = spellData["rawDisplayName"]

        helper.reloadPixmap()

        self.players[playerData["summonerName"]] = helper

        self.updateLayout()


    def endSetup(self):
        self.setupCompleted = True
        if(self.setupThread is not None):
            self.setupThread.event.set()
        self.setupThread = None

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

        return True


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

        for helper in self.players.values():
            helper.data["styles"]["notify-color"] = overallNotify
            helper.data["styles"]["counter-color"] = overallCounter

        self.format = sorted(["format-u","format-d","format-l","format-r"], key=lambda k:overallOptions.get(k,0))[-1]
        self.size = (self.baseSize * (overallOptions.get("scale", 10)/10))


    def setVisibility(self, boolean):
        with open(sys.modules["StorageManager"].LocalStorage.path(
            "cfg", "settings", "spell", "overall", "options.json"
        ), "r", encoding="UTF-8") as f: spellOverallOptions = json.load(f)
        isVisible = boolean and spellOverallOptions.get("switch", False)

        focusPID = win32process.GetWindowThreadProcessId(win32gui.GetForegroundWindow())[1]
        if(focusPID == os.getpid() and isVisible): self.updateStyle()

        self.setVisible(isVisible)


    def updateLayout(self):
        self.updateStyle()
        if(any([(not helper.format or helper.format != self.format) for helper in self.players.values()])):
            for i in reversed(range(self.layout.count())):
                self.layout.itemAt(i).widget().setParent(None)
        for helper in self.players.values():
            helper.updateLayout(self.format)
            self.layout.removeWidget(helper)
            if(self.format in ["format-u","format-d"]):
                self.layout.addWidget(helper, 0, helper.data["index"], Qt.AlignCenter)
            if(self.format in ["format-l","format-r"]):
                self.layout.addWidget(helper, helper.data["index"], 0, Qt.AlignCenter)
            helper.updateSize(self.size)
        self.setFixedSize(self.layout.sizeHint())

    def update(self, localTeam, gameStats):
        if(gameStats):
            self.gameStartTime = time.time()-gameStats["gameTime"]
        else: self.gameStartTime = 0
        if(not self.setupCompleted): return logging.error("[SpellHelper] Setup Incomplete")
        with WebServer().test_client() as client:
            playerList = []
            try: playerListRequest = client.get("/riot/ingame/playerlist").get_json(force=True)
            except: playerListRequest = {"success": False}
            if(playerListRequest["success"]): playerList = playerListRequest["response"]
            playerListNames = {player["summonerName"] for player in playerList}
            for name, helper in self.players.items():
                if(name in playerListNames): continue
                self.layout.removeWidget(helper)
            for idx, player in enumerate(playerList):
                if(player["team"] == localTeam): continue
                if(player["summonerName"] in self.players):
                    if(self.players[player["summonerName"]].data["index"] == idx): continue
                    self.players[player["summonerName"]].data["index"] = idx
                else: self.addPlayer(player, idx)
        for helper in self.players.values(): helper.update()
        self.updateLayout()


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
            sg = QDesktopWidget().availableGeometry()
            self.move(
                max(0, min(self.x()+delta.x(), sg.width()-self.width())),
                max(0, min(self.y()+delta.y(), sg.height()-self.height()))
            )
        super().mouseMoveEvent(e)
