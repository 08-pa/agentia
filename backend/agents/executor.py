from groq import Groq
from tavily import TavilyClient

from core.config import settings

SYSTEM_PROMPT = """You are a research executor agent. You're given a \
subtopic and a set of web search results about it. Write a concise, \
factual finding (3-5 sentences) that summarizes what the sources say. \
Stick to what the sources actually support - do not add outside \
knowledge or speculation. Do not include a sources list; that's added \
separately."""


class ExecutorAgent:
    def __init__(self):
        self.groq = Groq(api_key=settings.GROQ_API_KEY)
        self.tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)

    def research_subtopic(self, subtopic: str) -> dict:
        search = self.tavily.search(
            query=subtopic,
            search_depth="advanced",
            max_results=5,
        )
        results = search.get("results", [])

        if not results:
            return {"subtopic": subtopic, "content": "No sources found for this subtopic.", "sources": []}

        context = "\n\n".join(
            f"[{i + 1}] {r.get('title', '')}\n{r.get('content', '')}" for i, r in enumerate(results)
        )

        response = self.groq.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Subtopic: {subtopic}\n\nSources:\n{context}"},
            ],
            temperature=0.2,
            max_tokens=350,
        )
        finding = response.choices[0].message.content.strip()

        sources = [
            {"title": r.get("title", ""), "url": r.get("url", "")}
            for r in results
            if r.get("url")
        ]

        return {"subtopic": subtopic, "content": finding, "sources": sources}
