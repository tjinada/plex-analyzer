import { TautulliAnalyzerService, MediaFile, SizeAnalysis } from './tautulli-analyzer.service';
import { MediaInfoService, VideoTechnicalDetails, AudioTechnicalDetails, ContainerDetails } from './mediainfo.service';
import { QualityScorerService, QualityTier, QualityScoreComponents } from './quality-scorer.service';
import { cache } from '../utils/cache.util';
import { analyzerService } from './analyzer-factory';
import { config } from '../config';

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
  qualityComponents?: QualityScoreComponents;
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface CodecDistribution {
  [codec: string]: {
    count: number;
    totalSize: number;
    averageQuality: number;
    percentage: number;
  };
}

export interface TechnicalBreakdown {
  hdrContent: {
    count: number;
    percentage: number;
    formats: { [format: string]: number };
  };
  bitDepthDistribution: {
    [depth: string]: number;
  };
  colorSpaceDistribution: {
    [space: string]: number;
  };
}

export interface UpgradeRecommendation {
  fileId: string;
  title: string;
  currentQuality: QualityTier;
  recommendedUpgrade: string;
  reasons: string[];
  potentialSavings?: number;
}

export interface EnhancedSizeAnalysis extends SizeAnalysis {
  largestFiles: EnhancedMediaFile[];
  episodeBreakdown?: EnhancedMediaFile[];
  qualityDistribution: QualityDistribution;
  codecDistribution: CodecDistribution;
  technicalBreakdown: TechnicalBreakdown;
  upgradeRecommendations: UpgradeRecommendation[];
}

export interface PaginatedEnhancedSizeAnalysis {
  data: EnhancedSizeAnalysis;
  pagination: any;
}

// We should not extend a specific analyzer service, instead compose with the configured one
export class EnhancedAnalyzerService {
  private mediaInfoService: MediaInfoService;
  private qualityScorer: QualityScorerService;
  private readonly ENHANCED_CACHE_PREFIX = 'enhanced_analysis:';

  constructor() {
    this.mediaInfoService = new MediaInfoService();
    this.qualityScorer = new QualityScorerService();
    console.log('[EnhancedAnalyzerService] *** ENHANCED ANALYZER SERVICE CONSTRUCTED ***');
    console.log(`[EnhancedAnalyzerService] Using analyzer service: ${config.settings.dataSource}`);
  }

  /**
   * Simple test method to verify service is working
   */
  async testMethod(): Promise<string> {
    console.log('[EnhancedAnalyzerService] TEST METHOD CALLED');
    return 'Enhanced analyzer service is working!';
  }

  /**
   * Generate enhanced size analysis with quality metrics
   */
  async generateEnhancedSizeAnalysis(
    libraryId: string,
    limit: number = -1,
    offset: number = 0
  ): Promise<PaginatedEnhancedSizeAnalysis> {
    console.log(`=====================================`);
    console.log(`[EnhancedAnalyzerService] *** ENHANCED ANALYSIS CALLED ***`);
    console.log(`[EnhancedAnalyzerService] Library: ${libraryId}, Limit: ${limit}, Offset: ${offset}`);
    console.log(`=====================================`);
    
    // Get basic analysis from the configured analyzer service
    const basicAnalysis = await analyzerService.getSizeAnalysis(libraryId, limit, offset);
    console.log(`[EnhancedAnalyzerService] Basic analysis hasEpisodes: ${basicAnalysis.data.hasEpisodes}`);
    console.log(`[EnhancedAnalyzerService] Basic analysis files: ${basicAnalysis.data.largestFiles.length}`);
    console.log(`[EnhancedAnalyzerService] Episode breakdown files: ${basicAnalysis.data.episodeBreakdown?.length || 0}`);
    
    // Check what data we have
    console.log(`[EnhancedAnalyzerService] Data structure:`, {
      hasEpisodes: basicAnalysis.data.hasEpisodes,
      largestFiles: basicAnalysis.data.largestFiles.length,
      largestFilesType: basicAnalysis.data.largestFiles[0]?.type || 'none',
      episodeBreakdown: basicAnalysis.data.episodeBreakdown?.length || 0
    });
    
    // For TV shows, we should enhance the aggregated show data, not individual episodes
    // The basic analysis already provides the right structure
    const filesToEnhance = basicAnalysis.data.largestFiles;
    
    console.log(`[EnhancedAnalyzerService] Using ${filesToEnhance.length} files for enhancement`);
    
    // Apply limit to source files  
    const filesToProcess = limit === -1 ? filesToEnhance : filesToEnhance.slice(0, limit);
    console.log(`[EnhancedAnalyzerService] Processing ${filesToProcess.length} files after limit applied`);
    
    // Enhance files with technical details
    console.log(`[EnhancedAnalyzerService] Starting enhancement of files...`);
    const enhancedFiles = await Promise.all(
      filesToProcess.map(async (file, index) => {
        console.log(`[EnhancedAnalyzerService] Enhancing ${index + 1}/${filesToProcess.length}: ${file.title} (${file.type})`);
        return this.enrichMediaFile(file);
      })
    );
    console.log(`[EnhancedAnalyzerService] Completed enhancement of ${enhancedFiles.length} files`);
    
    // Also enhance episode breakdown if present
    let enhancedEpisodeBreakdown: EnhancedMediaFile[] | undefined;
    if (basicAnalysis.data.hasEpisodes && basicAnalysis.data.episodeBreakdown) {
      console.log(`[EnhancedAnalyzerService] Enhancing episode breakdown...`);
      enhancedEpisodeBreakdown = await Promise.all(
        basicAnalysis.data.episodeBreakdown.map(ep => this.enrichMediaFile(ep))
      );
    }

    // Generate quality insights
    const qualityDistribution = this.calculateQualityDistribution(enhancedFiles);
    const codecDistribution = this.calculateCodecDistribution(enhancedFiles);
    const technicalBreakdown = this.calculateTechnicalBreakdown(enhancedFiles);
    const upgradeRecommendations = this.generateUpgradeRecommendations(enhancedFiles);

    const enhancedAnalysis: EnhancedSizeAnalysis = {
      ...basicAnalysis.data,
      largestFiles: enhancedFiles,
      episodeBreakdown: enhancedEpisodeBreakdown,
      qualityDistribution,
      codecDistribution,
      technicalBreakdown,
      upgradeRecommendations
    };

    return {
      data: enhancedAnalysis,
      pagination: basicAnalysis.pagination
    };
  }

