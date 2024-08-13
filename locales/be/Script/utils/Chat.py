from flask import current_app
import win32process
import win32gui
import win32api
import win32con
import keyboard
import logging
import psutil
import time


def sendChampSelect(cid, message):
    if(not message): return True
    logging.info(f"[LolChatChampSelect] send({cid}): {repr(message)}")
    with current_app.test_client() as client:
        response = client.post(
            f"/riot/lcu/0/lol-chat/v1/conversations/{cid}/messages",
            json={"type":"chat", "body":message}
        )
        time.sleep(0.05)
        return (response.status_code//100) == 2


def sendInProgress(messages):
    messages = list(filter(lambda m:m, messages))

    if(not messages): return True

    pids = {p.pid for p in psutil.process_iter() if p.name().strip() == "League of Legends.exe"}

    def callback(hwnd, hwnds):
        if not win32gui.IsWindowVisible(hwnd): return True
        if not win32gui.IsWindowEnabled(hwnd): return True
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        if pid in pids: hwnds.append(hwnd)
        return True
    hwnds = []
    win32gui.EnumWindows(callback, hwnds)

    for hwnd in hwnds:
        win32api.SendMessage(hwnd, win32con.WM_INPUTLANGCHANGEREQUEST, 0, 0x409)

        # win32gui.SetWindowPos(hwnds[0], win32con.HWND_TOPMOST, 0,0,0,0, win32con.SWP_NOMOVE | win32con.SWP_NOSIZE)
        # win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0)
        # win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0)
        win32gui.SetForegroundWindow(hwnd)

        for message in messages:
            logging.info(f"[LolChatInProgress] send({hwnd}): {repr(message)}")
            time.sleep(0.05)
            keyboard.press_and_release("enter")
            time.sleep(0.05)
            keyboard.write(message)
            time.sleep(0.05)
            keyboard.press_and_release("enter")
            time.sleep(0.05)

    return True
