# -*- mode: python ; coding: utf-8 -*-


block_cipher = pyi_crypto.PyiBlockCipher(key="helloworldishard")


target = "main.py"


import os
excludes = set([
    "env", 
    "main.py", 
])

datas = set()
for root, dirs, files in os.walk(".\\modules", topdown=False):
    if(any([((os.sep+d) in root) for d in excludes])): continue
    for name in files:
        if name.split(".")[-1].startswith("py"): continue
        datas.add((os.path.join(root, name), root))

hiddenimports = set(["ProjectUtility"])
def collectHiddenImports(filepath):
    with open(filepath, "r") as f: 
        lines = f.readlines()
    fileImportations = [line for line in lines if "import" in line]
    for importLine in fileImportations:
        if(importLine.startswith("from ")):
            names = importLine[:importLine.find(" import")].replace("from ", "")
        elif(importLine.startswith("import ")):
            names = importLine[:importLine.find(" as")].replace("import ", "")
        else: names = ""
        for name in names.split(", "):
            if(not name): continue
            if(name.startswith(".")): continue
            if(name.startswith("modules")): continue
            if(name in hiddenimports): continue
            hiddenimports.add(name)
collectHiddenImports(target)
collectHiddenImports("ProjectUtility.py")
for root, dirs, files in os.walk("."):
    if(any([((os.sep+d) in root) for d in excludes])): continue
    for file in files:
        if(file in excludes): continue
        if(not file.endswith(".py")): continue
        if(file == target or not file.endswith(".py")): continue
        collectHiddenImports(os.path.join(root, file))


a = Analysis(
    [target],
    pathex=[".\\env\\Lib\\site-packages"],
    binaries=[],
    datas=list(datas),
    hiddenimports=list(hiddenimports),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

for d in list(a.datas):
    if "pyconfig" in d[0]:
        a.datas.remove(d)
    if "_C.cp38-win_amd64.pyd" in d[0]:
        a.datas.remove(d)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="LeagueAssistant-4.3.0",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    uac_admin=True,
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=["filled.ico"],
)