class Main_LolTrend extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        let loading;
        if(this.data["lower-alias"] && this.data["position"]){
            loading = [
                ["lol-champion-list", Main_Part_LolChampionList, window.MakeData({functions:{"OnChampionSelected":this.OnChampionSelected},options:{"include-none":false}}), 0],
                ["lol-champion-build", Main_Part_LolChampionBuild, window.MakeData({functions:{"OnChampionSelected":this.OnChampionSelected},identifier:{"lower-alias":this.data["lower-alias"], "position":this.data["position"]}}), 1],
            ];
        }else{
            loading = [
                ["lol-champion-list", Main_Part_LolChampionList, window.MakeData({functions:{"OnChampionSelected":this.OnChampionSelected},options:{"include-none":false}}), 0],
                ["lol-champion-tiers", Main_Part_LolChampionTiers, window.MakeData({functions:{"OnChampionSelected":this.OnChampionSelected}}), 1],
            ];
        }
        this.LoadComponents(loading);
    }

    OnChampionSelected = (championElement, componentIdentifier)=>{
        return Promise.all([
            this.RemoveComponent("lol-champion-tiers"),
            this.RemoveComponent("lol-champion-build"),
        ]).then(()=>{
            return this.AddComponent("lol-champion-build", Main_Part_LolChampionBuild, window.MakeData({
                functions:{
                    "OnChampionSelected":this.OnChampionSelected
                },
                identifier:{
                    "lower-alias":$(championElement).attr("data-lower-alias"), 
                    "position":$(championElement).attr("data-position"),
                },
            }), 1);
        });
    }
}