"""Unit voice lines in each unit's own language, generated with ElevenLabs text-to-speech.

    ELEVENLABS_API_KEY=... python3 tools/audio/voices.py [unit ...]

Each unit answers when selected ("s") and when given an order ("c"), two takes each.
Clips go to tools/audio/raw/v_<unit>_<s|c><n>.mp3; pack.py turns them into assets/audio/.
"""
import json, os, sys, time, urllib.request, concurrent.futures as cf

KEY = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('set ELEVENLABS_API_KEY')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
V = {'harry': 'SOYHLrjzK2X1ezoPC6cr', 'adam': 'pNInz6obpgDQGcFmaJgB', 'george': 'JBFqnCBsd6RMkjVDRZzb', 'callum': 'N2lVS1w4EtoT3dr4eOWO', 'brian': 'nPczCjzI2devNBz1zQrb',
     'daniel': 'onwK4e9ZLuTAKqWW03F9', 'bill': 'pqHfZKP75CvOlQylNhV4', 'charlie': 'IKne3meq5aSn9XLyUdCD', 'roger': 'CwhRBWXzGAHq8TQ4Fs17', 'eric': 'cjVigY5qzO86Huf0OWal',
     'chris': 'iP95p4xoKVk53GoZ742B', 'will': 'bIHbv24MWmeRgasZH58o', 'liam': 'TX3LPaxmHKxFdv7VOQHJ'}
# unit: (voice, [select lines], [order lines])
LINES = {
    'levy':        ('callum', ['Aye?', 'What now?'], ['Right away.', 'If we must...']),
    'swordsman':   ('george', ['Ready, my lord.', 'Yes?'], ['Forward!', 'As you command.']),
    'spearman':    ('chris', ['Spears ready!', 'Yes, sir?'], ['Hold the line!', 'Moving out.']),
    'pikeman':     ('roger', ['Ja?', 'Bereit!'], ['Vorwärts!', 'Zu Befehl!']),
    'manatarms':   ('eric', ['Oui, seigneur?', 'À vos ordres.'], ['En avant!', 'Allons-y!']),
    'berserker':   ('harry', ['Ja!', 'Hvat?'], ['Til Valhallar!', 'Óðinn!']),
    'archer':      ('daniel', ['Bows ready.', 'My lord?'], ['Loose at will!', 'On our way.']),
    'crossbow':    ('eric', ['Sì?', 'Pronti!'], ['Avanti!', 'Subito!']),
    'skirmisher':  ('will', ['Ναι;', 'Έτοιμοι!'], ['Εμπρός!', 'Πάμε!']),
    'musketeer':   ('adam', ['Emredersiniz!', 'Evet?'], ['İleri!', 'Hemen!']),
    'lightcav':    ('liam', ['Tak?', 'Gotowi!'], ['Naprzód!', 'Jazda!']),
    'knight':      ('george', ['My liege?', 'For honour!'], ['Charge!', 'Deus vult!']),
    'horsearcher': ('charlie', ['Hazırız!', 'Evet?'], ['Haydi!', 'Atlara!']),
    'camel':       ('adam', ['نعم؟', 'لبيك!'], ['يلا!', 'إلى الأمام!']),
    'elephant':    ('brian', ['हाँ?', 'तैयार!'], ['आगे बढ़ो!', 'चलो!']),
    'commander':   ('brian', ['Your orders?', 'I am listening.'], ['Follow me!', 'To battle!']),
    'catapult':    ('callum', ['Loaded.', 'Ready to throw.'], ['Heave!', 'Roll it!']),
    'ballista':    ('chris', ['Bolt ready.', 'Yes?'], ['Wind it up!', 'Moving.']),
    'cannon':      ('roger', ['Geladen!', 'Ja?'], ['Feuer frei!', 'Los, schieben!']),
    'ram':         ('harry', ['Ready!', 'Aye?'], ['Heave! Heave!', 'Push!']),
    'monk':        ('bill', ['Pax vobiscum.', 'Benedicite.'], ['Deo volente.', 'Amen.']),
    'legionary':   ('george', ['Ave!', 'Parati sumus!'], ['Procedite!', 'Pro Roma!']),
    'hoplite':     ('will', ['Ναι!', 'Έτοιμοι!'], ['Αλαλαί!', 'Εμπρός, Έλληνες!']),
    'phalangite':  ('adam', ['Έτοιμοι!', 'Ναι;'], ['Εμπρός, Μακεδόνες!', 'Σάρισες κάτω!']),
    'samurai':     ('charlie', ['はっ!', 'ご用ですか?'], ['参る!', '承知!']),
    'landsknecht': ('roger', ['Was gibt\'s?', 'Bereit!'], ['Los geht\'s!', 'Für Kaiser und Reich!']),
    'jaguar':      ('harry', ['Quēmah!', 'Nicān!'], ['Tiyahueh!', 'Mā tiyacān!']),
    'axeman':      ('callum', ['Oui, sire?', 'Prêts!'], ['Pour les Francs!', 'En avant!']),
    'repeater':    ('liam', ['是!', '在!'], ['放箭!', '前进!']),
    'keshig':      ('charlie', ['За!', 'Бэлэн!'], ['Урагшаа!', 'Довтол!']),
    'gaemamusa':   ('brian', ['예!', '명을 내리소서!'], ['돌격하라!', '진격!']),
    'hwacha':      ('chris', ['장전 완료!', '예!'], ['발사 준비!', '옮겨라!']),
    'trebuchet':   ('eric', ['Chargé!', 'Oui?'], ['Tirez!', 'Poussez!']),
    'longbowman':  ('daniel', ['Aye?', 'Bows strung.'], ['Nock, draw, loose!', 'For Saint George!']),
    'slinger':     ('will', ['Sí?', 'Preparats!'], ['Endavant!', 'Ara!']),
    'cataphract':  ('adam', ['Ναι, στρατηγέ;', 'Έτοιμοι!'], ['Νίκα!', 'Εμπρός!']),
    'hussar':      ('liam', ['Tak, panie?', 'Gotowi!'], ['Szarża!', 'Za ojczyznę!']),
    'conquistador': ('eric', ['¿Sí?', '¡Listos!'], ['¡Santiago!', '¡Adelante!']),
    'ashigaru':    ('charlie', ['へい!', '何でしょう?'], ['かかれ!', '進め!']),
    'hwarang':     ('brian', ['예, 장군!', '준비되었습니다!'], ['임전무퇴!', '나아가자!']),
    'templar':     ('george', ['Oui, frère?', 'Non nobis, Domine.'], ['Deus vult!', 'Pour le Temple!']),
    'firelancer':  ('liam', ['在!', '火药装好了!'], ['点火!', '冲啊!']),
}
# a commander's call to arms when a battle starts, by language
SPEECH = {
    'ko': ('brian', ['전군, 돌격하라!', '물러서지 마라! 진격하라!']),
    'en': ('george', ['Men, today we fight! Charge!', 'Hold fast, then strike! For glory!']),
    'la': ('george', ['Ad arma! Pro Roma!', 'Milites, procedite!']),
    'ja': ('charlie', ['者ども、かかれ!', '全軍、突撃!']),
    'de': ('roger', ['Für Kaiser und Reich, vorwärts!', 'Haltet stand! Zum Angriff!']),
    'fr': ('eric', ['Pour la gloire, en avant!', 'Chargez, mes braves!']),
    'el': ('adam', ['Εμπρός, Έλληνες!', 'Αλαλαί! Επίθεση!']),
    'zh': ('liam', ['全军出击!', '将士们，杀啊!']),
    'es': ('eric', ['¡Por Castilla, adelante!', '¡Santiago, y a ellos!']),
    'pl': ('liam', ['Za ojczyznę, naprzód!', 'Szarża, panowie!']),
    'ar': ('adam', ['إلى الأمام يا رجال!', 'اثبتوا! هجوم!']),
    'tr': ('adam', ['İleri, aslanlar!', 'Saldırın!']),
    'mn': ('charlie', ['Урагшаа, баатрууд аа!']),
    'hi': ('brian', ['आगे बढ़ो, वीरों!']),
}

