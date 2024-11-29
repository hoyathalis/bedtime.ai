// src/components/AudioRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  maxDuration?: number; // in seconds
  onRecordingComplete?: (base64Audio: string) => void; // Callback to send base64 audio data
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ maxDuration = 10, onRecordingComplete }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const [counter, setCounter] = useState<number>(maxDuration);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // To keep track of the media stream

  const startRecording = async () => {
    if (recording) {
      console.log('Already recording. startRecording aborted.');
      return;
    }

    // Check for browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording.');
      console.error('MediaDevices API not supported.');
      return;
    }

    try {
      console.log('Requesting microphone access...');
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        console.log('Data available:', event.data);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('MediaRecorder started.');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert(`Recording error: ${event.error.message}. Please try again.`);
        stopRecording(); // Attempt to stop recording on error
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('MediaRecorder stopped.');
        const audioBlob: Blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url: string = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        // Stop all audio tracks to release the microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          console.log('Microphone access released.');
        }

        // Convert Blob to Base64
        const base64Audio = await blobToBase64(audioBlob);
        if (onRecordingComplete) {
          onRecordingComplete(base64Audio);
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setCounter(maxDuration);
      console.log('Recording started.');

      // Start countdown interval to update the counter every second
      countdownRef.current = window.setInterval(() => {
        setCounter((prevCounter) => {
          if (prevCounter > 0) {
            return prevCounter - 1;
          }
          return 0;
        });
      }, 1000);

      // Set a timeout to automatically stop recording after maxDuration seconds
      stopTimeoutRef.current = window.setTimeout(() => {
        console.log('Automatic stop triggered after max duration.');
        stopRecording();
      }, maxDuration * 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access your microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder.stop() called.');
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    } else {
      console.warn('MediaRecorder is already inactive or null.');
    }

    setRecording(false);
    console.log('Recording state set to false.');

    // Clear the countdown interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      console.log('Countdown interval cleared.');
    }

    // Clear the stop timeout
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
      console.log('Stop timeout cleared.');
    }

    setCounter(maxDuration); // Reset counter
  };

  const handleRecordClick = () => {
    if (recording) {
      console.log('Stop button clicked.');
      stopRecording();
    } else {
      console.log('Start button clicked.');
      startRecording();
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting. Cleaning up...');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        console.log('Recording stopped on unmount.');
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        console.log('Countdown interval cleared on unmount.');
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
        console.log('Stop timeout cleared on unmount.');
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        console.log('Microphone access released on unmount.');
      }
    };
  }, []);

  // Utility function to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input blob."));
      };
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove the data URL prefix
        } else {
          reject(new Error('Unexpected result type'));
        }
      };
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div style={styles.container}>
      <button
        onClick={handleRecordClick}
        style={{
          ...styles.button,
          backgroundColor: recording ? '#DC3545' : '#007BFF', // Change color when recording
        }}
        disabled={false} // Allow manual stopping
        aria-pressed={recording}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        <MicIcon recording={recording} />
        {recording ? ' Stop Recording' : ' Start Recording'}
      </button>
      {recording && (
        <div style={styles.recordingInfo}>
          <p style={styles.recordingText}>
            Recording... ({counter} second{counter !== 1 ? 's' : ''} remaining)
          </p>
          <p style={styles.promptText}>
            Please say: <em>"A quick brown fox jumps over a lazy dog."</em>
          </p>
        </div>
      )}
      {audioURL && (
        <div style={styles.audioContainer}>
          <h3>Recorded Audio:</h3>
          <audio controls src={audioURL}></audio>
        </div>
      )}
    </div>
  );
};

// Microphone Icon Component
interface MicIconProps {
  recording: boolean;
}

const MicIcon: React.FC<MicIconProps> = ({ recording }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={recording ? '#FF0000' : '#000000'}
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: '8px' }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14Z" />
      <path d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11H5C5 14.3137 7.68629 17 11 17C14.3137 17 17 14.3137 17 11H19Z" />
      {recording && <circle cx="12" cy="12" r="1.5" fill="#FF0000" />}
    </svg>
  );
};

// Simple inline styles for demonstration
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    padding: '20px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 30px',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#FFF',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  recordingInfo: {
    marginTop: '10px',
    textAlign: 'center' as 'center',
  },
  recordingText: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  promptText: {
    color: '#333',
    fontStyle: 'italic',
  },
  audioContainer: {
    marginTop: '20px',
    textAlign: 'center' as 'center',
  },
};

export default AudioRecorder;
