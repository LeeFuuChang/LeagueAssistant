import json, os


KB = 1024
MB = KB**2


def join(_path="."):
    if not os.path.exists(os.path.join(_path, "bin")): 
        raise FileNotFoundError(os.path.join(_path, "bin"))

    manifestPath = os.path.join(_path, "bin", "manifest.json")
    if not os.path.exists(manifestPath): 
        raise FileNotFoundError(manifestPath)
    with open(manifestPath, "r") as f: manifest = json.load(f)

    targetName = f"{manifest['name']}-{manifest['version']}.exe"
    targetPath = os.path.join(_path, targetName)
    with open(targetPath, "wb") as f:
        for file in manifest["splits"]:
            binp = os.path.join("bin", file)
            if not os.path.exists(binp): 
                raise FileNotFoundError(binp)
            binf = open(binp, "rb")
            f.write(binf.read())
            binf.close()


def split(target, chunksize=10*MB):
    targetRoot, targetFile = os.path.split(target)
    destin = os.path.join(targetRoot, "bin")
    manifestPath = os.path.join(destin, "manifest.json")
    targetName, extension = os.path.splitext(targetFile)
    projName, projVersion = targetName.split("-")
    def recursion(fobj, i):
        nonlocal chunksize
        chunk = fobj.read(chunksize)
        if not chunk: return i
        fname = f"{hex(i)[2:].upper():0>2}.bin"
        with open(os.path.join(destin, fname), "wb") as f: f.write(chunk)
        return recursion(fobj, i+1)
    if not os.path.exists(destin): os.mkdir(destin)
    count = recursion(open(target, "rb"), 0)
    with open(manifestPath, "w") as f:
        json.dump({
            "name": projName,
            "version": projVersion,
            "extension": extension[1:],
            "splits": [f"{hex(i)[2:].upper():0>2}.bin" for i in range(count)],
        }, f, indent=4, ensure_ascii=False)


split(".\LeagueAssistant-4.3.0.exe", chunksize=10*MB)
# join()