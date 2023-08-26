class Side_Part_SummonerRecentChampion extends AppBodySide_Part {
    static elementURL = "/ui/assets/body/side/parts/summoner-recent-champion/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "最近10場",
            value: {
                "begIndex": 0,
                "endIndex": 9,
            }
        }, {
            pageName: "最近15場",
            value: {
                "begIndex": 0,
                "endIndex": 14,
            }
        }, {
            pageName: "最近20場",
            value: {
                "begIndex": 0,
                "endIndex": 19,
            }
        }, {
            pageName: "最近25場",
            value: {
                "begIndex": 0,
                "endIndex": 24,
            }
        }, {
            pageName: "最近30場",
            value: {
                "begIndex": 0,
                "endIndex": 29,
            }
        }], this.ReloadContent);
        this.ReloadContent();
    }

    SetDefault = ()=>{
        let container = $(this.element).find(".recent-champion-inner");
        container.empty();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="recent-champion-item hover-detail-parent">
            <div class="recent-champion-icon">
                <img src="" alt="">
            </div>
            <div class="recent-champion-detail hover-detail-top">
                <div class="champion-detail-item" data-name="gamePlayed">對局數量：<span>0</span></div>
                <div class="champion-detail-item" data-name="averageKills">平均擊殺：<span>0</span></div>
                <div class="champion-detail-item" data-name="averageDeaths">平均死亡：<span>0</span></div>
                <div class="champion-detail-item" data-name="averageAssists">平均助攻：<span>0</span></div>
                <div class="champion-detail-item" data-name="averageKDA">平均戰績：<span>0</span></div>
            </div>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            if(this.data["summoner"]["invalid"]) return resolve(this.SetDefault());
    
            let container = $(this.element).find(".recent-champion-inner");
            let pageData = this.availablePages[this.currentPageIndex];
            let puuid = this.data["summoner"]["puuid"];

            let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${puuid}/matches`;
            $.get(requestURL, pageData.value, (data)=>{
                if(data["success"]){
                    container.empty();
                    let games = data["response"]["games"]["games"];
                    let champions = {};
                    for(let i=0; i<games.length; i++){
                        let championId = games[i]["participants"][0]["championId"]
                        let stats = games[i]["participants"][0]["stats"];
                        if(champions[championId] === undefined){
                            champions[championId] = {
                                "championId": championId,
                                "gamePlayed": 1,
                                "gameBefore": i,
                                "kills": stats["kills"],
                                "deaths": stats["deaths"],
                                "assists": stats["assists"],
                            }
                        }else{
                            champions[championId]["gamePlayed"]++;
                            champions[championId]["kills"] += stats["kills"];
                            champions[championId]["deaths"] += stats["deaths"];
                            champions[championId]["assists"] += stats["assists"];
                        }
                    }
                    champions = Object.values(champions).sort((a, b)=>{
                        if(a["gamePlayed"] > b["gamePlayed"]) return -1;
                        else if(a["gamePlayed"] < b["gamePlayed"]) return 1;
                        else if(a["gameBefore"] > b["gameBefore"]) return 1;
                        else if(a["gameBefore"] < b["gameBefore"]) return -1;
                        else return 0;
                    });
                    for(let i=0; i<Math.min(5, champions.length); i++){
                        let championId = champions[i]["championId"];
                        let gamePlayed = champions[i]["gamePlayed"];
                        let totalKills = champions[i]["kills"];
                        let totalDeaths = champions[i]["deaths"];
                        let totalAssists = champions[i]["assists"];
                        let ele = this.CreateInnerItem(container);
                        ele.find(".recent-champion-icon img").attr("src",
                            `https://cdn.communitydragon.org/latest/champion/${championId}/square`
                        );
                        ele.find(".recent-champion-detail .champion-detail-item[data-name='gamePlayed'] span").text(gamePlayed);
                        ele.find(".recent-champion-detail .champion-detail-item[data-name='averageKills'] span")
                        .text((totalKills/gamePlayed).toFixed(1));
                        ele.find(".recent-champion-detail .champion-detail-item[data-name='averageDeaths'] span")
                        .text((totalDeaths/gamePlayed).toFixed(1));
                        ele.find(".recent-champion-detail .champion-detail-item[data-name='averageAssists'] span")
                        .text((totalAssists/gamePlayed).toFixed(1));
                        ele.find(".recent-champion-detail .champion-detail-item[data-name='averageKDA'] span")
                        .text(((totalKills+totalAssists)/Math.max(1, totalDeaths)).toFixed(1));
                    }
                }else this.SetDefault();
            }).always(()=>{resolve()});
        });
    }
}