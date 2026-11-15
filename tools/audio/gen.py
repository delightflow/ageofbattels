"""Generate the game's sound effects and loops with the ElevenLabs sound-effects API.

    ELEVENLABS_API_KEY=... python3 tools/audio/gen.py [names...]

Writes raw clips to tools/audio/raw/ (not shipped); tools/audio/pack.sh turns them into assets/audio/.
The key is read from the environment only and never written anywhere.
"""
import json, os, sys, time, urllib.request, concurrent.futures as cf

KEY = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('set ELEVENLABS_API_KEY')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
DRY = 'dry, close, no reverb, no music, single sound'
# name: (prompt, seconds, variants, loop)
SFX = {
    'clash':    ('two steel swords clashing, one sharp metallic strike of blade on blade, medieval battle, ' + DRY, 0.8, 3, False),
    'hit':      ('sword slash cutting into chainmail and flesh, one heavy meaty impact, ' + DRY, 0.7, 3, False),
    'block':    ('sword striking a wooden shield, one dull heavy thud, ' + DRY, 0.7, 2, False),
    'chop':     ('battle axe chopping hard into a wooden shield, one crunchy impact, ' + DRY, 0.7, 2, False),
    'stab':     ('spear thrust stabbing into armour, quick swish and impact, ' + DRY, 0.6, 2, False),
    'blunt':    ('heavy wooden club smashing a soldier, one dull thump, ' + DRY, 0.6, 1, False),
    'bow':      ('archer shoots an arrow: bowstring thwack and an arrow whooshing past, medieval battle sound effect', 1.2, 3, False),
    'arrowhit': ('arrow striking a soldier, short thud into armour and flesh, ' + DRY, 0.5, 2, False),
    'arrowmiss': ('arrow thudding into dirt ground, short, ' + DRY, 0.5, 2, False),
    'xbow':     ('crossbow shot, mechanical trigger click and heavy bolt whoosh, ' + DRY, 0.8, 1, False),
    'musket':   ('loud single matchlock musket gunshot outdoors, sharp black powder crack and short rolling echo, no music', 1.4, 2, False),
    'cannon':   ('medieval bronze cannon firing outdoors, deep heavy boom with rumble, no music', 2.4, 1, False),
    'catapult': ('wooden catapult arm releasing, creaking timber then heavy thump, no music', 1.4, 1, False),
    'boulder':  ('heavy boulder smashing into the ground, crunching stone and dirt debris, no music', 1.8, 2, False),
    'rocket':   ('volley of many fire arrow rockets launching at once, hissing whoosh, no music', 2.0, 1, False),
    'die':      ('medieval soldier dying in battle, short agonized scream, adult man, no music', 1.0, 6, False),
    'grunt':    ('soldier hit by a sword, short pained grunt, adult man, no music', 0.6, 3, False),
    'horse':    ('horse neighing in pain on a battlefield, no music', 1.5, 2, False),
    'elephant': ('angry war elephant trumpeting loudly, no music', 1.8, 1, False),
    'wolf':     ('wolf yelping in pain, short, no music', 0.8, 1, False),
    'collapse': ('stone castle tower collapsing, rubble and bricks crumbling down, no music', 3.0, 1, False),
    'woodbreak': ('wooden siege engine smashed apart, cracking splintering timber, no music', 1.4, 1, False),
    'horn':     ('medieval war horn, one long low powerful call across a battlefield, no music', 3.5, 1, False),
    'cry':      ('army of hundreds of medieval soldiers shouting a battle cry and charging, no music', 3.0, 1, False),
    'charge':   ('cavalry charge, many horses galloping hard and riders yelling, no music', 2.5, 1, False),
    'victory':  ('short medieval victory fanfare on brass trumpets with cheering soldiers', 4.5, 1, False),
    'defeat':   ('low mournful horn call, sad defeat, medieval', 4.0, 1, False),
    'pray':     ('soft low monk chant, a few murmured words, calm', 1.6, 1, False),
    # unit signatures
    'kiai':     ('samurai warrior battle shout, one short fierce kiai yell, adult man, no music', 0.8, 2, False),
    'roar':     ('viking berserker roaring a savage war cry, short, adult man, no music', 1.0, 2, False),
    'whoop':    ('aztec warrior war whoop, high fierce battle cry, short, no music', 1.0, 2, False),
    'bash':     ('large wooden roman shield bashing into an enemy, heavy thud with metal rim, ' + DRY, 0.7, 2, False),
    'lance':    ('knight lance impact at full gallop, wood cracking and armour crash, ' + DRY, 1.0, 2, False),
    'ramhit':   ('battering ram slamming into a wooden castle gate, huge booming thud, no music', 1.4, 2, False),
    'ballista': ('ballista firing: heavy wooden thunk and a big bolt whooshing away, no music', 1.2, 1, False),
    'treb':     ('giant trebuchet releasing, heavy timber creak, counterweight drop and a long swoosh, no music', 2.4, 1, False),
    'throw':    ('throwing a javelin or axe, quick hard whoosh through the air, ' + DRY, 0.6, 2, False),
    'growl':    ('wolf snarling and snapping its jaws in attack, short, no music', 0.9, 2, False),
    'camel':    ('camel groaning loudly in distress, no music', 1.4, 1, False),
    'horsefall': ('horse falling heavily to the ground with armour clatter, no music', 1.4, 1, False),
    # loops
    'amb_battle': ('distant medieval battle ambience, many soldiers fighting far away, swords clashing and men shouting, continuous, no music', 22, 1, True),
    'mus_drums':  ('epic medieval war drums, slow heavy powerful rhythm with low horns, tense battle soundtrack', 22, 1, True),
    'amb_camp':   ('calm medieval army camp at dusk, gentle wind, crackling campfire, distant lute melody', 22, 1, True),
}

def gen(name, i, prompt, secs, loop):
    path = os.path.join(OUT, '%s%d.mp3' % (name, i))
    if os.path.exists(path): return name, i, 'cached'
    body = {'text': prompt, 'duration_seconds': secs, 'prompt_influence': 0.55}
    if loop: body['loop'] = True
    for attempt in range(4):
        try:
            req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation', data=json.dumps(body).encode(), method='POST',
                                         headers={'xi-api-key': KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
            with urllib.request.urlopen(req, timeout=180) as r: data = r.read()
            open(path, 'wb').write(data); return name, i, '%dKB' % (len(data) // 1024)
        except urllib.error.HTTPError as e:
            msg = e.read()[:200]
            if e.code in (402, 401): return name, i, 'FAILED %d %s' % (e.code, msg)
            time.sleep(2 ** attempt * 2)
        except Exception as e: time.sleep(2 ** attempt * 2); msg = str(e)
    return name, i, 'FAILED ' + str(msg)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); only = sys.argv[1:]
    jobs = [(n, i, p, s, l) for n, (p, s, v, l) in SFX.items() if not only or n in only for i in range(v)]
    with cf.ThreadPoolExecutor(3) as ex:
        for name, i, res in ex.map(lambda j: gen(*j), jobs): print('%-11s %d %s' % (name, i, res), flush=True)
