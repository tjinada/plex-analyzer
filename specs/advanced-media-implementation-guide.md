# Advanced Media Analysis - Implementation Guide

## Implementation Overview

This guide provides detailed implementation steps for the Advanced Media Analysis features, following KISS, YAGNI, and SOLID principles.

## Phase 1: Backend Foundation

### 1.1 MediaInfo Service Integration

#### Dependencies Installation
```bash
# Install node-mediainfo wrapper
npm install node-mediainfo
npm install @types/node-mediainfo --save-dev

# System dependency (required on server)
# Ubuntu/Debian: apt-get install mediainfo
# CentOS/RHEL: yum install mediainfo
# Docker: include in Dockerfile
```

#### MediaInfo Service Implementation
```typescript
// src/services/mediainfo.service.ts
import { MediaInfo } from 'node-mediainfo';

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
  private mediainfo: MediaInfo;

  constructor() {
    this.mediainfo = new MediaInfo();
  }

  async analyzeFile(filePath: string): Promise<{
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  } | null> {
    try {
      const data = await this.mediainfo.analyzeFile(filePath);
      return this.parseMediaInfoData(data);
    } catch (error) {
      console.error(`[MediaInfoService] Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private parseMediaInfoData(data: any): {
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  } {
    const videoTrack = data.media?.video?.[0] || {};
    const audioTrack = data.media?.audio?.[0] || {};
    const generalTrack = data.media?.general?.[0] || {};

    return {
      video: this.extractVideoDetails(videoTrack),
      audio: this.extractAudioDetails(audioTrack),
      container: this.extractContainerDetails(generalTrack)
    };
  }

  private extractVideoDetails(track: any): VideoTechnicalDetails {
    return {
      codec: this.normalizeCodec(track.codec_id || track.format),
      profile: track.format_profile || 'Unknown',
      level: track.format_level || 'Unknown',
      bitDepth: this.extractBitDepth(track.bit_depth || track.format_profile),
      colorSpace: this.normalizeColorSpace(track.color_space || track.matrix_coefficients),
      colorRange: this.normalizeColorRange(track.color_range),
      chromaSubsampling: this.extractChromaSubsampling(track.chroma_subsampling),
      frameRate: parseFloat(track.frame_rate) || 0,
      hdrFormat: this.detectHDRFormat(track),
      scanType: track.scan_type === 'Interlaced' ? 'Interlaced' : 'Progressive',
      bitrate: parseInt(track.bit_rate) || 0,
      width: parseInt(track.width) || 0,
      height: parseInt(track.height) || 0
    };
  }

  private extractAudioDetails(track: any): AudioTechnicalDetails {
    return {
      codec: this.normalizeAudioCodec(track.codec_id || track.format),
      channels: parseInt(track.channel_s) || 2,
      channelLayout: track.channel_layout || 'Unknown',
      sampleRate: parseInt(track.sampling_rate) || 48000,
      bitDepth: parseInt(track.bit_depth) || 16,
      bitrate: parseInt(track.bit_rate) || 0
    };
  }

  private extractContainerDetails(track: any): ContainerDetails {
    return {
      format: track.format || 'Unknown',
      size: parseInt(track.file_size) || 0,
      duration: parseFloat(track.duration) || 0,
      overallBitrate: parseInt(track.overall_bit_rate) || 0
    };
  }

  // Helper methods for data normalization
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

  private extractBitDepth(bitDepthStr: string | number): number {
    if (typeof bitDepthStr === 'number') return bitDepthStr;
    if (typeof bitDepthStr === 'string') {
      const match = bitDepthStr.match(/(\d+)\s*bit/i);
      if (match) return parseInt(match[1]);
      if (bitDepthStr.toLowerCase().includes('main 10')) return 10;
      if (bitDepthStr.toLowerCase().includes('main 12')) return 12;
    }
    return 8; // Default assumption
  }

  private normalizeColorSpace(colorSpace: string): string {
    if (!colorSpace) return 'Unknown';
    const normalized = colorSpace.toLowerCase();
    if (normalized.includes('2020')) return 'Rec. 2020';
    if (normalized.includes('709')) return 'Rec. 709';
    if (normalized.includes('p3') || normalized.includes('dci')) return 'DCI-P3';
    return colorSpace;
  }

  private normalizeColorRange(range: string): string {
    if (!range) return 'Unknown';
    return range.toLowerCase().includes('full') ? 'Full' : 'Limited';
  }

  private extractChromaSubsampling(chroma: string): string {
    if (!chroma) return 'Unknown';
    if (chroma.includes('4:2:0')) return '4:2:0';
    if (chroma.includes('4:2:2')) return '4:2:2';
    if (chroma.includes('4:4:4')) return '4:4:4';
    return chroma || 'Unknown';
  }

  private detectHDRFormat(track: any): string | undefined {
    const transferCharacteristics = track.transfer_characteristics?.toLowerCase() || '';
    const colorPrimaries = track.color_primaries?.toLowerCase() || '';
    const masteringDisplay = track.mastering_display_color_primaries;
    
    if (transferCharacteristics.includes('smpte 2084') || transferCharacteristics.includes('pq')) {
      if (masteringDisplay || track.content_light_level) {
        return 'HDR10';
      }
    }
    
    if (transferCharacteristics.includes('arib')) {
      return 'HLG';
    }
    
    // Check for Dolby Vision
    if (track.codec_id?.includes('dvhe') || track.codec_id?.includes('dav1')) {
      return 'Dolby Vision';
    }
    
    return undefined;
  }

  private normalizeAudioCodec(codec: string): string {
    const codecMap: Record<string, string> = {
      'mp4a': 'AAC',
      'ac-3': 'AC3',
      'e-ac-3': 'E-AC3',
      'dts': 'DTS',
      'truehd': 'TrueHD'
    };
    return codecMap[codec?.toLowerCase()] || codec || 'Unknown';
  }
}
```

### 1.2 Quality Scoring Engine

```typescript
// src/services/quality-scorer.service.ts
export interface QualityScoreComponents {
  resolutionScore: number;    // 0-25
  codecScore: number;         // 0-20
  bitrateScore: number;       // 0-20
  sourceScore: number;        // 0-15
  technicalScore: number;     // 0-20
}

