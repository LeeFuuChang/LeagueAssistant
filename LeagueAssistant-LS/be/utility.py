import psutil

def getProcessesByNames(names):
    result = []
    for proc in psutil.process_iter():
        try:
            if(proc.name().strip() not in names): continue
            result.append(proc)
        except: continue
    return result
