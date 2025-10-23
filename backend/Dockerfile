FROM python:3.10-slim-buster AS builder
WORKDIR /app/backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.10-slim-buster
WORKDIR /app/backend
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY . .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl --fail http://localhost:8000/ || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]