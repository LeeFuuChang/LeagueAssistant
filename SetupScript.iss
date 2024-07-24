; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "LeagueAssistant"
#define MyAppPublisher "LeeFuuChang"
#define MyAppURL "https://www.leefuuchang.in/"
#define MyAppExeName "LeagueAssistant-Launcher.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{231C7838-13D6-481B-9820-0B1316F25210}
AppName={#MyAppName}
AppVerName={#MyAppName}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=admin
OutputDir=D:\LoLSpell\Main\installer
OutputBaseFilename=LeagueAssistant-Setup
SetupIconFile=D:\LoLSpell\Main\installer\LeagueAssistant\icon.ico
UninstallDisplayIcon=D:\LoLSpell\Main\installer\LeagueAssistant\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}";

[Files]
Source: "D:\LoLSpell\Main\installer\LeagueAssistant\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\LoLSpell\Main\installer\LeagueAssistant\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion 
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\bin\QtWebEngineProcess.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\resources\icudtl.dat"; DestDir: "{app}"; Flags: ignoreversion 
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\resources\qtwebengine_devtools_resources.pak"; DestDir: "{app}"; Flags: ignoreversion 
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\resources\qtwebengine_resources_100p.pak"; DestDir: "{app}"; Flags: ignoreversion 
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\resources\qtwebengine_resources_200p.pak"; DestDir: "{app}"; Flags: ignoreversion 
Source: "D:\LoLSpell\Main\env\Lib\site-packages\PyQt5\Qt5\resources\qtwebengine_resources.pak"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: runascurrentuser nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"