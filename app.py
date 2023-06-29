from flask import Flask, request, render_template
from pydub import AudioSegment
import openai
from datetime import datetime
from chatbot import interpret

app = Flask(__name__)

@app.route('/')
def index():
    with open('data.txt', 'r') as f:
        data = [line.strip().split(' | ') for line in f]
        data = [(datetime.strptime(date, '%Y-%m-%d %H:%M').strftime('%A %Hh00'), desc) for date, desc in data]
    return render_template('index.html', data=data)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    now = datetime.now()
    filename = "logs/" + now.strftime('%A_%Hh%M') + '.wav'
    audio_file = request.files['audio']
    audio_file.save(filename)
    transcript = openai.Audio.transcribe(
        file = open(filename, "rb"),
        model = "whisper-1",
        response_format="text",
        language="fr"
    )
    print(transcript)
    return transcript

@app.route('/interpret', methods=['POST'])
def interpret_route():
    text = request.form['text']
    return interpret(text)

@app.route('/send', methods=['POST'])
def send():
    text = request.form['text']
    with open('data.txt', 'a') as f:
        f.write(f'{datetime.now().strftime("%Y-%m-%d %H:%M")} | {text}\n')
    return '', 204

if __name__ == '__main__':
    app.run(ssl_context=('cert.pem', 'key.pem'), port="443",host="0.0.0.0")