export enum QualityTier {
  EXCELLENT = 'Excellent',  // 85-100
  GOOD = 'Good',            // 70-84
  FAIR = 'Fair',            // 50-69
  POOR = 'Poor'             // 0-49
}

export class QualityScorerService {
  
  calculateQualityScore(
    mediaDetails: VideoTechnicalDetails,
    fileSize: number,
    sourceType?: string
  ): {
    components: QualityScoreComponents;
    totalScore: number;
    tier: QualityTier;
    upgradeReasons: string[];
  } {
    const components: QualityScoreComponents = {
      resolutionScore: this.calculateResolutionScore(mediaDetails.width, mediaDetails.height),
      codecScore: this.calculateCodecScore(mediaDetails.codec, mediaDetails.profile),
      bitrateScore: this.calculateBitrateScore(mediaDetails.bitrate, mediaDetails.width, mediaDetails.height, mediaDetails.codec),
      sourceScore: this.calculateSourceScore(sourceType || 'Unknown'),
      technicalScore: this.calculateTechnicalScore(mediaDetails)
    };

    const totalScore = Object.values(components).reduce((sum, score) => sum + score, 0);
    const tier = this.determineQualityTier(totalScore);
    const upgradeReasons = this.generateUpgradeReasons(components, mediaDetails, sourceType);

    return { components, totalScore, tier, upgradeReasons };
  }

  private calculateResolutionScore(width: number, height: number): number {
    const pixels = width * height;
    
    if (pixels >= 3840 * 2160) return 25;      // 4K UHD
    if (pixels >= 1920 * 1080) return 20;      // 1080p
    if (pixels >= 1280 * 720) return 15;       // 720p
    if (pixels >= 720 * 576) return 10;        // 576p
    if (pixels >= 720 * 480) return 5;         // 480p
    return 0;                                   // < 480p
  }

