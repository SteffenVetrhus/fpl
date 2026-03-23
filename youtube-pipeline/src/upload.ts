import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "./config.js";

/**
 * Upload a generated video to YouTube using the YouTube Data API v3.
 *
 * Prerequisites:
 * 1. Create a Google Cloud project and enable YouTube Data API v3
 * 2. Create OAuth2 credentials (Desktop app type)
 * 3. Authorize and get a refresh token
 * 4. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN in .env
 *
 * Setup guide: https://developers.google.com/youtube/v3/guides/uploading_a_video
 */

interface UploadMetadata {
  title: string;
  description: string;
  tags: string[];
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh YouTube token: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function uploadVideo(
  accessToken: string,
  videoPath: string,
  metadata: UploadMetadata
): Promise<string> {
  const videoData = await readFile(videoPath);

  // Step 1: Initiate resumable upload
  const initResponse = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": videoData.length.toString(),
      },
      body: JSON.stringify({
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: "17", // Sports
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: "private", // Start as private, manually publish
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`YouTube upload init failed (${initResponse.status}): ${error}`);
  }

  const uploadUrl = initResponse.headers.get("location");
  if (!uploadUrl) {
    throw new Error("No upload URL returned from YouTube API");
  }

  // Step 2: Upload the video data
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": videoData.length.toString(),
    },
    body: videoData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`YouTube upload failed (${uploadResponse.status}): ${error}`);
  }

  const result = (await uploadResponse.json()) as { id: string };
  return result.id;
}

async function main() {
  const config = loadConfig();
  const { youtube } = config;

  if (!youtube.clientId || !youtube.clientSecret || !youtube.refreshToken) {
    console.error("YouTube credentials not configured. Set these in .env:");
    console.error("  YOUTUBE_CLIENT_ID");
    console.error("  YOUTUBE_CLIENT_SECRET");
    console.error("  YOUTUBE_REFRESH_TOKEN");
    process.exit(1);
  }

  const outputDir = join(config.outputDir, `${config.videoType}-gw${config.gameweek}`);

  // Read metadata
  const metadataRaw = await readFile(join(outputDir, "metadata.json"), "utf-8");
  const metadata = JSON.parse(metadataRaw) as UploadMetadata;

  // Check for video file
  const videoPath = join(outputDir, "video.mp4");

  console.log(`Uploading: ${metadata.title}`);
  console.log(`Video: ${videoPath}`);

  const accessToken = await getAccessToken(
    youtube.clientId,
    youtube.clientSecret,
    youtube.refreshToken
  );

  const videoId = await uploadVideo(accessToken, videoPath, metadata);

  console.log(`Upload complete!`);
  console.log(`Video ID: ${videoId}`);
  console.log(`URL: https://www.youtube.com/watch?v=${videoId}`);
  console.log(`Status: Private (review and publish manually)`);
}

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
