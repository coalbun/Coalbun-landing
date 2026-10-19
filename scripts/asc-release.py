# Fyller i version 1.0 av Synk i App Store Connect så att den är redo att skickas in.
#   python3 scripts/asc-release.py kolla  – visar läget, ändrar inget
#   python3 scripts/asc-release.py fyll   – fyller i det som saknas eller skiljer sig
# Texterna kommer från appstore/metadata.json. Skriptet skickar aldrig in för granskning
# och tar aldrig bort något.
import hashlib, json, os, sys, time

from asc_common import ApiError, api, get_all, get_optional, upload_asset

ROOT = os.path.join(os.path.dirname(__file__), "..")
META = json.load(open(os.path.join(ROOT, "appstore", "metadata.json"), encoding="utf-8"))
BUNDLE_ID = "com.coalbun.synk"
VERSION = "1.0"
SCREENSHOT_TYPE = "APP_IPHONE_67"  # 6,9- och 6,7-tumsplatsen, 1320 × 2868 går in här

# Åldersfrågorna. Synk har frågor om dejting, ex och fest i text, inget annat.
AGE = {
    "matureOrSuggestiveThemes": "FREQUENT_OR_INTENSE",
    "sexualContentOrNudity": "INFREQUENT_OR_MILD",
    "alcoholTobaccoOrDrugUseOrReferences": "INFREQUENT_OR_MILD",
    "profanityOrCrudeHumor": "INFREQUENT_OR_MILD",
    "sexualContentGraphicAndNudity": "NONE",
    "horrorOrFearThemes": "NONE",
    "medicalOrTreatmentInformation": "NONE",
    "violenceCartoonOrFantasy": "NONE",
    "violenceRealistic": "NONE",
    "violenceRealisticProlongedGraphicOrSadistic": "NONE",
    "gamblingSimulated": "NONE",
    "contests": "NONE",
    "gunsOrOtherWeapons": "NONE",
    "gambling": False,
    "unrestrictedWebAccess": False,
    "lootBox": False,
    "advertising": False,
    "ageAssurance": False,
    "healthOrWellnessTopics": False,
    "messagingAndChat": False,
    "parentalControls": False,
    "socialMedia": False,
    "userGeneratedContent": False,
}
AGE_SKIP = {"kidsAgeBand", "ageRatingOverride", "ageRatingOverrideV2", "koreaAgeRatingOverride",
            "gracRatingClassificationNumber", "developerAgeRatingInfoUrl", "socialMediaAgeRestricted"}

manual = []   # saker som bara Keela kan göra
failed = []
MODE = "kolla"


def say(msg):
    print(msg, flush=True)


def step(label, fn, *args):
    try:
        return fn(*args)
    except ApiError as e:
        failed.append(label)
        say(f"::error::{label}: {e}")


def patch(kind, obj, wanted, label):
    """PATCH:a bara fält som skiljer sig. Visar vad som ändras."""
    cur = obj.get("attributes", {})
    diff = {k: v for k, v in wanted.items() if cur.get(k) != v}
    if not diff:
        say(f"  {label}: redan rätt")
        return
    if MODE != "fyll":
        say(f"  {label}: behöver ändras ({', '.join(diff)})")
        return
    api("PATCH", f"/v1/{kind}/{obj['id']}", {"data": {"type": kind, "id": obj["id"], "attributes": diff}})
    say(f"  {label}: uppdaterade {', '.join(diff)}")


def find_app():
    apps = api("GET", "/v1/apps?filter[bundleId]=" + BUNDLE_ID)["data"]
    if not apps:
        sys.exit(f"::error::Hittar ingen app med bundle-ID {BUNDLE_ID}.")
    say(f"App: {apps[0]['attributes']['name']}")
    return apps[0]


def app_level(app):
    say("\n== Appen")
    patch("apps", app, {"contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"}, "Tredjepartsinnehåll (nej)")


def editable_app_info(app_id):
    infos = get_all(f"/v1/apps/{app_id}/appInfos")
    for i in infos:
        st = i["attributes"].get("appStoreState") or i["attributes"].get("state")
        if st not in ("READY_FOR_SALE", "READY_FOR_DISTRIBUTION", "REPLACED_WITH_NEW_INFO"):
            return i
    return infos[0]


