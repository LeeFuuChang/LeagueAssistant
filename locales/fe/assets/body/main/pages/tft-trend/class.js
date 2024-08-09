class Main_TftTrend extends AppBodyMain {
    static pageType = "tft";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "tft-comp-tiers", 
            "class": Main_Part_TftCompTiers, 
            "data": window.MakeData({
                functions: {
                    "LoadCompBuild": this.LoadCompBuild
                }
            }), 
        }]);
    }

    LoadCompBuild = (data)=>{
        return Promise.all([
            this.RemoveComponent("tft-comp-tiers"),
        ]).then(()=>{
            return this.AddComponent("tft-comp-build", Main_Part_TftCompBuild, data, 0)
        });
    }
}