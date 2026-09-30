import asyncio
import hashlib

from agents.planner import PlannerAgent
from agents.executor import ExecutorAgent
from agents.synthesizer import SynthesizerAgent
from core.redis_client import cache_get, cache_set
from core.config import settings


def _cache_key(query: str) -> str:
    normalized = query.strip().lower()
    return "research:" + hashlib.sha256(normalized.encode()).hexdigest()


class ResearchWorkflow:
    def __init__(self):
        self.planner = PlannerAgent()
        self.executor = ExecutorAgent()
        self.synthesizer = SynthesizerAgent()

    async def run(self, query: str) -> dict:
        """Run the complete research workflow (Plan -> Gather -> Synthesize),
        serving from Redis when the same question has been asked before."""

        cache_key = _cache_key(query)
        cached = await cache_get(cache_key)
        if cached:
            return {**cached, "cached": True}

        # The Groq/Tavily SDKs are synchronous, so each stage runs in a
        # worker thread to keep the FastAPI event loop free.
        subtopics = await asyncio.to_thread(self.planner.plan, query)

        findings = []
        for subtopic in subtopics:
            result = await asyncio.to_thread(self.executor.research_subtopic, subtopic)
            findings.append(result)

        report = await asyncio.to_thread(self.synthesizer.synthesize, query, findings)

        result = {
            "query": query,
            "subtopics": subtopics,
            "findings": findings,
            "report": report,
        }

        await cache_set(cache_key, result, settings.RESEARCH_CACHE_TTL)
        return {**result, "cached": False}


# Manual smoke test
if __name__ == "__main__":
    workflow = ResearchWorkflow()
    result = asyncio.run(workflow.run("What are the latest developments in quantum computing?"))
    print(result["report"])