def categories(info):
    say("\n== Kategorier")
    c = META["categories"]
    want = {"primaryCategory": c["primary"], "primarySubcategoryOne": c["primarySub1"],
            "primarySubcategoryTwo": c["primarySub2"], "secondaryCategory": c["secondary"]}
    rel = api("GET", f"/v1/appInfos/{info['id']}?include=primaryCategory,secondaryCategory,primarySubcategoryOne,primarySubcategoryTwo")
    have = {k: ((v.get("data") or {}) or {}).get("id") for k, v in rel["data"].get("relationships", {}).items() if k in want}
    if all(have.get(k) == v for k, v in want.items()):
        say("  Spel (Trivia, Casual) + Underhållning: redan rätt")
        return
    if MODE != "fyll":
        say(f"  behöver ändras (nu: {have})")
        return
    api("PATCH", f"/v1/appInfos/{info['id']}", {"data": {"type": "appInfos", "id": info["id"], "relationships": {
        k: {"data": {"type": "appCategories", "id": v}} for k, v in want.items()}}})
    say("  satte Spel (Trivia, Casual) + Underhållning")


def app_info_loc(info):
    say("\n== Appinformation (svenska)")
    locs = get_all(f"/v1/appInfos/{info['id']}/appInfoLocalizations")
    loc = next((l for l in locs if l["attributes"]["locale"].lower().startswith("sv")), None)
    if not loc:
        failed.append("appinfo-sv")
        say(f"::error::Ingen svensk appinformation. Språk som finns: {[l['attributes']['locale'] for l in locs]}")
        return
    patch("appInfoLocalizations", loc, {"name": META["name"], "subtitle": META["subtitle"],
          "privacyPolicyUrl": META["privacyPolicyUrl"]}, "Namn, undertitel och integritetspolicy")


def age_rating(info):
    say("\n== Åldersgräns")
    decl = get_optional(f"/v1/appInfos/{info['id']}/ageRatingDeclaration")
    if not decl:
        failed.append("åldersgräns")
        say("::error::Hittar ingen åldersdeklaration")
        return
    cur = decl["attributes"]
    unknown = sorted(k for k in cur if k not in AGE and k not in AGE_SKIP)
    if unknown:
        manual.append("Åldersgräns: kontrollera de nya frågorna " + ", ".join(unknown))
        say(f"  okända frågor, lämnas orörda: {', '.join(unknown)}")
    want = {k: v for k, v in AGE.items() if k in cur and cur[k] != v}
    if not want:
        say("  svar på åldersfrågorna: redan rätt")
    elif MODE != "fyll":
        say(f"  svar på åldersfrågorna: behöver ändras ({', '.join(want)})")
    else:
        def send(attrs):
            api("PATCH", f"/v1/ageRatingDeclarations/{decl['id']}",
                {"data": {"type": "ageRatingDeclarations", "id": decl["id"], "attributes": attrs}})
        try:
            send(want)
            say(f"  svarade på {len(want)} åldersfrågor")
        except ApiError as e:
            say(f"  alla på en gång gick inte ({e}), provar en i taget")
            for k, v in want.items():
                alt = "NONE" if isinstance(v, bool) else (False if v == "NONE" else None)
                for val in (v, alt):
                    if val is None:
                        continue
                    try:
                        send({k: val})
                        break
                    except ApiError as e2:
                        err = e2
                else:
                    manual.append(f"Åldersgräns: svara på frågan '{k}' själv")
                    say(f"  {k}: gick inte ({err})")
    if "ageRatingOverrideV2" in cur and cur["ageRatingOverrideV2"] != "EIGHTEEN_PLUS":
        if MODE != "fyll":
            say("  åldersgräns 18+ manuellt: behöver ändras")
            return
        try:
            api("PATCH", f"/v1/ageRatingDeclarations/{decl['id']}", {"data": {"type": "ageRatingDeclarations",
                "id": decl["id"], "attributes": {"ageRatingOverrideV2": "EIGHTEEN_PLUS"}}})
            say("  satte åldersgränsen till 18+")
        except ApiError as e:
            manual.append("Åldersgräns: välj 18+ manuellt under Appinformation → Åldersgräns")
            say(f"  kunde inte sätta 18+: {e}")


