export async function analyzeCompliance(
  videoBase64?: string,
  caption?: string,
  script?: string
) {
  const response = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: JSON.stringify({
        videoBase64,
        caption,
        script,
      }),
    }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
}

export async function testCaptionOnly(caption: string) {
  const response = await fetch("/.netlify/functions/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: caption,
    }),
  });

  if (!response.ok) {
    throw new Error("Caption test failed");
  }

  return response.json();
}
