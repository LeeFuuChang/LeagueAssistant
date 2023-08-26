class Main_TftTrend extends AppBodyMain {
    static pageType = "tft";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            ["tft-comp-tiers", Main_Part_TftCompTiers, window.MakeData({functions:{"LoadCompBuild":this.LoadCompBuild}}), 0],
        ]);
    }

    LoadCompBuild = (data)=>{
        return Promise.all([
            this.RemoveComponent("tft-comp-tiers"),
        ]).then(()=>{
            return this.AddComponent("tft-comp-build", Main_Part_TftCompBuild, data, 0)
        });
    }
}