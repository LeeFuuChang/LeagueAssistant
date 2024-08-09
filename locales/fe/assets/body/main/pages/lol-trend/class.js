class Main_LolTrend extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        this.AddComponent(
            "lol-champion-list", 
            Main_Part_LolChampionList, 
            window.MakeData({
                functions:{"OnChampionSelected":this.OnChampionSelected},
                options:{"include-none":false}
            }), 
            0
        ).then(()=>{
            if(!this.data["identifier"]["lower-alias"]){
                return this.AddComponent(
                    "lol-champion-tiers", 
                    Main_Part_LolChampionTiers, 
                    window.MakeData({
                        functions:{"OnChampionSelected":this.OnChampionSelected}
                    }), 
                    1
                )
            }else return this.OnChampionSelected(this.data["identifier"]["lower-alias"], this.data["identifier"]["position"]);
        });
    }

    GetChampionPosition = ()=>{
        let qqPos2opggPos = {"top":"top","jungle":"jungle","mid":"mid","bottom":"adc","support":"support"};
        return new Promise((resolve, reject)=>{
            $.get(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json`, {}, (data)=>{
                return resolve(Object.fromEntries(data.map((c)=>[parseInt(c.id),c])));
            });
        }).then((championSummary)=>{
            return new Promise((resolve, reject)=>{
                $.get(`/qq/common/guideschampion_position.js?ts=${Date.now()/600000 >> 0}`).then((championPosition)=>{
                    return resolve(Object.fromEntries(Object.entries(championPosition["list"]).map((p)=>[
                        championSummary[parseInt(p[0])]["alias"].toLowerCase(), 
                        qqPos2opggPos[Object.keys(p[1]).sort((a, b)=>(parseInt(p[1][b])-parseInt(p[1][a])))[0]]
                    ])));
                });
            });
        });
    }

    OnChampionSelected = (lowerAlias, position)=>{
        return Promise.all([
            this.RemoveComponent("lol-champion-tiers"),
            this.RemoveComponent("lol-champion-build"),
        ]).then(()=>{
            return new Promise((resolve, reject)=>{
                if(position) return resolve(position);
                this.GetChampionPosition().then((championPosition)=>resolve(championPosition[lowerAlias]));
            });
        }).then((pos)=>{
            console.log(lowerAlias, position, pos);
            return this.AddComponent("lol-champion-build", Main_Part_LolChampionBuild, window.MakeData({
                functions:{
                    "OnChampionSelected":this.OnChampionSelected
                },
                identifier:{
                    "lower-alias":lowerAlias, 
                    "position":pos,
                },
            }), 1)
        });
    }
}