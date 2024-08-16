from .ClickableLabel import ClickableLabel

from Script.utils.thread import TaskThread
from Script.utils import Chat

from Server.Flask import WebServer

from PyQt5.QtWidgets import QWidget, QGridLayout
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QPixmap

import requests as rq
import logging
import time
import json
import sys
import re



class SpellHelperPlayer(QWidget):
    _parent:QWidget
    _layout:QGridLayout

    _thread:TaskThread

    def __init__(self, parent:QWidget) -> None:
        super(self.__class__, self).__init__(parent)
        self.setContentsMargins(0, 0, 0, 0)

        self._parent = parent
        self._layout = QGridLayout()
        self._layout.setSpacing(0)
        self.setLayout(self._layout)

        self.data = {
            "index": 0,
            "riotId": "",
            "summonerName": "",
            "champion": {
                "championName": "",
                "rawChampionName": "",
                "label": ClickableLabel(self),
                "pixmap": QPixmap(),
                "imageURL": "",
            },
            "spells": {},
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

        # self.data["champion"]["label"].leftButtonClicked.connect(self.startBroadcastSpellCooldown)
        # self.data["champion"]["label"].rightButtonClicked.connect(lambda:[self.setSpellCastTime(k) for k in self.data["spells"]])

        # for spellKey in self.data["spells"]:
        #     self.data["spells"][spellKey]["label"].leftButtonClicked.connect(lambda:self.setSpellCastTime(spellKey))
        #     self.data["spells"][spellKey]["label"].rightButtonClicked.connect(lambda:self.resetSpellCastTime(spellKey))
        #     self.data["spells"][spellKey]["notify"].leftButtonClicked.connect(lambda:self.setSpellCastTime(spellKey))
        #     self.data["spells"][spellKey]["notify"].rightButtonClicked.connect(lambda:self.resetSpellCastTime(spellKey))
        #     self.data["spells"][spellKey]["counter"].leftButtonClicked.connect(lambda:self.setSpellCastTime(spellKey))
        #     self.data["spells"][spellKey]["counter"].rightButtonClicked.connect(lambda:self.resetSpellCastTime(spellKey))



    def updateCounterStyle(self, style:dict) -> None:
        self.data["styles"]["counter-color"] = style

    def updateNotifyStyle(self, style:dict) -> None:
        self.data["styles"]["notify-color"] = style


    def updatePixmap(self) -> None:
        self.data["champion"]["pixmap"].loadFromData(rq.get(self.data["champion"]["imageURL"]).content)
        # for spellData in self.data["spells"].values():
        #     if(not spellData["imageURL"]): continue
        #     spellData["pixmap"].loadFromData(rq.get(spellData["imageURL"]).content)


    def updateSize(self, size:int) -> None:
        self._layout.setContentsMargins(size//16, size//16, size//16, size//16)

        self.data["champion"]["label"].setFixedSize(size*2, size*2)

        for spellData in self.data["spells"].values():
            spellData["label"].setFixedSize(size, size)
            spellData["notify"].setFixedSize(size, size)
            spellData["counter"].setFixedSize(size, size)

        return self.setFixedSize(self._layout.sizeHint())


    def updateLayout(self, layoutFormat:str) -> None:
        layoutCells = {
            "format-u": [(1, 0), (0, 0), (0, 1)],
            "format-d": [(0, 0), (2, 0), (0, 1)],
            "format-l": [(0, 1), (0, 0), (1, 0)],
            "format-r": [(0, 0), (0, 2), (1, 0)],
        }
        if(layoutFormat not in layoutCells): return

        for i in reversed(range(self._layout.count())): 
            self._layout.removeWidget(self._layout.itemAt(i).widget())

        championLabelPos, spellLabelPos, spellLabelDelta = layoutCells[layoutFormat]

        self._layout.addWidget(self.data["champion"]["label"], *championLabelPos, 2, 2, Qt.AlignCenter)

        for idx, spellData in enumerate(self.data["spells"].values()):
            labelPosition = (spellLabelPos[0] + spellLabelDelta[0]*idx, spellLabelPos[1] + spellLabelDelta[1]*idx)
            self._layout.addWidget(spellData["label"], *labelPosition, 1, 1, Qt.AlignCenter)
            self._layout.addWidget(spellData["notify"], *labelPosition, 1, 1, Qt.AlignCenter)
            self._layout.addWidget(spellData["counter"], *labelPosition, 1, 1, Qt.AlignCenter)


    def updateSpell(self, playerData) -> None:
        for spellKey, spellData in playerData["summonerSpells"].items():
            regex = r"SummonerSpell\_(\S+)\_DisplayName"
            found = re.search(regex, spellData["rawDisplayName"])
            if(not found): continue
            spellId = found.group(1)

            if(spellKey not in self.data["spells"]):
                self.data["spells"][spellKey] = {
                    "hotkey": "D" if("One" in spellKey)else "F",
                    "pixmap": QPixmap(),
                    "label": ClickableLabel(self),
                    "notify": ClickableLabel(self),
                    "counter": ClickableLabel(self),
                    "imageURL": "",
                    "thread": None,
                    "tw": "",
                    "en": "",
                    "displayName": "",
                    "rawDisplayName": "",
                    "castTime": 0,
                    "cooldown": 0,
                    "fullCooldown": 0,
                }

            oldImageURL = self.data["spells"][spellKey]["imageURL"]

            self.data["spells"][spellKey]["tw"] = self._parent.spellsData[spellId]["tw"]
            self.data["spells"][spellKey]["en"] = self._parent.spellsData[spellId]["en"]
            self.data["spells"][spellKey]["imageURL"] = self._parent.spellsData[spellId]["icon"]
            self.data["spells"][spellKey]["fullCooldown"] = self._parent.spellsData[spellId]["cooldown"]
            self.data["spells"][spellKey]["displayName"] = spellData["displayName"]
            self.data["spells"][spellKey]["rawDisplayName"] = spellData["rawDisplayName"]

            if(oldImageURL != self.data["spells"][spellKey]["imageURL"]): self.updatePixmap()

            if(self.data["spells"][spellKey]["castTime"]):
                leftTime = self.data["spells"][spellKey]["cooldown"] - int(time.time() - self.data["spells"][spellKey]["castTime"])
                if(leftTime > 0):
                    self.data["spells"][spellKey]["counter"].setText(f"{leftTime}")
                else:
                    self.data["spells"][spellKey]["castTime"] = 0

            cover = bool(self.data["spells"][spellKey]["castTime"])

            self.data["spells"][spellKey]["counter"].setOpacity((self.data["styles"]["counter-color"]["a"]/10) * cover)
            self.data["spells"][spellKey]["counter"].setFontColor(self.data["styles"]["counter-color"]["c"])

            self.data["spells"][spellKey]["notify"].setOpacity((self.data["styles"]["notify-color"]["a"]/10) * cover)
            self.data["spells"][spellKey]["notify"].setBackgroundColor(self.data["styles"]["notify-color"]["c"])

            self.data["spells"][spellKey]["notify"].stackUnder(self.data["spells"][spellKey]["counter"])
            self.data["spells"][spellKey]["label"].stackUnder(self.data["spells"][spellKey]["notify"])



    def broadcastSpellCooldown(self) -> bool:
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

        if(spellSendOptions["champion-name"]): playerNick = self.data["champion"]["championName"]
        else: playerNick = spellOverallNickname[f"player{self.data['index']+1}"]

        spellParts = []
        for spellData in self.data["spells"].values():
            if(spellSendOptions["only-incooldown"] and not spellData["castTime"]): continue

            if(spellSendOptions["only-flash"] and "Flash" not in spellData["rawDisplayName"]): continue

            spellNick = spellData["hotkey"]
            if(spellSendNickname["tw"]):
                spellNick = spellData["tw"]
            elif(spellSendNickname["en"]):
                spellNick = spellData["en"]
            elif(spellSendNickname["key"]):
                spellNick = spellData["hotkey"]

            timeString = "ready"
            upLeftTime = max(spellData["cooldown"] - int(time.time() - spellData["castTime"]), 0)
            upGameTime = spellData["castTime"] - self._parent.gameStartTime + spellData["cooldown"]
            if(not upLeftTime): 
                timeString = "ready"
            elif(spellSendFormat["cooldown-s"]):
                timeString = f"{upLeftTime}s"
            elif(spellSendFormat["cooldown-m"]):
                if(not int(upLeftTime/60)): timeString = f"{int(upLeftTime%60)}s"
                else: timeString = f"{int(upLeftTime/60)}m{int(upLeftTime%60)}s"
            elif(spellSendFormat["game-time"]):
                timeString = f"{int(upGameTime/60):0>2}{int(upGameTime%60):0>2}"

            spellParts.append(f"{spellNick} {timeString}")

        res =  " | ".join(filter(lambda x:x, [playerNick, *spellParts]))*bool(spellParts)

        return not print(res)

        return Chat.sendInProgress([res, ])


    def endBroadcastSpellCooldown(self) -> None:
        if(self._thread is not None):
            self._thread.event.set()
        self._thread = None


    def startBroadcastSpellCooldown(self) -> None:
        self.endBroadcastSpellCooldown()
        self._thread = TaskThread(
            target=self.broadcastSpellCooldown,
            delay=0,
            tries=10,
            fargs=(),
            onFinished=self.endBroadcastSpellCooldown
        ).start()



    def calculateSpellCastTime(self, key) -> bool:
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

            # https://leagueoflegends.fandom.com/wiki/Haste
            self.data["spells"][key]["cooldown"] = int( self.data["spells"][key]["fullCooldown"] * ( 100 / (100+abilityHaste) ) )

            logging.info(f"[SpellHelper] recorded {key} cast time (abilityHaste: {abilityHaste:>2}) ( {self.data['champion']['championName']} )")
            return True


    def endSetSpellCastTime(self, key) -> None:
        if(self.data["spells"][key]["thread"] is not None):
            self.data["spells"][key]["thread"].event.set()
        self.data["spells"][key]["thread"] = None


    def setSpellCastTime(self, key) -> None:
        self.data["spells"][key]["castTime"] = time.time()
        self.data["spells"][key]["thread"] = TaskThread(
            target=self.calculateSpellCastTime,
            delay=0,
            tries=10,
            fargs=(key, ),
            onFinished=lambda:self.endSetSpellCastTime(key)
        ).start()


    def resetSpellCastTime(self, key) -> None:
        self.endBroadcastSpellCooldown()
        self.endSetSpellCastTime(key)
        self.data["spells"][key]["castTime"] = 0
        self.data["spells"][key]["cooldown"] = 0



    def update(self, playerData) -> None:
        self.updateSpell(playerData)
