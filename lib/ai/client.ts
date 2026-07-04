import Anthropic from "@anthropic-ai/sdk";

// Server-side only — never import from a client component. The Claude API
// key must not reach the browser.

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateDraft(
  system: string,
  prompt: string,
): Promise<{ text: string } | { error: string }> {
  if (!isAiConfigured()) {
    return {
      error:
        "AI tools aren't set up on this server yet. Add an ANTHROPIC_API_KEY to enable them.",
    };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return {
        error:
          "The AI declined to draft this. Try rewording your claim details and generating again.",
      };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      return { error: "The AI didn't return a usable draft. Please try again." };
    }
    return { text };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { error: "The AI service key isn't valid. Check the server configuration." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { error: "The AI service is busy right now. Try again in a minute." };
    }
    if (error instanceof Anthropic.APIError) {
      return { error: "The AI service had a problem. Please try again." };
    }
    return { error: "Something went wrong generating the draft. Please try again." };
  }
}