  private calculateCodecScore(codec: string, profile: string): number {
    const codecLower = codec.toLowerCase();
    
    if (codecLower.includes('av1')) return 20;
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) {
      return profile.toLowerCase().includes('main 10') ? 19 : 18;
    }
    if (codecLower.includes('vp9')) return 16;
    if (codecLower.includes('h.264') || codecLower.includes('avc')) {
      if (profile.toLowerCase().includes('high')) return 15;
      if (profile.toLowerCase().includes('main')) return 14;
      return 12;
    }
    if (codecLower.includes('mpeg-4')) return 8;
    if (codecLower.includes('mpeg-2')) return 4;
    return 0;
  }

  private calculateBitrateScore(bitrate: number, width: number, height: number, codec: string): number {
    const pixels = width * height;
    const codecEfficiency = this.getCodecEfficiency(codec);
    
    // Calculate expected bitrate ranges (kbps)
    let optimalBitrate: number;
    let minAcceptable: number;
    let maxReasonable: number;

    if (pixels >= 3840 * 2160) {        // 4K
      optimalBitrate = 15000 / codecEfficiency;
      minAcceptable = 8000 / codecEfficiency;
      maxReasonable = 25000 / codecEfficiency;
    } else if (pixels >= 1920 * 1080) { // 1080p
      optimalBitrate = 8000 / codecEfficiency;
      minAcceptable = 4000 / codecEfficiency;
      maxReasonable = 15000 / codecEfficiency;
    } else if (pixels >= 1280 * 720) {  // 720p
      optimalBitrate = 4000 / codecEfficiency;
      minAcceptable = 2000 / codecEfficiency;
      maxReasonable = 8000 / codecEfficiency;
    } else {                             // < 720p
      optimalBitrate = 2000 / codecEfficiency;
      minAcceptable = 1000 / codecEfficiency;
      maxReasonable = 4000 / codecEfficiency;
    }

    const bitrateKbps = bitrate / 1000;

    // Score based on how close to optimal
    if (bitrateKbps >= optimalBitrate * 0.8 && bitrateKbps <= optimalBitrate * 1.2) {
      return 20; // Optimal range
    } else if (bitrateKbps >= minAcceptable && bitrateKbps <= maxReasonable) {
      const distance = Math.abs(bitrateKbps - optimalBitrate) / optimalBitrate;
      return Math.max(10, 20 - (distance * 15));
    } else if (bitrateKbps < minAcceptable) {
      return Math.max(0, 10 - ((minAcceptable - bitrateKbps) / minAcceptable * 10));
    } else {
      return Math.max(5, 15 - ((bitrateKbps - maxReasonable) / maxReasonable * 10));
    }
  }

  private getCodecEfficiency(codec: string): number {
    const codecLower = codec.toLowerCase();
    if (codecLower.includes('av1')) return 2.0;
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) return 1.8;
    if (codecLower.includes('vp9')) return 1.6;
    if (codecLower.includes('h.264') || codecLower.includes('avc')) return 1.0;
    return 0.8; // Older codecs
  }

  private calculateSourceScore(sourceType: string): number {
    const sourceLower = sourceType.toLowerCase();
    
    if (sourceLower.includes('blu-ray') && sourceLower.includes('remux')) return 15;
    if (sourceLower.includes('blu-ray')) return 13;
    if (sourceLower.includes('web-dl') || sourceLower.includes('webdl')) return 12;
    if (sourceLower.includes('web-rip') || sourceLower.includes('webrip')) return 10;
    if (sourceLower.includes('hdtv')) return 8;
    if (sourceLower.includes('dvd')) return 5;
    return 0; // Unknown source
  }

  private calculateTechnicalScore(details: VideoTechnicalDetails): number {
    let score = 0;
    
    // HDR bonus
    if (details.hdrFormat) {
      if (details.hdrFormat.includes('Dolby Vision')) score += 8;
      else if (details.hdrFormat.includes('HDR10+')) score += 6;
      else if (details.hdrFormat.includes('HDR10')) score += 5;
      else if (details.hdrFormat.includes('HLG')) score += 4;
    }
    
    // Bit depth bonus
    if (details.bitDepth >= 10) score += 4;
    else if (details.bitDepth === 8) score += 2;
    
    // Color space bonus
    if (details.colorSpace.includes('2020')) score += 4;
    else if (details.colorSpace.includes('P3')) score += 3;
    else if (details.colorSpace.includes('709')) score += 2;
    
    // Progressive scan bonus
    if (details.scanType === 'Progressive') score += 2;
    
    // Frame rate appropriateness
    if (details.frameRate >= 23.9 && details.frameRate <= 60) score += 2;
    
    return Math.min(score, 20); // Cap at 20 points
  }

  private determineQualityTier(score: number): QualityTier {
    if (score >= 85) return QualityTier.EXCELLENT;
    if (score >= 70) return QualityTier.GOOD;
    if (score >= 50) return QualityTier.FAIR;
    return QualityTier.POOR;
  }

  private generateUpgradeReasons(
    components: QualityScoreComponents,
    details: VideoTechnicalDetails,
    sourceType?: string
  ): string[] {
    const reasons: string[] = [];
    
    if (components.resolutionScore < 15) {
      reasons.push('Low resolution - consider upgrading to 1080p or 4K');
    }
    
    if (components.codecScore < 15) {
      reasons.push('Outdated codec - modern H.265 or AV1 would provide better quality/size ratio');
    }
    
    if (components.bitrateScore < 12) {
      reasons.push('Suboptimal bitrate - quality may be compromised');
    }
    
    if (components.sourceScore < 10) {
      reasons.push('Poor source quality - look for Blu-ray or Web-DL versions');
    }
    
    if (components.technicalScore < 10) {
      if (!details.hdrFormat && details.width >= 1920) {
        reasons.push('Missing HDR - HDR10 version would provide better visual quality');
      }
      if (details.bitDepth < 10 && details.width >= 1920) {
        reasons.push('8-bit color depth - 10-bit version would have better color accuracy');
      }
    }
    
    return reasons;
  }
}
```

### 1.3 Enhanced Analyzer Service

```typescript
// src/services/enhanced-analyzer.service.ts
import { MediaInfoService, VideoTechnicalDetails } from './mediainfo.service';
import { QualityScorerService, QualityTier } from './quality-scorer.service';

