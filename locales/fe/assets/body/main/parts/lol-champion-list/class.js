class Main_Part_LolChampionList extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/lol-champion-list/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        window.Widgets.SetupTextFilter($(this.element).find(".lol-champion-list>.block-inner"));
        $(this.element).find(".drop-down-menu").get().forEach((menu)=>window.Widgets.SetupDropDownMenu(menu, this.ReloadContent));
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="text-filter-item champion hover-pointer" data-filter="">
            <img src="" alt="">
            <span></span>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        new Promise((resolve, reject)=>{
            let championSummaryRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/champion-summary.json";
            $.get(championSummaryRequestURL, {}, (data)=>resolve(Object.fromEntries(data.map((c)=>[parseInt(c.id),c]))));
        }).then((championSummary)=>{
            let includingNone = (this.data["options"]["include-none"]!==undefined&&this.data["options"]["include-none"]);
            let container = $(this.element).find(".champion-wrapper");
            let textFilter = $(this.element).find(".filter-by-text input").val();
            let positionFilter = $(this.element).find(".filter-by-position .drop-down-menu-selected").attr("data-label");

            container.empty();

            let addInner = (id, name, lowerAlias, positions, imageSrc)=>{
                let ele = this.CreateInnerItem(container);
                let dataFilter = `${lowerAlias} ${name}`;
                if(!dataFilter.includes(textFilter)){ele.hide(0)}else{ele.show(0)}
                if(positionFilter && !positions.includes(positionFilter)){ele.hide(0)}else{ele.show(0)}
                ele.attr("data-id", id);
                ele.attr("data-lower-alias", lowerAlias);
                ele.attr("data-position", positions[0]);
                ele.attr("data-filter", dataFilter);
                ele.find("img").attr("src", imageSrc);
                ele.find("span").text(name);
                let OnChampionSelected = this.data["functions"]["OnChampionSelected"];
                ele.on("click", function(){OnChampionSelected(lowerAlias, positions[0])});
            };

            new Promise((resolve, reject)=>{
                if(!includingNone) return resolve();
                resolve(addInner(
                    championSummary[-1]["id"],
                    championSummary[-1]["name"],
                    championSummary[-1]["alias"].toLowerCase(),
                    [],
                    window.ToCDragonPath(championSummary[-1]["squarePortraitPath"])
                ));
            }).then(()=>{
                $.get("/opgg/lol/champions", {}, (pageProps)=>{
                    pageProps["championMetaList"].forEach(c=>addInner(
                        c["id"],
                        championSummary[c["id"]]["name"],
                        championSummary[c["id"]]["alias"].toLowerCase(),
                        c["positions"].map(p=>p["name"]),
                        `https://cdn.communitydragon.org/latest/champion/${c["id"]}/square`
                    ));
                });
            })
        });
    }
}