def find_or_create_version(app_id):
    say("\n== Version " + VERSION)
    vs = get_all(f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS")
    v = next((x for x in vs if x["attributes"]["versionString"] == VERSION), None) or \
        next((x for x in vs if x["attributes"].get("appStoreState") == "PREPARE_FOR_SUBMISSION"), None)
    if v:
        say(f"  {v['attributes']['versionString']}: {v['attributes'].get('appStoreState')}")
        return v
    if MODE != "fyll":
        say("  saknas")
        return None
    r = api("POST", "/v1/appStoreVersions", {"data": {"type": "appStoreVersions",
            "attributes": {"platform": "IOS", "versionString": VERSION},
            "relationships": {"app": {"data": {"type": "apps", "id": app_id}}}}})
    say("  skapade version " + VERSION)
    return r["data"]


def version_fields(v):
    patch("appStoreVersions", v, {"copyright": META["copyright"], "releaseType": "AFTER_APPROVAL"},
          "Copyright och släpp direkt efter godkännande")


def attach_build(app_id, v):
    say("\n== Bygge")
    builds = get_all(f"/v1/builds?filter[app]={app_id}&filter[processingState]=VALID&sort=-uploadedDate&limit=20")
    if not builds:
        failed.append("bygge")
        say("::error::Inget färdigbearbetat bygge hittades")
        return
    b = builds[0]
    say(f"  senaste bygge: {b['attributes']['version']} ({b['attributes'].get('uploadedDate', '')[:10]})")
    cur = get_optional(f"/v1/appStoreVersions/{v['id']}/build")
    if cur and cur["id"] == b["id"]:
        say("  redan valt för versionen")
        return
    if MODE != "fyll":
        say("  behöver väljas för versionen")
        return
    api("PATCH", f"/v1/appStoreVersions/{v['id']}/relationships/build", {"data": {"type": "builds", "id": b["id"]}})
    say(f"  valde bygge {b['attributes']['version']}")


def version_loc(v):
    say("\n== Texter (svenska)")
    locs = get_all(f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations")
    loc = next((l for l in locs if l["attributes"]["locale"].lower().startswith("sv")), None)
    if not loc:
        if MODE != "fyll":
            say("  svensk text saknas")
            return None
        loc = api("POST", "/v1/appStoreVersionLocalizations", {"data": {"type": "appStoreVersionLocalizations",
                  "attributes": {"locale": META["locale"]},
                  "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": v["id"]}}}}})["data"]
        say("  skapade svensk text")
    patch("appStoreVersionLocalizations", loc, {k: META[k] for k in
          ("description", "keywords", "promotionalText", "supportUrl", "marketingUrl")},
          "Beskrivning, sökord, reklamtext och länkar")
    return loc


def screenshots(loc):
    say("\n== Skärmbilder")
    sets = get_all(f"/v1/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets")
    sset = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == SCREENSHOT_TYPE), None)
    existing = get_all(f"/v1/appScreenshotSets/{sset['id']}/appScreenshots") if sset else []
    names = [s["attributes"].get("fileName") for s in existing]
    say(f"  uppladdade nu: {len(existing)} {names if names else ''}")
    todo = [f for f in META["screenshots"] if f not in names]
    if not todo:
        return
    if existing and MODE == "fyll":
        manual.append("Skärmbilder: det fanns redan andra bilder, så jag lade inte till fler. Ta bort dem och kör igen.")
        say("  det finns redan andra bilder, lägger inte till fler")
        return
    if MODE != "fyll":
        say(f"  saknas: {', '.join(todo)}")
        return
    if not sset:
        sset = api("POST", "/v1/appScreenshotSets", {"data": {"type": "appScreenshotSets",
                   "attributes": {"screenshotDisplayType": SCREENSHOT_TYPE},
                   "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": loc["id"]}}}}})["data"]
    for name in todo:
        blob = open(os.path.join(ROOT, "appstore", "screenshots", name), "rb").read()
        res = api("POST", "/v1/appScreenshots", {"data": {"type": "appScreenshots",
                  "attributes": {"fileName": name, "fileSize": len(blob)},
                  "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": sset["id"]}}}}})["data"]
        upload_asset(res, blob)
        api("PATCH", f"/v1/appScreenshots/{res['id']}", {"data": {"type": "appScreenshots", "id": res["id"],
            "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(blob).hexdigest()}}})
        say(f"  laddade upp {name}")
    time.sleep(15)
    for s in get_all(f"/v1/appScreenshotSets/{sset['id']}/appScreenshots"):
        st = s["attributes"].get("assetDeliveryState") or {}
        errs = "; ".join(e.get("description", "") for e in st.get("errors") or [])
        say(f"  {s['attributes'].get('fileName')}: {st.get('state')} {errs}")


def review_details(v):
    say("\n== Granskningsinformation")
    want = {"notes": META["reviewNotes"], "contactEmail": META["contactEmail"], "demoAccountRequired": False}
    det = get_optional(f"/v1/appStoreVersions/{v['id']}/appStoreReviewDetail")
    if det:
        patch("appStoreReviewDetails", det, want, "Anteckningar och kontakt-e-post")
        at = det["attributes"]
    elif MODE == "fyll":
        at = api("POST", "/v1/appStoreReviewDetails", {"data": {"type": "appStoreReviewDetails", "attributes": want,
                 "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": v["id"]}}}}})["data"]["attributes"]
        say("  skapade anteckningar och kontakt-e-post")
    else:
        say("  saknas")
        return
    if not (at.get("contactFirstName") and at.get("contactLastName") and at.get("contactPhone")):
        manual.append("Granskningsinformation: fyll i ditt förnamn, efternamn och telefonnummer (Apple ringer bara om något är oklart)")


