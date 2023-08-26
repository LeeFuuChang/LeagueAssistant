class Main_TftMatchHistory extends AppBodyMain {
    static pageType = "tft";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            ["tft-recent-matches", Main_Part_TftRecentMatches, window.MakeData({summoner:this.data["summoner"]}), 0],
        ]);
    }
}