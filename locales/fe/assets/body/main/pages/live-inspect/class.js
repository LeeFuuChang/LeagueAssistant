class Main_LiveInspect extends AppBodyMain {
    static pageType = "live-inspect";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "live-game-player-list",
            "class": Main_Part_LiveGamePlayerList,
            "data": window.MakeData(),
        }]);
    }
}