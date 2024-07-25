class AppOverlay_AppConfig extends AppOverlay {
    static elementURL = "/ui/assets/overlay/app-config/element.html";

    Setup = ()=>{
        window.Widgets.Setup_Stepper($(this.element).find(".config-item .option .stepper"));

        $(this.element).find(".config-item .option input").on("change", this.OnConfigChange);

        $(this.element).find(".config-item[data-name='options'] .option[data-name='dark-theme'] input")
        .on("change", function(){window.switchTheme(($(this).is(":checked"))?"dark":"light")});

        this.ReloadContent();
    }

    GetInputValue = (input)=>{
        let value;
        if($(input).is(".switch")){
            value = $(input).is(":checked")
        }else{
            value = $(input).val();
        }
        return value;
    }

    OnConfigChange = (event, upload=true)=>{
        if(!upload) return Promise.resolve();
        return new Promise((resolve, reject)=>{
            let item = $(event.currentTarget).closest(".config-item");
            let data = {};
            item.find(".option").get().forEach((option)=>{
                data[$(option).attr("data-name")] = this.GetInputValue($(option).find("input"));
            });
            resolve([item.attr("data-name"), data]);
        }).then(([name, data])=>{
            $.post(`/app/config/${name}`, data, function(){
                console.log("Updated app-config:", requestURL, data)
            });
        });
    }

    ReloadContent = ()=>{
        $(this.element).find(".config-item").each(function(){
            $.get(`/app/config/${$(this).attr("data-name")}`, {}, (data)=>{
                Object.keys(data).forEach((dataName)=>{
                    let input = $(this).find(`label[data-name="${dataName}"] input`);
                    if(input.is(".switch")){
                        input.prop("checked", data[dataName]);
                    }else if($(input).is(".checkbox")){
                        input.prop("checked", data[dataName]);
                    }else{
                        input.val(data[dataName]);
                    }
                    input.trigger("change", [false,]);
                })
            });
        });
    }
}