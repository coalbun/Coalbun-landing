# Kollar eller skapar köpet "Juicy och Crazy" i App Store Connect via API:t.
#   python3 scripts/asc-iap.py kolla   – visar bara läget
#   python3 scripts/asc-iap.py skapa   – skapar det som saknas, tar aldrig bort något
# Läser ASC_KEY_ID, ASC_ISSUER_ID och KEY_PATH från miljön.
import hashlib, json, os, sys, time, urllib.error, urllib.parse, urllib.request

import jwt

BUNDLE_ID = "com.coalbun.synk"
PRODUCT_ID = "com.coalbun.synk.unlock"
REF_NAME = "Lås upp Juicy och Crazy"
LOCALE = "sv"
DISPLAY_NAME = "Juicy och Crazy"
DESCRIPTION = "300 kryddigare frågor, köps en gång"
PRICE_SEK = 59.0
REVIEW_NOTE = ("Engångsköp som låser upp nivåerna Juicy och Crazy (300 frågor). "
               "Tryck på Juicy eller Crazy på startskärmen för att öppna köpet. "
               "Återställ köp finns i samma ruta och i menyn.")
SCREENSHOT = os.path.join(os.path.dirname(__file__), "..", "appstore", "screenshots", "iap-review.jpg")
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
            msg = "; ".join(f"{x.get('title', '')}: {x.get('detail', '')}" for x in errs) or raw
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


def find_app():
    apps = api("GET", "/v1/apps?filter[bundleId]=" + BUNDLE_ID)["data"]
    if not apps:
        sys.exit(f"::error::Hittar ingen app med bundle-ID {BUNDLE_ID} i App Store Connect.")
    a = apps[0]
    print(f"App: {a['attributes']['name']} ({BUNDLE_ID})")
    return a["id"]


def find_iap(app_id):
    iaps = get_all(f"/v1/apps/{app_id}/inAppPurchasesV2?limit=200")
    print(f"Köp i appen: {len(iaps)} st")
    for x in iaps:
        at = x["attributes"]
        print(f"  - {at.get('productId')} | {at.get('name')} | {at.get('inAppPurchaseType')} | {at.get('state')}")
    return next((x for x in iaps if x["attributes"].get("productId") == PRODUCT_ID), None)


def report(iap_id):
    locs = get_all(f"/v2/inAppPurchases/{iap_id}/inAppPurchaseLocalizations?limit=50")
    sched = get_optional(f"/v2/inAppPurchases/{iap_id}/iapPriceSchedule")
    avail = get_optional(f"/v2/inAppPurchases/{iap_id}/inAppPurchaseAvailability")
    shot = get_optional(f"/v2/inAppPurchases/{iap_id}/appStoreReviewScreenshot")
    print("Texter: " + (", ".join(f"{l['attributes']['locale']} \"{l['attributes'].get('name')}\"" for l in locs) or "saknas"))
    print("Pris: " + ("satt" if sched else "saknas"))
    print("Länder: " + ("satta" if avail else "saknas"))
    if shot:
        st = (shot["attributes"].get("assetDeliveryState") or {}).get("state")
        print(f"Granskningsbild: finns ({st})")
    else:
        print("Granskningsbild: saknas")
    return locs, sched, avail, shot