  /**
   * Enrich a media file with technical details and quality scoring
   */
  private async enrichMediaFile(file: MediaFile): Promise<EnhancedMediaFile> {
    console.log(`[EnhancedAnalyzerService] Enriching file: ${file.id} (${file.title}) - type: ${file.type}`);
    const cacheKey = `${this.ENHANCED_CACHE_PREFIX}${file.id}`;
    const cached = cache.get<EnhancedMediaFile>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Extract technical details from file path or MediaInfo
      const technicalDetails = await this.extractTechnicalDetails(file);
      // Use both filePath and title for source detection
      const sourceType = this.detectSourceType(file.filePath === 'Unknown' ? file.title : file.filePath);
      const releaseGroup = this.extractReleaseGroup(file.filePath === 'Unknown' ? file.title : file.filePath);
      
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
        encodingTool: this.extractEncodingTool(file.filePath === 'Unknown' ? file.title : file.filePath),
        
        // Quality scoring
        qualityScore: qualityData.totalScore,
        qualityTier: qualityData.tier,
        upgradeCandidate: qualityData.tier === QualityTier.POOR || qualityData.upgradeReasons.length > 2,
        upgradeReasons: qualityData.upgradeReasons,
        qualityComponents: qualityData.components
      };

      // Cache for 24 hours
      cache.set(cacheKey, enhancedFile, 24 * 60 * 60 * 1000);
      
