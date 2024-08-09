class Main_Part_SummonerRecentPerformance extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/summoner-recent-performance/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        this.ReloadContent();
    }

    ReloadContent = ()=>{
        let summoner = this.data["summoner"];
        let chartContainer = $(this.element).find(".chart-container");

        let optionsChampion = (this.data["identifier"]["championId"]||-1);
        this.data["identifier"]["championId"] = optionsChampion;

        let optionsMode = $(this.element).find(".options-mode .drop-down-menu-selected").attr("data-label");
        let includedQueueIds = {
            "all": [],
            "classic": [
                430, // blind5
                490, // quickplay5
                400, // draft5
                420, // rank5solo
                440, // rank5flex
            ],
            "aram": [
                450, // aram
            ],
        }[optionsMode];

        let optionsTime = $(this.element).find(".options-time .drop-down-menu-selected").attr("data-label");
        let begDate = new Date();
        let endDate = new Date();
        endDate.setDate(endDate.getDate() - ({"day": 1, "week": 7, "month": 31}[optionsTime]));
        let isDateInRange = ((date)=>(begDate.getTime()>=date.getTime()&&date.getTime()>=endDate.getTime()));

        let optionsData = $(this.element).find(".options-data .drop-down-menu-selected").attr("data-label");
        let collectingStats = {
            "kda": {
                "labels": {
                    "kills": "擊殺", 
                    "deaths": "死亡", 
                    "assists": "助攻", 
                    "kda": "評分",
                },
                "collecting": {
                    "default": ["kills", "deaths", "assists"],
                    "extra": (k, d, a)=>[["kda", AppAlgo.calculateKDA(k, d, a).toFixed(1)], ],
                }
            },
            "damage-dealt": {
                "labels": {
                    "physicalDamageDealt": "物理傷害", 
                    "magicDamageDealt": "魔法傷害", 
                    "trueDamageDealt": "真實傷害", 
                    "totalDamageDealt": "輸出總計",
                },
                "collecting": {
                    "default": ["physicalDamageDealt", "magicDamageDealt", "trueDamageDealt", "totalDamageDealt"],
                    "extra": (physicalDamageDealt, magicDamageDealt, trueDamageDealt, totalDamageDealt)=>[],
                }
            },
            "damage-taken": {
                "labels": {
                    "physicalDamageTaken": "物理傷害", 
                    "magicalDamageTaken": "魔法傷害", 
                    "trueDamageTaken": "真實傷害", 
                    "totalDamageTaken": "承傷總計",
                },
                "collecting": {
                    "default": ["physicalDamageTaken", "magicalDamageTaken", "trueDamageTaken", "totalDamageTaken"],
                    "extra": (physicalDamageTaken, magicDamageTaken, trueDamageTaken, totalDamageTaken)=>[],
                }
            },
        }[optionsData];
        let initialSummaries = {
            "totalGamesCount": 0,
            "champions": {},
            "datasets": Object.fromEntries(Object.keys(collectingStats["labels"]).map(k=>[k, {
                "label":collectingStats["labels"][k], "datas":[]
            }])),
            "collecting": collectingStats["collecting"],
        };

        let fetchMatchHistory = (summaries, begIndex, stepIndex)=>{
            return new Promise((resolve, reject)=>{
                if(begIndex >= 10000) return resolve(summaries);
                let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${summoner["puuid"]}/matches`;
                $.get(requestURL, {"begIndex": begIndex, "endIndex": begIndex+stepIndex-1}, (request)=>{
                    if(!request["success"]) return reject();
                    let games = request["response"]["games"]["games"];
                    let continueLooking = games.length>0;
                    for(let i=0; (i<games.length && continueLooking); i++){
                        if(games[i]["gameDuration"] < 300) continue;
                        continueLooking = isDateInRange(new Date(games[i]["gameCreationDate"]));
                        if(!continueLooking) break;
                        let queueId = parseInt(games[i]["queueId"]);
                        if(includedQueueIds.length && !includedQueueIds.includes(queueId)) continue;
                        let championId = parseInt(games[i]["participants"][0]["championId"]);
                        summaries["champions"][championId] = (summaries["champions"][championId]?(summaries["champions"][championId]+1):1);
                        if(optionsChampion>=0 && games[i]["participants"][0]["championId"]!=optionsChampion) continue;
                        summaries["totalGamesCount"]++;
                        let defaults = summaries["collecting"]["default"].map(key=>[key, games[i]["participants"][0]["stats"][key]]);
                        let extras = summaries["collecting"]["extra"](...defaults.map(p=>p[1]));
                        [...defaults, ...extras].forEach(([key, value])=>summaries["datasets"][key]["datas"].unshift(value));
                    }
                    if(!continueLooking) return resolve(summaries);
                    return resolve(fetchMatchHistory(summaries, begIndex+stepIndex, stepIndex));
                });
            });
        };
        let displaySummaries = (summaries)=>{
            let champions = Object.keys(summaries["champions"]).sort((a,b)=>(summaries["champions"][b]-summaries["champions"][a])).slice(0, 3).map(i=>parseInt(i));
            if(optionsChampion>=0 && !champions.includes(optionsChampion)) champions.unshift(optionsChampion);
            $(this.element).find(".options-champion").html(`
            <div class="option-champion-item hover-pointer ${(optionsChampion==-1)?'active':''}" data-id="-1">
                <img src="https://cdn.communitydragon.org/latest/champion/generic/square" alt="">
            </div>${champions.map((championId)=>`
            <div class="option-champion-item hover-pointer ${(optionsChampion==championId)?'active':''}" data-id="${championId}">
                <img src="https://cdn.communitydragon.org/latest/champion/${championId}/square" alt="">
            </div>`).join("")}`);
            window.Widgets.SetupButtonGroup($(this.element).find(".options-champion .option-champion-item"), ()=>{
                this.data["identifier"]["championId"] = parseInt($(this.element).find(".options-champion .option-champion-item.active").attr("data-id"));
                this.ReloadContent();
            });
            let colors = ["#0093FF", "#00BBA3", "#FFB900", "#9AA4AF"];
            let datasets = Object.values(summaries["datasets"]).map((set)=>({
                "label": set["label"],
                "data": set["datas"],
            }));
            let textFontValue = `'Noto Sans', ${getComputedStyle(document.documentElement).getPropertyValue("--font-display")}, sans-serif`;
            let textColorVar = `--${($("#app").attr("theme")==="light")?"black":"white"}-200`;
            let textColorValue = getComputedStyle(document.documentElement).getPropertyValue(textColorVar);
            let gridColorVar = `--${($("#app").attr("theme")==="light")?"white":"black"}-700`;
            let gridColorValue = getComputedStyle(document.documentElement).getPropertyValue(gridColorVar);
            let borderColorVar = `--${($("#app").attr("theme")==="light")?"black":"white"}-200`;
            let borderColorValue = getComputedStyle(document.documentElement).getPropertyValue(borderColorVar);
            let minValidDataLength = Infinity;
            for(let i=0; i<datasets.length; i++){
                minValidDataLength = Math.min(minValidDataLength, datasets[i]["data"].length);
                datasets[i]["borderColor"] = colors[i];
                datasets[i]["backgroundColor"] = colors[i];
            }
            return new Chart($("<canvas></canvas>").appendTo(chartContainer.empty()), {
                "type": "line",
                "data": {
                    "labels": Array(minValidDataLength).fill(""),
                    "datasets": datasets,
                },
                "options": {
                    "tension": 0.4,
                    "onResize": (chart, size)=>{
                        let s = Math.min(...Object.values(size)) / 100;
                        chart["options"]["plugins"]["legend"]["labels"]["font"] = {
                            "size": s*2.5,
                            "family": textFontValue,
                        };
                        chart["data"]["datasets"].forEach((dataset)=>{
                            dataset["pointRadius"] = s;
                            dataset["pointHoverRadius"] = s*1.35;
                        });
                    },
                    "maintainAspectRatio": false,
                    "layout": {
                        "padding": {
                            "bottom": -20,
                        },
                    },
                    "plugins": {
                        "legend": {
                            "labels": {
                                "color": textColorValue,
                            },
                        },
                    },
                    "scales": {
                        "x": {
                            "border": {
                                "color": borderColorValue,
                            }, 
                            "ticks": {
                                "color": textColorValue,
                            }, 
                            "grid": {
                                "color": gridColorValue,
                            },
                        }, 
                        "y": {
                            "border": {
                                "color": borderColorValue,
                            }, 
                            "ticks": {
                                "color": textColorValue,
                                "callback": ((v)=>((v%1===0)?v:"")),
                            }, 
                            "grid": {
                                "color": gridColorValue,
                            },
                            "suggestedMin": 0,
                        }
                    }
                },
            });
        };
        fetchMatchHistory(initialSummaries, 0, 100).then(displaySummaries);
    }
}