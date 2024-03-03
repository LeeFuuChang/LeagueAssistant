class Main_Part_SummonerSpellList extends AppBodyMain_Part {
    static elementURL = "/ui/assets/body/main/parts/summoner-spell-list/element.html";

    constructor(container, data, index){
        super(container, data, index);
        this.CreateElement().then(()=>this.Setup());
    }

    Setup = ()=>{
        window.Widgets.SetupTextFilter($(this.element).find(".summoner-spell-list>.block-inner"));
        this.ReloadContent();
    }

    CreateInnerItem = (container)=>{
        let html = `
        <div class="text-filter-item spell hover-pointer" data-filter="">
            <img src="" alt="">
            <span></span>
        </div>`;
        return $(html).appendTo(container);
    }

    ReloadContent = ()=>{
        new Promise((resolve, reject)=>{
            let summonerSpellsRequestURL = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_tw/v1/summoner-spells.json";
            $.get(summonerSpellsRequestURL, {}, (data)=>resolve(data.filter((s)=>(s["gameModes"].includes("CLASSIC")))));
        }).then((summonerSpells)=>{
            let includingNone = (this.data["options"]["include-none"]!==undefined&&this.data["options"]["include-none"]);
            let container = $(this.element).find(".spell-wrapper");
            let textFilter = $(this.element).find(".filter-by-text input").val();

            container.empty();

            let addInner = (id, name, imageSrc)=>{
                let ele = this.CreateInnerItem(container);
                let dataFilter = `${id} ${name} ${imageSrc.substring(imageSrc.lastIndexOf("/")+1)}`;
                if(!dataFilter.includes(textFilter)){ele.hide(0)}else{ele.show(0)}
                ele.attr("data-id", id);
                ele.attr("data-filter", dataFilter);
                ele.find("img").attr("src", imageSrc);
                ele.find("span").text(name);
                let componentIdentifier = this.data["identifier"];
                let OnSpellSelected = this.data["functions"]["OnSpellSelected"];
                ele.on("click", function(){OnSpellSelected(this, componentIdentifier)});
            };

            new Promise((resolve, reject)=>{
                if(!includingNone) return resolve();
                resolve(addInner(-1, "無", "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/summoner_empty.png"));
            }).then(()=>{
                summonerSpells.forEach(s=>addInner(s["id"], s["name"], window.ToCDragonPath(s["iconPath"])));
            })
        });
    }
}