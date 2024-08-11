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
        return Promise.all([
            tftChampionsPromise,
            tftItemsPromise,
            tftTraitsPromise,
        ]).then(([
            tftChampions,
            tftItems,
            tftTraits,
        ])=>{
            $.get(`/opgg/tft/meta-trends/comps/${this.data["identifier"]["id"]}`, {}, (pageProps)=>{
                $(this.element).find(".comp-guide .comp-guide-pages").css("left", `${-100*this.currentPageIndex}%`);
    
                let compItem = $(this.element).find(".tft-build-overview");
                compItem.find(".overview-tier").attr("data-tier", pageProps["deck"]["opTier"]);
    
                compItem.find(".info-basic .basic-name").text(pageProps["deck"]["name"]);
                compItem.find(".info-basic .basic-cost span").text(pageProps["deck"]["cost"]);

                compItem.find(".info-stats .stats-item[data-name='average-placement'] .stats-detail span").text(
                    pageProps["deck"]["stat"]["avgPlacement"].toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='first-rate'] .stats-detail span").text(
                    (pageProps["deck"]["stat"]["winRate"]*100).toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='top4-rate'] .stats-detail span").text(
                    (pageProps["deck"]["stat"]["top4Rate"]*100).toFixed(2)
                );
                compItem.find(".info-stats .stats-item[data-name='pick-rate'] .stats-detail span").text(
                    ((pageProps["deck"]["stat"]["compsCount"]/pageProps["deck"]["stat"]["totalCount"])*100).toFixed(2)
                );
    
                pageProps["deck"]["traits"].forEach((trait, traitIdx)=>{
                    if(!trait["style"] || traitIdx >= 9) return;
                    let statElement = compItem.find(".overview-comp .comp-stats .stat-item").eq(traitIdx);
                    statElement.show(0);
                    statElement.attr("data-level", trait["style"]);
                    try{statElement.find(".mask").css("--mask-image", `url(${
                        window.ToCDragonPath(tftTraits[trait["key"]]["icon_path"])
                    })`)}catch(e){console.log(e)}
                    statElement.find("span").text(trait["numUnits"]);
                });
    
                pageProps["deck"]["units"].forEach((unit, unitIdx)=>{
                    if(!unit["champion"]["cost"] || unitIdx >= 9) return;
                    let unitElement = compItem.find(".overview-comp .comp-units .unit-item").eq(unitIdx);
                    unitElement.show(0);
                    unitElement.attr("data-cost", unit["champion"]["cost"]);
                    try{unitElement.find(".unit-icon img").attr("src", 
                        window.ToCDragonPath(tftChampions[unit["key"]]["squareIconPath"])
                    )}catch(e){console.log(e)}
                    if(unit["isThreeStar"]) unitElement.find(".unit-stars").show(0);
                    unitElement.find(".unit-build img").each(function(i){
                        if(!unit["items"][i]) return;
                        try{$(this).attr("src", window.ToCDragonPath(
                            tftItems[unit["items"][i]]["squareIconPath"]
                        ))}catch(e){console.log(e)}
                        $(this).show(0);
                    });
                    try{unitElement.find(".unit-name").text(
                        tftChampions[unit["key"]]["display_name"]
                    )}catch(e){console.log(e)}
                });

                let setupCompBoard = (data, ele)=>{
                    data["traits"].forEach((trait, traitIdx)=>{
                        if(!trait["style"] || traitIdx >= 9) return;
                        let statElement = ele.find(".comp-stats .stats-item").eq(traitIdx);
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
                    });

                    let champCosts = Object.fromEntries(
                        pageProps["deck"]["units"]
                            .map(c=>[c["key"], c["champion"]["cost"]])
                    );
        
                    ele.find(".comp-board .unit-icon img").hide(0);
                    data["units"].forEach((unit, unitIdx)=>{
                        if(!champCosts[unit["key"]] || unitIdx >= 9) return;
                        let boardElement = ele.find(".comp-board");
                        let boardRowElement = boardElement.find(".comp-board-row").eq(4-unit["cell"]["y"]);
                        let unitElement = boardRowElement.find(".unit-item").eq(unit["cell"]["x"]-1);
                        unitElement.attr("data-cost", champCosts[unit["key"]]);
                        try{unitElement.find(".unit-icon img").attr("src", 
                            window.ToCDragonPath(tftChampions[unit["key"]]["squareIconPath"])
                        ).show(0)}catch(e){console.log(e)}
                        if(unit["isThreeStar"]) unitElement.find(".unit-stars").show(0);
                        unitElement.find(".unit-build img").each(function(i){
                            if(!unit["items"][i]) return;
                            try{$(this).attr("src", window.ToCDragonPath(
                                tftItems[unit["items"][i]]["squareIconPath"]
                            ))}catch(e){console.log(e)}
                            $(this).show(0);
                        });
                        try{unitElement.find(".unit-name").text(
                            tftChampions[unit["key"]]["display_name"]
                        )}catch(e){console.log(e)}
                    });

                    let composition = Object.fromEntries(
                        pageProps["deck"]["coreChampions"]
                            .map(c=>c["itemBuilds"]).reduce((a, b)=>a.concat(b))
                            .map(b=>b["items"]).reduce((a, b)=>a.concat(b))
                            .map(i=>[i["apiName"], i["composition"]])
                    );

                    [...new Set(data["units"].map(c=>c["items"]).reduce((a, b)=>a.concat(b)))]
                        .filter((i)=>composition[i])
                        .forEach((item, itemIdx)=>{
                            if(itemIdx >= 10) return;
                            let itemElement = ele.find(".comp-items .item").eq(itemIdx);
                            itemElement.show(0);
                            try{itemElement.find(".item-icon").attr("src", 
                                window.ToCDragonPath(tftItems[item]["squareIconPath"])
                            )}catch(e){console.log(e)}
                            for(let i=0; i<2; i++){
                                try{itemElement.find(".item-craft .item-craft-sub").eq(i).attr("src", 
                                    window.ToCDragonPath(tftItems[composition[item][i]]["squareIconPath"])
                                )}catch(e){console.log(e)}
                            }
                        });
                }
                let guideFinalComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-final-comp");
                setupCompBoard(pageProps["deck"], guideFinalComp);
                let guideEarlyComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-early-comp");
                setupCompBoard(pageProps["deck"]["early"], guideEarlyComp);
                let guideMidComp = $(this.element).find(".comp-guide .comp-guide-pages .guide-mid-comp");
                setupCompBoard(pageProps["deck"]["middle"], guideMidComp);
            });
        });
    }
}