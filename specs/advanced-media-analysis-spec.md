# Advanced Media Analysis Specification

## Overview

This specification outlines the implementation of advanced media analysis features including video technical details, quality & encoding metrics, and intelligent quality scoring for the Plex Analyzer application.

## Scope

### Phase 1: Enhanced Media Analysis
- **Video Technical Details**: Bit depth, color space, HDR, profiles, frame rates
- **Quality & Encoding Metrics**: Bitrate analysis, source type detection, encoding quality
- **Quality Scoring System**: Intelligent quality rating and upgrade recommendations

### Out of Scope (Future Phases)
- Audio analysis (channels, formats, languages)
- Advanced analytics (viewing patterns, comparative analysis)
- Collection management features

## Technical Requirements

### 1. Data Source Integration

#### 1.1 Plex Media Information Enhancement
```typescript
interface EnhancedMediaItem extends MediaItem {
  // Enhanced video properties
  videoProfile?: string;          // H.264 Main, H.265 Main 10, AV1 Main
  videoBitDepth?: number;         // 8, 10, 12
  colorSpace?: string;            // Rec. 709, Rec. 2020, DCI-P3
  colorRange?: string;            // Limited, Full
  chromaSubsampling?: string;     // 4:2:0, 4:2:2, 4:4:4
  frameRate?: number;             // 23.976, 24, 25, 29.97, 30, 60
  hdrFormat?: string;             // HDR10, HDR10+, Dolby Vision, HLG
  scanType?: string;              // Progressive, Interlaced
  
  // Encoding metrics
  videoBitrate?: number;          // kbps
  audioBitrate?: number;          // kbps
  overallBitrate?: number;        // kbps
  sourceType?: string;            // Web-DL, Blu-ray, HDTV, WEB-RIP
  releaseGroup?: string;          // Scene/P2P group
  encodingTool?: string;          // x264, x265, ffmpeg
  
  // Quality metrics
  qualityScore?: number;          // 0-100 calculated score
  qualityTier?: string;           // Excellent, Good, Fair, Poor
  upgradeCandidate?: boolean;     // Recommendation flag
}
```

#### 1.2 MediaFile Interface Enhancement
```typescript
interface EnhancedMediaFile extends MediaFile {
  // Video technical details
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
  bitrateEfficiency: number;      // Quality per MB ratio
  sourceType: string;
  releaseGroup?: string;
  encodingTool: string;
  
  // Quality scoring
  qualityScore: number;
  qualityTier: QualityTier;
  upgradeCandidate: boolean;
  upgradeReasons: string[];
}

enum QualityTier {
  EXCELLENT = 'Excellent',
  GOOD = 'Good', 
  FAIR = 'Fair',
  POOR = 'Poor'
}
```

### 2. Data Extraction Strategy

#### 2.1 Plex API Enhancement
- **Primary Source**: Plex Media.Part.Stream objects
- **Secondary Source**: File name parsing for missing metadata
- **Fallback**: MediaInfo library integration for comprehensive analysis

#### 2.2 MediaInfo Integration
```typescript
interface MediaInfoService {
  analyzeFile(filePath: string): Promise<DetailedMediaInfo>;
  extractVideoDetails(filePath: string): Promise<VideoTechnicalDetails>;
  calculateQualityMetrics(filePath: string): Promise<QualityMetrics>;
}

interface DetailedMediaInfo {
  video: {
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
  };
  audio: {
    codec: string;
    channels: number;
    sampleRate: number;
    bitDepth: number;
    bitrate: number;
  };
  container: {
    format: string;
    size: number;
    duration: number;
  };
}
```

### 3. Quality Scoring Algorithm

#### 3.1 Scoring Components
```typescript
interface QualityScoreComponents {
  resolutionScore: number;        // 0-25 points
  codecScore: number;             // 0-20 points
  bitrateScore: number;           // 0-20 points
  sourceScore: number;            // 0-15 points
  technicalScore: number;         // 0-20 points (HDR, bit depth, etc.)
}

interface QualityScoreWeights {
  resolution: number;             // Weight by content type
  codec: number;
  bitrate: number;
  source: number;
  technical: number;
}
```

#### 3.2 Scoring Logic
```typescript
class QualityScorer {
  calculateResolutionScore(width: number, height: number): number;
  calculateCodecScore(codec: string, profile: string): number;
  calculateBitrateScore(bitrate: number, resolution: string, codec: string): number;
  calculateSourceScore(sourceType: string): number;
  calculateTechnicalScore(details: VideoTechnicalDetails): number;
  
  calculateOverallScore(components: QualityScoreComponents, weights: QualityScoreWeights): number;
  determineQualityTier(score: number): QualityTier;
  generateUpgradeRecommendations(file: EnhancedMediaFile): string[];
}
```

#### 3.3 Scoring Reference Tables

