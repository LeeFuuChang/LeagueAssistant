class Main_Part_LolMatchDetail extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-match-detail/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.gameSummaries = {};
        this.displaySummaries = [];
        this.CreateElement(container).then(()=>this.ReloadContent());
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="match-player" data-id="">
            <div class="match-player-basic">
                <div class="hover-pointer player-basic-champion">
                    <img src="" alt="">
                    <span></span>
                </div>
                <div class="player-basic-spells">
                    <img src="" alt="">
                    <img src="" alt="">
                </div>
                <div class="player-basic-runes">
                    <div class="player-runes" data-name="perk0">
                        <img src="" alt="">
                    </div>
                    <div class="player-runes" data-name="perkSubStyle">
                        <img src="" alt="">
                    </div>
                </div>
                <div class="player-basic-other">
                    <div class="player-basic-build">
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                    </div>
                    <div class="player-basic-info">
                        <div class="player-name hover-pointer">
                            <span class="text-ellipsis"></span>
                        </div>
                        <div class="player-kda">
                            <span class="player-kda-k">
                            </span> / <span class="player-kda-d">
                            </span> / <span class="player-kda-a">
                            </span>
                        </div>
                    </div>
                </div>
                <div class="mask hover-pointer action-button player-basic-more"></div>
                <div class="player-basic-data">
                    <div class="data-percentage-bar hover-detail-parent horizontal-percentage-bar">
                        <div class="percentage-bar-item" style="--percentage:40%;">
                            <div class="data-detail hover-detail-top">
                                <div class="detail-item" data-type="numberic"></div>
                                <div class="detail-item" data-type="percentage"></div>
                                <div class="detail-item" data-type="minute"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="match-player-stats horizontal-stretched-border">
                <div class="player-stats y-scrollable">
                    <div class="stats-item horizontal-stretched-border" data-name="summonerName"></div>
                    <div class="stats-item horizontal-stretched-border" data-name="build">
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                        <div class="player-build-item"></div>
                    </div>
                    <div class="stats-item horizontal-stretched-border" data-name="runes">
                        <img src="" alt="">
                        <img src="" alt="">
                        <img src="" alt="">
                        <img src="" alt="">
                        <img src="" alt="">
                        <img src="" alt="">
                        <img src="" alt="">
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">造成魔法傷害</div>
                        <div class="stats-data" data-name="magicDamageDealtToChampions">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">造成物理傷害</div>
                        <div class="stats-data" data-name="physicalDamageDealtToChampions">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">造成真實傷害</div>
                        <div class="stats-data" data-name="trueDamageDealtToChampions">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">造成傷害總計</div>
                        <div class="stats-data" data-name="totalDamageDealtToChampions">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">承受魔法傷害</div>
                        <div class="stats-data" data-name="magicalDamageTaken">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">承受物理傷害</div>
                        <div class="stats-data" data-name="physicalDamageTaken">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">承受真實傷害</div>
                        <div class="stats-data" data-name="trueDamageTaken">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">承受傷害總計</div>
                        <div class="stats-data" data-name="totalDamageTaken">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">累積擊殺小兵</div>
                        <div class="stats-data" data-name="totalMinionsKilled">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">累積擊殺野怪</div>
                        <div class="stats-data" data-name="neutralMinionsKilled">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">累積獲得金錢</div>
                        <div class="stats-data" data-name="goldEarned">0</div>
                    </div>
                    <div class="stats-item horizontal-stretched-border">
                        <div class="stats-name">視野布置評分</div>
                        <div class="stats-data" data-name="visionScore">0</div>
                    </div>
                </div>
                <div class="player-actions">
                    <div class="hover-pointer player-view">查看玩家資料</div>
                    <div class="hover-pointer player-report">檢舉不當行為</div>
                </div>
            </div>
        </div>`;
        return $(html).appendTo(container);
    }

    FetchStaticData = (lang)=>{
        let gameDataURL = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${lang||"default"}/v1`;
        let championSummaryPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/champion-summary.json`, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[parseInt(c.id),c]))));
        });
        let summonerSpellIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/summoner-spells.json`, {}, (data)=>resolve(Object.fromEntries(data.map(s=>[parseInt(s.id), window.ToCDragonPath(s["iconPath"])]))));
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perks.json`, {}, (data)=>resolve(Object.fromEntries(data.map((p)=>[parseInt(p["id"]), window.ToCDragonPath(p["iconPath"])]))));
        });
        let perkStyleIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perkstyles.json`, {}, (data)=>resolve(Object.fromEntries(data["styles"].map(p=>[parseInt(p.id), window.ToCDragonPath(p["iconPath"])]))));
        });
        let itemIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/items.json`, {}, (data)=>resolve(Object.fromEntries(data.map((i)=>[parseInt(i.id),window.ToCDragonPath(i["iconPath"])]))));
        });
        let queueNamesPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/queues.json`, {}, (data)=>resolve(Object.fromEntries(Object.keys(data).map(qid=>[parseInt(qid),data[qid]["name"]]))));
        });
        return Promise.all([
            championSummaryPromise,
            summonerSpellIconsPromise,
            perkIconsPromise,
            perkStyleIconsPromise,
            itemIconsPromise,
            queueNamesPromise,
        ]);
    }

    ReloadContent = ()=>{
        if(this.data["identifier"]["gameId"]){
            this.FetchStaticData("zh_tw").then(([
                championSummary,
                summonerSpellIcons,
                perkIcons,
                perkStyleIcons,
                itemIcons,
                queueNames,
            ])=>{
                let requestURL = `/riot/lcu/0/lol-match-history/v1/games/${this.data["identifier"]["gameId"]}`;
                $.get(requestURL, {}, (data)=>{
                    if(data["success"]){
                        this.gameSummaries = {};
                        this.displaySummaries = [{
                            "displayName": "輸出傷害",
                            "percentageName": "輸出占比",
                            "minuteName": "分鐘輸出",
                            "numerators": [
                                "totalDamageDealtToChampions"
                            ],
                            "sum-denominators": [
                                "totalDamageDealtToChampions",
                            ],
                            "max-denominators": [
                                "totalDamageDealtToChampions", 
                            ],
                        }, {
                            "displayName": "承受傷害",
                            "percentageName": "承傷占比",
                            "minuteName": "分鐘承傷",
                            "numerators": [
                                "totalDamageTaken"
                            ],
                            "sum-denominators": [
                                "totalDamageTaken",
                            ],
                            "max-denominators": [
                                "totalDamageTaken", 
                            ],
                        }, {
                            "displayName": "獲得金錢",
                            "percentageName": "經濟占比",
                            "minuteName": "分鐘經濟",
                            "numerators": [
                                "goldEarned"
                            ],
                            "sum-denominators": [
                                "goldEarned",
                            ],
                            "max-denominators": [
                                "goldEarned", 
                            ],
                        }, {
                            "displayName": "擊殺參與",
                            "percentageName": "參與占比",
                            "minuteName": "分鐘參與",
                            "numerators": [
                                "kills",
                                "assists",
                            ],
                            "sum-denominators": [
                                "kills",
                            ],
                            "max-denominators": [
                                "kills", 
                                "assists",
                            ],
                        }, {
                            "displayName": "視野分數",
                            "percentageName": "視野占比",
                            "minuteName": "分鐘視野",
                            "numerators": [
                                "visionScore",
                            ],
                            "sum-denominators": [
                                "visionScore",
                            ],
                            "max-denominators": [
                                "visionScore",
                            ],
                        }];
                        for(let player of data["response"]["participants"]){
                            let playerId = player["participantId"];
                            let playerTeam = parseInt(player["teamId"]/100);
                            for(let key of Object.keys(player["stats"])){
                                if(this.gameSummaries[key] === undefined){
                                    this.gameSummaries[key] = {"teams":{},"players":{}};
                                }
                                if(this.gameSummaries[key]["teams"][playerTeam] === undefined){
                                    this.gameSummaries[key]["teams"][playerTeam] = {"sum":0,"max":0};
                                }
                                if(this.gameSummaries[key]["players"][playerTeam] === undefined){
                                    this.gameSummaries[key]["players"][playerTeam] = {};
                                }
                                this.gameSummaries[key]["players"][playerTeam][playerId] = player["stats"][key];
                                this.gameSummaries[key]["teams"][playerTeam]["sum"] += player["stats"][key];
                                this.gameSummaries[key]["teams"][playerTeam]["max"] = Math.max(
                                    player["stats"][key], this.gameSummaries[key]["teams"][playerTeam]["max"]
                                );
                            }
                        }
    
                        let [Gdate, Gtime] =  data["response"]["gameCreationDate"].split("T");
                        let [Gyear, Gmonth, Gday] = Gdate.split("-");
                        let [Ghour, Gminute, Gsecond] = Gtime.split(":");
                        let matchDetail = $(this.element).find(".match-detail-info");
                        matchDetail.find(".match-info-date .info-item-inner span[data-name='m']").text(Gmonth);
                        matchDetail.find(".match-info-date .info-item-inner span[data-name='d']").text(Gday);
        
                        matchDetail.find(".match-info-queue .info-item-inner span").text(queueNames[data["response"]["queueId"]])
        
                        let Dminute = Math.floor(data["response"]["gameDuration"]/60);
                        let Dsecond = data["response"]["gameDuration"]%60;
                        matchDetail.find(".match-info-duration .info-item-inner span[data-name='m']").text(`${Dminute}`.padStart(2,'0'));
                        matchDetail.find(".match-info-duration .info-item-inner span[data-name='s']").text(`${Dsecond}`.padStart(2,'0'));
        
                        let switchDisplayData = (adder)=>{
                            let span = $(this.element).find(".match-detail-info .match-info-data .info-item-inner span");
                            let next = (parseInt(span.attr("data-id"))+adder) % this.displaySummaries.length;
                            let displaying = this.displaySummaries[next];
                            span.text(displaying["displayName"]).attr("data-id", next);
                            for(let player of data["response"]["participants"]){
                                let playerId = player["participantId"];
                                let playerTeam = parseInt(player["teamId"]/100);

                                let numerator = displaying["numerators"].map((n_key)=>{
                                    return this.gameSummaries[n_key]["players"][playerTeam][playerId];
                                }).reduce((a, b)=>(a+b), 0);

                                let max_d_temp = {};
                                for(let max_d_key of displaying["max-denominators"]){
                                    for(let allyId of Object.keys(this.gameSummaries[max_d_key]["players"][playerTeam])){
                                        if(max_d_temp[allyId] === undefined) max_d_temp[allyId] = 0;
                                        max_d_temp[allyId] += this.gameSummaries[max_d_key]["players"][playerTeam][allyId];
                                    }
                                }
                                let max_denominator = Math.max(...Object.values(max_d_temp));

                                let sum_denominator = displaying["sum-denominators"].map((sum_d_key)=>{
                                    return this.gameSummaries[sum_d_key]["teams"][playerTeam]["sum"];
                                }).reduce((a, b)=>(a+b), 0);

                                let dataBarItem = $(this.element).find(`.match-player[data-id="${player["participantId"]}"]`)
                                .find(".match-player-basic .player-basic-data .percentage-bar-item");

                                let max_percentage = (numerator/max_denominator)*100;
                                dataBarItem.css("--percentage", `${isNaN(max_percentage)?0:max_percentage}%`);

                                dataBarItem.find(".detail-item[data-type='numberic']").html(
                                    `${displaying["displayName"]}<span>${numerator}</span>`
                                );

                                let sum_percentage = (numerator/sum_denominator)*100;
                                dataBarItem.find(".detail-item[data-type='percentage']").html(
                                    `${displaying["percentageName"]}<span>${
                                        (isNaN(sum_percentage)?0:sum_percentage).toFixed(1)
                                    }%</span>`
                                );

                                let minute_average = (numerator/data["response"]["gameDuration"])*60;
                                dataBarItem.find(".detail-item[data-type='minute']").html(
                                    `${displaying["minuteName"]}<span>${
                                        (isNaN(minute_average)?0:minute_average).toFixed(2)
                                    }</span>`
                                );
                            }
                        };
                        matchDetail.find(".match-info-data .info-item-inner span")
                        .attr("data-id", 0).off("click").on("click", ()=>switchDisplayData(1));
    
                        let winTeam = data["response"]["teams"].sort((a, b)=>{
                            return ((b["win"].toLowerCase()==="win")-(a["win"].toLowerCase()==="win"));
                        })[0]["teamId"]/100;
                        matchDetail.find(".match-info-winner .info-item-inner span").attr("data-team", winTeam).text(["紅方", "藍方"][winTeam-1]);
        
                        matchDetail.find(".match-info-score .info-item-inner span[data-team='1']").text(this.gameSummaries["kills"]["teams"]["1"]["sum"]);
                        matchDetail.find(".match-info-score .info-item-inner span[data-team='2']").text(this.gameSummaries["kills"]["teams"]["2"]["sum"]);
        
                        let goldEarnedGap = (this.gameSummaries["goldEarned"]["teams"]["2"]["sum"]-this.gameSummaries["goldEarned"]["teams"]["1"]["sum"]);
                        matchDetail.find(".match-info-gold .info-item-inner span").attr("data-team", (goldEarnedGap>0)+1).text((Math.abs(goldEarnedGap)/1000).toFixed(1));
        
                        let identities = {};
                        for(let playerIdentity of data["response"]["participantIdentities"]){
                            identities[playerIdentity["participantId"]] = playerIdentity["player"];
                        }

                        $(this.element).find(".match-game-team").empty();
                        let promises = data["response"]["participants"].map((player)=>{
                            return new Promise((resolve, reject)=>{
                                let team = player["teamId"]/100;
                                let ele = this.CreateInnerItem($(this.element).find(`.match-game-team[data-team="${team}"]`));
                                ele.attr({
                                    "data-id": player["participantId"],
                                    "puuid": identities[player["participantId"]]["puuid"],
                                    "summoner-id": identities[player["participantId"]]["summonerId"],
                                    "summoner-name": identities[player["participantId"]]["summonerName"],
                                });
            
                                let basic = ele.find(".match-player-basic");
                                let stats = ele.find(".match-player-stats");
        
                                basic.find(".player-basic-champion").on("click", ()=>{
                                    window.LoadClasses("assets/body/main/pages/lol-trend/classes.json").then(()=>{
                                        window.LoadMain(Main_LolTrend, window.MakeData({
                                            identifier: {"lower-alias":championSummary[player["championId"]]["alias"].toLowerCase()}
                                        }));
                                    });
                                })
                                basic.find(".player-basic-champion img").attr("src",
                                    `https://cdn.communitydragon.org/latest/champion/${player["championId"]}/square`
                                );
                                basic.find(".player-basic-champion span").text(player["stats"]["champLevel"]);
                                
                                $(basic.find(".player-basic-spells img")[0]).attr("src", summonerSpellIcons[player["spell1Id"]]);
                                $(basic.find(".player-basic-spells img")[1]).attr("src", summonerSpellIcons[player["spell2Id"]]);
                
                                basic.find(".player-basic-runes .player-runes[data-name='perk0'] img").attr("src", perkIcons[player["stats"]["perk0"]]);
                                basic.find(".player-basic-runes .player-runes[data-name='perkSubStyle'] img").attr("src", perkStyleIcons[player["stats"]["perkSubStyle"]]);
        
                                let basicBuild = basic.find(".player-basic-other .player-basic-build .player-build-item");
                                for(let i=0; i<6; i++){
                                    if(player["stats"][`item${i}`]){
                                        try{$(basicBuild[i]).html(`<img src="${itemIcons[player["stats"][`item${i}`]]}">`)}catch(e){console.log(e)}
                                    }
                                }
                
                                basic.find(".player-basic-other .player-basic-info .player-name").on("click", (e)=>{
                                    Promise.all([
                                        window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                                        window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
                                    ]).then(()=>{
                                        SummonerIdentifier
                                        .FromSummonerId($(e.currentTarget).closest(".match-player").attr("summoner-id"))
                                        .then(identifier=>window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier, identifier:this.data["identifier"]})));
                                    });
                                }).find("span").text(
                                    identities[player["participantId"]]["summonerName"]
                                );
        
                                let basicKDA = basic.find(".player-basic-other .player-basic-info .player-kda");
                                basicKDA.find(".player-kda-k").text(player["stats"]["kills"]);
                                basicKDA.find(".player-kda-d").text(player["stats"]["deaths"]);
                                basicKDA.find(".player-kda-a").text(player["stats"]["assists"]);
            
                                basic.find(".action-button.player-basic-more").on("click", function(){
                                    let p = $(this).closest(".match-player");
                                    $(p).toggleClass("active")
                                        .siblings().removeClass("active")
                                        .addBack().removeClass("inactive");
                                    if($(p).hasClass("active")) $(p).siblings().addClass("inactive");
                                });
            
                                stats.find(".stats-item[data-name='summonerName']").text(
                                    identities[player["participantId"]]["summonerName"]
                                );
                
                                let statsBuild = stats.find(".stats-item[data-name='build'] .player-build-item");
                                for(let i=0; i<7; i++){
                                    if(player["stats"][`item${i}`]){
                                        try{$(statsBuild[i]).html(`<img src="${itemIcons[player["stats"][`item${i}`]]}">`)}catch(e){console.log(e)}
                                    }
                                }

                                let statsRunes = stats.find(".stats-item[data-name='runes'] img");
                                $(statsRunes[0]).attr("src", perkIcons[player["stats"]["perk0"]]);
                                $(statsRunes[1]).attr("src", perkIcons[player["stats"]["perk1"]]);
                                $(statsRunes[2]).attr("src", perkIcons[player["stats"]["perk2"]]);
                                $(statsRunes[3]).attr("src", perkIcons[player["stats"]["perk3"]]);
                                $(statsRunes[4]).attr("src", perkStyleIcons[player["stats"]["perkSubStyle"]]);
                                $(statsRunes[5]).attr("src", perkIcons[player["stats"]["perk4"]]);
                                $(statsRunes[6]).attr("src", perkIcons[player["stats"]["perk5"]]);

                                stats.find(".stats-item .stats-data").each(function(){
                                    $(this).text(player["stats"][$(this).attr("data-name")])
                                });

                                stats.find(".player-actions .player-view").on("click", function(){
                                    Promise.all([
                                        window.LoadClasses("assets/body/side/pages/summoner/classes.json"),
                                        window.LoadClasses("assets/body/main/pages/lol-match-history/classes.json"),
                                    ]).then(()=>{
                                        SummonerIdentifier
                                        .FromSummonerId($(this).closest(".match-player").attr("summoner-id"))
                                        .then(identifier=>window.LoadPage(Side_Summoner, Main_LolMatchHistory, window.MakeData({summoner:identifier})));
                                    });
                                });
                                stats.find(".player-actions .player-report").on("click", ()=>{
                                    window.LoadClasses("assets/overlay/classes.json").then(()=>{
                                        window.LoadOverlay(AppOverlay_ReportHistory, window.MakeData({
                                            identifier: {
                                                "icon": `https://cdn.communitydragon.org/latest/champion/${player["championId"]}/square`,
                                                "offender": identities[player["participantId"]],
                                                "defaultPayload": {
                                                    "categories": [],
                                                    "comment": "",
                                                    "gameId": this.data["identifier"]["gameId"],
                                                    "offenderPuuid": identities[player["participantId"]]["puuid"],
                                                    "offenderSummonerId": identities[player["participantId"]]["summonerId"],
                                                }
                                            }
                                        }));
                                    });
                                });

                                resolve(player);
                            });
                        });
                        Promise.all(promises).then(()=>switchDisplayData(0));
                    }
                })
            })
        }
    }
}