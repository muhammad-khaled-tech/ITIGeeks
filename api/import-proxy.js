export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Validate Host
    const targetUrl = new URL(url);
    if (!targetUrl.hostname.includes("leetcode.com")) {
      return res
        .status(400)
        .json({ error: "Only LeetCode URLs are supported" });
    }

    // Fetch Page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();

    // Extract Title
    let title = "Imported List";
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace("- LeetCode", "").trim();
    }

    // Extract Problems
    // Pattern: matches href="/problems/slug/" or href="/problems/slug"
    const problemRegex = /href="\/problems\/([a-z0-9-]+)\/?"/gi;
    const slugs = new Set();
    let match;

    while ((match = problemRegex.exec(html)) !== null) {
      if (match[1]) {
        slugs.add(match[1]);
      }
    }

    res.status(200).json({
      success: true,
      title,
      slugs: Array.from(slugs),
      count: slugs.size,
    });
  } catch (error) {
    console.error("Import Proxy Error:", error);
    res.status(500).json({
      error: "Failed to import from URL",
      message:
        "The URL could not be processed. It might be private or protected by Cloudflare.",
      details: error.message,
    });
  }
}