**Resolution Scoring**:
- 4K UHD (3840x2160): 25 points
- 4K DCI (4096x2160): 25 points  
- 1080p (1920x1080): 20 points
- 720p (1280x720): 15 points
- 576p (720x576): 10 points
- 480p (720x480): 5 points
- < 480p: 0 points

**Codec Scoring**:
- AV1: 20 points
- H.265/HEVC: 18 points
- VP9: 16 points
- H.264/AVC: 14 points
- MPEG-4: 8 points
- MPEG-2: 4 points
- Older codecs: 0 points

**Source Type Scoring**:
- Blu-ray Remux: 15 points
- Blu-ray Encode: 13 points
- Web-DL: 12 points
- WEB-RIP: 10 points
- HDTV: 8 points
- DVD: 5 points
- Unknown: 0 points

### 4. Backend Implementation

#### 4.1 Enhanced Analyzer Service
```typescript
class EnhancedAnalyzerService extends AnalyzerService {
  private mediaInfoService: MediaInfoService;
  private qualityScorer: QualityScorer;
  
  async generateEnhancedSizeAnalysis(items: MediaItem[]): Promise<EnhancedSizeAnalysis>;
  async enrichMediaFile(item: MediaItem): Promise<EnhancedMediaFile>;
  async analyzeQualityMetrics(libraryId: string): Promise<QualityAnalysisReport>;
}

interface EnhancedSizeAnalysis extends SizeAnalysis {
  qualityDistribution: QualityDistribution;
  codecDistribution: CodecDistribution;
  technicalBreakdown: TechnicalBreakdown;
  upgradeRecommendations: UpgradeRecommendation[];
}

interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface CodecDistribution {
  [codec: string]: {
    count: number;
    totalSize: number;
    averageQuality: number;
    percentage: number;
  };
}

interface TechnicalBreakdown {
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

interface UpgradeRecommendation {
  fileId: string;
  title: string;
  currentQuality: QualityTier;
  recommendedUpgrade: string;
  reasons: string[];
  potentialSavings?: number;
}
```

#### 4.2 API Endpoints Extension
```typescript
// New endpoints
GET /analyzer/library/:id/quality-metrics
GET /analyzer/library/:id/technical-analysis  
GET /analyzer/library/:id/upgrade-recommendations
GET /analyzer/file/:id/detailed-analysis

// Enhanced existing endpoints
GET /analyzer/library/:id/size    // Now includes quality data
GET /analyzer/library/:id/quality // Enhanced with technical details
```

### 5. Frontend Implementation

#### 5.1 Enhanced Size Analysis Component
```typescript
interface EnhancedSizeAnalysisComponent {
  // New view options
  viewMode: 'basic' | 'technical' | 'quality';
  
  // Quality filtering
  qualityFilter: QualityTier | 'all';
  codecFilter: string | 'all';
  hdrFilter: boolean | null;
  
  // Display methods
  showTechnicalDetails(): void;
  showQualityBreakdown(): void;
  filterByQuality(tier: QualityTier): void;
  showUpgradeRecommendations(): void;
}
```

#### 5.2 Technical Details Display
```html
<!-- Enhanced table columns -->
<ng-container matColumnDef="technical">
  <th mat-header-cell *matHeaderCellDef>Technical</th>
  <td mat-cell *matCellDef="let file">
    <div class="technical-info">
      <span class="codec-badge" [class]="'codec-' + file.codec.toLowerCase()">
        {{ file.videoProfile }}
      </span>
      <span class="bit-depth-badge" [class]="'depth-' + file.bitDepth">
        {{ file.bitDepth }}-bit
      </span>
      <span *ngIf="file.hdrFormat" class="hdr-badge">
        {{ file.hdrFormat }}
      </span>
    </div>
  </td>
</ng-container>

<ng-container matColumnDef="quality">
  <th mat-header-cell *matHeaderCellDef>Quality</th>
  <td mat-cell *matCellDef="let file">
    <div class="quality-info">
      <div class="quality-score" [class]="'tier-' + file.qualityTier.toLowerCase()">
        {{ file.qualityScore }}/100
      </div>
      <div class="quality-tier">{{ file.qualityTier }}</div>
      <mat-icon *ngIf="file.upgradeCandidate" class="upgrade-icon" 
                matTooltip="Upgrade recommended">
        trending_up
      </mat-icon>
    </div>
  </td>
</ng-container>
```

#### 5.3 Quality Dashboard
```typescript
interface QualityDashboard {
  // Overview cards
  qualityOverview: QualityDistribution;
  codecBreakdown: CodecDistribution;
  technicalSummary: TechnicalBreakdown;
  
  // Interactive features
  upgradeRecommendations: UpgradeRecommendation[];
  qualityTrends: QualityTrend[];
  optimizationOpportunities: OptimizationSuggestion[];
}
```

### 6. Database Schema Updates

