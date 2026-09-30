from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

class SynthesizerAgent:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    def synthesize(self, query: str, findings: list) -> str:
        """Combine research findings into a comprehensive report"""

        # Format findings
        findings_text = ""
        for i, finding in enumerate(findings, 1):
            findings_text += f"\n## Subtopic {i}: {finding.get('subtopic', 'Unknown')}\n"
            for result in finding.get('results', []):
                findings_text += f"\n- **{result.get('title', '')}**\n"
                findings_text += f"  {result.get('content', '')[:200]}...\n"
                findings_text += f"  Source: {result.get('url', '')}\n"

        prompt = f"""You are a research synthesizer. Create a comprehensive research report.

Original Query: {query}

Research Findings:
{findings_text}

Write a well-structured report with:
1. Introduction
2. Key findings organized by subtopic
3. Conclusion
4. Sources and references

Use Markdown formatting.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional research synthesizer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3000
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"❌ Error synthesizing report: {e}"