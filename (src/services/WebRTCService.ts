import {
  RTCPeerConnection,
  RTCDataChannel,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import { ChunkPacket, FileMeta } from '../types';

type MessageCallback = (data: any) => void;

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessageCallback: MessageCallback | null = null;

  constructor() {
    this.initPeer();
  }

  private initPeer() {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelListeners();
    };
  }

  public createDataChannel(channelName: string = 'fileTransfer') {
    if (!this.peerConnection) return;
    this.dataChannel = this.peerConnection.createDataChannel(channelName, {
      ordered: true,
    });
    this.setupDataChannelListeners();
  }

  private setupDataChannelListeners() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('WebRTC Data Channel Opened');
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onMessageCallback) {
        const parsed = JSON.parse(event.data);
        this.onMessageCallback(parsed);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('DataChannel Error:', error);
    };
  }

  public setOnMessageListener(callback: MessageCallback) {
    this.onMessageCallback = callback;
  }

  public async createOffer() {
    if (!this.peerConnection) return null;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(offer: RTCSessionDescription) {
    if (!this.peerConnection) return null;
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: RTCSessionDescription) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(answer);
  }

  public async addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(candidate);
  }

  public sendPacket(packet: { type: 'META' | 'CHUNK' | 'ACK'; payload: any }) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(packet));
    } else {
      throw new Error('DataChannel is not open');
    }
  }

  public close() {
    this.dataChannel?.close();
    this.peerConnection?.close();
  }
}
