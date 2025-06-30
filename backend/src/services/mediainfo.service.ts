// MediaInfo service using filename parsing
// This provides comprehensive technical detail extraction from file names and paths

export interface VideoTechnicalDetails {
  codec: string;
  profile: string;
  level: string;
  bitDepth: number;
  colorSpace: string;
  colorRange: string;
  chromaSubsampling: string;
  frameRate: number;
  hdrFormat?: string;
  scanType: string;
  bitrate: number;
  width: number;
  height: number;
}

export interface AudioTechnicalDetails {
  codec: string;
  channels: number;
  channelLayout: string;
  sampleRate: number;
  bitDepth: number;
  bitrate: number;
}

export interface ContainerDetails {
  format: string;
  size: number;
  duration: number;
  overallBitrate: number;
}

export class MediaInfoService {
  constructor() {
    console.log('[MediaInfoService] Initialized with filename parsing analysis');
  }

  async analyzeFile(filePath: string): Promise<{
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  } | null> {
    try {
      console.log(`[MediaInfoService] Analyzing file: ${filePath}`);
      
      // Parse technical details from filename and path
      const analysis = this.parseFromFileName(filePath);
      return analysis;
    } catch (error) {
      console.error(`[MediaInfoService] Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private parseFromFileName(filePath: string): {
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  } {
    const fileName = filePath.toLowerCase();
    
    return {
      video: this.extractVideoDetails(fileName, filePath),
      audio: this.extractAudioDetails(fileName),
      container: this.extractContainerDetails(fileName, filePath)
    };
  }

  private extractVideoDetails(fileName: string, _originalPath: string): VideoTechnicalDetails {
    const codec = this.normalizeCodec(this.extractCodecFromName(fileName));
    const bitDepth = this.extractBitDepthFromName(fileName);
    const hdrFormat = this.extractHDRFromName(fileName);
    const resolution = this.extractResolutionFromName(fileName);
    
    return {
      codec,
      profile: this.getProfileFromCodecAndBitDepth(codec, bitDepth),
      level: this.estimateLevel(resolution),
      bitDepth,
      colorSpace: hdrFormat ? 'Rec. 2020' : 'Rec. 709',
      colorRange: 'Limited',
      chromaSubsampling: '4:2:0',
      frameRate: this.extractFrameRateFromName(fileName),
      hdrFormat,
      scanType: 'Progressive',
      bitrate: this.estimateBitrate(resolution, codec),
      width: resolution.width,
      height: resolution.height
    };
  }

  private extractAudioDetails(fileName: string): AudioTechnicalDetails {
    const audioCodec = this.extractAudioCodecFromName(fileName);
    
    return {
      codec: audioCodec,
      channels: this.estimateChannels(fileName),
      channelLayout: this.getChannelLayout(this.estimateChannels(fileName)),
      sampleRate: 48000,
      bitDepth: audioCodec.includes('DTS') || audioCodec.includes('TrueHD') ? 24 : 16,
      bitrate: this.estimateAudioBitrate(audioCodec)
    };
  }

  private extractContainerDetails(fileName: string, _filePath: string): ContainerDetails {
    const format = this.extractFormatFromName(fileName);
    
    return {
      format,
      size: 0, // Would be filled from actual file stats
      duration: 0, // Would be extracted from MediaInfo
      overallBitrate: 0 // Would be calculated from size/duration
    };
  }

  // Helper methods for data extraction from file names
  private extractCodecFromName(fileName: string): string {
    if (/x265|hevc|h\.?265/i.test(fileName)) return 'H.265';
    if (/x264|avc|h\.?264/i.test(fileName)) return 'H.264';
    if (/av1/i.test(fileName)) return 'AV1';
    if (/vp9/i.test(fileName)) return 'VP9';
    if (/vp8/i.test(fileName)) return 'VP8';
    if (/xvid/i.test(fileName)) return 'XVID';
    if (/divx/i.test(fileName)) return 'DivX';
    return 'H.264'; // Default assumption
  }

  private extractBitDepthFromName(fileName: string): number {
    if (/10.?bit|x265.*10|hevc.*10|main.?10/i.test(fileName)) return 10;
    if (/12.?bit/i.test(fileName)) return 12;
    return 8;
  }

  private extractHDRFromName(fileName: string): string | undefined {
    if (/dolby.?vision|dv/i.test(fileName)) return 'Dolby Vision';
    if (/hdr10\+/i.test(fileName)) return 'HDR10+';
    if (/hdr10|hdr/i.test(fileName)) return 'HDR10';
    if (/hlg/i.test(fileName)) return 'HLG';
    return undefined;
  }

  private extractResolutionFromName(fileName: string): { width: number; height: number } {
    if (/2160p|4k|uhd/i.test(fileName)) return { width: 3840, height: 2160 };
    if (/1080p|fhd/i.test(fileName)) return { width: 1920, height: 1080 };
    if (/720p|hd/i.test(fileName)) return { width: 1280, height: 720 };
    if (/576p/i.test(fileName)) return { width: 720, height: 576 };
    if (/480p/i.test(fileName)) return { width: 720, height: 480 };
    return { width: 1920, height: 1080 }; // Default assumption
  }

  private extractFrameRateFromName(fileName: string): number {
    if (/60fps|60p/i.test(fileName)) return 60;
    if (/30fps|30p/i.test(fileName)) return 30;
    if (/25fps|25p/i.test(fileName)) return 25;
    if (/24fps|24p/i.test(fileName)) return 24;
    if (/23\.976|23\.97/i.test(fileName)) return 23.976;
    return 23.976; // Common default for movies
  }

  private extractAudioCodecFromName(fileName: string): string {
    if (/truehd|atmos/i.test(fileName)) return 'TrueHD';
    if (/dts-hd|dts\.hd/i.test(fileName)) return 'DTS-HD';
    if (/dts/i.test(fileName)) return 'DTS';
    if (/e-ac3|eac3/i.test(fileName)) return 'E-AC3';
    if (/ac3/i.test(fileName)) return 'AC3';
    if (/aac/i.test(fileName)) return 'AAC';
    if (/mp3/i.test(fileName)) return 'MP3';
    return 'AAC'; // Default assumption
  }

  private extractFormatFromName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      'mkv': 'Matroska',
      'mp4': 'MP4',
      'avi': 'AVI',
      'mov': 'QuickTime',
      'm4v': 'MP4',
      'ts': 'MPEG-TS',
      'wmv': 'WMV'
    };
    return formatMap[ext || ''] || ext || 'Unknown';
  }

  // Estimation methods
  private getProfileFromCodecAndBitDepth(codec: string, bitDepth: number): string {
    if (codec === 'H.265' || codec === 'H.264') {
      if (bitDepth >= 10) return 'Main 10';
      return 'Main';
    }
    if (codec === 'AV1') {
      return bitDepth >= 10 ? 'Main 10' : 'Main';
    }
    return 'Unknown';
  }

  private estimateLevel(resolution: { width: number; height: number }): string {
    const pixels = resolution.width * resolution.height;
    if (pixels >= 3840 * 2160) return '5.1'; // 4K
    if (pixels >= 1920 * 1080) return '4.0'; // 1080p
    if (pixels >= 1280 * 720) return '3.1'; // 720p
    return '3.0';
  }

  private estimateBitrate(resolution: { width: number; height: number }, codec: string): number {
    const pixels = resolution.width * resolution.height;
    const codecEfficiency = this.getCodecEfficiency(codec);
    
    let baseBitrate: number;
    if (pixels >= 3840 * 2160) baseBitrate = 15000; // 4K
    else if (pixels >= 1920 * 1080) baseBitrate = 8000; // 1080p
    else if (pixels >= 1280 * 720) baseBitrate = 4000; // 720p
    else baseBitrate = 2000; // Lower resolutions
    
    return Math.round(baseBitrate / codecEfficiency);
  }

  private estimateChannels(fileName: string): number {
    if (/7\.1|atmos/i.test(fileName)) return 8;
    if (/5\.1/i.test(fileName)) return 6;
    if (/stereo|2\.0/i.test(fileName)) return 2;
    return 2; // Default stereo
  }

  private getChannelLayout(channels: number): string {
    const layouts: Record<number, string> = {
      1: 'Mono',
      2: 'Stereo',
      6: '5.1',
      8: '7.1'
    };
    return layouts[channels] || `${channels} channels`;
  }

  private estimateAudioBitrate(codec: string): number {
    const bitrateMap: Record<string, number> = {
      'TrueHD': 3000,
      'DTS-HD': 1500,
      'DTS': 1509,
      'E-AC3': 640,
      'AC3': 448,
      'AAC': 128,
      'MP3': 320
    };
    return bitrateMap[codec] || 128;
  }

  private getCodecEfficiency(codec: string): number {
    const efficiencyMap: Record<string, number> = {
      'AV1': 2.0,
      'H.265': 1.8,
      'VP9': 1.6,
      'H.264': 1.0,
      'XVID': 0.8,
      'DivX': 0.8
    };
    return efficiencyMap[codec] || 1.0;
  }

  private normalizeCodec(codec: string): string {
    const codecMap: Record<string, string> = {
      'avc1': 'H.264',
      'h264': 'H.264',
      'hev1': 'H.265',
      'hvc1': 'H.265',
      'h265': 'H.265',
      'hevc': 'H.265',
      'av01': 'AV1',
      'vp9': 'VP9',
      'vp8': 'VP8'
    };
    return codecMap[codec?.toLowerCase()] || codec || 'Unknown';
  }
}