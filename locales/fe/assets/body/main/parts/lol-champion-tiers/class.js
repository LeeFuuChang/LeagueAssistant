class Main_Part_LolChampionTiers extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-champion-tiers/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        window.Widgets.SetupButtonGroup($(this.element).find(".list-options .options-positions .option-positions-item"), this.ReloadContent);
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <tr class="tier-list-item horizontal-stretched-border">
            <td class="list-item-index" data-trend="">
                <span></span>
                <div class="mask"></div>
            </td>
            <td class="list-item-champion">
                <div class="hover-pointer">
                    <img src="" alt="">
                    <span></span>
                </div>
            </td>
            <td class="list-item-tier" data-tier=""><span></span></td>
            <td class="list-item-wr"><span>100</span>%</td>
            <td class="list-item-pr"><span>100</span>%</td>
            <td class="list-item-br"><span>100</span>%</td>
        </tr>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        return new Promise((resolve, reject)=>{
            let championSummary = {};
            let championSummaryRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json";
            $.get(championSummaryRequestURL, {}, (data)=>{
                for(let c of data){
                    if(parseInt(c.id)<=0) continue;
                    championSummary[parseInt(c.id)] = c;
                }
                resolve(championSummary);
            });
        }).then((championSummary)=>{
            let container = $(this.element).find(".block-inner table tbody");
            let rankTier = $(this.element).find(".options-rank .drop-down-menu-selected").attr("data-label");
            let position = $(this.element).find(".option-positions-item.active").attr("data-position");
    
            container.empty();

            $.get(`/opgg/lol/champions?region=global&tier=${rankTier}&position=${position}`, {}, (pageProps)=>{
                pageProps["championRankingList"].sort((a, b)=>(a["positionRank"]-b["positionRank"])).forEach((c, idx)=>{
                    let ele = this.CreateInnerItem(container);

                    let index = ele.find(".list-item-index");
                    index.attr("data-trend", Math.sign(
                        c["positionTierData"]["rank_prev"]-c["positionTierData"]["rank"]
                    ));
                    index.find("span").text(idx+1);

                    let champ = ele.find(".list-item-champion .hover-pointer");
                    try{champ.find("img").attr("src",
                        `https://cdn.communitydragon.org/latest/champion/${c["id"]}/square`
                    )}catch(e){console.log(e)}
                    try{champ.find("span").text(
                        championSummary[c["id"]]["name"]
                    )}catch(e){console.log(e)}
                    let identifier = this.data["identifier"];
                    let OnChampionSelected = this.data["functions"]["OnChampionSelected"];
                    champ.attr("data-lower-alias", c["key"]);
                    champ.attr("data-position", position);
                    champ.on("click", function(){OnChampionSelected(c["key"], position, $(this), identifier)});

                    ele.find(".list-item-tier").attr("data-tier", c["positionTier"]);

                    ele.find(".list-item-wr").find("span").text(
                        (c["positionWinRate"]*100).toFixed(2)
                    );

                    ele.find(".list-item-pr").find("span").text(
                        (c["positionPickRate"]*100).toFixed(2)
                    );

                    ele.find(".list-item-br").find("span").text(
                        (c["positionBanRate"]*100).toFixed(2)
                    );
                });
            });
        });
    }
}