def create_iap(app_id):
    r = api("POST", "/v2/inAppPurchases", {"data": {
        "type": "inAppPurchases",
        "attributes": {"name": REF_NAME, "productId": PRODUCT_ID, "inAppPurchaseType": "NON_CONSUMABLE",
                       "reviewNote": REVIEW_NOTE, "familySharable": False},
        "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}})
    print("Skapade köpet " + PRODUCT_ID)
    return r["data"]["id"]


def create_localization(iap_id):
    api("POST", "/v1/inAppPurchaseLocalizations", {"data": {
        "type": "inAppPurchaseLocalizations",
        "attributes": {"locale": LOCALE, "name": DISPLAY_NAME, "description": DESCRIPTION},
        "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}}}})
    print(f"La till svensk text: \"{DISPLAY_NAME}\"")


def create_price(iap_id):
    points = get_all(f"/v2/inAppPurchases/{iap_id}/pricePoints?filter[territory]=SWE&limit=200")
    if not points:
        raise ApiError("Hittade inga prisnivåer för Sverige")
    best = min(points, key=lambda p: abs(float(p["attributes"]["customerPrice"]) - PRICE_SEK))
    api("POST", "/v1/inAppPurchasePriceSchedules", {
        "data": {"type": "inAppPurchasePriceSchedules", "relationships": {
            "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
            "baseTerritory": {"data": {"type": "territories", "id": "SWE"}},
            "manualPrices": {"data": [{"type": "inAppPurchasePrices", "id": "${pris}"}]}}},
        "included": [{"type": "inAppPurchasePrices", "id": "${pris}", "attributes": {"startDate": None},
                      "relationships": {
                          "inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}},
                          "inAppPurchasePricePoint": {"data": {"type": "inAppPurchasePricePoints", "id": best["id"]}}}}]})
    print(f"Satte priset till {best['attributes']['customerPrice']} kr (Sverige som bas, andra länder räknas om av Apple)")


def create_availability(iap_id):
    terrs = get_all("/v1/territories?limit=200")
    api("POST", "/v1/inAppPurchaseAvailabilities", {"data": {
        "type": "inAppPurchaseAvailabilities",
        "attributes": {"availableInNewTerritories": True},
        "relationships": {
            "inAppPurchase": {"data": {"type": "inAppPurchases", "id": iap_id}},
            "availableTerritories": {"data": [{"type": "territories", "id": t["id"]} for t in terrs]}}}})
    print(f"Gjorde köpet tillgängligt i {len(terrs)} länder")


def upload_screenshot(iap_id):
    with open(SCREENSHOT, "rb") as f:
        blob = f.read()
    r = api("POST", "/v1/inAppPurchaseAppStoreReviewScreenshots", {"data": {
        "type": "inAppPurchaseAppStoreReviewScreenshots",
        "attributes": {"fileName": "iap-review.jpg", "fileSize": len(blob)},
        "relationships": {"inAppPurchaseV2": {"data": {"type": "inAppPurchases", "id": iap_id}}}}})
    shot = r["data"]
    for op in shot["attributes"]["uploadOperations"]:
        part = blob[op["offset"]:op["offset"] + op["length"]]
        req = urllib.request.Request(op["url"], data=part, method=op["method"])
        for h in op.get("requestHeaders") or []:
            req.add_header(h["name"], h["value"])
        urllib.request.urlopen(req).read()
    api("PATCH", f"/v1/inAppPurchaseAppStoreReviewScreenshots/{shot['id']}", {"data": {
        "type": "inAppPurchaseAppStoreReviewScreenshots", "id": shot["id"],
        "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(blob).hexdigest()}}})
    print("Laddade upp granskningsbilden")


def main():
    mode = (sys.argv[1] if len(sys.argv) > 1 else "kolla").strip().lower()
    app_id = find_app()
    iap = find_iap(app_id)
    if mode != "skapa":
        if not iap:
            print(f"::warning::Köpet {PRODUCT_ID} finns inte. Det är därför köpet inte går i TestFlight. Kör igen med läget 'skapa'.")
            return
        report(iap["id"])
        return

    failed = []
    iap_id = iap["id"] if iap else create_iap(app_id)
    locs, sched, avail, shot = report(iap_id)
    steps = [
        (not any(l["attributes"]["locale"].lower().startswith("sv") for l in locs), "svensk text", create_localization),
        (not sched, "pris", create_price),
        (not avail, "länder", create_availability),
        (not shot, "granskningsbild", upload_screenshot),
    ]
    for needed, label, fn in steps:
        if not needed:
            continue
        try:
            fn(iap_id)
        except ApiError as e:
            failed.append(label)
            print(f"::error::Kunde inte lägga till {label}: {e}")

    print("\nLäget nu:")
    state = api("GET", f"/v2/inAppPurchases/{iap_id}")["data"]["attributes"].get("state")
    print(f"Status: {state}")
    report(iap_id)
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except ApiError as e:
        sys.exit(f"::error::{e}")
