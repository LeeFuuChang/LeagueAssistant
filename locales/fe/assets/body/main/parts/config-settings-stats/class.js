class Main_Part_ConfigSettingsStats extends Main_Part_Config_Abstract {
    static elementURL = "/ui/assets/body/main/parts/config-settings-stats/element.html";

    static defaultCustomPairs = {
        "settings/stats/select-send/options/winrate-default": {
            "inputs": ".config-group[data-name='select-send'] .config-item[data-name='nickname'] .option input",
            "values": ["超級雞馬", "上等馬", "中等馬", "下等馬", "沒有馬"],
            "isReadOnly": true
        },
        "settings/stats/select-send/options/winrate-custom": {
            "inputs": ".config-group[data-name='select-send'] .config-item[data-name='nickname'] .option input",
            "values": ["", "", "", "", ""],
            "isReadOnly": false
        },
        "settings/stats/select-send/options/kda-default": {
            "inputs": ".config-group[data-name='select-send'] .config-item[data-name='nickname'] .option input",
            "values": ["超級雞馬", "上等馬", "中等馬", "下等馬", "沒有馬"],
            "isReadOnly": true
        },
        "settings/stats/select-send/options/kda-custom": {
            "inputs": ".config-group[data-name='select-send'] .config-item[data-name='nickname'] .option input",
            "values": ["", "", "", "", ""],
            "isReadOnly": false
        },

        "settings/stats/progress-send/options/winrate-default": {
            "inputs": ".config-group[data-name='progress-send'] .config-item[data-name='nickname'] .option input",
            "values": ["超級雞馬", "上等馬", "中等馬", "下等馬", "沒有馬"],
            "isReadOnly": true
        },
        "settings/stats/progress-send/options/winrate-custom": {
            "inputs": ".config-group[data-name='progress-send'] .config-item[data-name='nickname'] .option input",
            "values": ["", "", "", "", ""],
            "isReadOnly": false
        },
        "settings/stats/progress-send/options/kda-default": {
            "inputs": ".config-group[data-name='progress-send'] .config-item[data-name='nickname'] .option input",
            "values": ["超級雞馬", "上等馬", "中等馬", "下等馬", "沒有馬"],
            "isReadOnly": true
        },
        "settings/stats/progress-send/options/kda-custom": {
            "inputs": ".config-group[data-name='progress-send'] .config-item[data-name='nickname'] .option input",
            "values": ["", "", "", "", ""],
            "isReadOnly": false
        }
    };
}