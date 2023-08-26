class Main_LolMatchHistory extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            ["lol-recent-matches", Main_Part_LolRecentMatches, window.MakeData({functions:{"loadGameId": this.LoadGameId}, summoner:this.data["summoner"]}), 0],
        ]);
    }

    LoadGameId = (matchElement)=>{
        return Promise.all([
            this.RemoveComponent("lol-match-detail"),
        ]).then(()=>{
            return this.AddComponent("lol-match-detail", Main_Part_LolMatchDetail, window.MakeData({identifier:{"gameId":$(matchElement).attr("game-id")}}), 1)
        });
    }
}