#### 6.1 MediaFile Table Enhancement
```sql
-- Add new columns for technical analysis
ALTER TABLE media_files ADD COLUMN video_profile VARCHAR(50);
ALTER TABLE media_files ADD COLUMN bit_depth INTEGER;
ALTER TABLE media_files ADD COLUMN color_space VARCHAR(50);
ALTER TABLE media_files ADD COLUMN color_range VARCHAR(20);
ALTER TABLE media_files ADD COLUMN chroma_subsampling VARCHAR(10);
ALTER TABLE media_files ADD COLUMN frame_rate DECIMAL(8,3);
ALTER TABLE media_files ADD COLUMN hdr_format VARCHAR(50);
ALTER TABLE media_files ADD COLUMN scan_type VARCHAR(20);
ALTER TABLE media_files ADD COLUMN video_bitrate INTEGER;
ALTER TABLE media_files ADD COLUMN audio_bitrate INTEGER;
ALTER TABLE media_files ADD COLUMN overall_bitrate INTEGER;
ALTER TABLE media_files ADD COLUMN source_type VARCHAR(50);
ALTER TABLE media_files ADD COLUMN release_group VARCHAR(100);
ALTER TABLE media_files ADD COLUMN encoding_tool VARCHAR(100);
ALTER TABLE media_files ADD COLUMN quality_score INTEGER;
ALTER TABLE media_files ADD COLUMN quality_tier VARCHAR(20);
ALTER TABLE media_files ADD COLUMN upgrade_candidate BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX idx_media_files_quality_score ON media_files(quality_score);
CREATE INDEX idx_media_files_quality_tier ON media_files(quality_tier);
CREATE INDEX idx_media_files_codec_profile ON media_files(codec, video_profile);
CREATE INDEX idx_media_files_hdr ON media_files(hdr_format) WHERE hdr_format IS NOT NULL;
```

### 7. Implementation Phases

#### Phase 1: Foundation (Week 1-2)
1. **Backend Infrastructure**
   - MediaInfo service integration
   - Enhanced data models
   - Basic quality scoring algorithm
   - Database schema updates

2. **Data Extraction**
   - Plex API enhancement for technical details
   - File name parsing fallbacks
   - Comprehensive media analysis pipeline

#### Phase 2: Quality Scoring (Week 3)
1. **Scoring Algorithm**
   - Implement quality scoring components
   - Create reference tables and weights
   - Develop upgrade recommendation engine
   - Add quality tier classification

2. **Backend Services**
   - Enhanced analyzer service methods
   - New API endpoints for quality data
   - Caching strategy for expensive operations

#### Phase 3: Frontend Enhancement (Week 4)
1. **UI Components**
   - Enhanced size analysis component
   - Technical details display
   - Quality filtering and sorting
   - Upgrade recommendations view

2. **User Experience**
   - Visual quality indicators
   - Interactive quality dashboard
   - Export functionality for technical data

### 8. Performance Considerations

#### 8.1 Caching Strategy
- **Technical Analysis Cache**: 24-hour TTL for file technical details
- **Quality Scores Cache**: Updated when file changes detected
- **Progressive Loading**: Load basic data first, enhance with technical details

#### 8.2 Optimization Techniques
- **Batch Processing**: Analyze multiple files in parallel
- **Lazy Loading**: Load technical details on demand
- **Smart Refresh**: Only re-analyze changed files

### 9. Error Handling & Fallbacks

#### 9.1 Data Availability
- **Graceful Degradation**: Show available data when technical details missing
- **Progressive Enhancement**: Basic functionality works without MediaInfo
- **Fallback Parsing**: Extract what's possible from file names/paths

#### 9.2 Performance Safeguards
- **Timeout Limits**: MediaInfo analysis limited to 30 seconds per file
- **Memory Management**: Process large libraries in batches
- **Error Recovery**: Continue analysis even if individual files fail

### 10. Testing Strategy

#### 10.1 Test Data Requirements
- **Diverse Content**: Various codecs, resolutions, sources
- **Edge Cases**: Corrupt files, missing metadata, unusual formats
- **Performance Testing**: Large libraries (10,000+ files)

#### 10.2 Quality Validation
- **Manual Verification**: Spot-check quality scores against known content
- **Comparative Analysis**: Ensure scoring consistency across similar content
- **User Feedback Integration**: Mechanism to report scoring inaccuracies

## Success Metrics

1. **Technical Accuracy**: >95% correct technical detail extraction
2. **Quality Scoring**: User satisfaction with upgrade recommendations
3. **Performance**: <5 second analysis for libraries under 1000 items
4. **Adoption**: >80% of users engage with quality features within 30 days

## Future Enhancements

1. **Audio Analysis**: Surround sound, lossless formats, language tracks
2. **Machine Learning**: AI-powered quality scoring refinement
3. **Integration**: Sonarr/Radarr upgrade automation
4. **Analytics**: Quality trends over time, library optimization insights

---

*This specification provides the foundation for implementing comprehensive media quality analysis while maintaining performance and user experience standards.*