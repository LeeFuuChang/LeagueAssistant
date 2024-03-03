import json, os

def recursive(src, dst, exclude=[], filetypes=[]):
    changed_files = []
    for child in os.listdir(src):
        if(child in exclude): continue
        nsrc = os.path.join(src, child)
        ndst = os.path.join(dst, child)
        if(os.path.isdir(nsrc)): changed_files.extend(recursive(nsrc, ndst, exclude))
        if(not os.path.isfile(nsrc)): continue
        if(filetypes and os.path.splitext(nsrc)[1][1:] not in filetypes): continue
        if(not os.path.exists(nsrc)): changed_files.append(nsrc)
        if(os.path.exists(ndst)):
            with open(nsrc, "rb") as f: nsrc_content = f.read()
            with open(ndst, "rb") as f: ndst_content = f.read()
            if(nsrc_content != ndst_content): changed_files.append(nsrc)
        else: changed_files.append(nsrc)
    return changed_files

with open("changes.json", "w") as f:
    json.dump({
        # "cfg": recursive("./LeagueAssistant-LS/cfg", "C:/LeagueAssistant/LeagueAssistant-LS/cfg"),
        "fe": recursive("./LeagueAssistant-LS/fe", "C:/LeagueAssistant/LeagueAssistant-LS/fe"),
        "be": recursive("./LeagueAssistant-LS/be", f"./compiled/{sorted(os.listdir('./compiled'))[-1]}", ["__pycache__"], ["py"]),
    }, f, indent=4)