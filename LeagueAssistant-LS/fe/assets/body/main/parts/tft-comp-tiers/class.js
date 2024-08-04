class Main_Part_TftCompTiers extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/tft-comp-tiers/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let infoStatsHtml = "";
        for(let [name, title] of [
            ["average-placement", "平均排名"],
            ["first-rate", "吃雞率"],
            ["top4-rate", "前四率"],
            ["pick-rate", "使用率"],
        ]){
            infoStatsHtml += `
            <div class="stats-item vertical-stretched-border" data-name="${name}">
                <div class="stats-title">
                    <span>${title}</span>
                </div>
                <div class="stats-detail">
                    <span></span>
                </div>
            </div>`;
        }
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
            <div class="unit-stars" style="display:none">
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
        <li class="tft-build-overview">
            <div class="overview-tier overview-part vertical-stretched-border" data-tier=""></div>
            <div class="overview-info overview-part">
                <div class="info-basic">
                    <div class="basic-name hover-pointer">第 <span></span> 名</div>
                    <div class="basic-cost">
                        <div class="mask"></div>
                        <span></span>
                    </div>
                </div>
                <div class="info-stats">${infoStatsHtml}</div>
            </div>
            <div class="overview-comp overview-part">
                <div class="comp-stats">${compStatsHtml}</div>
                <div class="comp-units">${compUnitsHtml}</div>
            </div>
        </li>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
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
        Promise.all([
            tftChampionsPromise,
            tftItemsPromise,
            tftTraitsPromise,
        ]).then(([
            tftChampions,
            tftItems,
            tftTraits,
        ])=>{
            let container = $(this.element).find(".block-inner .tier-list");
            let rankTier = $(this.element).find(".options-rank .drop-down-menu-selected").attr("data-label");
            let compTier = $(this.element).find(".options-tier .drop-down-menu-selected").attr("data-label");

            container.empty();

            $.get(`/opgg/tft/meta-trends/comps?mode=RANKED_TFT&tier=${rankTier}`, {}, (pageProps)=>{
                let sorted = pageProps["decks"].filter((deck)=>{
                    return (!compTier || compTier===deck["opTier"]);
                }).sort((a, b)=>{
                    let tiers = ["E", "D", "C", "B", "A", "S", "OP"];
                    let aTier = tiers.indexOf(a["opTier"]);
                    let bTier = tiers.indexOf(b["opTier"]);
                    return bTier-aTier;
                });
                let displayDeck = (deckIndex)=>{
                    return new Promise((resolve, reject)=>{
                        let deck = sorted[deckIndex];
                        let ele = this.CreateInnerItem(container).hide(0);

                        ele.attr("data-id", deck["id"])
                        ele.on("click", ()=>{this.data["functions"]["LoadCompBuild"](
                            window.MakeData({identifier:{
                                "id":deck["id"], 
                                "fallback":pageProps["fallback"]
                            }})
                        )});
    
                        ele.find(".overview-tier").attr("data-tier", deck["opTier"]);

                        ele.find(".info-basic .basic-name").text(deck["name"]);
                        $.get(`/opgg/tft-api/api/v1/decks/${deck["id"]}`, (compData)=>{
                            ele.find(".info-basic .basic-name").text(compData["data"]["name"]["zh_TW"]);
                        });
                        ele.find(".info-basic .basic-cost span").text(deck["cost"]);

                        ele.find(".info-stats .stats-item[data-name='average-placement'] .stats-detail").html(
                            `<span>${deck["stat"]["avgPlacement"].toFixed(2)}</span>%`
                        );
                        ele.find(".info-stats .stats-item[data-name='first-rate'] .stats-detail").html(
                            `<span>${(deck["stat"]["winRate"]*100).toFixed(2)}</span>%`
                        );
                        ele.find(".info-stats .stats-item[data-name='top4-rate'] .stats-detail").html(
                            `<span>${(deck["stat"]["top4Rate"]*100).toFixed(2)}</span>%`
                        );
                        ele.find(".info-stats .stats-item[data-name='pick-rate'] .stats-detail").html(
                            `<span>${((deck["stat"]["compsCount"]/deck["stat"]["totalCount"])*100).toFixed(2)}</span>%`
                        );

                        let statIdx = 0;
                        deck["traits"].forEach((trait)=>{
                            if(!trait["style"] || statIdx >= 9) return;
                            let statElement = ele.find(".comp-stats .stats-item").eq(statIdx);
                            statElement.show(0);
                            statElement.attr("data-level", trait["style"]);
                            try{statElement.find(".mask").css("--mask-image", `url(${
                                window.ToCDragonPath(tftTraits[trait["key"]]["icon_path"])
                            })`)}catch(e){console.log(e)}
                            statElement.find("span").text(trait["numUnits"]);
                            statIdx++;
                        });

                        deck["units"].forEach((unit, unitIdx)=>{
                            if(!unit["champion"]["cost"] || unitIdx >= 9) return;
                            let unitElement = ele.find(".comp-units .unit-item").eq(unitIdx);
                            unitElement.show(0);
                            unitElement.attr("data-cost", unit["champion"]["cost"]);
                            try{unitElement.find(".unit-icon img").attr("src", 
                                window.ToCDragonPath(tftChampions[unit["key"]]["squareIconPath"])
                            )}catch(e){console.log(e)}
                            if(unit["isThreeStar"]) unitElement.find(".unit-stars").show(0);
                            unitElement.find(".unit-build img").each(function(i){
                                if(i >= unit["items"].length) return;
                                try{$(this).attr("src", window.ToCDragonPath(
                                    tftItems[unit["items"][i]]["loadoutsIcon"]
                                ))}catch(e){console.log(e)}
                                $(this).show(0);
                            });
                            try{unitElement.find(".unit-name").text(
                                tftChampions[unit["key"]]["display_name"]
                            )}catch(e){console.log(e)}
                        });

                        resolve(ele.show(0));
                    }).then(()=>(deckIndex+1<sorted.length)?displayDeck(deckIndex+1):Promise.resolve());
                };
                displayDeck(0);
            });
        });
    }
}