class Main_LolChallenges extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([{
            "name": "lol-challenge-list", 
            "class": Main_Part_LolChallengeList, 
            "data": window.MakeData({
                functions: {
                    "ShowChallengeThreshold": this.ShowChallengeThreshold
                }
            }),
        }, {
            "name": "lol-challenge-thresholds",
            "class": Main_Part_LolChallengeThresholds, 
            "data": window.MakeData(), 
        }]);
    }

    ShowChallengeThreshold = (challengeCategoryId, challengeId)=>{
        return this.components["lol-challenge-thresholds"].ShowChallengeThreshold(challengeCategoryId, challengeId);
    }
}