export interface EnhancedMediaFile extends MediaFile {
  // Technical details
  videoProfile: string;
  bitDepth: number;
  colorSpace: string;
  colorRange: string;
  chromaSubsampling: string;
  frameRate: number;
  hdrFormat?: string;
  scanType: string;
  
  // Quality metrics
  videoBitrate: number;
  audioBitrate: number;
  overallBitrate: number;
  bitrateEfficiency: number;
  sourceType: string;
  releaseGroup?: string;
  encodingTool: string;
  
  // Quality scoring
  qualityScore: number;
  qualityTier: QualityTier;
  upgradeCandidate: boolean;
  upgradeReasons: string[];
}

export class EnhancedAnalyzerService extends AnalyzerService {
  private mediaInfoService: MediaInfoService;
  private qualityScorer: QualityScorerService;
  private readonly CACHE_PREFIX = 'enhanced_analysis:';

  constructor() {
    super();
    this.mediaInfoService = new MediaInfoService();
    this.qualityScorer = new QualityScorerService();
  }

  async generateEnhancedSizeAnalysis(
    libraryId: string,
    limit: number = -1,
    offset: number = 0
  ): Promise<PaginatedSizeAnalysis> {
    // Get basic analysis first
    const basicAnalysis = await super.getSizeAnalysis(libraryId, limit, offset);
    
    // Enhance with technical details
    const enhancedFiles = await Promise.all(
      basicAnalysis.data.largestFiles.map(file => this.enrichMediaFile(file))
    );

    // Update episode breakdown if present
    let enhancedEpisodeBreakdown: EnhancedMediaFile[] | undefined;
    if (basicAnalysis.data.episodeBreakdown) {
      enhancedEpisodeBreakdown = await Promise.all(
        basicAnalysis.data.episodeBreakdown.map(file => this.enrichMediaFile(file))
      );
    }

    // Generate quality insights
    const qualityDistribution = this.calculateQualityDistribution(enhancedFiles);
    const codecDistribution = this.calculateCodecDistribution(enhancedFiles);
    const upgradeRecommendations = this.generateUpgradeRecommendations(enhancedFiles);

    return {
      ...basicAnalysis,
      data: {
        ...basicAnalysis.data,
        largestFiles: enhancedFiles,
        episodeBreakdown: enhancedEpisodeBreakdown,
        qualityDistribution,
        codecDistribution,
        upgradeRecommendations
      }
    };
  }

