import os
import json
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from backend import schemas
from backend.auth import get_current_user, User
from backend.utils import logger

router = APIRouter(tags=["gemini"])

@router.post("/api/gemini/insight")
async def generate_gemini_insight(request: schemas.GeminiInsightRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on backend.")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash') # Updated to latest flash model

        prompt = f"""
        Analyze the following weekly GitHub stats for an AutoGitGrow user.
        - Followers Gained: {request.stats.followersGained}
        - Follow-backs Received: {request.stats.followBacks}
        - Users Unfollowed: {request.stats.unfollowed}
        - New Stargazers: {request.stats.stargazers}
        - Reciprocity Rate: {request.stats.reciprocityRate}%

        Here is the follower growth data for the past week:
        {chr(10).join([f"- {d.name}: {d.followers}" for d in request.growthData])}

        Based on these stats and the growth trend, provide a structured analysis in JSON format.
        The JSON object must have the following keys:
        - "summary": A concise, encouraging, and friendly summary (2-3 sentences max). Start with a friendly greeting. End with a single, relevant emoji.
        - "suggestions": An array of 2 actionable suggestions strings for how the user could improve their GitHub presence or networking.

        Do not include any markdown formatting (like ```json). Just return the raw JSON string.
        """

        response = model.generate_content(prompt)
        # Clean up potential markdown code blocks if Gemini adds them despite instructions
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        try:
            data = json.loads(text)
            return data
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {"summary": response.text, "suggestions": []}

    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@router.post("/api/gemini/analyze-user", response_model=schemas.UserAnalysisResponse)
async def analyze_user(request: schemas.UserAnalysisRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on backend.")

    target_interests = os.getenv("TARGET_INTERESTS", "Python, AI, Automation, Web Development, Data Science")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""
        Analyze the following GitHub user profile to determine if they are relevant to my interests: {target_interests}.

        Username: {request.username}
        Bio: {request.bio or "N/A"}
        Readme Content: {request.readme_content or "N/A"}
        Recent Activity: {request.recent_activity or "N/A"}

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
        return schemas.UserAnalysisResponse(
            username=request.username,
            is_relevant=data.get("is_relevant", False),
            reason=data.get("reason", "No reason provided"),
            confidence_score=data.get("confidence_score", 0.0)
        )

    except Exception as e:
        logger.error(f"Gemini Analysis Error: {e}")
        # Fail safe: assume relevant if AI fails, or handle as needed.
        return schemas.UserAnalysisResponse(
            username=request.username,
            is_relevant=True, # Default to True to not block growth if AI fails
            reason="AI analysis failed, defaulting to relevant.",
            confidence_score=0.0
        )
