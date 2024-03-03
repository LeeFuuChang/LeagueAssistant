$(document).ready(function(){
    window.Widgets = {
        Setup_Stepper: (element)=>{
            $(element).find(".button[data-action='-']").on("click", (e)=>{
                let inp = $(e.currentTarget).closest(".stepper").find("input");
                let min = parseFloat(inp.attr("min"))||0;
                let max = parseFloat(inp.attr("max"))||9;
                let step = parseFloat(inp.attr("step"))||1;
                let decimal = parseInt(inp.attr("decimal"))||0;
                inp.val([min, parseFloat(inp.val())-step, max].sort()[1].toFixed(decimal)).change();
            });
            $(element).find(".button[data-action='+']").on("click", (e)=>{
                let inp = $(e.currentTarget).closest(".stepper").find("input");
                let min = parseFloat(inp.attr("min"))||0;
                let max = parseFloat(inp.attr("max"))||9;
                let step = parseFloat(inp.attr("step"))||1;
                let decimal = parseInt(inp.attr("decimal"))||0;
                inp.val([min, parseFloat(inp.val())+step, max].sort()[1].toFixed(decimal)).change();
            });
        },
        SetupDropDownMenu: (element, onDropDownSelect)=>{
            $(element).off("mouseleave").on("mouseleave", function(){
                $(this).removeClass("active");
            });
            $(element).find(".drop-down-menu-select").off("click").on("click", function(){
                $(element).toggleClass("active");
            })
            $(element).find(".drop-down-menu-li").off("click").on("click", function(){
                $(element).removeClass("active")
                .find(".drop-down-menu-selected")
                .attr("data-label", $(this).attr("data-label"))
                .html($(this).html());
                onDropDownSelect($(this));
            });
        },
        SetupTextFilter: (element)=>{
            $(element).find(".text-filter-input").on("input", function(){
                let value = $(this).val();
                $(".text-filter-item").each(function(){
                    if(!$(this).attr("data-filter").includes(value)){
                        $(this).addClass("hide-by-text-filter");
                    }else{
                        $(this).removeClass("hide-by-text-filter");
                    }
                });
            });
        },
        SetupButtonGroup: (buttons, onChange)=>{
            $(buttons).off("click").on("click", function(){
                // if($(this).hasClass("active")) return;
                $(this).addClass("active").siblings().removeClass("active");
                onChange($(this));
            });
        },
    }
})