import React, { useEffect, useState } from 'react';
import { Text, Button, View, StyleSheet } from 'react-native';
import { useSpeechToText, WHISPER_SMALL } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

function Test() {
  // Model setup for Polish speech recognition
  const model = useSpeechToText({
    model: WHISPER_SMALL, // Multilingual model supporting Polish
  });

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [fileRecorder, setFileRecorder] = useState<AudioRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);

  // Results state
  const [polishTranscription, setPolishTranscription] = useState<string>('');
  const [englishTranslation, setEnglishTranslation] = useState<string>('');

  const handleStartRecording = async () => {
    if (isRecording || !model.isReady) return;

    try {
      setIsRecording(true);
      setAudioChunks([]);

      const newRecorder = new AudioRecorder({
        sampleRate: 16000,
        bufferLengthInSamples: 1600,
      });

      newRecorder.onAudioReady(({ buffer }) => {
        const chunk = buffer.getChannelData(0);
        setAudioChunks((prev) => [...prev, new Float32Array(chunk)]);
      });

      setFileRecorder(newRecorder);
      newRecorder.start();
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!fileRecorder || !isRecording) return;

    try {
      fileRecorder.stop();
      setIsRecording(false);

      // Wait to collect final chunks
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (audioChunks.length === 0) {
        console.warn('No audio chunks recorded');
        return;
      }

      // Combine all chunks into one waveform
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const waveform = new Float32Array(totalLength);
      let offset = 0;

      for (const chunk of audioChunks) {
        waveform.set(chunk, offset);
        offset += chunk.length;
      }

      // Polish transcription
      const polishResult = await model.transcribe(waveform, {
        language: 'pl',
      });
      setPolishTranscription(polishResult || 'No transcription result');

      // English translation - using the same model but without language constraint
      // This should trigger the model's translation capability
      const englishResult = await model.transcribe(waveform, {
        language: 'en',
      });
      setEnglishTranslation(englishResult || 'No translation result');
    } catch (error) {
      console.error('❌ Error during transcription:', error);
    } finally {
      setFileRecorder(null);
      setIsRecording(false);
      setAudioChunks([]);
    }
  };

  const handleClear = () => {
    setPolishTranscription('');
    setEnglishTranslation('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Polish Speech-to-Text & Translation</Text>

      <Text style={styles.status}>
        Model Status: {model.isReady ? '✅ Ready' : '⏳ Loading...'}
      </Text>

      {isRecording && <Text style={styles.recordingStatus}>🔴 Recording...</Text>}

      {model.error && <Text style={styles.error}>Error: {model.error}</Text>}

      {/* Results Display */}
      <View style={styles.resultsContainer}>
        <View style={styles.transcriptionContainer}>
          <Text style={styles.label}>🇵🇱 Polish Transcription:</Text>
          <Text style={styles.transcription}>
            {polishTranscription || 'No transcription yet...'}
          </Text>
        </View>

        <View style={styles.translationContainer}>
          <Text style={styles.label}>🇬🇧 English Translation:</Text>
          <Text style={styles.translation}>
            {englishTranslation || 'No translation yet...'}
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleStartRecording}
          title="🎤 Start Recording"
          disabled={!model.isReady || isRecording}
        />

        <Button
          onPress={handleStopRecording}
          title="🛑 Stop Recording"
          disabled={!isRecording}
        />

        <Button
          onPress={handleClear}
          title="🗑️ Clear"
          disabled={!polishTranscription && !englishTranslation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  recordingStatus: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#f44336',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  resultsContainer: {
    marginBottom: 30,
  },
  transcriptionContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  translationContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  transcription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  translation: {
    fontSize: 16,
    color: '#1976D2',
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 15,
  },
});

export default Test;
