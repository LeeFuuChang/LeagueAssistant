class Side_Part_SummonerRecentChampion extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-recent-champion/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "場次排序",
            value: (a, b)=>(b["gamePlayed"] - a["gamePlayed"])
        }, {
            pageName: "評分排序",
            value: (a, b)=>(b["kda"] - a["kda"])
        }, {
            pageName: "擊殺排序",
            value: (a, b)=>((b["kills"] / b["gamePlayed"]) - (a["kills"] / a["gamePlayed"]))
        }, {
            pageName: "死亡排序",
            value: (a, b)=>((b["deaths"] / b["gamePlayed"]) - (a["deaths"] / a["gamePlayed"]))
        }, {
            pageName: "助攻排序",
            value: (a, b)=>((b["assists"] / b["gamePlayed"]) - (a["assists"] / a["gamePlayed"]))
        }], this.ReloadContent);
        this.ReloadContent();
    }

    ReloadContent = ()=>{
        let container = $(this.element).find(".recent-champion-inner").empty();
        if(this.data["summoner"]["invalid"]) return Promise.resolve();

        let summoner = this.data["summoner"];

        let pageData = this.availablePages[this.currentPageIndex];

        let begDate = new Date();
        let endDate = new Date();
        endDate.setDate(endDate.getDate() - 7);
        let isDateInRange = ((date)=>(begDate.getTime()>=date.getTime()&&date.getTime()>=endDate.getTime()));

        let fetchMatchHistory = (summaries, begIndex, stepIndex)=>{
            return new Promise((resolve, reject)=>{
                if(begIndex >= 300) return resolve(summaries);
                let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${summoner["puuid"]}/matches`;
                $.get(requestURL, {"begIndex": begIndex, "endIndex": begIndex+stepIndex-1}, (request)=>{
                    if(!request["success"]) return reject();
                    let games = request["response"]["games"]["games"];
                    let continueLooking = games.length>0;
                    for(let i=0; (i<games.length && continueLooking); i++){
                        continueLooking = isDateInRange(new Date(games[i]["gameCreationDate"]));
                        if(!continueLooking) break;
                        if(games[i]["gameDuration"] < 300) continue;
                        let championId = games[i]["participants"][0]["championId"];
                        let stats = games[i]["participants"][0]["stats"];
                        if(summaries[championId] === undefined){
                            summaries[championId] = {
                                "championId": championId,
                                "gamePlayed": 1,
                                "gameBefore": i,
                                "kills": stats["kills"],
                                "deaths": stats["deaths"],
                                "assists": stats["assists"],
                                "kda": AppAlgo.calculateKDA(stats["kills"], stats["deaths"], stats["assists"]),
                            }
                        }else{
                            summaries[championId]["gamePlayed"]++;
                            summaries[championId]["kills"] += stats["kills"];
                            summaries[championId]["deaths"] += stats["deaths"];
                            summaries[championId]["assists"] += stats["assists"];
                            summaries[championId]["kda"] = AppAlgo.calculateKDA(summaries[championId]["kills"], summaries[championId]["deaths"], summaries[championId]["assists"]);
                        }
                    }
                    if(!continueLooking) return resolve(summaries);
                    return resolve(fetchMatchHistory(summaries, begIndex+request["response"]["games"]["gameCount"], stepIndex));
                });
            });
        };
        return fetchMatchHistory({}, 0, 50).then((summaries)=>{
            let champions = Object.values(summaries).sort((a, b)=>( pageData.value(a, b) || a["gameBefore"] - b["gameBefore"] )).slice(0, 5);
            let html = champions.map((c)=>{
                let k = c["kills"];
                let d = c["deaths"];
                let a = c["assists"];
                let g = c["gamePlayed"];
                return `
                <div class="recent-champion-item hover-detail-parent" data-champion-id="${c["championId"]}">
                    <div class="recent-champion-icon">
                        <img src="https://cdn.communitydragon.org/latest/champion/${c["championId"]}/square" alt="">
                    </div>
                    <div class="recent-champion-detail hover-detail-top">
                        <div class="champion-detail-item" data-name="gamePlayed">
                            對局數量<span>${g}</span>
                        </div>
                        <div class="champion-detail-item" data-name="averageKills">
                            平均擊殺<span>${(k/g).toFixed(1)}</span>
                        </div>
                        <div class="champion-detail-item" data-name="averageDeaths">
                            平均死亡<span>${(d/g).toFixed(1)}</span>
                        </div>
                        <div class="champion-detail-item" data-name="averageAssists">
                            平均助攻<span>${(a/g).toFixed(1)}</span>
                        </div>
                        <div class="champion-detail-item" data-name="averageKDA">
                            評分表現<span>${c["kda"].toFixed(1)}</span>
                        </div>
                    </div>
                </div>`;
            }).join("");
            container.html($(html)).find(".recent-champion-item").on("click", function(){
                window.LoadClasses("assets/body/main/pages/summoner-recent-performance/classes.json").then(()=>{
                    window.LoadMain(Main_SummonerRecentPerformance, window.MakeData({
                        summoner:summoner,
                        identifier:{"championId":$(this).data("championId")}
                    }));
                });
            });
            return Promise.resolve();
        });
    }
}