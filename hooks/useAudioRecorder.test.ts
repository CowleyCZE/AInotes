import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from './useAudioRecorder';

describe('useAudioRecorder Hook', () => {
    beforeEach(() => {
        // Proper Class Mock for MediaRecorder
        class MockMediaRecorder {
            state = 'inactive';
            ondataavailable = null;
            onstop = null;
            start() { this.state = 'recording'; }
            stop() { 
                this.state = 'inactive'; 
                if (this.onstop) (this.onstop as any)();
            }
            static canRecord = true;
        }
        vi.stubGlobal('MediaRecorder', MockMediaRecorder);

        // Mock getUserMedia
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia: vi.fn().mockResolvedValue({
                    getTracks: () => [{ stop: vi.fn() }]
                })
            }
        });
        
        // Mock alert
        vi.stubGlobal('alert', vi.fn());
    });

    it('should initialize in inactive state', () => {
        const { result } = renderHook(() => useAudioRecorder());
        expect(result.current.isRecording).toBe(false);
        expect(result.current.recordingTime).toBe(0);
    });

    it('should start recording', async () => {
        const { result } = renderHook(() => useAudioRecorder());
        
        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
    });
});
