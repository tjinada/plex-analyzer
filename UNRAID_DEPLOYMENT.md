# Unraid Deployment Guide for Plex Analyzer

This guide will help you deploy Plex Analyzer on your Unraid server using a custom Docker template.

## Prerequisites

1. Docker enabled on your Unraid server
2. Access to Unraid's web interface
3. Basic understanding of Docker containers in Unraid

## Option 1: Build and Deploy Locally

### Step 1: Build the Docker Image

1. SSH into your Unraid server
2. Clone the repository:
   ```bash
   cd /mnt/user/appdata
   git clone https://github.com/yourusername/plex-analyzer.git
   cd plex-analyzer
   ```

3. Build the Docker image:
   ```bash
   docker build -t plex-analyzer:latest .
   ```

### Step 2: Import the Template

1. Copy the template to Unraid's template directory:
   ```bash
   cp unraid-template.xml /boot/config/plugins/dockerMan/templates-user/my-PlexAnalyzer.xml
   ```

2. In Unraid's web interface, go to **Docker** tab
3. Click **Add Container**
4. Select **PlexAnalyzer** from the template dropdown

### Step 3: Configure the Container

1. Adjust the following settings as needed:
   - **Name**: PlexAnalyzer (or your preferred name)
   - **Repository**: plex-analyzer:latest
   - **Web UI Port**: 3000 (or any available port)
   - **Config Directory**: /mnt/user/appdata/plex-analyzer
   - **Plex URL**: Your Plex server URL (optional, can configure later)
   - **Plex Token**: Your Plex token (optional, can configure later)

2. Click **Apply** to create and start the container

## Option 2: Using Docker Hub (if you push to a registry)

### Step 1: Push to Docker Hub (on your development machine)

```bash
# Build the image
docker build -t yourusername/plex-analyzer:latest .

# Push to Docker Hub
docker login
docker push yourusername/plex-analyzer:latest
```

### Step 2: Create Custom Template in Unraid

1. In Unraid's web interface, go to **Docker** tab
2. Click **Add Container**
3. Fill in the following:

   **Basic Settings:**
   - Name: PlexAnalyzer
   - Repository: yourusername/plex-analyzer:latest
   - Network Type: bridge
   - Console shell command: Shell

   **Port Mappings:**
   - Container Port: 3000
   - Host Port: 3000 (or your preferred port)

   **Path Mappings:**
   - Container Path: /config
   - Host Path: /mnt/user/appdata/plex-analyzer

   **Variables (optional):**
   - NODE_ENV = production
   - PLEX_URL = http://your-plex-ip:32400
   - PLEX_TOKEN = your-plex-token

4. Click **Apply**

## Option 3: Manual Template Import

1. Save the `unraid-template.xml` file to your computer
2. In Unraid, navigate to `/boot/config/plugins/dockerMan/templates-user/`
3. Upload the XML file with a unique name (e.g., `my-PlexAnalyzer.xml`)
4. Restart the Docker service or reboot Unraid
5. The template will appear in the "User templates" section when adding a container

## Post-Installation

1. Access the web interface at `http://your-unraid-ip:3000`
2. Complete the setup wizard to configure:
   - Plex connection
   - Tautulli integration (optional)
   - Radarr/Sonarr integration (optional)
3. The configuration will be saved to `/mnt/user/appdata/plex-analyzer/config.json`

## Docker Compose Alternative

If you prefer using docker-compose, create this file in `/mnt/user/appdata/plex-analyzer/docker-compose.yml`:

```yaml
version: '3.8'

services:
  plex-analyzer:
    image: plex-analyzer:latest
    container_name: PlexAnalyzer
    ports:
      - "3000:3000"
    volumes:
      - /mnt/user/appdata/plex-analyzer:/config
    environment:
      - NODE_ENV=production
      - PLEX_URL=http://192.168.1.100:32400  # Optional
      - PLEX_TOKEN=your-token-here           # Optional
    restart: unless-stopped
```

Then run:
```bash
cd /mnt/user/appdata/plex-analyzer
docker-compose up -d
```

## Updating the Container

To update the container with new changes:

1. Stop the container
2. Pull or rebuild the latest image
3. Remove the old container
4. Create a new container with the same settings

Or if using docker-compose:
```bash
docker-compose pull
docker-compose up -d
```

## Troubleshooting

1. **Container won't start**: Check the logs in Unraid's Docker tab
2. **Can't access web UI**: Ensure the port isn't already in use
3. **Configuration not saving**: Check permissions on `/mnt/user/appdata/plex-analyzer`
4. **Can't connect to Plex**: Ensure Plex URL is accessible from the Docker network

## Security Notes

- The Plex token is sensitive - use Unraid's password mask feature
- Consider using a reverse proxy for external access
- The config.json file contains all your service credentials

## Backup

Important files to backup:
- `/mnt/user/appdata/plex-analyzer/config.json` - Your configuration
- The Docker template XML file if you've customized it