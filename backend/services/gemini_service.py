import os
import json
import google.generativeai as genai
from backend.utils import logger
import backend.schemas as schemas

def analyze_user_profile(username: str, bio: str, readme_content: str = None, recent_activity: str = None) -> dict:
    """
    Analyzes a GitHub user profile using Gemini to determine relevance.
    Returns a dictionary with 'is_relevant', 'reason', and 'confidence_score'.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured.")
        return {"is_relevant": True, "reason": "Gemini API key missing, defaulting to relevant", "confidence_score": 0.5}

    target_interests = os.getenv("TARGET_INTERESTS", "Python, AI, Automation, Web Development, Data Science")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""
        Analyze the following GitHub user profile to determine if they are relevant to my interests: {target_interests}.

        Username: {username}
        Bio: {bio or "N/A"}
        Readme Content: {readme_content or "N/A"}
        Recent Activity: {recent_activity or "N/A"}

        Task:
        1. Determine if this user is likely to be interested in similar topics or is a good candidate for networking in the fields of {target_interests}.
        2. Provide a confidence score (0.0 to 1.0).
        3. Provide a brief reason.

        Return ONLY a JSON object with the following keys:
        - "is_relevant": boolean
        - "reason": string (max 1 sentence)
        - "confidence_score": float

        Do not include markdown formatting.
        """

        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        data = json.loads(text)
        return {
            "is_relevant": data.get("is_relevant", False),
            "reason": data.get("reason", "No reason provided"),
            "confidence_score": data.get("confidence_score", 0.0)
        }

    except Exception as e:
        logger.error(f"Gemini Analysis Error for {username}: {e}")
        # Default to True to avoid blocking growth on AI errors, but log it.
        return {"is_relevant": True, "reason": f"Analysis failed: {str(e)}", "confidence_score": 0.0}
