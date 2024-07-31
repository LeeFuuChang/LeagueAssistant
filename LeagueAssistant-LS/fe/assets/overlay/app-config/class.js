class AppOverlay_AppConfig extends AppOverlay {
    static elementURL = "/ui/assets/overlay/app-config/element.html";

    Setup = ()=>{
        window.Widgets.Setup_Stepper($(this.element).find(".config-item .option .stepper"));

        $(this.element).find("input[name='dark-theme']").on("change", function(){
            window.switchTheme(($(this).is(":checked"))?"dark":"light")
        });

        $(this.element).find("input").on("change", this.SaveAppConfig);

        this.ReloadContent();
    }

    SaveAppConfig = ()=>{
        return new Promise((resolve, reject)=>{
            let data = { "window-scale": parseFloat($(this.element).find("input[name='window-scale']").val())||1 };
            for(let inp of $(this.element).find("input[type='checkbox']")) {
                data[$(inp).attr("name")] = $(inp).prop("checked");
            }
            return resolve(data);
        }).then((data)=>{
            return $.post("/app/config/app.json", JSON.stringify(data));
        });
    }

    ReloadContent = ()=>{
        $.get(`/app/config/app.json`, {}, (data)=>{
            Object.entries(data).forEach(([name, value])=>{
                let inp = $(this.element).find(`input[name="${name}"]`);
                if($(inp).is("[type='checkbox']")) {
                    $(inp).prop("checked", value);
                }
                else {
                    $(inp).val(value);
                }
            });
        });
    }
}