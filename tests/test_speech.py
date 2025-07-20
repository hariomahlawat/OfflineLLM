import sys
import types
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# stub whisper
whisper_mod = types.ModuleType('whisper')
class DummyModel:
    def transcribe(self, path):
        return {'text': f'transcribed {Path(path).name}'}
whisper_mod.load_model = lambda name='base': DummyModel()
sys.modules['whisper'] = whisper_mod

import app.speech as speech  # noqa: E402
speech.whisper = whisper_mod
speech._MODEL = None

def test_transcribe_audio(tmp_path):
    audio = tmp_path / 'a.wav'
    audio.write_bytes(b'fake')
    assert speech.transcribe_audio(audio) == f'transcribed {audio.name}'
