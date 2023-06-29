document.addEventListener('DOMContentLoaded', function() {
    // Define your elements
    var textArea = document.getElementById('text-area');
    var recordBtn = document.getElementById('record-btn');
    var transcribeBtn = document.getElementById('transcribe-btn');
    var interpretBtn = document.getElementById('interpret-btn');
    var sendBtn = document.getElementById('send-btn');
    const downloadLink = document.getElementById('download');

    // Initialize audio recorder
    var mediaRecorder;
    var audioChunks = [];
    let startTime;
    let isRecording = false;
    let intervalId = 0;

    // Define functions
    function record() {
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            alert('mediaDevices API or getUserMedia method is not supported in this browser.')
            return Promise.reject(new Error('mediaDevices API or getUserMedia method is not supported in this browser.'));
        }
        let options = { audio: true, video: false };
        navigator.mediaDevices.getUserMedia(options).then(function(stream) {
            const mrOptions = {mimeType: 'audio/webm'};
            mediaRecorder = new MediaRecorder(stream, mrOptions);
    
            mediaRecorder.addEventListener('dataavailable', function(event) {
                audioChunks.push(event.data);
                console.log("audio pushed: "+ event.data.size)
            });

            mediaRecorder.addEventListener('stop', function() {
                const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
                downloadLink.href = URL.createObjectURL(new Blob(audioChunks));
                downloadLink.download = 'recording.wav';
                const span = document.createElement('span');
                span.textContent = "("+durationInSeconds +"sec)";
                downloadLink.insertAdjacentElement('afterend', span);
            });
            console.log("start recording")
            startTime = Date.now();
            mediaRecorder.start();
        });
    }

    function transcribe(audio) {
        // clear textArea
        textArea.value = '';
    
        // Send audio to /transcribe
        let formData = new FormData();
        formData.append('audio', audio);
        fetch('/transcribe', {
            method: 'POST',
            body: formData
        }).then(response => response.text())
          .then(data => {
              textArea.value = data;
              document.body.removeChild(progressBar);
          });
    }

    function interpret() {
        // Send text to /interpret
        let formData = new FormData();
        formData.append('text', textArea.value);
        fetch('/interpret', {
            method: 'POST',
            body: formData
        }).then(response => response.text())
          .then(data => {
              textArea.value = data;
          });
    }

    function send() {
        // Send text to /send
        let formData = new FormData();
        formData.append('text', textArea.value);
        fetch('/send', {
            method: 'POST',
            body: formData
        }).then(() => {
            textArea.value = '';
            setTimeout(() => {
                location.reload();
            }, 3000);
        });
    }


    // Bind events to buttons
    recordBtn.addEventListener('click', function() {
        if (isRecording) {
            // Stop the recording
            mediaRecorder.stop();
            recordBtn.textContent = 'REC';
            isRecording = false;
        } else {
            // Start the recording
            audioChunks = [];
            record();
            isRecording = true;
            recordBtn.textContent = '...';
        }
    });
    
    transcribeBtn.addEventListener('click', function() {
        console.log(audioChunks.length)
        let audioBlob = new Blob(audioChunks, {type: mediaRecorder.mimeType});
        transcribe(audioBlob);
    });

    interpretBtn.addEventListener('click', interpret);
    sendBtn.addEventListener('click', send);
});