  private async enrichMediaFile(file: MediaFile): Promise<EnhancedMediaFile> {
    const cacheKey = `${this.CACHE_PREFIX}${file.id}`;
    const cached = cache.get<EnhancedMediaFile>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Extract technical details from file path or MediaInfo
      const technicalDetails = await this.extractTechnicalDetails(file);
      const sourceType = this.detectSourceType(file.filePath);
      const releaseGroup = this.extractReleaseGroup(file.filePath);
      
      // Calculate quality score
      const qualityData = this.qualityScorer.calculateQualityScore(
        technicalDetails.video,
        file.fileSize,
        sourceType
      );

      const enhancedFile: EnhancedMediaFile = {
        ...file,
        // Technical details
        videoProfile: technicalDetails.video.profile,
        bitDepth: technicalDetails.video.bitDepth,
        colorSpace: technicalDetails.video.colorSpace,
        colorRange: technicalDetails.video.colorRange,
        chromaSubsampling: technicalDetails.video.chromaSubsampling,
        frameRate: technicalDetails.video.frameRate,
        hdrFormat: technicalDetails.video.hdrFormat,
        scanType: technicalDetails.video.scanType,
        
        // Bitrates
        videoBitrate: technicalDetails.video.bitrate,
        audioBitrate: technicalDetails.audio.bitrate,
        overallBitrate: technicalDetails.container.overallBitrate,
        bitrateEfficiency: this.calculateBitrateEfficiency(file.fileSize, technicalDetails.container.duration),
        
        // Source info
        sourceType,
        releaseGroup,
        encodingTool: 'Unknown', // Would need to be extracted from file metadata
        
        // Quality scoring
        qualityScore: qualityData.totalScore,
        qualityTier: qualityData.tier,
        upgradeCandidate: qualityData.tier === QualityTier.POOR || qualityData.upgradeReasons.length > 2,
        upgradeReasons: qualityData.upgradeReasons
      };

      // Cache for 24 hours
      cache.set(cacheKey, enhancedFile, 24 * 60 * 60 * 1000);
      
      return enhancedFile;
    } catch (error) {
      console.error(`[EnhancedAnalyzerService] Failed to enrich file ${file.id}:`, error);
      
      // Return file with minimal enhancements
      return {
        ...file,
        videoProfile: 'Unknown',
        bitDepth: 8,
        colorSpace: 'Unknown',
        colorRange: 'Unknown',
        chromaSubsampling: 'Unknown',
        frameRate: 0,
        scanType: 'Unknown',
        videoBitrate: 0,
        audioBitrate: 0,
        overallBitrate: 0,
        bitrateEfficiency: 0,
        sourceType: 'Unknown',
        encodingTool: 'Unknown',
        qualityScore: 0,
        qualityTier: QualityTier.POOR,
        upgradeCandidate: false,
        upgradeReasons: ['Technical analysis failed']
      };
    }
  }

  private async extractTechnicalDetails(file: MediaFile): Promise<{
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  }> {
    // Try MediaInfo first (if available)
    if (file.filePath && file.filePath !== 'Unknown') {
      const mediaInfoData = await this.mediaInfoService.analyzeFile(file.filePath);
      if (mediaInfoData) {
        return mediaInfoData;
      }
    }

    // Fallback to Plex stream data or file name parsing
    return this.extractFromPlexData(file) || this.parseFromFileName(file);
  }

  private extractFromPlexData(file: MediaFile): any {
    // Extract what we can from existing Plex data
    return {
      video: {
        codec: file.codec || 'Unknown',
        profile: 'Unknown',
        level: 'Unknown',
        bitDepth: 8, // Default assumption
        colorSpace: 'Unknown',
        colorRange: 'Unknown',
        chromaSubsampling: 'Unknown',
        frameRate: 0,
        scanType: 'Progressive',
        bitrate: 0,
        width: parseInt(file.resolution.split('x')[0]) || 0,
        height: parseInt(file.resolution.split('x')[1]) || 0
      },
      audio: {
        codec: 'Unknown',
        channels: 2,
        channelLayout: 'Unknown',
        sampleRate: 48000,
        bitDepth: 16,
        bitrate: 0
      },
      container: {
        format: 'Unknown',
        size: file.fileSize,
        duration: 0,
        overallBitrate: 0
      }
    };
  }

  private parseFromFileName(file: MediaFile): any {
    // Extract technical details from filename patterns
    const fileName = file.filePath || file.title;
    
    const bitDepth = this.extractBitDepthFromName(fileName);
    const hdrFormat = this.extractHDRFromName(fileName);
    const codec = this.extractCodecFromName(fileName);
    
    return {
      video: {
        codec: codec || file.codec || 'Unknown',
        profile: bitDepth === 10 ? 'Main 10' : 'Main',
        level: 'Unknown',
        bitDepth,
        colorSpace: hdrFormat ? 'Rec. 2020' : 'Rec. 709',
        colorRange: 'Limited',
        chromaSubsampling: '4:2:0',
        frameRate: 0,
        hdrFormat,
        scanType: 'Progressive',
        bitrate: 0,
        width: parseInt(file.resolution.split('x')[0]) || 0,
        height: parseInt(file.resolution.split('x')[1]) || 0
      },
      audio: {
        codec: 'Unknown',
        channels: 2,
        channelLayout: 'Unknown',
        sampleRate: 48000,
        bitDepth: 16,
        bitrate: 0
      },
      container: {
        format: this.extractFormatFromName(fileName),
        size: file.fileSize,
        duration: 0,
        overallBitrate: 0
      }
    };
  }

  private extractBitDepthFromName(fileName: string): number {
    if (/10.?bit|x265.*10|hevc.*10/i.test(fileName)) return 10;
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

  private extractCodecFromName(fileName: string): string | undefined {
    if (/x265|hevc|h\.?265/i.test(fileName)) return 'H.265';
    if (/x264|avc|h\.?264/i.test(fileName)) return 'H.264';
    if (/av1/i.test(fileName)) return 'AV1';
    if (/vp9/i.test(fileName)) return 'VP9';
    return undefined;
  }

  private extractFormatFromName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext || 'Unknown';
  }

  private detectSourceType(filePath: string): string {
    const path = filePath.toLowerCase();
    
    if (path.includes('remux')) return 'Blu-ray Remux';
    if (path.includes('bluray') || path.includes('bdrip')) return 'Blu-ray';
    if (path.includes('web-dl') || path.includes('webdl')) return 'Web-DL';
    if (path.includes('webrip') || path.includes('web-rip')) return 'WEB-RIP';
    if (path.includes('hdtv')) return 'HDTV';
    if (path.includes('dvdrip') || path.includes('dvd')) return 'DVD';
    
    return 'Unknown';
  }

  private extractReleaseGroup(filePath: string): string | undefined {
    // Extract release group from filename (usually in brackets at the end)
    const match = filePath.match(/\[([^\]]+)\]$/);
    return match ? match[1] : undefined;
  }

  private calculateBitrateEfficiency(fileSize: number, duration: number): number {
    if (duration === 0) return 0;
    const fileSizeMB = fileSize / (1024 * 1024);
    const durationHours = duration / 3600;
    return fileSizeMB / durationHours; // MB per hour
  }

  // Quality distribution and analysis methods
  private calculateQualityDistribution(files: EnhancedMediaFile[]): QualityDistribution {
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    files.forEach(file => {
      switch (file.qualityTier) {
        case QualityTier.EXCELLENT: distribution.excellent++; break;
        case QualityTier.GOOD: distribution.good++; break;
        case QualityTier.FAIR: distribution.fair++; break;
        case QualityTier.POOR: distribution.poor++; break;
      }
    });

    return distribution;
  }

  private calculateCodecDistribution(files: EnhancedMediaFile[]): CodecDistribution {
    const codecStats: Record<string, {
      count: number;
      totalSize: number;
      qualityScores: number[];
    }> = {};

    files.forEach(file => {
      const codec = file.codec;
      if (!codecStats[codec]) {
        codecStats[codec] = { count: 0, totalSize: 0, qualityScores: [] };
      }
      codecStats[codec].count++;
      codecStats[codec].totalSize += file.fileSize;
      codecStats[codec].qualityScores.push(file.qualityScore);
    });

    const totalFiles = files.length;
    const distribution: CodecDistribution = {};

    Object.entries(codecStats).forEach(([codec, stats]) => {
      distribution[codec] = {
        count: stats.count,
        totalSize: stats.totalSize,
        averageQuality: stats.qualityScores.reduce((sum, score) => sum + score, 0) / stats.qualityScores.length,
        percentage: (stats.count / totalFiles) * 100
      };
    });

    return distribution;
  }

  private generateUpgradeRecommendations(files: EnhancedMediaFile[]): UpgradeRecommendation[] {
    return files
      .filter(file => file.upgradeCandidate)
      .sort((a, b) => a.qualityScore - b.qualityScore) // Worst quality first
      .slice(0, 20) // Top 20 recommendations
      .map(file => ({
        fileId: file.id,
        title: file.title,
        currentQuality: file.qualityTier,
        recommendedUpgrade: this.generateUpgradeRecommendation(file),
        reasons: file.upgradeReasons,
        potentialSavings: this.calculatePotentialSavings(file)
      }));
  }

  private generateUpgradeRecommendation(file: EnhancedMediaFile): string {
    const improvements: string[] = [];
    
    if (file.qualityScore < 50) {
      improvements.push('Higher quality source');
    }
    if (file.codec.includes('H.264')) {
      improvements.push('H.265 encoding');
    }
    if (!file.hdrFormat && file.resolution.includes('2160')) {
      improvements.push('HDR version');
    }
    if (file.bitDepth < 10 && file.resolution.includes('2160')) {
      improvements.push('10-bit color depth');
    }
    
    return improvements.join(', ') || 'Better source quality';
  }

  private calculatePotentialSavings(file: EnhancedMediaFile): number | undefined {
    // Estimate potential file size reduction with better encoding
    if (file.codec.includes('H.264')) {
      return file.fileSize * 0.3; // H.265 typically 30% smaller
    }
    return undefined;
  }
}
```

## Implementation Plan

### Week 1: Foundation
1. **Day 1-2**: Set up MediaInfo service and basic technical detail extraction
2. **Day 3-4**: Implement quality scoring algorithm with comprehensive test cases
3. **Day 5**: Create enhanced analyzer service with caching

### Week 2: Backend Integration
1. **Day 1-2**: Update database schema and migration scripts
2. **Day 3-4**: Enhance existing analyzer endpoints with quality data
3. **Day 5**: Add new quality-specific API endpoints

### Week 3: Frontend Enhancement
1. **Day 1-2**: Update UI components to display technical details
2. **Day 3-4**: Add quality filtering and sorting capabilities
3. **Day 5**: Implement upgrade recommendations interface

### Week 4: Testing & Optimization
1. **Day 1-2**: Performance testing with large libraries
2. **Day 3-4**: User acceptance testing and UI refinements
3. **Day 5**: Documentation and deployment preparation

This implementation provides a solid foundation for advanced media analysis while maintaining performance and following established patterns in the codebase.