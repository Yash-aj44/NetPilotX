import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq, RateLimitError, APIStatusError


# Load backend/.env explicitly
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)


api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is not configured in backend/.env")


client = Groq(api_key=api_key)


def ask_groq(message: str) -> str:
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "user",
                    "content": message,
                }
            ],
        )

        return response.choices[0].message.content or "No response generated."

    except RateLimitError:
        return (
            "NetPilot X AI is temporarily unavailable because the Groq "
            "daily token limit has been reached. Please try again after "
            "the rate limit resets."
        )

    except APIStatusError as e:
        return (
            f"NetPilot X AI is temporarily unavailable. "
            f"Groq returned an API error: {e}"
        )

    except Exception as e:
        return (
            f"NetPilot X AI encountered an unexpected error: {e}"
        )