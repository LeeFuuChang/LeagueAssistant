class Main_Part_SummonerSeasonOverview extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/summoner-season-overview/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.ReloadContent());
    }

    FetchQueuePositionSummary = (puuid, seasonId, queue, position)=>{
        let requestURL = `/riot/lcu/0/lol-career-stats/v1/summoner-stats/${puuid}/${seasonId}/${queue}/${position}`;
        return new Promise((resolve, reject)=>{
            $.get(requestURL, {}, (data)=>{
                if(data["success"]){
                    let positionSummary = data["response"]["seasonSummary"][seasonId.toString()][queue]["positionSummaries"][position]["positionSummary"]["stats"]["CareerStats.js"];
                    resolve(positionSummary);
                }else resolve({});
            });
        });
    }

    ReloadContent = ()=>{
        let summoner = this.data["summoner"];

        Promise.all([
            new Promise((resolve, reject)=>{
                $.post("/riot/lcu/0/lol-seasons/v1/allSeasons/product/LOL", JSON.stringify({"lastNYears": 2}), (response)=>{
                    let timeNow = Date.now();
                    resolve(response["response"].filter((s)=>(s["seasonStart"] <= timeNow && timeNow <= s["seasonEnd"]))[0]);
                });
            }),
            new Promise((resolve, reject)=>{
                $.get("/riot/lcu/1/riotclient/get_region_locale", {}, (regionData)=>{
                    $.get(`/opgg/lol/summoners/${regionData["response"]["region"]}/${summoner["gameName"]}-${summoner["tagLine"]}`, {}, (pageProp)=>{
                        resolve(pageProp["data"]);
                    });
                });
            }),
        ]).then(([
            currentSeason,
            opggData,
        ])=>{
            let bannerBasic = $(this.element).find(".player-banner .profile .basic");
            bannerBasic.find(".icon .xp-progress").css("--progress", `${summoner["percentCompleteForNextLevel"]}%`);
            bannerBasic.find(".icon .xp-progress img").attr("src", `https://cdn.communitydragon.org/latest/profile-icon/${summoner["profileIconId"]}`);
            bannerBasic.find(".icon .level span").text(summoner["summonerLevel"]);
            bannerBasic.find(".info .name").text(summoner["gameName"]);
            $.get(`/riot/lcu/0/lol-regalia/v2/summoners/${summoner["summonerId"]}/regalia`, {}, (request)=>{
                if(!request["success"]) return;
                let borderId = request["response"]["selectedPrestigeCrest"] ? request["response"]["selectedPrestigeCrest"] : 1;
                bannerBasic.find(".icon").css("background-image", `url(
                    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/uikit/themed-borders/theme-${borderId}-border.png"
                )`);
            });
            $.get(`/riot/lcu/0/lol-collections/v1/inventories/${summoner["summonerId"]}/backdrop`, {}, (request)=>{
                if(!request["success"]) return;
                $(this.element).find(".player-banner .background").css("background-image", `url(${window.ToCDragonPath(request["response"]["backdropImage"])})`);
            });

            $.get(`/riot/lcu/0/lol-ranked/v1/ranked-stats/${summoner["puuid"]}`, {}, (request)=>{
                if(!request["success"]) return;
                let highestRankedEntry = request["response"]["highestRankedEntry"];
                let highestRankItem = $(this.element).find(".player-banner .profile .stats .item[data-name='highest-rank']");
                highestRankItem.find("span[data-name='tier']").text(window.Translate(highestRankedEntry["highestTier"]||"UNRANKED"));
                highestRankItem.find("span[data-name='division']").text(window.Translate(highestRankedEntry["highestDivision"], highestRankedEntry["highestDivision"]));
                Object.entries({
                    "RANKED_SOLO_5x5": "rank5solo",
                    "RANKED_FLEX_SR": "rank5flex",
                }).map(([qKey, qType])=>{
                    let bannerRanks = $(this.element).find(".player-banner .profile .ranks");
                    let queueData = request["response"]["queueMap"][qKey];
                    let tier = (queueData["tier"] || "UNRANKED");
                    let division = queueData["division"];
                    let icon = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier.toLowerCase()}.png`;
                    bannerRanks.find(`.item[data-name=${qType}] .icon`).attr("src", icon);
                    bannerRanks.find(`.item[data-name=${qType}] span[data-name="tier"]`).text(window.Translate(tier));
                    bannerRanks.find(`.item[data-name=${qType}] span[data-name="division"]`).text(window.Translate(division, division));
                });
            });

            // primary-mode
            $.get("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/queues.json", {}, (data)=>{
                $(this.element).find(".career-stats .item").addClass("loading");
                let queueNames = Object.fromEntries(Object.keys(data).map(qid=>[parseInt(qid),data[qid]["name"]]));
                let displayFetchedData = (queueSummary)=>{
                    let mostPlayed = Object.entries(queueSummary).sort((a,b)=>((b[1]["W"]+b[1]["L"])-(a[1]["W"]+a[1]["L"])))[0][0];
                    let queueWR = AppAlgo.calculateWR(queueSummary[mostPlayed]["W"], queueSummary[mostPlayed]["L"]);
                    let ranking = Math.ceil((queueWR/100)*(RANK_TIERS.length-1));
                    let item = $(this.element).find(".career-stats .item");
                    item.attr("data-rank", RANK_TIERS[RANK_TIERS.length-ranking-1].toLowerCase());
                    item.find(".name").text(queueNames[mostPlayed]);
                    item.find(".data span").text(queueWR.toFixed(1));
                    item.find(".detail span").text(queueSummary[mostPlayed]["W"]+queueSummary[mostPlayed]["L"]);
                };
                let fetchMatchHistory = (queueSummary, begIndex, stepIndex)=>{
                    return new Promise((resolve, reject)=>{
                        let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${summoner["puuid"]}/matches`;
                        $.get(requestURL, {"begIndex": begIndex, "endIndex": begIndex+stepIndex-1}, (request)=>{
                            if(!request["success"]) reject();
                            let games = request["response"]["games"]["games"];
                            let continueLooking = games.length>0;
                            for(let i=0; (i<games.length && continueLooking); i++){
                                continueLooking = (games[i]["gameCreation"] >= currentSeason["seasonStart"]);
                                if(!continueLooking) break;
                                let queueId = parseInt(games[i]["queueId"]);
                                let win = games[i]["participants"][0]["stats"]["win"];
                                if(!queueSummary[queueId]) queueSummary[queueId] = {"W":0,"L":0};
                                queueSummary[queueId]["W"] += win;
                                queueSummary[queueId]["L"] += !win;
                            }
                            displayFetchedData(queueSummary);
                            if(!continueLooking) return resolve(queueSummary);
                            return resolve(fetchMatchHistory(queueSummary, begIndex+stepIndex, stepIndex));
                        });
                    });
                };
                fetchMatchHistory({}, 0, 1).then((queueSummary)=>{
                    displayFetchedData(queueSummary);
                    $(this.element).find(".career-stats .item").removeClass("loading");
                });
            });

            // primary-champions
            new Promise((resolve, reject)=>{
                let requestURL = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json`;
                $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[parseInt(c.id),c]))));
            }).then((championSummary)=>{
                let most_champions_stats = opggData["most_champions"]["champion_stats"];
                $(this.element).find(".block-section.primary-champions .champion-item").each(function(i){
                    let stats = most_champions_stats[i];
                    $(this).find(".item[data-label='champion'] img").attr("src", `https://cdn.communitydragon.org/latest/champion/${stats["id"]}/square`);
                    $(this).find(".item[data-label='champion'] span").text(championSummary[stats["id"]]["name"]);
                    $(this).find(".item[data-label='gamePlayed']").text(stats["play"]);
                    $(this).find(".item[data-label='winRate'] span").text(AppAlgo.calculateWR(stats["win"], stats["lose"]).toFixed(1));
                    $(this).find(".item[data-label='calculatedKDA']").text(AppAlgo.calculateKDA(stats["kill"], stats["death"], stats["assist"]).toFixed(1));
                    $(this).find(".item[data-label='kda'] span[data-label='k']").text((stats["kill"]/stats["play"]).toFixed(1));
                    $(this).find(".item[data-label='kda'] span[data-label='d']").text((stats["death"]/stats["play"]).toFixed(1));
                    $(this).find(".item[data-label='kda'] span[data-label='a']").text((stats["assist"]/stats["play"]).toFixed(1));
                    $(this).find(".item[data-label='csPerMinute']").text(((stats["minion_kill"]+stats["neutral_minion_kill"])/(stats["game_length_second"]/60)).toFixed(1));
                    $(this).find(".item[data-label='goldPerMinute']").text((stats["gold_earned"]/(stats["game_length_second"]/60)).toFixed(1));
                });
            });
    
            // role-distribution
            let includingQueues = ["rank5solo", "rank5flex", "quickplay5", "draft5"];
            let roleDistribution = {
                "TOP": {"W":0, "L":0},
                "JUNGLE": {"W":0, "L":0},
                "MID": {"W":0, "L":0},
                "BOTTOM": {"W":0, "L":0},
                "SUPPORT": {"W":0, "L":0},
            };
            Promise.all(Object.keys(roleDistribution).map((position)=>Promise.all(includingQueues.map((queue)=>{
                return this.FetchQueuePositionSummary(summoner["puuid"], currentSeason["seasonId"], queue, position).then((qpSummary)=>{
                    roleDistribution[position]["W"] += qpSummary["victory"] || 0;
                    roleDistribution[position]["L"] += (qpSummary["gamePlayed"]-qpSummary["victory"]) || 0;
                    return Promise.resolve(roleDistribution[position]);
                });
            })))).then(()=>{
                let allWL = Object.values(roleDistribution).map((d)=>Object.values(d)).flat();
                $(this.element).find(".player-banner .profile .stats .item[data-name='total-games'] .data span").text(allWL.reduce((a,b)=>(a+b),0));
                let pivot = Math.max(...allWL);
                return Promise.resolve(Object.keys(roleDistribution).map((position)=>{
                    let chartItem = $(this.element).find(`.block-section.role-distribution .role-distribution-chart .item[data-position="${position}"]`);
                    chartItem.find(".bar-w span").css("height", `${(roleDistribution[position]["W"]/pivot)*100}%`);
                    chartItem.find(".bar-l span").css("height", `${(roleDistribution[position]["L"]/pivot)*100}%`);
                    let labelItem = $(this.element).find(`.block-section.role-distribution .role-distribution-label .item[data-position="${position}"]`);
                    labelItem.find("li[data-label='gamePlayed']").text(roleDistribution[position]["W"]+roleDistribution[position]["L"]);
                    labelItem.find("li[data-label='winRate'] span").text(AppAlgo.calculateWR(roleDistribution[position]["W"], roleDistribution[position]["L"]).toFixed(1));
                    labelItem.find(".hover-detail-top .w-games span").text(roleDistribution[position]["W"]);
                    labelItem.find(".hover-detail-top .l-games span").text(roleDistribution[position]["L"]);
                }));
            });

            // lp-history
            let rankDivisionCount = 4;
            let maxDivisionLP = 100;
            let FetchPromotionLP = (i, prevPromotionLP, prevIsApex, tierPromotionLP)=>{
                if(i >= RANK_TIERS.length) return Promise.resolve(Object.fromEntries(tierPromotionLP));
                let tier = RANK_TIERS[RANK_TIERS.length-i-1];
                return new Promise((resolve, reject)=>{
                    $.get(`/riot/lcu/0/lol-ranked/v1/apex-leagues/RANKED_SOLO_5x5/${tier}`, {}, (response)=>{
                        let isApexTier = (response["success"] && response["response"]["divisions"].length);
                        let apexPromotionLP = ((response["response"]["divisions"][0]||{})["minLpForApexTier"]||0);
                        let normPromotionLP = (!!i)*rankDivisionCount*maxDivisionLP;
                        let curtPromotionLP = prevPromotionLP + (!prevIsApex)*normPromotionLP + isApexTier*apexPromotionLP;
                        tierPromotionLP.push([tier, {
                            "tier": tier,
                            "ascendingIndex": i,
                            "descendingIndex": RANK_TIERS.length-i-1,
                            "promotionLP": curtPromotionLP,
                            "apexPromotionLP": apexPromotionLP,
                            "divisions": (isApexTier)?[{
                                "division": "",
                                "promotionLP": curtPromotionLP,
                            }]:[...Array(rankDivisionCount).keys()].map((d)=>({
                                "division": `${rankDivisionCount-d}`,
                                "promotionLP": curtPromotionLP + d*maxDivisionLP,
                            })),
                        }]);
                        return resolve(FetchPromotionLP(i+1, prevPromotionLP + (!prevIsApex)*normPromotionLP, isApexTier, tierPromotionLP));
                    });
                });
            };
            FetchPromotionLP(0, 0, false, []).then((tierPromotionLP)=>{
                let GetTierAtLP = (lp)=>{
                    let tier = Object.values(tierPromotionLP).filter((t)=>(t["promotionLP"]<=lp)).sort((a,b)=>(b["promotionLP"]-a["promotionLP"]))[0];
                    let divisionLPs = tier["divisions"].map((d)=>d["promotionLP"]).sort((a,b)=>(a-b));
                    let division = tier["divisions"].length-divisionLPs.indexOf(divisionLPs.filter((v)=>(v<=lp)).sort((a,b)=>(b-a))[0]);
                    return {"data": tier, "tier": tier["tier"], "division": division};
                };
                let lpLabel = opggData["lp_histories"].map((h)=>h["created_at"].split("T")[0].split("-").slice(1, 3).join("-"));
                let lpHistory = opggData["lp_histories"].map((h)=>{
                    let tierDivisions = tierPromotionLP[h["tier_info"]["tier"]]["divisions"];
                    let tierPromotion = tierDivisions[tierDivisions.length-h["tier_info"]["division"]]["promotionLP"];
                    let apexPromotion = tierPromotionLP[h["tier_info"]["tier"]]["apexPromotionLP"];
                    return tierPromotion - apexPromotion + h["tier_info"]["lp"];
                });
                let chartMinY = maxDivisionLP*(Math.floor(Math.min(...lpHistory)/maxDivisionLP) - !(Math.min(...lpHistory)%maxDivisionLP));
                chartMinY = isFinite(chartMinY)?chartMinY:0;
                let chartMaxY = maxDivisionLP*(Math.ceil(Math.max(...lpHistory)/maxDivisionLP) + !(Math.max(...lpHistory)%maxDivisionLP));
                chartMaxY = isFinite(chartMaxY)?chartMaxY:rankDivisionCount*maxDivisionLP;
                let RenderTierColors = (c, options)=>{
                    let yScale = c["scales"]["y"];

                    let yMinTier = GetTierAtLP(chartMinY)["data"];
                    let yMaxTier = GetTierAtLP(chartMaxY)["data"];

                    let coloring = [
                        0, 
                        ...[...Array((yMaxTier["ascendingIndex"]-yMinTier["ascendingIndex"])*2 + 1).keys()].map((i)=>{
                            let tier = RANK_TIERS[yMaxTier["descendingIndex"]+Math.floor(i/2)];
                            if(i%2 === 0){
                                return $(":root").css(`--${tier.toLowerCase()}-core-color`);
                            }else{
                                return (yScale.getPixelForValue(tierPromotionLP[tier]["promotionLP"])-c["chartArea"]["top"]) / c["chartArea"]["height"];
                            }
                        }),
                        1,
                    ];

                    let gradientFill = c.ctx.createLinearGradient(0, c["chartArea"]["top"], 0, c["chartArea"]["bottom"]);
                    for(let i = 0; i < coloring.length-2; i += 2){
                        gradientFill.addColorStop(coloring[i], coloring[i+1]);
                        gradientFill.addColorStop(coloring[i+2], coloring[i+1]);
                    }

                    c["data"]["datasets"][0]["borderColor"] = gradientFill;
                    c.update();
                };
                let chartContainer = $(this.element).find(".block-section.lp-history .lp-history-inner");
                return new Chart($("<canvas></canvas>").appendTo(chartContainer.empty()), {
                    "type": "line",
                    "data": {
                        "labels": lpLabel,
                        "datasets": [{
                            "label": "LP History",
                            "data": lpHistory,
                            "spanGaps": true,
                            "borderWidth": 3,
                            "pointRadius": 4,
                            "pointBorderWidth": 0,
                            "pointBackgroundColor": ((p)=>$(":root").css(`--${GetTierAtLP(p["raw"])["tier"].toLowerCase()}-core-color`)),
                        }],
                    },
                    "options": {
                        "maintainAspectRatio": false,
                        "scales": {
                            "x": {
                                "border": {
                                    "display": false,
                                },
                                "grid": {
                                    "display": false,
                                },
                                "ticks": {
                                    "font": {
                                        "weight": 700,
                                    },
                                    "color": ((t)=>$(":root").css(`--${GetTierAtLP(lpHistory[t["index"]])["tier"].toLowerCase()}-core-color`)),
                                    "callback": ((v)=>lpLabel[v].repeat(v%2)),
                                },
                            },
                            "y": {
                                "min": chartMinY,
                                "max": chartMaxY,
                                "border": {
                                    "display": false,
                                },
                                "grid": {
                                    "display": false,
                                },
                                "ticks": {
                                    "stepSize": maxDivisionLP,
                                    "font": {
                                        "weight": 800,
                                    },
                                    "color": ((t)=>$(":root").css(`--${GetTierAtLP(t["tick"]["value"])["tier"].toLowerCase()}-core-color`)),
                                    "callback": ((v)=>{
                                        let tierDivision = GetTierAtLP(v);
                                        let divisionsArr = tierDivision["data"]["divisions"];
                                        let divisionData = divisionsArr[divisionsArr.length-tierDivision["division"]];
                                        let isDisplaying = (n)=>(chartMinY <= n && n <= chartMaxY);
                                        let isDuplicated = (n)=>(n-maxDivisionLP>=divisionData["promotionLP"]);
                                        if(!(isDisplaying(v)&&(!isDisplaying(v-maxDivisionLP)||!isDuplicated(v)))) return null;
                                        return `${tierDivision["tier"][0]}${divisionData["division"]}`;
                                    }),
                                },
                            },
                        },
                        "plugins": {
                            "legend": {
                                "display": false,
                            },
                            "annotation": {
                                "annotations": Object.fromEntries(RANK_TIERS.slice().map((t,j)=>[t, {
                                    "type": "box",
                                    "drawTime": "beforeDatasetsDraw",
                                    "yMin": tierPromotionLP[t]["promotionLP"],
                                    "yMax": (tierPromotionLP[RANK_TIERS[j-1]]||{})["promotionLP"],
                                    "borderWidth": 0,
                                    "backgroundColor": `rgba(${[..."rgb"].map((k)=>{
                                        return $(":root").css(`--${t.toLowerCase()}-core-color-${k}`);
                                    }).join(", ")}, 0.2)`,
                                }])),
                            },
                        },
                    },
                    "plugins": [{
                        "id": "renderTierColors",
                        "beforeDatasetsDraw": RenderTierColors,
                    }]
                });
            });
        });
    }
}