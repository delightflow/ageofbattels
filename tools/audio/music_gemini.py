"""Background music generated with Google's Lyria (Gemini API), 30-second instrumental loops.

    GEMINI_API_KEY=... python3 tools/audio/music_gemini.py [names...]
    python3 tools/audio/pack.py

Writes tools/audio/raw/mus_<name>0.mp3. The game prefers these tracks over the ElevenLabs drum loop when present.
The key is read from the environment only.
"""
import base64, json, os, sys, time, urllib.request

KEY = os.environ.get('GEMINI_API_KEY') or sys.exit('set GEMINI_API_KEY')
MODEL = os.environ.get('LYRIA_MODEL', 'lyria-3-clip-preview')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
NOVOX = ' Instrumental only, no vocals. Seamless loop, no fade in or fade out.'
TRACKS = {
    'menu':    'Calm medieval main theme for a historical strategy game: lute, recorder and soft strings over a gentle frame drum, warm and nostalgic, D Dorian, 80 bpm.' + NOVOX,
    'battle':  'Epic medieval battle music: pounding war drums, low brass and driving strings, tense and heroic, D minor, 120 bpm, cinematic strategy game score.' + NOVOX,
    'skirmish': 'Fast medieval skirmish music: tribal drums, hurdy-gurdy and bagpipe-like drones with fiddle ostinato, urgent and gritty, E minor, 132 bpm.' + NOVOX,
    'siege':   'Slow ominous siege music: deep timpani, low choir-like pads without words, brass swells and creaking tension, C minor, 70 bpm.' + NOVOX,
}

def gen(name, prompt):
    path = os.path.join(OUT, 'mus_%s0.mp3' % name)
    if os.path.exists(path): return 'cached'
    body = {'contents': [{'parts': [{'text': prompt}]}]}
    url = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent' % MODEL
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={'x-goog-api-key': KEY, 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=300) as r: res = json.load(r)
            for part in res['candidates'][0]['content']['parts']:
                if part.get('inlineData'):
                    data = base64.b64decode(part['inlineData']['data']); open(path, 'wb').write(data); return '%dKB' % (len(data) // 1024)
            return 'no audio in response: ' + json.dumps(res)[:300]
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (400, 401, 403): return 'FAILED %d %s' % (e.code, msg)
            time.sleep(2 ** attempt * 3)
        except Exception as e: msg = str(e); time.sleep(2 ** attempt * 3)
    return 'FAILED ' + str(msg)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, prompt in TRACKS.items():
        if len(sys.argv) > 1 and name not in sys.argv[1:]: continue
        print('%-8s %s' % (name, gen(name, prompt)), flush=True)
