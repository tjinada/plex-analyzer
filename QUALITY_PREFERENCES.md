# Quality Preferences Configuration

The Plex Analyzer now supports customizable quality preferences for different content types. This allows you to set preferred resolutions for movies vs TV shows and adjust quality scoring accordingly.

## Configuration

Add the following section to your `config.json` file:

```json
{
  "settings": {
    "qualityPreferences": {
      "movies": {
        "preferredResolution": "4K",
        "acceptableResolutions": ["4K", "1080p"]
      },
      "tvShows": {
        "preferredResolution": "1080p", 
        "acceptableResolutions": ["1080p", "720p"]
      }
    }
  }
}
```

## How It Works

### Resolution Scoring

The quality scoring system now adjusts resolution scores based on your preferences:

- **Perfect Match (25 points)**: File resolution matches your preferred resolution for that content type
- **Acceptable (20 points)**: File resolution is in your acceptable resolutions list
- **Fallback Scoring**: For non-preferred resolutions, traditional scoring applies with reduced points

### Content Type Detection

- **Movies**: Any content not identified as an episode
- **TV Episodes**: Content with `type: "episode"` in the media data

### Example Scenarios

**With TV Show Preference = 1080p:**
- 1080p TV episode: 25 points (perfect match)
- 720p TV episode: 20 points (acceptable) 
- 4K TV episode: 15 points (fallback - 4K but not preferred for TV)

**With Movie Preference = 4K:**
- 4K movie: 25 points (perfect match)
- 1080p movie: 20 points (acceptable)
- 720p movie: 8 points (fallback - not preferred for movies)

## Benefits

1. **Personalized Scoring**: Quality scores reflect your actual preferences
2. **Storage Optimization**: Higher scores for your preferred formats
3. **Content Type Awareness**: Different standards for movies vs TV shows
4. **Upgrade Guidance**: Better recommendations based on your goals

## Default Values

If no preferences are configured:
- Movies: Prefers 4K, accepts 4K and 1080p
- TV Shows: Prefers 1080p, accepts 1080p and 720p