def tts(unit, kind, i, voice, text):
    path = os.path.join(OUT, ('sp_%s%d.mp3' % (kind, i)) if unit == 'sp' else ('v_%s_%s%d.mp3' % (unit, kind, i)))
    if os.path.exists(path): return unit, kind, i, 'cached'
    body = {'text': text, 'model_id': 'eleven_multilingual_v2', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.85, 'style': 0.3, 'use_speaker_boost': True}}
    for attempt in range(4):
        try:
            req = urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128' % V[voice], data=json.dumps(body).encode(), method='POST',
                                         headers={'xi-api-key': KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
            with urllib.request.urlopen(req, timeout=120) as r: data = r.read()
            open(path, 'wb').write(data); return unit, kind, i, '%dKB %s' % (len(data) // 1024, text)
        except urllib.error.HTTPError as e:
            msg = e.read()[:200]
            if e.code in (401, 402): return unit, kind, i, 'FAILED %d %s' % (e.code, msg)
            time.sleep(2 ** attempt * 2)
        except Exception as e: msg = str(e); time.sleep(2 ** attempt * 2)
    return unit, kind, i, 'FAILED ' + str(msg)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); only = sys.argv[1:]
    jobs = [(u, k, i, v, t) for u, (v, s, c) in LINES.items() if not only or u in only for k, L in (('s', s), ('c', c)) for i, t in enumerate(L)]
    jobs += [('sp', lang, i, v, t) for lang, (v, L) in SPEECH.items() if not only or 'speech' in only for i, t in enumerate(L)]
    with cf.ThreadPoolExecutor(3) as ex:
        for u, k, i, res in ex.map(lambda j: tts(*j), jobs): print('%-12s %s%d %s' % (u, k, i, res), flush=True)
