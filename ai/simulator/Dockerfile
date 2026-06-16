FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /workspace/ai

COPY ai/simulator/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY ai/simulator /workspace/ai/simulator
COPY ai/outputs /workspace/ai/outputs
COPY ai/models /workspace/ai/models

ENV PROJECT_ROOT=/workspace
EXPOSE 8000

CMD ["uvicorn", "simulator.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
