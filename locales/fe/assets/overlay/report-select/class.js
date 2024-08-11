class AppOverlay_ReportSelect extends AppOverlay {
    static elementURL = "/ui/assets/overlay/report-select/element.html";

    Setup = ()=>{
        $(this.element).find(".actions .return").on("click", this.SlideOut);
        $(this.element).find(".actions .report").on("click", ()=>{
            let payload = this.data["identifier"]["payload"];
            let category = ($(this.element).find(".form .option .checkbox").get())
            .filter((checkbox)=>$(checkbox).is(":checked"))
            .map((checkbox)=>$(checkbox).closest(".option").attr("data-name").toUpperCase());
            if(category.length){
                let requestURL = `/riot/lcu/0/lol-player-report-sender/v1/champ-select-reports/category/${category[0]}`;
                $.post(requestURL, JSON.stringify(payload)).always(this.SlideOut);
            }
        });

        this.ReloadContent();
    }

    ReloadContent = ()=>{
        $(this.element).find(".basic .icon").attr("src", this.data["identifier"]["icon"]);
        $(this.element).find(".basic .name").text(this.data["identifier"]["offender"]["gameName"]);
        return Promise.resolve();
    }
}