def pricing(app_id):
    say("\n== Pris (appen är gratis)")
    if get_optional(f"/v1/apps/{app_id}/appPriceSchedule"):
        say("  pris finns redan")
        return
    if MODE != "fyll":
        say("  saknas")
        return
    points = get_all(f"/v1/apps/{app_id}/appPricePoints?filter[territory]=SWE&limit=200")
    free = next(p for p in points if float(p["attributes"]["customerPrice"]) == 0)
    api("POST", "/v1/appPriceSchedules", {
        "data": {"type": "appPriceSchedules", "relationships": {
            "app": {"data": {"type": "apps", "id": app_id}},
            "baseTerritory": {"data": {"type": "territories", "id": "SWE"}},
            "manualPrices": {"data": [{"type": "appPrices", "id": "${gratis}"}]}}},
        "included": [{"type": "appPrices", "id": "${gratis}", "attributes": {"startDate": None},
                      "relationships": {"appPricePoint": {"data": {"type": "appPricePoints", "id": free["id"]}}}}]})
    say("  satte appen som gratis")


def availability(app_id):
    say("\n== Länder")
    if get_optional(f"/v1/apps/{app_id}/appAvailabilityV2"):
        say("  länder finns redan")
        return
    if MODE != "fyll":
        say("  saknas")
        return
    terrs = get_all("/v1/territories?limit=200")
    inc = [{"type": "territoryAvailabilities", "id": f"${{{t['id']}}}", "attributes": {"available": True},
            "relationships": {"territory": {"data": {"type": "territories", "id": t["id"]}}}} for t in terrs]
    api("POST", "/v2/appAvailabilities", {
        "data": {"type": "appAvailabilities", "attributes": {"availableInNewTerritories": True},
                 "relationships": {"app": {"data": {"type": "apps", "id": app_id}},
                                   "territoryAvailabilities": {"data": [{"type": x["type"], "id": x["id"]} for x in inc]}}},
        "included": inc})
    say(f"  tillgänglig i {len(terrs)} länder")


def iap_status(app_id):
    say("\n== Köpet")
    for x in get_all(f"/v1/apps/{app_id}/inAppPurchasesV2?limit=50"):
        say(f"  {x['attributes'].get('productId')}: {x['attributes'].get('state')}")
    manual.append("Köpet: bocka i 'Lås upp Juicy och Crazy' under In-App Purchases and Subscriptions på versionssidan")


def main():
    global MODE
    MODE = (sys.argv[1] if len(sys.argv) > 1 else "kolla").strip().lower()
    say(f"Läge: {MODE}")
    app = find_app()
    app_id = app["id"]
    step("appen", app_level, app)
    info = step("appinformation", editable_app_info, app_id)
    if info:
        step("kategorier", categories, info)
        step("appinformation", app_info_loc, info)
        step("åldersgräns", age_rating, info)
    v = step("version", find_or_create_version, app_id)
    if v:
        step("version", version_fields, v)
        step("bygge", attach_build, app_id, v)
        loc = step("texter", version_loc, v)
        if loc:
            step("skärmbilder", screenshots, loc)
        step("granskningsinformation", review_details, v)
    step("pris", pricing, app_id)
    step("länder", availability, app_id)
    step("köpet", iap_status, app_id)

    manual.append("Appens integritet: välj 'Data Not Collected' och tryck Publicera (finns inte i API:t)")
    say("\n== Kvar för dig i App Store Connect")
    for m in manual:
        say("  - " + m)
    if failed:
        say("\nMisslyckades: " + ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except ApiError as e:
        sys.exit(f"::error::{e}")
