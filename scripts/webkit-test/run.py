# Kör appen i WebKit (samma layoutmotor som Safari på iPhone) och låter driver.js spela igenom den
# och leta layoutfel: kapad text, osynliga namn, text på text, sidor som går att scrolla.
#   ./matrix.sh                                   -> alla iPhone-storlekar x fyra spelaruppsättningar
#   xvfb-run -a /usr/bin/python3.12 run.py W H top bottom config outdir   -> en körning
# config: duo, six, ten eller wide. Resultat: outdir/result.json och en skärmbild per steg.
# Kräver (Ubuntu): apt-get install gir1.2-webkit2-4.1 python3-gi-cairo xvfb
import gi, sys, json, os, shutil, re
gi.require_version('Gtk', '3.0'); gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib

W, H, TOP, BOT = map(int, sys.argv[1:5])
CFG = sys.argv[5]
OUT = sys.argv[6]
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))

# Kopia av appen med säkra ytor som på telefonen
APP = os.path.join(OUT, 'app')
shutil.rmtree(APP, ignore_errors=True)
shutil.copytree(os.path.join(HERE, '../../app'), APP)
p = os.path.join(APP, 'index.html')
html = open(p, encoding='utf-8').read()
html = html.replace('env(safe-area-inset-top, 0px)', f'{TOP}px').replace('env(safe-area-inset-bottom, 0px)', f'{BOT}px')
open(p, 'w', encoding='utf-8').write(html)

ucm = WebKit2.UserContentManager()
for n in ('shot', 'done', 'log'):
    ucm.register_script_message_handler(n)
cfg = json.dumps({'W': W, 'H': H, 'cfg': CFG})
ucm.add_script(WebKit2.UserScript(
    'window.__T=' + cfg + ';try{if(!sessionStorage.getItem("seeded")){localStorage.clear();sessionStorage.setItem("seeded","1")}}catch(e){}',
    WebKit2.UserContentInjectedFrames.TOP_FRAME, WebKit2.UserScriptInjectionTime.START, None, None))
ucm.add_script(WebKit2.UserScript(open(os.path.join(HERE, 'driver.js')).read(),
    WebKit2.UserContentInjectedFrames.TOP_FRAME, WebKit2.UserScriptInjectionTime.END, None, None))

ctx = WebKit2.WebContext.new_ephemeral()
wv = WebKit2.WebView(web_context=ctx, user_content_manager=ucm)
s = wv.get_settings()
s.set_allow_file_access_from_file_urls(True)
s.set_allow_universal_access_from_file_urls(True)
s.set_enable_write_console_messages_to_stdout(True)
win = Gtk.Window()
win.set_default_size(W, H)
win.set_resizable(False)
wv.set_size_request(W, H)
win.add(wv)
win.show_all()

def val(res):
    try:
        return res.get_js_value().to_string()
    except Exception:
        return str(res)

def on_shot(m, res):
    name = val(res)
    def cb(view, task):
        surf = view.get_snapshot_finish(task)
        surf.write_to_png(os.path.join(OUT, name + '.png'))
    wv.get_snapshot(WebKit2.SnapshotRegion.VISIBLE, WebKit2.SnapshotOptions.NONE, None, cb)

def on_log(m, res):
    print(val(res), flush=True)

def on_done(m, res):
    open(os.path.join(OUT, 'result.json'), 'w').write(val(res))
    GLib.timeout_add(400, Gtk.main_quit)

ucm.connect('script-message-received::shot', on_shot)
ucm.connect('script-message-received::log', on_log)
ucm.connect('script-message-received::done', on_done)
GLib.timeout_add_seconds(int(os.environ.get('TMO','400')), lambda: (print('TIMEOUT', flush=True), Gtk.main_quit()))
import http.server, threading, functools
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=APP))
srv.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=srv.serve_forever, daemon=True).start()
wv.load_uri('http://127.0.0.1:%d/index.html' % srv.server_address[1])
Gtk.main()
