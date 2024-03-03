class Main_Part_SummonerSeasonOverview extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/summoner-season-overview/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.ReloadContent());
    }

    ReloadContent = ()=>{
        let summoner = this.data["summoner"];

        new Promise((resolve, reject)=>{
            let championSummaryRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json";
            $.get(championSummaryRequestURL, {}, (data)=>resolve(Object.fromEntries(data.reduce((d,c)=>{if(parseInt(c.id)>0){d.push([parseInt(c.id),c])}return d},[]))));
        }).then((championSummary)=>{
            $.get(`/riot/lcu/0/lol-collections/v1/inventories/${summoner["summonerId"]}/backdrop`, {}, (request)=>{
                if(!request["success"]) return;
                $(this.element).find(".player-banner .background")
                .css("background-image", `url(${window.ToCDragonPath(request["response"]["backdropImage"])})`);
            });

            $.get(`/riot/lcu/0/lol-regalia/v2/summoners/${summoner["summonerId"]}/regalia`, {}, (request)=>{
                if(!request["success"]) return;
                let borderId = (request["response"]["selectedPrestigeCrest"]?request["response"]["selectedPrestigeCrest"]:1);
                $(this.element).find(".player-banner .profile .basic .icon")
                .css("background-image", `url("https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/uikit/themed-borders/theme-${borderId}-border.png")`);
            });

            $(this.element).find(".player-banner .profile .basic .icon .xp-progress")
            .css("--progress", `${summoner["percentCompleteForNextLevel"]}%`);

            $(this.element).find(".player-banner .profile .basic .icon .xp-progress img")
            .attr("src", `https://cdn.communitydragon.org/latest/profile-icon/${summoner["profileIconId"]}`);

            $(this.element).find(".player-banner .profile .basic .icon .level span").text(summoner["summonerLevel"]);

            $(this.element).find(".player-banner .profile .basic .info .name").text(summoner["gameName"]);

            $.get(`/riot/lcu/0/lol-challenges/v1/summary-player-data/player/${summoner["puuid"]}`, {}, (request)=>{
                if(request["success"]){
                    let title = request["response"]["title"];
                    if(title){
                        $(this.element).find(".player-banner .profile .basic .info .title")
                        .attr("data-rank", title["level"].toLowerCase())
                        .text(title["challengeName"]);
                    }
    
                    let topChallenges = request["response"]["topChallenges"];
                    if(topChallenges){
                        let challengeItems = $(this.element).find(".player-stats .player-stats-inner .record .challenges .item");
                        for(let i=0; i<Math.min(3, topChallenges.length); i++){
                            let challenge = topChallenges[i];
                            let item = challengeItems.eq(i);
                            item.find(".icon").attr("src", window.ToCDragonPath(
                                challenge["levelToIconPath"][challenge["currentLevel"]]
                            ));
                            item.find(".percentile span").text(topChallenges[i]["percentile"].toFixed(1));
                            item.find(".detail .name").text(topChallenges[i]["name"]);
                            item.find(".detail .description").html(challenge["descriptionShort"]);
                            item.show(0);
                        }
                    }
                }
            });

            $.get(`/riot/lcu/0/lol-ranked/v1/ranked-stats/${summoner["puuid"]}`, {}, (request)=>{
                if(request["success"]){
                    let highestRankedEntry = request["response"]["highestRankedEntry"];
                    let item = $(this.element).find(".player-banner .profile .stats .item[data-name='highest-rank']");

                    let highestTier = (!highestRankedEntry["highestTier"]||highestRankedEntry["highestTier"]==="NONE")?"UNRANKED":highestRankedEntry["highestTier"];
                    let highestDivision = highestRankedEntry["highestDivision"];
                    item.find(".data span[data-name='tier']").text(window.Translate(highestTier));
                    if(highestTier !== "UNRANKED"){
                        item.find(".data span[data-name='division']").show(0)
                        .text(window.Translate(highestDivision, highestDivision));
                    }else item.find(".data span[data-name='division']").hide(0)
    
                    let queueMap = request["response"]["queueMap"];
                    let bannerRanks = $(this.element).find(".player-banner .profile .ranks");
                    let loadBannerRank = (queueData, queueName)=>{
                        let tier = (!queueData["tier"]||queueData["tier"]==="NONE")?"UNRANKED":queueData["tier"];
                        let division = queueData["division"];
                        bannerRanks.find(`.item[data-name=${queueName}] .icon`).attr("src", `
                            https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${
                        tier.toLowerCase()}.png`);
                        bannerRanks.find(`.item[data-name=${queueName}] .data span[data-name="tier"]`).text(window.Translate(tier));
                        if(tier !== "UNRANKED"){
                            bannerRanks.find(`.item[data-name=${queueName}] .data span[data-name="division"]`).show(0)
                            .text(window.Translate(division, division));
                        }else bannerRanks.find(`.item[data-name=${queueName}] .data span[data-name="division"]`).hide(0)
                    };
                    loadBannerRank(queueMap["RANKED_SOLO_5x5"], "rank5solo");
                    loadBannerRank(queueMap["RANKED_FLEX_SR"], "rank5flex");
                }
            });

            $.get(`/riot/lcu/0/lol-champions/v1/inventories/${summoner["summonerId"]}/champions-minimal`, {}, (request)=>{
                if(!request["success"]) return;
                $(this.element).find(".player-banner .profile .stats .item[data-name='owned-champions']")
                .find(".data span").text(request["response"].filter(c=>c["ownership"]["owned"]).length);
            });

            $.get(`/riot/lcu/0/lol-champions/v1/inventories/${summoner["summonerId"]}/skins-minimal`, {}, (request)=>{
                if(!request["success"]) return;
                let item = $(this.element).find(".player-banner .profile .stats .item[data-name='owned-skins']");
                item.find(".data span").text(request["response"].filter(c=>(!c["isBase"]&&c["ownership"]["owned"])).length);
            });

            $.get(`/riot/lcu/0/lol-collections/v1/inventories/${summoner["summonerId"]}/champion-mastery/top?limit=3`, {}, (request)=>{
                if(!request["success"]) return;
                let masteries = request["response"]["masteries"].filter(c=>(c["championLevel"]>=5));
                let masteryItems = $(this.element).find(".player-stats .player-stats-inner .record .masteries .item");
                for(let i=0; i<Math.min(3, masteries.length); i++){
                    masteryItems.eq(i).find(".banner")
                    .attr("src", `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-profiles/global/default/images/mastery_level${
                        masteries[i]["championLevel"]
                    }banner.png`);
                    masteryItems.eq(i).find(".icon .champion")
                    .attr("src", `https://cdn.communitydragon.org/latest/champion/${masteries[i]["championId"]}/square`);
                    masteryItems.eq(i).find(".mastery")
                    .attr("src", `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-profiles/global/default/images/mastery_level${
                        masteries[i]["championLevel"]
                    }.png`);
                    masteryItems.eq(i).find(".detail .name").text(championSummary[masteries[i]["championId"]]["name"]);
                    masteryItems.eq(i).find(".detail .data").text(masteries[i]["formattedChampionPoints"]);
                    masteryItems.eq(i).show(0);
                }
            });

            $.get("/riot/lcu/0/lol-replays/v1/configuration", {}, (configurationRequest)=>{
                let currentGameVersion = configurationRequest["response"]["gameVersion"].split(".").splice(0,2).join(".");
                let displaySummaries = (seasonMatchesSummaries)=>{
                    let totalGamesCount = seasonMatchesSummaries["totalGamesCount"];

                    $(this.element)
                    .find(".player-banner .profile .stats .item[data-name='total-games'] .data span")
                    .text(totalGamesCount);

                    let recentChampions = seasonMatchesSummaries["recentChampions"];
                    let statsSummary = seasonMatchesSummaries["statsSummary"];
                    let queueSummary = seasonMatchesSummaries["queueSummary"];
                    let positionSummary = seasonMatchesSummaries["positionSummary"];

                    let statsCareer = $(this.element).find(".player-stats .player-stats-inner .career");
                    let statsSummaryKDA = AppAlgo.calculateKDA(statsSummary["kills"], statsSummary["deaths"], statsSummary["assists"]);
                    let statsSummaryRanking = 9;
                    if     (statsSummaryKDA >= 8.5){statsSummaryRanking = 0}
                    else if(statsSummaryKDA >= 7.0){statsSummaryRanking = 1}
                    else if(statsSummaryKDA >= 5.5){statsSummaryRanking = 2}
                    else if(statsSummaryKDA >= 4.5){statsSummaryRanking = 3}
                    else if(statsSummaryKDA >= 3.5){statsSummaryRanking = 4}
                    else if(statsSummaryKDA >= 2.5){statsSummaryRanking = 5}
                    else if(statsSummaryKDA >= 1.5){statsSummaryRanking = 6}
                    else if(statsSummaryKDA >= 1.0){statsSummaryRanking = 7}
                    else if(statsSummaryKDA >= 0.5){statsSummaryRanking = 8}
                    else if(statsSummaryKDA >=   0){statsSummaryRanking = 9}
                    statsCareer.find(".item[data-name='kda']")
                    .attr("data-rank", RANK_TIERS[statsSummaryRanking].toLowerCase())
                    .find(".data span").text(statsSummaryKDA.toFixed(1));
                    let loadStatsSummary = (queueData, queueName)=>{
                        let Ws = queueData["wins"];
                        let Ls = queueData["losses"];
                        let queueWR = AppAlgo.calculateWR(Ws, Ls);
                        let ranking = Math.round(queueWR * 9 / 100);
                        statsCareer.find(`.item[data-name="${queueName}"]`).attr("data-rank", RANK_TIERS[8-ranking].toLowerCase());
                        statsCareer.find(`.item[data-name="${queueName}"]`).find(".data span").text(queueWR.toFixed(1));
                        statsCareer.find(`.item[data-name="${queueName}"]`).find(".detail span").text(Ws+Ls);
                    };
                    loadStatsSummary({
                        "losses":(queueSummary[430]["losses"]+queueSummary[400]["losses"]),
                        "wins":  (queueSummary[430]["wins"]  +queueSummary[400]["wins"]  )
                    }, "classic");
                    loadStatsSummary(queueSummary[450], "aram");
                    loadStatsSummary(queueSummary[420], "rank5solo");
                    loadStatsSummary(queueSummary[440], "rank5flex");

                    for(let position of Object.keys(positionSummary)){
                        let positionItem = $(this.element).find(`.player-stats .player-stats-inner .recent .positions .item[data-name="${position}"]`);
                        positionItem.find(".pr span").text(AppAlgo.calculateWR(positionSummary[position], totalGamesCount-positionSummary[position]).toFixed(1));
                        positionItem.find(".data span").text(positionSummary[position]);
                    }

                    let recentChamps = Object.values(recentChampions).sort((a, b)=>(a["firstSeen"]-b["firstSeen"]));
                    let recentChampionsContainer = $(this.element)
                    .find(".player-stats .player-stats-inner .recent .champions .container");
                    for(let i=0; i<Math.min(recentChamps.length, 3); i++){
                        let recentChampionsItem = recentChampionsContainer.find(".item").eq(i);
                        let championId = recentChamps[i]["championId"];
                        let championKDA = AppAlgo.calculateKDA(recentChamps[i]["kills"], recentChamps[i]["deaths"], recentChamps[i]["assists"]);
                        recentChampionsItem.find(".icon")
                        .attr("src", `https://cdn.communitydragon.org/latest/champion/${championId}/square`);
                        recentChampionsItem.find(".detail .name").text(championSummary[championId]["name"]);
                        recentChampionsItem.find(".detail .data span").text(championKDA.toFixed(1));
                        recentChampionsItem.show(0);
                    }
                };
                let fetchMatchHistory = (summaries, begIndex, stepIndex)=>{
                    return new Promise((resolve, reject)=>{
                        if(begIndex >= 10000) return resolve(summaries);
                        let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${summoner["puuid"]}/matches`;
                        $.get(requestURL, {"begIndex": begIndex, "endIndex": begIndex+stepIndex-1}, (request)=>{
                            console.log(request["success"])
                            if(request["success"]){
                                let games = request["response"]["games"]["games"];
                                let continueLooking = games.length>0;
                                for(let i=0; (i<games.length && continueLooking); i++){
                                    continueLooking = (games[i]["gameVersion"].split(".").splice(0, 2).join(".") == currentGameVersion);
                                    if(continueLooking){
                                        summaries["totalGamesCount"]++;
                                        let lane = games[i]["participants"][0]["timeline"]["lane"];
                                        let role = games[i]["participants"][0]["timeline"]["role"];
                                        if(summaries["positionSummary"][lane] === undefined){
                                            if(role === "DUO_SUPPORT"){
                                                summaries["positionSummary"]["SUPPORT"] += 1;
                                            }else if(role === "DUO_CARRY"){
                                                summaries["positionSummary"]["ADC"] += 1;
                                            }else if(lane === "BOTTOM"){
                                                summaries["positionSummary"]["ADC"] += 1;
                                            }else{
                                                summaries["positionSummary"]["SUPPORT"] += 1;
                                            }
                                        }else summaries["positionSummary"][lane] += 1;

                                        let queueId = parseInt(games[i]["queueId"]);
                                        let win = games[i]["participants"][0]["stats"]["win"];
                                        if(summaries["queueSummary"][queueId]){
                                            summaries["queueSummary"][queueId]["wins"] += win;
                                            summaries["queueSummary"][queueId]["losses"] += !win;
                                        }

                                        let championId = games[i]["participants"][0]["championId"];
                                        let kills = games[i]["participants"][0]["stats"]["kills"];
                                        let deaths = games[i]["participants"][0]["stats"]["deaths"];
                                        let assists = games[i]["participants"][0]["stats"]["assists"];
                                        summaries["statsSummary"]["kills"] += kills;
                                        summaries["statsSummary"]["deaths"] += deaths;
                                        summaries["statsSummary"]["assists"] += assists;
                                        if(summaries["recentChampions"][championId] === undefined){
                                            if(Object.keys(summaries["recentChampions"]).length < 3){
                                                summaries["recentChampions"][championId] = {
                                                    "firstSeen": begIndex+i,
                                                    "championId": championId,
                                                    "kills": kills,
                                                    "deaths": deaths,
                                                    "assists": assists,
                                                }
                                            }
                                        }else{
                                            summaries["recentChampions"][championId]["kills"] += kills;
                                            summaries["recentChampions"][championId]["deaths"] += deaths;
                                            summaries["recentChampions"][championId]["assists"] += assists;
                                        }
                                    }else break;
                                }
                                displaySummaries(summaries);
                                if(continueLooking){
                                    return resolve(fetchMatchHistory(summaries, begIndex+stepIndex, stepIndex));
                                }else return resolve(summaries);
                            }else reject();
                        });
                    });
                }
                fetchMatchHistory({
                    "totalGamesCount": 0,
                    "recentChampions": {},
                    "statsSummary": {"kills": 0, "deaths": 0, "assists": 0},
                    "queueSummary": {
                        430: {"losses": 0, "wins": 0}, // blind5
                        400: {"losses": 0, "wins": 0}, // draft5
                        420: {"losses": 0, "wins": 0}, // rank5solo
                        440: {"losses": 0, "wins": 0}, // rank5flex
                        450: {"losses": 0, "wins": 0}, // aram
                    },
                    "positionSummary": {"TOP": 0, "JUNGLE": 0, "MID": 0, "ADC": 0, "SUPPORT": 0},
                }, 0, 100).then(displaySummaries)
            });

            let actions = $(this.element).find(".player-stats .player-stats-inner .record .actions");
            actions.find(".view").on("click", function(){
                Promise.all([
                    window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                    window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
                ]).then(()=>{
                    SummonerIdentifier
                    .FromSummonerId(summoner["summonerId"])
                    .then(identifier=>window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier})));
                });
            });
            actions.find(".report").on("click", function(){
                window.LoadClasses("assets/overlay/classes.json").then(()=>{
                    window.LoadOverlay(AppOverlay_ReportSelect, window.MakeData({
                        identifier: {
                            "icon": `https://cdn.communitydragon.org/latest/profile-icon/${summoner["profileIconId"]}`,
                            "offender": summoner,
                            "payload": {puuid: summoner["puuid"], obfuscatedPuuid: ""}
                        }
                    }));
                });
            });
        });
    }
}