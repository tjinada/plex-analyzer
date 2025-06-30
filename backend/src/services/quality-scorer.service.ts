import { VideoTechnicalDetails, AudioTechnicalDetails } from './mediainfo.service';

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
    _fileSize: number,
    sourceType?: string,
    audioDetails?: AudioTechnicalDetails,
    encodingTool?: string,
    filePath?: string,
    hasMultipleAudioTracks?: boolean,
    hasSubtitles?: boolean
  ): {
    components: QualityScoreComponents;
    totalScore: number;
    tier: QualityTier;
    upgradeReasons: string[];
  } {
    const components: QualityScoreComponents = {
      resolutionScore: this.calculateResolutionScore(mediaDetails.width, mediaDetails.height),
      codecScore: this.calculateCodecScore(mediaDetails.codec, mediaDetails.profile, encodingTool, filePath),
      bitrateScore: this.calculateBitrateScore(mediaDetails.bitrate, mediaDetails.width, mediaDetails.height, mediaDetails.codec),
      sourceScore: this.calculateSourceScore(sourceType || 'Unknown', filePath),
      technicalScore: this.calculateTechnicalScore(
        mediaDetails, 
        audioDetails, 
        hasMultipleAudioTracks, 
        hasSubtitles, 
        mediaDetails.profile
      )
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

  private calculateCodecScore(codec: string, profile: string, encodingTool?: string, filePath?: string): number {
    const codecLower = codec.toLowerCase();
    let baseScore = 0;
    
    // Base codec scores
    if (codecLower.includes('av1')) {
      baseScore = 20;
    } else if (codecLower.includes('h.265') || codecLower.includes('hevc')) {
      baseScore = profile.toLowerCase().includes('main 10') ? 19 : 18;
    } else if (codecLower.includes('vp9')) {
      baseScore = 16;
    } else if (codecLower.includes('h.264') || codecLower.includes('avc')) {
      // Collapse H.264 profiles as they're often unreliable
      baseScore = 14;
    } else if (codecLower.includes('mpeg-4') || codecLower.includes('xvid')) {
      baseScore = 8;
    } else if (codecLower.includes('mpeg-2')) {
      baseScore = 4;
    }
    
    // Efficiency tuning bonus (1-2 points max)
    let efficiencyBonus = 0;
    const fileInfo = (encodingTool || '') + ' ' + (filePath || '');
    const fileInfoLower = fileInfo.toLowerCase();
    
    // Check for efficient x265 presets
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) {
      if (fileInfoLower.includes('slow') || fileInfoLower.includes('slower') || fileInfoLower.includes('veryslow')) {
        efficiencyBonus += 1;
      }
      if (fileInfoLower.includes('crf') && /crf[:\s]?1[0-9]\b/.test(fileInfoLower)) {
        // CRF under 20
        efficiencyBonus += 1;
      }
    }
    
    return Math.min(20, baseScore + efficiencyBonus);
  }

  private calculateBitrateScore(bitrate: number, width: number, height: number, codec: string): number {
    const pixels = width * height;
    const codecEfficiency = this.getCodecEfficiency(codec);
    
    // Calculate expected bitrate ranges (kbps) - adjusted for modern codec efficiency
    let optimalBitrate: number;
    let minAcceptable: number;
    let maxEfficient: number;

    if (pixels >= 3840 * 2160) {        // 4K
      optimalBitrate = 15000 / codecEfficiency;
      minAcceptable = 8000 / codecEfficiency;
      maxEfficient = 30000 / codecEfficiency;
    } else if (pixels >= 1920 * 1080) { // 1080p
      optimalBitrate = 8000 / codecEfficiency;
      minAcceptable = 4000 / codecEfficiency;
      maxEfficient = 20000 / codecEfficiency;
    } else if (pixels >= 1280 * 720) {  // 720p
      optimalBitrate = 4000 / codecEfficiency;
      minAcceptable = 2000 / codecEfficiency;
      maxEfficient = 10000 / codecEfficiency;
    } else {                             // < 720p
      optimalBitrate = 2000 / codecEfficiency;
      minAcceptable = 1000 / codecEfficiency;
      maxEfficient = 5000 / codecEfficiency;
    }

    const bitrateKbps = bitrate / 1000;

    // Score based on efficiency and quality balance
    if (bitrateKbps >= optimalBitrate * 0.8 && bitrateKbps <= optimalBitrate * 1.2) {
      return 20; // Optimal efficiency range
    } else if (bitrateKbps < minAcceptable) {
      // Under-bitrate: significant quality penalty
      const underPercent = bitrateKbps / minAcceptable;
      return Math.max(0, Math.round(10 * underPercent));
    } else if (bitrateKbps > maxEfficient) {
      // Over-bitrate: minor efficiency penalty (high bitrate ≠ low quality)
      return 17; // Only -3 points for being inefficient
    } else if (bitrateKbps < optimalBitrate) {
      // Between min and optimal
      const range = optimalBitrate - minAcceptable;
      const position = bitrateKbps - minAcceptable;
      return Math.round(10 + (position / range) * 10);
    } else {
      // Between optimal and max efficient
      const range = maxEfficient - optimalBitrate;
      const position = bitrateKbps - optimalBitrate;
      // Gradually decrease from 20 to 17
      return Math.round(20 - (position / range) * 3);
    }
  }

  private getCodecEfficiency(codec: string): number {
    const codecLower = codec.toLowerCase();
    if (codecLower.includes('av1')) return 2.2;  // AV1 is even more efficient
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) return 1.8;
    if (codecLower.includes('vp9')) return 1.6;
    if (codecLower.includes('h.264') || codecLower.includes('avc')) return 1.0;
    return 0.8; // Older codecs
  }

  private calculateSourceScore(sourceType: string, filePath?: string): number {
    const sourceLower = sourceType.toLowerCase();
    const filePathLower = (filePath || '').toLowerCase();
    
    // Blu-ray sources
    if (sourceLower.includes('blu-ray') && sourceLower.includes('remux')) return 20;
    if (sourceLower.includes('blu-ray') || sourceLower.includes('bluray')) return 17;
    
    // Web sources with quality tiers
    if (sourceLower.includes('web-dl') || sourceLower.includes('webdl')) {
      // Premium streaming sources
      if (filePathLower.includes('amzn') || filePathLower.includes('amazon')) return 15;
      if (filePathLower.includes('nf') || filePathLower.includes('netflix')) return 15;
      if (filePathLower.includes('atvp') || filePathLower.includes('apple')) return 15;
      if (filePathLower.includes('dsnp') || filePathLower.includes('disney')) return 14;
      if (filePathLower.includes('itunes')) return 13;
      return 12; // Generic WEB-DL
    }
    
    // Web-DL Remux (non-BD remux)
    if (sourceLower.includes('remux') && (sourceLower.includes('web') || filePathLower.includes('web'))) return 14;
    
    // Other sources
    if (sourceLower.includes('web-rip') || sourceLower.includes('webrip')) return 10;
    if (sourceLower.includes('hdtv')) return 8;
    if (sourceLower.includes('dvd')) return 5;
    if (sourceLower.includes('cam') || sourceLower.includes('screener')) return 2;
    
    return 6; // Unknown but present
  }

  private calculateTechnicalScore(
    details: VideoTechnicalDetails, 
    audioDetails?: AudioTechnicalDetails,
    hasMultipleAudioTracks?: boolean,
    hasSubtitles?: boolean,
    profile?: string
  ): number {
    let score = 0;
    
    // HDR bonus (max 6 points to prevent over-scoring)
    if (details.hdrFormat) {
      if (details.hdrFormat.includes('Dolby Vision')) score += 6;
      else if (details.hdrFormat.includes('HDR10+')) score += 5;
      else if (details.hdrFormat.includes('HDR10')) score += 4;
      else if (details.hdrFormat.includes('HLG')) score += 3;
    }
    
    // Bit depth bonus - but avoid double counting if already in profile
    const profileHas10Bit = profile?.toLowerCase().includes('10');
    if (details.bitDepth >= 10 && !profileHas10Bit) {
      score += 2; // Reduced from 4 to avoid double counting
    } else if (details.bitDepth === 8 && !profileHas10Bit) {
      score += 1;
    }
    
    // Color space bonus (max 2 points)
    if (details.colorSpace.includes('2020')) score += 2;
    else if (details.colorSpace.includes('P3')) score += 1.5;
    else if (details.colorSpace.includes('709')) score += 1;
    
    // Audio quality bonus (max 2 points)
    if (audioDetails?.codec) {
      const audioCodecLower = audioDetails.codec.toLowerCase();
      if (audioCodecLower.includes('truehd') && audioCodecLower.includes('atmos')) score += 2;
      else if (audioCodecLower.includes('dts-hd ma') || audioCodecLower.includes('dts:x')) score += 2;
      else if (audioCodecLower.includes('truehd') || audioCodecLower.includes('dts-hd')) score += 1.5;
      else if (audioCodecLower.includes('dts') || audioCodecLower.includes('ac3')) score += 1;
    }
    
    // Multiple audio tracks bonus
    if (hasMultipleAudioTracks) score += 0.5;
    
    // Subtitles bonus
    if (hasSubtitles) score += 0.5;
    
    // Progressive scan bonus
    if (details.scanType === 'Progressive') score += 1;
    
    // Frame rate appropriateness
    if (details.frameRate >= 23.9 && details.frameRate <= 60) score += 1;
    
    return Math.min(score, 15); // Cap at 15 points
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
    _sourceType?: string
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

  /**
   * Calculate overall library quality statistics
   */
  calculateLibraryQualityStats(files: Array<{ qualityScore: number; qualityTier: QualityTier }>): {
    averageScore: number;
    distribution: Record<QualityTier, number>;
    upgradeOpportunities: number;
  } {
    const totalFiles = files.length;
    if (totalFiles === 0) {
      return {
        averageScore: 0,
        distribution: {
          [QualityTier.EXCELLENT]: 0,
          [QualityTier.GOOD]: 0,
          [QualityTier.FAIR]: 0,
          [QualityTier.POOR]: 0
        },
        upgradeOpportunities: 0
      };
    }

    const averageScore = files.reduce((sum, file) => sum + file.qualityScore, 0) / totalFiles;
    
    const distribution = files.reduce((dist, file) => {
      dist[file.qualityTier]++;
      return dist;
    }, {
      [QualityTier.EXCELLENT]: 0,
      [QualityTier.GOOD]: 0,
      [QualityTier.FAIR]: 0,
      [QualityTier.POOR]: 0
    });

    const upgradeOpportunities = files.filter(file => 
      file.qualityTier === QualityTier.POOR || file.qualityTier === QualityTier.FAIR
    ).length;

    return {
      averageScore: Math.round(averageScore * 10) / 10,
      distribution,
      upgradeOpportunities
    };
  }
}