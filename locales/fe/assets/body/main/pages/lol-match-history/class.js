class Main_LolMatchHistory extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "lol-recent-matches",
            "class": Main_Part_LolRecentMatches,
            "data": window.MakeData({
                summoner: this.data["summoner"], 
                functions: {
                    "loadGameId": this.LoadGameId
                }, 
                identifier: this.data["identifier"]
            }),
        }]).then(()=>{
            return this.LoadGameId(this.data["identifier"]["gameId"]);
        });
    }

    LoadGameId = (gameId)=>{
        if(!gameId) return Promise.resolve();
        return Promise.all([
            this.RemoveComponent("lol-match-detail"),
        ]).then(()=>{
            return this.AddComponent("lol-match-detail", Main_Part_LolMatchDetail, window.MakeData({identifier:{"gameId":gameId}}), 1)
        });
    }
}