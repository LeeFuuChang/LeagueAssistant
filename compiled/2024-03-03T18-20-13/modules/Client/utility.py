from ProjectUtility import user32, LOL_GAME_PROCESS_NAME, STORAGE_SERVER
import requests as rq
import win32process
import win32gui
import keyboard
import win32api
import win32gui
import win32con
import logging
import psutil
import time
logger = logging.getLogger()

def getCurrentKeyboardLanguageID():
    hwnd = user32.GetForegroundWindow()
    tpid = user32.GetWindowThreadProcessId(hwnd, 0)
    klid = user32.GetKeyboardLayout(tpid)
    return klid & (2**16 - 1)

def getProcessesByNames(names):
    result = []
    for proc in psutil.process_iter():
        try:
            if(proc.name().strip() not in names): continue
            result.append(proc)
        except: continue
    return result

def getHwndByProcess(proc):
    def callback(hwnd, hwnds):
        if not win32gui.IsWindowVisible(hwnd): return True
        if not win32gui.IsWindowEnabled(hwnd): return True
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        if pid == proc.pid: hwnds.append(hwnd)
        return True
    hwnds = []
    win32gui.EnumWindows(callback, hwnds)
    return hwnds

def sendChampSelectChat(server, cid, message):
    if(not message): return True
    logger.info(f"[LolChatChampSelect] send: {repr(message)}")
    with server.test_client() as client:
        response = client.post(
            f"/riot/lcu/0/lol-chat/v1/conversations/{cid}/messages",
            json={"type":"chat", "body":message}
        )
        time.sleep(0.1)
        if(not response): return False
        return (response.status_code//100) == 2

def sendInProgressChat(messages):
    messages = filter(lambda m:m, messages)
    if not messages: return True
    gameProcesses = getProcessesByNames([LOL_GAME_PROCESS_NAME])
    hwnds = [h for proc in gameProcesses for h in getHwndByProcess(proc)]
    if(not hwnds): return logger.error("can't fint LoL game window, cancel sendInProgressChat")
    win32gui.SetWindowPos(hwnds[0], win32con.HWND_TOPMOST, 0,0,0,0, win32con.SWP_NOMOVE | win32con.SWP_NOSIZE)
    originalKeyboardLanguageID = getCurrentKeyboardLanguageID()
    win32api.SendMessage(hwnds[0], win32con.WM_INPUTLANGCHANGEREQUEST, 0, 0x409)
    if( win32api.GetKeyState(win32con.VK_CAPITAL) ): win32api.keybd_event(0x14, 0, 0, 0)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0)
    time.sleep(0.05)
    for message in messages:
        logger.info(f"[LolChatInProgress] send: {repr(message)}")
        keyboard.press_and_release("enter")
        time.sleep(0.05)
        keyboard.write(message)
        time.sleep(0.05)
        keyboard.press_and_release("enter")
        time.sleep(0.05)
    win32api.SendMessage(hwnds[0], win32con.WM_INPUTLANGCHANGEREQUEST, 0, originalKeyboardLanguageID)
    win32gui.SetWindowPos(hwnds[0], win32con.HWND_NOTOPMOST, 0,0,0,0, win32con.SWP_NOMOVE | win32con.SWP_NOSIZE)
    return True

def sendPublicity(server, cid):
    try: message = rq.get(f"{STORAGE_SERVER}/PublicitySlogan.txt", verify=False).text
    except: message = ""
    if(not message): return True
    logger.info(f"[Publicity] send: {repr(message)}")
    return sendChampSelectChat(server, cid, message)