from ...thread import TaskThread, SteppedTaskThread, TimedTaskThread

from ..utility import sendPublicity, sendChampSelectChat

from .utility import AbstractPhase, StatsDataCollector

import win32api, logging
logger = logging.getLogger()



class ChampSelect(AbstractPhase):
    autoPublicityCompleted = False
    autoPublicityThread = None

    autoBanCompleted = False
    autoPickCompleted = False
    autoSpellCompleted = False
    autoRunesCompleted = False
    hasIncompleteBanPick = True

    sendStatsDataThread = None
    collectStatsDataThread = None

    def reset(self):
        super().reset()
        self.autoPublicityCompleted = False
        self.autoPublicityThread = None

        self.autoBanCompleted = False
        self.autoPickCompleted = False
        self.autoSpellCompleted = False
        self.autoRunesCompleted = False
        self.hasIncompleteBanPick = True

        self.sendStatsDataThread = None
        self.collectStatsDataThread = None



    def getChampSelectData(self):
        with self.parent.server.test_client() as client:
            participants = []
            champSelectCID = None
            try: chatParticipantsRequest = client.get("/riot/lcu/1/chat/v5/participants/champ-select").get_json(force=True)
            except: chatParticipantsRequest = {"success": False}
            if(chatParticipantsRequest["success"]): participants = chatParticipantsRequest["response"]["participants"]
            if(participants): champSelectCID = participants[-1]["cid"]

            champSelectParticipants = []
            if(champSelectCID is not None):
                champSelectParticipants = [p for p in participants if p["cid"] == champSelectCID]

            champSelectSession = None
            try: champSelectSessionRequest = client.get("/riot/lcu/0/lol-champ-select/v1/session").get_json(force=True)
            except: champSelectSessionRequest = {"success": False}
            if(champSelectSessionRequest["success"]): champSelectSession = champSelectSessionRequest["response"]
        return champSelectCID, champSelectParticipants, champSelectSession



    def endAutoPublicity(self):
        self.autoPublicityCompleted = True
        if(self.autoPublicityThread is not None):
            self.autoPublicityThread.event.set()
        self.autoPublicityThread = None

    def update_AutoPublicity(self, champSelectCID):
        if(self.autoPublicityCompleted or self.autoPublicityThread is not None): return True
        with self.parent.server.test_client() as client:
            try: appOptions = client.get("/app/config/options").get_json(force=True)
            except: return False
            if(not appOptions.get("allow-publicity", False)): return True
            self.autoPublicityThread = TaskThread(
                target=sendPublicity,
                delay=1,
                tries=10,
                fargs=(self.parent.server, champSelectCID),
                onFinished=self.endAutoPublicity,
            ).start()
        return True



    def getAssignedPosition(self, session):
        for player in session["myTeam"]:
            if(player["cellId"] != session["localPlayerCellId"]): continue
            return player["assignedPosition"] if(player["assignedPosition"])else "none"



    def endAutoBanPick(self):
        self.autoBanCompleted = True
        self.autoPickCompleted = True
        self.autoSpellCompleted = True
        self.autoRunesCompleted = True
        self.hasIncompleteBanPick = False

    def getAutoBanData(self, shortenedPosition):
        print(shortenedPosition)
        banningData = {"enabled":False, "champions":{}}
        with self.parent.server.test_client() as client:
            try: autoBanCfg = client.get(f"/config/settings/game/auto-ban/{shortenedPosition}").get_json(force=True)
            except: autoBanCfg = {}
            if(not autoBanCfg): return False
            filterFunc = (lambda i:(autoBanCfg.get("switch", False) and autoBanCfg.get(f"{chr(i)}-c", -1)>0))
            autoBanningChars = [chr(i) for i in range(ord("a"), ord("z")+1) if filterFunc(i)]
            banningData["enabled"] = (len(autoBanningChars) > 0)
            if(banningData["enabled"]):
                banningData["champions"] = {autoBanCfg[f"{c}-c"]:{
                    "available": True,
                    "index": ord(c),
                    "lock": autoBanCfg["lock"],
                    "c": autoBanCfg[f"{c}-c"],
                } for c in autoBanningChars}
        self.autoBanCompleted = (self.autoBanCompleted or not banningData["enabled"])
        return banningData

    def getAutoPickData(self, shortenedPosition):
        pickingData = {"enabled":False, "champions":{}}
        with self.parent.server.test_client() as client:
            try: autoPickCfg = client.get(f"/config/settings/game/auto-pick/{shortenedPosition}").get_json(force=True)
            except: autoPickCfg = {}
            if(not autoPickCfg): return False
            filterFunc = (lambda i:(autoPickCfg.get(f"{chr(i)}-switch", False) and autoPickCfg.get(f"{chr(i)}-c", -1)>0))
            autoPickingChars = [chr(i) for i in range(ord("a"), ord("z")+1) if filterFunc(i)]
            pickingData["enabled"] = (len(autoPickingChars) > 0)
            if(pickingData["enabled"]):
                pickingData["champions"] = {autoPickCfg[f"{c}-c"]:{
                    "available": True,
                    "index": ord(c),
                    "lock": autoPickCfg[f"{c}-lock"],
                    "c": autoPickCfg[f"{c}-c"],
                    "d": autoPickCfg[f"{c}-d"],
                    "f": autoPickCfg[f"{c}-f"],
                    "r": {
                        "switch": autoPickCfg[f"{c}-rune-switch"],
                        "primaryStyleId": autoPickCfg[f"{c}-rune-0-0"],
                        "subStyleId": autoPickCfg[f"{c}-rune-1-0"],
                        "selectedPerkIds": [
                            autoPickCfg[f"{c}-rune-{a}-{b}"] 
                            for a in range(0, 10) 
                            for b in range(1, 10)
                            if(f"{c}-rune-{a}-{b}" in autoPickCfg)
                        ],
                    },
                } for c in autoPickingChars}
        self.autoPickCompleted = (self.autoPickCompleted or not pickingData["enabled"])
        return pickingData

    def update_AutoSpell(self, pickedChampionData):
        payload = {}
        if(pickedChampionData.get("d",-1) > 0): payload["spell1Id"] = pickedChampionData["d"]
        if(pickedChampionData.get("f",-1) > 0): payload["spell2Id"] = pickedChampionData["f"]
        if(not payload): self.autoSpellCompleted = True
        if(self.autoSpellCompleted): return
        with self.parent.server.test_client() as client:
            response = client.patch("/riot/lcu/0/lol-champ-select/v1/session/my-selection", json=payload)
            self.autoSpellCompleted = (response and getattr(response, "json", {}).get("success", False))
            logger.info(f"[{self.__class__.__name__}] Auto Spell: {+self.autoSpellCompleted} {payload} {response}")

    def update_AutoRunes(self, pickedChampionData):
        autoRuneData = pickedChampionData.get("r", {})
        payload = {
            "name": "LA - 自動符文",
            "primaryStyleId": autoRuneData.get("primaryStyleId", -1),
            "subStyleId": autoRuneData.get("subStyleId", -1),
            "selectedPerkIds": autoRuneData.get("selectedPerkIds", []),
            "current": True,
        }
        if(not autoRuneData.get("switch", False) or any([(p<0) for p in 
                [payload["primaryStyleId"], payload["subStyleId"], *payload["selectedPerkIds"]
        ]])): self.autoRunesCompleted = True
        if(self.autoRunesCompleted): return
        with self.parent.server.test_client() as client:
            readyToBuildPage = False
            try: currentPageRequest = client.get("/riot/lcu/0/lol-perks/v1/currentpage").get_json(force=True)
            except: currentPageRequest = {"success": False}
            if(currentPageRequest["success"]):
                currentPageId = currentPageRequest["response"].get("id",0)
                try: deletePageRequest = client.delete(f"/riot/lcu/0/lol-perks/v1/pages/{currentPageId}").get_json(force=True)
                except: deletePageRequest = {"success": False}
                readyToBuildPage = deletePageRequest["success"]
            else: readyToBuildPage = True
            if(not readyToBuildPage): return
            response = client.post("/riot/lcu/0/lol-perks/v1/pages", json=payload)
            self.autoRunesCompleted = (response and getattr(response, "json", {}).get("success", False))
            logger.info(f"[{self.__class__.__name__}] Auto Runes: {+self.autoRunesCompleted} {payload} {response}")

    def processChampSelectActions(self, session, banningData, pickingData):
        self.hasIncompleteBanPick = False
        completedLocalActions = []
        sortedActions = sorted([
            session["actions"][i][j]
            for i in range(len(session["actions"]))
            for j in range(len(session["actions"][i]))
            if((session["actions"][i][j]["type"] == "ban" or
                session["actions"][i][j]["type"] == "pick"))
        ], key=lambda action:action["completed"], reverse=True)
        for action in sortedActions:
            if(action["type"] not in {"ban", "pick"}): continue

            if(action["completed"]):
                if(action["championId"] not in banningData["champions"]):
                    banningData["champions"][action["championId"]] = {"available": False}
                else: banningData["champions"][action["championId"]]["available"] = False
                if(action["championId"] not in pickingData["champions"]):
                    pickingData["champions"][action["championId"]] = {"available": False}
                else: pickingData["champions"][action["championId"]]["available"] = False
                if(action["actorCellId"]==session["localPlayerCellId"]): completedLocalActions.append(action)
                continue

            if(action["actorCellId"] != session["localPlayerCellId"]): continue

            self.hasIncompleteBanPick = True

            actionRequestURL = f"/riot/lcu/0/lol-champ-select/v1/session/actions/{action['id']}"

            if(action["type"] == "ban" and banningData["enabled"]):
                banningAvailable = sorted([
                    champId for champId in banningData["champions"] if banningData["champions"][champId]["available"]
                ], key=lambda champId:banningData["champions"][champId]["index"])
                if(not banningAvailable): 
                    self.autoBanCompleted = True
                    continue
                with self.parent.server.test_client() as client:
                    for champId in banningAvailable:
                        payload = {"completed":banningData["champions"][champId]["lock"], "championId":champId}
                        response = client.patch(actionRequestURL, json=payload)
                        logger.info(f"[{self.__class__.__name__}] Auto Banning: {payload} {response}")
                        self.autoBanCompleted = (response and getattr(response, "json", {}).get("success", False))
                        if(self.autoBanCompleted): break

            if(action["type"] == "pick" and pickingData["enabled"]):
                pickingAvailable = sorted([
                    champId for champId in pickingData["champions"] if pickingData["champions"][champId]["available"]
                ], key=lambda champId:pickingData["champions"][champId]["index"])
                if(not pickingAvailable): 
                    self.autoPickCompleted = True
                    continue
                with self.parent.server.test_client() as client:
                    for champId in pickingAvailable:
                        payload = {"completed":pickingData["champions"][champId]["lock"], "championId":champId}
                        response = client.patch(actionRequestURL, json=payload)
                        logger.info(f"[{self.__class__.__name__}] Auto Picking: {payload} {response}")
                        self.autoPickCompleted = (response and getattr(response, "json", {}).get("success", False))
                        if(self.autoPickCompleted): break

        if(not self.hasIncompleteBanPick):
            for action in completedLocalActions:
                if(self.autoSpellCompleted and self.autoRunesCompleted): break
                if(action["type"] == "pick"):
                    pickedChampionData = pickingData["champions"].get(action["championId"],{})
                    if(not pickedChampionData): continue
                    if(not self.autoSpellCompleted): self.update_AutoSpell(pickedChampionData)
                    if(not self.autoRunesCompleted): self.update_AutoRunes(pickedChampionData)

        return (self.autoBanCompleted and self.autoPickCompleted and self.autoSpellCompleted and self.autoRunesCompleted)

    def update_AutoBanPick(self, assignedPosition, champSelectSession):
        shortPositionReference = {
            "top": "top",
            "jungle": "jg",
            "middle": "mid",
            "bottom": "ad",
            "support": "sup",
            "utility": "sup",
        }
        self.processChampSelectActions(
            champSelectSession,
            self.getAutoBanData(shortPositionReference.get(assignedPosition, "none")),
            self.getAutoPickData(shortPositionReference.get(assignedPosition, "none")),
        )



    def endSendStatsDataThread(self):
        if(self.sendStatsDataThread is not None):
            self.sendStatsDataThread.event.set()
        self.sendStatsDataThread = None

    def endCollectStatsDataThread(self):
        if(self.collectStatsDataThread is not None):
            self.collectStatsDataThread.event.set()
        self.collectStatsDataThread = None

    def isSendingStatsData(self):
        if(self.sendStatsDataThread is not None): return True
        if(self.collectStatsDataThread is not None): return True
        return False

    def sendStatsDataStrings(self, champSelectCID, dataStrings):
        if(self.sendStatsDataThread is not None): self.sendStatsDataThread.event.set()
        self.sendStatsDataThread = SteppedTaskThread(
            targets=[(lambda cid,_s=s:sendChampSelectChat(self.parent.server, cid, _s)) for s in dataStrings],
            delay=0, tries=30, fargs=(champSelectCID, ), onFinished=self.endSendStatsDataThread
        ).start()

    def update_SendStatsData(self, champSelectCID, champSelectParticipants):
        if(self.isSendingStatsData()): return True
        with self.parent.server.test_client() as client:
            if(self.isSendingStatsData()): return True
            try: fastSelfData = client.get(f"/config/settings/stats/select-send/fast-self").get_json(force=True)
            except: fastSelfData = {}
            if(fastSelfData and win32api.GetAsyncKeyState(fastSelfData["keybind"])):
                if(self.isSendingStatsData()): return True
                logger.info(f"[{self.__class__.__name__}] Sending SelfData: {fastSelfData}")
                collector = StatsDataCollector(self.parent.server)
                self.collectStatsDataThread = TaskThread(
                    target=collector.sendStatsData, 
                    delay=0, tries=30, fargs=(
                        lambda strings: self.sendStatsDataStrings(champSelectCID, strings), 
                        [p["name"] for p in champSelectParticipants], 
                        True, False, False, True,
                        self.__class__.__name__
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
            if(self.isSendingStatsData()): return True
            try: fastTeamData = client.get(f"/config/settings/stats/select-send/fast-team").get_json(force=True)
            except: fastTeamData = {}
            if(fastTeamData and win32api.GetAsyncKeyState(fastTeamData["keybind"])):
                if(self.isSendingStatsData()): return True
                logger.info(f"[{self.__class__.__name__}] Sending TeamData: {fastTeamData}")
                collector = StatsDataCollector(self.parent.server)
                self.collectStatsDataThread = TaskThread(
                    target=collector.sendStatsData, 
                    delay=0, tries=30, fargs=(
                        lambda strings: self.sendStatsDataStrings(champSelectCID, strings), 
                        [p["name"] for p in champSelectParticipants], 
                        not fastTeamData["no-self"], not fastTeamData["no-friend"], True, True,
                        self.__class__.__name__
                    ), onFinished=self.endCollectStatsDataThread
                ).start()
                return True
        return True



    def update(self):
        champSelectCID, champSelectParticipants, champSelectSession = self.getChampSelectData()
        if(champSelectCID is not None and champSelectParticipants and not self.isSendingStatsData()):
            self.update_SendStatsData(champSelectCID, champSelectParticipants)
        if(champSelectSession is not None):
            assignedPosition = self.getAssignedPosition(champSelectSession)
            if(assignedPosition):
                if(not (self.autoBanCompleted and self.autoPickCompleted and self.autoSpellCompleted and self.autoRunesCompleted)):
                    self.update_AutoBanPick(assignedPosition, champSelectSession)
        if(champSelectCID is not None): self.update_AutoPublicity(champSelectCID)