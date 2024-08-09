class Main_Part_ConfigAppearanceSpell extends Main_Part_Config_Abstract {
    static elementURL = "/ui/assets/body/main/parts/config-appearance-spell/element.html";

    ReloadContent = ()=>{
        let previewer = $(this.element).find(".preview-item[data-name='spell-single']");

        previewer.attr("data-type", 
            $($(this.element).find(".config-item[data-name='options'] .option input[type='radio'][name='ui-format']")
                .get().sort((a, b)=>($(b).is(":checked")-$(a).is(":checked")))[0]).closest(".option").attr("data-name")
        );

        ["notify", "counter"].forEach((colorConfigName)=>{
            let k = `${colorConfigName}-color`;
            let c = $(this.element).find(`.config-item[data-name="${k}"] .option[data-name="c"] input`).val();
            let a = $(this.element).find(`.config-item[data-name="${k}"] .option[data-name="a"] input`).val();
            previewer.css(`--${k}`, `${c}${parseInt((a/10)*255, 10).toString(16)}`);
        });

        return Promise.all(previewer.find(".item").get().map((item)=>new Promise((resolve, reject)=>{
            let requestURL = `/opgg/lol/champions?region=global&tier=platinum_plus&position=${$(item).attr("data-position")}`;
            $.get(requestURL, {}).always((pageProps)=>{
                if(pageProps["championRankingList"]){
                    let champId = pageProps["championRankingList"].sort((a, b)=>(a["positionRank"]-b["positionRank"]))[0]["id"];
                    $(item).find(".champion").attr("src", `https://cdn.communitydragon.org/latest/champion/${champId}/square`);
                }
                resolve();
            });
        })));
    }
}