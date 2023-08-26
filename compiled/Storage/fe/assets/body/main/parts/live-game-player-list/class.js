class Main_Part_LiveGamePlayerList extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/live-game-player-list/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.ReloadContent());
    }

    FindRecentPlayed = (puuids, matches, result)=>{
        if(!puuids.length) return Promise.resolve(result);
        return new Promise((resolve, reject)=>{
            let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${puuids[0]}/matches`;
            $.get(requestURL, {"begIndex":0,"endIndex":matches-1}, (request)=>{
                if(!request["success"]) return resolve([]);
                resolve(Promise.all(request["response"]["games"]["games"].map((game)=>{
                    let gid = game["gameId"];
                    let tid = game["participants"][0]["teamId"];
                    return new Promise((res, rej)=>{
                        let teammates = [];
                        $.get(`/riot/lcu/0/lol-match-history/v1/games/${gid}`, {}, (data)=>{
                            if(!data["success"]) return res([]);
                            let participantIdRef = {};
                            for(let participant of data["response"]["participantIdentities"]){
                                participantIdRef[participant["participantId"]] = participant["player"]["puuid"];
                            }
                            for(let participant of data["response"]["participants"]){
                                if(participant["teamId"] != tid) continue;
                                if(participantIdRef[participant["participantId"]] === undefined) continue;
                                teammates.push(participantIdRef[participant["participantId"]]);
                            }
                            res(teammates);
                        });
                    });
                })));
            });
        }).then((historyTeammates)=>{
            let poped = [];
            let count = 0;
            for(count = 0; count < historyTeammates.length; count++){
                let finished = false;
                for(let idx = puuids.length-1; idx >= 0; idx--){
                    if(historyTeammates[count].includes(puuids[idx])) continue;
                    finished = (count!==0);
                    if(!finished) poped.push(puuids.splice(idx, 1)[0]);
                }
                if(finished || puuids.length<=1) break;
            }
            result.push([puuids, count]);
            return Promise.resolve(this.FindRecentPlayed(poped, matches, result));
        });
    }

    CreateInnerItem = (container, groups, isAlly)=>{
        let groupData = groups.reduce((pv, cv)=>{
            pv["html"] += `
            <div class="group" style="grid-column:${pv["count"]+1}/${pv["count"]+cv[0].length+1}">
                <div class="group-players">${`
                    <div class="player">
                        <div class="info basic hover-pointer">
                            <img class="player-icon" src="" alt="">
                            <h3 class="name text-ellipsis"></h3>
                            <img class="rank-icon" src="" alt="">
                            <div class="rank" data-rank="">
                                <span class="tier">待定</span>
                                <span class="division"></span>
                                <span class="points"></span>
                            </div>
                        </div>
                        <div class="info rank hover-pointer">
                            <div class="rank-marquee hover-pointer"></div>
                        </div>
                        <div class="info history y-scrollable"></div>
                        <div class="info actions">
                            <div class="view hover-pointer">詳細資料</div>
                            <div class="report hover-pointer">檢舉玩家</div>
                        </div>
                    </div>`.repeat(cv[0].length)
                }</div>
                <div class="group-indicator hover-detail-parent">${`
                    <h2 class="group-detail hover-detail-bottom">
                        近期同隊<span>${cv[1]}</span>場
                    </h2>`.repeat(cv[0].length>1)
                }</div>
            </div>`;
            pv["count"] += cv[0].length;
            return pv;
        }, {"html":"", "count":0});
        let html = `
        <div class="sub-player-list" data-is-ally="${+isAlly}">
            <div class="team-indicator"></div>
            <div class="team-players">${groupData["html"]}</div>
        </div>`;
        if(isAlly){
            return $(html).prependTo(container);
        }else{
            return $(html).appendTo(container);
        };
    }

    LoadPlayerGroups = (container, playerIdentifiers, isAlly)=>{
        let summonerSpellIconsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-spells.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map(s=>[parseInt(s.id), window.ToCDragonPath(s["iconPath"])]))));
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json"
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        });
        let perkStyleIconsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json"
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data["styles"].map(p=>[parseInt(p.id), window.ToCDragonPath(p["iconPath"])]))));
        });

        return Promise.all([
            summonerSpellIconsPromise,
            perkIconsPromise,
            perkStyleIconsPromise,
        ]).then(([
            summonerSpellIcons,
            perkIcons,
            perkStyleIcons,
        ])=>{
            return Promise.resolve(Object.fromEntries(playerIdentifiers.map((identifier)=>{
                return [identifier["puuid"], identifier];
            }))).then((identifierByPuuid)=>Promise.all([
                this.FindRecentPlayed(Object.keys(identifierByPuuid), 10, []),
                Promise.resolve(identifierByPuuid)
            ])).then(([recentGroups, identifierByPuuid])=>{
                let teamContainer = this.CreateInnerItem(container, recentGroups, isAlly);
                for(let groupIdx=0; groupIdx<recentGroups.length; groupIdx++){
                    let groupContainer = teamContainer.find(".group").eq(groupIdx);
                    for(let playerIdx=0; playerIdx<recentGroups[groupIdx][0].length; playerIdx++){
                        let playerPuuid = recentGroups[groupIdx][0][playerIdx];
                        let identifier = identifierByPuuid[playerPuuid];
                        let playerEle = groupContainer.find(".player").eq(playerIdx);
                        playerEle.find(".info.basic .name").text(identifier["displayName"]);
                        playerEle.find(".info.basic .player-icon").attr("src", `https://cdn.communitydragon.org/latest/${
                            identifier["championName"]?`champion/${identifier["championName"]}/square`:`profile-icon/${identifier["profileIconId"]}`
                        }`);
                        $.get(`/riot/lcu/0/lol-ranked/v1/ranked-stats/${playerPuuid}`, {}, (request)=>{
                            if(!request["success"]) return;
                            let highestRankedEntry = request["response"]["highestRankedEntry"];
                            let tier = (!highestRankedEntry["tier"]||highestRankedEntry["tier"]==="NONE")?"UNRANKED":highestRankedEntry["tier"];
                            let division = highestRankedEntry["division"];
                            let leaguePoints = highestRankedEntry["leaguePoints"];
                            playerEle.find(".info.basic .rank").attr("data-rank", tier.toLowerCase());
                            playerEle.find(".info.basic .rank .tier").text(window.Translate(tier));
                            playerEle.find(".info.basic .rank .division").text(window.Translate(division, division));
                            playerEle.find(".info.basic .rank .points").text(leaguePoints);
                            playerEle.find(".info.basic .rank-icon").attr("src", `
                                https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${
                            tier.toLowerCase()}.svg`);

                            let loadRankMarquee = ((marqueeClass, transform)=>{
                                let marqueeItems = [
                                    ["RANKED_SOLO_5x5", "單雙"],
                                    ["RANKED_FLEX_SR", "彈性"],
                                    ["RANKED_TFT", "戰棋"],
                                ].map(([key, name])=>{
                                    let entry = request["response"]["queueMap"][key]||{};
                                    let tier = (!entry["tier"]||entry["tier"]==="NONE")?"UNRANKED":entry["tier"];
                                    return `<li class="marquee-item queue">
                                        <h4 class="name">${[...name].map(s=>`<span>${s}</span>`).join("")}</h4>
                                        <div class="data" data-rank="${tier.toLowerCase()}">
                                            <span class="tier">${window.Translate(tier)}</span>
                                            <span class="division">${window.Translate(entry["division"], "-")}</span>
                                            <span class="points">${entry["leaguePoints"]||0}</span>
                                        </div>
                                    </li>`;
                                });
                                playerEle.find(".info.rank .rank-marquee").html(`
                                    <ul class="marquee-content">${marqueeItems.join("")}</ul>
                                `.repeat(2)).css("--marquee-speed", `${marqueeItems.length}s`).attr("data-index", 0).addClass(marqueeClass);
                                playerEle.find(".info.rank .rank-marquee").on("click", function(){
                                    let dataIndex = parseInt($(this).attr("data-index"))||0;
                                    let itemCount = $(this).find(".queue").length/2;
                                    $(".player .info.rank .rank-marquee").each(function(){
                                        if($(this).hasClass("no-scroll")){
                                            $(this).attr("data-index", (dataIndex+1) * ((dataIndex+1) < itemCount));
                                            if((dataIndex+1) < itemCount){
                                                let beg = "var(--marquee-progress-beg)";
                                                let end = "var(--marquee-progress-end)";
                                                let progressEquation = `${beg} + (${end} - ${beg}) * ${(dataIndex+1) / itemCount}`;
                                                $(this).find(".marquee-content").css("transform", `${transform}(calc(${progressEquation}))`);
                                            }else return $(this).removeClass("no-scroll").find(".marquee-content").css("transform", "");
                                        }else return $(this).addClass("no-scroll");
                                    });
                                });
                            });
                            loadRankMarquee("marquee-bottom-top", "translateY");
                        });
                        $.get(`/riot/lcu/0/lol-match-history/v1/products/lol/${playerPuuid}/matches`, {
                            "begIndex": 0,
                            "endIndex": 19,
                        }, (request)=>{
                            if(!request["success"]) return;
                            let historyContainer = playerEle.find(".history");
                            let games = request["response"]["games"]["games"];
                            for(let i=0; i<games.length; i++){
                                let championId = games[i]["participants"][0]["championId"];
                                let spell1Id = games[i]["participants"][0]["spell1Id"];
                                let spell2Id = games[i]["participants"][0]["spell2Id"];
                                let stats = games[i]["participants"][0]["stats"];
                                $(`<div class="match" win="${+stats["win"]}">
                                    <img class="info champion" src="https://cdn.communitydragon.org/latest/champion/${championId}/square" alt="">
                                    <div class="info spell">
                                        <img src="${summonerSpellIcons[spell1Id]}" alt="">
                                        <img src="${summonerSpellIcons[spell2Id]}" alt="">
                                    </div>
                                    <div class="info runes">
                                        <img src="${perkIcons[stats["perk0"]]}" alt="">
                                        <img src="${perkStyleIcons[stats["perkSubStyle"]]}" alt="">
                                    </div>
                                    <div class="info kda">
                                        <span>
                                            ${stats["kills"]}
                                        </span> / <span>
                                            ${stats["deaths"]}
                                        </span> / <span>
                                            ${stats["assists"]}
                                        </span>
                                    </div>
                                </div>`).appendTo(historyContainer);
                            }
                        });
                        playerEle.find(".basic").on("click", function(){
                            Promise.all([
                                window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                                window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
                            ]).then(()=>{
                                SummonerIdentifier
                                .FromSummonerId(identifier["summonerId"])
                                .then(identifier=>window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier})));
                            });
                        });
                        playerEle.find(".actions .view").on("click", function(){
                            Promise.all([
                                window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                                window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
                            ]).then(()=>{
                                SummonerIdentifier
                                .FromSummonerId(identifier["summonerId"])
                                .then(identifier=>window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier})));
                            });
                        });
                        playerEle.find(".actions .report").on("click", function(){
                            window.LoadClasses("assets/overlay/classes.json").then(()=>{
                                window.LoadOverlay(AppOverlay_ReportSelect, window.MakeData({
                                    identifier: {
                                        "icon": `https://cdn.communitydragon.org/latest/profile-icon/${identifier["profileIconId"]}`,
                                        "offender": identifier,
                                        "payload": {puuid: identifier["puuid"], obfuscatedPuuid: ""}
                                    }
                                }));
                            });
                        });
                    }
                }
                return Promise.resolve(teamContainer);
            });
        });
    }

    ReloadContent = ()=>{
        let playerListContainer = $(this.element).find(".player-list").empty();

        let collect__Local = ()=>{
            return new Promise((resolve, reject)=>{
                SummonerIdentifier.CurrentSummoner().then((identifier)=>this.LoadPlayerGroups(
                    playerListContainer, [identifier, ], true
                )).then(()=>resolve());
            });
        };
        let collect__Lobby = ()=>{
            return new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-lobby/v2/lobby/members", {}, (request)=>{
                    if(!request["success"]) return resolve();
                    let members = request["response"];
                    return Promise.all(members.map((p)=>{
                        return SummonerIdentifier.FromDisplayName(p["summonerName"]);
                    })).then((playerIdentifiers)=>this.LoadPlayerGroups(
                        playerListContainer, playerIdentifiers, true
                    )).then(()=>resolve());
                });
            });
        };
        let collect__ChampSelect = ()=>{
            return new Promise((resolve, reject)=>{
                $.get("/riot/lcu/1/chat/v5/participants/champ-select", {}, (request)=>{
                    if(!request["success"]) return resolve();
                    let participants = request["response"]["participants"];
                    let champSelectCID = participants[participants.length-1]["cid"];
                    let champSelectParticipants = participants.filter(p=>p["cid"]==champSelectCID);
                    return Promise.all(champSelectParticipants.map((p)=>{
                        return SummonerIdentifier.FromDisplayName(p["name"]);
                    })).then((playerIdentifiers)=>this.LoadPlayerGroups(
                        playerListContainer, playerIdentifiers, true
                    )).then(()=>resolve());
                });
            });
        };
        let collect__InProgress = ()=>{
            return new Promise((resolve, reject)=>{
                $.get("/riot/ingame/activeplayername", {}, (localNameReq)=>{
                    if(!localNameReq["success"]) return resolve();
                    let localName = localNameReq["response"];
                    $.get("/riot/ingame/playerlist", {}, (request)=>{
                        if(!request["success"]) return resolve();
                        let localPlayer = request["response"].filter((p)=>(p["summonerName"]===localName))[0];
                        if(!(localName && localPlayer) || localPlayer["team"] === undefined) return resolve();
                        let localTeam = request["response"].filter((p)=>(!p["isBot"] && p["team"]===localPlayer["team"]));
                        let hostileTeam = request["response"].filter((p)=>(!p["isBot"] && p["team"]!==localPlayer["team"]));
                        return Promise.all([
                            Promise.all(localTeam.map((p)=>{
                                let rawChampionName = p["rawChampionName"].toLowerCase().split("_");
                                return SummonerIdentifier.FromDisplayName(p["summonerName"])
                                .then((identifier)=>({"championName":rawChampionName[rawChampionName.length-1],...identifier}));
                            })).then((playerIdentifiers)=>this.LoadPlayerGroups(
                                playerListContainer, playerIdentifiers, true
                            )),
                            Promise.all(hostileTeam.map((p)=>{
                                let rawChampionName = p["rawChampionName"].toLowerCase().split("_");
                                return SummonerIdentifier.FromDisplayName(p["summonerName"])
                                .then((identifier)=>({"championName":rawChampionName[rawChampionName.length-1],...identifier}));
                            })).then((playerIdentifiers)=>this.LoadPlayerGroups(
                                playerListContainer, playerIdentifiers, false
                            )),
                        ]).then(()=>resolve());
                    });
                });
            });
        };
        let collect__TopPlayers = ()=>{
            return new Promise((resolve, reject)=>{
                $.get("/riot/lcu/0/lol-ranked/v1/apex-leagues/RANKED_SOLO_5x5/CHALLENGER", {}, (request)=>{
                    if(!request["success"]) return resolve();
                    let standings = request["response"]["divisions"][0]["standings"].slice(0, 5);
                    return Promise.all(standings.map((p)=>{
                        return SummonerIdentifier.FromDisplayName(p["summonerName"]);
                    })).then((playerIdentifiers)=>this.LoadPlayerGroups(
                        playerListContainer, playerIdentifiers, true
                    )).then(()=>resolve());
                });
            });
        }

        return new Promise((resolve, reject)=>{
            $.get("/riot/lcu/0/lol-gameflow/v1/gameflow-phase", {}, (request)=>{
                switch(request["success"]?request["response"]:"None"){
                    case "Lobby":
                    case "Matchmaking":
                    case "ReadyCheck":
                        collect__Lobby().then(()=>resolve());
                        break;
                    case "ChampSelect":
                        collect__ChampSelect().then(()=>resolve());
                        break;
                    case "InProgress":
                        collect__InProgress().then(()=>resolve());
                        break;
                    default:
                        collect__TopPlayers().then(()=>resolve());
                        break;
                }
            });
        });
    }
}