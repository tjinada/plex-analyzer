import { VideoTechnicalDetails } from './mediainfo.service';

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
    if (codecLower.includes('mpeg-4') || codecLower.includes('xvid')) return 8;
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