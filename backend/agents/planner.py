from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

class PlannerAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    def plan(self, query: str) -> list:
        """Generate subtopics from a research question"""
        print(f"📝 Planning research for: {query}")

        prompt = f"""You are a research planner. Break down the following query into 3-5 specific subtopics.

Query: {query}

Return ONLY a numbered list. Example:
1. History and evolution
2. Current technology
3. Major players
4. Applications
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research planner. Return ONLY a numbered list of subtopics."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )

            content = response.choices[0].message.content

            subtopics = []
            for line in content.strip().split('\n'):
                line = line.strip()
                if line and any(line.startswith(f"{i}.") for i in range(1, 10)):
                    subtopic = line[3:].strip()
                    subtopics.append(subtopic)

            print(f"✅ Generated {len(subtopics)} subtopics")
            return subtopics[:5]

        except Exception as e:
            print(f"❌ Error: {e}")
            return []