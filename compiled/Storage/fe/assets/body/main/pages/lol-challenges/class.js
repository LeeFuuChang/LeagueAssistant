class Main_LolChallenges extends AppBodyMain {
    static pageType = "lol";

    constructor(container, data){
        super(container, data);
        this.LoadComponents([
            ["lol-challenge-list", Main_Part_LolChallengeList, window.MakeData({functions:{"ShowChallengeThreshold":this.ShowChallengeThreshold}}), 0],
            ["lol-challenge-thresholds", Main_Part_LolChallengeThresholds, window.MakeData(), 1],
        ]);
    }

    ShowChallengeThreshold = (challengeCategoryId, challengeId)=>{
        return this.components["lol-challenge-thresholds"].ShowChallengeThreshold(challengeCategoryId, challengeId);
    }
}