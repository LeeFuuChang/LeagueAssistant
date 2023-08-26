class Main_LiveInspect extends AppBodyMain {
    static pageType = "live-inspect";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            ["live-game-player-list", Main_Part_LiveGamePlayerList, window.MakeData(), 0],
        ]);
    }
}