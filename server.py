import sys
setattr(sys, "kwargs", {k:v for k,v in [arg.split("=") for arg in sys.argv if "=" in arg]})
sys.kwargs["--mode"] = sys.kwargs.get("--mode", "RELEASE").upper()
print(sys.kwargs)

sys.path.append("LeagueAssistant-LS/be")

from modules import Client

server = Client.Server.Server()
server.run(threaded=True)