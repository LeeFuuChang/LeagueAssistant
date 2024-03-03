class Main_Part_LolRecentMatches extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-recent-matches/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.FilterOptions));
        window.Widgets.SetupButtonGroup($(this.element).find(".matches-options .options-result .option-result-item"), this.FilterOptions);
        this.ReloadContent();
    }

    FetchStaticData = (lang)=>{
        let gameDataURL = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/${lang||"default"}/v1`;
        let summonerSpellsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/summoner-spells.json`, {}, (data)=>resolve(Object.fromEntries(data.map(s=>[parseInt(s.id),s["iconPath"]]))));
        });
        let perkIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perks.json`, {}, (data)=>resolve(Object.fromEntries(data.map(p=>[parseInt(p.id),p["iconPath"]]))));
        });
        let perkStyleIconsPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/perkstyles.json`, {}, (data)=>resolve(Object.fromEntries(data["styles"].map(p=>[parseInt(p.id),p["iconPath"]]))));
        });
        let queueNamesPromise = new Promise((resolve, reject)=>{
            $.get(`${gameDataURL}/queues.json`, {}, (data)=>resolve(Object.fromEntries(Object.keys(data).map(qid=>[parseInt(qid),data[qid]["name"]]))));
        });
        return Promise.all([
            summonerSpellsPromise,
            perkIconsPromise,
            perkStyleIconsPromise,
            queueNamesPromise,
        ])
    }

    FilterOptions = ()=>{
        let optionQueueId = $(this.element).find(".options-queue .drop-down-menu-selected").attr("data-label");
        let optionHideResult = $(this.element).find(".option-result-item.active").attr("data-hide-result");
        $(this.element).find(".matches-wrapper .recent-matches-item").each(function(){
            let showConditions = [
                (!optionQueueId || $(this).attr("queue-id")===optionQueueId),
                ($(this).attr("win")!==optionHideResult),
            ];
            $(this).toggle(showConditions.filter(b=>b).length === showConditions.length);
        });
    }

    CreateInnerItem = (container)=>{
        let html = `
        <li class="hover-pointer recent-matches-item" win="" game-id="">
            <div class="matches-item-game vertical-stretched-border">
                <div class="info champion">
                    <img src="" alt="">
                    <span></span>
                </div>
                <div class="info spells">
                    <img src="" alt="">
                    <img src="" alt="">
                </div>
                <div class="info runes">
                    <img src="" alt="">
                    <img src="" alt="">
                </div>
                <div class="info detail">
                    <div class="detail-kda">
                        <span class="detail-kda-k">
                        </span> / <span class="detail-kda-d">
                        </span> / <span class="detail-kda-a">
                        </span>
                    </div>
                    <div class="detail-queue"></div>
                </div>
            </div>
            <div class="matches-item-stats">
                <div class="stats-item" data-name="totalMinionsKilled">
                    <div class="mask"></div><span></span>
                </div>
                <div class="stats-item" data-name="goldEarned">
                    <div class="mask"></div><span></span>
                </div>
            </div>
        </li>`;
        return $(html).appendTo(container);
    }

    LoadMatches = ()=>{
        let container = $(this.element).find(".matches-wrapper");
        let puuid = this.data["summoner"]["puuid"];

        let batchCnt = 10;

        let begIndex = $(this.element).find(".matches-wrapper .recent-matches-item").length;
        let endIndex = begIndex + batchCnt - 1;

        if(begIndex >= batchCnt*10) return Promise.resolve();

        return this.FetchStaticData("zh_tw").then(([
            summonerSpells,
            perkIcons,
            perkStyleIcons,
            queueNames,
        ])=>{
            let requestURL = `/riot/lcu/0/lol-match-history/v1/products/lol/${puuid}/matches`;
            console.log(begIndex, endIndex);
            $.get(requestURL, {"begIndex": begIndex, "endIndex": endIndex}, (data)=>{
                if(!data["success"]) return Promise.resolve();
                let games = data["response"]["games"]["games"];
                if(begIndex === 0 && games.length === 0) container.html("<li class='recent-matches-holder'><img src='/ui/assets/media/app-indication/empty.png' alt=''></li>");
                window.Widgets.SetupDropDownMenu($(this.element).find(".drop-down-menu .drop-down-menu-ul").html([
                    `<li class="drop-down-menu-li hover-pointer horizontal-stretched-border" data-label="">
                        <img src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-fill.png" alt="">
                        <span>不限模式</span>
                    </li>`, 
                    Object.values(Object.fromEntries(games.map(g=>[g["queueId"], [g["mapId"], queueNames[g["queueId"]], g["queueId"]]]))).map(([mapId, queueName, queueId])=>{
                        let icon = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/gamemodex/img/social-icon-victory.png";
                        switch(parseInt(mapId)){
                            case 11:
                                icon = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/classic_sru/img/social-icon-victory.png";
                                break;
                            case 12:
                                icon = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets/aram/img/social-icon-victory.png";
                                break;
                        };
                        return `<li class="drop-down-menu-li hover-pointer horizontal-stretched-border" data-label="${queueId}"><img src="${icon}" alt=""><span>${queueName}</span></li>`;
                    }).join(""),
                ].join("")).closest(".drop-down-menu"), this.FilterOptions);
                let loadGame = (i)=>{
                    if(i >= games.length) return Promise.resolve();
                    return new Promise((resolve, reject)=>{
                        let championId = games[i]["participants"][0]["championId"];
                        let spell1Id = games[i]["participants"][0]["spell1Id"];
                        let spell2Id = games[i]["participants"][0]["spell2Id"];
                        let stats = games[i]["participants"][0]["stats"];
    
                        if(container.find(`.recent-matches-item[game-id="${games[i]["gameId"]}"]`).length) return resolve();
    
                        let ele = this.CreateInnerItem(container);
                        window.Widgets.SetupButtonGroup(ele, ()=>this.data["functions"]["loadGameId"](games[i]["gameId"]));
    
                        ele.attr({
                            "win": +stats["win"],
                            "map-id": games[i]["mapId"],
                            "queue-id": games[i]["queueId"],
                            "game-id": games[i]["gameId"],
                        });
                        if(begIndex===0 && i===0 && !this.data["identifier"]["gameId"]) ele.click();
                        else ele.toggleClass("active", (this.data["identifier"]["gameId"]===games[i]["gameId"]));
    
                        ele.find(".matches-item-game .champion img").attr("src",
                            `https://cdn.communitydragon.org/latest/champion/${championId}/square`
                        );
                        ele.find(".matches-item-game .champion span").text(stats["champLevel"]);
    
                        $(ele.find(".matches-item-game .spells img")[0]).attr("src", window.ToCDragonPath(summonerSpells[spell1Id]));
                        $(ele.find(".matches-item-game .spells img")[1]).attr("src", window.ToCDragonPath(summonerSpells[spell2Id]));
    
                        $(ele.find(".matches-item-game .runes img")[0]).attr("src", window.ToCDragonPath(perkIcons[stats["perk0"]])).toggle(stats["perk0"]>0);
                        $(ele.find(".matches-item-game .runes img")[1]).attr("src", window.ToCDragonPath(perkStyleIcons[stats["perkSubStyle"]])).toggle(stats["perkSubStyle"]>0);
    
                        ele.find(".matches-item-game .detail .detail-kda .detail-kda-k").text(stats["kills"]);
                        ele.find(".matches-item-game .detail .detail-kda .detail-kda-d").text(stats["deaths"]);
                        ele.find(".matches-item-game .detail .detail-kda .detail-kda-a").text(stats["assists"]);
        
                        ele.find(".matches-item-game .detail .detail-queue").text(queueNames[games[i]["queueId"]]);
        
                        ele.find(".matches-item-stats .stats-item[data-name='totalMinionsKilled'] span").text(
                            stats["neutralMinionsKilled"] + stats["totalMinionsKilled"]
                        );
                        ele.find(".matches-item-stats .stats-item[data-name='goldEarned'] span").text(stats["goldEarned"]);
                        return resolve(ele);
                    }).then(()=>loadGame(i+1));
                }
                return loadGame(0);
            });
        });
    }

    ReloadContent = ()=>{
        $(this.element).find(".matches-wrapper").empty();
        let LoadMatches = this.LoadMatches;
        $(this.element).find(".matches-container").on("scroll", function(){
            clearTimeout($.data(this, "scrollTimer"));
            $.data(this, "scrollTimer", setTimeout(()=>{
                console.log("Haven't scrolled in 250ms!");
                let e = $(this).find(".matches-wrapper .recent-matches-item").last();
                let v = Math.round(e.position().top + e.outerHeight(true) - $(this).scrollTop());
                let b = Math.round($(this).height());
                if(b-1 < v && v < b+1) LoadMatches();
            }, 100));
        });
        LoadMatches();
    }
}