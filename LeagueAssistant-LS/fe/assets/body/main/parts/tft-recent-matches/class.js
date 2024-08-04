class Main_Part_TftRecentMatches extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/tft-recent-matches/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.ReloadContent());
    }

    CreateInnerItem = (container)=>{
        let infoStatsHtml = "";
        for(let [name, title] of [
            ["kills", "終結玩家"],
            ["damage", "造成傷害"],
            ["rounds", "存活回合"],
            ["level", "最終等級"],
        ]){infoStatsHtml += `
        <div class="stats-item vertical-stretched-border" data-name="${name}">
            <div class="stats-title">
                <span>${title}</span>
            </div>
            <div class="stats-detail">
                <span></span>
            </div>
        </div>`};
        let compStatsHtml = `
        <div class="stats-item" data-level="" style="display:none">
            <div class="mask"></div>
            <span></span>
        </div>`.repeat(9);
        let compUnitsHtml = `
        <div class="unit-item" data-cost="" style="display:none">
            <div class="clip-path-hexagon unit-icon">
                <div class="clip-path-hexagon">
                    <img src="">
                </div>
            </div>
            <div class="unit-stars">
                <div class="mask"></div>
                <div class="mask"></div>
                <div class="mask"></div>
            </div>
            <div class="unit-build">
                <img class="unit-build-item" src="" style="display:none">
                <img class="unit-build-item" src="" style="display:none">
                <img class="unit-build-item" src="" style="display:none">
            </div>
            <span class="unit-name"></span>
        </div>`.repeat(9);
        let html = `
        <li class="recent-matches-item tft-build-overview" win="">
            <div class="matches-item-icon overview-icon overview-part vertical-stretched-border">
                <div class="wrapper">
                    <div class="icon">
                        <img src="" alt="">
                    </div>
                    <span></span>
                </div>
            </div>
            <div class="matches-item-info overview-info overview-part">
                <div class="info-basic">
                    <div class="basic-name hover-pointer">第<span></span>名</div>
                    <div class="basic-cost">
                        <div class="mask"></div>
                        <span></span>
                    </div>
                </div>
                <div class="info-stats">${infoStatsHtml}</div>
            </div>
            <div class="matches-item-comp overview-comp overview-part">
                <div class="comp-stats">${compStatsHtml}</div>
                <div class="comp-units">${compUnitsHtml}</div>
            </div>
        </li>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        let container = $(this.element).find(".recent-matches-inner");
        let puuid = this.data["summoner"]["puuid"];

        let tftChampionsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/tftchampions.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[c["character_record"]["character_id"], c["character_record"]]))));
        });
        let tftItemsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((i)=>[i["nameId"], i]))));
        });
        let tftTraitsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/tfttraits.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((t)=>[t["trait_id"], t]))));
        });
        let tftCompanionsPromise = new Promise((resolve, reject)=>{
            let requestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/companions.json";
            $.get(requestURL, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[c["contentId"], c]))));
        });

        Promise.all([
            tftChampionsPromise,
            tftItemsPromise,
            tftTraitsPromise,
            tftCompanionsPromise,
        ]).then(([
            tftChampions,
            tftItems,
            tftTraits,
            tftCompanions,
        ])=>{
            $.get("/riot/lcu/0/lol-tft-team-planner/v1/team/dirty", {}, (tftPlannerRequest)=>{
                if(!tftPlannerRequest["success"]) return;
                let latestSetTag = tftPlannerRequest["response"]["setName"];
                let requestURL = `/riot/lcu/0/lol-match-history/v1/products/tft/${puuid}/matches`;
                $.get(requestURL, {"begin":0, "count":25, "tags":JSON.stringify([latestSetTag, ])}, (data)=>{
                    if(data["success"]){
                        container.empty();
                        let games = data["response"]["games"];
                        if(games.length === 0) container.html(`<li class="recent-matches-holder">
                        <img src="/ui/assets/media/app-indication/empty.png" alt=""></li>`);
                        let displayMatch = ((index)=>{
                            return new Promise((resolve, reject)=>{
                                let ele = this.CreateInnerItem(container).hide(0);

                                let player = games[index]["json"]["participants"].sort((a, b)=>{
                                    return (b["puuid"]===puuid)-(a["puuid"]===puuid);
                                })[0];
    
                                ele.attr("data-id", games[index]["json"]["game_id"]);
                                ele.attr("win", +(player["placement"]*2 < games[index]["json"]["participants"].length));
        
                                ele.find(".overview-icon .wrapper .icon img").attr("src", 
                                    window.ToCDragonPath(tftCompanions[player["companion"]["content_ID"]]["loadoutsIcon"])
                                );
                                ele.find(".overview-icon .wrapper span").text(player["level"]);
        
                                ele.find(".info-basic .basic-name span").text(player["placement"]);
                                ele.find(".info-basic .basic-cost span").text(player["gold_left"]);
        
                                ele.find(".info-stats .stats-item[data-name='kills'] .stats-detail span").text(player["players_eliminated"]);
                                ele.find(".info-stats .stats-item[data-name='damage'] .stats-detail span").text(player["total_damage_to_players"]);
                                ele.find(".info-stats .stats-item[data-name='rounds'] .stats-detail span").text(player["last_round"]);
                                ele.find(".info-stats .stats-item[data-name='level'] .stats-detail span").text(player["level"]);
            
                                let statIdx = 0;
                                player["traits"].forEach((trait)=>{
                                    if(!trait["style"] || statIdx >= 9) return;
                                    let statElement = ele.find(".comp-stats .stats-item").eq(statIdx);
                                    statElement.show(0);
                                    statElement.attr("data-level", trait["style"]);
                                    try{statElement.find(".mask").css("--mask-image", `url(${
                                        window.ToCDragonPath(tftTraits[trait["name"]]["icon_path"])
                                    })`)}catch(e){console.log(e)}
                                    statElement.find("span").text(trait["num_units"]);
                                    statIdx++;
                                });
        
                                let unitIdx = 0;
                                player["units"].forEach((unit)=>{
                                    if(unitIdx >= 9) return;
                                    let unitElement = ele.find(".comp-units .unit-item").eq(unitIdx);
                                    unitElement.show(0);
                                    unitElement.attr("data-cost", [1, 2, 3, 4, 4, 5, 5][unit["rarity"]]);
                                    try{unitElement.find(".unit-icon img").attr("src", 
                                        window.ToCDragonPath(tftChampions[unit["character_id"]]["squareIconPath"])
                                    )}catch(e){console.log(e)}
                                    unitElement.find(".unit-stars").html(`
                                        <div class="mask"></div>
                                    `.repeat(unit["tier"]));
                                    unitElement.find(".unit-build img").each(function(i){
                                        if(i >= unit["itemNames"].length) return;
                                        try{$(this).attr("src", window.ToCDragonPath(
                                            tftItems[unit["itemNames"][i]]["loadoutsIcon"]
                                        ))}catch(e){console.log(e)}
                                        $(this).show(0);
                                    });
                                    try{unitElement.find(".unit-name").text(
                                        tftChampions[unit["character_id"]]["display_name"]
                                    )}catch(e){console.log(e)}
                                    unitIdx++;
                                });

                                resolve(ele.show(0));
                            }).then(()=>(index+1<games.length)?displayMatch(index+1):Promise.resolve());
                        });
                        displayMatch(0);
                    }
                });
            });
        });
    }
}