      return enhancedFile;
    } catch (error) {
      console.error(`[EnhancedAnalyzerService] Failed to enrich file ${file.id}:`, error);
      
      // Return file with minimal enhancements
      return this.createFallbackEnhancedFile(file);
    }
  }

  /**
   * Extract technical details from file
   */
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

    // Fallback to file name parsing and existing Plex data
    return this.extractFromExistingData(file);
  }

  /**
   * Extract technical details from existing file data and filename
   */
  private extractFromExistingData(file: MediaFile): {
    video: VideoTechnicalDetails;
    audio: AudioTechnicalDetails;
    container: ContainerDetails;
  } {
    // Use title if filePath is Unknown or empty
    const fileName = (file.filePath && file.filePath !== 'Unknown') ? file.filePath : file.title;
    const resolution = this.parseResolution(file.resolution);
    
    return {
      video: {
        codec: file.codec || 'Unknown',
        profile: this.estimateProfile(file.codec, fileName),
        level: this.estimateLevel(resolution),
        bitDepth: this.extractBitDepthFromName(fileName),
        colorSpace: this.estimateColorSpace(fileName),
        colorRange: 'Limited',
        chromaSubsampling: '4:2:0',
        frameRate: this.estimateFrameRate(fileName),
        hdrFormat: this.extractHDRFromName(fileName),
        scanType: 'Progressive',
        bitrate: this.estimateVideoBitrate(resolution, file.codec),
        width: resolution.width,
        height: resolution.height
      },
      audio: {
        codec: this.estimateAudioCodec(fileName),
        channels: this.estimateChannels(fileName),
        channelLayout: this.getChannelLayout(this.estimateChannels(fileName)),
        sampleRate: 48000,
        bitDepth: 16,
        bitrate: this.estimateAudioBitrate(fileName)
      },
      container: {
        format: this.extractFormatFromName(fileName),
        size: file.fileSize,
        duration: this.estimateDuration(file.type),
        overallBitrate: this.calculateOverallBitrate(file.fileSize, this.estimateDuration(file.type))
      }
    };
  }

  // Helper methods for data extraction and estimation
  private parseResolution(resolution: string): { width: number; height: number } {
    if (resolution.includes('2160') || resolution.toLowerCase().includes('4k')) return { width: 3840, height: 2160 };
    if (resolution.includes('1080')) return { width: 1920, height: 1080 };
    if (resolution.includes('720')) return { width: 1280, height: 720 };
    if (resolution.includes('576')) return { width: 720, height: 576 };
    if (resolution.includes('480')) return { width: 720, height: 480 };
    return { width: 1920, height: 1080 }; // Default
  }

  private estimateProfile(codec: string, fileName: string): string {
    if (!codec) return 'Unknown';
    const codecLower = codec.toLowerCase();
    
    if (codecLower.includes('h.265') || codecLower.includes('hevc')) {
      if (/10.?bit|main.?10/i.test(fileName)) return 'Main 10';
      return 'Main';
    }
    if (codecLower.includes('h.264') || codecLower.includes('avc')) {
      if (/high/i.test(fileName)) return 'High';
      return 'Main';
    }
    return 'Main';
  }

  private estimateLevel(resolution: { width: number; height: number }): string {
    const pixels = resolution.width * resolution.height;
    if (pixels >= 3840 * 2160) return '5.1';
    if (pixels >= 1920 * 1080) return '4.0';
    if (pixels >= 1280 * 720) return '3.1';
    return '3.0';
  }

  private extractBitDepthFromName(fileName: string): number {
    if (/10.?bit|x265.*10|hevc.*10|main.?10/i.test(fileName)) return 10;
    if (/12.?bit/i.test(fileName)) return 12;
    return 8;
  }

  private estimateColorSpace(fileName: string): string {
    if (this.extractHDRFromName(fileName)) return 'Rec. 2020';
    return 'Rec. 709';
  }

  private estimateFrameRate(fileName: string): number {
    if (/60fps|60p/i.test(fileName)) return 60;
    if (/30fps|30p/i.test(fileName)) return 30;
    if (/25fps|25p/i.test(fileName)) return 25;
    if (/24fps|24p/i.test(fileName)) return 24;
    return 23.976; // Default for movies
  }

  private extractHDRFromName(fileName: string): string | undefined {
    if (/dolby.?vision|dv/i.test(fileName)) return 'Dolby Vision';
    if (/hdr10\+/i.test(fileName)) return 'HDR10+';
    if (/hdr10|hdr/i.test(fileName)) return 'HDR10';
    if (/hlg/i.test(fileName)) return 'HLG';
    return undefined;
  }

  private estimateVideoBitrate(resolution: { width: number; height: number }, codec: string): number {
    const pixels = resolution.width * resolution.height;
    let baseBitrate: number;
    
    if (pixels >= 3840 * 2160) baseBitrate = 15000;
    else if (pixels >= 1920 * 1080) baseBitrate = 8000;
    else if (pixels >= 1280 * 720) baseBitrate = 4000;
    else baseBitrate = 2000;
    
    // Adjust for codec efficiency
    if (codec?.toLowerCase().includes('h.265')) baseBitrate *= 0.6;
    else if (codec?.toLowerCase().includes('av1')) baseBitrate *= 0.5;
    
    return baseBitrate * 1000; // Convert to bps
  }

  private estimateAudioCodec(fileName: string): string {
    if (/truehd|atmos/i.test(fileName)) return 'TrueHD';
    if (/dts-hd|dts\.hd/i.test(fileName)) return 'DTS-HD';
    if (/dts/i.test(fileName)) return 'DTS';
    if (/e-ac3|eac3/i.test(fileName)) return 'E-AC3';
    if (/ac3/i.test(fileName)) return 'AC3';
    return 'AAC';
  }

  private estimateChannels(fileName: string): number {
    if (/7\.1|atmos/i.test(fileName)) return 8;
    if (/5\.1/i.test(fileName)) return 6;
    return 2;
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

  private estimateAudioBitrate(fileName: string): number {
    const codec = this.estimateAudioCodec(fileName);
    const bitrateMap: Record<string, number> = {
      'TrueHD': 3000,
      'DTS-HD': 1500,
      'DTS': 1509,
      'E-AC3': 640,
      'AC3': 448,
      'AAC': 128
    };
    return (bitrateMap[codec] || 128) * 1000; // Convert to bps
  }

  private extractFormatFromName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      'mkv': 'Matroska',
      'mp4': 'MP4',
      'avi': 'AVI',
      'mov': 'QuickTime'
    };
    return formatMap[ext || ''] || ext || 'Unknown';
  }

  private estimateDuration(type: string): number {
    // Rough estimate in seconds
    if (type === 'movie') return 7200; // 2 hours
    if (type === 'episode') return 2700; // 45 minutes
    return 3600; // 1 hour default
  }

  private calculateOverallBitrate(fileSize: number, duration: number): number {
    if (duration === 0) return 0;
    return (fileSize * 8) / duration; // bits per second
  }

  private detectSourceType(searchText: string): string {
    // Check text for source information (can be either file path or title)
    const searchString = searchText.toLowerCase();
    
    if (searchString.includes('remux')) return 'Blu-ray Remux';
    if (searchString.includes('bluray') || searchString.includes('blu-ray') || searchString.includes('bdrip') || searchString.includes('brrip')) return 'Blu-ray';
    if (searchString.includes('web-dl') || searchString.includes('webdl') || searchString.includes('web.dl')) return 'Web-DL';
    if (searchString.includes('webrip') || searchString.includes('web-rip') || searchString.includes('web.rip')) return 'WEB-RIP';
    if (searchString.includes('hdtv')) return 'HDTV';
    if (searchString.includes('dvdrip') || searchString.includes('dvd')) return 'DVD';
    if (searchString.includes('hdcam') || searchString.includes('cam')) return 'CAM';
    if (searchString.includes('screener') || searchString.includes('scr')) return 'Screener';
    
    // If no source type found, try to infer from quality indicators
    if (searchString.includes('4k') || searchString.includes('2160p')) return 'Digital';
    if (searchString.includes('1080p') || searchString.includes('720p')) return 'Digital';
    
    return 'Unknown';
  }

  private extractReleaseGroup(searchText: string): string | undefined {
    // Try various release group patterns
    // Pattern 1: [GROUP] at the end
    let match = searchText.match(/\[([^\]]+)\]$/);;
    if (match) return match[1];
    
    // Pattern 2: -GROUP at the end (common in scene releases)
    match = searchText.match(/-([A-Za-z0-9]+)(?:\.[^.]+)?$/);
    if (match && match[1].length >= 2 && match[1].length <= 10) {
      // Basic validation: release groups are typically 2-10 chars
      return match[1];
    }
    
    return undefined;
  }

  private extractEncodingTool(searchText: string): string {
    if (/x265/i.test(searchText)) return 'x265';
    if (/x264/i.test(searchText)) return 'x264';
    if (/av1/i.test(searchText)) return 'AV1';
    if (/vp9/i.test(searchText)) return 'VP9';
    if (/xvid/i.test(searchText)) return 'XviD';
    return 'Unknown';
  }

  private calculateBitrateEfficiency(fileSize: number, duration: number): number {
    if (duration === 0) return 0;
    const fileSizeMB = fileSize / (1024 * 1024);
    const durationHours = duration / 3600;
    return fileSizeMB / durationHours; // MB per hour
  }

  private createFallbackEnhancedFile(file: MediaFile): EnhancedMediaFile {
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

  private calculateTechnicalBreakdown(files: EnhancedMediaFile[]): TechnicalBreakdown {
    const hdrFormats: Record<string, number> = {};
    const bitDepths: Record<string, number> = {};
    const colorSpaces: Record<string, number> = {};
    
    let hdrCount = 0;

    files.forEach(file => {
      // HDR tracking
      if (file.hdrFormat) {
        hdrCount++;
        hdrFormats[file.hdrFormat] = (hdrFormats[file.hdrFormat] || 0) + 1;
      }
      
      // Bit depth tracking
      const depthKey = `${file.bitDepth}-bit`;
      bitDepths[depthKey] = (bitDepths[depthKey] || 0) + 1;
      
      // Color space tracking
      colorSpaces[file.colorSpace] = (colorSpaces[file.colorSpace] || 0) + 1;
    });

    return {
      hdrContent: {
        count: hdrCount,
        percentage: (hdrCount / files.length) * 100,
        formats: hdrFormats
      },
      bitDepthDistribution: bitDepths,
      colorSpaceDistribution: colorSpaces
    };
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

export const enhancedAnalyzerService = new EnhancedAnalyzerService();