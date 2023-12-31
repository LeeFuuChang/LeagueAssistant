class Main_Part_TftCompBuild extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/tft-comp-build/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        this.SetupPageControl([{
            pageName: "最終配置",
            value: ".guide-final-comp"
        }, {
            pageName: "前期配置",
            value: ".guide-early-comp"
        }, {
            pageName: "中期配置",
            value: ".guide-mid-comp"
        }], this.ReloadContent);
        this.ReloadContent();
    }

    ReloadContent = ()=>{
        let tftChampionsPromise = new Promise((resolve, reject)=>{
            let tftChampions = {};
            let tftChampionsRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/tftchampions.json";
            $.get(tftChampionsRequestURL, {}, (data)=>{
                for(let c of data) tftChampions[c["character_id"]] = c;
                resolve(tftChampions);
            });
        });
        let tftItemsPromise = new Promise((resolve, reject)=>{
            let tftItems = {};
            let tftItemsRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/tftitems.json";
            $.get(tftItemsRequestURL, {}, (data)=>{
                for(let c of data) tftItems[c["nameId"]] = c;
                resolve(tftItems);
            });
        });
        let tftTraitsPromise = new Promise((resolve, reject)=>{
            let tftTraits = {};
            let tftTraitsRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/tfttraits.json";
            $.get(tftTraitsRequestURL, {}, (data)=>{
                for(let c of data) tftTraits[c["trait_id"]] = c;
                resolve(tftTraits);
            });
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
            $.get(`/opgg/tft-api/api/v1/decks/${this.data["identifier"]["id"]}`, (compData)=>{
                $(this.element).find(".comp-guide .comp-guide-pages").css("left", `${-100*this.currentPageIndex}%`);
    
                let compItem = $(this.element).find(".tft-build-overview");
                compItem.find(".overview-tier").attr("data-tier", compData["data"]["opTier"]);
    
                compItem.find(".info-basic .basic-name").text(compData["data"]["name"]["zh_TW"]);
                compItem.find(".info-basic .basic-cost span").text(compData["data"]["cost"]);

                compItem.find(".info-stats .stats-item[data-name='average-placement'] .stats-detail span").text(
                    compData["data"]["stat"]["avgPlacement"].toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='first-rate'] .stats-detail span").text(
                    (compData["data"]["stat"]["winRate"]*100).toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='top4-rate'] .stats-detail span").text(
                    (compData["data"]["stat"]["top4Rate"]*100).toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='pick-rate'] .stats-detail span").text(
                    ((compData["data"]["stat"]["compsCount"]/compData["data"]["stat"]["totalCount"])*100).toFixed(2)
                );
    
                let statIdx = 0;
                compData["data"]["traits"].forEach((trait)=>{
                    if(!trait["style"] || statIdx >= 9) return;
                    let statElement = compItem.find(".overview-comp .comp-stats .stat-item").eq(statIdx);
                    statElement.show(0);
                    statElement.attr("data-level", trait["style"]);
                    try{statElement.find(".mask").css("--mask-image", `url(${
                        window.ToCDragonPath(tftTraits[trait["key"]]["icon_path"])
                    })`)}catch(e){console.log(e)}
                    statElement.find("span").text(trait["numUnits"]);
                    statIdx++;
                });
    
                let unitIdx = 0;
                compData["data"]["units"].forEach((unit)=>{
                    if(!this.data["identifier"]["fallback"]["CHAMPIONS"][unit["key"]]["cost"] || unitIdx >= 9) return;
                    let unitElement = compItem.find(".overview-comp .comp-units .unit-item").eq(unitIdx);
                    unitElement.show(0);
                    unitElement.attr("data-cost", this.data["identifier"]["fallback"]["CHAMPIONS"][unit["key"]]["cost"]);
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
                    unitIdx++;
                });

    
                let setupCompBoard = (data, ele)=>{
                    let statIdx = 0;
                    data["traits"].forEach((trait)=>{
                        if(!trait["style"] || statIdx >= 9) return;
                        let statElement = ele.find(".comp-stats .stats-item").eq(statIdx);
                        statElement.show(0);
                        statElement.attr("data-level", trait["style"]);
                        try{statElement.find(".stats-icon .mask").css("--mask-image", `url(${
                            window.ToCDragonPath(tftTraits[trait["key"]]["icon_path"])
                        })`)}catch(e){console.log(e)}
                        statElement.find(".stats-level span").text(trait["numUnits"]);
                        statElement.find(".stats-detail .detail-name").text(
                            tftTraits[trait["key"]]["display_name"]
                        );
                        statElement.find(".stats-detail .detail-level").html(
                            tftTraits[trait["key"]]["conditional_trait_sets"].map(s=>`<span class=${(
                                s["min_units"] <= trait["numUnits"] && 
                                trait["numUnits"] <= (s["max_units"]?s["max_units"]:trait["numUnits"])
                            )?"active":""}>${s["min_units"]}</span>`).join(" > ")
                        );
                        statIdx++;
                    });
        
                    let unitIdx = 0;
                    data["units"].forEach((unit)=>{
                        if(!this.data["identifier"]["fallback"]["CHAMPIONS"][unit["key"]]["cost"] || unitIdx >= 9) return;
                        let boardElement = ele.find(".comp-board");
                        let boardRowElement = boardElement.find(".comp-board-row").eq(4-unit["cell"]["y"]);
                        let unitElement = boardRowElement.find(".unit-item").eq(unit["cell"]["x"]-1);
                        unitElement.show(0);
                        unitElement.attr("data-cost", this.data["identifier"]["fallback"]["CHAMPIONS"][unit["key"]]["cost"]);
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
                        unitIdx++;
                    });
    
                    let itemIdx = 0;
                    data["units"].map(c=>c["items"]).reduce((a, b)=>a.concat(b)).forEach((item)=>{
                        if(itemIdx >= 10) return;
                        let itemElement = ele.find(".comp-items .item").eq(itemIdx);
                        itemElement.show(0);
                        try{itemElement.find(".item-icon").attr("src", 
                            window.ToCDragonPath(tftItems[item]["loadoutsIcon"])
                        )}catch(e){console.log(e)}
                        let itemData = this.data["identifier"]["fallback"]["ITEMS"][item];
                        for(let i=0; i<2; i++){
                            try{itemElement.find(".item-craft .item-craft-sub").eq(i).attr("src", 
                                window.ToCDragonPath(tftItems[itemData["composition"][i]]["loadoutsIcon"])
                            )}catch(e){console.log(e)}
                        }
                        itemIdx++;
                    });
                }
                let guideFinalComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-final-comp");
                setupCompBoard(compData["data"], guideFinalComp);
                let guideEarlyComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-early-comp");
                setupCompBoard(compData["data"]["early"], guideEarlyComp);
                let guideMidComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-mid-comp");
                setupCompBoard(compData["data"]["middle"], guideMidComp);
            });
        });
    }
}