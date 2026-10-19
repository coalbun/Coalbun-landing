# Gör om App Store Connect-nyckeln till en giltig .p8 oavsett hur den klistrades in.
import base64, os, re, sys
raw = os.environ["ASC_KEY"].replace("\r", "").replace("\\n", "\n").strip().strip('"').strip("'")
if "BEGIN" not in raw:
    try:
        dec = base64.b64decode(re.sub(r"\s+", "", raw), validate=True).decode()
        if "BEGIN" in dec:
            raw = dec.strip()
    except Exception:
        pass
m = re.search(r"-----BEGIN [A-Z ]*-----(.*?)-----END [A-Z ]*-----", raw, re.S)
body = re.sub(r"[^A-Za-z0-9+/=]", "", m.group(1) if m else raw)
try:
    der = base64.b64decode(body + "=" * (-len(body) % 4))
except Exception:
    der = b""
print(f"Nyckel: rubrikrader={'ja' if m else 'nej'}, tecken={len(body)}, byte={len(der)}")
if not 100 <= len(der) <= 200:
    print("::error::APP_STORE_CONNECT_KEY ser inte ut som en .p8-nyckel. Klistra in hela filens innehåll, inklusive raderna BEGIN och END.")
    sys.exit(1)
lines = [body[i:i + 64] for i in range(0, len(body), 64)]
with open(sys.argv[1], "w") as f:
    f.write("-----BEGIN PRIVATE KEY-----\n" + "\n".join(lines) + "\n-----END PRIVATE KEY-----\n")
