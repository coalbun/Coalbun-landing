# Gemensamt för skripten som pratar med App Store Connect API:t.
# Läser ASC_KEY_ID, ASC_ISSUER_ID och KEY_PATH från miljön.
import json, os, time, urllib.error, urllib.parse, urllib.request

import jwt

BASE = "https://api.appstoreconnect.apple.com"


class ApiError(Exception):
    pass


def token():
    now = int(time.time())
    with open(os.environ["KEY_PATH"]) as f:
        key = f.read()
    return jwt.encode({"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"})


def api(method, path, body=None):
    url = path if path.startswith("http") else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + token())
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            errs = json.loads(raw).get("errors", [])
            parts = []
            for x in errs:
                parts.append(f"{x.get('title', '')}: {x.get('detail', '')}")
                # Apple lägger de egentliga orsakerna i meta.associatedErrors
                for path, sub in ((x.get("meta") or {}).get("associatedErrors") or {}).items():
                    for y in sub:
                        parts.append(f"  -> {y.get('code', '')}: {y.get('detail') or y.get('title', '')}")
            msg = "\n".join(parts) or raw
        except ValueError:
            msg = raw
        raise ApiError(f"{method} {urllib.parse.urlparse(url).path} gav {e.code}: {msg}")


def get_all(path):
    out, url = [], path
    while url:
        r = api("GET", url)
        out += r.get("data", [])
        url = r.get("links", {}).get("next")
    return out


def get_optional(path):
    try:
        return api("GET", path).get("data")
    except ApiError as e:
        if " gav 404" in str(e):
            return None
        raise


def upload_asset(reservation, blob):
    """Laddar upp en fil enligt Apples uploadOperations."""
    for op in reservation["attributes"]["uploadOperations"]:
        part = blob[op["offset"]:op["offset"] + op["length"]]
        req = urllib.request.Request(op["url"], data=part, method=op["method"])
        for h in op.get("requestHeaders") or []:
            req.add_header(h["name"], h["value"])
        urllib.request.urlopen(req).read()
